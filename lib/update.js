import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { dshHome } from './skills.js'

export const UPDATE_BUNDLE = 'dsh-capability-switch'
const UPDATE_REGISTRY_PACKAGE = UPDATE_BUNDLE + '@'
const INITIAL_DELAY = 45_000
const CHECK_INTERVAL = 6 * 60 * 60 * 1000
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

function installedVersion() {
  try { return createRequire(import.meta.url)('../package.json').version } catch { return null }
}

function preferencesPath() {
  return join(dshHome(), 'capability-switch', 'update-preferences.json')
}

async function readPreferences() {
  try {
    const parsed = JSON.parse(await fs.readFile(preferencesPath(), 'utf8'))
    return { autoUpdate: parsed?.autoUpdate !== false }
  } catch {
    return { autoUpdate: true }
  }
}

async function writePreferences(value) {
  const file = preferencesPath()
  await fs.mkdir(dirname(file), { recursive: true })
  const temporary = join(dirname(file), `.${basename(file)}.${process.pid}.tmp`)
  await fs.writeFile(temporary, JSON.stringify({ autoUpdate: value.autoUpdate !== false }, null, 2) + '\n')
  await fs.rename(temporary, file)
}

function statusMessage(error) {
  return error?.message || String(error)
}

/**
 * Keep the npm-installed copy current through DSH's plugin manager.
 * Local links, Git installs, and incompatible releases are deliberately left alone.
 */
export function createUpdateManager(ctx) {
  let current = installedVersion()
  let latest = null
  let phase = 'idle'
  let error = null
  let checkedAt = null
  let autoUpdate = true
  let supported = null
  let running = null
  let timer = null
  let interval = null

  const manager = () => {
    const value = ctx.get('pluginManager')
    return value && typeof value.listBundles === 'function' && typeof value.listVersions === 'function' && typeof value.updateBundle === 'function'
      ? value
      : null
  }

  const status = () => ({
    name: UPDATE_BUNDLE,
    current,
    latest,
    state: phase,
    error,
    checkedAt,
    autoUpdate,
    supported,
  })

  async function loadPreferences() {
    const preferences = await readPreferences()
    autoUpdate = preferences.autoUpdate
    return status()
  }

  async function setAutoUpdate(enabled) {
    autoUpdate = enabled !== false
    await writePreferences({ autoUpdate })
    return status()
  }

  async function check({ auto = false } = {}) {
    if (running) return running
    running = (async () => {
      const pluginManager = manager()
      if (!pluginManager) {
        phase = 'unsupported'
        supported = false
        latest = null
        error = '当前 DSH 未提供插件管理器'
        checkedAt = new Date().toISOString()
        return status()
      }
      try {
        const bundles = await pluginManager.listBundles()
        const bundle = Array.isArray(bundles) ? bundles.find(item => item?.name === UPDATE_BUNDLE) : null
        if (bundle?.version) current = bundle.version
        supported = bundle?.update === 'registry'
          && typeof bundle.source === 'string'
          && bundle.source.startsWith(UPDATE_REGISTRY_PACKAGE)
        if (!supported) {
          phase = 'unsupported'
          latest = null
          error = bundle?.source?.startsWith('link:')
            ? '本地目录安装不支持自动更新，请改用 npm 安装'
            : '当前安装来源不支持自动更新，请改用 npm 安装'
          checkedAt = new Date().toISOString()
          return status()
        }
        const listed = await pluginManager.listVersions(UPDATE_BUNDLE)
        if (listed?.status !== 'listed') {
          phase = 'failed'
          latest = null
          error = listed?.reason || '无法读取 npm 版本列表'
          checkedAt = new Date().toISOString()
          return status()
        }
        const candidate = listed.versions.find(item => item?.bundle === true
          && !item.incompatible
          && !item.deprecated
          && item.prerelease !== true
          && item.version !== current)
        checkedAt = new Date().toISOString()
        latest = candidate?.version || null
        if (!candidate) {
          phase = 'current'
          error = null
          return status()
        }
        phase = 'available'
        error = null
        if (auto && autoUpdate) return await apply(candidate.version, pluginManager)
        return status()
      } catch (problem) {
        phase = 'failed'
        latest = null
        error = statusMessage(problem)
        checkedAt = new Date().toISOString()
        return status()
      }
    })().finally(() => { running = null })
    return running
  }

  async function apply(version, knownManager) {
    const pluginManager = knownManager || manager()
    if (!pluginManager || !version) return status()
    if (phase === 'updating') return status()
    if (typeof version !== 'string' || !VERSION.test(version)) {
      phase = 'failed'
      error = '无效的版本号'
      checkedAt = new Date().toISOString()
      return status()
    }
    if (supported === false) {
      phase = 'unsupported'
      error = '当前安装来源不支持自动更新'
      checkedAt = new Date().toISOString()
      return status()
    }
    if (supported !== true) {
      phase = 'failed'
      error = '请先检查更新'
      checkedAt = new Date().toISOString()
      return status()
    }
    if (latest === null || version !== latest) {
      phase = 'failed'
      error = '没有可应用的更新候选'
      checkedAt = new Date().toISOString()
      return status()
    }
    phase = 'updating'
    error = null
    try {
      const result = await pluginManager.updateBundle(UPDATE_BUNDLE, version)
      const payload = result?.result ?? result
      const application = payload?.application
      if (application === 'applied' || application === 'restart-required') {
        current = version
        phase = application === 'applied' ? 'updated' : 'restart-required'
      } else {
        phase = 'failed'
        error = payload?.error?.diagnostic || payload?.error?.code || '插件管理器未完成更新'
      }
    } catch (problem) {
      phase = 'failed'
      error = statusMessage(problem)
    }
    checkedAt = new Date().toISOString()
    return status()
  }

  function start() {
    void loadPreferences()
    const run = () => {
      if (!autoUpdate) return
      void check({ auto: true }).catch(problem => {
        phase = 'failed'
        error = statusMessage(problem)
        checkedAt = new Date().toISOString()
      })
    }
    timer = setTimeout(run, INITIAL_DELAY)
    timer.unref?.()
    interval = setInterval(run, CHECK_INTERVAL)
    interval.unref?.()
    return () => {
      if (timer) clearTimeout(timer)
      if (interval) clearInterval(interval)
      timer = null
      interval = null
    }
  }

  return { status, check, apply, setAutoUpdate, loadPreferences, start }
}

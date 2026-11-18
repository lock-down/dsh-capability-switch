import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'

const DISABLED = '.disabled'
const MAX_SKILL_BYTES = 1024 * 1024

export function dshHome() {
  return resolve(process.env.DSH_HOME?.trim() || join(homedir(), '.dsh'))
}

function realOrSelf(path) {
  return fs.realpath(path).catch(() => path)
}

function within(root, target) {
  const rel = relative(root, target)
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith(sep) && !/^[A-Za-z]:[\\/]/.test(rel))
}

async function roots(cwd) {
  const home = dshHome()
  const agentsHome = resolve(process.env.DSH_AGENTS_HOME?.trim() || join(homedir(), '.agents'))
  const list = [
    { path: join(home, 'skills'), source: 'user-dsh', scope: 'user', writable: true },
    { path: join(agentsHome, 'skills'), source: 'user-agents', scope: 'user', writable: false },
  ]
  if (typeof cwd === 'string' && cwd.trim()) {
    const project = resolve(cwd)
    list.push(
      { path: join(project, '.dsh', 'skills'), source: 'project-dsh', scope: 'project', writable: false },
      { path: join(project, '.agents', 'skills'), source: 'project-agents', scope: 'project', writable: false },
    )
  }
  return list
}

function parseScalar(value) {
  const text = value.trim()
  if (text.startsWith('"')) {
    try { return JSON.parse(text) } catch { return text }
  }
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'")
  return text.replace(/\s+#.*$/, '').trim()
}

function metadata(text, fallback) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  const result = { name: fallback, description: '' }
  if (!match) return result
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^(name|description):\s*(.*)$/.exec(line)
    if (field) result[field[1]] = parseScalar(field[2])
  }
  return result
}

async function readEntry(path) {
  const info = await fs.stat(path)
  if (!info.isFile() || info.size > MAX_SKILL_BYTES) throw new Error('技能入口不是文件或超过 1 MiB')
  return await fs.readFile(path, 'utf8')
}

async function scanRoot(root) {
  let entries
  try { entries = await fs.readdir(root.path, { withFileTypes: true }) } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return []
    throw error
  }
  const rows = []
  for (const entry of entries) {
    if (entry.name === '.system') continue
    let path
    let form
    if ((entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.endsWith(DISABLED)) {
      const directory = join(root.path, entry.name)
      for (const candidate of ['SKILL.md', 'SKILL.md' + DISABLED]) {
        try {
          const info = await fs.stat(join(directory, candidate))
          if (info.isFile()) { path = join(directory, candidate); form = 'directory'; break }
        } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
    } else if (entry.isFile() && /\.md(?:\.disabled)?$/.test(entry.name)) {
      path = join(root.path, entry.name)
      form = 'file'
    }
    if (!path) continue
    try {
      const text = await readEntry(path)
      const fallback = form === 'directory' ? basename(dirname(path)) : basename(path).replace(/\.md(?:\.disabled)?$/, '')
      const meta = metadata(text, fallback)
      rows.push({
        id: path, name: meta.name || fallback, description: meta.description || '',
        path, directory: form === 'directory' ? dirname(path) : dirname(path), form,
        enabled: !path.endsWith(DISABLED), source: root.source, scope: root.scope,
        writable: root.writable, rootPath: root.path,
      })
    } catch (error) {
      rows.push({ id: path, name: basename(dirname(path)), description: '', path, directory: dirname(path), form: 'invalid', enabled: !path.endsWith(DISABLED), source: root.source, scope: root.scope, writable: root.writable, rootPath: root.path, error: error.message })
    }
  }
  return rows
}

const SOURCE_PRIORITY = { 'project-dsh': 0, 'user-dsh': 1, 'project-agents': 2, 'user-agents': 3 }

export async function listSkills(cwd) {
  const groups = await Promise.all((await roots(cwd)).map(scanRoot))
  const ordered = groups.flat().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')
    || (SOURCE_PRIORITY[a.source] ?? 4) - (SOURCE_PRIORITY[b.source] ?? 4)
    || a.path.localeCompare(b.path))
  const seen = new Set()
  return ordered.filter(row => {
    if (seen.has(row.name)) return false
    seen.add(row.name)
    return true
  })
}

async function claim(path, cwd) {
  if (typeof path !== 'string' || !path.trim()) throw new Error('缺少技能入口路径')
  const requested = resolve(path)
  const allRoots = await roots(cwd)
  const dshRoot = allRoots.find(root => root.source === 'user-dsh')
  const agentsRoot = allRoots.find(root => root.source === 'user-agents')
  const dshPath = resolve(dshRoot.path)
  const dshReal = await realOrSelf(dshPath)
  const dshBase = within(dshPath, requested) ? dshPath : within(dshReal, requested) ? dshReal : undefined
  if (dshBase === undefined) {
    throw new Error('Agent 源目录只读；请从 DSH 目录中的同步技能操作')
  }
  const parts = relative(dshBase, requested).split(sep)
  const name = basename(requested)
  const valid = (parts.length === 1 && /\.md(?:\.disabled)?$/.test(name))
    || (parts.length === 2 && (name === 'SKILL.md' || name === 'SKILL.md' + DISABLED))
  if (!valid) throw new Error('只允许修改 DSH 技能入口文件')
  const entry = parts.length === 2 ? dirname(requested) : requested
  const info = await fs.lstat(entry)
  const target = await realOrSelf(requested)
  if (info.isSymbolicLink()) {
    const linkTarget = resolve(dirname(entry), await fs.readlink(entry))
    const agentsPath = resolve(agentsRoot.path)
    const agentsReal = await realOrSelf(agentsPath)
    if (!within(agentsPath, linkTarget) && !within(agentsReal, linkTarget)
      && !within(dshPath, linkTarget) && !within(dshReal, linkTarget)) {
      throw new Error('DSH 技能软链接指向了不允许的目录')
    }
  } else if (!within(dshReal, target)) {
    throw new Error('只允许修改 DSH 目录中的真实技能')
  }
  return { path: target, root: dshRoot }
}

async function claimLexical(path, cwd) {
  if (typeof path !== 'string' || !path.trim()) throw new Error('缺少技能入口路径')
  const requested = resolve(path)
  for (const root of await roots(cwd)) {
    if (!root.writable) continue
    const rootPath = resolve(root.path)
    if (!within(rootPath, requested)) continue
    const parts = relative(rootPath, requested).split(sep)
    const name = basename(requested)
    const valid = (parts.length === 1 && /\.md(?:\.disabled)?$/.test(name))
      || (parts.length === 2 && (name === 'SKILL.md' || name === 'SKILL.md' + DISABLED))
    if (valid) return { path: requested, root, parts }
    throw new Error('只允许删除技能入口')
  }
  throw new Error('只允许删除用户级技能；项目级技能在此插件中只读')
}

export async function readSkill(path, cwd) {
  const claimed = await claim(path, cwd)
  return { path: claimed.path, text: await readEntry(claimed.path) }
}

export async function toggleSkill(path, enabled, cwd) {
  const claimed = await claim(path, cwd)
  const current = claimed.path
  const disabled = current.endsWith(DISABLED)
  if (enabled === !disabled) return { path: current, enabled, unchanged: true }
  const next = enabled ? current.slice(0, -DISABLED.length) : current + DISABLED
  try { await fs.lstat(next); throw new Error('目标文件已存在，未覆盖') } catch (error) { if (error.code !== 'ENOENT') throw error }
  await fs.rename(current, next)
  return { path: next, enabled, unchanged: false }
}

function assertSkillName(name) {
  if (!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(name)) throw new Error('技能目录名需为 1–64 位小写字母、数字、连字符或下划线')
}

export async function createSkill(input) {
  const name = String(input.name || '').trim()
  const description = String(input.description || '').trim()
  const body = String(input.body || '').trim()
  assertSkillName(name)
  if (!description) throw new Error('请填写技能描述')
  const root = join(dshHome(), 'skills')
  const directory = join(root, name)
  const path = join(directory, 'SKILL.md')
  await fs.mkdir(root, { recursive: true })
  try { await fs.lstat(directory); throw new Error('同名技能目录已存在') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const text = `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\n---\n\n${body || '# ' + name}\n`
  await fs.mkdir(directory)
  try { await fs.writeFile(path, text, { encoding: 'utf8', flag: 'wx' }) } catch (error) { await fs.rm(directory, { recursive: true }); throw error }
  return { path, name }
}

async function atomicWrite(path, text) {
  if (Buffer.byteLength(text, 'utf8') > MAX_SKILL_BYTES) throw new Error('技能文件不能超过 1 MiB')
  const backupDir = join(dshHome(), 'capability-switch', 'backups')
  await fs.mkdir(backupDir, { recursive: true })
  const backup = join(backupDir, `${Date.now()}-${randomUUID()}-${basename(path)}`)
  await fs.copyFile(path, backup)
  const temp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`)
  await fs.writeFile(temp, text, 'utf8')
  await fs.rename(temp, path)
  return backup
}

export async function updateSkill(path, text, cwd) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('SKILL.md 内容不能为空')
  if (!/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(text)) throw new Error('SKILL.md 必须包含完整的 YAML frontmatter')
  const claimed = await claim(path, cwd)
  if (claimed.path.endsWith(DISABLED)) throw new Error('请先启用技能，再编辑入口文件')
  const backup = await atomicWrite(claimed.path, text)
  return { path: claimed.path, backup }
}

export async function deleteSkill(path, confirm, cwd) {
  if (confirm !== true) throw new Error('删除技能需要明确确认')
  const claimed = await claimLexical(path, cwd)
  const source = claimed.parts.length === 2 ? dirname(claimed.path) : claimed.path
  const info = await fs.lstat(source)
  const trash = join(dshHome(), 'capability-switch', 'trash')
  await fs.mkdir(trash, { recursive: true })
  const target = join(trash, `${Date.now()}-${randomUUID()}-${basename(source)}`)
  if (info.isSymbolicLink()) {
    const linkTarget = await fs.readlink(source).catch(() => '')
    await fs.rename(source, target)
    return { from: source, trash: target, unlinked: true, linkTarget }
  }
  await fs.rename(source, target)
  return { from: source, trash: target, unlinked: false }
}

async function linksToSource(target, source) {
  let info
  try { info = await fs.lstat(target) } catch (error) { if (error.code === 'ENOENT') return false; throw error }
  if (!info.isSymbolicLink()) return false
  try {
    const [targetReal, sourceReal] = await Promise.all([fs.realpath(target), fs.realpath(source)])
    return targetReal === sourceReal
  } catch { return false }
}

async function linkSkill(source, target) {
  const info = await fs.stat(source)
  if (!info.isDirectory() && !info.isFile()) throw new Error('技能来源必须是目录或文件')
  const linkType = process.platform === 'win32' ? info.isDirectory() ? 'junction' : 'file' : undefined
  await fs.symlink(resolve(source), target, linkType)
}

let refreshSequence = 0

/** Force a completed skill catalog snapshot to be rebuilt after a host-owned filesystem mutation. */
export function invalidateSkillCatalog(ctx) {
  const skills = ctx.get('skills')
  if (!skills) return false
  if (typeof skills.invalidateCache === 'function') {
    skills.invalidateCache()
    return true
  }
  if (typeof skills.registerProvider === 'function') {
    try {
      const dispose = skills.registerProvider(() => ({
        name: `capability-switch-refresh-${++refreshSequence}`,
        list: async () => [],
        get: async () => undefined,
      }))
      dispose()
      return true
    } catch { /* fall through to the public notification */ }
  }
  try { ctx.emit('skills/change') } catch { /* best effort after a disposed plugin */ }
  return false
}

const HIDDEN_SKILL_SOURCES = new Set(['user-agents'])

/**
 * Hide only the global Agent directory from every catalog/load consumer.
 * Project-level DSH and Agent skills stay visible in every Agent preset, and
 * the global Agent directory remains available to sync previews.
 */
export function installSkillTakeover(ctx) {
  const service = ctx.get('skills')
  if (!service || typeof service.list !== 'function' || typeof service.snapshot !== 'function' || typeof service.get !== 'function') {
    return () => {}
  }
  const original = { list: service.list, snapshot: service.snapshot, get: service.get }
  const own = Object.fromEntries(Object.keys(original).map(key => [key, Object.hasOwn(service, key)]))
  const visible = skill => !HIDDEN_SKILL_SOURCES.has(skill.source)
  const list = async function (...args) {
    return (await original.list.apply(this, args)).filter(visible)
  }
  const snapshot = async function (...args) {
    const result = await original.snapshot.apply(this, args)
    return { ...result, skills: result.skills.filter(visible) }
  }
  const get = async function (name, ...args) {
    const result = await original.snapshot.apply(this, args)
    if (!result.skills.some(skill => skill.name === name && visible(skill))) return undefined
    return await original.get.apply(this, [name, ...args])
  }
  Object.assign(service, { list, snapshot, get })
  return () => {
    for (const [key, method] of Object.entries(original)) {
      if (service[key] !== ({ list, snapshot, get })[key]) continue
      if (own[key]) service[key] = method
      else delete service[key]
    }
  }
}

export async function previewAgentSkillSync() {
  const allRoots = await roots()
  const sourceRoot = allRoots.find(root => root.source === 'user-agents')
  const targetRoot = allRoots.find(root => root.source === 'user-dsh')
  const sourceRows = (await scanRoot(sourceRoot)).filter(row => row.form !== 'invalid')
  const items = []
  for (const row of sourceRows) {
    const source = row.form === 'file' ? row.path : row.directory
    const name = relative(sourceRoot.path, source)
    if (!name || name.startsWith('..') || name.includes(sep)) throw new Error('技能同步仅支持源目录的直接子项')
    const target = join(targetRoot.path, name)
    let action = 'import'
    if (await linksToSource(target, source)) action = 'skip'
    else {
      try { await fs.lstat(target); action = 'update' } catch (error) { if (error.code !== 'ENOENT') throw error }
    }
    items.push({ name, action, source, target })
  }
  return {
    items, sourceRoot: sourceRoot.path, targetRoot: targetRoot.path,
    backupRoot: join(dshHome(), 'capability-switch', 'skill-sync-backups'),
  }
}

/** Execute reviewed items by creating DSH symlinks to Agent sources, reporting every outcome. */
export async function syncAgentSkills(plan, names) {
  plan ||= await previewAgentSkillSync()
  if (names !== undefined && !Array.isArray(names)) throw new Error('names 必须是技能名称数组')
  const selected = names === undefined ? null : new Set(names.filter(name => typeof name === 'string'))
  const result = {
    imported: [], updated: [], skipped: [], failed: [],
    sourceRoot: plan.sourceRoot, targetRoot: plan.targetRoot, backupRoot: plan.backupRoot, backupDir: null,
  }
  await fs.mkdir(plan.targetRoot, { recursive: true })
  for (const item of plan.items) {
    if (selected !== null && !selected.has(item.name)) continue
    if (item.action === 'skip') { result.skipped.push(item.name); continue }
    let backup = null
    const temporary = join(plan.targetRoot, `.capability-switch-${randomUUID()}.tmp`)
    try {
      if (item.action === 'update') {
        result.backupDir ??= join(plan.backupRoot, `${Date.now()}-${randomUUID()}`)
        backup = join(result.backupDir, item.name)
        await fs.mkdir(dirname(backup), { recursive: true })
        await fs.rename(item.target, backup)
      }
      await linkSkill(item.source, temporary)
      await fs.rename(temporary, item.target)
      if (item.action === 'update') result.updated.push(item.name)
      else result.imported.push(item.name)
    } catch (error) {
      await fs.rm(temporary, { recursive: true, force: true })
      if (backup) {
        try { await fs.rename(backup, item.target) } catch (restoreError) { error.message += '；恢复原文件失败：' + restoreError.message }
      }
      result.failed.push({ name: item.name, error: error.message })
    }
  }
  return result
}

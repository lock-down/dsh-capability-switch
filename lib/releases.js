import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPOSITORY = 'lock-down/dsh-capability-switch'
const RELEASES_URL = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=10`
const RELEASE_DIR = fileURLToPath(new URL('../docs/releases/', import.meta.url))
const CACHE_TTL = 10 * 60 * 1000
const MAX_BODY = 60 * 1000
const RELEASE_LINK = `https://github.com/${REPOSITORY}/releases/`
const LOCALE = /^[a-z]{2}$/

function clean(value, limit = 200) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function bodyText(value) {
  return typeof value === 'string' ? value.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, '').slice(0, MAX_BODY) : ''
}

function normalizeRelease(row) {
  if (!row || typeof row !== 'object') return null
  const tag = clean(row.tag_name, 80)
  if (!tag) return null
  const url = clean(row.html_url, 500)
  return {
    tag,
    name: clean(row.name, 200) || tag,
    body: bodyText(row.body),
    publishedAt: clean(row.published_at, 40),
    prerelease: row.prerelease === true,
    htmlUrl: url.startsWith(RELEASE_LINK) ? url : '',
  }
}

function normalizeLocale(lang) {
  const value = typeof lang === 'string' ? lang.trim().toLowerCase() : ''
  return LOCALE.test(value) ? value : 'en'
}

/**
 * Read the plugin's own GitHub Releases with a short cache. The repository and
 * host are fixed; callers cannot point this reader at another origin.
 * A packaged docs/releases/<version>.<locale>.md note takes priority so the
 * in-app release notes follow the DSH language; older releases fall back to
 * the language published on GitHub.
 */
export function createReleaseReader({ fetchImpl = globalThis.fetch, now = Date.now, ttl = CACHE_TTL } = {}) {
  const byLocale = new Map()
  const runningByLocale = new Map()
  let github = null
  let githubRunning = null

  async function githubReleases(refresh) {
    if (!refresh && github && now() - github.at < ttl) return github.rows
    if (githubRunning) return githubRunning
    githubRunning = (async () => {
      if (typeof fetchImpl !== 'function') throw new Error('当前 DSH 不支持读取 Release 说明')
      const response = await fetchImpl(RELEASES_URL, {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'dsh-capability-switch',
          'x-github-api-version': '2022-11-28',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) throw new Error('GitHub Releases 请求失败：HTTP ' + response.status)
      const rows = await response.json()
      if (!Array.isArray(rows)) throw new Error('GitHub Releases 返回格式不正确')
      github = { at: now(), rows: rows.map(normalizeRelease).filter(Boolean) }
      return github.rows
    })().finally(() => { githubRunning = null })
    return githubRunning
  }

  async function localizedBody(release, locale) {
    const version = release.tag.replace(/^v/, '')
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) return ''
    for (const code of [...new Set([locale, 'en'])]) {
      try {
        const text = await fs.readFile(join(RELEASE_DIR, `${version}.${code}.md`), 'utf8')
        return bodyText(text)
      } catch { /* use the next language or the GitHub body */ }
    }
    return ''
  }

  async function load({ refresh = false, lang = 'en' } = {}) {
    const locale = normalizeLocale(lang)
    if (!refresh) {
      const cached = byLocale.get(locale)
      if (cached && now() - cached.at < ttl) return cached.value
      const running = runningByLocale.get(locale)
      if (running) return running
    }
    const request = (async () => {
      const rows = await githubReleases(refresh)
      const releases = await Promise.all(rows.map(async release => ({
        ...release,
        body: (await localizedBody(release, locale)) || release.body,
      })))
      const value = {
        latest: releases.find(release => !release.prerelease) || releases[0] || null,
        releases,
        checkedAt: new Date(now()).toISOString(),
      }
      byLocale.set(locale, { at: now(), value })
      return value
    })().finally(() => { runningByLocale.delete(locale) })
    runningByLocale.set(locale, request)
    return request
  }

  return { load }
}

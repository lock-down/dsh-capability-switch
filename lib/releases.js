const REPOSITORY = 'lock-down/dsh-capability-switch'
const RELEASES_URL = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=10`
const CACHE_TTL = 10 * 60 * 1000
const MAX_BODY = 60 * 1000
const RELEASE_LINK = `https://github.com/${REPOSITORY}/releases/`

function clean(value, limit = 200) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function normalizeRelease(row) {
  if (!row || typeof row !== 'object') return null
  const tag = clean(row.tag_name, 80)
  if (!tag) return null
  const url = clean(row.html_url, 500)
  return {
    tag,
    name: clean(row.name, 200) || tag,
    body: typeof row.body === 'string' ? row.body.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, '').slice(0, MAX_BODY) : '',
    publishedAt: clean(row.published_at, 40),
    prerelease: row.prerelease === true,
    htmlUrl: url.startsWith(RELEASE_LINK) ? url : '',
  }
}

/**
 * Read the plugin's own GitHub Releases with a short cache. The repository and
 * host are fixed; callers cannot point this reader at another origin.
 */
export function createReleaseReader({ fetchImpl = globalThis.fetch, now = Date.now, ttl = CACHE_TTL } = {}) {
  let cached = null
  let running = null

  async function load({ refresh = false } = {}) {
    if (!refresh && cached && now() - cached.at < ttl) return cached.value
    if (running) return running
    running = (async () => {
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
      const releases = rows.map(normalizeRelease).filter(Boolean)
      const value = {
        latest: releases.find(release => !release.prerelease) || releases[0] || null,
        releases,
        checkedAt: new Date(now()).toISOString(),
      }
      cached = { at: now(), value }
      return value
    })().finally(() => { running = null })
    return running
  }

  return { load }
}

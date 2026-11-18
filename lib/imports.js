import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parse as parseToml } from 'smol-toml'
import { createHash } from 'node:crypto'

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function strings(value) {
  return object(value) ? Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'string')) : {}
}

function normalizeStandard(name, value, source) {
  if (!object(value)) throw new Error('配置项必须是对象')
  const kind = value.transport || value.type || (value.url ? 'streamable-http' : 'stdio')
  if (['http', 'streamable-http'].includes(kind)) {
    if (!String(value.url || '').trim()) throw new Error('HTTP MCP 缺少 URL')
    return {
      name, transport: 'streamable-http', url: String(value.url || ''), headers: strings(value.headers),
      command: '', args: [], env: {}, cwd: '', enabled: value.enabled !== false && value.disabled !== true, sources: [source],
    }
  }
  if (kind !== 'stdio') throw new Error(`暂不支持 ${String(kind)} 传输`)
  if (!String(value.command || '').trim()) throw new Error('stdio MCP 缺少启动命令')
  return {
    name, transport: 'stdio', command: String(value.command || ''),
    args: Array.isArray(value.args) ? value.args.map(String) : [],
    env: strings(value.env), cwd: String(value.cwd || ''), url: '', headers: {},
    enabled: value.enabled !== false && value.disabled !== true, sources: [source],
  }
}

function normalizeOpenCode(name, value, source) {
  if (!object(value)) throw new Error('配置项必须是对象')
  if (value.type === 'remote') {
    return normalizeStandard(name, { ...value, type: 'http' }, source)
  }
  if (value.type !== 'local') throw new Error('OpenCode MCP 仅支持 local 或 remote')
  const command = Array.isArray(value.command) ? value.command.map(String) : []
  return normalizeStandard(name, {
    type: 'stdio', command: command[0] || '', args: command.slice(1),
    env: value.environment, enabled: value.enabled,
  }, source)
}

function normalizeCodex(name, value, source) {
  if (!object(value)) throw new Error('配置项必须是表')
  return normalizeStandard(name, {
    type: value.url ? 'http' : 'stdio', command: value.command, args: value.args,
    env: value.env, cwd: value.cwd, url: value.url, headers: value.http_headers,
    enabled: value.enabled,
  }, source)
}

function definitions(baseHome) {
  return [
    { id: 'claude-code', label: 'Claude Code', path: join(baseHome, '.claude.json'), format: 'json', pick: data => data.mcpServers, normalize: normalizeStandard },
    { id: 'codex', label: 'Codex', path: join(baseHome, '.codex', 'config.toml'), format: 'toml', pick: data => data.mcp_servers, normalize: normalizeCodex },
    { id: 'gemini', label: 'Gemini CLI', path: join(baseHome, '.gemini', 'settings.json'), format: 'json', pick: data => data.mcpServers, normalize: normalizeStandard },
    { id: 'opencode', label: 'OpenCode', path: join(baseHome, '.config', 'opencode', 'opencode.json'), format: 'json', pick: data => data.mcp, normalize: normalizeOpenCode },
    { id: 'cursor', label: 'Cursor', path: join(baseHome, '.cursor', 'mcp.json'), format: 'json', pick: data => data.mcpServers, normalize: normalizeStandard },
  ]
}

/** Read supported user-level application configs without modifying them. */
export async function scanMcpApps(baseHome = homedir()) {
  const servers = []
  const sources = []
  for (const definition of definitions(baseHome)) {
    const source = { id: definition.id, label: definition.label, path: definition.path }
    try {
      const text = await fs.readFile(definition.path, 'utf8')
      const data = definition.format === 'toml' ? parseToml(text) : JSON.parse(text)
      if (!object(data)) throw new Error('配置文件根节点必须是对象')
      const entries = definition.pick(data)
      if (entries !== undefined && !object(entries)) throw new Error('MCP 配置节点必须是对象')
      const names = []
      for (const [name, value] of Object.entries(entries || {})) {
        try {
          servers.push(definition.normalize(name, value, { id: source.id, label: source.label, path: source.path }))
          names.push(name)
        } catch (error) {
          sources.push({ ...source, name, error: error.message })
        }
      }
      sources.push({ ...source, count: names.length })
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') sources.push({ ...source, error: error.message })
    }
  }
  return { servers, sources }
}

export function mcpFingerprint(row) {
  const canonical = JSON.stringify([
    row.name, row.transport, row.command, row.args, row.cwd, row.url,
    Object.entries(row.env || {}).sort(([left], [right]) => left.localeCompare(right)),
    Object.entries(row.headers || {}).sort(([left], [right]) => left.localeCompare(right)),
  ])
  return createHash('sha256').update(canonical).digest('hex')
}

/** Merge only identical same-name entries; conflicting sources remain separate choices. */
export function groupMcpImports(rows) {
  const groups = new Map()
  for (const row of rows) {
    const fingerprint = mcpFingerprint(row)
    const key = row.name + '\0' + fingerprint
    const existing = groups.get(key)
    if (existing) existing.sources.push(...row.sources)
    else groups.set(key, { ...row, fingerprint, sources: [...row.sources] })
  }
  const counts = new Map()
  for (const row of groups.values()) counts.set(row.name, (counts.get(row.name) || 0) + 1)
  return [...groups.values()]
    .map(row => ({ ...row, conflict: counts.get(row.name) > 1 }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.sources[0].id.localeCompare(b.sources[0].id))
}

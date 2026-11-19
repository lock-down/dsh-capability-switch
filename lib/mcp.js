import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { isMap, isSeq, parseDocument } from 'yaml'
import { groupMcpImports, scanMcpApps } from './imports.js'
import { dshHome } from './skills.js'

const NAME = /^[A-Za-z0-9_-]{1,32}$/

function manager(ctx) {
  const service = ctx.get('mcpManager')
  if (!service) throw new Error('当前 DSH 配置未启用 MCP Manager')
  return service
}

function editor(ctx) {
  const service = ctx.get('configEditor')
  if (!service) throw new Error('当前 DSH 配置不支持在线修改')
  return service
}

async function pluginRows(ctx) {
  const service = ctx.get('pluginManager')
  if (!service) return []
  try { return await service.listPlugins() } catch { return [] }
}

function pluginRowFor(entry, rows) {
  return rows.find(row => row.patchId === entry.options.id
    || (typeof row.entryId === 'string' && row.entryId.endsWith(':' + entry.options.id)))
}

async function standaloneEntries(ctx) {
  const service = ctx.get('configEditor')
  if (!service) return []
  const rows = await pluginRows(ctx)
  return service.entries()
    .filter(entry => entry.options?.name === '@deepseek-ai/dsh-mcp-client')
    .map(entry => ({ entry, pluginRow: pluginRowFor(entry, rows) }))
}

async function standaloneMcp(ctx) {
  const result = []
  for (const { entry, pluginRow } of await standaloneEntries(ctx)) {
    const config = entry.options.config || {}
    const enabled = pluginRow?.enabled ?? entry.options.disabled !== true
    result.push({
      transport: config.transport || 'stdio', command: String(config.command || ''),
      args: Array.isArray(config.args) ? config.args.map(String) : [],
      env: config.env || {}, cwd: String(config.cwd || ''), url: String(config.url || ''),
      headers: config.headers || {}, name: String(config.serverName || entry.options.id),
      enabled, status: { state: enabled ? 'unknown' : 'disabled' }, source: 'standalone', writable: true,
      canToggle: pluginRow !== undefined && pluginRow.readOnlyReason === undefined,
      canDelete: true, ...(pluginRow?.entryId === undefined ? {} : { pluginEntryId: pluginRow.entryId }), entryId: entry.options.id,
    })
  }
  return result
}

export async function listMcp(ctx) {
  const service = manager(ctx)
  const entries = service.config.servers.get()
  const rows = new Map()
  for (const view of service.list()) {
    const configured = Object.hasOwn(entries, view.name)
    if (!view.configured && !configured) continue
    rows.set(view.name, {
      ...(configured ? entries[view.name] : {}), name: view.name,
      enabled: configured ? entries[view.name].enabled : true,
      status: view.status, source: configured ? 'manager' : 'registered', writable: configured,
      canToggle: configured, canDelete: configured,
    })
  }
  for (const [name, entry] of Object.entries(entries)) {
    if (!rows.has(name)) rows.set(name, {
      ...entry, name, status: { state: entry.enabled ? 'connecting' : 'disabled' },
      source: 'manager', writable: true, canToggle: true, canDelete: true,
    })
  }
  for (const row of await standaloneMcp(ctx)) if (!rows.has(row.name)) rows.set(row.name, row)
  return [...rows.values()]
}

async function edit(ctx, update) {
  const service = manager(ctx)
  const entry = service.ctx?.fiber?.entry
  if (!entry) throw new Error('无法定位 MCP Manager 的配置项')
  return await editor(ctx).edit(entry, current => update({ ...(current || {}), servers: { ...(current?.servers || {}) } }))
}

function cleanMap(value, label) {
  if (value == null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(label + '必须是 JSON 对象')
  return Object.fromEntries(Object.entries(value).map(([key, val]) => {
    if (!key.trim() || typeof val !== 'string') throw new Error(label + '的键和值必须是字符串')
    return [key, val]
  }))
}

function normalizeServer(input, previous = {}) {
  const name = String(input.name || '').trim()
  if (!NAME.test(name)) throw new Error('MCP 名称需为 1–32 位字母、数字、连字符或下划线')
  const requestedTransport = input.transport
  const transport = requestedTransport === 'sse' ? 'streamable-http' : requestedTransport
  if (transport !== 'stdio' && transport !== 'streamable-http') throw new Error('不支持的 MCP 传输类型')
  const shared = { ...previous, name: undefined, transport, enabled: input.enabled !== false }
  delete shared.name
  if (transport === 'stdio') {
    const command = String(input.command || '').trim()
    if (!command) throw new Error('stdio MCP 必须填写启动命令')
    return { ...shared, command, args: Array.isArray(input.args) ? input.args.map(String) : [], env: cleanMap(input.env, '环境变量'), cwd: String(input.cwd || ''), url: '', headers: {} }
  }
  const url = String(input.url || '').trim()
  try { const parsed = new URL(url); if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error() } catch { throw new Error('HTTP MCP 必须填写有效的 http(s) URL') }
  return { ...shared, url, headers: cleanMap(input.headers, '请求头'), command: '', args: [], env: {}, cwd: '' }
}

export async function saveMcp(ctx, input) {
  const service = manager(ctx)
  const name = String(input.name || '').trim()
  const configured = service.config.servers.get()
  const previous = configured[name]
  if (input.originalName && input.originalName !== name) throw new Error('编辑时不能修改 MCP 名称')
  if (!input.originalName && previous) throw new Error('同名 MCP 已存在')
  const standaloneEntriesList = await standaloneEntries(ctx)
  const standaloneName = candidate => String(candidate.entry.options.config?.serverName || candidate.entry.options.id)
  const standalone = input.originalName
    ? standaloneEntriesList.find(candidate => standaloneName(candidate) === name)
    : undefined
  if (!input.originalName && standaloneEntriesList.some(candidate => standaloneName(candidate) === name)) {
    throw new Error('同名 MCP 已存在')
  }
  if (standalone) {
    const server = normalizeServer(input, standalone.entry.options.config || {})
    const { enabled, ...config } = server
    await editor(ctx).edit(standalone.entry, current => ({
      ...(current || {}),
      ...config,
      serverName: name,
    }))
    return { name, enabled: enabled !== false, standalone: true }
  }
  if (input.originalName && previous === undefined) throw new Error('MCP 不存在或已被移除')
  const server = normalizeServer(input, previous || {})
  await edit(ctx, current => { current.servers[name] = server; return current })
  return { name, enabled: server.enabled }
}

function importId(server) {
  return server.name + ':' + server.fingerprint
}

export async function listMcpImports(ctx, baseHome) {
  const existing = new Set((await listMcp(ctx)).map(row => row.name))
  const scanned = await scanMcpApps(baseHome)
  const servers = groupMcpImports(scanned.servers).map(server => ({
    id: importId(server), name: server.name, transport: server.transport, command: server.command,
    args: server.args, cwd: server.cwd, url: server.url, sources: server.sources,
    conflict: server.conflict, exists: existing.has(server.name),
  }))
  return { servers, errors: scanned.sources.filter(source => source.error) }
}

export async function importMcp(ctx, selections, baseHome, enable = false) {
  if (!Array.isArray(selections)) throw new Error('selections 必须是预览条目 ID 数组')
  const requested = new Set(selections.filter(id => typeof id === 'string'))
  if (!requested.size) return { imported: [], skipped: [], errors: [] }
  const scanned = await scanMcpApps(baseHome)
  const groups = groupMcpImports(scanned.servers)
  const existing = new Set((await listMcp(ctx)).map(row => row.name))
  const selected = groups.filter(server => requested.has(importId(server)))
  if (selected.length !== requested.size) throw new Error('来源配置已在预览后变化，请重新扫描并确认')
  if (new Set(selected.map(server => server.name)).size !== selected.length) throw new Error('同名配置冲突时只能选择一个来源')
  const imported = []
  const skipped = selected.filter(server => existing.has(server.name)).map(server => server.name)
  const candidates = selected.filter(server => !existing.has(server.name))
    .map(server => [importId(server), normalizeServer({ ...server, enabled: enable === true })])
  const normalized = new Map(candidates)
  await edit(ctx, current => {
    for (const server of selected) {
      if (existing.has(server.name) || current.servers[server.name]) continue
      const normalizedServer = normalized.get(importId(server))
      if (!normalizedServer) continue
      current.servers[server.name] = normalizedServer
      imported.push(server.name)
    }
    return current
  })
  return { imported, skipped, errors: scanned.sources.filter(source => source.error) }
}

async function standaloneTarget(ctx, name) {
  const entry = (await standaloneEntries(ctx)).find(candidate => {
    const config = candidate.entry.options.config || {}
    return String(config.serverName || candidate.entry.options.id) === name
  })
  if (!entry) throw new Error('MCP 不存在或已被移除')
  return entry
}

export function removePatchEntry(text, id) {
  const document = parseDocument(text, {
    customTags: [{ tag: 'tag:yaml.org,2002:js', resolve: value => value }],
  })
  if (document.errors[0] !== undefined) throw document.errors[0]
  if (!isSeq(document.contents)) throw new Error('Profile patch must be a YAML sequence')
  let removed = false
  const rows = document.contents.items
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    if (!isMap(row)) continue
    const insert = row.get('insert')
    if (isSeq(insert)) {
      for (let child = insert.items.length - 1; child >= 0; child -= 1) {
        const item = insert.items[child]
        if (isMap(item) && item.get('id') === id) {
          insert.items.splice(child, 1)
          removed = true
        }
      }
      if (insert.items.length === 0) rows.splice(index, 1)
    } else if (row.get('id') === id) {
      rows.splice(index, 1)
      removed = true
    }
  }
  return { text: String(document), removed }
}

export async function toggleMcp(ctx, name, enabled) {
  if (!NAME.test(name)) throw new Error('无效的 MCP 名称')
  const configured = manager(ctx).config.servers.get()
  if (Object.hasOwn(configured, name)) {
    await edit(ctx, current => {
      if (!current.servers[name]) throw new Error('MCP 不存在或已被移除')
      current.servers[name] = { ...current.servers[name], enabled: enabled === true }
      return current
    })
    return { name, enabled: enabled === true }
  }
  const target = await standaloneTarget(ctx, name)
  if (!target.pluginRow?.entryId || target.pluginRow.readOnlyReason !== undefined) {
    throw new Error('该独立 MCP 的插件条目不可管理')
  }
  const service = ctx.get('pluginManager')
  if (!service) throw new Error('当前 DSH 配置未启用插件管理器')
  const result = await service.setPluginEnabled(target.pluginRow.entryId, enabled === true)
  if (result.application === 'failed' || result.application === 'cancelled') {
    throw new Error(result.error?.diagnostic || result.error?.code || 'MCP 启停失败')
  }
  return { name, enabled: enabled === true, standalone: true, restartRequired: result.application === 'restart-required' }
}

export async function deleteMcp(ctx, name, confirm) {
  if (confirm !== true) throw new Error('删除 MCP 需要明确确认')
  const configured = manager(ctx).config.servers.get()
  if (Object.hasOwn(configured, name)) {
    await edit(ctx, current => {
      if (!current.servers[name]) throw new Error('MCP 不存在或已被移除')
      delete current.servers[name]
      return current
    })
    return { name, deleted: true }
  }

  const { entry } = await standaloneTarget(ctx, name)
  const service = editor(ctx)
  if (typeof service.documentPath !== 'string' || !service.documentPath) throw new Error('无法定位当前 profile 配置')
  const before = await fs.readFile(service.documentPath, 'utf8')
  const { text, removed } = removePatchEntry(before, entry.options.id)
  if (!removed) throw new Error('无法在 profile 配置中定位该独立 MCP')
  const backupDir = join(dshHome(), 'capability-switch', 'backups')
  await fs.mkdir(backupDir, { recursive: true })
  const backup = join(backupDir, `${Date.now()}-${randomUUID()}-${basename(service.documentPath)}`)
  await fs.copyFile(service.documentPath, backup)
  const mode = (await fs.stat(service.documentPath)).mode
  const temporary = join(dirname(service.documentPath), `.${basename(service.documentPath)}.${randomUUID()}.tmp`)
  await fs.writeFile(temporary, text, { mode })
  await fs.rename(temporary, service.documentPath)

  let liveRemoved = false
  let liveError
  try {
    if (entry.parent?.remove) entry.parent.remove(entry.options.id)
    else ctx.get('loader')?.remove(entry.options.id)
    await ctx.get('loader')?.await()
    liveRemoved = true
  } catch (error) {
    liveError = error.message
  }
  return { name, deleted: true, standalone: true, liveRemoved, restartRequired: !liveRemoved, backup, ...(liveError ? { liveError } : {}) }
}

export async function testMcp(ctx, name) {
  return await manager(ctx).probe(name)
}

export async function restartMcp(ctx, name) {
  await manager(ctx).restart(name)
  return { name, restarted: true }
}

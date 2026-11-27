import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { isMap, isSeq, parseDocument } from 'yaml'
import { groupMcpImports, scanMcpApps } from './imports.js'
import { dshHome } from './skills.js'

const NAME = /^[A-Za-z0-9_-]{1,32}$/
const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype'])

/** A name that is both syntactically valid and safe as a plain-object key. */
function validName(name) {
  return NAME.test(name) && !RESERVED_NAMES.has(name)
}

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
    const manageable = pluginRow === undefined || pluginRow.readOnlyReason === undefined
    result.push({
      transport: config.transport || 'stdio', command: String(config.command || ''),
      args: Array.isArray(config.args) ? config.args.map(String) : [],
      env: config.env || {}, cwd: String(config.cwd || ''), url: String(config.url || ''),
      headers: config.headers || {}, name: String(config.serverName || entry.options.id),
      enabled, status: { state: enabled ? 'unknown' : 'disabled' }, source: 'standalone',
      writable: manageable,
      canToggle: pluginRow !== undefined && manageable,
      canDelete: manageable, ...(pluginRow?.entryId === undefined ? {} : { pluginEntryId: pluginRow.entryId }), entryId: entry.options.id,
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
  if (!validName(name)) throw new Error('MCP 名称需为 1–32 位字母、数字、连字符或下划线，且不能使用保留名称')
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

export async function saveMcp(ctx, input, approve) {
  const service = manager(ctx)
  const name = String(input.name || '').trim()
  const configured = service.config.servers.get()
  const previous = Object.hasOwn(configured, name) ? configured[name] : undefined
  if (input.originalName && input.originalName !== name) throw new Error('编辑时不能修改 MCP 名称')
  if (!input.originalName && previous) throw new Error('同名 MCP 已存在')
  const standaloneEntriesList = await standaloneEntries(ctx)
  const standaloneName = candidate => String(candidate.entry.options.config?.serverName || candidate.entry.options.id)
  const standalone = input.originalName && previous === undefined
    ? standaloneEntriesList.find(candidate => standaloneName(candidate) === name)
    : undefined
  if (!input.originalName && standaloneEntriesList.some(candidate => standaloneName(candidate) === name)) {
    throw new Error('同名 MCP 已存在')
  }
  if (standalone) {
    if (standalone.pluginRow?.readOnlyReason !== undefined) throw new Error('该独立 MCP 的插件条目不可管理')
    const server = normalizeServer(input, standalone.entry.options.config || {})
    const { enabled: _requestedEnabled, ...config } = server
    const live = standalone.pluginRow?.enabled ?? standalone.entry.options.disabled !== true
    if (live) await approveStart(approve, 'mcp_save', [{ ...server, name }])
    await editor(ctx).edit(standalone.entry, current => ({
      ...(current || {}),
      ...config,
      serverName: name,
    }))
    // Saving a standalone entry never changes its live enablement; report that
    // state instead of the requested config value.
    return { name, enabled: live, standalone: true }
  }
  if (input.originalName && previous === undefined) throw new Error('MCP 不存在或已被移除')
  const server = normalizeServer(input, previous || {})
  if (server.enabled) await approveStart(approve, 'mcp_save', [{ ...server, name }])
  await edit(ctx, current => { current.servers[name] = server; return current })
  return { name, enabled: server.enabled }
}

function importId(server) {
  return server.name + ':' + server.fingerprint
}

function stdioStarts(servers) {
  return servers
    .filter(server => server && server.transport === 'stdio')
    .map(server => ({
      name: server.name,
      command: String(server.command || ''),
      args: Array.isArray(server.args) ? server.args.map(String) : [],
    }))
}

/** Signature of the fields that decide which local command a stdio entry runs. */
function startSignature(entry) {
  if (!entry) return ''
  return JSON.stringify({
    transport: entry.transport,
    command: entry.command,
    args: Array.isArray(entry.args) ? entry.args : [],
    cwd: entry.cwd,
    env: entry.env && typeof entry.env === 'object' ? entry.env : {},
  })
}

/** Marker for panel operations the user performs directly, outside a turn. */
export const PANEL_APPROVAL = Symbol('capability-switch:panel-approval')

// Every call that can start an stdio command must name its approval context:
// the Agent tool passes a requester, panel routes pass PANEL_APPROVAL. A
// missing context fails closed instead of silently skipping the question.
async function approveStart(approve, action, servers) {
  const starting = stdioStarts(servers)
  if (!starting.length) return
  if (approve === PANEL_APPROVAL) return
  if (typeof approve !== 'function') {
    throw new Error('MCP 启动操作缺少审批上下文，已拒绝执行')
  }
  await approve({ action, servers: starting })
}

/**
 * Ask before touching a plugin-registered server: its transport is not
 * readable, so a probe or restart may start a local command.
 */
async function approveRegisteredStart(approve, action, name) {
  if (approve === PANEL_APPROVAL) return
  if (typeof approve !== 'function') {
    throw new Error('MCP 启动操作缺少审批上下文，已拒绝执行')
  }
  await approve({ action, servers: [{ name, registered: true }] })
}

/**
 * Create several MCP servers in one config edit. Every input is validated and
 * approved before the write, so a bad entry leaves no partial configuration.
 */
export async function saveMcpBatch(ctx, inputs, approve) {
  if (!Array.isArray(inputs) || !inputs.length) throw new Error('servers 必须是非空数组')
  const service = manager(ctx)
  const configured = service.config.servers.get()
  const standaloneNames = new Set((await standaloneEntries(ctx)).map(candidate =>
    String(candidate.entry.options.config?.serverName || candidate.entry.options.id)))
  const seen = new Set()
  const servers = inputs.map(input => {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new Error('MCP 配置必须是对象')
    if (input.originalName) throw new Error('批量保存只能新建 MCP')
    const name = String(input.name || '').trim()
    const server = normalizeServer(input)
    if (seen.has(name)) throw new Error('批量保存中存在重复的 MCP 名称：' + name)
    seen.add(name)
    if (Object.hasOwn(configured, name) || standaloneNames.has(name)) throw new Error('同名 MCP 已存在：' + name)
    return { ...server, name }
  })
  await approveStart(approve, 'mcp_save', servers.filter(server => server.enabled))
  await edit(ctx, current => {
    for (const server of servers) {
      if (Object.hasOwn(current.servers, server.name)) throw new Error('同名 MCP 已存在：' + server.name)
      current.servers[server.name] = server
    }
    return current
  })
  return { saved: servers.map(server => ({ name: server.name, enabled: server.enabled })) }
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

export async function importMcp(ctx, selections, baseHome, enable = false, approve) {
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
    .map(server => ({ id: importId(server), name: server.name, server: normalizeServer({ ...server, enabled: enable === true }) }))
  const normalized = new Map(candidates.map(candidate => [candidate.id, candidate.server]))
  await approveStart(approve, 'mcp_import', candidates
    .filter(candidate => candidate.server.enabled)
    .map(candidate => ({ ...candidate.server, name: candidate.name })))
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

export async function toggleMcp(ctx, name, enabled, approve) {
  if (!validName(name)) throw new Error('无效的 MCP 名称')
  const configured = manager(ctx).config.servers.get()
  if (Object.hasOwn(configured, name)) {
    const approvedSignature = enabled === true ? startSignature(configured[name]) : ''
    if (enabled === true) await approveStart(approve, 'mcp_toggle', [{ ...configured[name], name }])
    await edit(ctx, current => {
      const entry = current.servers[name]
      if (!entry) throw new Error('MCP 不存在或已被移除')
      if (enabled === true && startSignature(entry) !== approvedSignature) {
        throw new Error('MCP 配置在审批期间已变化，操作未执行；请重新发起')
      }
      current.servers[name] = { ...entry, enabled: enabled === true }
      return current
    })
    return { name, enabled: enabled === true }
  }
  let target = await standaloneTarget(ctx, name)
  if (!target.pluginRow?.entryId || target.pluginRow.readOnlyReason !== undefined) {
    throw new Error('该独立 MCP 的插件条目不可管理')
  }
  if (enabled === true) {
    const config = target.entry.options.config || {}
    const approvedSignature = startSignature({ ...config, transport: config.transport || 'stdio' })
    await approveStart(approve, 'mcp_toggle', [{
      name, command: config.command, args: config.args,
      transport: config.transport || 'stdio',
    }])
    target = await standaloneTarget(ctx, name)
    if (!target.pluginRow?.entryId || target.pluginRow.readOnlyReason !== undefined) {
      throw new Error('该独立 MCP 的插件条目不可管理')
    }
    const currentConfig = target.entry.options.config || {}
    if (startSignature({ ...currentConfig, transport: currentConfig.transport || 'stdio' }) !== approvedSignature) {
      throw new Error('MCP 配置在审批期间已变化，操作未执行；请重新发起')
    }
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

  const target = await standaloneTarget(ctx, name)
  if (target.pluginRow?.readOnlyReason !== undefined) throw new Error('该独立 MCP 的插件条目不可管理')
  const { entry } = target
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

/** Delete selected MCPs one by one, keeping every outcome instead of stopping at the first failure. */
export async function deleteMcps(ctx, names, confirm) {
  if (confirm !== true) throw new Error('批量删除 MCP 需要明确确认')
  if (!Array.isArray(names) || !names.length) throw new Error('请选择要删除的 MCP')
  if (names.length > 50) throw new Error('一次最多删除 50 个 MCP')
  const unique = [...new Set(names.map(name => String(name ?? '').trim()).filter(Boolean))]
  if (!unique.length) throw new Error('请选择要删除的 MCP')
  const deleted = []
  const failed = []
  for (const name of unique) {
    try {
      const result = await deleteMcp(ctx, name, true)
      deleted.push(result)
    } catch (error) {
      failed.push({ name, error: error?.message || String(error) })
    }
  }
  return { deleted, failed, total: unique.length }
}

export async function testMcp(ctx, name, approve) {
  const service = manager(ctx)
  const configured = service.config.servers.get()
  const entry = Object.hasOwn(configured, name) ? configured[name] : undefined
  if (entry) {
    const approvedSignature = startSignature(entry)
    await approveStart(approve, 'mcp_test', [{ ...entry, name }])
    const current = service.config.servers.get()[name]
    if (!current || startSignature(current) !== approvedSignature) {
      throw new Error('MCP 配置在审批期间已变化，操作未执行；请重新发起')
    }
  } else if (service.list().some(view => view.name === name && view.configured === true)) {
    await approveRegisteredStart(approve, 'mcp_test', name)
  }
  return await service.probe(name)
}

export async function restartMcp(ctx, name, approve) {
  const service = manager(ctx)
  const configured = service.config.servers.get()
  const entry = Object.hasOwn(configured, name) ? configured[name] : undefined
  if (entry) {
    const approvedSignature = startSignature(entry)
    await approveStart(approve, 'mcp_restart', [{ ...entry, name }])
    const current = service.config.servers.get()[name]
    if (!current || startSignature(current) !== approvedSignature) {
      throw new Error('MCP 配置在审批期间已变化，操作未执行；请重新发起')
    }
  } else if (service.list().some(view => view.name === name && view.configured === true)) {
    await approveRegisteredStart(approve, 'mcp_restart', name)
  }
  await service.restart(name)
  return { name, restarted: true }
}

import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { listSkills, listProjectSkills, readSkill, createSkill, updateSkill, toggleSkill, deleteSkill, deleteSkills, importSkillZip, syncAgentSkills, previewAgentSkillSync, installSkillTakeover, invalidateSkillCatalog, dshHome } from './skills.js'
import { readSkillZip } from './zip.js'
import { createReleaseReader } from './releases.js'
import { listMcp, saveMcp, saveMcpBatch, toggleMcp, deleteMcp, deleteMcps, testMcp, restartMcp, listMcpImports, importMcp, PANEL_APPROVAL } from './mcp.js'
import { createUpdateManager } from './update.js'

export const name = 'capability-switch'
export const inject = ['tools', 'skills']

const BASE = '/__dsh-capability-switch'
const MAX_BODY = 1024 * 1024
const MAX_ZIP_BODY = 12 * 1024 * 1024

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readJson(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > limit) { reject(new Error('请求体超过 ' + Math.ceil(limit / 1024 / 1024) + ' MiB')); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text.trim()) return resolve({})
      try { resolve(JSON.parse(text)) } catch { reject(new Error('请求体不是合法 JSON')) }
    })
    req.on('error', reject)
  })
}

function currentProfile(ctx) {
  const fromEnvironment = process.env.DSH_PROFILE?.trim()
  if (fromEnvironment) return fromEnvironment
  const documentPath = ctx.get('configEditor')?.documentPath
  if (typeof documentPath !== 'string' || !documentPath) return null
  return basename(dirname(documentPath))
}

function workspaceRows(ctx) {
  const registry = ctx.get('workspaceRegistry')
  if (!registry) return []
  try {
    return registry.list().map(workspace => ({
      id: workspace.id,
      path: workspace.path,
      title: workspace.title,
    }))
  } catch {
    return []
  }
}

function expandHome(value) {
  if (value === '~') return homedir()
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(homedir(), value.slice(2))
  return value
}

async function canonicalWorkspacePath(input) {
  let current = resolve(input)
  const missing = []
  while (true) {
    try {
      const physical = await fs.realpath(current)
      return missing.length ? join(physical, ...missing) : physical
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error
      const parent = dirname(current)
      if (parent === current) return resolve(input)
      missing.unshift(basename(current))
      current = parent
    }
  }
}

function isPathWithin(root, target) {
  const fold = value => process.platform === 'win32' ? value.toLowerCase() : value
  const inside = relative(fold(root), fold(target))
  return inside === '' || (inside !== '..' && !inside.startsWith('..' + sep) && !isAbsolute(inside))
}

// A durable workspace belongs inside the session's workspace root or one of
// its explicit extra writable roots; platform temp areas are for file writes,
// not for registering a workspace.
async function workspacePathAuthorized(target, policy) {
  if (!policy) return false
  if (policy.mode === 'danger-full-access') return true
  if (policy.mode !== 'workspace-write') return false
  let canonicalTarget
  try { canonicalTarget = await canonicalWorkspacePath(target) } catch { return false }
  const roots = [
    policy.workspaceRoot,
    ...(Array.isArray(policy.additionalWritableRoots) ? policy.additionalWritableRoots : []),
  ].filter(root => typeof root === 'string' && isAbsolute(root))
  for (const root of roots) {
    try {
      if (isPathWithin(await canonicalWorkspacePath(root), canonicalTarget)) return true
    } catch {
      // A root that cannot be inspected grants nothing; try the next one.
    }
  }
  return false
}

function workspaceApprovalText(target, policy) {
  const mode = policy?.mode
  const reason = mode === 'read-only'
    ? `capability_manager workspace_create would create and register a workspace at ${target} under the session's read-only file policy.`
    : mode === 'workspace-write'
      ? `capability_manager workspace_create would create and register a workspace at ${target} outside the session's writable roots.`
      : `capability_manager workspace_create would create and register a workspace at ${target} without a resolvable session file policy.`
  const explanation = mode === 'read-only'
    ? '当前会话是只读文件策略'
    : mode === 'workspace-write'
      ? '该路径不在当前会话的可写目录范围内'
      : '当前无法确认会话的文件授权范围'
  const english = mode === 'read-only'
    ? 'this session\'s file policy is read-only'
    : mode === 'workspace-write'
      ? 'this path is outside the session\'s writable roots'
      : 'the session file policy could not be resolved'
  return {
    reason,
    displayReason: {
      en: `Allow the agent to create and register a workspace at ${target}? ${english}.`,
      zh: `允许 Agent 在 ${target} 创建并注册工作区？${explanation}。`,
    },
  }
}

function workspaceAuthorizer(ctx, exec) {
  return async target => {
    const agent = exec?.agent ?? ctx.get('agents')?.currentInitiator?.()
    let policy
    if (agent?.session) {
      try { policy = ctx.get('sandboxPolicy')?.resolve({ session: agent.session }) } catch { policy = undefined }
    }
    if (await workspacePathAuthorized(target, policy)) return
    const { reason, displayReason } = workspaceApprovalText(target, policy)
    await requestHostApproval(ctx, exec, { subject: '工作区创建', reason, displayReason })
  }
}

async function createWorkspace(ctx, input = {}, authorize) {
  const name = String(input.name || '').trim()
  if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
    throw new Error('工作区名称不能包含路径分隔符')
  }
  const rawParent = String(input.parent || '').trim() || join(homedir(), 'Documents')
  const parent = resolve(expandHome(rawParent))
  if (!isAbsolute(expandHome(rawParent))) throw new Error('工作区父目录必须是绝对路径')
  const target = resolve(parent, name)
  if (dirname(target) !== parent) throw new Error('工作区路径不合法')
  if (authorize !== PANEL_APPROVAL) {
    if (typeof authorize !== 'function') throw new Error('工作区创建缺少文件授权上下文，已拒绝执行')
    await authorize(target)
  }
  await fs.mkdir(target, { recursive: true })
  const registry = ctx.get('workspaceRegistry')
  if (!registry) throw new Error('当前 DSH 未提供工作区注册服务')
  const workspace = await registry.create(target, String(input.title || name).trim() || name)
  return { ok: true, workspace: { id: workspace.id, path: workspace.path, title: workspace.title }, workspaces: workspaceRows(ctx) }
}

async function resolveSessionCwd(ctx, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null
  const agent = ctx.get('agents')?.get(sessionId)
  const workingDirectory = ctx.get('workingDirectory')
  if (agent && workingDirectory) {
    try { return await workingDirectory.ensure(agent) } catch { return null }
  }
  const sessionQuery = ctx.get('sessionQuery')
  if (!sessionQuery) return null
  try {
    const observation = await sessionQuery.observeSession(sessionId)
    try {
      return observation.projections?.values?.workingDirectory || observation.header?.cwd || null
    } finally {
      // DSH 0.2.3 observes with a synchronous Disposable lease; older builds
      // exposed an async disposer. Release whichever one this Host provides.
      if (typeof observation?.[Symbol.asyncDispose] === 'function') await observation[Symbol.asyncDispose]()
      else observation?.[Symbol.dispose]?.()
    }
  } catch {
    return null
  }
}

function requestSessionId(req) {
  const value = req.headers?.['x-dsh-session-id']
  return Array.isArray(value) ? value[0] : value
}

async function currentAgentCwd(ctx) {
  const agent = ctx.get('agents')?.currentInitiator?.()
  const workingDirectory = ctx.get('workingDirectory')
  if (!agent || !workingDirectory) return null
  try { return await workingDirectory.ensure(agent) } catch { return null }
}

function isRegisteredWorkspace(ctx, cwd) {
  if (typeof cwd !== 'string' || !cwd.trim()) return false
  const requested = resolve(cwd)
  return workspaceRows(ctx).some(workspace => resolve(workspace.path) === requested)
}

function projectCreateCwd(ctx, body, sessionCwd) {
  if (body.scope !== 'project') return undefined
  return isRegisteredWorkspace(ctx, body.cwd) ? resolve(body.cwd) : sessionCwd
}

function requestedWorkspaceCwd(ctx, requestedCwd, sessionCwd) {
  return isRegisteredWorkspace(ctx, requestedCwd) ? resolve(requestedCwd) : sessionCwd
}

async function state(ctx, cwd, includeWorkspaces = true, updates = null) {
  let mcp = []
  let mcpError
  try { mcp = await listMcp(ctx) } catch (error) { mcpError = error.message }
  const skills = await listSkills(cwd)
  const workspaces = workspaceRows(ctx)
  const currentWorkspacePath = typeof cwd === 'string' && cwd.trim() ? resolve(cwd) : null
  const currentWorkspace = workspaces.find(workspace => resolve(workspace.path) === currentWorkspacePath)
  for (const row of skills) {
    if (row.scope !== 'project') continue
    if (currentWorkspace?.id !== undefined) row.workspaceId = currentWorkspace.id
    row.workspaceTitle = currentWorkspace?.title || basename(currentWorkspacePath || '')
    row.workspacePath = currentWorkspacePath
  }
  const otherWorkspaces = includeWorkspaces
    ? workspaces.filter(workspace => !currentWorkspacePath || resolve(workspace.path) !== currentWorkspacePath)
    : []
  const otherResults = await Promise.all(otherWorkspaces.map(async workspace => {
    try {
      return { workspace, rows: await listProjectSkills(workspace.path) }
    } catch (error) {
      return { workspace, error: error?.message || String(error) }
    }
  }))
  const skillWarnings = []
  for (const result of otherResults) {
    if (result.error) {
      skillWarnings.push({ workspaceId: result.workspace.id, workspaceTitle: result.workspace.title, workspacePath: result.workspace.path, error: result.error })
      continue
    }
    for (const row of result.rows) {
      skills.push({
        ...row,
        workspaceId: result.workspace.id,
        workspaceTitle: result.workspace.title,
        workspacePath: result.workspace.path,
        writable: row.writable,
        crossWorkspace: true,
        ...(row.writable ? {} : { readOnlyReason: 'other-workspace-readonly' }),
      })
    }
  }
  return {
    ok: true, skills, mcp, skillWarnings, ...(mcpError === undefined ? {} : { mcpError }),
    ...(updates ? { update: updates.status() } : {}),
    dshHome: dshHome(), home: homedir(), userSkillsRoot: join(dshHome(), 'skills'), profile: currentProfile(ctx),
    workspace: currentWorkspacePath,
    workspaces,
  }
}

const MCP_APPROVAL_LABELS = {
  mcp_save: { zh: '保存并启动', en: 'save and start' },
  mcp_toggle: { zh: '启用', en: 'enable' },
  mcp_restart: { zh: '重启', en: 'restart' },
  mcp_test: { zh: '连接测试并启动', en: 'probe and start' },
  mcp_import: { zh: '导入并启用', en: 'import and enable' },
}

function commandText(server) {
  const text = [server.command, ...(Array.isArray(server.args) ? server.args : [])]
    .map(value => String(value ?? '')).filter(Boolean).join(' ')
  return text.length > 160 ? text.slice(0, 157) + '...' : text
}

function mcpApprovalText(request) {
  const label = MCP_APPROVAL_LABELS[request.action] || { zh: '操作', en: 'operate' }
  const servers = Array.isArray(request.servers) ? request.servers : []
  const shown = servers.slice(0, 5)
  const registered = server => server?.registered === true
  const zhDetails = shown.map(server => {
    if (registered(server)) return `${server.name}（由其他插件注册，传输类型未知）`
    const command = commandText(server)
    return command ? `${server.name}（${command}）` : `${server.name}（未配置命令）`
  }).join('、') + (servers.length > shown.length ? ` 等 ${servers.length} 个` : '')
  const enDetails = shown.map(server => {
    if (registered(server)) return `${server.name} (registered by another plugin; transport unknown)`
    const command = commandText(server)
    return command ? `${server.name} (${command})` : `${server.name} (no command configured)`
  }).join(', ') + (servers.length > shown.length ? ` and ${servers.length - shown.length} more` : '')
  const hasRegistered = servers.some(registered)
  const names = servers.map(server => server.name).join(', ')
  return {
    reason: hasRegistered
      ? `capability_manager ${request.action} would probe or restart plugin-registered MCP servers (${names}); a stdio server starts a local command with the user's privileges.`
      : `capability_manager ${request.action} would start local stdio MCP commands (${names}), which run with the user's privileges.`,
    displayReason: {
      en: `Allow the agent to ${label.en} MCP ${enDetails}? ${hasRegistered
        ? 'This connects to the registered server; a stdio server executes a local command with your privileges.'
        : 'This executes a local command with your privileges.'}`,
      zh: `允许 Agent ${label.zh} MCP ${zhDetails}？${hasRegistered
        ? '这会连接插件注册的服务；如果它是 stdio 服务，会以你的权限执行本机命令。'
        : '这会以你的权限执行本机命令。'}`,
    },
  }
}

async function requestHostApproval(ctx, exec, request) {
  const approval = ctx.get('approval')
  const agent = exec?.agent ?? ctx.get('agents')?.currentInitiator?.()
  if (!approval || typeof approval.request !== 'function') {
    throw new Error(request.subject + '需要宿主审批，但当前 DSH 没有可用的审批服务，操作未执行')
  }
  if (!agent) {
    throw new Error(request.subject + '需要宿主审批，但当前调用没有可路由的 Agent，操作未执行')
  }
  if (exec?.signal?.aborted) exec.signal.throwIfAborted()
  const outcome = await approval.request({
    agent,
    toolName: 'capability_manager',
    ...(exec?.callId === undefined ? {} : { callId: exec.callId }),
    reason: request.reason,
    displayReason: request.displayReason,
    ...(exec?.signal === undefined ? {} : { signal: exec.signal }),
  })
  switch (outcome) {
    case 'allowed-once': return
    case 'rejected':
      throw new Error('宿主未批准' + request.subject + '（审批被拒绝，或当前会话不提供审批提示），未执行；请说明情况后由用户决定是否改用面板操作')
    case 'cancelled':
      exec?.signal?.throwIfAborted()
      throw new Error(request.subject + '的宿主审批已取消，未执行')
    case 'unavailable':
      throw new Error(request.subject + '需要宿主审批，但没有可用的审批通道，操作未执行')
    default:
      throw new Error(request.subject + '的宿主审批返回未知结果，操作未执行')
  }
}

function mcpApprover(ctx, exec) {
  return async request => {
    const { reason, displayReason } = mcpApprovalText(request)
    await requestHostApproval(ctx, exec, { subject: 'MCP 操作', reason, displayReason })
  }
}

function tool(ctx, updates) {
  const mutateSkill = async operation => {
    const result = await operation()
    invalidateSkillCatalog(ctx)
    return result
  }
  return {
    name: 'capability_manager',
    description: '管理 DSH 的 Skills、工作区与 MCP。list 查看；workspace_create 新建并注册工作区；skill_create/update/toggle/delete 管理用户级和项目级技能，skill_create 用 scope 选择 user 或 project，project 写入所选已注册工作区的 .agents/skills，省略工作区时使用当前 Agent 工作区；同步默认创建软链接，也可用 mode=copy 创建独立副本；软链接删除只移除 DSH 链接并保留 Agent 源文件；skill_sync_preview/skill_sync 预览并同步 Agent 目录；mcp_save/toggle/delete/test/restart 管理当前 profile 的 MCP，mcp_import_list/mcp_import 预览并从其他应用导入。删除必须 confirm=true。workspace_create 在会话可写范围外创建并注册工作区，以及保存并启动、启用、重启、连接测试和导入并启用 stdio MCP 时会请求宿主审批，未获批准则不执行。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'workspace_create', 'skill_read', 'skill_create', 'skill_update', 'skill_toggle', 'skill_delete', 'skill_sync_preview', 'skill_sync', 'mcp_save', 'mcp_toggle', 'mcp_delete', 'mcp_test', 'mcp_restart', 'mcp_import_list', 'mcp_import'] },
        cwd: { type: 'string', description: '项目技能所在工作区；必须是已注册工作区，省略时使用当前 Agent 工作目录' },
        scope: { type: 'string', enum: ['user', 'project'], description: 'skill_create 的技能范围，默认 user；project 写入所选或当前工作区的 .agents/skills' },
        path: { type: 'string', description: '技能入口文件路径' },
        text: { type: 'string', description: '完整 SKILL.md 内容' },
        name: { type: 'string', description: '技能名、MCP 名称或新工作区名称' },
        parent: { type: 'string', description: 'workspace_create 的父目录，默认 ~/Documents；会话可写范围外会请求宿主审批' },
        selections: { type: 'array', items: { type: 'string' }, description: 'mcp_import 要导入的预览条目 ID 列表；预览后配置变化会拒绝导入' },
        names: { type: 'array', items: { type: 'string' }, description: 'skill_sync 要同步的技能名称列表；省略同步预览中的全部变更' },
        mode: { type: 'string', enum: ['symlink', 'copy'], description: 'skill_sync 模式：默认 symlink 软链接，copy 复制独立副本' },
        description: { type: 'string', description: '技能描述' },
        body: { type: 'string', description: '技能正文' },
        enabled: { type: 'boolean', description: 'mcp_toggle 的目标状态和 mcp_import 的导入后立即启用开关；mcp_save 以 server.enabled 为准，省略时默认启用' },
        confirm: { type: 'boolean' },
        server: { type: 'object', description: 'mcp_save 的完整服务器配置；启用状态写在其 enabled 字段' },
      },
      required: ['action'],
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    execute: async (args, exec) => {
      const approve = mcpApprover(ctx, exec)
      const trustedCwd = await currentAgentCwd(ctx)
      const requestedCwd = isRegisteredWorkspace(ctx, args.cwd) ? resolve(args.cwd) : trustedCwd
      switch (args.action) {
        case 'list': return await state(ctx, trustedCwd, true, updates)
        case 'workspace_create': return await createWorkspace(ctx, { name: args.name, parent: args.parent }, workspaceAuthorizer(ctx, exec))
        case 'skill_read': return await readSkill(args.path, requestedCwd)
        case 'skill_create': return await mutateSkill(() => createSkill({ ...args, cwd: projectCreateCwd(ctx, args, requestedCwd) }))
        case 'skill_update': return await mutateSkill(() => updateSkill(args.path, args.text, requestedCwd))
        case 'skill_toggle': return await mutateSkill(() => toggleSkill(args.path, args.enabled === true, requestedCwd))
        case 'skill_delete': return await mutateSkill(() => deleteSkill(args.path, args.confirm, requestedCwd))
        case 'skill_sync_preview': return await previewAgentSkillSync(args.mode)
        case 'skill_sync': return await mutateSkill(() => syncAgentSkills(undefined, args.names, args.mode))
        case 'mcp_save': return await saveMcp(ctx, { ...(args.server || {}), name: args.name || args.server?.name }, approve)
        case 'mcp_toggle': return await toggleMcp(ctx, args.name, args.enabled, approve)
        case 'mcp_delete': return await deleteMcp(ctx, args.name, args.confirm)
        case 'mcp_test': return await testMcp(ctx, args.name, approve)
        case 'mcp_restart': return await restartMcp(ctx, args.name, approve)
        case 'mcp_import_list': return await listMcpImports(ctx)
        case 'mcp_import': return await importMcp(ctx, args.selections, undefined, args.enabled === true, approve)
        default: throw new Error('未知 action')
      }
    },
  }
}

export function apply(ctx) {
  const updates = createUpdateManager(ctx)
  const releases = createReleaseReader()
  ctx.effect(() => installSkillTakeover(ctx), 'capability-switch: DSH skill takeover')
  invalidateSkillCatalog(ctx)
  ctx.effect(() => ctx.tools.register(tool(ctx, updates)), 'capability-switch: agent tool')
  ctx.effect(() => updates.start(), 'capability-switch: auto update')

  const routes = [
    ['GET', '/state', async (_req, url, sessionCwd) => await state(ctx, sessionCwd || url.searchParams.get('cwd'), url.searchParams.get('workspaces') !== '0', updates)],
    ['GET', '/skill', async (_req, url, sessionCwd) => await readSkill(url.searchParams.get('path'), requestedWorkspaceCwd(ctx, url.searchParams.get('cwd'), sessionCwd))],
    ['POST', '/skill/create', async (body, _url, sessionCwd) => await createSkill({ ...body, cwd: projectCreateCwd(ctx, body, sessionCwd) })],
    ['POST', '/workspace/create', async body => await createWorkspace(ctx, body, PANEL_APPROVAL)],
    ['POST', '/skill/update', async (body, _url, sessionCwd) => await updateSkill(body.path, body.text, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['POST', '/skill/toggle', async (body, _url, sessionCwd) => await toggleSkill(body.path, body.enabled === true, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['POST', '/skill/delete', async (body, _url, sessionCwd) => await deleteSkill(body.path, body.confirm, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['POST', '/skill/delete-batch', async (body, _url, sessionCwd) => await deleteSkills((Array.isArray(body.items) ? body.items : []).map(item => ({ path: item?.path, cwd: requestedWorkspaceCwd(ctx, item?.cwd, sessionCwd) })), body.confirm)],
    ['POST', '/skill/parse-zip', async body => {
      const encoded = typeof body.zip === 'string' ? body.zip : ''
      if (!encoded) throw new Error('缺少 ZIP 文件内容')
      const pkg = readSkillZip(Buffer.from(encoded, 'base64'))
      return { name: pkg.name, description: pkg.description, body: pkg.body, fileCount: pkg.fileCount, files: pkg.files.map(file => ({ path: file.path, size: file.data.length })) }
    }],
    ['POST', '/skill/import-zip', async (body, _url, sessionCwd) => await importSkillZip({ ...body, cwd: projectCreateCwd(ctx, body, sessionCwd) })],
    ['GET', '/skill/sync-preview', async (_req, url) => await previewAgentSkillSync(url.searchParams.get('mode') || 'symlink')],
    ['POST', '/skill/sync', async body => await syncAgentSkills(undefined, body.names, body.mode || 'symlink')],
    ['GET', '/mcp/imports', async () => await listMcpImports(ctx)],
    ['POST', '/mcp/import', async body => await importMcp(ctx, body.selections, undefined, body.enabled === true, PANEL_APPROVAL)],
    ['POST', '/mcp/save', async body => await saveMcp(ctx, body, PANEL_APPROVAL)],
    ['POST', '/mcp/save-batch', async body => await saveMcpBatch(ctx, body.servers, PANEL_APPROVAL)],
    ['POST', '/mcp/toggle', async body => await toggleMcp(ctx, body.name, body.enabled, PANEL_APPROVAL)],
    ['POST', '/mcp/delete', async body => await deleteMcp(ctx, body.name, body.confirm)],
    ['POST', '/mcp/delete-batch', async body => await deleteMcps(ctx, body.names, body.confirm)],
    ['POST', '/mcp/test', async body => await testMcp(ctx, body.name, PANEL_APPROVAL)],
    ['POST', '/mcp/restart', async body => await restartMcp(ctx, body.name, PANEL_APPROVAL)],
    ['POST', '/update/config', async body => await updates.setAutoUpdate(body.autoUpdate === true)],
    ['POST', '/update/check', async () => await updates.check()],
    ['POST', '/update/apply', async body => await updates.apply(body.version)],
    ['GET', '/releases', async (_req, url) => await releases.load({ refresh: url.searchParams.get('refresh') === '1', lang: url.searchParams.get('lang') || 'en' })],
  ]

  const skillMutationPaths = new Set(['/skill/create', '/skill/update', '/skill/toggle', '/skill/delete', '/skill/delete-batch', '/skill/import-zip', '/skill/sync'])
  const sessionPaths = new Set(['/state', '/skill', '/skill/create', '/skill/update', '/skill/toggle', '/skill/delete', '/skill/delete-batch', '/skill/import-zip'])
  const register = (webServer, scope) => {
    for (const [method, suffix, handler] of routes) {
      scope.effect(() => webServer.register({
        kind: 'exact', path: BASE + suffix, auth: 'required',
        handler: async (req, res) => {
          if ((req.method || 'GET').toUpperCase() !== method) return send(res, 405, { ok: false, error: '请求方法不匹配' })
          try {
            const url = new URL(req.url || BASE + suffix, 'http://127.0.0.1')
            const sessionCwd = sessionPaths.has(suffix) ? await resolveSessionCwd(scope, requestSessionId(req)) : null
            const limit = suffix === '/skill/parse-zip' || suffix === '/skill/import-zip' ? MAX_ZIP_BODY : MAX_BODY
            const payload = await handler(method === 'POST' ? await readJson(req, limit) : req, url, sessionCwd)
            if (skillMutationPaths.has(suffix)) invalidateSkillCatalog(scope)
            send(res, 200, payload?.ok === true ? payload : { ok: true, ...(payload || {}) })
          } catch (error) {
            send(res, 400, { ok: false, error: error?.message || String(error) })
          }
        },
      }), 'capability-switch: ' + method + ' ' + suffix)
    }
  }

  const webServer = ctx.get('webServer')
  if (webServer) register(webServer, ctx)
  else ctx.inject(['webServer'], scope => register(scope.webServer, scope))
}

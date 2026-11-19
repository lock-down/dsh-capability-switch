import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { listSkills, listProjectSkills, readSkill, createSkill, updateSkill, toggleSkill, deleteSkill, syncAgentSkills, previewAgentSkillSync, installSkillTakeover, invalidateSkillCatalog, dshHome } from './skills.js'
import { listMcp, saveMcp, toggleMcp, deleteMcp, testMcp, restartMcp, listMcpImports, importMcp } from './mcp.js'

export const name = 'capability-switch'
export const inject = ['tools', 'skills']

const BASE = '/__dsh-capability-switch'
const MAX_BODY = 1024 * 1024

export function normalizePreferences(value = {}) {
  return {
    sidebarVisible: true,
    sidebarLabel: '技能与MCP',
    defaultTab: value.defaultTab === 'mcp' ? 'mcp' : 'skills',
    showDescriptions: true,
    compactRows: true,
  }
}

function requestRejection(scope, req) {
  const connection = scope.get('connection')
  if (!connection || typeof connection.requestRejection !== 'function') return 403
  try {
    return connection.requestRejection(req) ?? undefined
  } catch {
    return 403
  }
}

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > MAX_BODY) { reject(new Error('请求体超过 1 MiB')); req.destroy(); return }
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

async function createWorkspace(ctx, input = {}) {
  const name = String(input.name || '').trim()
  if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
    throw new Error('工作区名称不能包含路径分隔符')
  }
  const rawParent = String(input.parent || '').trim() || join(homedir(), 'Documents')
  const parent = resolve(expandHome(rawParent))
  if (!isAbsolute(expandHome(rawParent))) throw new Error('工作区父目录必须是绝对路径')
  const target = resolve(parent, name)
  if (dirname(target) !== parent) throw new Error('工作区路径不合法')
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
      await observation[Symbol.asyncDispose]?.()
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

async function state(ctx, prefs, cwd) {
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
  const otherWorkspaces = workspaces.filter(workspace => !currentWorkspacePath || resolve(workspace.path) !== currentWorkspacePath)
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
    prefs, dshHome: dshHome(), home: homedir(), userSkillsRoot: join(dshHome(), 'skills'), profile: currentProfile(ctx),
    workspace: currentWorkspacePath,
    workspaces,
  }
}

function tool(ctx, prefs) {
  const mutateSkill = async operation => {
    const result = await operation()
    invalidateSkillCatalog(ctx)
    return result
  }
  return {
    name: 'capability_manager',
    description: '管理 DSH 的 Skills、工作区与 MCP。list 查看；workspace_create 新建并注册工作区；skill_create/update/toggle/delete 管理用户级和项目级技能，skill_create 用 scope 选择 user 或 project，project 写入所选已注册工作区的 .agents/skills，省略工作区时使用当前 Agent 工作区；同步软链接删除只移除 DSH 链接而保留 Agent 源文件，编辑会写回源文件；skill_sync_preview/skill_sync 预览并同步 Agent 目录；mcp_save/toggle/delete/test/restart 管理当前 profile 的 MCP，mcp_import_list/mcp_import 预览并从其他应用导入。删除必须 confirm=true。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'workspace_create', 'skill_read', 'skill_create', 'skill_update', 'skill_toggle', 'skill_delete', 'skill_sync_preview', 'skill_sync', 'mcp_save', 'mcp_toggle', 'mcp_delete', 'mcp_test', 'mcp_restart', 'mcp_import_list', 'mcp_import'] },
        cwd: { type: 'string', description: '项目技能所在工作区；必须是已注册工作区，省略时使用当前 Agent 工作目录' },
        scope: { type: 'string', enum: ['user', 'project'], description: 'skill_create 的技能范围，默认 user；project 写入所选或当前工作区的 .agents/skills' },
        path: { type: 'string', description: '技能入口文件路径' },
        text: { type: 'string', description: '完整 SKILL.md 内容' },
        name: { type: 'string', description: '技能名、MCP 名称或新工作区名称' },
        parent: { type: 'string', description: 'workspace_create 的父目录，默认 ~/Documents' },
        selections: { type: 'array', items: { type: 'string' }, description: 'mcp_import 要导入的预览条目 ID 列表；预览后配置变化会拒绝导入' },
        names: { type: 'array', items: { type: 'string' }, description: 'skill_sync 要同步的技能名称列表；省略同步预览中的全部变更' },
        description: { type: 'string', description: '技能描述' },
        body: { type: 'string', description: '技能正文' },
        enabled: { type: 'boolean' },
        confirm: { type: 'boolean' },
        server: { type: 'object', description: 'mcp_save 的完整服务器配置' },
      },
      required: ['action'],
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    execute: async args => {
      const trustedCwd = await currentAgentCwd(ctx)
      const requestedCwd = isRegisteredWorkspace(ctx, args.cwd) ? resolve(args.cwd) : trustedCwd
      switch (args.action) {
        case 'list': return await state(ctx, prefs, trustedCwd)
        case 'workspace_create': return await createWorkspace(ctx, { name: args.name, parent: args.parent })
        case 'skill_read': return await readSkill(args.path, requestedCwd)
        case 'skill_create': return await mutateSkill(() => createSkill({ ...args, cwd: projectCreateCwd(ctx, args, requestedCwd) }))
        case 'skill_update': return await mutateSkill(() => updateSkill(args.path, args.text, requestedCwd))
        case 'skill_toggle': return await mutateSkill(() => toggleSkill(args.path, args.enabled === true, requestedCwd))
        case 'skill_delete': return await mutateSkill(() => deleteSkill(args.path, args.confirm, requestedCwd))
        case 'skill_sync_preview': return await previewAgentSkillSync()
        case 'skill_sync': return await mutateSkill(() => syncAgentSkills(undefined, args.names))
        case 'mcp_save': return await saveMcp(ctx, { ...(args.server || {}), name: args.name || args.server?.name })
        case 'mcp_toggle': return await toggleMcp(ctx, args.name, args.enabled)
        case 'mcp_delete': return await deleteMcp(ctx, args.name, args.confirm)
        case 'mcp_test': return await testMcp(ctx, args.name)
        case 'mcp_restart': return await restartMcp(ctx, args.name)
        case 'mcp_import_list': return await listMcpImports(ctx)
        case 'mcp_import': return await importMcp(ctx, args.selections, undefined, args.enabled === true)
        default: throw new Error('未知 action')
      }
    },
  }
}

export function apply(ctx, config = {}) {
  const prefs = normalizePreferences(config)
  ctx.effect(() => installSkillTakeover(ctx), 'capability-switch: DSH skill takeover')
  invalidateSkillCatalog(ctx)
  ctx.effect(() => ctx.tools.register(tool(ctx, prefs)), 'capability-switch: agent tool')

  const routes = [
    ['GET', '/state', async (_req, url, sessionCwd) => await state(ctx, prefs, sessionCwd || url.searchParams.get('cwd'))],
    ['GET', '/skill', async (_req, url, sessionCwd) => await readSkill(url.searchParams.get('path'), requestedWorkspaceCwd(ctx, url.searchParams.get('cwd'), sessionCwd))],
    ['POST', '/skill/create', async (body, _url, sessionCwd) => await createSkill({ ...body, cwd: projectCreateCwd(ctx, body, sessionCwd) })],
    ['POST', '/workspace/create', async body => await createWorkspace(ctx, body)],
    ['POST', '/skill/update', async (body, _url, sessionCwd) => await updateSkill(body.path, body.text, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['POST', '/skill/toggle', async (body, _url, sessionCwd) => await toggleSkill(body.path, body.enabled === true, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['POST', '/skill/delete', async (body, _url, sessionCwd) => await deleteSkill(body.path, body.confirm, requestedWorkspaceCwd(ctx, body.cwd, sessionCwd))],
    ['GET', '/skill/sync-preview', async () => await previewAgentSkillSync()],
    ['POST', '/skill/sync', async body => await syncAgentSkills(undefined, body.names)],
    ['GET', '/mcp/imports', async () => await listMcpImports(ctx)],
    ['POST', '/mcp/import', async body => await importMcp(ctx, body.selections, undefined, body.enabled === true)],
    ['POST', '/mcp/save', async body => await saveMcp(ctx, body)],
    ['POST', '/mcp/toggle', async body => await toggleMcp(ctx, body.name, body.enabled)],
    ['POST', '/mcp/delete', async body => await deleteMcp(ctx, body.name, body.confirm)],
    ['POST', '/mcp/test', async body => await testMcp(ctx, body.name)],
    ['POST', '/mcp/restart', async body => await restartMcp(ctx, body.name)],
  ]

  const skillMutationPaths = new Set(['/skill/create', '/skill/update', '/skill/toggle', '/skill/delete', '/skill/sync'])
  const sessionPaths = new Set(['/state', '/skill', '/skill/create', '/skill/update', '/skill/toggle', '/skill/delete'])
  const register = (webServer, scope) => {
    for (const [method, suffix, handler] of routes) {
      scope.effect(() => webServer.register({
        kind: 'exact', path: BASE + suffix,
        handler: async (req, res) => {
          const rejection = requestRejection(scope, req)
          if (rejection !== undefined) return send(res, rejection, { ok: false, error: 'DSH 连接鉴权拒绝' })
          if ((req.method || 'GET').toUpperCase() !== method) return send(res, 405, { ok: false, error: '请求方法不匹配' })
          try {
            const url = new URL(req.url || BASE + suffix, 'http://127.0.0.1')
            const sessionCwd = sessionPaths.has(suffix) ? await resolveSessionCwd(scope, requestSessionId(req)) : null
            const payload = await handler(method === 'POST' ? await readJson(req) : req, url, sessionCwd)
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

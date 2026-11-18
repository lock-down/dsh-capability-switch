import { listSkills, readSkill, createSkill, updateSkill, toggleSkill, deleteSkill, syncAgentSkills, previewAgentSkillSync, installSkillTakeover, invalidateSkillCatalog, dshHome } from './skills.js'
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

async function state(ctx, prefs, cwd) {
  let mcp = []
  let mcpError
  try { mcp = await listMcp(ctx) } catch (error) { mcpError = error.message }
  const skills = await listSkills(cwd)
  return {
    ok: true, skills, mcp, ...(mcpError === undefined ? {} : { mcpError }),
    prefs, dshHome: dshHome(), profile: process.env.DSH_PROFILE || null,
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
    description: '管理 DSH 的 Skills 与 MCP。list 查看；skill_create/update/toggle/delete 管理用户级技能，同步软链接删除只移除 DSH 链接而保留 Agent 源文件，编辑会写回源文件；skill_sync_preview/skill_sync 预览并同步 Agent 目录；mcp_save/toggle/delete/test/restart 管理当前 profile 的 MCP，mcp_import_list/mcp_import 预览并从其他应用导入。删除必须 confirm=true。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'skill_read', 'skill_create', 'skill_update', 'skill_toggle', 'skill_delete', 'skill_sync_preview', 'skill_sync', 'mcp_save', 'mcp_toggle', 'mcp_delete', 'mcp_test', 'mcp_restart', 'mcp_import_list', 'mcp_import'] },
        cwd: { type: 'string', description: '当前工作目录，仅用于读取项目技能' },
        path: { type: 'string', description: '技能入口文件路径' },
        text: { type: 'string', description: '完整 SKILL.md 内容' },
        name: { type: 'string', description: '技能名或 MCP 名称' },
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
      switch (args.action) {
        case 'list': return await state(ctx, prefs, args.cwd)
        case 'skill_read': return await readSkill(args.path, args.cwd)
        case 'skill_create': return await mutateSkill(() => createSkill(args))
        case 'skill_update': return await mutateSkill(() => updateSkill(args.path, args.text, args.cwd))
        case 'skill_toggle': return await mutateSkill(() => toggleSkill(args.path, args.enabled === true, args.cwd))
        case 'skill_delete': return await mutateSkill(() => deleteSkill(args.path, args.confirm, args.cwd))
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
    ['GET', '/state', async (_req, url) => await state(ctx, prefs, url.searchParams.get('cwd'))],
    ['GET', '/skill', async (_req, url) => await readSkill(url.searchParams.get('path'), url.searchParams.get('cwd'))],
    ['POST', '/skill/create', async body => await createSkill(body)],
    ['POST', '/skill/update', async body => await updateSkill(body.path, body.text, body.cwd)],
    ['POST', '/skill/toggle', async body => await toggleSkill(body.path, body.enabled === true, body.cwd)],
    ['POST', '/skill/delete', async body => await deleteSkill(body.path, body.confirm, body.cwd)],
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
            const payload = await handler(method === 'POST' ? await readJson(req) : req, url)
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

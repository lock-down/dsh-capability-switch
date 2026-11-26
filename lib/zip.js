import { unzipSync, strFromU8 } from 'fflate'
import { parse as parseYaml } from 'yaml'

export const MAX_ZIP_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_BYTES = 20 * 1024 * 1024
const MAX_FILES = 200
const MAX_ENTRY_BYTES = 2 * 1024 * 1024
const MAX_SKILL_BYTES = 1024 * 1024
const SKILL_NAME = /^[a-z0-9][a-z0-9-_]{0,63}$/

function isJunk(name) {
  return name === '__MACOSX' || name.startsWith('__MACOSX/')
    || name === '.DS_Store' || name.endsWith('/.DS_Store')
    || name === 'Thumbs.db' || name.endsWith('/Thumbs.db')
}

/** Normalize one archive entry and reject anything that could escape the target directory. */
function normalizeEntry(raw) {
  if (typeof raw !== 'string' || !raw || raw.includes('\0')) throw new Error('ZIP 包含无效文件名')
  let name = raw.replaceAll('\\', '/')
  if (name.endsWith('/')) return null
  if (name.startsWith('/') || /^[A-Za-z]:/.test(name)) throw new Error('ZIP 包含绝对路径：' + raw)
  const parts = name.split('/').filter(Boolean)
  if (!parts.length) return null
  if (parts.some(part => part === '.' || part === '..')) throw new Error('ZIP 包含目录穿越路径：' + raw)
  if (parts.some(part => part.includes(':'))) throw new Error('ZIP 包含不支持的路径字符：' + raw)
  name = parts.join('/')
  if (isJunk(name)) return null
  return name
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (!match) throw new Error('SKILL.md 缺少 YAML frontmatter')
  let value
  try { value = parseYaml(match[1]) } catch { throw new Error('SKILL.md frontmatter 不是合法 YAML') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SKILL.md frontmatter 必须是对象')
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  return { name, description, body: text.slice(match[0].length) }
}

/**
 * Parse and validate a skill package without writing anything.
 * A package is either SKILL.md at the archive root, or exactly one
 * `<directory>/SKILL.md`; every accepted entry must stay inside that directory.
 */
export function readSkillZip(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length) throw new Error('ZIP 文件为空')
  if (bytes.length > MAX_ZIP_BYTES) throw new Error('ZIP 文件不能超过 8 MiB')

  const state = { total: 0, count: 0, error: null }
  let entries
  try {
    entries = unzipSync(bytes, {
      filter: info => {
        try {
          const name = normalizeEntry(info.name)
          if (name === null) return false
          if (info.originalSize > MAX_ENTRY_BYTES) throw new Error('ZIP 单个文件不能超过 2 MiB：' + name)
          state.total += info.originalSize
          if (state.total > MAX_TOTAL_BYTES) throw new Error('ZIP 解压后总大小不能超过 20 MiB')
          state.count += 1
          if (state.count > MAX_FILES) throw new Error('ZIP 文件数量不能超过 200 个')
          return true
        } catch (error) {
          state.error = error
          return false
        }
      },
    })
  } catch (error) {
    throw new Error('ZIP 解析失败：' + (error?.message || String(error)))
  }
  if (state.error) throw state.error

  const files = []
  for (const [raw, data] of Object.entries(entries)) {
    const path = normalizeEntry(raw)
    if (!path) continue
    files.push({ path, data })
  }
  if (!files.length) throw new Error('ZIP 中没有可用文件')

  const rootSkill = files.some(file => file.path === 'SKILL.md')
  const nested = files.map(file => file.path).filter(path => /^[^/]+\/SKILL\.md$/.test(path))
  if (rootSkill && nested.length) throw new Error('ZIP 同时包含根目录和子目录的 SKILL.md')
  let prefix = ''
  if (!rootSkill) {
    if (nested.length !== 1) throw new Error('ZIP 必须包含一个 SKILL.md，可在根目录或单层目录中')
    prefix = nested[0].slice(0, -'SKILL.md'.length)
  }

  const packageFiles = []
  for (const file of files) {
    if (prefix && !file.path.startsWith(prefix)) throw new Error('ZIP 包含技能目录之外的文件：' + file.path)
    const path = prefix ? file.path.slice(prefix.length) : file.path
    if (!path || path.startsWith('/') || path.split('/').some(part => part === '..')) throw new Error('ZIP 包含无效路径：' + file.path)
    packageFiles.push({ path, data: file.data })
  }
  const skillEntries = packageFiles.filter(file => file.path === 'SKILL.md' || file.path.endsWith('/SKILL.md'))
  if (skillEntries.length !== 1 || skillEntries[0].path !== 'SKILL.md') throw new Error('ZIP 必须只包含一个根级 SKILL.md')
  const skill = skillEntries[0]
  if (skill.data.length > MAX_SKILL_BYTES) throw new Error('SKILL.md 不能超过 1 MiB')

  const meta = frontmatter(strFromU8(skill.data))
  const fallback = prefix ? prefix.replace(/\/$/, '').split('/').pop() : ''
  const name = meta.name || fallback
  if (!SKILL_NAME.test(name)) throw new Error('技能名称需为 1–64 位小写字母、数字、连字符或下划线，请检查 SKILL.md 的 name')
  if (!meta.description) throw new Error('SKILL.md 缺少 description')

  return {
    name,
    description: meta.description,
    body: meta.body,
    files: packageFiles,
    fileCount: packageFiles.length,
  }
}

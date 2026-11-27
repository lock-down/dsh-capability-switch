import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { EventEmitter } from 'node:events'
import { spawnSync } from 'node:child_process'
import { strToU8, zipSync } from 'fflate'

function isLosslessJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isLosslessJson)
  if (typeof value === 'object') return Object.values(value).every(isLosslessJson)
  return false
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
for (const file of ['lib/client.js', 'lib/index.js', 'lib/mcp.js', 'lib/skills.js', 'lib/update.js']) {
  const checked = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' })
  assert.equal(checked.status, 0, file + ' syntax error: ' + checked.stderr)
}
const clientSource = await fs.readFile(join(root, 'lib/client.js'), 'utf8')
const hostSource = await fs.readFile(join(root, 'lib/index.js'), 'utf8')
assert.doesNotMatch(hostSource, /requestRejection/)
assert.match(hostSource, /auth: 'required'/)
assert.doesNotMatch(clientSource, /perform\('update-/)
assert.match(clientSource, /setData\(current => \(\{ \.\.\.current, update: result \}\)\)/)
assert.match(clientSource, /const \[updateBusy, setUpdateBusy\] = useState\(''\)/)
assert.match(clientSource, /\.dsh-caps-primary\{background:var\(--dsw-alias-button-primary-fill\);color:var\(--dsw-alias-label-primary-foreground\);/)
assert.doesNotMatch(clientSource, /\.dsh-caps-primary[^{]*\{[^}]*--dsw-alias-label-on-color/)
assert.match(clientSource, /result\.error \|\| result\.message/)
assert.match(clientSource, /\/mcp\/save-batch/)
assert.doesNotMatch(clientSource, /preferenceStore|function Preferences/)
assert.match(clientSource, /\/skill\/parse-zip/)
assert.match(clientSource, /\/skill\/import-zip/)
assert.match(clientSource, /batchDeleteTitle/)
assert.match(clientSource, /releaseTitle/)
assert.match(clientSource, /dsh-caps-row-selectable/)
assert.match(clientSource, /useLocaleRevision/)
assert.match(clientSource, /localeService\.subscribe/)
assert.match(clientSource, /label: \(\) => t\('title'\)/)
assert.match(clientSource, /params\.set\('workspaces', '1'\)/)
assert.doesNotMatch(clientSource, /tab === 'skills' \? '1' : '0'/)
assert.match(clientSource, /const localeRevision = useLocaleRevision\(\)/)
assert.match(clientSource, /setNotice\(''\)/)
assert.match(clientSource, /const \[selectedMcps, setSelectedMcps\]/)
assert.match(clientSource, /\/mcp\/delete-batch/)
assert.match(clientSource, /mcpBatchDeleteText/)
const messagesStart = clientSource.indexOf('const MESSAGES = ')
const messagesEnd = clientSource.indexOf('\n\n    function t', messagesStart)
assert.ok(messagesStart >= 0 && messagesEnd > messagesStart)
const messages = Function('return ' + clientSource.slice(messagesStart + 'const MESSAGES = '.length, messagesEnd))()
const localeIds = Object.keys(messages).sort()
assert.deepEqual(localeIds, ['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh'])
const messageKeys = Object.keys(messages.en).sort()
for (const locale of localeIds) {
  assert.deepEqual(Object.keys(messages[locale]).sort(), messageKeys, locale + ' keys')
  for (const key of messageKeys) {
    assert.equal(typeof messages[locale][key], 'string', locale + '.' + key)
    assert.ok(messages[locale][key].length > 0, locale + '.' + key + ' is empty')
  }
}
for (const key of messageKeys) {
  const placeholders = value => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort()
  assert.deepEqual(placeholders(messages.en[key]), placeholders(messages.zh[key]), key + ' placeholders zh')
  for (const locale of localeIds) assert.deepEqual(placeholders(messages[locale][key]), placeholders(messages.en[key]), locale + '.' + key + ' placeholders')
}
const temp = await fs.mkdtemp(join(tmpdir(), 'dsh-caps-test-'))
assert.ok(temp.startsWith(tmpdir()))
process.env.DSH_HOME = temp
process.env.DSH_AGENTS_HOME = join(temp, 'agents')

try {
  const skills = await import(pathToFileURL(join(root, 'lib/skills.js')))
  const updateModule = await import(pathToFileURL(join(root, 'lib/update.js')))
  const created = await skills.createSkill({ name: 'demo-skill', description: '测试技能', body: '# Demo' })
  assert.ok(created.path.endsWith('SKILL.md'))
  assert.equal((await skills.listSkills()).length, 1)
  const disabled = await skills.toggleSkill(created.path, false)
  assert.equal(disabled.enabled, false)
  assert.ok(disabled.path.endsWith('.disabled'))
  assert.equal((await skills.listSkills())[0].enabled, false)
  await assert.rejects(() => skills.updateSkill(disabled.path, '---\nname: demo\n---\n', undefined), /先启用/)
  await skills.toggleSkill(disabled.path, true)
  const original = await skills.readSkill(created.path)
  const updatedText = original.text.replace('测试技能', '更新后的技能')
  const updated = await skills.updateSkill(created.path, updatedText)
  await fs.access(updated.backup)
  assert.match((await skills.readSkill(created.path)).text, /更新后的技能/)
  await assert.rejects(() => skills.deleteSkill(created.path, false), /确认/)
  const removed = await skills.deleteSkill(created.path, true)
  await fs.access(removed.trash)
  assert.equal(removed.unlinked, false)
  assert.equal((await skills.listSkills()).length, 0)
  await assert.rejects(() => skills.toggleSkill(join(temp, 'outside.md'), false), /只读|用户级技能/)

  const agentSkill = join(temp, 'agents', 'skills', 'agent-demo')
  await fs.mkdir(agentSkill, { recursive: true })
  await fs.writeFile(join(agentSkill, 'SKILL.md'), '# Agent v1\n')
  await fs.writeFile(join(agentSkill, 'asset.txt'), 'asset\n')
  assert.equal((await skills.listSkills()).some(skill => skill.source === 'user-agents'), false)
  const skillPreview = await skills.previewAgentSkillSync()
  assert.equal(skillPreview.items.find(item => item.name === 'agent-demo').action, 'import')
  await assert.rejects(() => fs.access(join(temp, 'skills', 'agent-demo')))
  const agentLink = join(temp, 'skills', 'agent-demo')
  let synced = await skills.syncAgentSkills(skillPreview)
  assert.deepEqual(synced.imported, ['agent-demo'])
  assert.equal((await fs.lstat(agentLink)).isSymbolicLink(), true)
  assert.equal(await fs.realpath(agentLink), await fs.realpath(agentSkill))
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v1\n')
  const deduped = (await skills.listSkills()).filter(skill => skill.name === 'agent-demo')
  assert.equal(deduped.length, 1)
  assert.equal(deduped[0].source, 'user-dsh')
  assert.equal(deduped[0].syncMode, 'symlink')
  await assert.rejects(() => skills.deleteSkill(join(agentSkill, 'SKILL.md'), true), /只允许删除用户级或当前工作区/)
  assert.ok(await fs.readFile(join(agentSkill, 'SKILL.md'), 'utf8'))
  const linkedEntry = join(agentLink, 'SKILL.md')
  const linkedRead = await skills.readSkill(linkedEntry)
  assert.equal(linkedRead.path, join(await fs.realpath(agentSkill), 'SKILL.md'))
  const editedText = '---\nname: agent-demo\ndescription: test\n---\n\n# Agent edited\n'
  await skills.updateSkill(linkedEntry, editedText)
  assert.equal(await fs.readFile(join(agentSkill, 'SKILL.md'), 'utf8'), editedText)
  assert.equal(await fs.readFile(linkedEntry, 'utf8'), editedText)
  synced = await skills.syncAgentSkills()
  assert.deepEqual(synced.skipped, ['agent-demo'])
  await fs.writeFile(join(agentSkill, 'SKILL.md'), '# Agent v2\n')
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v2\n')
  synced = await skills.syncAgentSkills()
  assert.deepEqual(synced.skipped, ['agent-demo'])

  await fs.rm(agentLink)
  await fs.cp(agentSkill, agentLink, { recursive: true })
  await fs.writeFile(join(agentLink, 'SKILL.md'), '# Copied v1\n')
  const copyPreview = await skills.previewAgentSkillSync()
  assert.equal(copyPreview.items.find(item => item.name === 'agent-demo').action, 'update')
  synced = await skills.syncAgentSkills(copyPreview, ['agent-demo'])
  assert.deepEqual(synced.updated, ['agent-demo'])
  assert.equal((await fs.lstat(agentLink)).isSymbolicLink(), true)
  assert.equal(await fs.readFile(join(agentLink, 'SKILL.md'), 'utf8'), '# Agent v2\n')
  assert.equal(await fs.readFile(join(synced.backupDir, 'agent-demo', 'SKILL.md'), 'utf8'), '# Copied v1\n')

  const copySource = join(temp, 'agents', 'skills', 'copy-demo')
  await fs.mkdir(copySource, { recursive: true })
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy source\n')
  await fs.writeFile(join(copySource, 'asset.txt'), 'copy asset\n')
  const copyTarget = join(temp, 'skills', 'copy-demo')
  const copyPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(copyPlan.items.find(item => item.name === 'copy-demo').action, 'import')
  const copySynced = await skills.syncAgentSkills(copyPlan, ['copy-demo'], 'copy')
  assert.deepEqual(copySynced.imported, ['copy-demo'])
  assert.equal(copySynced.mode, 'copy')
  assert.equal((await fs.lstat(copyTarget)).isSymbolicLink(), false)
  assert.equal(await fs.readFile(join(copyTarget, 'asset.txt'), 'utf8'), 'copy asset\n')
  assert.equal((await skills.listSkills()).find(skill => skill.name === 'copy-demo').syncMode, 'copy')
  assert.equal((await skills.previewAgentSkillSync('copy')).items.find(item => item.name === 'copy-demo').action, 'skip')
  const copyEntry = join(copyTarget, 'SKILL.md')
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy v2\n')
  const changedCopyPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(changedCopyPlan.items.find(item => item.name === 'copy-demo').action, 'update')
  await skills.syncAgentSkills(changedCopyPlan, ['copy-demo'], 'copy')
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy v2/)
  await skills.updateSkill(copyEntry, '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy edited\n')
  assert.match(await fs.readFile(join(copySource, 'SKILL.md'), 'utf8'), /Copy v2/)
  const localPlan = await skills.previewAgentSkillSync('copy')
  const localItem = localPlan.items.find(item => item.name === 'copy-demo')
  assert.equal(localItem.action, 'local-edit')
  const localSkipped = await skills.syncAgentSkills({ ...localPlan, items: [localItem] }, undefined, 'copy')
  assert.deepEqual(localSkipped.skipped, ['copy-demo'])
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy edited/)
  await fs.writeFile(join(copySource, 'SKILL.md'), '---\nname: copy-demo\ndescription: copy\n---\n\n# Copy v3\n')
  const conflictPlan = await skills.previewAgentSkillSync('copy')
  assert.equal(conflictPlan.items.find(item => item.name === 'copy-demo').action, 'conflict')
  const conflictSynced = await skills.syncAgentSkills(conflictPlan, ['copy-demo'], 'copy')
  assert.deepEqual(conflictSynced.updated, ['copy-demo'])
  assert.match(await fs.readFile(copyEntry, 'utf8'), /Copy v3/)
  assert.match(await fs.readFile(join(conflictSynced.backupDir, 'copy-demo', 'SKILL.md'), 'utf8'), /Copy edited/)
  await skills.deleteSkill(copyEntry, true)
  await assert.rejects(() => fs.access(copyTarget))
  await fs.access(join(copySource, 'SKILL.md'))

  const batchA = await skills.createSkill({ name: 'batch-a', description: 'Batch A', body: '# Batch A' })
  const batchB = await skills.createSkill({ name: 'batch-b', description: 'Batch B', body: '# Batch B' })
  await assert.rejects(() => skills.deleteSkills([{ path: batchA.path }], false), /确认/)
  const batchDeleted = await skills.deleteSkills([{ path: batchA.path }, { path: batchB.path }], true)
  assert.equal(batchDeleted.total, 2)
  assert.equal(batchDeleted.deleted.length, 2)
  assert.equal(batchDeleted.failed.length, 0)
  await assert.rejects(() => fs.access(join(temp, 'skills', 'batch-a')))
  const batchC = await skills.createSkill({ name: 'batch-c', description: 'Batch C', body: '# Batch C' })
  const batchPartial = await skills.deleteSkills([{ path: batchC.path }, { path: join(temp, 'outside.md') }], true)
  assert.equal(batchPartial.deleted.length, 1)
  assert.equal(batchPartial.failed.length, 1)

  const zipLib = await import(pathToFileURL(join(root, 'lib/zip.js')))
  const zipBytes = zipSync({
    'zip-demo/SKILL.md': strToU8('---\nname: zip-demo\ndescription: Zip demo\n---\n\n# Zip demo\n'),
    'zip-demo/assets/note.txt': strToU8('companion'),
  })
  const parsedZip = zipLib.readSkillZip(new Uint8Array(zipBytes))
  assert.equal(parsedZip.name, 'zip-demo')
  assert.equal(parsedZip.description, 'Zip demo')
  assert.equal(parsedZip.fileCount, 2)
  assert.deepEqual(parsedZip.files.map(file => file.path), ['SKILL.md', 'assets/note.txt'])
  assert.throws(() => zipLib.readSkillZip(new Uint8Array(zipSync({ '../escape.txt': strToU8('x') }))), /目录穿越/)
  assert.throws(() => zipLib.readSkillZip(new Uint8Array(zipSync({ 'a/SKILL.md': strToU8('---\nname: a\ndescription: A\n---\n'), 'b/SKILL.md': strToU8('---\nname: b\ndescription: B\n---\n') }))), /多个|同时包含|一个 SKILL/)
  assert.throws(() => zipLib.readSkillZip(new Uint8Array(zipSync({ 'a/SKILL.md': strToU8('---\nname: a\ndescription: A\n---\n'), 'a/b/SKILL.md': strToU8('---\nname: b\ndescription: B\n---\n') }))), /根级 SKILL/)
  const importedZip = await skills.importSkillZip({ zip: Buffer.from(zipBytes).toString('base64'), scope: 'user' })
  assert.equal(importedZip.name, 'zip-demo')
  assert.equal(await fs.readFile(join(temp, 'skills', 'zip-demo', 'assets', 'note.txt'), 'utf8'), 'companion')
  assert.equal((await skills.listSkills()).find(skill => skill.name === 'zip-demo').syncMode, undefined)
  await assert.rejects(() => skills.importSkillZip({ zip: Buffer.from(zipBytes).toString('base64'), scope: 'user' }), /同名/)
  await skills.deleteSkill(importedZip.path, true)

  const releaseLib = await import(pathToFileURL(join(root, 'lib/releases.js')))
  let releaseCalls = 0
  const releaseReader = releaseLib.createReleaseReader({
    fetchImpl: async () => {
      releaseCalls += 1
      return { ok: true, json: async () => [
        { tag_name: 'v9.9.9', name: '9.9.9', body: '# Notes\n- item', published_at: '2026-01-02T00:00:00Z', html_url: 'https://github.com/lock-down/dsh-capability-switch/releases/tag/v9.9.9', prerelease: false },
        { tag_name: 'v9.9.8', name: '9.9.8', body: 'Older', published_at: '2026-01-01T00:00:00Z', html_url: 'https://example.com/not-a-release', prerelease: false },
      ] }
    },
    now: () => 1000,
  })
  const releaseData = await releaseReader.load()
  assert.equal(releaseData.latest.tag, 'v9.9.9')
  assert.equal(releaseData.releases.length, 2)
  assert.equal(releaseData.releases[1].htmlUrl, '')
  await releaseReader.load()
  assert.equal(releaseCalls, 1)
  const failedReleases = releaseLib.createReleaseReader({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => [] }) })
  await assert.rejects(() => failedReleases.load(), /HTTP 503/)
  const localReleaseReader = releaseLib.createReleaseReader({ fetchImpl: async () => ({ ok: true, json: async () => [
    { tag_name: 'v1.6.3', name: '1.6.1', body: 'GitHub original', published_at: '2026-11-27T00:00:00Z', html_url: 'https://github.com/lock-down/dsh-capability-switch/releases/tag/v1.6.3', prerelease: false },
  ] }) })
  const jaRelease = await localReleaseReader.load({ lang: 'ja' })
  assert.match(jaRelease.releases[0].body, /MCP now supports batch selection and deletion/)
  const zhRelease = await localReleaseReader.load({ lang: 'zh' })
  assert.match(zhRelease.releases[0].body, /MCP 支持批量选择与删除/)
  const enRelease = await localReleaseReader.load({ lang: 'en' })
  assert.match(enRelease.releases[0].body, /MCP now supports batch selection and deletion/)
  for (const lang of ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']) {
    const meta = JSON.parse(await fs.readFile(join(root, 'locale', lang + '.json'), 'utf8'))
    assert.ok(meta.meta?.title, lang + ' metadata title')
    assert.ok(meta.meta?.description, lang + ' metadata description')
    await fs.access(join(root, 'README.' + (lang === 'zh' ? 'md' : lang + '.md')))
  }
  for (const lang of ['zh', 'en']) {
    assert.ok((await fs.readFile(join(root, 'docs', 'releases', '1.6.3.' + lang + '.md'), 'utf8')).length > 100, lang + ' release note')
  }

  const deleteSource = join(temp, 'agents', 'skills', 'link-delete')
  await fs.mkdir(deleteSource, { recursive: true })
  await fs.writeFile(join(deleteSource, 'SKILL.md'), '---\nname: link-delete\ndescription: test\n---\n\n# Keep me\n')
  const deletePlan = await skills.previewAgentSkillSync()
  await skills.syncAgentSkills(deletePlan, ['link-delete'])
  const deleteLink = join(temp, 'skills', 'link-delete')
  assert.equal((await fs.lstat(deleteLink)).isSymbolicLink(), true)
  const linkedDelete = await skills.deleteSkill(join(deleteLink, 'SKILL.md'), true)
  assert.equal(linkedDelete.unlinked, true)
  assert.equal((await fs.lstat(linkedDelete.trash)).isSymbolicLink(), true)
  assert.equal(await fs.readFile(join(deleteSource, 'SKILL.md'), 'utf8'), '---\nname: link-delete\ndescription: test\n---\n\n# Keep me\n')
  await assert.rejects(() => fs.access(deleteLink))

  const outsideSkill = join(temp, 'outside-skill')
  await fs.mkdir(outsideSkill, { recursive: true })
  await fs.writeFile(join(outsideSkill, 'SKILL.md'), '---\nname: outside-skill\ndescription: outside\n---\n\n# outside\n')
  const aliasLink = join(temp, 'agents', 'skills', 'alias-skill')
  const chainLink = join(temp, 'skills', 'chain-skill')
  await fs.symlink(outsideSkill, aliasLink, process.platform === 'win32' ? 'junction' : 'dir')
  await fs.symlink(aliasLink, chainLink, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(() => skills.updateSkill(join(chainLink, 'SKILL.md'), '---\nname: outside-skill\ndescription: changed\n---\n\n# changed\n'), /不允许/)
  assert.match(await fs.readFile(join(outsideSkill, 'SKILL.md'), 'utf8'), /outside/)
  await fs.rm(chainLink)
  await fs.rm(aliasLink)
  await fs.rm(outsideSkill, { recursive: true })

  const projectWorkspace = join(temp, 'project-workspace')
  const projectSkill = join(projectWorkspace, '.agents', 'skills', 'project-demo')
  await fs.mkdir(projectSkill, { recursive: true })
  await fs.writeFile(join(projectSkill, 'SKILL.md'), '---\nname: project-demo\ndescription: Project demo skill\n---\n\n# Project Demo\n')
  const listedProject = (await skills.listSkills(projectWorkspace)).find(skill => skill.name === 'project-demo')
  assert.equal(listedProject.source, 'project-agents')
  assert.equal(listedProject.writable, true)
  await assert.rejects(() => skills.createSkill({ name: 'project-no-cwd', description: 'No cwd', scope: 'project' }), /需要当前工作区/)
  const createdProject = await skills.createSkill({ name: 'project-created', description: 'Created project skill', body: '# Created', scope: 'project', cwd: projectWorkspace })
  assert.equal(createdProject.scope, 'project')
  assert.ok(createdProject.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  assert.equal((await skills.listSkills(projectWorkspace)).find(skill => skill.name === 'project-created').source, 'project-agents')
  await skills.updateSkill(createdProject.path, '---\nname: project-created\ndescription: Updated project skill\n---\n\n# Updated\n', projectWorkspace)
  const deletedProject = await skills.deleteSkill(createdProject.path, true, projectWorkspace)
  assert.equal(deletedProject.unlinked, false)
  await assert.rejects(() => fs.access(createdProject.path))

  const crossVolumeSkill = await skills.createSkill({ name: 'cross-volume', description: 'cross volume', body: '# cross', scope: 'project', cwd: projectWorkspace })
  const originalRename = fs.rename
  fs.rename = async () => { const error = new Error('cross-device link not permitted'); error.code = 'EXDEV'; throw error }
  try {
    const crossVolumeDeleted = await skills.deleteSkill(crossVolumeSkill.path, true, projectWorkspace)
    assert.equal(crossVolumeDeleted.unlinked, false)
    await fs.access(crossVolumeDeleted.trash)
    await assert.rejects(() => fs.access(crossVolumeSkill.path))
  } finally {
    fs.rename = originalRename
  }
  const crossVolumeSource = join(temp, 'cross-volume-source')
  await fs.mkdir(crossVolumeSource, { recursive: true })
  await fs.writeFile(join(crossVolumeSource, 'SKILL.md'), '# source\n')
  const crossVolumeFile = join(projectWorkspace, '.agents', 'skills', 'cross-volume-file.md')
  await fs.writeFile(crossVolumeFile, '# file source\n')
  const crossVolumeLink = join(projectWorkspace, '.agents', 'skills', 'cross-volume-link')
  await fs.symlink(crossVolumeSource, crossVolumeLink, process.platform === 'win32' ? 'junction' : 'dir')
  const originalRenameAgain = fs.rename
  fs.rename = async () => { const error = new Error('cross-device link not permitted'); error.code = 'EXDEV'; throw error }
  try {
    const linkDeleted = await skills.deleteSkill(join(crossVolumeLink, 'SKILL.md'), true, projectWorkspace)
    assert.equal(linkDeleted.unlinked, true)
    assert.equal((await fs.lstat(linkDeleted.trash)).isSymbolicLink(), true)
    await fs.access(join(crossVolumeSource, 'SKILL.md'))
    await assert.rejects(() => fs.access(crossVolumeLink))
    const fileDeleted = await skills.deleteSkill(crossVolumeFile, true, projectWorkspace)
    assert.equal(fileDeleted.unlinked, false)
    assert.equal(await fs.readFile(fileDeleted.trash, 'utf8'), '# file source\n')
    await assert.rejects(() => fs.access(crossVolumeFile))
  } finally {
    fs.rename = originalRenameAgain
  }

  for (const name of ['partial-a', 'partial-b']) {
    await fs.mkdir(join(temp, 'agents', 'skills', name), { recursive: true })
    await fs.writeFile(join(temp, 'agents', 'skills', name, 'SKILL.md'), '# ' + name + '\n')
  }
  const partialPlan = await skills.previewAgentSkillSync()
  await fs.rm(join(temp, 'agents', 'skills', 'partial-b'), { recursive: true })
  const partial = await skills.syncAgentSkills(partialPlan, ['partial-a', 'partial-b'])
  assert.deepEqual(partial.imported, ['partial-a'])
  assert.equal(partial.failed.length, 1)
  assert.equal(partial.failed[0].name, 'partial-b')
  assert.ok(await fs.readFile(join(temp, 'skills', 'partial-a', 'SKILL.md'), 'utf8'))

  for (const name of ['select-a', 'select-b']) {
    await fs.mkdir(join(temp, 'agents', 'skills', name), { recursive: true })
    await fs.writeFile(join(temp, 'agents', 'skills', name, 'SKILL.md'), '# ' + name + '\n')
  }
  const selectPlan = await skills.previewAgentSkillSync()
  const selectedOnly = await skills.syncAgentSkills(selectPlan, ['select-a'])
  assert.deepEqual(selectedOnly.imported, ['select-a'])
  await assert.rejects(() => fs.access(join(temp, 'skills', 'select-b')))

  const visibleSkills = [
    { name: 'user-dsh', source: 'user-dsh' },
    { name: 'global-agent-hidden', source: 'user-agents' },
    { name: 'project-dsh', source: 'project-dsh' },
    { name: 'project-agent', source: 'project-agents' },
    { name: 'bundled', source: 'bundled' },
    { name: 'custom', source: 'custom' },
    { name: 'runtime', source: 'runtime' },
  ]
  const expectedVisible = ['user-dsh', 'project-dsh', 'project-agent', 'bundled', 'custom', 'runtime']
  const fakeSkills = {
    list: async () => visibleSkills,
    snapshot: async () => ({ skills: visibleSkills, complete: true }),
    get: async name => visibleSkills.find(skill => skill.name === name),
  }
  const takeoverDispose = skills.installSkillTakeover({ get: key => key === 'skills' ? fakeSkills : undefined })
  for (const mode of ['ptc', 'standard', 'minimal', 'cordis']) {
    assert.deepEqual((await fakeSkills.list({ scope: { mode } })).map(skill => skill.name), expectedVisible)
    assert.deepEqual((await fakeSkills.snapshot({ scope: { mode } })).skills.map(skill => skill.name), expectedVisible)
  }
  assert.equal(await fakeSkills.get('global-agent-hidden'), undefined)
  assert.equal((await fakeSkills.get('project-agent')).name, 'project-agent')
  assert.equal((await fakeSkills.get('user-dsh')).name, 'user-dsh')
  takeoverDispose()
  assert.equal((await fakeSkills.list()).length, 7)
  assert.equal((await fakeSkills.get('global-agent-hidden')).name, 'global-agent-hidden')

  let refreshInvalidated = 0
  let refreshEvent
  const refreshSkills = { invalidateCache: () => { refreshInvalidated += 1 } }
  assert.equal(skills.invalidateSkillCatalog({
    get: key => key === 'skills' ? refreshSkills : undefined,
    emit: (name, payload) => { refreshEvent = { name, payload } },
  }), true)
  assert.equal(refreshInvalidated, 1)
  assert.deepEqual(refreshEvent, { name: 'plugin-manager/changed', payload: { reason: 'plugin' } })
  assert.equal(skills.invalidateSkillCatalog({ get: () => undefined, emit() {} }), false)

  const mcp = await import(pathToFileURL(join(root, 'lib/mcp.js')))
  let config = { servers: {} }
  let probeCalls = 0
  let restartCalls = 0
  const manager = {
    config: { servers: { get: () => config.servers } },
    ctx: { fiber: { entry: { id: 'mcp' } } },
    list: () => [
      ...Object.entries(config.servers).map(([name, entry]) => ({ name, configured: true, status: { state: entry.enabled ? 'connected' : 'disabled' } })),
      { name: 'registered-mcp', configured: true, status: { state: 'connected' } },
    ],
    probe: async name => { probeCalls += 1; return { ok: true, toolNames: [name + '.tool'] } },
    restart: async () => { restartCalls += 1 },
  }
  const standaloneEntry = { options: { id: 'pencil', name: '@deepseek-ai/dsh-mcp-client', config: { serverName: 'pencil', transport: 'stdio', command: 'pen', args: ['--app', 'desktop'] } } }
  const profilePatch = join(temp, 'cordis.patch.yml')
  await fs.writeFile(profilePatch, [
    '- id: ui-settings',
    '  name: "@deepseek-ai/dsh-client-ui-settings"',
    '  config:',
    '    enabled: true',
    '- insert:',
    '    - id: pencil',
    '      name: "@deepseek-ai/dsh-mcp-client"',
    '      config:',
    '        serverName: pencil',
    '        transport: stdio',
    '        command: pen',
    '- id: tool-bash',
    '  name: "@deepseek-ai/dsh-tool-bash"',
    '  disabled: !!js process.platform === "win32"',
    '',
  ].join('\n'))
  let standaloneEnabled = true
  let setPluginEnableCalls = 0
  const pluginManager = {
    listPlugins: async () => [{ entryId: 'include:pencil', patchId: 'pencil', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: standaloneEnabled }],
    setPluginEnabled: async (_id, enabled) => {
      setPluginEnableCalls += 1
      standaloneEnabled = enabled
      return { application: 'applied', enabled, stage: 'enable', target: 'pencil', changed: true }
    },
  }
  const configEditor = {
    documentPath: profilePatch,
    entries: () => [standaloneEntry],
    edit: async (entry, update) => {
      if (entry === standaloneEntry) standaloneEntry.options.config = update(standaloneEntry.options.config)
      else config = update(config)
    },
  }
  const ctx = { get: key => key === 'mcpManager' ? manager : key === 'configEditor' ? configEditor : key === 'pluginManager' ? pluginManager : undefined }
  await mcp.saveMcp(ctx, { name: 'local', transport: 'stdio', command: 'npx', args: ['-y', 'demo'], env: {}, enabled: true }, mcp.PANEL_APPROVAL)
  assert.equal((await mcp.listMcp(ctx))[0].command, 'npx')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').source, 'standalone')
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').writable, true)
  assert.equal((await mcp.listMcp(ctx)).find(row => row.name === 'pencil').canToggle, true)
  await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'pen2', args: ['--edited'], env: {}, enabled: true }, mcp.PANEL_APPROVAL)
  assert.equal(standaloneEntry.options.config.command, 'pen2')
  assert.deepEqual(standaloneEntry.options.config.args, ['--edited'])
  config.servers.pencil = { name: 'pencil', transport: 'stdio', command: 'manager-pen', args: [], env: {}, cwd: '', enabled: true }
  await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'manager-pen-2', args: [], env: {}, enabled: true }, mcp.PANEL_APPROVAL)
  assert.equal(config.servers.pencil.command, 'manager-pen-2')
  assert.equal(standaloneEntry.options.config.command, 'pen2')
  delete config.servers.pencil
  const originalListPlugins = pluginManager.listPlugins
  pluginManager.listPlugins = async () => [{ entryId: 'include:pencil', patchId: 'pencil', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: true, readOnlyReason: 'management-required' }]
  const readOnlyStandalone = (await mcp.listMcp(ctx)).find(row => row.name === 'pencil')
  assert.equal(readOnlyStandalone.writable, false)
  assert.equal(readOnlyStandalone.canDelete, false)
  await assert.rejects(() => mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'blocked', enabled: true }), /不可管理/)
  await assert.rejects(() => mcp.deleteMcp(ctx, 'pencil', true), /不可管理/)
  pluginManager.listPlugins = originalListPlugins
  await mcp.toggleMcp(ctx, 'pencil', false, mcp.PANEL_APPROVAL)
  assert.equal(standaloneEnabled, false)
  await mcp.toggleMcp(ctx, 'pencil', true, mcp.PANEL_APPROVAL)
  assert.equal(standaloneEnabled, true)
  await mcp.toggleMcp(ctx, 'local', false, mcp.PANEL_APPROVAL)
  assert.equal(config.servers.local.enabled, false)
  await mcp.saveMcp(ctx, { name: 'local', originalName: 'local', transport: 'streamable-http', url: 'https://example.com/mcp', headers: { Authorization: 'Bearer test' }, enabled: true }, mcp.PANEL_APPROVAL)
  assert.equal(config.servers.local.command, '')
  assert.equal(config.servers.local.url, 'https://example.com/mcp')
  await mcp.saveMcp(ctx, { name: 'local', originalName: 'local', transport: 'sse', url: 'https://example.com/sse', headers: {}, enabled: true }, mcp.PANEL_APPROVAL)
  assert.equal(config.servers.local.transport, 'streamable-http')
  assert.equal(config.servers.local.url, 'https://example.com/sse')
  assert.deepEqual((await mcp.testMcp(ctx, 'local', mcp.PANEL_APPROVAL)).toolNames, ['local.tool'])
  await assert.rejects(() => mcp.deleteMcp(ctx, 'local', false), /确认/)
  await mcp.deleteMcp(ctx, 'local', true)
  assert.equal(config.servers.local, undefined)
  config.servers['batch-mcp-a'] = { name: 'batch-mcp-a', transport: 'stdio', command: 'a', args: [], env: {}, cwd: '', enabled: true }
  config.servers['batch-mcp-b'] = { name: 'batch-mcp-b', transport: 'stdio', command: 'b', args: [], env: {}, cwd: '', enabled: true }
  await assert.rejects(() => mcp.deleteMcps(ctx, ['batch-mcp-a'], false), /确认/)
  const batchMcp = await mcp.deleteMcps(ctx, ['batch-mcp-a', 'batch-mcp-b'], true)
  assert.equal(batchMcp.total, 2)
  assert.equal(batchMcp.deleted.length, 2)
  assert.equal(batchMcp.failed.length, 0)
  assert.equal(config.servers['batch-mcp-a'], undefined)
  config.servers['batch-mcp-c'] = { name: 'batch-mcp-c', transport: 'stdio', command: 'c', args: [], env: {}, cwd: '', enabled: true }
  const partialMcp = await mcp.deleteMcps(ctx, ['batch-mcp-c', 'missing-mcp'], true)
  assert.equal(partialMcp.deleted.length, 1)
  assert.equal(partialMcp.failed.length, 1)

  const approvalRequests = []
  const recordApproval = async request => { approvalRequests.push(request) }
  await mcp.saveMcp(ctx, { name: 'stdio-gated', transport: 'stdio', command: 'npx', args: ['-y', 'gated'], env: {}, enabled: true }, recordApproval)
  assert.equal(approvalRequests.length, 1)
  assert.equal(approvalRequests[0].action, 'mcp_save')
  assert.deepEqual(approvalRequests[0].servers.map(server => server.name), ['stdio-gated'])
  assert.equal(approvalRequests[0].servers[0].command, 'npx')
  assert.deepEqual(approvalRequests[0].servers[0].args, ['-y', 'gated'])
  approvalRequests.length = 0
  await mcp.saveMcp(ctx, { name: 'http-gated', transport: 'streamable-http', url: 'https://example.com/mcp', headers: {}, enabled: true }, recordApproval)
  assert.equal(approvalRequests.length, 0)
  await mcp.saveMcp(ctx, { name: 'disabled-gated', transport: 'stdio', command: 'npx', args: ['off'], env: {}, enabled: false }, recordApproval)
  assert.equal(approvalRequests.length, 0)
  assert.equal(config.servers['disabled-gated'].enabled, false)
  await mcp.toggleMcp(ctx, 'disabled-gated', true, recordApproval)
  assert.equal(approvalRequests.length, 1)
  assert.equal(approvalRequests[0].action, 'mcp_toggle')
  approvalRequests.length = 0
  await mcp.toggleMcp(ctx, 'disabled-gated', false, recordApproval)
  assert.equal(approvalRequests.length, 0)
  await mcp.toggleMcp(ctx, 'pencil', false, recordApproval)
  assert.equal(approvalRequests.length, 0)
  await mcp.toggleMcp(ctx, 'pencil', true, recordApproval)
  assert.equal(approvalRequests.length, 1)
  assert.equal(approvalRequests[0].servers[0].name, 'pencil')
  approvalRequests.length = 0
  const liveStandaloneSave = await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'pen-gated', args: [], env: {}, enabled: true }, recordApproval)
  assert.equal(approvalRequests.length, 1)
  assert.equal(approvalRequests[0].action, 'mcp_save')
  assert.equal(liveStandaloneSave.enabled, true)
  await mcp.toggleMcp(ctx, 'pencil', false, mcp.PANEL_APPROVAL)
  approvalRequests.length = 0
  const disabledStandaloneSave = await mcp.saveMcp(ctx, { name: 'pencil', originalName: 'pencil', transport: 'stdio', command: 'pen-off', args: [], env: {}, enabled: true }, recordApproval)
  assert.equal(approvalRequests.length, 0)
  assert.equal(disabledStandaloneSave.enabled, false)
  await mcp.toggleMcp(ctx, 'pencil', true, mcp.PANEL_APPROVAL)
  const standaloneCallsBeforeRace = setPluginEnableCalls
  await assert.rejects(() => mcp.toggleMcp(ctx, 'pencil', true, async () => {
    standaloneEntry.options.config = { ...standaloneEntry.options.config, command: 'pen-race' }
  }), /审批期间已变化/)
  assert.equal(setPluginEnableCalls, standaloneCallsBeforeRace)
  assert.equal(standaloneEnabled, true)
  standaloneEntry.options.config = { ...standaloneEntry.options.config, command: 'pen-off' }
  approvalRequests.length = 0
  await mcp.testMcp(ctx, 'stdio-gated', recordApproval)
  assert.equal(approvalRequests[0].action, 'mcp_test')
  approvalRequests.length = 0
  await mcp.restartMcp(ctx, 'stdio-gated', recordApproval)
  assert.equal(approvalRequests[0].action, 'mcp_restart')
  approvalRequests.length = 0
  await mcp.testMcp(ctx, 'http-gated', recordApproval)
  await mcp.restartMcp(ctx, 'http-gated', recordApproval)
  assert.equal(approvalRequests.length, 0)
  const refused = async () => { throw new Error('宿主拒绝了审批') }
  await assert.rejects(() => mcp.toggleMcp(ctx, 'disabled-gated', true, refused), /宿主拒绝/)
  assert.equal(config.servers['disabled-gated'].enabled, false)
  await assert.rejects(() => mcp.saveMcp(ctx, { name: 'refused-gated', transport: 'stdio', command: 'npx', env: {}, enabled: true }, refused), /宿主拒绝/)
  assert.equal(config.servers['refused-gated'], undefined)
  await assert.rejects(() => mcp.saveMcp(ctx, { name: 'missing-gated', transport: 'stdio', command: 'npx', env: {}, enabled: true }), /缺少审批上下文/)
  assert.equal(config.servers['missing-gated'], undefined)
  await assert.rejects(() => mcp.saveMcp(ctx, { name: '__proto__', transport: 'stdio', command: 'npx', enabled: false }, mcp.PANEL_APPROVAL), /保留名称/)
  assert.equal(Object.getPrototypeOf(config.servers), Object.prototype)
  await assert.rejects(() => mcp.toggleMcp(ctx, '__proto__', true, mcp.PANEL_APPROVAL), /无效的 MCP 名称/)
  config.servers['race-toggle'] = { name: 'race-toggle', transport: 'stdio', command: 'race-one', args: [], env: {}, cwd: '', enabled: false }
  await assert.rejects(() => mcp.toggleMcp(ctx, 'race-toggle', true, async () => {
    config.servers['race-toggle'].command = 'race-two'
  }), /审批期间已变化/)
  assert.equal(config.servers['race-toggle'].enabled, false)
  const probesBeforeRace = probeCalls
  await assert.rejects(() => mcp.testMcp(ctx, 'race-toggle', async () => {
    config.servers['race-toggle'].command = 'race-three'
  }), /审批期间已变化/)
  assert.equal(probeCalls, probesBeforeRace)
  const restartsBeforeRace = restartCalls
  await assert.rejects(() => mcp.restartMcp(ctx, 'race-toggle', async () => {
    config.servers['race-toggle'].command = 'race-four'
  }), /审批期间已变化/)
  assert.equal(restartCalls, restartsBeforeRace)
  await assert.rejects(() => mcp.toggleMcp(ctx, 'race-toggle', true), /缺少审批上下文/)

  const batchApprovals = []
  const batchSaved = await mcp.saveMcpBatch(ctx, [
    { name: 'batch-stdio', transport: 'stdio', command: 'batch-cmd', args: ['--a'], env: {}, enabled: true },
    { name: 'batch-http', transport: 'streamable-http', url: 'https://example.com/batch', headers: {}, enabled: true },
  ], async request => { batchApprovals.push(request) })
  assert.deepEqual(batchSaved.saved.map(row => row.name), ['batch-stdio', 'batch-http'])
  assert.equal(batchApprovals.length, 1)
  assert.deepEqual(batchApprovals[0].servers.map(server => server.name), ['batch-stdio'])
  assert.equal(config.servers['batch-stdio'].command, 'batch-cmd')
  assert.equal(config.servers['batch-http'].url, 'https://example.com/batch')
  const batchCount = Object.keys(config.servers).length
  await assert.rejects(() => mcp.saveMcpBatch(ctx, [
    { name: 'batch-ok', transport: 'stdio', command: 'ok', enabled: false },
    { name: 'batch-bad', transport: 'stdio', command: '', enabled: true },
  ], async () => {}), /启动命令/)
  assert.equal(Object.keys(config.servers).length, batchCount)
  assert.equal(config.servers['batch-ok'], undefined)
  await assert.rejects(() => mcp.saveMcpBatch(ctx, [
    { name: 'batch-stdio', transport: 'stdio', command: 'duplicate', enabled: false },
  ], async () => {}), /同名/)
  await assert.rejects(() => mcp.saveMcpBatch(ctx, [
    { name: 'batch-no-context', transport: 'stdio', command: 'x', enabled: true },
  ]), /缺少审批上下文/)
  assert.equal(config.servers['batch-no-context'], undefined)

  const registeredApprovals = []
  const probesBeforeRegistered = probeCalls
  await mcp.testMcp(ctx, 'registered-mcp', async request => { registeredApprovals.push(request) })
  assert.equal(probeCalls, probesBeforeRegistered + 1)
  assert.equal(registeredApprovals.length, 1)
  assert.equal(registeredApprovals[0].action, 'mcp_test')
  assert.deepEqual(registeredApprovals[0].servers, [{ name: 'registered-mcp', registered: true }])
  const restartsBeforeRegistered = restartCalls
  await assert.rejects(() => mcp.restartMcp(ctx, 'registered-mcp', async () => { throw new Error('宿主拒绝') }), /宿主拒绝/)
  assert.equal(restartCalls, restartsBeforeRegistered)
  await assert.rejects(() => mcp.testMcp(ctx, 'registered-mcp'), /缺少审批上下文/)

  await fs.mkdir(join(temp, '.codex'), { recursive: true })
  await fs.writeFile(join(temp, '.claude.json'), JSON.stringify({ mcpServers: {
    pencil: { command: 'should-not-overwrite' },
    'remote-app': { command: 'npx', args: ['-y', 'remote'], env: { TOKEN: 'secret' } },
    'sse-app': { type: 'sse', url: 'https://example.com/sse', headers: { 'X-Test': 'yes' } },
    'run-app': { command: 'run-app-cmd', args: ['--go'] },
    'quiet-app': { command: 'quiet-cmd' },
  } }))
  await fs.writeFile(join(temp, '.codex', 'config.toml'), '[mcp_servers.codex-app]\ncommand = "codex-mcp"\nargs = ["--stdio"]\n[mcp_servers.pencil]\ncommand = "different-pencil"\n')
  let preview = await mcp.listMcpImports(ctx, temp)
  assert.equal(preview.servers.filter(row => row.name === 'pencil').length, 2)
  assert.ok(preview.servers.filter(row => row.name === 'pencil').every(row => row.conflict && row.exists))
  assert.equal(preview.servers.find(row => row.name === 'remote-app').env, undefined)
  assert.equal(preview.servers.find(row => row.name === 'sse-app').transport, 'streamable-http')
  assert.equal(preview.servers.find(row => row.name === 'sse-app').url, 'https://example.com/sse')
  const staleId = preview.servers.find(row => row.name === 'remote-app').id
  const claude = JSON.parse(await fs.readFile(join(temp, '.claude.json'), 'utf8'))
  claude.mcpServers['remote-app'].command = 'changed-after-preview'
  await fs.writeFile(join(temp, '.claude.json'), JSON.stringify(claude))
  await assert.rejects(() => mcp.importMcp(ctx, [staleId], temp, false, mcp.PANEL_APPROVAL), /预览后变化|重新扫描/)
  assert.equal(config.servers['remote-app'], undefined)
  preview = await mcp.listMcpImports(ctx, temp)
  const imported = await mcp.importMcp(ctx, [
    preview.servers.find(row => row.name === 'remote-app').id,
    preview.servers.find(row => row.name === 'codex-app').id,
    preview.servers.find(row => row.name === 'pencil').id,
  ], temp, false, mcp.PANEL_APPROVAL)
  assert.deepEqual(imported.imported.sort(), ['codex-app', 'remote-app'])
  assert.deepEqual(imported.skipped, ['pencil'])
  assert.equal(config.servers['remote-app'].command, 'changed-after-preview')
  assert.equal(config.servers['codex-app'].command, 'codex-mcp')
  assert.equal(config.servers['remote-app'].env.TOKEN, 'secret')
  assert.equal(config.servers['remote-app'].enabled, false)

  const removedStandalone = await mcp.deleteMcp(ctx, 'pencil', true)
  assert.equal(removedStandalone.deleted, true)
  assert.equal(removedStandalone.standalone, true)
  assert.ok(await fs.stat(removedStandalone.backup))
  const savedPatch = await fs.readFile(profilePatch, 'utf8')
  assert.doesNotMatch(savedPatch, /id: pencil/)
  assert.match(savedPatch, /!!js process\.platform/)
  const directRemoval = mcp.removePatchEntry('- insert:\n    - id: keep\n      name: keep\n', 'missing')
  assert.equal(directRemoval.removed, false)
  assert.equal(config.servers['codex-app'].enabled, false)

  const importApprovals = []
  preview = await mcp.listMcpImports(ctx, temp)
  const runImport = await mcp.importMcp(ctx, [preview.servers.find(row => row.name === 'run-app').id], temp, true, async request => { importApprovals.push(request) })
  assert.deepEqual(runImport.imported, ['run-app'])
  assert.equal(importApprovals.length, 1)
  assert.equal(importApprovals[0].action, 'mcp_import')
  assert.deepEqual(importApprovals[0].servers.map(server => server.name), ['run-app'])
  assert.equal(config.servers['run-app'].enabled, true)
  const quietApprovals = []
  const quietImport = await mcp.importMcp(ctx, [preview.servers.find(row => row.name === 'quiet-app').id], temp, false, async request => { quietApprovals.push(request) })
  assert.deepEqual(quietImport.imported, ['quiet-app'])
  assert.equal(quietApprovals.length, 0)
  assert.equal(config.servers['quiet-app'].enabled, false)

  const updateCalls = []
  const registryManager = {
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'dsh-capability-switch@1.0.0', update: 'registry' }],
    listVersions: async () => ({ status: 'listed', versions: [
      { version: '10.0.0-beta.1', bundle: true, prerelease: true },
      { version: '10.0.0', bundle: true, prerelease: false, incompatible: { name: 'dsh-capability-switch' } },
      { version: '9.10.0', bundle: true, prerelease: false, deprecated: 'test' },
      { version: '9.9.9', bundle: true, prerelease: false },
      { version: '9.9.8', bundle: true, prerelease: false },
    ] }),
    updateBundle: async (name, version) => { updateCalls.push([name, version]); return { result: { application: 'applied' } } },
  }
  const updater = updateModule.createUpdateManager({ get: () => registryManager })
  await updater.setAutoUpdate(false)
  const checkedUpdate = await updater.check()
  assert.equal(checkedUpdate.state, 'available')
  assert.equal(checkedUpdate.latest, '9.9.9')
  assert.equal(updateCalls.length, 0)
  const appliedUpdate = await updater.apply('9.9.9')
  assert.equal(appliedUpdate.state, 'updated')
  assert.deepEqual(updateCalls, [['dsh-capability-switch', '9.9.9']])
  const autoCalls = []
  const autoUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    updateBundle: async (name, version) => { autoCalls.push([name, version]); return { result: { application: 'applied' } } },
  }) })
  await autoUpdater.setAutoUpdate(true)
  const autoUpdate = await autoUpdater.check({ auto: true })
  assert.equal(autoUpdate.state, 'updated')
  assert.deepEqual(autoCalls, [['dsh-capability-switch', '9.9.9']])
  const localUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'link:/tmp/dsh-capability-switch' }],
  }) })
  await localUpdater.setAutoUpdate(true)
  const localUpdate = await localUpdater.check({ auto: true })
  assert.equal(localUpdate.state, 'unsupported')
  assert.equal(localUpdate.supported, false)
  const currentUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    listVersions: async () => ({ status: 'listed', versions: [] }),
  }) })
  const currentUpdate = await currentUpdater.check()
  assert.equal(currentUpdate.state, 'current')
  assert.equal(currentUpdate.current, '1.0.0')
  assert.equal(currentUpdate.latest, null)
  assert.equal(currentUpdate.error, null)

  const guardedCalls = []
  const guardedUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    updateBundle: async (name, version) => { guardedCalls.push([name, version]); return { result: { application: 'applied' } } },
  }) })
  const guardedCheck = await guardedUpdater.check()
  assert.equal(guardedCheck.state, 'available')
  const invalidApply = await guardedUpdater.apply('9.9.9 --registry=http://example.com')
  assert.equal(invalidApply.state, 'failed')
  assert.match(invalidApply.error, /版本号/)
  const downgradeApply = await guardedUpdater.apply('9.9.8')
  assert.equal(downgradeApply.state, 'failed')
  assert.match(downgradeApply.error, /候选/)
  assert.deepEqual(guardedCalls, [])
  const coldApply = await updateModule.createUpdateManager({ get: () => registryManager }).apply('9.9.9')
  assert.equal(coldApply.state, 'failed')
  assert.match(coldApply.error, /先检查/)
  const unsupportedApply = await localUpdater.apply('9.9.9')
  assert.equal(unsupportedApply.state, 'unsupported')
  assert.equal(updateCalls.length, 1)
  const flatUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    updateBundle: async () => ({ application: 'applied' }),
  }) })
  await flatUpdater.check()
  const flatApplied = await flatUpdater.apply('9.9.9')
  assert.equal(flatApplied.state, 'updated')
  const nullUpdater = updateModule.createUpdateManager({ get: () => ({
    ...registryManager,
    listVersions: async () => ({ status: 'listed', versions: [{ version: '9.9.9', bundle: true, prerelease: false, deprecated: null, incompatible: null }] }),
  }) })
  const nullUpdate = await nullUpdater.check()
  assert.equal(nullUpdate.state, 'available')
  assert.equal(nullUpdate.latest, '9.9.9')

  const host = await import(pathToFileURL(join(root, 'lib/index.js')))
  assert.deepEqual(host.inject, ['tools', 'skills'])

  const routes = new Map()
  let agentTool
  let hostRefreshCount = 0
  const hostRefreshSkills = {
    registerProvider: create => {
      const abort = new AbortController()
      create({ signal: abort.signal, invalidate() {} })
      return () => { abort.abort(); hostRefreshCount += 1 }
    },
  }
  const webServer = { register: route => { routes.set(route.path, route); return () => {} } }
  const workspaceRecords = []
  const workspaceRegistry = {
    list: () => workspaceRecords,
    create: async (workspacePath, title) => {
      const existing = workspaceRecords.find(workspace => workspace.path === workspacePath)
      if (existing) return existing
      const workspace = { id: 'workspace-' + (workspaceRecords.length + 1), path: workspacePath, title: title || basename(workspacePath) }
      workspaceRecords.push(workspace)
      return workspace
    },
  }
  const hostUpdateManager = {
    listBundles: async () => [{ name: 'dsh-capability-switch', version: '1.0.0', source: 'dsh-capability-switch@1.0.0', update: 'registry' }],
    listVersions: async () => ({ status: 'listed', versions: [{ version: '9.9.9', bundle: true, prerelease: false }] }),
    updateBundle: async () => ({ result: { application: 'applied' } }),
  }
  let approvalAvailable = true
  let approvalOutcome = 'allowed-once'
  let agentsInitiator = { id: 'test-session' }
  let observationDisposals = 0
  const coldSessionQuery = {
    observeSession: async id => ({
      header: { id, cwd: temp },
      [Symbol.dispose]: () => { observationDisposals += 1 },
    }),
  }
  let sandboxPolicyAvailable = true
  let sandboxMode = 'workspace-write'
  let sandboxRoot = projectWorkspace
  let sandboxAdditional = []
  const sandboxPolicy = {
    resolve: () => ({ mode: sandboxMode, workspaceRoot: sandboxRoot, additionalWritableRoots: sandboxAdditional }),
  }
  const hostApprovals = []
  const approvalService = { request: async request => { hostApprovals.push(request); return approvalOutcome } }
  const hostCtx = {
    fiber: { entry: { id: 'caps' } },
    tools: { register: value => { agentTool = value; return () => {} } },
    effect: fn => { fn(); return () => {} },
    get: key => {
      if (key === 'mcpManager') return manager
      if (key === 'pluginManager') return hostUpdateManager
      if (key === 'webServer') return webServer
      if (key === 'configEditor') return configEditor
      if (key === 'approval') return approvalAvailable ? approvalService : undefined
      if (key === 'sandboxPolicy') return sandboxPolicyAvailable ? sandboxPolicy : undefined
      if (key === 'skills') return hostRefreshSkills
      if (key === 'sessionQuery') return coldSessionQuery
      if (key === 'workspaceRegistry') return workspaceRegistry
      if (key === 'agents') return { get: id => id === 'test-session' ? { id } : undefined, currentInitiator: () => agentsInitiator }
      if (key === 'workingDirectory') return { ensure: async () => projectWorkspace }
    },
  }
  host.apply(hostCtx, {})
  assert.equal(routes.size, 25)
  assert.ok([...routes.values()].every(route => route.auth === 'required'))
  assert.equal(agentTool.output.schema.type, 'object')
  const listed = await agentTool.execute({ action: 'list' })
  assert.equal(listed.ok, true)
  assert.equal(isLosslessJson(listed), true)
  hostApprovals.length = 0
  const createdWorkspace = await invoke('/__dsh-capability-switch/workspace/create', 'POST', { name: 'new-workspace', parent: temp })
  assert.equal(createdWorkspace.status, 200)
  assert.equal(createdWorkspace.data.workspace.path, join(temp, 'new-workspace'))
  assert.equal(hostApprovals.length, 0)
  const otherSkill = join(temp, 'new-workspace', '.agents', 'skills', 'other-skill')
  await fs.mkdir(otherSkill, { recursive: true })
  await fs.writeFile(join(otherSkill, 'SKILL.md'), '---\nname: other-skill\ndescription: Other workspace skill\n---\n\n# Other\n')
  const stateWithWorkspaces = await invoke('/__dsh-capability-switch/state', 'GET')
  assert.equal(stateWithWorkspaces.data.workspaces.length, 1)
  assert.deepEqual(stateWithWorkspaces.data.skillWarnings, [])
  const otherRow = stateWithWorkspaces.data.skills.find(skill => skill.name === 'other-skill')
  assert.equal(otherRow.workspaceTitle, 'new-workspace')
  assert.equal(otherRow.crossWorkspace, true)
  assert.equal(otherRow.writable, true)
  const stateWithoutWorkspaces = await invoke('/__dsh-capability-switch/state?workspaces=0&cwd=' + encodeURIComponent(temp), 'GET')
  assert.equal(stateWithoutWorkspaces.data.skills.some(skill => skill.name === 'other-skill'), false)
  const otherUpdate = await invoke('/__dsh-capability-switch/skill/update', 'POST', {
    path: join(otherSkill, 'SKILL.md'),
    text: '---\nname: other-skill\ndescription: Updated other workspace skill\n---\n\n# Updated other\n',
    cwd: join(temp, 'new-workspace'),
  }, { 'x-dsh-session-id': 'test-session' })
  assert.equal(otherUpdate.status, 200)
  assert.match(await fs.readFile(join(otherSkill, 'SKILL.md'), 'utf8'), /Updated other workspace skill/)
  assert.deepEqual(agentTool.output.render({ action: 'list' }, listed), [
    { type: 'text', text: JSON.stringify(listed, null, 2) },
  ])
  const refreshBeforeTool = hostRefreshCount
  await agentTool.execute({ action: 'skill_create', name: 'tool-refresh', description: 'tool refresh', body: '# Tool refresh' })
  assert.ok(hostRefreshCount > refreshBeforeTool)
  const toolProject = await agentTool.execute({ action: 'skill_create', scope: 'project', name: 'tool-project', description: 'tool project', body: '# Tool project' })
  assert.ok(toolProject.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  await skills.deleteSkill(toolProject.path, true, projectWorkspace)
  async function invoke(path, method, body, headers = {}) {
    const req = new EventEmitter()
    Object.assign(req, { method, url: path, headers })
    let complete
    const done = new Promise(resolve => { complete = resolve })
    const res = { statusCode: 200, setHeader() {}, end(text) { complete({ status: this.statusCode, data: JSON.parse(text) }) } }
    const routePath = new URL(path, 'http://127.0.0.1').pathname
    const pending = routes.get(routePath).handler(req, res)
    await new Promise(resolve => setImmediate(resolve))
    if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)))
    req.emit('end')
    await pending
    return await done
  }
  const stateResponse = await invoke('/__dsh-capability-switch/state', 'GET')
  assert.equal(stateResponse.status, 200)
  assert.ok(Array.isArray(stateResponse.data.skills))
  assert.equal(stateResponse.data.prefs, undefined)
  assert.equal(typeof stateResponse.data.update.current, 'string')
  const coldState = await invoke('/__dsh-capability-switch/state', 'GET', undefined, { 'x-dsh-session-id': 'cold-session' })
  assert.equal(coldState.status, 200)
  assert.equal(coldState.data.workspace, temp)
  assert.equal(observationDisposals, 1)
  const routeZip = zipSync({
    'route-zip/SKILL.md': strToU8('---\nname: route-zip\ndescription: Route zip\n---\n\n# Route zip\n'),
    'route-zip/asset.txt': strToU8('route asset'),
  })
  const routeZipBody = Buffer.from(routeZip).toString('base64')
  const parsedRouteZip = await invoke('/__dsh-capability-switch/skill/parse-zip', 'POST', { zip: routeZipBody })
  assert.equal(parsedRouteZip.status, 200)
  assert.equal(parsedRouteZip.data.name, 'route-zip')
  assert.equal(parsedRouteZip.data.fileCount, 2)
  const importedRouteZip = await invoke('/__dsh-capability-switch/skill/import-zip', 'POST', { zip: routeZipBody, scope: 'user' })
  assert.equal(importedRouteZip.status, 200)
  assert.equal(importedRouteZip.data.name, 'route-zip')
  const deletedRouteZip = await invoke('/__dsh-capability-switch/skill/delete-batch', 'POST', { items: [{ path: importedRouteZip.data.path }], confirm: true })
  assert.equal(deletedRouteZip.status, 200)
  assert.equal(deletedRouteZip.data.deleted.length, 1)
  config.servers['route-mcp-a'] = { name: 'route-mcp-a', transport: 'stdio', command: 'a', args: [], env: {}, cwd: '', enabled: false }
  config.servers['route-mcp-b'] = { name: 'route-mcp-b', transport: 'stdio', command: 'b', args: [], env: {}, cwd: '', enabled: false }
  const deletedRouteMcps = await invoke('/__dsh-capability-switch/mcp/delete-batch', 'POST', { names: ['route-mcp-a', 'route-mcp-b'], confirm: true })
  assert.equal(deletedRouteMcps.status, 200)
  assert.equal(deletedRouteMcps.data.deleted.length, 2)
  assert.equal(config.servers['route-mcp-a'], undefined)
  assert.equal(config.servers['route-mcp-b'], undefined)
  const updateCheck = await invoke('/__dsh-capability-switch/update/check', 'POST', {})
  assert.equal(updateCheck.status, 200)
  assert.equal(updateCheck.data.state, 'available')
  const updateApply = await invoke('/__dsh-capability-switch/update/apply', 'POST', { version: '9.9.9' })
  assert.equal(updateApply.status, 200)
  assert.equal(updateApply.data.state, 'updated')
  const workspaceResponse = await invoke('/__dsh-capability-switch/state?cwd=' + encodeURIComponent(temp), 'GET')
  assert.equal(workspaceResponse.data.workspace, temp)
  assert.equal(workspaceResponse.data.userSkillsRoot, join(temp, 'skills'))
  const refreshBeforeRoute = hostRefreshCount
  const createResponse = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-refresh', description: 'route refresh', body: '# Route refresh' })
  assert.equal(createResponse.status, 200)
  const unauthorizedProject = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-unauthorized', description: 'route unauthorized', body: '# Route unauthorized', scope: 'project', cwd: projectWorkspace })
  assert.equal(unauthorizedProject.status, 400)
  const projectCreateResponse = await invoke('/__dsh-capability-switch/skill/create', 'POST', { name: 'route-project', description: 'route project', body: '# Route project', scope: 'project', cwd: join(temp, 'untrusted-workspace') }, { 'x-dsh-session-id': 'test-session' })
  assert.equal(projectCreateResponse.status, 200)
  assert.ok(projectCreateResponse.data.path.startsWith(join(projectWorkspace, '.agents', 'skills')))
  await skills.deleteSkill(projectCreateResponse.data.path, true, projectWorkspace)
  assert.ok(hostRefreshCount > refreshBeforeRoute)

  hostApprovals.length = 0
  const panelMcpSave = await invoke('/__dsh-capability-switch/mcp/save', 'POST', { name: 'route-mcp', transport: 'stdio', command: 'route-cmd', args: [], env: {}, enabled: true })
  assert.equal(panelMcpSave.status, 200)
  assert.equal(config.servers['route-mcp'].command, 'route-cmd')
  await invoke('/__dsh-capability-switch/mcp/toggle', 'POST', { name: 'route-mcp', enabled: false })
  const panelMcpEnable = await invoke('/__dsh-capability-switch/mcp/toggle', 'POST', { name: 'route-mcp', enabled: true })
  assert.equal(panelMcpEnable.status, 200)
  assert.equal(config.servers['route-mcp'].enabled, true)
  const panelBatch = await invoke('/__dsh-capability-switch/mcp/save-batch', 'POST', { servers: [{ name: 'route-batch', transport: 'stdio', command: 'route-batch-cmd', args: [], env: {}, enabled: true }] })
  assert.equal(panelBatch.status, 200)
  assert.equal(config.servers['route-batch'].command, 'route-batch-cmd')
  const panelRegisteredTest = await invoke('/__dsh-capability-switch/mcp/test', 'POST', { name: 'registered-mcp' })
  assert.equal(panelRegisteredTest.status, 200)
  assert.equal(panelRegisteredTest.data.ok, true)
  assert.equal(hostApprovals.length, 0)

  const workspaceExec = { agent: { id: 'test-session', session: { id: 'test-session' } }, callId: 'call-workspace', signal: new AbortController().signal }
  hostApprovals.length = 0
  approvalOutcome = 'allowed-once'
  sandboxPolicyAvailable = true
  sandboxMode = 'workspace-write'
  sandboxRoot = projectWorkspace
  sandboxAdditional = []
  const insideWorkspace = await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-inside', parent: projectWorkspace }, workspaceExec)
  assert.equal(insideWorkspace.workspace.path, join(projectWorkspace, 'tool-workspace-inside'))
  assert.equal(hostApprovals.length, 0)
  await fs.access(join(projectWorkspace, 'tool-workspace-inside'))
  hostApprovals.length = 0
  const outsideWorkspace = await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-outside', parent: join(temp, 'outside-parent') }, workspaceExec)
  assert.equal(outsideWorkspace.workspace.path, join(temp, 'outside-parent', 'tool-workspace-outside'))
  assert.equal(hostApprovals.length, 1)
  assert.equal(hostApprovals[0].callId, 'call-workspace')
  assert.match(hostApprovals[0].reason, /workspace_create/)
  assert.match(hostApprovals[0].displayReason.zh, /创建并注册工作区/)
  assert.match(hostApprovals[0].displayReason.en, /create and register a workspace/)
  await fs.access(join(temp, 'outside-parent', 'tool-workspace-outside'))
  approvalOutcome = 'rejected'
  hostApprovals.length = 0
  const workspaceCountBeforeRefused = workspaceRecords.length
  await assert.rejects(() => agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-refused', parent: join(temp, 'refused-parent') }, workspaceExec), /未批准/)
  assert.equal(hostApprovals.length, 1)
  assert.equal(workspaceRecords.length, workspaceCountBeforeRefused)
  await assert.rejects(() => fs.access(join(temp, 'refused-parent', 'tool-workspace-refused')))
  sandboxMode = 'read-only'
  approvalOutcome = 'allowed-once'
  hostApprovals.length = 0
  await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-readonly', parent: projectWorkspace }, workspaceExec)
  assert.equal(hostApprovals.length, 1)
  assert.match(hostApprovals[0].displayReason.zh, /只读/)
  sandboxMode = 'danger-full-access'
  hostApprovals.length = 0
  await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-full', parent: join(temp, 'full-parent') }, workspaceExec)
  assert.equal(hostApprovals.length, 0)
  sandboxMode = 'workspace-write'
  const extraRoot = join(temp, 'extra-root')
  await fs.mkdir(extraRoot, { recursive: true })
  sandboxAdditional = [extraRoot]
  hostApprovals.length = 0
  await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-extra', parent: extraRoot }, workspaceExec)
  assert.equal(hostApprovals.length, 0)
  sandboxAdditional = []
  const escapeTarget = join(temp, 'escape-target')
  await fs.mkdir(escapeTarget, { recursive: true })
  const escapeLink = join(projectWorkspace, 'escape-link')
  await fs.symlink(escapeTarget, escapeLink, process.platform === 'win32' ? 'junction' : 'dir')
  hostApprovals.length = 0
  await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-escape', parent: escapeLink }, workspaceExec)
  assert.equal(hostApprovals.length, 1)
  await fs.access(join(escapeTarget, 'tool-workspace-escape'))
  sandboxPolicyAvailable = false
  hostApprovals.length = 0
  await agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-nopolicy', parent: join(temp, 'nopolicy-parent') }, workspaceExec)
  assert.equal(hostApprovals.length, 1)
  assert.match(hostApprovals[0].reason, /without a resolvable session file policy/)
  sandboxPolicyAvailable = true
  approvalAvailable = false
  const workspaceCountBeforeNoApproval = workspaceRecords.length
  await assert.rejects(() => agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-noapproval', parent: join(temp, 'noapproval-parent') }, workspaceExec), /审批服务/)
  assert.equal(workspaceRecords.length, workspaceCountBeforeNoApproval)
  await assert.rejects(() => fs.access(join(temp, 'noapproval-parent', 'tool-workspace-noapproval')))
  approvalAvailable = true
  agentsInitiator = undefined
  const workspaceCountBeforeNoAgent = workspaceRecords.length
  await assert.rejects(() => agentTool.execute({ action: 'workspace_create', name: 'tool-workspace-noagent', parent: join(temp, 'noagent-parent') }), /没有可路由的 Agent/)
  assert.equal(workspaceRecords.length, workspaceCountBeforeNoAgent)
  agentsInitiator = { id: 'test-session' }

  const exec = { agent: { id: 'test-session' }, callId: 'call-approval', signal: new AbortController().signal }
  hostApprovals.length = 0
  const toolSaved = await agentTool.execute({ action: 'mcp_save', server: { name: 'tool-stdio', transport: 'stdio', command: 'tool-cmd', args: ['--flag'], env: {}, enabled: true } }, exec)
  assert.equal(toolSaved.name, 'tool-stdio')
  assert.equal(hostApprovals.length, 1)
  assert.equal(hostApprovals[0].toolName, 'capability_manager')
  assert.equal(hostApprovals[0].callId, 'call-approval')
  assert.equal(hostApprovals[0].agent.id, 'test-session')
  assert.equal(hostApprovals[0].signal, exec.signal)
  assert.match(hostApprovals[0].reason, /stdio/)
  assert.match(hostApprovals[0].reason, /tool-stdio/)
  assert.match(hostApprovals[0].displayReason.en, /Allow/)
  assert.match(hostApprovals[0].displayReason.en, /tool-cmd --flag/)
  assert.match(hostApprovals[0].displayReason.zh, /允许/)
  assert.match(hostApprovals[0].displayReason.zh, /tool-cmd --flag/)
  hostApprovals.length = 0
  await agentTool.execute({ action: 'mcp_save', server: { name: 'tool-http', transport: 'streamable-http', url: 'https://example.com/mcp', headers: {}, enabled: true } }, exec)
  assert.equal(hostApprovals.length, 0)
  await agentTool.execute({ action: 'mcp_save', server: { name: 'tool-disabled', transport: 'stdio', command: 'off', enabled: false } }, exec)
  assert.equal(hostApprovals.length, 0)
  assert.equal(config.servers['tool-disabled'].enabled, false)
  hostApprovals.length = 0
  await agentTool.execute({ action: 'mcp_toggle', name: 'tool-stdio', enabled: false }, exec)
  assert.equal(hostApprovals.length, 0)
  assert.equal(config.servers['tool-stdio'].enabled, false)
  hostApprovals.length = 0
  await agentTool.execute({ action: 'mcp_restart', name: 'registered-mcp' }, exec)
  assert.equal(hostApprovals.length, 1)
  assert.match(hostApprovals[0].reason, /plugin-registered/)
  assert.match(hostApprovals[0].displayReason.zh, /由其他插件注册/)
  assert.match(hostApprovals[0].displayReason.en, /registered by another plugin/)
  approvalOutcome = 'rejected'
  await assert.rejects(() => agentTool.execute({ action: 'mcp_toggle', name: 'tool-stdio', enabled: true }, exec), /未批准/)
  assert.equal(config.servers['tool-stdio'].enabled, false)
  await assert.rejects(() => agentTool.execute({ action: 'mcp_restart', name: 'tool-stdio' }, exec), /未批准/)
  approvalOutcome = 'cancelled'
  await assert.rejects(() => agentTool.execute({ action: 'mcp_test', name: 'tool-stdio' }, exec), /取消/)
  approvalOutcome = 'unavailable'
  await assert.rejects(() => agentTool.execute({ action: 'mcp_toggle', name: 'tool-stdio', enabled: true }, exec), /审批通道/)
  approvalAvailable = false
  approvalOutcome = 'allowed-once'
  await assert.rejects(() => agentTool.execute({ action: 'mcp_test', name: 'tool-stdio' }, exec), /审批服务/)
  approvalAvailable = true
  hostApprovals.length = 0
  agentsInitiator = undefined
  await assert.rejects(() => agentTool.execute({ action: 'mcp_restart', name: 'tool-stdio' }, { callId: 'call-no-agent', signal: exec.signal }), /没有可路由的 Agent/)
  assert.equal(hostApprovals.length, 0)
  agentsInitiator = { id: 'test-session' }
  approvalOutcome = 'rejected'
  await assert.rejects(() => agentTool.execute({ action: 'mcp_save', server: { name: 'tool-refused', transport: 'stdio', command: 'nope', enabled: true } }, exec), /未批准/)
  assert.equal(config.servers['tool-refused'], undefined)
  approvalOutcome = 'allowed-once'

  console.log('UI i18n (8 locales), Skills and MCP batch delete, ZIP import, localized releases, MCP listing/import/control, approval gates, workspace authorization, Host routes, and agent tool passed.')
} finally {
  if (resolve(temp).startsWith(resolve(tmpdir()))) await fs.rm(temp, { recursive: true, force: true })
}

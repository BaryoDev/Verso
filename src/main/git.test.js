// @vitest-environment node
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRootStore } from './roots'
import { setupGitIPC } from './git'

const handlers = {}
vi.mock('electron', () => ({ ipcMain: { handle: (channel, fn) => (handlers[channel] = fn) } }))

const call = (channel, ...args) => handlers[channel]({}, ...args)
const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' }).toString()
const configure = (cwd) => {
  git(cwd, 'config', 'user.name', 'Verso Test')
  git(cwd, 'config', 'user.email', 'test@example.com')
  git(cwd, 'config', 'commit.gpgsign', 'false')
}

describe('git handlers', () => {
  let base, outer, project, store

  beforeEach(() => {
    base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'verso-git-')))
    outer = path.join(base, 'outer')
    project = path.join(outer, 'book')
    fs.mkdirSync(project, { recursive: true })
    git(outer, 'init', '-q')
    configure(outer)
    fs.writeFileSync(path.join(outer, 'secret.md'), 'outer secret\n')
    git(outer, 'add', 'secret.md')
    git(outer, 'commit', '-q', '-m', 'outer')
    store = createRootStore(path.join(base, 'roots.json'))
    store.allow(project)
    setupGitIPC(store)
  })
  afterEach(() => fs.rmSync(base, { recursive: true, force: true }))

  it('never uses a repository in a parent folder', async () => {
    fs.writeFileSync(path.join(outer, 'secret.md'), 'changed\n')
    expect(await call('git:status', project)).toBeNull()
    expect(await call('git:diff', project, ':/')).toBeNull()
    expect(await call('git:restore', project, ':/')).toBe(false)
    await expect(call('git:commit', project, 'x')).rejects.toThrow()
    expect(fs.readFileSync(path.join(outer, 'secret.md'), 'utf-8')).toBe('changed\n')
  })

  it('works inside the project and refuses files outside it', async () => {
    expect(await call('git:init', project)).toBe(true)
    configure(project)
    fs.writeFileSync(path.join(project, 'one.md'), 'first\n')
    expect(await call('git:add', project, '.')).toBe(true)
    expect(await call('git:commit', project, 'first')).toBe(true)
    fs.writeFileSync(path.join(project, 'one.md'), 'second\n')

    expect(await call('git:getFileAtRevision', project, path.join(project, 'one.md'), 'HEAD')).toBe('first\n')
    expect(await call('git:getFileAtRevision', project, 'one.md', 'HEAD')).toBe('first\n')
    expect(await call('git:getFileAtRevision', project, '../secret.md', 'HEAD')).toBeNull()
    expect(await call('git:getFileAtRevision', project, 'one.md', '--output=/tmp/x')).toBeNull()

    expect(await call('git:diff', project, 'one.md')).toContain('+second')
    expect(await call('git:diff', project, ':(top)one.md')).toBe('')
    expect(await call('git:diff', project, path.join(outer, 'secret.md'))).toBeNull()

    await expect(call('git:add', project, '../secret.md')).rejects.toThrow('outside')
    await expect(call('git:add', project, '.git/config')).rejects.toThrow('outside')
    await expect(call('git:init', base)).rejects.toThrow('outside')

    expect(await call('git:restore', project, '../secret.md')).toBe(false)
    expect(await call('git:restore', project, 'one.md')).toBe(true)
    expect(fs.readFileSync(path.join(project, 'one.md'), 'utf-8')).toBe('first\n')
  })
})

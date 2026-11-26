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
    store = createRootStore(path.join(base, 'state', 'roots.json'))
    store.allow(project)
    setupGitIPC(store, { hooksPath: path.join(base, 'state', 'no-hooks') })
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

  it('never falls back to the parent repository when the folder has a broken .git', async () => {
    fs.mkdirSync(path.join(project, '.git'))
    fs.writeFileSync(path.join(outer, 'secret.md'), 'changed\n')
    expect(await call('git:status', project)).toBeNull()
    await expect(call('git:commit', project, 'x')).rejects.toThrow('not a git repository')
    expect(git(outer, 'status', '--porcelain')).toContain('secret.md')
  })

  it('leaves alone a repository kept inside the opened folder', async () => {
    const inner = path.join(project, 'other')
    fs.mkdirSync(inner)
    git(inner, 'init', '-q')
    configure(inner)
    fs.writeFileSync(path.join(inner, 'a.md'), 'a\n')
    expect(await call('git:status', inner)).toBeNull()
    await expect(call('git:add', inner, 'a.md')).rejects.toThrow('not an opened folder')
    await expect(call('git:commit', inner, 'x')).rejects.toThrow('not an opened folder')
    await expect(call('git:init', path.join(project, 'sub'))).rejects.toThrow('not an opened folder')
    expect(git(inner, 'status', '--porcelain')).toContain('a.md')
  })

  it('never treats files the page wrote as a repository', async () => {
    const marker = path.join(base, 'ran')
    for (const d of ['objects', 'refs', 'refs/heads']) fs.mkdirSync(path.join(project, d), { recursive: true })
    fs.writeFileSync(path.join(project, 'HEAD'), 'ref: refs/heads/main\n')
    fs.writeFileSync(
      path.join(project, 'config'),
      `[core]\n\tbare = false\n\tworktree = ${project}\n\tfsmonitor = "touch '${marker}'"\n`
    )
    expect(await call('git:status', project)).toBeNull()
    expect(await call('git:diff', project, 'HEAD')).toBeNull()
    await expect(call('git:commit', project, 'x')).rejects.toThrow('not a git repository')
    expect(fs.existsSync(marker)).toBe(false)
  })

  it('refuses a repository whose git folder the page could write', async () => {
    git(project, 'init', '-q', `--separate-git-dir=${path.join(project, 'notes')}`)
    configure(project)
    expect(await call('git:status', project)).toBeNull()
    await expect(call('git:commit', project, 'x')).rejects.toThrow('not a git repository')
  })

  it('never runs hooks, even ones the repository points to', async () => {
    const marker = path.join(base, 'hook-ran')
    expect(await call('git:init', project)).toBe(true)
    configure(project)
    git(project, 'config', 'core.hooksPath', '.husky')
    fs.mkdirSync(path.join(project, '.husky'))
    for (const hook of ['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'post-checkout']) {
      fs.writeFileSync(path.join(project, '.husky', hook), `#!/bin/sh\necho ${hook} >> '${marker}'\n`, { mode: 0o755 })
    }
    fs.writeFileSync(path.join(project, 'one.md'), 'first\n')
    expect(await call('git:add', project, 'one.md')).toBe(true)
    expect(await call('git:commit', project, 'first')).toBe(true)
    fs.writeFileSync(path.join(project, 'one.md'), 'second\n')
    expect(await call('git:restore', project, 'one.md')).toBe(true)
    expect(fs.readFileSync(path.join(project, 'one.md'), 'utf-8')).toBe('first\n')
    expect(fs.existsSync(marker)).toBe(false)
  })

  it('restores only the file named, even when its name looks like a pattern', async () => {
    expect(await call('git:init', project)).toBe(true)
    configure(project)
    const names = ['Chapter 1.md', 'Chapter [1].md']
    for (const name of names) fs.writeFileSync(path.join(project, name), 'first\n')
    expect(await call('git:add', project, '.')).toBe(true)
    expect(await call('git:commit', project, 'first')).toBe(true)
    for (const name of names) fs.writeFileSync(path.join(project, name), 'second\n')
    expect(await call('git:restore', project, 'Chapter [1].md')).toBe(true)
    expect(fs.readFileSync(path.join(project, 'Chapter [1].md'), 'utf-8')).toBe('first\n')
    expect(fs.readFileSync(path.join(project, 'Chapter 1.md'), 'utf-8')).toBe('second\n')
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
    const out = path.join(base, 'out')
    fs.mkdirSync(out + ':.')
    expect(await call('git:getFileAtRevision', project, 'one.md', `--output=${out}`)).toBeNull()
    expect(fs.existsSync(path.join(out + ':.', 'one.md'))).toBe(false)

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

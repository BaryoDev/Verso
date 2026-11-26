// @vitest-environment node
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRootStore, checkProjectName } from './roots'

describe('createRootStore', () => {
  let dir
  let file
  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'verso-roots-')))
    file = path.join(dir, 'state', 'allowed-roots.json')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('refuses every path before a folder is opened', () => {
    const store = createRootStore(file)
    expect(() => store.check('/etc/hosts')).toThrow('outside the opened folders')
  })

  it('allows the opened folder and what is inside it, nothing else', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    store.allow(root)
    expect(store.check(root)).toBe(root)
    expect(store.check(path.join(root, 'Chapters', 'one.md'))).toBe(path.join(root, 'Chapters', 'one.md'))
    expect(() => store.check(path.join(root, '..', 'other.md'))).toThrow()
    expect(() => store.check(root + '-sibling/file.md')).toThrow()
    expect(() => store.check(path.join(os.homedir(), '.zshrc'))).toThrow()
    expect(() => store.check('')).toThrow()
    expect(() => store.check(undefined)).toThrow()
  })

  it('keeps opened folders across restarts and ignores a damaged file', () => {
    const root = path.join(dir, 'Poems')
    createRootStore(file).allow(root)
    expect(createRootStore(file).check(path.join(root, 'a.md'))).toBe(path.join(root, 'a.md'))

    fs.writeFileSync(file, '{not json')
    expect(() => createRootStore(file).check(path.join(root, 'a.md'))).toThrow()

    fs.writeFileSync(file, JSON.stringify(['relative', 42, root]))
    const store = createRootStore(file)
    expect(store.check(path.join(root, 'a.md'))).toBe(path.join(root, 'a.md'))
    expect(() => store.check(path.resolve('relative', 'a.md'))).toThrow()
  })

  it('follows links before deciding', () => {
    const root = path.join(dir, 'Novel')
    const outside = path.join(dir, 'outside')
    fs.mkdirSync(root)
    fs.mkdirSync(outside)
    fs.writeFileSync(path.join(outside, 'secret.md'), 's')
    fs.symlinkSync(outside, path.join(root, 'link'))
    fs.symlinkSync(path.join(outside, 'new.md'), path.join(root, 'dangling.md'))
    fs.symlinkSync(root, path.join(dir, 'via-link'))
    const store = createRootStore(file)
    store.allow(root)
    expect(() => store.check(path.join(root, 'link', 'secret.md'))).toThrow('outside the opened folders')
    expect(() => store.check(path.join(root, 'link', 'new.md'))).toThrow('outside the opened folders')
    expect(() => store.check(path.join(root, 'dangling.md'))).toThrow('outside the opened folders')
    expect(store.check(path.join(dir, 'via-link', 'a.md'))).toBe(path.join(root, 'a.md'))
    expect(store.allow(path.join(dir, 'via-link'))).toBe(root)
  })

  it.each([
    ['.git', 'hooks', 'pre-commit'],
    ['.git', 'config'],
    ['.GIT', 'config'],
    ['.git.', 'config'],
    ['GIT~1', 'config'],
    ['sub', '.git'],
    ['.git::$INDEX_ALLOCATION', 'config'],
    ['.git ', 'config'],
    ['.git']
  ])('refuses git internals at %s', (...parts) => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    store.allow(root)
    expect(() => store.check(path.join(root, ...parts))).toThrow('outside the opened folders')
  })

  it('allows git files that run nothing and refuses a .git folder as a root', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    store.allow(root)
    expect(store.check(path.join(root, '.gitignore'))).toBe(path.join(root, '.gitignore'))
    expect(() => store.allow(path.join(root, '.git'))).toThrow('invalid folder')
  })

  it('refuses a .git folder reached through a link', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    fs.mkdirSync(path.join(root, '.git'), { recursive: true })
    fs.symlinkSync(path.join(root, '.git'), path.join(root, 'alias'))
    store.allow(root)
    expect(() => store.check(path.join(root, 'alias', 'config'))).toThrow('outside the opened folders')
    expect(() => store.allow(path.join(root, 'alias'))).toThrow('invalid folder')
  })

  it('refuses a path through an entry named .git even when it links to a plain folder', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    fs.mkdirSync(path.join(root, 'notes'), { recursive: true })
    fs.symlinkSync(path.join(root, 'notes'), path.join(root, '.git'))
    store.allow(root)
    expect(() => store.check(path.join(root, '.git', 'config'))).toThrow('outside the opened folders')
  })

  it('never opens an entry named .git, even one that links to a plain folder', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    fs.mkdirSync(path.join(root, 'notes'), { recursive: true })
    fs.symlinkSync(path.join(root, 'notes'), path.join(root, '.git'))
    expect(() => store.allow(path.join(root, '.git'))).toThrow('invalid folder')
  })

  it('gives the same answer for an unreadable outside folder as for any outside path', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    const locked = path.join(root, 'locked')
    fs.mkdirSync(locked, { recursive: true })
    fs.symlinkSync(path.join(dir, 'b'), path.join(dir, 'a'))
    fs.symlinkSync(path.join(dir, 'a'), path.join(dir, 'b'))
    store.allow(root)
    expect(() => store.check(path.join(dir, 'a', 'x.md'))).toThrow('outside the opened folders')
    fs.chmodSync(locked, 0)
    try {
      expect(() => store.check(path.join(locked, 'x.md'))).toThrow('cannot read this folder')
    } finally {
      fs.chmodSync(locked, 0o755)
    }
  })

  it('never opens the home folder, a folder above it, or its own folder', () => {
    const home = path.join(dir, 'home', 'me')
    const store = createRootStore(file, { home })
    for (const wide of [home, path.join(dir, 'home'), dir, '/', path.dirname(file), path.join(path.dirname(file), 'x')]) {
      expect(() => store.allow(wide)).toThrow('invalid folder')
    }
    expect(store.allow(path.join(home, 'Novel'))).toBe(path.join(home, 'Novel'))
    expect(() => createRootStore(file).allow(os.homedir())).toThrow('invalid folder')
  })

  it('never opens or creates a folder in a settings area under home', () => {
    const home = path.join(dir, 'home', 'me')
    const store = createRootStore(file, { home })
    for (const parts of [
      ['.config', 'fish'],
      ['.local', 'share', 'Novel'],
      ['Library'],
      ['Library', 'LaunchAgents'],
      ['library', 'Application Support', 'Novel'],
      ['AppData', 'Roaming', 'Novel'],
      ['Documents', 'PowerShell'],
      ['Documents', 'WindowsPowerShell', 'Scripts']
    ]) {
      expect(() => store.allow(path.join(home, ...parts))).toThrow('invalid folder')
      expect(() => store.vet(path.join(home, ...parts))).toThrow('invalid folder')
    }
    for (const parts of [
      ['Novel'],
      ['Documents', 'Novel'],
      ['Library', 'Mobile Documents', 'com~apple~CloudDocs', 'Novel'],
      ['Library', 'CloudStorage', 'Dropbox', 'Novel']
    ]) {
      expect(store.allow(path.join(home, ...parts))).toBe(path.join(home, ...parts))
    }
  })

  it('never reaches a folder that runs files, even inside an opened folder', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Documents')
    fs.mkdirSync(path.join(root, 'PowerShell'), { recursive: true })
    fs.mkdirSync(path.join(root, 'sub', 'Startup'), { recursive: true })
    fs.symlinkSync(path.join(root, 'PowerShell'), path.join(root, 'alias'))
    store.allow(root)
    for (const parts of [
      ['PowerShell', 'Microsoft.PowerShell_profile.ps1'],
      ['powershell.', 'profile.ps1'],
      ['WindowsPowerShell', 'profile.ps1'],
      ['sub', 'Startup', 'run.lnk'],
      ['alias', 'profile.ps1']
    ]) {
      expect(() => store.check(path.join(root, ...parts))).toThrow('outside the opened folders')
    }
    expect(() => store.allow(path.join(root, 'sub', 'Startup'))).toThrow('invalid folder')
    expect(store.check(path.join(root, 'Novel', 'a.md'))).toBe(path.join(root, 'Novel', 'a.md'))
  })

  it('drops saved folders it would refuse to open', () => {
    const home = path.join(dir, 'home', 'me')
    const root = path.join(home, 'Novel')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify([home, '/', root]))
    const store = createRootStore(file, { home })
    expect(store.check(path.join(root, 'a.md'))).toBe(path.join(root, 'a.md'))
    expect(() => store.check(path.join(home, '.gitconfig'))).toThrow('outside the opened folders')
    expect(() => store.check('/etc/hosts')).toThrow('outside the opened folders')
  })

  it('tells an opened folder from a folder inside one', () => {
    const store = createRootStore(file)
    const root = path.join(dir, 'Novel')
    store.allow(root)
    expect(store.checkRoot(root)).toBe(root)
    expect(() => store.checkRoot(path.join(root, 'other-repo'))).toThrow('not an opened folder')
    expect(() => store.checkRoot(path.join(dir, 'outside'))).toThrow('outside the opened folders')
  })
})

describe('checkProjectName', () => {
  it.each(['My Novel', 'poems-2026'])('accepts %s', (name) => {
    expect(checkProjectName(name)).toBe(name)
  })

  it.each([
    '',
    ' ',
    '.',
    '..',
    '../escape',
    'a/b',
    'a\\b',
    'a:b',
    '.git',
    '.Git',
    '.ssh',
    '.config',
    'PowerShell',
    'WindowsPowerShell',
    'powershell. ',
    'LaunchAgents',
    'autostart',
    'Startup',
    null
  ])('refuses %s', (name) => {
    expect(() => checkProjectName(name)).toThrow('invalid project name')
  })
})

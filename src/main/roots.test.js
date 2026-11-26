// @vitest-environment node
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRootStore, checkProjectName } from './roots'

describe('createRootStore', () => {
  let dir
  let file
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verso-roots-'))
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

  it('handles a disk root picked in the dialog', () => {
    const store = createRootStore(file)
    store.allow('/')
    expect(store.check('/Volumes/Book/a.md')).toBe('/Volumes/Book/a.md')
  })
})

describe('checkProjectName', () => {
  it.each(['My Novel', 'poems-2026'])('accepts %s', (name) => {
    expect(checkProjectName(name)).toBe(name)
  })

  it.each(['', ' ', '.', '..', '../escape', 'a/b', 'a\\b', null])('refuses %s', (name) => {
    expect(() => checkProjectName(name)).toThrow('invalid project name')
  })
})

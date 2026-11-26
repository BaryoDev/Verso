// @vitest-environment node
import fs from 'fs'
import fsp from 'fs/promises'
import os from 'os'
import path from 'path'
import { createRootStore } from './roots'
import { setupIPC } from './ipc'

const handlers = {}
const dialogState = vi.hoisted(() => ({ picked: null }))
vi.mock('electron', () => ({
  ipcMain: { handle: (channel, fn) => (handlers[channel] = fn) },
  dialog: {
    showOpenDialog: async () =>
      dialogState.picked ? { canceled: false, filePaths: [dialogState.picked] } : { canceled: true, filePaths: [] }
  }
}))

const call = (channel, ...args) => handlers[channel]({}, ...args)
const pick = (dir) => (dialogState.picked = dir)

describe('file handlers', () => {
  let base, home, outside

  beforeEach(() => {
    base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'verso-ipc-')))
    home = path.join(base, 'home')
    outside = path.join(base, 'outside')
    fs.mkdirSync(home)
    fs.mkdirSync(outside)
    fs.writeFileSync(path.join(home, 'notes.md'), 'private\n')
    setupIPC(createRootStore(path.join(base, 'state', 'roots.json'), { home }))
    pick(null)
  })
  afterEach(() => fs.rmSync(base, { recursive: true, force: true }))

  it('opens the folder chosen in the dialog but never the home folder', async () => {
    pick(home)
    await expect(call('dialog:openDirectory')).rejects.toThrow('invalid folder')
    const novel = path.join(home, 'Novel')
    fs.mkdirSync(novel)
    pick(novel)
    expect(await call('dialog:openDirectory')).toBe(novel)
    await expect(call('fs:readDir', home)).rejects.toThrow('outside the opened folders')
    await expect(call('fs:readFile', path.join(home, 'notes.md'))).rejects.toThrow('outside the opened folders')
    expect((await call('fs:readDir', novel))[0].id).toBe(novel)
  })

  it('creates a project where the person chose without opening that folder', async () => {
    const details = { parentPath: home, projectName: 'Book', type: 'novel' }
    await expect(call('fs:createProject', details)).rejects.toThrow('choose where')

    pick(home)
    expect(await call('dialog:chooseParent')).toBe(home)
    await expect(call('fs:createProject', { ...details, parentPath: outside })).rejects.toThrow('choose where')

    expect(await call('dialog:chooseParent')).toBe(home)
    const book = await call('fs:createProject', details)
    expect(book).toBe(path.join(home, 'Book'))
    expect(await call('fs:readFile', path.join(book, 'Chapters', 'Chapter 1.md'))).toContain('Chapter 1')
    await expect(call('fs:readFile', path.join(home, 'notes.md'))).rejects.toThrow('outside the opened folders')
    await expect(call('fs:createProject', { ...details, projectName: 'Second' })).rejects.toThrow('choose where')
  })

  it('takes back a project it could not finish, so the name can be used again', async () => {
    const details = { parentPath: home, projectName: 'Book', type: 'novel' }
    pick(home)
    await call('dialog:chooseParent')
    const write = vi.spyOn(fsp, 'writeFile').mockRejectedValueOnce(new Error('disk full'))
    try {
      await expect(call('fs:createProject', details)).rejects.toThrow('disk full')
    } finally {
      write.mockRestore()
    }
    expect(fs.existsSync(path.join(home, 'Book'))).toBe(false)
    await call('dialog:chooseParent')
    expect(await call('fs:createProject', details)).toBe(path.join(home, 'Book'))
  })

  it('forgets the chosen place when the dialog is cancelled', async () => {
    pick(home)
    await call('dialog:chooseParent')
    pick(null)
    expect(await call('dialog:chooseParent')).toBeNull()
    await expect(call('fs:createProject', { parentPath: home, projectName: 'Book', type: 'poem' })).rejects.toThrow(
      'choose where'
    )
  })

  it('refuses a project name that is already there, link or not', async () => {
    fs.symlinkSync(outside, path.join(home, 'Link'))
    fs.mkdirSync(path.join(home, 'Mine'))
    fs.writeFileSync(path.join(home, 'Mine', 'verso.config.json'), 'mine')
    pick(home)
    for (const projectName of ['Link', 'Mine']) {
      await call('dialog:chooseParent')
      await expect(call('fs:createProject', { parentPath: home, projectName, type: 'novel' })).rejects.toThrow()
    }
    expect(fs.readdirSync(outside)).toEqual([])
    expect(fs.readFileSync(path.join(home, 'Mine', 'verso.config.json'), 'utf-8')).toBe('mine')
  })
})

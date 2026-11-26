import { contextBridge, ipcRenderer } from 'electron'

// The only API the page gets. Each call names one channel, so page code cannot
// reach any other IPC channel or the process environment.
const api = {
  files: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    saveFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    createProject: (details) => ipcRenderer.invoke('fs:createProject', details)
  },
  git: {
    status: (path) => ipcRenderer.invoke('git:status', path),
    add: (path, files) => ipcRenderer.invoke('git:add', path, files),
    commit: (path, message) => ipcRenderer.invoke('git:commit', path, message),
    push: (path) => ipcRenderer.invoke('git:push', path),
    log: (path) => ipcRenderer.invoke('git:log', path),
    init: (path) => ipcRenderer.invoke('git:init', path),
    diff: (path, file) => ipcRenderer.invoke('git:diff', path, file),
    restore: (path, file) => ipcRenderer.invoke('git:restore', path, file),
    getFileAtRevision: (path, file, revision) =>
      ipcRenderer.invoke('git:getFileAtRevision', path, file, revision)
  }
}

contextBridge.exposeInMainWorld('api', api)

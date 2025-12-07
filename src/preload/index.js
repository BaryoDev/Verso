import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
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
      commit: (path, message) => ipcRenderer.invoke('git:commit', path, message),
      push: (path) => ipcRenderer.invoke('git:push', path),
      log: (path) => ipcRenderer.invoke('git:log', path),
      init: (path) => ipcRenderer.invoke('git:init', path),
      diff: (path, file) => ipcRenderer.invoke('git:diff', path, file),
      restore: (path, file) => ipcRenderer.invoke('git:restore', path, file),
      getFileAtRevision: (path, file, revision) => ipcRenderer.invoke('git:getFileAtRevision', path, file, revision)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

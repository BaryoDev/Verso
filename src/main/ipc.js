import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';

// Helper to scan directory
async function readDirRecursive(dirPath, rootPath = null) {
  if (!rootPath) rootPath = dirPath;
  
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  const children = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);
    // Use relative path or full path as ID for now
    const id = fullPath;
    
    // Ignore hidden files / node_modules for sanity
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return null;

    if (entry.isDirectory()) {
      return {
        id,
        name: entry.name,
        type: 'folder',
        children: await readDirRecursive(fullPath, rootPath)
      };
    } else {
      // Only show md/txt files or similar? Let's show all for now
      return {
        id,
        name: entry.name,
        type: 'file',
        path: fullPath
      };
    }
  }));
  
  return children.filter(Boolean);
}

export function setupIPC() {
  // Open Directory Dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) return null;
    return filePaths[0]; // Return the path string
  });

  // Read Directory (Recursive)
  ipcMain.handle('fs:readDir', async (_, dirPath) => {
    try {
      const children = await readDirRecursive(dirPath);
      // Return as a root node
      return [{
        id: dirPath,
        name: path.basename(dirPath),
        type: 'folder',
        children
      }];
    } catch (error) {
      console.error('fs:readDir error:', error);
      return [];
    }
  });

  // Read File
  ipcMain.handle('fs:readFile', async (_, filePath) => {
    return await fs.readFile(filePath, 'utf-8');
  });

  // Write File
  ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  });
}

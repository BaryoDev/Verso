import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { checkProjectName } from './roots';

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

export function setupIPC(roots) {
  // Where the person chose to put a new project. It is good for one
  // createProject call and is never opened itself, so choosing a parent such as
  // the home folder does not give the page that folder.
  let chosenParent = null;

  // Open Directory Dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) return null;
    return roots.allow(filePaths[0]); // Return the path string
  });

  ipcMain.handle('dialog:chooseParent', async () => {
    chosenParent = null;
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (canceled) return null;
    chosenParent = await fs.realpath(filePaths[0]);
    return chosenParent;
  });

  // Read Directory (Recursive). A folder that was never opened is refused, so
  // the page can tell the person to open it again.
  ipcMain.handle('fs:readDir', async (_, dirPath) => {
    dirPath = roots.check(dirPath);
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
    return await fs.readFile(roots.check(filePath), 'utf-8');
  });

  // Write File
  ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    await fs.writeFile(roots.check(filePath), content, 'utf-8');
    return true;
  });

  // Create Project
  ipcMain.handle('fs:createProject', async (_, { parentPath, projectName, type, author } = {}) => {
    try {
      const parent = chosenParent;
      chosenParent = null;
      if (!parent || typeof parentPath !== 'string' || path.resolve(parentPath) !== parent) {
        throw new Error('choose where to put the project first');
      }
      const projectPath = roots.vet(path.join(parent, checkProjectName(projectName)));

      // 1. Create Project Root. Not recursive, so an existing folder or link of
      // that name is refused instead of written through.
      await fs.mkdir(projectPath);

      // 2. Create verso.config.json
      const config = {
        name: projectName,
        type: type, // 'novel', 'poem', 'screenplay', 'general'
        created: new Date().toISOString(),
        author: author || 'Unknown',
        version: '1.0.0'
      };
      await fs.writeFile(
        path.join(projectPath, 'verso.config.json'), 
        JSON.stringify(config, null, 2), 
        'utf-8'
      );

      // 3. Scaffold Folders based on Type
      const folders = [];
      if (type === 'novel') {
        folders.push('Chapters', 'Characters', 'Notes', 'Research');
      } else if (type === 'screenplay') {
        folders.push('Scenes', 'Characters', 'Notes');
      } else if (type === 'poem') {
        folders.push('Drafts', 'Published');
      } else {
        folders.push('Docs');
      }

      for (const folder of folders) {
        await fs.mkdir(path.join(projectPath, folder), { recursive: true });
      }

      // 4. Create initial file (optional)
      if (type === 'novel') {
        await fs.writeFile(
          path.join(projectPath, 'Chapters', 'Chapter 1.md'),
          '# Chapter 1\n\nIt was a dark and stormy night...',
          'utf-8'
        );
      }

      return roots.allow(projectPath);
    } catch (error) {
      console.error('fs:createProject error:', error);
      throw error;
    }
  });
}

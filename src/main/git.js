import { ipcMain } from 'electron';
import simpleGit from 'simple-git';

export function setupGitIPC() {
  // Initialize git instance for a specific path on each request or cache?
  // simpleGit(path) creates an instance.
  
  // Get Status
  ipcMain.handle('git:status', async (_, projectPath) => {
    try {
      const git = simpleGit(projectPath);
      const status = await git.status();
      // Ensure we have a plain object. 
      // simple-git status object contains prototypes/methods which break IPC.
      // JSON stringify/parse is the safest way to strip them.
      if (!status) return null;
      return JSON.parse(JSON.stringify(status));
    } catch (error) {
      console.error('git:status error:', error);
      return null;
    }
  });

  // Stage changes
  ipcMain.handle('git:add', async (_, projectPath, files) => {
      const git = simpleGit(projectPath);
      await git.add(files); // files can be '.' or array
      return true;
  });

  // Commit
  ipcMain.handle('git:commit', async (_, projectPath, message) => {
      const git = simpleGit(projectPath);
      await git.commit(message);
      return true;
  });

  // Push
  ipcMain.handle('git:push', async (_, projectPath) => {
      const git = simpleGit(projectPath);
      await git.push();
      return true;
  });
  
  // Log (History)
  ipcMain.handle('git:log', async (_, projectPath) => {
      try {
        const git = simpleGit(projectPath);
        const log = await git.log();
        return log;
      } catch (e) {
          return null;
      }
  });
  
  // Diff (File)
  ipcMain.handle('git:diff', async (_, projectPath, filePath) => {
      try {
          const git = simpleGit(projectPath);
          const diff = await git.diff([filePath]); 
          return diff;
      } catch (e) {
          console.error('git:diff error', e);
          return null;
      }
  });
  
  // Restore (Discard Changes)
  ipcMain.handle('git:restore', async (_, projectPath, filePath) => {
      try {
          const git = simpleGit(projectPath);
          await git.checkout([filePath]); // or 'restore' if git version supports it, checkout is safer for older git
          return true;
      } catch (e) {
          console.error('git:restore error', e);
          return false;
      }
  });

  // Init
  ipcMain.handle('git:init', async (_, projectPath) => {
      const git = simpleGit(projectPath);
      await git.init();
      return true;
  });
}

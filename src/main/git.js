import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';
import { checkRevision, pathArgs } from './safety';

// Git runs only on a repository whose top is the opened folder itself. Without
// this, a folder with no repository of its own would make git use one in a
// parent folder (a home folder, say), and commit, push or restore there.
async function repoAt(roots, projectPath) {
  const dir = roots.check(projectPath);
  const git = simpleGit(dir);
  const top = (await git.revparse(['--show-toplevel'])).trim();
  if (fs.realpathSync.native(top) !== dir) throw new Error('not a git repository');
  return { git, dir };
}

// File arguments from the page: each must be inside the project. They go to git
// as "./relative" so a leading ":" is never read as pathspec magic.
function projectFiles(roots, dir, files) {
  const list = [].concat(files);
  if (list.length === 0) throw new Error('invalid path');
  return list.map((file) => {
    if (typeof file !== 'string' || file === '') throw new Error('invalid path');
    const rel = path.relative(dir, roots.check(path.resolve(dir, file)));
    if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
      throw new Error('path is outside the project');
    }
    return rel === '' ? '.' : './' + rel.split(path.sep).join('/');
  });
}

export function setupGitIPC(roots) {
  ipcMain.handle('git:status', async (_, projectPath) => {
    try {
      const { git } = await repoAt(roots, projectPath);
      const status = await git.status();
      // simple-git status objects carry methods that cannot cross IPC.
      if (!status) return null;
      return JSON.parse(JSON.stringify(status));
    } catch (error) {
      // Suppress logging for non-git repositories to avoid console spam
      if (typeof error.message === 'string' && error.message.includes('not a git repository')) {
        return null;
      }
      console.error('git:status error:', error);
      return null;
    }
  });

  ipcMain.handle('git:add', async (_, projectPath, files) => {
    const { git, dir } = await repoAt(roots, projectPath);
    await git.add(pathArgs(projectFiles(roots, dir, files)));
    return true;
  });

  ipcMain.handle('git:commit', async (_, projectPath, message) => {
    const { git } = await repoAt(roots, projectPath);
    await git.commit(message);
    return true;
  });

  ipcMain.handle('git:push', async (_, projectPath) => {
    const { git } = await repoAt(roots, projectPath);
    await git.push();
    return true;
  });

  ipcMain.handle('git:log', async (_, projectPath) => {
    try {
      const { git } = await repoAt(roots, projectPath);
      return await git.log();
    } catch {
      return null;
    }
  });

  ipcMain.handle('git:diff', async (_, projectPath, filePath) => {
    try {
      const { git, dir } = await repoAt(roots, projectPath);
      return await git.diff(pathArgs(projectFiles(roots, dir, filePath)));
    } catch (e) {
      console.error('git:diff error', e);
      return null;
    }
  });

  ipcMain.handle('git:getFileAtRevision', async (_, projectPath, filePath, revision = 'HEAD') => {
    try {
      const { git, dir } = await repoAt(roots, projectPath);
      const [file] = projectFiles(roots, dir, filePath);
      return await git.show([`${checkRevision(revision)}:${file}`]);
    } catch (e) {
      console.error('git:getFileAtRevision error', e);
      return null;
    }
  });

  // Restore (discard changes). checkout works on older git than restore does.
  ipcMain.handle('git:restore', async (_, projectPath, filePath) => {
    try {
      const { git, dir } = await repoAt(roots, projectPath);
      await git.checkout(pathArgs(projectFiles(roots, dir, filePath)));
      return true;
    } catch (e) {
      console.error('git:restore error', e);
      return false;
    }
  });

  // Init runs in the opened folder itself, so it needs no existing repository.
  ipcMain.handle('git:init', async (_, projectPath) => {
    await simpleGit(roots.check(projectPath)).init();
    return true;
  });
}

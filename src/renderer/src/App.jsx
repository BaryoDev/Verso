import React, { useState, useEffect } from 'react';
import { Dashboard } from './features/dashboard/Dashboard';
import { MonacoWrapper } from './features/editor/MonacoWrapper';
import { MonacoDiffWrapper } from './features/editor/MonacoDiffWrapper';
import { VisualDiff } from './features/editor/VisualDiff';
import { WorkspaceLayout } from './features/shell/WorkspaceLayout';
import { FileTree } from './features/explorer/FileTree';
import { SourceControl } from './features/git/SourceControl';
import { ArrowLeft, Code, BookOpen, FileDiff, Eye } from 'lucide-react';
import { WysiwygEditor } from './features/editor/WysiwygEditor';

function App() {
  // State
  const [view, setView] = useState('dashboard');
  const [editorMode, setEditorMode] = useState('wysiwyg'); // 'wysiwyg' | 'code' | 'diff'
  const [diffViewType, setDiffViewType] = useState('code'); // 'code' | 'visual'
  const [currentProject, setCurrentProject] = useState(null); // This will be the root path
  const [fileSystem, setFileSystem] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [sidebarView, setSidebarView] = useState('explorer');

  // Git State
  const [gitStatus, setGitStatus] = useState(null);
  const [gitError, setGitError] = useState(null);
  const [diffOriginal, setDiffOriginal] = useState('');
  const [activeDiffFile, setActiveDiffFile] = useState(null);

  // Toggle Editor Mode
  const toggleEditorMode = () => {
    if (editorMode === 'diff') {
      // If in diff mode, go back to previous mode (defaulting to wysiwyg for now)
      setEditorMode('wysiwyg');
      setActiveDiffFile(null);
    } else {
      setEditorMode(prev => prev === 'wysiwyg' ? 'code' : 'wysiwyg');
    }
  };

  const toggleDiffViewType = () => {
    setDiffViewType(prev => prev === 'code' ? 'visual' : 'code');
  };

  // Recent Projects State
  const [recentProjects, setRecentProjects] = useState(() => {
    try {
      const stored = localStorage.getItem('verso_recents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Helper to update recents
  const addToRecents = (projectInfo) => {
    let path, name, type;
    if (typeof projectInfo === 'string') {
      path = projectInfo;
      name = path.split(/[/\\]/).pop();
      type = 'general';
    } else {
      path = projectInfo.path;
      name = projectInfo.name || path.split(/[/\\]/).pop();
      type = projectInfo.type || 'general';
    }

    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const existing = prev.find(p => p.path === path);
      if (!type && existing) type = existing.type;
      const updated = [{ name, path, type, lastOpened: Date.now() }, ...filtered].slice(10);
      localStorage.setItem('verso_recents', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper for Testing
  const getFileApi = () => {
    return window.__test_api || window.api?.files;
  };

  // 1. Open Project (Directory)
  const handleOpenProject = async (actionOrPath) => {
    if (actionOrPath === 'new') {
      alert('New Project Creation not implemented for Real FS yet.');
      return;
    }

    let path = actionOrPath;

    if (actionOrPath === 'existing') {
      const api = getFileApi();
      if (!api) { console.error('No File API found'); return; }
      path = await api.openDirectory();
    }

    if (path) {
      setCurrentProject(path);
      addToRecents(path);
      setView('editor');
      loadProjectFiles(path);
    }
  };

  // 2. Load Project Structure
  const loadProjectFiles = async (rootPath) => {
    const api = getFileApi();
    if (!api) return;
    const tree = await api.readDir(rootPath);

    const filterTree = (nodes) => {
      return nodes
        .filter(node => {
          if (node.type === 'folder') return true;
          return node.name.endsWith('.md');
        })
        .map(node => {
          const newItem = { ...node };
          if (newItem.children) {
            newItem.children = filterTree(newItem.children);
          }
          return newItem;
        });
    };

    const filtered = filterTree(tree);
    setFileSystem(filtered);
  };

  // Git Status Checker
  const checkGitStatus = async () => {
    console.log('checkGitStatus running', { currentProject, hasApi: !!window.api?.git });
    if (!currentProject || !window.api?.git) return;
    try {
      const s = await window.api.git.status(currentProject);
      console.log('Git status result:', s);
      setGitStatus(s);
    } catch (error) {
      console.error('Git status error:', error);
      if (error?.message?.includes('not a git repository')) {
        setGitStatus(null);
      }
    }
  };

  // Poll Git Status
  useEffect(() => {
    if (currentProject) {
      checkGitStatus();
      const interval = setInterval(checkGitStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [currentProject]);

  // 3. Select & Read File
  const handleFileSelect = async (file) => {
    if (file.type === 'file') {
      const api = getFileApi();
      const text = await api.readFile(file.id);
      setActiveFile(file);
      setContent(text);
      // If we were in diff mode, maybe stay? Or switch back? Let's switch back to edit mode on file select
      if (editorMode === 'diff') setEditorMode('wysiwyg');
    }
  };

  // Handle Opening Diff
  const handleOpenDiff = async (file) => {
    console.log('handleOpenDiff triggered for:', file);
    if (!window.api?.git) {
      console.error('window.api.git missing');
      return;
    }

    // 1. Get current content (Modified)
    const api = getFileApi();
    // Helper to join paths correctly (assuming unix-like for Mac)
    const fullPath = currentProject + (currentProject.endsWith('/') ? '' : '/') + file.path;
    console.log('Reading modified file from:', fullPath);

    let modifiedContent = '';
    try {
      modifiedContent = await api.readFile(fullPath);
    } catch (e) {
      console.error('Failed to read modified file:', e);
      alert('Error reading file for diff.');
      return;
    }
    console.log('modifiedContent length:', modifiedContent?.length);

    // 2. Get original content (Head)
    // Note: If file is untracked/new (?), this will likely fail or return empty.
    let originalRefContent = '';
    if (file.index === '?' || file.index === 'U') {
      originalRefContent = ''; // New file, original is empty
    } else {
      originalRefContent = await window.api.git.getFileAtRevision(currentProject, file.path, 'HEAD');
    }
    console.log('originalRefContent length:', originalRefContent?.length);

    if (originalRefContent !== null && modifiedContent !== null) {
      setDiffOriginal(originalRefContent);
      setContent(modifiedContent); // Reuse content state for modified side
      setActiveDiffFile(file);
      setEditorMode('diff');
      setDiffViewType('code'); // Default to code diff
      // Use fullPath for id so saving works
      setActiveFile({ ...file, id: fullPath, name: file.path.split(/[/\\]/).pop() });
      console.log('Switched to Diff Mode');
    } else {
      console.error('Failed to load diff content');
      alert('Could not load diff.');
    }
  };

  // 4. Save Content
  const handleContentChange = (newVal) => {
    setContent(newVal);
    if (activeFile) {
      const api = getFileApi();
      api.saveFile(activeFile.id, newVal);
      // Optimistically trigger git status check after save?
      // checkGitStatus(); // Debounce this ideally, or rely on interval
    }
  }

  const handleBack = () => {
    setView('dashboard');
    setCurrentProject(null);
    setActiveFile(null);
    setFileSystem([]);
    setGitStatus(null);
  };

  // 5. Create Project
  const handleCreateProject = async (name, type) => {
    const api = getFileApi();
    if (!api) return;

    const parentPath = await api.openDirectory();
    if (!parentPath) return;

    try {
      const newProjectPath = await api.createProject({
        parentPath,
        projectName: name,
        type,
        author: 'User'
      });

      if (newProjectPath) {
        await loadProjectFiles(newProjectPath);
        setCurrentProject(newProjectPath);
        addToRecents({
          path: newProjectPath,
          name: name,
          type: type
        });
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (!currentProject) {
    return <Dashboard
      onOpenProject={handleOpenProject}
      recentProjects={recentProjects}
      onCreateProject={handleCreateProject}
    />;
  }

  return (
    <WorkspaceLayout
      activeView={sidebarView}
      onViewChange={setSidebarView}
      gitBadge={gitStatus?.files?.length}
      sidebarContent={
        sidebarView === 'git' ? (
          <SourceControl
            projectPath={currentProject}
            status={gitStatus}
            error={gitError}
            onCheckStatus={checkGitStatus}
            onOpenDiff={handleOpenDiff}
          />
        ) : (
          <>
            <div style={{ padding: '10px 10px 0' }}>
              <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={12} /> Back to Dashboard
              </button>
              <div style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {currentProject}
              </div>
            </div>
            <FileTree
              data={fileSystem}
              onFileSelect={handleFileSelect}
              activeId={activeFile?.id}
            />
          </>
        )
      }
      statusBarLeft={<span>{activeFile ? activeFile.name : 'No file selected'} {editorMode === 'diff' ? '(Diff)' : ''}</span>}
      statusBarRight={
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {editorMode === 'diff' && (
            <span
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--accent-gold)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '11px',
                marginRight: '10px'
              }}
              onClick={toggleDiffViewType}
              title="Toggle Visual Diff"
            >
              {diffViewType === 'code' ? <Eye size={14} /> : <Code size={14} />}
              {diffViewType === 'code' ? 'View Rendered Diff' : 'View Code Diff'}
            </span>
          )}
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={toggleEditorMode} title="Toggle Editor Mode">
            {editorMode === 'wysiwyg' ? <Code size={12} /> : <BookOpen size={12} />}
            {editorMode === 'wysiwyg' ? 'Source' : (editorMode === 'diff' ? 'Exit Diff' : 'WYSIWYG')}
          </span>
          <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
        </div>
      }
    >
      {editorMode === 'diff' ? (
        diffViewType === 'visual' ? (
          <VisualDiff
            original={diffOriginal}
            modified={content}
          />
        ) : (
          <MonacoDiffWrapper
            original={diffOriginal}
            modified={content}
            onChange={handleContentChange}
          />
        )
      ) : (
        editorMode === 'wysiwyg' ? (
          <WysiwygEditor
            content={content}
            onChange={handleContentChange}
          />
        ) : (
          <MonacoWrapper
            value={content}
            onChange={handleContentChange}
          />
        )
      )}
    </WorkspaceLayout>
  );
}

export default App;

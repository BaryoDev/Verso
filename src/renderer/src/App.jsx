import React, { useState } from 'react';
import { Dashboard } from './features/dashboard/Dashboard';
import { MonacoWrapper } from './features/editor/MonacoWrapper';
import { WorkspaceLayout } from './features/shell/WorkspaceLayout';
import { FileTree } from './features/explorer/FileTree';
import { SourceControl } from './features/git/SourceControl';
import { ArrowLeft } from 'lucide-react';
import { WysiwygEditor } from './features/editor/WysiwygEditor';
import { Code, BookOpen } from 'lucide-react';

const MOCK_FILES = [
  {
    id: 'root',
    name: 'Death of Decency',
    type: 'folder',
    children: [
      { id: 'c1', name: 'Chapter 1: The Rain', type: 'file', content: '# Chapter 1\n\nThe rain halted.' },
      { id: 'c2', name: 'Chapter 2: The Letter', type: 'file', content: '# Chapter 2\n\nThe letter arrived on Tuesday.' },
      {
        id: 'notes',
        name: 'Notes',
        type: 'folder',
        children: [
          { id: 'n1', name: 'Characters.md', type: 'file', content: '# Characters\n\n- Christie\n- Joseph' },
        ]
      },
    ]
  }
];

function App() {
  // State
  const [view, setView] = useState('dashboard');
  const [editorMode, setEditorMode] = useState('wysiwyg'); // 'wysiwyg' | 'code'
  const [currentProject, setCurrentProject] = useState(null); // This will be the root path
  const [fileSystem, setFileSystem] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [sidebarView, setSidebarView] = useState('explorer');

  // Toggle Editor Mode
  const toggleEditorMode = () => {
    setEditorMode(prev => prev === 'wysiwyg' ? 'code' : 'wysiwyg');
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
  const addToRecents = (path) => {
    // Extract name from path (last segment)
    // path handling is platform specific, but basic split works for display
    const name = path.split(/[/\\]/).pop();

    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const updated = [{ name, path, lastOpened: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem('verso_recents', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper for Testing
  const getFileApi = () => {
    // In E2E, window.api might be readonly, so we look for __test_api
    return window.__test_api || window.api?.files;
  };

  // 1. Open Project (Directory)
  const handleOpenProject = async (actionOrPath) => {
    if (actionOrPath === 'new') {
      alert('New Project Creation not implemented for Real FS yet.');
      return;
    }

    let path = actionOrPath;

    // If action is 'existing', open dialog
    if (actionOrPath === 'existing') {
      const api = getFileApi();
      if (!api) {
        console.error('No File API found');
        return;
      }
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

    // Recursive filter for .md files and Folders
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
            // If folder is empty after filter, should we keep it? Yes, for now.
          }
          return newItem;
        });
    };

    const filtered = filterTree(tree);
    setFileSystem(filtered);
  };

  // 3. Select & Read File
  const handleFileSelect = async (file) => {
    // If it's a file, read content
    if (file.type === 'file') {
      const api = getFileApi();
      const text = await api.readFile(file.id);
      setActiveFile(file);
      setContent(text);
    }
  };

  // 4. Save Content
  const handleContentChange = (newVal) => {
    setContent(newVal);
    if (activeFile) {
      const api = getFileApi();
      api.saveFile(activeFile.id, newVal);
    }
  }

  const handleBack = () => {
    setView('dashboard');
    setCurrentProject(null);
    setActiveFile(null);
    setFileSystem([]);
  };

  if (view === 'dashboard') {
    return <Dashboard onOpenProject={handleOpenProject} recentProjects={recentProjects} />;
  }

  return (
    <WorkspaceLayout
      activeView={sidebarView}
      onViewChange={setSidebarView}
      sidebarContent={
        sidebarView === 'git' ? (
          <SourceControl projectPath={currentProject} />
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
      statusBarLeft={<span>{activeFile ? activeFile.name : 'No file selected'}</span>}
      statusBarRight={
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={toggleEditorMode} title="Toggle Editor Mode">
            {editorMode === 'wysiwyg' ? <Code size={12} /> : <BookOpen size={12} />}
            {editorMode === 'wysiwyg' ? 'Source' : 'WYSIWYG'}
          </span>
          <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
        </div>
      }
    >
      {editorMode === 'wysiwyg' ? (
        <WysiwygEditor
          content={content}
          onChange={handleContentChange}
        />
      ) : (
        <MonacoWrapper
          value={content}
          onChange={handleContentChange}
        />
      )}
    </WorkspaceLayout>
  );
}

export default App;

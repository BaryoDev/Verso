import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../theme/ThemeContext';

// Use local monaco instance instead of CDN
loader.config({ monaco });

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    lineNumbers: 'on', // VS Code default
    wordWrap: 'on',
    // Remove typewriter scrolling for standard editing feel, or keep it if "Zen" is desired?
    // User wants "Sleek" and "VS Code" like. Standard VS Code doesn't center cursor.
    cursorSurroundingLines: 0,
    scrollBeyondLastLine: true,
    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
    fontLigatures: true,
    fontSize: 14, // Standard VS Code size
    lineHeight: 1.6, // Readable
    folding: true,
    glyphMargin: true,
    renderLineHighlight: 'line',
    scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalScrollbarSize: 10,
    },
    padding: { top: 20, bottom: 20 }, // Breathing room
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    contextmenu: true, // Enable context menu for standard feel
    smoothScrolling: true,
    cursorBlinking: 'smooth',
};

export const MonacoWrapper = ({ value, onChange }) => {
    const { theme } = useTheme();

    // Map our theme names to Monaco themes
    // We need to define them first, but for now we can use built-ins or define on mount
    const handleEditorDidMount = (editor, monaco) => {
        // Define Verso themes
        monaco.editor.defineTheme('verso-classic', {
            base: 'vs', // Light base
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#F5F5DC', // Old Paper
                'editor.foreground': '#333333',
                'editorCursor.foreground': '#333333',
            }
        });

        monaco.editor.defineTheme('verso-vscode', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
            }
        });

        // Apply current theme
        const monacoTheme = theme === 'vscode' ? 'verso-vscode' : 'verso-classic';
        monaco.editor.setTheme(monacoTheme);
    };

    // We need to re-apply theme if context changes, but monaco instance is inside the component.
    // @monaco-editor/react handles theme prop, but we need custom themes.
    // We can pass `theme={theme === 'vscode' ? 'vs-dark' : 'light'}` for basics, 
    // but better to use the `beforeMount` or `onMount` to define custom ones.

    return (
        <div style={{ width: '100%', height: '100%' }} data-testid="monaco-wrapper">
            <Editor
                height="100%"
                defaultLanguage="markdown"
                value={value || ""} // Use value for controlled component
                onChange={onChange}
                options={EDITOR_OPTIONS}
                onMount={handleEditorDidMount}
                theme={theme === 'vscode' ? 'vs-dark' : 'light'}
                loading={<div style={{ padding: '20px', color: 'var(--text-primary)' }}>Loading editor...</div>}
            />
        </div>
    );
};

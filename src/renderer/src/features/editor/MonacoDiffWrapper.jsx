import React, { useRef, useEffect } from 'react';
import { DiffEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../../features/theme/ThemeContext';

// Ensure local monaco usage if configured globally in App/MonacoWrapper
loader.config({ monaco }); // Configure loader with local instance

export const MonacoDiffWrapper = ({ original, modified, language = 'markdown', onChange }) => {
    const { theme } = useTheme();
    const diffEditorRef = useRef(null);

    const handleEditorDidMount = (editor, monaco) => {
        diffEditorRef.current = editor;

        // Listen to changes in the modified model
        const modifiedModel = editor.getModel().modified;
        modifiedModel.onDidChangeContent(() => {
            if (onChange) {
                onChange(modifiedModel.getValue());
            }
        });
    };

    // Construct theme string
    const monacoTheme = theme === 'vscode' ? 'vs-dark' : 'light';

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <DiffEditor
                height="100%"
                language={language}
                original={original}
                modified={modified}
                theme={monacoTheme}
                options={{
                    renderSideBySide: true,
                    readOnly: false, // Enable editing
                    originalEditable: false, // Keep original read-only
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false
                }}
                onMount={handleEditorDidMount}
            />
        </div>
    );
};

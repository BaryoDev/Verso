
import React, { useMemo } from 'react';
import * as Diff from 'diff';
import { useTheme } from '../../features/theme/ThemeContext';

export const VisualDiff = ({ original, modified }) => {
    const { theme } = useTheme();

    const diff = useMemo(() => {
        return Diff.diffWords(original || '', modified || '');
    }, [original, modified]);

    const isDark = theme === 'vscode' || theme === 'dark';

    return (
        <div style={{
            padding: '20px',
            height: '100%',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: "'Merriweather', 'Georgia', serif",
            fontSize: '16px',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap' // Preserve newlines
        }}>
            {diff.map((part, index) => {
                const color = part.added ? (isDark ? '#2e5c3e' : '#e6ffec') :
                    part.removed ? (isDark ? '#5c2e2e' : '#ffebe9') : 'transparent';

                const textColor = part.added ? (isDark ? '#a8ffc1' : '#1a7f37') :
                    part.removed ? (isDark ? '#ffa8a8' : '#cf222e') : 'inherit';

                const style = {
                    backgroundColor: color,
                    color: textColor,
                    textDecoration: part.removed ? 'line-through' : 'none',
                    padding: part.added || part.removed ? '2px 0' : '0'
                };

                return (
                    <span key={index} style={style}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
};

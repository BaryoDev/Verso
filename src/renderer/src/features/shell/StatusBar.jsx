import React from 'react';

export const StatusBar = ({ leftItems, rightItems }) => {
    return (
        <div style={{
            height: '24px',
            backgroundColor: 'var(--accent-leather)', // Standard IDE blue or theme color
            color: '#fff', // Always light on the status bar usually, or theme dependent?
            // Actually let's use theme vars properly.
            // Ideally Status Bar manages its own contrast.
            // For Classic: Deep Brown background, White/Gold text.
            // For VS Code: Blue background, White text.
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            userSelect: 'none'
        }}>
            <div style={{ display: 'flex', gap: '15px' }}>
                {leftItems}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                {rightItems}
            </div>
        </div>
    );
};

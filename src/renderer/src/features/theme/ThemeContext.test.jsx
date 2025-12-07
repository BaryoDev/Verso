/**
 * @vitest-environment jsdom
 */
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';


import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

// Helper component to consume context
const TestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme('vscode')}>Set VSCode</button>
            <button onClick={() => setTheme('material')}>Set Material</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    afterEach(() => {
        cleanup();
    });

    it('defaults to classic theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme')).toHaveTextContent('vscode');
    });

    it('updates DOM attribute when theme changes', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const button = screen.getByText('Set VSCode');
        await user.click(button);

        expect(screen.getByTestId('current-theme')).toHaveTextContent('vscode');
        expect(document.documentElement.getAttribute('data-theme')).toBe('vscode');
    });

    it('persists theme to localStorage', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Set Material'));
        expect(localStorage.getItem('verso-theme')).toBe('material');
    });

    it('loads theme from localStorage on mount', () => {
        localStorage.setItem('verso-theme', 'vscode');
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme')).toHaveTextContent('vscode');
    });
});

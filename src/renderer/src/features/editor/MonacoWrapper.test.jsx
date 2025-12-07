/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MonacoWrapper } from './MonacoWrapper';
import { ThemeProvider } from '../theme/ThemeContext';

// Mock @monaco-editor/react because canvas is hard to test
vi.mock('@monaco-editor/react', () => {
    return {
        default: ({ defaultValue, onChange }) => {
            return (
                <textarea
                    data-testid="mock-editor"
                    defaultValue={defaultValue}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        },
    };
});

describe('MonacoWrapper', () => {
    afterEach(() => cleanup());

    it('renders editor', () => {
        render(
            <ThemeProvider>
                <MonacoWrapper value="Hello World" onChange={() => { }} />
            </ThemeProvider>
        );
        expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
        expect(screen.getByTestId('mock-editor')).toHaveValue('Hello World');
    });
});

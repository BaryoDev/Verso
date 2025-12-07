/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { WorkspaceLayout } from './WorkspaceLayout';

describe('WorkspaceLayout', () => {
    afterEach(() => cleanup());

    it('renders children (editor area)', () => {
        render(
            <WorkspaceLayout>
                <div data-testid="editor-content">Editor Content</div>
            </WorkspaceLayout>
        );
        expect(screen.getByTestId('editor-content')).toBeVisible();
    });

    it('toggles sidebar visibility when clicking activity icon', async () => {
        const user = userEvent.setup();
        render(
            <WorkspaceLayout sidebarContent={<div data-testid="sidebar-content">Files</div>}>
                <div>Main</div>
            </WorkspaceLayout>
        );

        const explorerIcon = screen.getByTitle('Explorer');
        const sidebar = screen.getByTestId('sidebar-content');

        // Initially visible (default)
        expect(sidebar).toBeVisible();

        // Click to toggle off
        await user.click(explorerIcon);
        expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();

        // Click to toggle on
        await user.click(explorerIcon);
        expect(screen.getByTestId('sidebar-content')).toBeVisible();
    });

    it('renders status bar items', () => {
        render(
            <WorkspaceLayout statusBarLeft={<span>Ln 1, Col 1</span>}>
                <div>Main</div>
            </WorkspaceLayout>
        );
        expect(screen.getByText('Ln 1, Col 1')).toBeVisible();
    });
});

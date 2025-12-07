
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../theme/ThemeContext';

// Wrap with context
const renderDashboard = (props = {}) => {
    return render(
        <ThemeProvider>
            <Dashboard {...props} />
        </ThemeProvider>
    );
};

const MOCK_PROJECTS = [
    { name: 'Death of Decency', path: '/p1', lastOpened: new Date().toISOString(), type: 'novel' },
    { name: 'The Glass Clock', path: '/p2', lastOpened: new Date().toISOString(), type: 'novel' }
];

describe('Dashboard', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders greeting', () => {
        renderDashboard();
        expect(screen.getByText(/Good afternoon, Author/i)).toBeInTheDocument();
    });

    it('renders project list', () => {
        renderDashboard({ recentProjects: MOCK_PROJECTS });
        expect(screen.getByText('Death of Decency')).toBeInTheDocument();
        expect(screen.getByText('The Glass Clock')).toBeInTheDocument();
    });

    it('calls onCreateProject when clicking new project and submitting', async () => {
        const user = userEvent.setup();
        const handleCreate = vi.fn();
        renderDashboard({ onCreateProject: handleCreate });

        // 1. Open Modal
        const createBtn = screen.getByText(/Create New/i, { selector: 'button' });
        await user.click(createBtn);
        expect(screen.getByText('Create New Story')).toBeVisible();

        // 2. Type Name
        const input = screen.getByPlaceholderText(/e.g. The Great Adventure/i);
        await user.type(input, 'My Story');

        // 3. Submit
        const submitBtn = screen.getByText('Create Project');
        await user.click(submitBtn);

        expect(handleCreate).toHaveBeenCalledWith('My Story', 'novel');
    });
});

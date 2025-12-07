/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
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

describe('Dashboard', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders greeting', () => {
        renderDashboard();
        expect(screen.getByText(/Good afternoon, Author/i)).toBeInTheDocument();
    });

    it('renders project list', () => {
        renderDashboard();
        expect(screen.getByText('Death of Decency')).toBeInTheDocument();
        expect(screen.getByText('The Glass Clock')).toBeInTheDocument();
    });

    it('calls onOpenProject when clicking new project', async () => {
        const user = userEvent.setup();
        const handleOpen = vi.fn();
        renderDashboard({ onOpenProject: handleOpen });

        const createBtn = screen.getByText(/Create New Story/i);
        await user.click(createBtn);

        expect(handleOpen).toHaveBeenCalledWith('new');
    });
});

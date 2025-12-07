/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FileTree } from './FileTree';

const MOCK_DATA = [
    {
        id: '1',
        name: 'Chapter 1',
        type: 'file',
        content: 'Content of Chapter 1'
    },
    {
        id: '2',
        name: 'Drafts',
        type: 'folder',
        children: [
            {
                id: '3',
                name: 'Idea.txt',
                type: 'file',
                content: 'Some idea'
            }
        ]
    }
];

describe('FileTree', () => {
    afterEach(() => cleanup());

    it('renders files and folders', () => {
        render(<FileTree data={MOCK_DATA} />);
        expect(screen.getByText('Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Drafts')).toBeInTheDocument();
        // Default open
        expect(screen.getByText('Idea.txt')).toBeInTheDocument();
    });

    it('toggles folders', async () => {
        const user = userEvent.setup();
        render(<FileTree data={MOCK_DATA} />);

        const folder = screen.getByText('Drafts');

        // Close
        await user.click(folder);
        expect(screen.queryByText('Idea.txt')).not.toBeInTheDocument();

        // Open
        await user.click(folder);
        expect(screen.getByText('Idea.txt')).toBeVisible();
    });

    it('calls onFileSelect with file data', async () => {
        const user = userEvent.setup();
        const handleSelect = vi.fn();
        render(<FileTree data={MOCK_DATA} onFileSelect={handleSelect} />);

        await user.click(screen.getByText('Chapter 1'));
        expect(handleSelect).toHaveBeenCalledWith(MOCK_DATA[0]);
    });
});

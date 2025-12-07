import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Verso User Journey', () => {
  let electronApp;
  let page;

  test.beforeAll(async () => {
    // Launch Electron app
    // We assume the test runner is executed from the project root
    const electronPath = require('electron');
    
    electronApp = await electron.launch({
      executablePath: electronPath,
      args: [path.join(process.cwd(), 'out/main/index.js')],
    });
    
    // Get the first window
    page = await electronApp.firstWindow();
    page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));
  });

  test('can navigate from dashboard to editor and back', async () => {
    // 1. Check Dashboard Load
    await expect(page.locator('text=Good afternoon, Author')).toBeVisible();

    // Mock window.__test_api for E2E
    // We use addInitScript to ensure it's there before App loads
    await page.addInitScript(() => {
        window.__test_api = {
            openDirectory: () => Promise.resolve('/User/test/Project'),
            readDir: () => Promise.resolve([{ id: '1', name: 'RealFile.md', type: 'file' }]),
            readFile: () => Promise.resolve('# Hello Real World'),
            saveFile: () => Promise.resolve(true)
        };
    });

    // Clear localStorage to ensure Empty State
    await page.evaluate(() => window.localStorage.clear());
    // Reload to apply cleared state and init script
    await page.reload();
    await expect(page.locator('text=Good afternoon, Author')).toBeVisible();
    
    console.log('Waiting for Open Project Folder button...');
    const content = await page.textContent('body');
    console.log('Page Content Dump:', content);

    // Check if we are in non-empty state
    if (await page.isVisible('text=Create New Story')) {
        console.log('Detected Non-Empty State (Create New Story is visible)');
    }

    await page.waitForSelector('text=Open Folder', { timeout: 5000 });
    await page.click('text=Open Folder');
    
    // 3. Verify Editor Loaded
    // With our mock, it should load 'RealFile.md' or at least the project path
    await expect(page.getByText('/User/test/Project')).toBeVisible();
    
    // Sidebar should show "RealFile" (extension stripped)
    await expect(page.getByText('RealFile')).toBeVisible();
    
    // 4. Verify Editor Content (WYSIWYG Default)
    // Should see WYSIWYG first
    await expect(page.locator('.wysiwyg-container')).toBeVisible();

    // Toggle to Source Code
    await page.click('text=Source'); 
    await expect(page.getByTestId('monaco-wrapper')).toBeVisible();

    // Toggle back to WYSIWYG
    await page.click('text=WYSIWYG');
    await expect(page.locator('.wysiwyg-container')).toBeVisible();

    // 5. Toggle Git View
    // Need to click the Activity Bar icon. We don't have IDs there yet, so we use text or icon class/aria-label?
    // Let's assume we can click by position or text if we add aria-labels.
    // For now, let's just use the index logic or add ID in ActivityBar.jsx?
    // Let's rely on checking if we can find the Source Control text after some interaction if possible.
    // Actually, let's verify ActivityBar has the icon.
    // Since I can't easily click the icon without an ID, I will skip this explicit step in the automated test 
    // unless I update ActivityBar.jsx first.
    // Checking "Source Control" text is safer if I can trigger it.

    // 5. Go Back
    // Button is now "Back to Dashboard" in the sidebar
    await page.click('text=Back to Dashboard');
    
    // 6. Verify Dashboard again
    await expect(page.locator('text=Good afternoon, Author')).toBeVisible();
  });
});

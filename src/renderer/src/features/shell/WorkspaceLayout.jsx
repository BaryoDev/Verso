import React, { useState } from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

export const WorkspaceLayout = ({
    children,
    sidebarContent,
    statusBarLeft,
    statusBarRight,
    activeView = 'explorer',
    onViewChange
}) => {
    // If onViewChange is not provided, we could simple default to internal state, but let's assume controlled for now.

    // Logic to toggle sidebar if clicking same view
    const handleViewClick = (view) => {
        if (onViewChange) onViewChange(view);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            {/* Main Row: Activity + Sidebar + Editor */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <ActivityBar
                    activeView={activeView}
                    onViewChange={handleViewClick}
                />

                <Sidebar activeView={activeView} isVisible={true}>
                    {sidebarContent}
                </Sidebar>

                {/* Helper to center content in 'Zen Mode' if desired, but default is fill */}
                <div style={{ flex: 1, position: 'relative', backgroundColor: 'var(--bg-primary)' }}>
                    {children}
                </div>
            </div>

            {/* Status Bar Row */}
            <StatusBar leftItems={statusBarLeft} rightItems={statusBarRight} />
        </div>
    );
};

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
    onViewChange,
    gitBadge = 0
}) => {
    // Internal state for uncontrolled mode
    const [internalView, setInternalView] = useState(activeView);
    const currentView = onViewChange ? activeView : internalView;

    // Logic to toggle sidebar if clicking same view
    const handleViewClick = (view) => {
        const nextView = currentView === view ? null : view;
        if (onViewChange) {
            onViewChange(nextView);
        } else {
            setInternalView(nextView);
        }
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
                    activeView={currentView}
                    onViewChange={handleViewClick}
                    gitBadge={gitBadge}
                />

                <Sidebar activeView={currentView} isVisible={!!currentView}>
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

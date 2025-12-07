import React from 'react';
import { Files, Search, Settings, PenTool, Layout, GitBranch } from 'lucide-react';

const ActivityIcon = ({ icon: Icon, isActive, onClick, label }) => (
    <div
        onClick={onClick}
        title={label}
        style={{
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
            borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent', // VS Code style indicator
            opacity: isActive ? 1 : 0.7,
            transition: 'all 0.2s',
        }}
    >
        <Icon size={24} strokeWidth={1.5} />
    </div>
);

export const ActivityBar = ({ activeView, onViewChange }) => {
    return (
        <div style={{
            width: '50px',
            backgroundColor: 'var(--bg-activity)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-color)',
            height: '100%'
        }}>
            <ActivityIcon
                icon={Files}
                label="Explorer"
                isActive={activeView === 'explorer'}
                onClick={() => onViewChange('explorer')}
            />
            <ActivityIcon
                icon={Search}
                label="Search"
                isActive={activeView === 'search'}
                onClick={() => onViewChange('search')}
            />
            <ActivityIcon
                icon={GitBranch}
                label="Source Control"
                isActive={activeView === 'git'}
                onClick={() => onViewChange('git')}
            />
            <ActivityIcon
                icon={Layout}
                label="Corkboard"
                isActive={activeView === 'corkboard'}
                onClick={() => onViewChange('corkboard')}
            />

            <div style={{ flex: 1 }} />

            <ActivityIcon
                icon={Settings}
                label="Settings"
                isActive={activeView === 'settings'}
                onClick={() => onViewChange('settings')}
            />
        </div>
    );
};

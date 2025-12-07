import React from 'react';
import { Files, Search, Settings, PenTool, Layout, GitBranch } from 'lucide-react';

const ActivityIcon = ({ icon: Icon, isActive, onClick, label, badge }) => (
    <div
        onClick={onClick}
        title={label}
        style={{
            width: '50px',
            height: '50px',
            display: 'flex', // Revert to relative? No, relative container needed for badge
            position: 'relative', // Added for badge positioning
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
        {badge > 0 && (
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'var(--accent-gold)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 'bold',
                minWidth: '14px',
                height: '14px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                border: '1px solid var(--bg-activity)'
            }}>
                {badge}
            </div>
        )}
    </div>
);

export const ActivityBar = ({ activeView, onViewChange, gitBadge }) => {
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
                badge={gitBadge}
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

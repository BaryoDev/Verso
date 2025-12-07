import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { FileText, Plus, Settings } from 'lucide-react';

const ProjectCard = ({ title, meta, isActive }) => {
    return (
        <div
            className={`project-card ${isActive ? 'active' : ''}`}
            style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '24px',
                borderRadius: 'var(--border-radius)',
                boxShadow: 'none',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
        >
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{title}</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{meta}</span>
        </div>
    );
};

const NewProjectCard = ({ onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                border: '2px dashed var(--text-secondary)',
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '24px',
                opacity: 0.6
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Plus size={20} /> Create New Story
            </span>
        </div>
    );
};

export const Dashboard = ({ onOpenProject, recentProjects = [] }) => {
    const { theme, setTheme } = useTheme();

    return (
        <div style={{ padding: '60px', height: '100%', overflowY: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>
                    Good afternoon, Author.
                </h1>

                {/* Theme Switcher */}
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                >
                    <option value="classic">Classic Library</option>
                    <option value="vscode">VS Code</option>
                    <option value="material">Material</option>
                </select>
            </header>

            {/* Empty State / Primary Actions */}
            {recentProjects.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '400px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    color: 'var(--text-secondary)'
                }}>
                    <FileText size={48} strokeWidth={1} style={{ marginBottom: '20px', opacity: 0.5 }} />
                    <h2 style={{ fontFamily: 'var(--font-serif)', marginTop: 0 }}>No Recent Projects</h2>
                    <p style={{ marginBottom: '30px' }}>Open a folder to start writing your masterpiece.</p>

                    <button
                        onClick={() => onOpenProject && onOpenProject('existing')}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: 'var(--accent-gold)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Open Project Folder
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px'
                }}>
                    <NewProjectCard onClick={() => onOpenProject && onOpenProject('new')} />

                    {recentProjects.map((project) => (
                        <div key={project.path} onClick={() => onOpenProject && onOpenProject(project.path)}>
                            <ProjectCard
                                title={project.name}
                                meta={`Last opened ${new Date(project.lastOpened).toLocaleDateString()}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

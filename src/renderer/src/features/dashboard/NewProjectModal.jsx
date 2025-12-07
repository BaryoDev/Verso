import React, { useState } from 'react';
import { BookOpen, Feather, Film, X } from 'lucide-react';

export const NewProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('novel');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        setIsLoading(true);
        await onCreate(name, type);
        setIsLoading(false);
        onClose();
    };

    const types = [
        { id: 'novel', label: 'Novel', icon: BookOpen, desc: 'Chapters, Characters, Notes' },
        { id: 'poem', label: 'Poem', icon: Feather, desc: 'Drafts, Published' },
        { id: 'screenplay', label: 'Screenplay', icon: Film, desc: 'Scenes, Characters' },
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '30px',
                borderRadius: '8px',
                width: '500px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)' }}>Create New Story</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. The Great Adventure"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 500 }}>Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            {types.map((t) => {
                                const Icon = t.icon;
                                const isActive = type === t.id;
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setType(t.id)}
                                        style={{
                                            border: isActive ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            padding: '15px',
                                            cursor: 'pointer',
                                            backgroundColor: isActive ? 'rgba(var(--accent-gold-rgb), 0.05)' : 'var(--bg-secondary)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Icon size={24} color={isActive ? 'var(--accent-gold)' : 'var(--text-primary)'} />
                                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{t.label}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.desc}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || isLoading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'var(--accent-gold)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: !name || isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

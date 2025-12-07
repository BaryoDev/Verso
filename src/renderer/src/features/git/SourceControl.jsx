import React, { useState, useEffect } from 'react';
import { GitBranch, Check, RefreshCw, Upload, Play, RotateCcw, FileDiff } from 'lucide-react';

export const SourceControl = ({ projectPath }) => {
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        if (!projectPath) return;
        setLoading(true);
        const s = await window.api.git.status(projectPath);
        setStatus(s);
        setLoading(false);
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [projectPath]);

    const handleCommit = async () => {
        if (!message) return;
        setLoading(true);
        await window.api.git.add(projectPath, '.'); // Stage all
        await window.api.git.commit(projectPath, message);
        setMessage('');
        await checkStatus();
        setLoading(false);
    };

    const handlePush = async () => {
        setLoading(true);
        try {
            await window.api.git.push(projectPath);
            alert('Pushed successfully');
        } catch (e) {
            alert('Push failed (check console)');
        }
        setLoading(false);
    };

    const handleDiscard = async (file) => {
        if (!confirm(`Discard changes to ${file.path}?`)) return;
        setLoading(true);
        await window.api.git.restore(projectPath, file.path);
        await checkStatus();
        setLoading(false);
    };

    if (!projectPath) return <div style={{ padding: 20, color: 'var(--text-secondary)' }}>No project open.</div>;

    return (
        <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Source Control</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={checkStatus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} title="Refresh">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={handlePush} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} title="Push">
                        <Upload size={14} />
                    </button>
                </div>
            </div>

            {/* Changes List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
                {status && status.files && status.files.length > 0 ? (
                    status.files.map(file => (
                        <div key={file.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                <span style={{ color: file.index === 'M' || file.working_dir === 'M' ? '#E2C08D' : '#73C991', flexShrink: 0 }}>
                                    {file.index === '?' ? 'U' : 'M'}
                                </span>
                                <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.path}>
                                    {file.path}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => handleDiscard(file)}
                                    title="Discard Changes"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No changes detected.</div>
                )}
            </div>

            {/* Commit Box */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Commit message..."
                    style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '8px',
                        marginBottom: '8px',
                        fontSize: '12px',
                        resize: 'none',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={handleCommit}
                    disabled={!status || !status.files || status.files.length === 0 || !message}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--accent-gold)',
                        color: '#fff',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: (!status || !status.files || status.files.length === 0 || !message) ? 0.5 : 1
                    }}
                >
                    <Check size={14} /> Commit
                </button>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

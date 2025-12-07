import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

const FileItem = ({ item, level, onSelect, activeId }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isActive = item.id === activeId;

    const handleClick = () => {
        if (item.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onSelect(item);
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                style={{
                    paddingLeft: `${level * 16 + 12}px`,
                    paddingRight: '12px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                    fontWeight: isActive ? 500 : 400,
                    fontSize: '13px',
                    userSelect: 'none',
                    backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {item.type === 'folder' && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}

                {/* Simple icons for now */}
                {item.type === 'folder' ? (
                    isOpen ? (
                        <FolderOpen size={14} color="var(--text-secondary)" fill="currentColor" fillOpacity={0.1} />
                    ) : (
                        <Folder size={14} color="var(--text-secondary)" fill="currentColor" fillOpacity={0.1} />
                    )
                ) : (
                    <File size={14} color={isActive ? 'var(--accent-gold)' : 'var(--text-secondary)'} />
                )}

                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name.replace(/\.md$/, '')}
                </span>
            </div>

            {item.type === 'folder' && isOpen && item.children && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item.children.map((child) => (
                        <FileItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            activeId={activeId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileTree = ({ data, onFileSelect, activeId }) => {
    return (
        <div style={{ paddingTop: '10px' }}>
            {data.map((item) => (
                <FileItem
                    key={item.id}
                    item={item}
                    level={0}
                    onSelect={onFileSelect}
                    activeId={activeId}
                />
            ))}
        </div>
    );
};

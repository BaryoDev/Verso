import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

const FileItem = ({ item, level, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);

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
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    userSelect: 'none',
                    backgroundColor: 'transparent' // Hover effect handled by CSS ideally, or state
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                {item.type === 'folder' && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}

                {/* Simple icons for now */}
                {item.type === 'folder' ? (
                    <Folder size={14} color="var(--accent-gold)" fill="var(--accent-gold)" fillOpacity={0.2} />
                ) : (
                    <File size={14} color="var(--text-secondary)" />
                )}

                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                </span>
            </div>

            {item.type === 'folder' && isOpen && item.children && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item.children.map((child) => (
                        <FileItem key={child.id} item={child} level={level + 1} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileTree = ({ data, onFileSelect }) => {
    return (
        <div style={{ paddingTop: '10px' }}>
            {data.map((item) => (
                <FileItem key={item.id} item={item} level={0} onSelect={onFileSelect} />
            ))}
        </div>
    );
};

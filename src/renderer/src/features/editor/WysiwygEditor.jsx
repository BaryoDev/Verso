import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Focus from '@tiptap/extension-focus';
import {
    Bold, Italic, Strikethrough, Code,
    Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Undo, Redo,
    AlignVerticalJustifyCenter, ScanEye
} from 'lucide-react';
import './WysiwygEditor.css';

const MenuBar = ({ editor, isTypewriterMode, toggleTypewriter, isFocusMode, toggleFocus }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="editor-toolbar">
            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    title="Bold (Cmd+B)"
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    title="Italic (Cmd+I)"
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    title="Strikethrough"
                >
                    <Strikethrough size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'is-active' : ''}
                    title="Inline Code"
                >
                    <Code size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    title="Heading 1"
                >
                    <Heading1 size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                    title="Heading 3"
                >
                    <Heading3 size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'is-active' : ''}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                    title="Quote"
                >
                    <Quote size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    title="Undo (Cmd+Z)"
                >
                    <Undo size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    title="Redo (Cmd+Shift+Z)"
                >
                    <Redo size={16} />
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
                <button
                    onClick={toggleTypewriter}
                    className={isTypewriterMode ? 'is-active' : ''}
                    title="Typewriter Scrolling"
                >
                    <AlignVerticalJustifyCenter size={16} />
                </button>
                <button
                    onClick={toggleFocus}
                    className={isFocusMode ? 'is-active' : ''}
                    title="Focus Mode"
                >
                    <ScanEye size={16} />
                </button>
            </div>
        </div>
    );
};

export const WysiwygEditor = ({ content, onChange }) => {
    const [isTypewriterMode, setIsTypewriterMode] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Focus.configure({
                className: 'has-focus',
                mode: 'all',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            const markdown = editor.storage.markdown.getMarkdown();
            onChange(markdown);
            handleScroll(editor);
        },
        onSelectionUpdate: ({ editor }) => {
            handleScroll(editor);
        },
        editorProps: {
            attributes: {
                class: 'prose focus:outline-none',
            },
        },
    });

    const handleScroll = (editor) => {
        if (!isTypewriterMode || !editor) return;

        const { view } = editor;
        if (!view) return;

        const { state } = view;
        const { selection } = state;
        const { $from } = selection;

        // Find the DOM element for the current selection
        // This is a bit of an approximation, finding the block at cursor
        const dom = view.domAtPos($from.pos).node;
        const element = dom.nodeType === 1 ? dom : dom.parentElement;

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    };

    useEffect(() => {
        if (editor && content !== editor.storage.markdown.getMarkdown()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`wysiwyg-container ${isFocusMode ? 'focus-mode' : ''}`}>
            <MenuBar
                editor={editor}
                isTypewriterMode={isTypewriterMode}
                toggleTypewriter={() => setIsTypewriterMode(!isTypewriterMode)}
                isFocusMode={isFocusMode}
                toggleFocus={() => setIsFocusMode(!isFocusMode)}
            />
            <EditorContent editor={editor} />
        </div>
    );
};

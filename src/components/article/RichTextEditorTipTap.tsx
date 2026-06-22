import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import DOMPurify from 'dompurify';
import { uploadAPI } from '../../services/uploadAPI';
import { compressImage } from '../../utils/compressImage';

const lowlight = createLowlight(common);

type EditorMode = 'visual' | 'source' | 'split';

interface RichTextEditorTipTapProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RichTextEditorTipTap: React.FC<RichTextEditorTipTapProps> = ({
    value,
    onChange,
    placeholder = 'Nhập nội dung...',
}) => {
    const [mode, setMode] = useState<EditorMode>('visual');
    const [sourceCode, setSourceCode] = useState(value);
    const [showImagePanel, setShowImagePanel] = useState(false);
    const [showYoutubePanel, setShowYoutubePanel] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right' | 'wide'>('center');
    const [imageSize, setImageSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const Underline = Mark.create({
        name: 'underline',
        parseHTML() {
            return [
                { tag: 'u' },
                { style: 'text-decoration', getAttrs: (value) => value === 'underline' && null },
            ];
        },
        renderHTML({ HTMLAttributes }) {
            return ['u', mergeAttributes(HTMLAttributes), 0];
        },
        addCommands() {
            return {
                setUnderline: () => ({ commands }) => commands.setMark(this.name),
                toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name),
                unsetUnderline: () => ({ commands }) => commands.unsetMark(this.name),
            };
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            Image.configure({
                allowBase64: true,
            }),
            Youtube.configure({
                width: 640,
                height: 480,
                nocookie: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CodeBlockLowlight.configure({
                lowlight,
                defaultLanguage: 'javascript',
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setSourceCode(html);
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none min-h-96 max-w-full',
            },
        },
    });

    const handleModeChange = (newMode: EditorMode) => {
        if (newMode === 'source' && editor) {
            setSourceCode(editor.getHTML());
        } else if (newMode === 'visual' && editor) {
            editor.commands.setContent(sourceCode);
        }
        setMode(newMode);
    };

    const handleSourceChange = (html: string) => {
        setSourceCode(html);
        if (editor) {
            editor.commands.setContent(html);
            onChange(html);
        }
    };

    const handleInsertImage = () => {
        if (!imageUrl.trim()) return;

        if (editor) {
            const classes = `article-figure align-${imageAlign} size-${imageSize}`;
            if (imageCaption.trim()) {
                // Insert as figure with figcaption
                const figureHtml = `
                    <figure class="${classes}">
                        <img src="${DOMPurify.sanitize(imageUrl)}" alt="${DOMPurify.sanitize(imageAlt)}" />
                        <figcaption>${DOMPurify.sanitize(imageCaption)}</figcaption>
                    </figure>
                `;
                editor.chain().focus().insertContent(figureHtml).run();
            } else {
                // Insert as plain image
                const figureHtml = `
                    <figure class="${classes}">
                        <img src="${DOMPurify.sanitize(imageUrl)}" alt="${DOMPurify.sanitize(imageAlt)}" />
                    </figure>
                `;
                editor.chain().focus().insertContent(figureHtml).run();
            }

            setImageUrl('');
            setImageAlt('');
            setImageCaption('');
            setShowImagePanel(false);
            editor.view.focus();
        }
    };

    const handlePickImageFile = () => {
        fileInputRef.current?.click();
    };

    const handleUploadImageFile = async (file: File) => {
        try {
            setImageUploading(true);
            const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
            const response = await uploadAPI.uploadImage(compressed);
            if (!response.status || !response.data) {
                throw new Error('Upload failed');
            }
            setImageUrl(response.data);
        } catch (err: any) {
            console.error('Upload image failed:', err);
        } finally {
            setImageUploading(false);
        }
    };

    const handleInsertYoutube = () => {
        if (!youtubeUrl.trim()) return;

        if (editor) {
            editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
            setYoutubeUrl('');
            setShowYoutubePanel(false);
            editor.view.focus();
        }
    };

    const handleInsertTable = () => {
        if (editor) {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
    };

    const handleInsertLink = () => {
        const url = window.prompt('Nhập URL:');
        if (!url) return;

        const sanitizedUrl = DOMPurify.sanitize(url);
        const selectionEmpty = editor?.state.selection.empty ?? true;

        if (!selectionEmpty) {
            editor?.chain().focus().setLink({ href: sanitizedUrl, target: '_blank' }).run();
            return;
        }

        const textInput = window.prompt('Văn bản hiển thị (tùy chọn):');
        let displayText = (textInput || '').trim();

        if (!displayText) {
            try {
                displayText = new URL(url).hostname;
            } catch {
                displayText = url;
            }
        }

        const sanitizedText = DOMPurify.sanitize(displayText);
        const linkHtml = `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${sanitizedText}</a>`;
        editor?.chain().focus().insertContent(linkHtml).run();
    };

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        void handleUploadImageFile(file);
                    }
                    e.currentTarget.value = '';
                }}
            />

            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 p-3 bg-gray-100 border-b">
                {(['visual', 'source', 'split'] as const).map((m) => (
                    <button
                        key={m}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleModeChange(m)}
                        className={`px-4 py-2 rounded font-medium text-sm transition ${
                            mode === m
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {m === 'visual' && 'Visual'}
                        {m === 'source' && 'HTML'}
                        {m === 'split' && 'Split'}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            {(mode === 'visual' || mode === 'split') && (
                <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
                    {/* Formatting */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('bold') ? 'bg-gray-300' : ''
                        }`}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('italic') ? 'bg-gray-300' : ''
                        }`}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('underline') ? 'bg-gray-300' : ''
                        }`}
                        title="Underline (Ctrl+U)"
                    >
                        <u>U</u>
                    </button>
                    <div className="border-r mx-1" />

                    {/* Headings */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                        }`}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                        }`}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                        }`}
                        title="Heading 3"
                    >
                        H3
                    </button>
                    <div className="border-r mx-1" />

                    {/* Lists */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('bulletList') ? 'bg-gray-300' : ''
                        }`}
                        title="Bullet List"
                    >
                        •
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('orderedList') ? 'bg-gray-300' : ''
                        }`}
                        title="Ordered List"
                    >
                        1.
                    </button>
                    <div className="border-r mx-1" />

                    {/* Block elements */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('blockquote') ? 'bg-gray-300' : ''
                        }`}
                        title="Blockquote"
                    >
                        "
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('codeBlock') ? 'bg-gray-300' : ''
                        }`}
                        title="Code Block"
                    >
                        {'<>'}
                    </button>
                    <div className="border-r mx-1" />

                    {/* Links & Media */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleInsertLink}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Link (Ctrl+K)"
                    >
                        🔗
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowImagePanel(!showImagePanel)}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Image"
                    >
                        🖼️
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowYoutubePanel(!showYoutubePanel)}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert YouTube Video"
                    >
                        ▶️
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleInsertTable}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Table"
                    >
                        ⊞
                    </button>
                    <div className="border-r mx-1" />

                    {/* Clear formatting */}
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Clear Formatting"
                    >
                        ✓
                    </button>
                </div>
            )}

            {/* Image Insertion Panel */}
            {showImagePanel && (
                <div className="p-4 bg-blue-50 border-b">
                    <h4 className="font-semibold mb-3">Chèn ảnh</h4>
                    <div className="space-y-2 mb-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                type="button"
                                onClick={handlePickImageFile}
                                className="px-4 py-2 rounded bg-[#001C44] text-white font-semibold hover:bg-[#002A66] disabled:opacity-60"
                                disabled={imageUploading}
                            >
                                {imageUploading ? 'Đang upload...' : 'Chọn ảnh từ máy'}
                            </button>
                            <div className="flex items-center gap-2">
                                <select
                                    value={imageAlign}
                                    onChange={(e) => setImageAlign(e.target.value as any)}
                                    className="px-3 py-2 border rounded bg-white"
                                >
                                    <option value="left">Trái</option>
                                    <option value="center">Giữa</option>
                                    <option value="right">Phải</option>
                                    <option value="wide">Rộng</option>
                                </select>
                                <select
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value as any)}
                                    className="px-3 py-2 border rounded bg-white"
                                >
                                    <option value="sm">Nhỏ</option>
                                    <option value="md">Vừa</option>
                                    <option value="lg">Lớn</option>
                                </select>
                            </div>
                        </div>
                        <input
                            type="url"
                            placeholder="URL ảnh"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Văn bản thay thế (alt text)"
                            value={imageAlt}
                            onChange={(e) => setImageAlt(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                        <textarea
                            placeholder="Chú thích ảnh (tùy chọn)"
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            rows={2}
                        />
                    </div>
                    {imageUrl && (
                        <div className="mb-3">
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="max-w-xs max-h-40 object-contain rounded"
                                onError={() => console.log('Image load failed')}
                            />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleInsertImage}
                            disabled={!imageUrl.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            Chèn
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImagePanel(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* YouTube Insertion Panel */}
            {showYoutubePanel && (
                <div className="p-4 bg-red-50 border-b">
                    <h4 className="font-semibold mb-3">Chèn video YouTube</h4>
                    <div className="space-y-2 mb-3">
                        <input
                            type="url"
                            placeholder="YouTube URL (vd: https://www.youtube.com/watch?v=...)"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInsertYoutube}
                            disabled={!youtubeUrl.trim()}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                        >
                            Chèn
                        </button>
                        <button
                            onClick={() => setShowYoutubePanel(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Container */}
            <div className="flex gap-0 bg-white">
                {/* Visual Editor */}
                {(mode === 'visual' || mode === 'split') && (
                    <div className={`flex-1 border-r-0 ${mode === 'split' ? 'border-r' : ''}`}>
                        <EditorContent
                            editor={editor}
                            className="px-4 py-3 min-h-96 prose prose-sm max-w-full focus:outline-none"
                        />
                    </div>
                )}

                {/* Source Editor */}
                {(mode === 'source' || mode === 'split') && (
                    <div className={`flex-1 ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                        <textarea
                            value={sourceCode}
                            onChange={(e) => handleSourceChange(e.target.value)}
                            className="w-full h-96 p-4 font-mono text-sm border-0 focus:outline-none resize-none"
                            placeholder="HTML content"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditorTipTap;

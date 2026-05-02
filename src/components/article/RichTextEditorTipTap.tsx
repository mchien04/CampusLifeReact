import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
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
            if (imageCaption.trim()) {
                // Insert as figure with figcaption
                const figureHtml = `
                    <figure>
                        <img src="${DOMPurify.sanitize(imageUrl)}" alt="${DOMPurify.sanitize(imageAlt)}" />
                        <figcaption>${DOMPurify.sanitize(imageCaption)}</figcaption>
                    </figure>
                `;
                editor.commands.insertContent(figureHtml);
            } else {
                // Insert as plain image
                editor.commands.insertContent({
                    type: 'image',
                    attrs: {
                        src: imageUrl,
                        alt: imageAlt,
                    },
                });
            }

            setImageUrl('');
            setImageAlt('');
            setImageCaption('');
            setShowImagePanel(false);
            editor.view.focus();
        }
    };

    const handleInsertYoutube = () => {
        if (!youtubeUrl.trim()) return;

        if (editor) {
            editor.commands.setYoutubeVideo({ src: youtubeUrl });
            setYoutubeUrl('');
            setShowYoutubePanel(false);
            editor.view.focus();
        }
    };

    const handleInsertTable = () => {
        if (editor) {
            editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
        }
    };

    const handleInsertLink = () => {
        const url = window.prompt('URL nhánh:');
        if (url) {
            editor?.commands.setLink({ href: url });
        }
    };

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 p-3 bg-gray-100 border-b">
                {(['visual', 'source', 'split'] as const).map((m) => (
                    <button
                        key={m}
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
                        onClick={() => editor.commands.toggleBold()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('bold') ? 'bg-gray-300' : ''
                        }`}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.commands.toggleItalic()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('italic') ? 'bg-gray-300' : ''
                        }`}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.commands.toggleUnderline?.()}
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
                        onClick={() => editor.commands.toggleHeading({ level: 1 })}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                        }`}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        onClick={() => editor.commands.toggleHeading({ level: 2 })}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                        }`}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.commands.toggleHeading({ level: 3 })}
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
                        onClick={() => editor.commands.toggleBulletList()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('bulletList') ? 'bg-gray-300' : ''
                        }`}
                        title="Bullet List"
                    >
                        •
                    </button>
                    <button
                        onClick={() => editor.commands.toggleOrderedList()}
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
                        onClick={() => editor.commands.toggleBlockquote()}
                        className={`p-2 rounded hover:bg-gray-200 ${
                            editor.isActive('blockquote') ? 'bg-gray-300' : ''
                        }`}
                        title="Blockquote"
                    >
                        "
                    </button>
                    <button
                        onClick={() => editor.commands.toggleCodeBlock()}
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
                        onClick={handleInsertLink}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Link (Ctrl+K)"
                    >
                        🔗
                    </button>
                    <button
                        onClick={() => setShowImagePanel(!showImagePanel)}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Image"
                    >
                        🖼️
                    </button>
                    <button
                        onClick={() => setShowYoutubePanel(!showYoutubePanel)}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert YouTube Video"
                    >
                        ▶️
                    </button>
                    <button
                        onClick={handleInsertTable}
                        className="p-2 rounded hover:bg-gray-200"
                        title="Insert Table"
                    >
                        ⊞
                    </button>
                    <div className="border-r mx-1" />

                    {/* Clear formatting */}
                    <button
                        onClick={() => editor.commands.clearNodes()}
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
                            onClick={handleInsertImage}
                            disabled={!imageUrl.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            Chèn
                        </button>
                        <button
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import {
    TextB,
    TextItalic,
    TextUnderline,
    TextHOne,
    TextHTwo,
    TextHThree,
    ListBullets,
    ListNumbers,
    Quotes,
    Code,
    LinkSimple,
    Image as ImageIcon,
    YoutubeLogo,
    Table as TableIcon,
    Eraser,
} from '@phosphor-icons/react';
import DOMPurify from 'dompurify';
import { uploadAPI } from '../../services/uploadAPI';
import { compressImage } from '../../utils/compressImage';
import { sanitizeArticleContent } from '../../utils/sanitizeHtml';

const lowlight = createLowlight(common);

type EditorMode = 'visual' | 'source' | 'split';

interface RichTextEditorTipTapProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

const TEXT_COLORS = [
    { label: 'Mặc định', value: '' },
    { label: 'Navy', value: '#001C44' },
    { label: 'Đen', value: '#0f172a' },
    { label: 'Xám', value: '#64748b' },
    { label: 'Xanh', value: '#0B5FFF' },
    { label: 'Đỏ', value: '#dc2626' },
    { label: 'Xanh lá', value: '#059669' },
    { label: 'Vàng', value: '#b45309' },
];

/** Capture editor selection before toolbar native controls steal focus. */
const selectionRef = { current: null as { from: number; to: number } | null };

const RichTextEditorTipTap: React.FC<RichTextEditorTipTapProps> = ({
    value,
    onChange,
    placeholder = 'Viết nội dung bài viết...',
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
    const [toolbarTick, setToolbarTick] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const skipNextSync = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            TextStyle,
            Color,
            FontSize,
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
                height: 360,
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
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value || '',
        onUpdate: ({ editor: current }) => {
            const html = current.getHTML();
            skipNextSync.current = true;
            setSourceCode(html);
            onChange(html);
        },
        onSelectionUpdate: () => setToolbarTick((n) => n + 1),
        onTransaction: () => setToolbarTick((n) => n + 1),
        editorProps: {
            attributes: {
                class: 'article-body ProseMirror px-5 py-4',
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        if (skipNextSync.current) {
            skipNextSync.current = false;
            return;
        }
        const current = editor.getHTML();
        if ((value || '') !== current) {
            editor.commands.setContent(value || '', { emitUpdate: false });
            setSourceCode(value || '');
        }
    }, [value, editor]);

    const textStyle = useMemo(() => {
        void toolbarTick;
        return editor?.getAttributes('textStyle') || {};
    }, [editor, toolbarTick]);

    const currentFontSize = (textStyle.fontSize as string) || 'default';
    const currentColor = (textStyle.color as string) || '';

    const handleModeChange = (newMode: EditorMode) => {
        if (!editor) return;
        if (newMode === 'source' || newMode === 'split') {
            setSourceCode(editor.getHTML());
        }
        if (newMode === 'visual' || newMode === 'split') {
            editor.commands.setContent(sourceCode || '', { emitUpdate: false });
        }
        setMode(newMode);
    };

    const handleSourceChange = (html: string) => {
        setSourceCode(html);
        if (editor && (mode === 'split' || mode === 'source')) {
            skipNextSync.current = true;
            editor.commands.setContent(html, { emitUpdate: false });
            onChange(html);
        }
    };

    const handleInsertImage = () => {
        if (!imageUrl.trim() || !editor) return;
        const safeUrl = DOMPurify.sanitize(imageUrl.trim());
        const safeAlt = DOMPurify.sanitize(imageAlt);
        const safeCaption = DOMPurify.sanitize(imageCaption);
        const classes = `article-figure align-${imageAlign} size-${imageSize}`;
        const figureHtml = safeCaption.trim()
            ? `<figure class="${classes}"><img src="${safeUrl}" alt="${safeAlt}" /><figcaption>${safeCaption}</figcaption></figure>`
            : `<figure class="${classes}"><img src="${safeUrl}" alt="${safeAlt}" /></figure>`;
        editor.chain().focus().insertContent(figureHtml).run();
        setImageUrl('');
        setImageAlt('');
        setImageCaption('');
        setShowImagePanel(false);
    };

    const handleUploadImageFile = async (file: File) => {
        try {
            setImageUploading(true);
            const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
            const response = await uploadAPI.uploadImage(compressed);
            if (!response.status || !response.data) throw new Error('Upload failed');
            setImageUrl(response.data);
        } catch (err) {
            console.error('Upload image failed:', err);
        } finally {
            setImageUploading(false);
        }
    };

    const handleInsertYoutube = () => {
        if (!youtubeUrl.trim() || !editor) return;
        editor.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run();
        setYoutubeUrl('');
        setShowYoutubePanel(false);
    };

    const handleInsertTable = () => {
        const input = window.prompt('Nhập số cột x số hàng (ví dụ: 3x3):', '3x3');
        if (!input?.trim() || !editor) return;
        const parts = input.toLowerCase().split('x');
        const cols = parseInt(parts[0]?.trim() || '3', 10);
        const rows = parseInt(parts[1]?.trim() || '3', 10);
        if (!Number.isNaN(cols) && !Number.isNaN(rows) && cols > 0 && rows > 0) {
            editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
        }
    };

    const handleInsertLink = () => {
        if (!editor) return;
        const url = window.prompt('Nhập URL:');
        if (!url) return;
        const sanitizedUrl = DOMPurify.sanitize(url);
        if (!editor.state.selection.empty) {
            editor.chain().focus().setLink({ href: sanitizedUrl, target: '_blank' }).run();
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
        const linkHtml = `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(displayText)}</a>`;
        editor.chain().focus().insertContent(linkHtml).run();
    };

    if (!editor) {
        return (
            <div className="tiptap-editor min-h-[22rem] flex items-center justify-center text-sm text-gray-400 font-medium">
                Đang tải trình soạn thảo...
            </div>
        );
    }

    return (
        <div className="tiptap-editor">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUploadImageFile(file);
                    e.currentTarget.value = '';
                }}
            />

            <div className="tiptap-mode-bar">
                {(['visual', 'source', 'split'] as const).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleModeChange(m)}
                        className={`tiptap-mode-btn ${mode === m ? 'is-active' : ''}`}
                    >
                        {m === 'visual' ? 'Trực quan' : m === 'source' ? 'HTML' : 'Chia đôi'}
                    </button>
                ))}
                <span className="ml-auto text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    Cỡ chữ / màu được lưu trong HTML (style)
                </span>
            </div>

            {(mode === 'visual' || mode === 'split') && (
                <div className="tiptap-toolbar">
                    <div className="tiptap-toolbar__group">
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            title="Đậm"
                        >
                            <TextB size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            title="Nghiêng"
                        >
                            <TextItalic size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            title="Gạch chân"
                        >
                            <TextUnderline size={16} weight="bold" />
                        </button>
                    </div>

                    <div className="tiptap-toolbar__divider" />

                    <div className="tiptap-toolbar__group">
                        <select
                            className="tiptap-select"
                            value={currentFontSize}
                            onMouseDown={() => {
                                const { from, to } = editor.state.selection;
                                selectionRef.current = { from, to };
                            }}
                            onChange={(e) => {
                                const next = e.target.value;
                                const sel = selectionRef.current;
                                let chain = editor.chain().focus();
                                if (sel) chain = chain.setTextSelection(sel);
                                if (next === 'default') {
                                    chain.unsetFontSize().run();
                                } else {
                                    chain.setFontSize(next).run();
                                }
                            }}
                            title="Cỡ chữ"
                        >
                            <option value="default">Cỡ chữ</option>
                            {FONT_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <select
                            className="tiptap-select"
                            value={currentColor}
                            onMouseDown={() => {
                                const { from, to } = editor.state.selection;
                                selectionRef.current = { from, to };
                            }}
                            onChange={(e) => {
                                const next = e.target.value;
                                const sel = selectionRef.current;
                                let chain = editor.chain().focus();
                                if (sel) chain = chain.setTextSelection(sel);
                                if (!next) {
                                    chain.unsetColor().run();
                                } else {
                                    chain.setColor(next).run();
                                }
                            }}
                            title="Màu chữ"
                        >
                            {TEXT_COLORS.map((c) => (
                                <option key={c.label} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="color"
                            className="tiptap-color"
                            value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor) ? currentColor : '#001C44'}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const { from, to } = editor.state.selection;
                                selectionRef.current = { from, to };
                            }}
                            onChange={(e) => {
                                const sel = selectionRef.current;
                                let chain = editor.chain().focus();
                                if (sel) chain = chain.setTextSelection(sel);
                                chain.setColor(e.target.value).run();
                            }}
                            title="Chọn màu tùy chỉnh"
                        />
                    </div>

                    <div className="tiptap-toolbar__divider" />

                    <div className="tiptap-toolbar__group">
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            title="Tiêu đề 1"
                        >
                            <TextHOne size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            title="Tiêu đề 2"
                        >
                            <TextHTwo size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            title="Tiêu đề 3"
                        >
                            <TextHThree size={16} weight="bold" />
                        </button>
                    </div>

                    <div className="tiptap-toolbar__divider" />

                    <div className="tiptap-toolbar__group">
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            title="Danh sách"
                        >
                            <ListBullets size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            title="Danh sách số"
                        >
                            <ListNumbers size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            title="Trích dẫn"
                        >
                            <Quotes size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            title="Khối code"
                        >
                            <Code size={16} weight="bold" />
                        </button>
                    </div>

                    <div className="tiptap-toolbar__divider" />

                    <div className="tiptap-toolbar__group">
                        <button
                            type="button"
                            className={`tiptap-btn ${editor.isActive('link') ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleInsertLink}
                            title="Chèn link"
                        >
                            <LinkSimple size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${showImagePanel ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setShowYoutubePanel(false);
                                setShowImagePanel((v) => !v);
                            }}
                            title="Chèn ảnh"
                        >
                            <ImageIcon size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className={`tiptap-btn ${showYoutubePanel ? 'is-active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setShowImagePanel(false);
                                setShowYoutubePanel((v) => !v);
                            }}
                            title="Chèn YouTube"
                        >
                            <YoutubeLogo size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            className="tiptap-btn"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleInsertTable}
                            title="Chèn bảng"
                        >
                            <TableIcon size={16} weight="bold" />
                        </button>
                    </div>

                    {editor.isActive('table') && (
                        <>
                            <div className="tiptap-toolbar__divider" />
                            <div className="tiptap-toolbar__group">
                                <button type="button" className="tiptap-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                    +Cột
                                </button>
                                <button type="button" className="tiptap-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()}>
                                    -Cột
                                </button>
                                <button type="button" className="tiptap-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()}>
                                    +Hàng
                                </button>
                                <button type="button" className="tiptap-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()}>
                                    -Hàng
                                </button>
                                <button type="button" className="tiptap-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()}>
                                    Xóa bảng
                                </button>
                            </div>
                        </>
                    )}

                    <div className="tiptap-toolbar__divider" />
                    <button
                        type="button"
                        className="tiptap-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                        title="Xóa định dạng"
                    >
                        <Eraser size={16} weight="bold" />
                    </button>
                </div>
            )}

            {showImagePanel && (
                <div className="tiptap-panel">
                    <div className="tiptap-panel__title">Chèn ảnh</div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imageUploading}
                                className="px-4 py-2 rounded-xl bg-[#001C44] text-[#FFD66D] text-sm font-bold disabled:opacity-60"
                            >
                                {imageUploading ? 'Đang upload...' : 'Chọn từ máy'}
                            </button>
                            <select value={imageAlign} onChange={(e) => setImageAlign(e.target.value as typeof imageAlign)} className="tiptap-select">
                                <option value="left">Trái</option>
                                <option value="center">Giữa</option>
                                <option value="right">Phải</option>
                                <option value="wide">Rộng</option>
                            </select>
                            <select value={imageSize} onChange={(e) => setImageSize(e.target.value as typeof imageSize)} className="tiptap-select">
                                <option value="sm">Nhỏ</option>
                                <option value="md">Vừa</option>
                                <option value="lg">Lớn</option>
                            </select>
                        </div>
                        <input className="tiptap-field" type="url" placeholder="URL ảnh" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                        <input className="tiptap-field" type="text" placeholder="Alt text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
                        <textarea className="tiptap-field" placeholder="Chú thích (tùy chọn)" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                            <button type="button" onClick={handleInsertImage} disabled={!imageUrl.trim()} className="px-4 py-2 rounded-xl bg-[#001C44] text-white text-sm font-bold disabled:opacity-50">
                                Chèn ảnh
                            </button>
                            <button type="button" onClick={() => setShowImagePanel(false)} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-600">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showYoutubePanel && (
                <div className="tiptap-panel">
                    <div className="tiptap-panel__title">Chèn YouTube</div>
                    <div className="flex flex-col gap-2">
                        <input
                            className="tiptap-field"
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={handleInsertYoutube} disabled={!youtubeUrl.trim()} className="px-4 py-2 rounded-xl bg-[#001C44] text-white text-sm font-bold disabled:opacity-50">
                                Chèn video
                            </button>
                            <button type="button" onClick={() => setShowYoutubePanel(false)} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-600">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex ${mode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                {(mode === 'visual' || mode === 'split') && (
                    <div className={`bg-white ${mode === 'split' ? 'lg:w-1/2 lg:border-r border-gray-100' : 'w-full'}`}>
                        <EditorContent editor={editor} />
                    </div>
                )}
                {(mode === 'source' || mode === 'split') && (
                    <div className={mode === 'split' ? 'lg:w-1/2' : 'w-full'}>
                        <textarea
                            value={sourceCode}
                            onChange={(e) => handleSourceChange(e.target.value)}
                            onBlur={() => {
                                const cleaned = sanitizeArticleContent(sourceCode);
                                setSourceCode(cleaned);
                                if (editor) {
                                    skipNextSync.current = true;
                                    editor.commands.setContent(cleaned, { emitUpdate: false });
                                }
                                onChange(cleaned);
                            }}
                            className="tiptap-source"
                            placeholder="HTML content"
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditorTipTap;

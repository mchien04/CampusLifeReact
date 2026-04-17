import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';

type EditorMode = 'visual' | 'source' | 'split';

interface RichHtmlEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const MODE_OPTIONS: Array<{ mode: EditorMode; label: string }> = [
    { mode: 'visual', label: 'Visual' },
    { mode: 'source', label: 'HTML' },
    { mode: 'split', label: 'Split' },
];

const RichHtmlEditor: React.FC<RichHtmlEditorProps> = ({ value, onChange, placeholder = 'Nhập nội dung HTML...' }) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [mode, setMode] = useState<EditorMode>('split');
    const [showImagePanel, setShowImagePanel] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

    useEffect(() => {
        const element = editorRef.current;
        if (!element) return;

        if (document.activeElement !== element && element.innerHTML !== value) {
            element.innerHTML = value || '<p><br/></p>';
        }
    }, [value]);

    const sanitizedPreview = useMemo(() => DOMPurify.sanitize(value || ''), [value]);

    const focusEditor = () => {
        editorRef.current?.focus();
    };

    const runCommand = (command: string, valueArg?: string) => {
        focusEditor();
        document.execCommand(command, false, valueArg);
        onChange(editorRef.current?.innerHTML || '');
    };

    const isValidImageUrl = (input: string): boolean => {
        const trimmed = input.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('/')) return true;

        try {
            const parsed = new URL(trimmed);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleInsertLink = () => {
        const link = window.prompt('Nhập URL liên kết:');
        if (!link) return;
        runCommand('createLink', link);
    };

    const handleInsertImage = () => {
        if (!isValidImageUrl(imageUrl)) return;

        const safeUrl = imageUrl.trim();
        const safeAlt = imageAlt.trim();
        const imageTemplate = `<img src="${safeUrl}" alt="${safeAlt}" />`;
        insertTemplate(imageTemplate);
        setShowImagePanel(false);
        setImageUrl('');
        setImageAlt('');
        setImagePreviewFailed(false);
    };

    const insertTemplate = (template: string) => {
        focusEditor();
        document.execCommand('insertHTML', false, template);
        onChange(editorRef.current?.innerHTML || '');
    };

    const showVisual = mode === 'visual' || mode === 'split';
    const showSource = mode === 'source' || mode === 'split';
    const canInsertImage = isValidImageUrl(imageUrl);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (!(event.ctrlKey || event.metaKey)) return;

        const key = event.key.toLowerCase();

        if (key === 'b') {
            event.preventDefault();
            runCommand('bold');
            return;
        }
        if (key === 'i') {
            event.preventDefault();
            runCommand('italic');
            return;
        }
        if (key === 'u') {
            event.preventDefault();
            runCommand('underline');
            return;
        }
        if (key === 'k') {
            event.preventDefault();
            handleInsertLink();
            return;
        }
        if (event.shiftKey && key === '7') {
            event.preventDefault();
            runCommand('insertOrderedList');
            return;
        }
        if (event.shiftKey && key === '8') {
            event.preventDefault();
            runCommand('insertUnorderedList');
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {MODE_OPTIONS.map((option) => (
                        <button
                            key={option.mode}
                            type="button"
                            onClick={() => setMode(option.mode)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === option.mode
                                ? 'bg-[#001C44] text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => runCommand('bold')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Bold">B</button>
                    <button type="button" onClick={() => runCommand('italic')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Italic"><em>I</em></button>
                    <button type="button" onClick={() => runCommand('underline')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Underline"><u>U</u></button>
                    <button type="button" onClick={() => runCommand('formatBlock', '<h1>')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Heading 1">H1</button>
                    <button type="button" onClick={() => runCommand('formatBlock', '<h2>')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Heading 2">H2</button>
                    <button type="button" onClick={() => runCommand('formatBlock', '<p>')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Paragraph">P</button>
                    <button type="button" onClick={() => runCommand('insertUnorderedList')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Bulleted List">List</button>
                    <button type="button" onClick={() => runCommand('insertOrderedList')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Numbered List">1.</button>
                    <button type="button" onClick={handleInsertLink} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Insert Link">Link</button>
                    <button type="button" onClick={() => setShowImagePanel((previous) => !previous)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Insert Image">Image</button>
                    <button type="button" onClick={() => runCommand('removeFormat')} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100" title="Clear Format">Clear</button>
                    <span className="mx-1 text-gray-300">|</span>
                    <button
                        type="button"
                        onClick={() => insertTemplate('<section><h2>Điểm nổi bật</h2><ul><li>Nội dung 1</li><li>Nội dung 2</li><li>Nội dung 3</li></ul></section>')}
                        className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100"
                    >
                        + Highlights
                    </button>
                    <button
                        type="button"
                        onClick={() => insertTemplate('<section><h2>Lịch trình</h2><p><strong>Thời gian:</strong> ...</p><p><strong>Địa điểm:</strong> ...</p></section>')}
                        className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100"
                    >
                        + Agenda
                    </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                    Shortcuts: Ctrl/Cmd+B (bold), Ctrl/Cmd+I (italic), Ctrl/Cmd+U (underline), Ctrl/Cmd+K (link), Ctrl/Cmd+Shift+7 (ordered list), Ctrl/Cmd+Shift+8 (bullet list)
                </div>

                {showImagePanel && (
                    <div className="mt-3 border border-gray-200 rounded-lg bg-white p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-gray-500">Image URL</span>
                                <input
                                    value={imageUrl}
                                    onChange={(event) => {
                                        setImageUrl(event.target.value);
                                        setImagePreviewFailed(false);
                                    }}
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#001C44]"
                                    placeholder="https://... hoặc /uploads/..."
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-gray-500">Alt text</span>
                                <input
                                    value={imageAlt}
                                    onChange={(event) => setImageAlt(event.target.value)}
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#001C44]"
                                    placeholder="Mô tả ảnh"
                                />
                            </label>
                        </div>

                        {!canInsertImage && imageUrl.trim() && (
                            <p className="text-sm text-red-600">URL ảnh không hợp lệ. Vui lòng dùng đường dẫn bắt đầu bằng / hoặc http(s).</p>
                        )}

                        {canInsertImage && (
                            <div className="rounded border border-dashed border-gray-300 p-3 bg-gray-50">
                                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Preview</div>
                                {imagePreviewFailed ? (
                                    <p className="text-sm text-red-600">Không thể tải ảnh preview. Hãy kiểm tra URL.</p>
                                ) : (
                                    <img
                                        src={imageUrl.trim()}
                                        alt={imageAlt || 'Preview'}
                                        className="max-h-48 rounded border border-gray-200 object-contain bg-white"
                                        onError={() => setImagePreviewFailed(true)}
                                        onLoad={() => setImagePreviewFailed(false)}
                                    />
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleInsertImage}
                                disabled={!canInsertImage}
                                className="px-3 py-2 rounded bg-[#001C44] text-white text-sm font-medium disabled:opacity-50"
                            >
                                Chèn ảnh
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImagePanel(false);
                                    setImageUrl('');
                                    setImageAlt('');
                                    setImagePreviewFailed(false);
                                }}
                                className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={`grid gap-0 ${mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {showVisual && (
                    <div className={`${mode === 'split' ? 'border-r border-gray-200' : ''}`}>
                        <div className="px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 bg-gray-50">Visual editor</div>
                        <div
                            ref={editorRef}
                            className="min-h-[360px] p-4 prose prose-sm max-w-none focus:outline-none"
                            contentEditable
                            suppressContentEditableWarning
                            data-placeholder={placeholder}
                            onKeyDown={handleKeyDown}
                            onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
                            onBlur={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
                        />
                    </div>
                )}

                {showSource && (
                    <div>
                        <div className="px-4 py-2 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 bg-gray-50">HTML source + sanitized preview</div>
                        <textarea
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full min-h-[200px] p-4 font-mono text-sm border-0 border-b border-gray-200 focus:outline-none"
                            placeholder="<h1>...</h1>"
                        />
                        <div className="p-4 bg-white">
                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Preview</div>
                            <div className="prose prose-sm max-w-none min-h-[120px] border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50" dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichHtmlEditor;
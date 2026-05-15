import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { chatbotAPI, ChatbotActivityOption, ChatbotPageContext, ChatbotResolvedActivity } from '../../services/chatbotAPI';

type ChatMessageRole = 'user' | 'bot';

type ChatMessage = {
    id: string;
    role: ChatMessageRole;
    text: string;
    createdAt: number;
    activityOptions?: ChatbotActivityOption[];
};

export interface ChatbotWidgetProps {
    pageContext?: ChatbotPageContext;
    contextActivityId?: number | null;
    contextArticleSlug?: string | null;
}

const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const initialBotMessage = (pageContext: ChatbotPageContext) =>
    pageContext === 'ACTIVITY_DETAIL'
        ? 'Chào bạn! Bạn có thể hỏi về sự kiện này (thời gian, địa điểm, đăng ký, nhiệm vụ...).'
        : pageContext === 'ARTICLE_DETAIL'
            ? 'Chào bạn! Bạn có thể hỏi về bài viết này (tóm tắt, sự kiện liên quan, thời gian/địa điểm...).'
            : 'Chào bạn! Bạn có thể hỏi về sự kiện đang mở đăng ký, tìm sự kiện theo tên, hoặc hỏi thông tin tham gia.';

const buildInitialMessages = (pageContext: ChatbotPageContext): ChatMessage[] => [
    { id: createId(), role: 'bot', text: initialBotMessage(pageContext), createdAt: Date.now() },
];

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
    pageContext = 'GLOBAL',
    contextActivityId = null,
    contextArticleSlug = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [resolvedActivity, setResolvedActivity] = useState<ChatbotResolvedActivity | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(() => buildInitialMessages(pageContext));
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [runtimePageContext, setRuntimePageContext] = useState<ChatbotPageContext>(pageContext);
    const [runtimeContextActivityId, setRuntimeContextActivityId] = useState<number | null>(contextActivityId ?? null);
    const [runtimeContextArticleSlug, setRuntimeContextArticleSlug] = useState<string | null>(contextArticleSlug ?? null);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const contextKey = useMemo(
        () => `${pageContext}:${contextActivityId ?? 'null'}:${contextArticleSlug ?? 'null'}`,
        [pageContext, contextActivityId, contextArticleSlug]
    );
    const storageKey = useMemo(() => `chatbot:${contextKey}`, [contextKey]);

    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            setConversationId(null);
            setResolvedActivity(null);
            setMessages(buildInitialMessages(pageContext));
            setRuntimePageContext(pageContext);
            setRuntimeContextActivityId(contextActivityId ?? null);
            setRuntimeContextArticleSlug(contextArticleSlug ?? null);
            setInput('');
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            const savedConversationId = typeof parsed?.conversationId === 'number' ? parsed.conversationId : null;
            const savedResolvedActivity =
                parsed?.resolvedActivity && typeof parsed.resolvedActivity?.id === 'number' && typeof parsed.resolvedActivity?.name === 'string'
                    ? (parsed.resolvedActivity as ChatbotResolvedActivity)
                    : null;
            const savedMessages: ChatMessage[] =
                Array.isArray(parsed?.messages) && parsed.messages.length > 0
                    ? (parsed.messages as any[]).slice(-50).filter((m) => m && (m.role === 'user' || m.role === 'bot') && typeof m.text === 'string')
                    : buildInitialMessages(pageContext);
            const savedRuntimePageContext: ChatbotPageContext =
                parsed?.runtimePageContext === 'ACTIVITY_DETAIL' || parsed?.runtimePageContext === 'ARTICLE_DETAIL' || parsed?.runtimePageContext === 'GLOBAL'
                    ? parsed.runtimePageContext
                    : pageContext;
            const savedRuntimeContextActivityId: number | null =
                typeof parsed?.runtimeContextActivityId === 'number' ? parsed.runtimeContextActivityId : (contextActivityId ?? null);
            const savedRuntimeContextArticleSlug: string | null =
                typeof parsed?.runtimeContextArticleSlug === 'string' ? parsed.runtimeContextArticleSlug : (contextArticleSlug ?? null);

            setConversationId(savedConversationId);
            setResolvedActivity(savedResolvedActivity);
            setMessages(savedMessages);
            setRuntimePageContext(savedRuntimePageContext);
            setRuntimeContextActivityId(savedRuntimeContextActivityId);
            setRuntimeContextArticleSlug(savedRuntimeContextArticleSlug);
            setInput('');
        } catch {
            setConversationId(null);
            setResolvedActivity(null);
            setMessages(buildInitialMessages(pageContext));
            setRuntimePageContext(pageContext);
            setRuntimeContextActivityId(contextActivityId ?? null);
            setRuntimeContextArticleSlug(contextArticleSlug ?? null);
            setInput('');
        }
    }, [storageKey, pageContext]);

    useEffect(() => {
        const payload = {
            conversationId,
            resolvedActivity,
            messages: messages.slice(-50),
            runtimePageContext,
            runtimeContextActivityId,
            runtimeContextArticleSlug,
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
    }, [
        conversationId,
        resolvedActivity,
        messages,
        runtimePageContext,
        runtimeContextActivityId,
        runtimeContextArticleSlug,
        storageKey,
    ]);

    useEffect(() => {
        setInput('');
    }, [contextKey]);

    useEffect(() => {
        if (!isOpen) return;
        requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }, [isOpen, messages.length, sending]);

    useEffect(() => {
        if (!isOpen) return;
        requestAnimationFrame(() => inputRef.current?.focus());
    }, [isOpen]);

    const send = async (
        messageToSend: string,
        displayText?: string,
        overrides?: { pageContext?: ChatbotPageContext; contextActivityId?: number | null; contextArticleSlug?: string | null }
    ) => {
        const normalized = messageToSend.trim();
        if (!normalized || sending) return;

        const createdAt = Date.now();
        setMessages((prev) => [
            ...prev,
            { id: createId(), role: 'user', text: displayText ?? normalized, createdAt },
        ]);
        setInput('');
        setSending(true);

        try {
            const response = await chatbotAPI.sendMessage({
                conversationId,
                contextActivityId: (overrides?.contextActivityId ?? runtimeContextActivityId) ?? null,
                contextArticleSlug: (overrides?.contextArticleSlug ?? runtimeContextArticleSlug) ?? null,
                pageContext: overrides?.pageContext ?? runtimePageContext,
                message: normalized,
            });

            setConversationId(response.conversationId);
            setResolvedActivity(response.resolvedActivity ?? null);

            const options = Array.isArray(response.activityOptions) ? response.activityOptions : [];
            setMessages((prev) => [
                ...prev,
                {
                    id: createId(),
                    role: 'bot',
                    text: response.answer || 'Mình chưa có câu trả lời phù hợp. Bạn thử hỏi theo cách khác nhé.',
                    createdAt: Date.now(),
                    activityOptions: response.needsClarification ? options.slice(0, 5) : undefined,
                },
            ]);
        } catch (error: any) {
            const message =
                error?.response?.status === 401
                    ? 'Vui lòng đăng nhập để dùng chatbot.'
                    : 'Không thể kết nối chatbot. Vui lòng thử lại.';
            toast.error(message);
            setMessages((prev) => [
                ...prev,
                { id: createId(), role: 'bot', text: message, createdAt: Date.now() },
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleSend = async () => {
        await send(input);
    };

    const handleSelectOption = async (option: ChatbotActivityOption) => {
        const displayText = `Chọn: ${option.name}`;
        setRuntimePageContext('ACTIVITY_DETAIL');
        setRuntimeContextActivityId(option.id);
        setRuntimeContextArticleSlug(null);
        setResolvedActivity({ id: option.id, name: option.name });
        await send('Mình muốn hỏi về sự kiện này.', displayText, {
            pageContext: 'ACTIVITY_DETAIL',
            contextActivityId: option.id,
            contextArticleSlug: null,
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="btn-primary w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center border border-[#002A66]"
                    aria-label="Mở chatbot"
                >
                    <svg className="w-6 h-6 text-[#FFD66D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.86 10.86 0 01-4.255-.84L3 20l1.168-3.51A7.414 7.414 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </button>
            ) : (
                <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-2rem)] card overflow-hidden flex flex-col border border-gray-200 shadow-lg">
                    <div className="bg-[#001C44] text-white px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold leading-tight truncate">CampusLife Chatbot</div>
                            <div className="text-xs text-white/80 leading-tight truncate">
                                {runtimePageContext === 'ACTIVITY_DETAIL'
                                    ? 'Hỏi đáp theo sự kiện'
                                    : runtimePageContext === 'ARTICLE_DETAIL'
                                        ? 'Hỏi đáp theo bài viết'
                                        : 'Hỏi đáp sự kiện'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
                                aria-label="Đóng chatbot"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {(resolvedActivity ||
                        runtimePageContext === 'ACTIVITY_DETAIL' ||
                        (runtimePageContext === 'ARTICLE_DETAIL' && !!runtimeContextArticleSlug)) && (
                            <div className="px-4 py-2 bg-white border-b border-gray-200">
                                <div className="text-xs text-gray-600">
                                    <span className="text-gray-500">Ngữ cảnh: </span>
                                    {runtimePageContext === 'ARTICLE_DETAIL'
                                        ? `Bài viết “${runtimeContextArticleSlug ?? ''}”`
                                        : runtimePageContext === 'ACTIVITY_DETAIL'
                                            ? `Sự kiện #${runtimeContextActivityId ?? ''}`
                                            : 'Toàn hệ thống'}
                                </div>
                                {resolvedActivity?.name && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        <span className="text-gray-500">Sự kiện: </span>
                                        {resolvedActivity.name}
                                    </div>
                                )}
                            </div>
                        )}

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                        {messages.map((m) => {
                            const isUser = m.role === 'user';
                            return (
                                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${isUser
                                                ? 'bg-[#001C44] text-white rounded-br-md'
                                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                                                }`}
                                        >
                                            {m.text}
                                        </div>
                                        {!!m.activityOptions?.length && (
                                            <div className="space-y-2">
                                                <div className="text-xs text-gray-500">Bạn muốn hỏi về sự kiện nào?</div>
                                                <div className="space-y-2">
                                                    {m.activityOptions.map((opt, idx) => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => handleSelectOption(opt)}
                                                            className="w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 hover:border-[#FFD66D] hover:shadow-sm transition-all"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-semibold text-[#001C44] truncate">
                                                                        {idx + 1}. {opt.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-0.5">
                                                                        <span className="mr-2">📅</span>
                                                                        {formatDateTime(opt.startDate)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-0.5">
                                                                        <span className="mr-2">📍</span>
                                                                        {opt.location || 'Chưa có địa điểm'}
                                                                    </div>
                                                                </div>
                                                                <div className="shrink-0">
                                                                    <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium bg-[#FFD66D] text-[#001C44]">
                                                                        Chọn
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {sending && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm bg-white text-gray-700 border border-gray-200 rounded-bl-md animate-pulse">
                                    Đang trả lời...
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="bg-white border-t border-gray-200 p-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD66D] focus:border-[#FFD66D] bg-white"
                                disabled={sending}
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={sending || !input.trim()}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${sending || !input.trim()
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'btn-yellow shadow-sm hover:shadow-md'
                                    }`}
                            >
                                Gửi
                            </button>
                        </div>
                        <div className="mt-2 text-[11px] text-gray-500">Enter để gửi, Shift+Enter để xuống dòng.</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;

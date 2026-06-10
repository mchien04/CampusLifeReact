import React, { useCallback, useEffect, useState } from 'react';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleCommentResponse, CreateCommentRequest, SpringPage } from '../../types/article';

interface CommentSectionProps {
    slug: string;
    isAuthenticated: boolean;
    currentUserId?: number | null;
    currentUserAvatarUrl?: string | null;
    currentUserFullName?: string | null;
    className?: string;
}

const formatRelativeTime = (dateStr: string): string => {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
};

// ===== Single Comment Component =====

interface CommentItemProps {
    comment: ArticleCommentResponse;
    currentUserId?: number | null;
    isAuthenticated: boolean;
    onReply: (parentId: number) => void;
    onDelete: (commentId: number) => void;
    depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    currentUserId,
    isAuthenticated,
    onReply,
    onDelete,
    depth = 0,
}) => {
    const isOwner = currentUserId != null && comment.student?.id === currentUserId;

    return (
        <div className={`comment-item ${depth > 0 ? 'comment-item--reply' : ''}`}>
            <div className="comment-item__header flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="comment-item__avatar shrink-0">
                        {comment.student?.avatarUrl ? (
                            <img
                                src={comment.student.avatarUrl}
                                alt={comment.student.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-100"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001C44] to-[#002A66] text-[#FFD66D] flex items-center justify-center font-bold text-xs shadow-sm">
                                {comment.student?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <div className="comment-item__meta flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                            {comment.student?.fullName || 'Người dùng'}
                        </span>
                        {isOwner && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                Bạn
                            </span>
                        )}
                        <span className="text-[11px] text-gray-400">
                            {formatRelativeTime(comment.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="comment-item__content text-sm text-gray-700 pl-11 pr-4 py-1 leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
            </div>

            {comment.isFlagged && (
                <div className="comment-item__flag ml-11 mt-1 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                    <span>🚩</span> <span>Bình luận này đang chờ phê duyệt nội dung</span>
                </div>
            )}

            <div className="comment-item__actions ml-11 mt-1 flex items-center gap-3">
                {isAuthenticated && (
                    <button
                        type="button"
                        className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={() => onReply(comment.id)}
                    >
                        Trả lời
                    </button>
                )}
                {isOwner && (
                    <button
                        type="button"
                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => onDelete(comment.id)}
                    >
                        Xóa
                    </button>
                )}
            </div>

            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="comment-item__replies pl-11 mt-2 space-y-1">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            isAuthenticated={isAuthenticated}
                            onReply={onReply}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Skeletons for Loading State
const CommentSkeleton: React.FC = () => (
    <div className="comment-item animate-pulse py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-2 bg-gray-200 rounded w-1/6" />
            </div>
        </div>
        <div className="space-y-2 pl-11">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
    </div>
);

// ===== Main Comment Section =====

const CommentSection: React.FC<CommentSectionProps> = ({
    slug,
    isAuthenticated,
    currentUserId,
    currentUserAvatarUrl,
    currentUserFullName,
    className = '',
}) => {
    const [comments, setComments] = useState<ArticleCommentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [totalComments, setTotalComments] = useState(0);

    // New comment form
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async (pageNum: number, append = false) => {
        try {
            setLoading(true);
            const res = await articleAPI.getComments(slug, { page: pageNum, size: 10 });
            if (res.status && res.body) {
                const data = res.body as SpringPage<ArticleCommentResponse>;
                if (append) {
                    setComments((prev) => [...prev, ...data.content]);
                } else {
                    setComments(data.content);
                }
                setHasMore(!data.last);
                setTotalComments(data.totalElements);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        void fetchComments(0);
    }, [fetchComments]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        void fetchComments(nextPage, true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const data: CreateCommentRequest = {
                content: newComment.trim(),
                parentCommentId: replyTo,
            };
            const res = await articleAPI.createComment(slug, data);
            if (res.status && res.body) {
                setNewComment('');
                setReplyTo(null);
                setPage(0);
                void fetchComments(0);
            }
        } catch {
            // silent
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = (parentId: number) => {
        setReplyTo(parentId);
        // Focus the input
        const input = document.querySelector('.comment-form__input') as HTMLTextAreaElement;
        input?.focus();
    };

    const handleDelete = async (commentId: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

        try {
            const res = await articleAPI.deleteOwnComment(commentId);
            if (res.status) {
                const removeFromTree = (list: ArticleCommentResponse[]): ArticleCommentResponse[] => {
                    return list
                        .filter((c) => c.id !== commentId)
                        .map((c) => ({
                            ...c,
                            replies: removeFromTree(c.replies || []),
                        }));
                };
                setComments((prev) => removeFromTree(prev));
                setTotalComments((prev) => Math.max(0, prev - 1));
            }
        } catch {
            // silent
        }
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    return (
        <div className={`comment-section ${className}`}>
            <h3 className="comment-section__title text-lg font-bold text-[#001C44] mb-5 border-b border-gray-100 pb-3">
                Bình luận {totalComments > 0 && <span className="text-gray-400 font-medium">({totalComments})</span>}
            </h3>

            {/* Comment Form */}
            {isAuthenticated ? (
                <form className="comment-form border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-6" onSubmit={handleSubmit}>
                    {replyTo != null && (
                        <div className="comment-form__reply-indicator bg-amber-50 text-amber-800 border-b border-amber-100 px-4 py-2 text-xs flex justify-between items-center">
                            <span>Đang phản hồi bình luận <strong>#{replyTo}</strong></span>
                            <button type="button" onClick={cancelReply} className="text-gray-400 hover:text-amber-800 font-bold">
                                ✕
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3 p-4">
                        <div className="comment-form__avatar shrink-0 hidden sm:block">
                            {currentUserAvatarUrl ? (
                                <img
                                    src={currentUserAvatarUrl}
                                    alt="Avatar"
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#001C44] to-[#002A66] text-[#FFD66D] flex items-center justify-center font-bold text-sm shadow-sm">
                                    {currentUserFullName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                className="comment-form__input w-full border-0 outline-none p-0 focus:ring-0 text-sm min-h-[60px] text-gray-800 placeholder-gray-400 resize-none"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyTo ? 'Viết phản hồi...' : 'Chia sẻ suy nghĩ của bạn về bài viết này...'}
                                rows={2}
                                maxLength={2000}
                            />
                            <div className="comment-form__footer border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                                <span className="comment-form__char-count text-xs text-gray-400">
                                    {newComment.length}/2000 ký tự
                                </span>
                                <div className="flex gap-2">
                                    {replyTo != null && (
                                        <button
                                            type="button"
                                            onClick={cancelReply}
                                            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || submitting}
                                        className="px-4 py-2 bg-[#001C44] hover:bg-[#002A66] text-white rounded-lg text-xs font-bold shadow transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang gửi...' : replyTo ? 'Trả lời' : 'Bình luận'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="comment-form__login-prompt bg-gray-50 border border-dashed border-gray-200 text-gray-500 text-center py-6 rounded-xl text-sm mb-6">
                    Vui lòng đăng nhập để tham gia bình luận.
                </div>
            )}

            {/* Comment List */}
            <div className="comment-section__list space-y-4">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        isAuthenticated={isAuthenticated}
                        onReply={handleReply}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Loading state */}
            {loading && comments.length === 0 && (
                <div className="space-y-4 mt-4">
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                </div>
            )}

            {/* Empty state */}
            {!loading && comments.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                    💡 Chưa có thảo luận nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full text-center py-2.5 mt-4 border border-gray-200 hover:border-gray-300 text-sm font-semibold text-gray-600 hover:text-[#001C44] bg-white rounded-xl shadow-sm transition-all"
                >
                    {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
                </button>
            )}
        </div>
    );
};

export default CommentSection;

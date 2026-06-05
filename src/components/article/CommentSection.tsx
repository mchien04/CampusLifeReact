import React, { useCallback, useEffect, useState } from 'react';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleCommentResponse, CreateCommentRequest, SpringPage } from '../../types/article';

interface CommentSectionProps {
    slug: string;
    isAuthenticated: boolean;
    currentUserId?: number | null;
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
    const maxDepth = 2; // Maximum nesting depth

    return (
        <div
            className={`comment-item ${depth > 0 ? 'comment-item--reply' : ''}`}
            style={{ marginLeft: depth > 0 ? Math.min(depth, maxDepth) * 24 : 0 }}
        >
            <div className="comment-item__header">
                <div className="comment-item__avatar">
                    {comment.student?.avatarUrl ? (
                        <img
                            src={comment.student.avatarUrl}
                            alt={comment.student.fullName}
                            className="comment-item__avatar-img"
                        />
                    ) : (
                        <div className="comment-item__avatar-placeholder">
                            {comment.student?.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>
                <div className="comment-item__meta">
                    <span className="comment-item__name">
                        {comment.student?.fullName || 'Người dùng'}
                    </span>
                    <span className="comment-item__time">
                        {formatRelativeTime(comment.createdAt)}
                    </span>
                </div>
            </div>

            <div className="comment-item__content">
                {comment.content}
            </div>

            {comment.isFlagged && (
                <div className="comment-item__flag" title={comment.flagReason || 'Flagged'}>
                    🚩 Bình luận này đã bị gắn cờ
                </div>
            )}

            <div className="comment-item__actions">
                {isAuthenticated && (
                    <button
                        type="button"
                        className="comment-item__action-btn"
                        onClick={() => onReply(comment.id)}
                    >
                        Trả lời
                    </button>
                )}
                {isOwner && (
                    <button
                        type="button"
                        className="comment-item__action-btn comment-item__action-btn--danger"
                        onClick={() => onDelete(comment.id)}
                    >
                        Xóa
                    </button>
                )}
            </div>

            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="comment-item__replies">
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

// ===== Main Comment Section =====

const CommentSection: React.FC<CommentSectionProps> = ({
    slug,
    isAuthenticated,
    currentUserId,
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
                // Reset and refetch (simpler than optimistic tree insert)
                setNewComment('');
                setReplyTo(null);
                setPage(0);
                void fetchComments(0);
            }
        } catch {
            // Could add error toast
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
                // Cascade delete confirmed — just remove from tree
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
            // Could show error toast
        }
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    return (
        <div className={`comment-section ${className}`}>
            <h3 className="comment-section__title">
                Bình luận {totalComments > 0 && <span className="comment-section__count">({totalComments})</span>}
            </h3>

            {/* Comment Form */}
            {isAuthenticated ? (
                <form className="comment-form" onSubmit={handleSubmit}>
                    {replyTo != null && (
                        <div className="comment-form__reply-indicator">
                            <span>Đang trả lời bình luận #{replyTo}</span>
                            <button type="button" onClick={cancelReply} className="comment-form__cancel-reply">
                                ✕
                            </button>
                        </div>
                    )}
                    <textarea
                        className="comment-form__input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? 'Viết câu trả lời...' : 'Viết bình luận...'}
                        rows={3}
                        maxLength={2000}
                    />
                    <div className="comment-form__footer">
                        <span className="comment-form__char-count">
                            {newComment.length}/2000
                        </span>
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="comment-form__submit"
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="comment-form__login-prompt">
                    Đăng nhập để bình luận
                </div>
            )}

            {/* Comment List */}
            <div className="comment-section__list">
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
                <div className="comment-section__loading">
                    Đang tải bình luận...
                </div>
            )}

            {/* Empty state */}
            {!loading && comments.length === 0 && (
                <div className="comment-section__empty">
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="comment-section__load-more"
                >
                    {loading ? 'Đang tải...' : 'Tải thêm bình luận'}
                </button>
            )}
        </div>
    );
};

export default CommentSection;

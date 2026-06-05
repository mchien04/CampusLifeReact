import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleCommentResponse, SpringPage } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ManagerLayout from '../../components/layout/ManagerLayout';

const CommentManagement: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const parsedArticleId = Number(articleId);

    const [commentsPage, setCommentsPage] = useState<SpringPage<ArticleCommentResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [articleTitle, setArticleTitle] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(15);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const loadComments = async () => {
        if (!parsedArticleId) return;
        try {
            setLoading(true);
            const response = await articleAPI.getAdminComments(parsedArticleId, { page, size: pageSize });
            if (response.status && response.body) {
                setCommentsPage(response.body);
            }
        } catch (error: any) {
            toast.error('Không tải được danh sách bình luận');
        } finally {
            setLoading(false);
        }
    };

    const loadArticleDetail = async () => {
        if (!parsedArticleId) return;
        try {
            const response = await articleAPI.getArticleById(parsedArticleId);
            if (response.status && response.body) {
                setArticleTitle(response.body.title);
            }
        } catch {
            // Non-critical, title will remain empty or show ID
        }
    };

    useEffect(() => {
        loadComments();
    }, [parsedArticleId, page, pageSize]);

    useEffect(() => {
        loadArticleDetail();
    }, [parsedArticleId]);

    const handleHide = async (commentId: number) => {
        try {
            setActionLoadingId(commentId);
            const response = await articleAPI.hideComment(commentId);
            if (response.status) {
                toast.success('Đã ẩn bình luận thành công');
                loadComments();
            } else {
                toast.error('Không ẩn được bình luận');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi ẩn');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleUnhide = async (commentId: number) => {
        try {
            setActionLoadingId(commentId);
            const response = await articleAPI.unhideComment(commentId);
            if (response.status) {
                toast.success('Đã hiện lại bình luận');
                loadComments();
            } else {
                toast.error('Không hiện lại được bình luận');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi hiện lại');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!window.confirm('CẢNH BÁO: Xóa bình luận này sẽ xóa vĩnh viễn và cũng CASCADE XÓA toàn bộ phản hồi con. Bạn chắc chắn muốn xóa?')) {
            return;
        }

        try {
            setActionLoadingId(commentId);
            const response = await articleAPI.adminDeleteComment(commentId);
            if (response.status) {
                toast.success('Đã xóa bình luận thành công');
                loadComments();
            } else {
                toast.error('Xóa bình luận thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi xóa bình luận');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Recursive component to render tree comments for moderation
    const CommentNode: React.FC<{ comment: ArticleCommentResponse; depth: number }> = ({ comment, depth }) => {
        const isActionLoading = actionLoadingId === comment.id;

        return (
            <div
                className="border-b border-gray-150 pb-4 mb-4 last:mb-0 last:border-b-0"
                style={{ marginLeft: `${Math.min(depth * 24, 96)}px` }}
            >
                <div className={`p-4 rounded-xl border ${
                    comment.isHidden
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : comment.isFlagged
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            {comment.student?.avatarUrl ? (
                                <img
                                    src={comment.student.avatarUrl}
                                    alt={comment.student.fullName}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                    {comment.student?.fullName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div>
                                <span className="font-bold text-gray-800 text-sm">
                                    {comment.student?.fullName || 'Người dùng ẩn danh'}
                                </span>
                                {comment.student?.studentCode && (
                                    <span className="ml-2 text-xs text-gray-500 font-mono">
                                        ({comment.student.studentCode})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {comment.isHidden && (
                                <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-800 border border-gray-300">
                                    👁️‍🗨️ Đã ẩn
                                </span>
                            )}
                            {comment.isFlagged && (
                                <span className="inline-flex items-center rounded-full bg-red-150 px-2 py-0.5 text-xs font-bold text-red-800 border border-red-250 animate-pulse">
                                    🚩 Bị báo cáo {comment.flagReason && `(${comment.flagReason})`}
                                </span>
                            )}
                            <span className="text-xs text-gray-400">
                                {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-700 text-sm whitespace-pre-wrap word-break mb-3 pl-1">
                        {comment.content}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        {comment.isHidden ? (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUnhide(comment.id)}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                            >
                                👁️ Hiện lại
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleHide(comment.id)}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                            >
                                🔒 Ẩn bình luận
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleDelete(comment.id)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                            🗑️ Xóa vĩnh viễn
                        </button>
                    </div>
                </div>

                {comment.replies && comment.replies.map((reply) => (
                    <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
                ))}
            </div>
        );
    };

    return (
        <ManagerLayout>
            <div className="mx-auto max-w-5xl w-full px-4 py-6">
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors">
                                Quản lý bài viết
                            </button>
                            <span>/</span>
                            <span>Kiểm duyệt bình luận</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#001C44]">
                            💬 Kiểm duyệt bình luận
                        </h1>
                        {articleTitle && (
                            <p className="text-gray-600 mt-1 font-medium italic">
                                Bài viết: "{articleTitle}"
                            </p>
                        )}
                    </div>
                </div>

                {loading && !actionLoadingId ? (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : !commentsPage || commentsPage.content.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-5xl mb-4">💬</div>
                        <h2 className="text-xl font-bold text-[#001C44] mb-1">Không có bình luận</h2>
                        <p className="text-gray-500">Bài viết này hiện chưa có bình luận nào từ sinh viên.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <div className="mb-4 text-sm text-gray-600">
                                Tìm thấy <span className="font-semibold">{commentsPage.totalElements}</span> bình luận gốc và phản hồi.
                            </div>
                            <div className="space-y-4">
                                {commentsPage.content.map((comment) => (
                                    <CommentNode key={comment.id} comment={comment} depth={0} />
                                ))}
                            </div>
                        </div>

                        {commentsPage.totalPages > 1 && (
                            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-200">
                                <div className="text-sm text-gray-700">
                                    Trang <span className="font-semibold">{commentsPage.number + 1}</span> / <span className="font-semibold">{commentsPage.totalPages}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                        disabled={page <= 0}
                                        className="px-4 py-2 rounded-lg bg-[#001C44] text-white font-semibold disabled:opacity-50 text-sm"
                                    >
                                        ← Trước
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(commentsPage.totalPages - 1, prev + 1))}
                                        disabled={page >= commentsPage.totalPages - 1}
                                        className="px-4 py-2 rounded-lg bg-[#FFD66D] text-[#001C44] font-semibold disabled:opacity-50 text-sm"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ManagerLayout>
    );
};

export default CommentManagement;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import type { ArticleHistoryResponse, SpringPage } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StudentLayout from '../components/layout/StudentLayout';

const StudentReadingHistory: React.FC = () => {
    const navigate = useNavigate();
    const [pageData, setPageData] = useState<SpringPage<ArticleHistoryResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [clearing, setClearing] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await articleAPI.getReadingHistory({ page, size: pageSize });
            if (response.status && response.body) {
                setPageData(response.body);
            }
        } catch (err: any) {
            if (err?.response?.status === 401) {
                navigate('/login');
            } else {
                toast.error('Không tải được lịch sử đọc');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [page, pageSize]);

    const formatRelativeTime = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDeleteItem = async (e: React.MouseEvent, historyId: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi lịch sử đọc?')) {
            return;
        }

        try {
            setDeletingId(historyId);
            const response = await articleAPI.deleteHistoryItem(historyId);
            if (response.status) {
                toast.success('Đã xóa khỏi lịch sử');
                // Refresh history
                loadHistory();
            } else {
                toast.error('Xóa thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi xóa');
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử đọc? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            setClearing(true);
            const response = await articleAPI.clearAllHistory();
            if (response.status) {
                toast.success('Đã xóa sạch lịch sử đọc');
                setPage(0);
                loadHistory();
            } else {
                toast.error('Xóa lịch sử thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi xóa lịch sử');
        } finally {
            setClearing(false);
        }
    };

    const getStatusLabel = (status: string | null) => {
        switch (status) {
            case 'UPCOMING':
                return { label: 'Sắp mở', className: 'bg-indigo-50 text-indigo-700 border-indigo-150' };
            case 'OPEN':
                return { label: 'Đăng ký ngay', className: 'bg-emerald-50 text-emerald-700 border-emerald-150' };
            case 'WAITLIST':
                return { label: 'Danh sách chờ', className: 'bg-amber-50 text-amber-700 border-amber-150' };
            case 'FULL':
                return { label: 'Hết chỗ', className: 'bg-rose-50 text-rose-700 border-rose-150' };
            case 'CLOSED':
                return { label: 'Đã đóng', className: 'bg-gray-100 text-gray-700 border-gray-200' };
            default:
                return null;
        }
    };

    return (
        <StudentLayout>
            <div className="mx-auto max-w-5xl w-full px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-4">Lịch sử đọc</h1>
                        <p className="text-lg text-gray-500 font-medium">
                            {(pageData?.totalElements ?? 0) === 0
                                ? 'Chưa lưu lịch sử bài viết đã đọc'
                                : `Bạn đã xem ${pageData?.totalElements ?? 0} bài viết gần đây`}
                        </p>
                    </div>

                    {pageData && pageData.totalElements > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={clearing || loading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-0 bg-red-50 text-red-600 font-extrabold hover:bg-red-100 disabled:opacity-50 transition-all text-sm shadow-sm hover:shadow-md self-start sm:self-auto"
                        >
                            🗑️ Xóa tất cả
                        </button>
                    )}
                </div>

                {loading && !deletingId && !clearing ? (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (pageData?.content ?? []).length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium px-6">
                        <div className="text-5xl mb-4">📖</div>
                        <h2 className="text-2xl font-extrabold text-[#001C44] mb-3">Lịch sử trống</h2>
                        <p className="text-gray-500 font-medium mb-8">Hãy xem các bài viết tin tức sự kiện để ghi lại lịch sử đọc.</p>
                        <Link
                            to="/articles"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md"
                        >
                            Khám phá bài viết
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(pageData?.content ?? []).map((item) => {
                            const statusConfig = getStatusLabel(item.registrationStatus);
                            return (
                                <Link
                                    key={item.id}
                                    to={`/articles/${item.slug}`}
                                    className="block group overflow-hidden rounded-3xl border-0 bg-white shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 ease-out-expo p-5"
                                >
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {item.thumbnailUrl ? (
                                            <div className="w-full sm:w-56 h-36 flex-shrink-0 bg-gray-100 rounded-2xl overflow-hidden shadow-inner-light">
                                                <img
                                                    src={getImageUrl(item.thumbnailUrl) || ''}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out-expo"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full sm:w-56 h-36 flex-shrink-0 bg-gray-100 rounded-2xl overflow-hidden shadow-inner-light flex items-center justify-center text-4xl">
                                                📖
                                            </div>
                                        )}

                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                    {statusConfig && (
                                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${statusConfig.className}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                        👁️ Đã xem {formatRelativeTime(item.viewedAt)}
                                                    </span>
                                                </div>

                                                <h3 className="font-extrabold text-xl text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors mb-2 text-balance leading-snug">
                                                    {item.title}
                                                </h3>

                                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                    {item.seoDescription || 'Tin tức & sự kiện được cập nhật từ ban tổ chức.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-400">
                                                {item.publishedAt ? (
                                                    <span className="uppercase tracking-wider">Đăng ngày: {new Date(item.publishedAt).toLocaleDateString('vi-VN')}</span>
                                                ) : (
                                                    <span className="text-amber-500 uppercase tracking-wider">Bản nháp</span>
                                                )}

                                                <button
                                                    type="button"
                                                    disabled={deletingId === item.id}
                                                    onClick={(e) => handleDeleteItem(e, item.id)}
                                                    className="inline-flex items-center text-red-500 hover:text-red-700 font-extrabold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === item.id ? 'Đang xóa...' : 'Xóa khỏi lịch sử'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {pageData && pageData.totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-200">
                                <div className="text-sm text-gray-700">
                                    Trang <span className="font-semibold">{pageData.number + 1}</span> / <span className="font-semibold">{pageData.totalPages}</span>
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
                                        onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                                        disabled={page >= pageData.totalPages - 1}
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
        </StudentLayout>
    );
};

export default StudentReadingHistory;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import type { ArticleWishlistItemResponse, SpringPage } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StudentLayout from '../components/layout/StudentLayout';

const StudentWishlist: React.FC = () => {
    const navigate = useNavigate();
    const [pageData, setPageData] = useState<SpringPage<ArticleWishlistItemResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(12);

    useEffect(() => {
        const loadWishlist = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await articleAPI.getWishlistedArticles({ page, size: pageSize });
                if (response.status && response.body) {
                    setPageData(response.body);
                } else {
                    setError('Không tải được danh sách yêu thích');
                }
            } catch (err: any) {
                if (err?.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError(err?.response?.data?.message || 'Có lỗi xảy ra');
                }
            } finally {
                setLoading(false);
            }
        };

        loadWishlist();
    }, [navigate, page, pageSize]);

    if (loading) {
        return (
            <StudentLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="mx-auto max-w-7xl w-full">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#001C44] mb-1">Bài viết đã lưu</h1>
                    <p className="text-gray-600">
                        {(pageData?.totalElements ?? 0) === 0
                            ? 'Bạn chưa lưu bài viết nào'
                            : `Bạn đã lưu ${pageData?.totalElements ?? 0} bài viết`}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {(pageData?.content ?? []).length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-[#001C44] mb-2">Chưa có bài viết nào</h2>
                        <p className="text-gray-600 mb-6">Hãy khám phá các sự kiện và lưu những bài viết yêu thích của bạn</p>
                        <Link
                            to="/events"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            Xem các sự kiện
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {(pageData?.content ?? []).map((article) => (
                            <Link
                                key={article.id}
                                to={`/articles/${article.slug}`}
                                className="group overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                            >
                                {article.thumbnailUrl && (
                                    <div className="h-48 bg-gray-200 overflow-hidden">
                                        <img
                                            src={getImageUrl(article.thumbnailUrl) || ''}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 truncate">
                                            {article.registrationStatus === 'OPEN' ? '🔓 Mở' : '🔒 Đóng'}
                                        </span>
                                        <span className="text-lg">❤</span>
                                    </div>
                                    <h3 className="font-bold text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {article.seoDescription || 'Bài viết quảng bá sự kiện'}
                                    </p>
                                    {article.publishedAt && (
                                        <p className="text-xs text-gray-500 mt-3">
                                            {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {pageData && pageData.totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-700">
                            Trang <span className="font-semibold">{pageData.number + 1}</span> / <span className="font-semibold">{pageData.totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                disabled={page <= 0}
                                className="px-4 py-2 rounded-lg bg-[#001C44] text-white font-semibold disabled:opacity-50"
                            >
                                ← Trước
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
                                disabled={page >= pageData.totalPages - 1}
                                className="px-4 py-2 rounded-lg bg-[#FFD66D] text-[#001C44] font-semibold disabled:opacity-50"
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentWishlist;

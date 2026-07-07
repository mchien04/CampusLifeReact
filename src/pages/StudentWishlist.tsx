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
                <div className="mb-10 max-w-2xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-4">Bài viết đã lưu</h1>
                    <p className="text-lg text-gray-500 font-medium">
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
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium">
                        <span className="text-5xl block mb-4">✨</span>
                        <h2 className="text-2xl font-extrabold text-[#001C44] mt-3 mb-2">Chưa có bài viết nào được lưu</h2>
                        <p className="text-gray-500 mb-6 font-medium">Hãy khám phá các sự kiện và lưu những bài viết yêu thích của bạn</p>
                        <Link
                            to="/articles"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md"
                        >
                            Xem tất cả bài viết →
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {(pageData?.content ?? []).map((article) => (
                            <Link
                                key={article.id}
                                to={`/articles/${article.slug}`}
                                className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 ease-out-expo border-0"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 bg-gray-100 overflow-hidden shrink-0">
                                    {article.thumbnailUrl ? (
                                        <img
                                            src={getImageUrl(article.thumbnailUrl) || ''}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
                                            📸
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-[#001C44] uppercase tracking-widest shadow-sm">
                                            {article.registrationStatus === 'OPEN' ? '🟢 Mở' : '⚪ Đóng'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-rose-50 text-rose-500 rounded-full p-2 shadow-md z-10 flex items-center justify-center w-10 h-10">
                                        <span className="text-xl leading-none">❤️</span>
                                    </div>
                                </div>
                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                                    <div>
                                        <h3 className="font-extrabold text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors text-lg mb-2.5 leading-tight text-balance">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">
                                            {article.seoDescription || 'Bài viết quảng bá sự kiện'}
                                        </p>
                                    </div>
                                    {article.publishedAt && (
                                        <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pt-4 border-t border-gray-100">
                                            {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                        </div>
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

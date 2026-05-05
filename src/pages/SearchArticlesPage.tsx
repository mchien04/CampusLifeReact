import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { ArticleListResponse, SpringPage } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';

const SearchArticlesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [pageData, setPageData] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(query);
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [wishlistToggles, setWishlistToggles] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize] = useState(12);

    // Search articles
    useEffect(() => {
        if (!query.trim()) {
            setArticles([]);
            setPageData(null);
            return;
        }

        const searchArticles = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await articleAPI.searchArticles(query, { page, size: pageSize });
                if (response.status && response.body) {
                    setPageData(response.body);
                    setArticles(response.body.content || []);
                } else {
                    setError('Không thể tải kết quả tìm kiếm');
                }
            } catch (err) {
                console.error('Failed to search articles:', err);
                setError('Lỗi khi tìm kiếm bài viết');
            } finally {
                setLoading(false);
            }
        };

        searchArticles();
    }, [query, page, pageSize]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setPage(0);
            setSearchParams({ q: searchInput });
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearchParams({});
        setArticles([]);
        setPageData(null);
    };

    const handleWishlistToggle = async (slug: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setWishlistToggles((prev) => new Set([...Array.from(prev), slug]));
            await toggleWishlist(slug);
        } finally {
            setWishlistToggles((prev) => {
                const next = new Set(prev);
                next.delete(slug);
                return next;
            });
        }
    };

    return (
        <ArticleLayout>
            <Helmet>
                <title>Tìm kiếm bài viết - CampusLife</title>
                <meta name="description" content="Tìm kiếm bài viết trên CampusLife" />
            </Helmet>

            <div>
                {/* Search bar */}
                <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#001C44] mb-4">Tìm kiếm bài viết</h1>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none font-semibold text-gray-900"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    {query && (
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-gray-600">
                                Kết quả tìm kiếm cho: <strong>"{query}"</strong>
                            </span>
                            <button
                                onClick={handleClearSearch}
                                className="text-sm text-[#0B5FFF] hover:underline"
                            >
                                Xóa
                            </button>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                {!query ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">Nhập từ khóa để tìm kiếm bài viết</p>
                    </div>
                ) : articles.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">Không tìm thấy bài viết nào</p>
                        <Link
                            to="/articles"
                            className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            Xem tất cả bài viết →
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 mb-6">
                            Tìm thấy <strong>{pageData?.totalElements ?? articles.length}</strong> bài viết
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => {
                                const thumbUrl = getImageUrl(article.thumbnailUrl || undefined);
                                const isWished = isWishlisted(article.slug);
                                const isToggling = wishlistToggles.has(article.slug);

                                return (
                                    <Link
                                        key={article.id}
                                        to={`/articles/${article.slug}`}
                                        className="group overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-48 overflow-hidden bg-gray-200">
                                            {thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#001C44] to-[#0B5FFF] text-white text-4xl">
                                                    📰
                                                </div>
                                            )}

                                            {/* Wishlist button */}
                                            <button
                                            onClick={(e) => handleWishlistToggle(article.slug, e)}
                                                disabled={isToggling}
                                                className="absolute top-3 right-3 text-2xl hover:scale-125 transition-transform"
                                            >
                                                {isWished ? '❤️' : '🤍'}
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="text-lg font-bold text-[#001C44] group-hover:text-[#0B5FFF] transition-colors line-clamp-2">
                                                {article.title}
                                            </h3>

                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {article.seoDescription || 'Bài viết không có mô tả'}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 border-t pt-3">
                                                <span title="Lượt xem">👁️ {(article.viewCount || 0).toLocaleString('vi-VN')}</span>
                                                <span title="Đã lưu">❤️ {(article.wishlistCount || 0).toLocaleString('vi-VN')}</span>
                                                {article.publishedAt && (
                                                    <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
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
        </ArticleLayout>
    );
};

export default SearchArticlesPage;

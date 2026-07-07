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
                <div className="mb-10 max-w-3xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-6">Tìm kiếm bài viết</h1>

                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="flex-1 px-8 py-4 rounded-3xl border-0 shadow-inner-light focus:ring-4 focus:ring-blue-100 focus:outline-none font-semibold text-gray-900 bg-white"
                        />
                        <button
                            type="submit"
                            className="px-8 py-4 rounded-3xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
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
                    <div className="mb-10 rounded-3xl bg-red-50 p-6 text-red-600 border-0 shadow-inner-light font-medium">
                        {error}
                    </div>
                )}

                {!query ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium px-6">
                        <span className="text-5xl block mb-4">🔍</span>
                        <p className="text-gray-500 text-lg font-medium">Nhập từ khóa để tìm kiếm bài viết</p>
                    </div>
                ) : articles.length === 0 && !loading ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium px-6">
                        <span className="text-5xl block mb-4">✨</span>
                        <h2 className="text-2xl font-extrabold text-[#001C44] mb-3">Không tìm thấy bài viết nào</h2>
                        <Link
                            to="/articles"
                            className="mt-6 inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md"
                        >
                            Xem tất cả bài viết →
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-500 mb-8 font-medium">
                            Tìm thấy <strong className="text-[#001C44]">{pageData?.totalElements ?? articles.length}</strong> bài viết
                        </p>

                        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                            {articles.map((article) => {
                                const thumbUrl = getImageUrl(article.thumbnailUrl || undefined);
                                const isWished = isWishlisted(article.slug);
                                const isToggling = wishlistToggles.has(article.slug);

                                return (
                                    <Link
                                        key={article.id}
                                        to={`/articles/${article.slug}`}
                                        className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 ease-out-expo border-0"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-52 bg-gray-100 overflow-hidden shrink-0">
                                            {thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
                                                    📸
                                                </div>
                                            )}

                                            {/* Wishlist button */}
                                            <button
                                                onClick={(e) => handleWishlistToggle(article.slug, e)}
                                                disabled={isToggling}
                                                className="absolute bottom-4 right-4 bg-white hover:bg-rose-50 rounded-full p-2.5 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-10"
                                            >
                                                <span className="text-xl flex items-center justify-center leading-none">
                                                    {isWished ? '❤️' : '🤍'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                                            <div>
                                                <h3 className="font-extrabold text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors text-lg mb-2.5 leading-tight text-balance">
                                                    {article.title}
                                                </h3>

                                                <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">
                                                    {article.seoDescription || 'Bài viết không có mô tả'}
                                                </p>
                                            </div>

                                            <div>
                                                {/* Stats */}
                                                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 font-semibold">
                                                    <span className="flex items-center gap-1.5">
                                                        👁️ {(article.viewCount || 0).toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        ❤️ {(article.wishlistCount || 0).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>

                                                {/* Date */}
                                                {article.publishedAt && (
                                                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pt-4 border-t border-gray-100 flex items-center gap-1.5">
                                                        <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                                                    </p>
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

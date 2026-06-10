import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { ArticleListResponse, SpringPage } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';
import ArticleTypeBadge from '../components/article/ArticleTypeBadge';
import TrendingArticlesWidget from '../components/article/TrendingArticlesWidget';

type SortOption = 'newest' | 'views' | 'wishlist';
type FilterStatus = 'all' | 'published' | 'featured';

const ArticleListPage: React.FC = () => {
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [articlesPage, setArticlesPage] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortOption>('newest');
    const [filter, setFilter] = useState<FilterStatus>('published');
    const [wishlistToggles, setWishlistToggles] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(12);

    useEffect(() => {
        const loadArticles = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await articleAPI.getPublicArticlesList?.({
                    status: filter === 'published' ? 'published' : 'all',
                    featured: filter === 'featured' ? true : undefined,
                    page,
                    size: pageSize,
                });

                if (response?.status && response.body) {
                    setArticlesPage(response.body);
                    setArticles(response.body.content || []);
                } else {
                    setArticlesPage(null);
                    setArticles([]);
                }
            } catch (err: any) {
                console.error('Failed to load articles:', err);
                setError('Không tải được danh sách bài viết');
                setArticlesPage(null);
            } finally {
                setLoading(false);
            }
        };

        loadArticles();
    }, [filter, page, pageSize]);

    useEffect(() => {
        setPage(0);
    }, [filter]);

    // Apply search and sorting
    const filteredArticles = useMemo(() => {
        let result = [...articles];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (a) =>
                    a.title.toLowerCase().includes(q) ||
                    a.seoDescription?.toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }

            if (sort === 'views') {
                return (b.viewCount || 0) - (a.viewCount || 0);
            }

            if (sort === 'wishlist') {
                return (b.wishlistCount || 0) - (a.wishlistCount || 0);
            }

            return new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime();
        });

        return result;
    }, [articles, search, sort]);

    const totalPages = articlesPage?.totalPages || 1;
    const totalElements = articlesPage?.totalElements || filteredArticles.length;

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

    if (loading) {
        return (
            <ArticleLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </ArticleLayout>
        );
    }

    return (
        <ArticleLayout>
            <div>
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#001C44]">Bài viết sự kiện</h1>
                    <p className="text-gray-600 mt-1">Khám phá các bài viết nổi bật từ hệ thống CampusLife</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        {/* Filters & Search */}
                        <div className="mb-8 rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-4">
                                {/* Search */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        Tìm kiếm
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm">
                                            🔍
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Tìm bài viết..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full rounded-xl border border-gray-250 pl-10 pr-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44]/10 focus:outline-none transition-all text-sm shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Filter */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as FilterStatus)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44]/10 focus:outline-none transition-all bg-white cursor-pointer text-sm shadow-sm"
                                    >
                                        <option value="published">Đã xuất bản</option>
                                        <option value="featured">Nổi bật</option>
                                        <option value="all">Tất cả</option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        Sắp xếp
                                    </label>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortOption)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44]/10 focus:outline-none transition-all bg-white cursor-pointer text-sm shadow-sm"
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="views">Lượt xem</option>
                                        <option value="wishlist">Độ yêu thích</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="mb-5 text-sm text-gray-500 font-medium pl-1">
                            Tìm thấy <span className="font-bold text-[#001C44]">{totalElements}</span> bài viết
                        </div>

                        {/* Articles Grid */}
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-250 border-dashed">
                                <span className="text-4xl">📚</span>
                                <h2 className="text-xl font-bold text-[#001C44] mt-3 mb-1">Không tìm thấy bài viết</h2>
                                <p className="text-gray-500 text-sm">Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        to={`/articles/${article.slug}`}
                                        className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 border border-gray-100 hover:border-[#FFD66D] flex flex-col h-full"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shrink-0">
                                            {article.thumbnailUrl ? (
                                                <img
                                                    src={getImageUrl(article.thumbnailUrl) || ''}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/50">
                                                    <span className="text-4xl">📸</span>
                                                </div>
                                            )}

                                            {/* Status badge */}
                                            {article.registrationStatus && (
                                                <div className="absolute top-3 left-3 z-10">
                                                    {article.registrationStatus === 'OPEN' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
                                                            Mở đăng ký
                                                        </span>
                                                    ) : article.registrationStatus === 'WAITLIST' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
                                                            Danh sách chờ
                                                        </span>
                                                    ) : article.registrationStatus === 'CLOSED' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
                                                            Đã đóng
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-lg bg-gray-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
                                                            {article.registrationStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pinned badge */}
                                            {article.isPinned && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <span className="inline-flex items-center rounded-lg bg-[#FFD66D] px-2.5 py-1 text-[10px] font-bold text-[#001C44] shadow-md uppercase tracking-wider">
                                                        📌 Ghim
                                                    </span>
                                                </div>
                                            )}

                                            {/* Wishlist button */}
                                            <button
                                                onClick={(e) => handleWishlistToggle(article.slug, e)}
                                                disabled={wishlistToggles.has(article.slug)}
                                                className="absolute bottom-3 right-3 bg-white hover:bg-red-50 rounded-full p-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-10"
                                                title={isWishlisted(article.slug) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                            >
                                                <span className="text-xl flex items-center justify-center line-height-1">
                                                    {isWishlisted(article.slug) ? '❤️' : '🤍'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1 justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <ArticleTypeBadge type={article.articleType} />
                                                    {article.isPrimary && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-bold border border-amber-200 shadow-sm">
                                                            ★ Chính
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-[#001C44] line-clamp-2 group-hover:text-[#0B5FFF] transition-colors text-base mb-2 leading-snug">
                                                    {article.title}
                                                </h3>

                                                {article.seoDescription && (
                                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                                                        {article.seoDescription}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                {/* Stats */}
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3.5 p-2 bg-gray-50 rounded-lg border border-gray-100 font-semibold">
                                                    <span className="flex items-center gap-1.5">
                                                        👁️ {(article.viewCount || 0).toLocaleString('vi-VN')} lượt xem
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        ❤️ {(article.wishlistCount || 0).toLocaleString('vi-VN')} đã lưu
                                                    </span>
                                                </div>

                                                {/* Date */}
                                                {article.publishedAt && (
                                                    <p className="text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-3 flex items-center gap-1">
                                                        <span>📅</span> <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {articlesPage && totalPages > 1 && (
                            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-200 sm:flex-row">
                                <div className="text-xs font-bold text-gray-500">
                                    Trang {articlesPage.number + 1} / {totalPages} — Tổng số {totalElements} bài viết
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                        disabled={page <= 0}
                                        className="rounded-xl bg-[#001C44] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
                                    >
                                        ← Trước
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="rounded-xl bg-[#FFD66D] px-4 py-2 text-xs font-bold text-[#001C44] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
                                    >
                                        Sau →
                                    </button>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPage(0);
                                            setPageSize(Number(e.target.value));
                                        }}
                                        className="rounded-xl border border-gray-250 px-3 py-2 text-xs font-bold text-[#001C44] bg-white hover:bg-gray-50 cursor-pointer transition-all shadow-sm focus:outline-none"
                                    >
                                        <option value={8}>8 / trang</option>
                                        <option value={12}>12 / trang</option>
                                        <option value={24}>24 / trang</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <aside className="space-y-6">
                        <TrendingArticlesWidget limit={5} />
                    </aside>
                </div>
            </div>
        </ArticleLayout>
    );
};

export default ArticleListPage;

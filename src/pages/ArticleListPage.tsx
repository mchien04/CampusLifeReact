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
                        <div className="mb-8 rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        {/* Search */}
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-[#001C44] mb-2">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề hoặc mô tả..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all"
                            />
                        </div>

                        {/* Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-[#001C44] mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as FilterStatus)}
                                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all bg-white cursor-pointer"
                            >
                                <option value="published">Đã xuất bản</option>
                                <option value="featured">Nổi bật</option>
                                <option value="all">Tất cả</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-semibold text-[#001C44] mb-2">
                                Sắp xếp
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all bg-white cursor-pointer"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="views">Lượt xem cao</option>
                                <option value="wishlist">Yêu thích nhiều</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-6 text-sm text-gray-600">
                    Tìm thấy <span className="font-semibold">{totalElements}</span> bài viết
                </div>

                {/* Articles Grid */}
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold text-[#001C44] mb-2">Không tìm thấy bài viết</h2>
                        <p className="text-gray-600">Hãy thử tìm kiếm hoặc lọc lại để xem các bài viết khác</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredArticles.map((article) => (
                            <Link
                                key={article.id}
                                to={`/articles/${article.slug}`}
                                className="group overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 hover:border-[#FFD66D]"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                                    {article.thumbnailUrl ? (
                                        <img
                                            src={getImageUrl(article.thumbnailUrl) || ''}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                                            <span className="text-5xl">📸</span>
                                        </div>
                                    )}

                                    {/* Status badge */}
                                    <div className="absolute top-3 left-3">
                                        {article.registrationStatus === 'OPEN' ? (
                                            <span className="inline-flex items-center rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                                Mở
                                            </span>
                                        ) : article.registrationStatus === 'CLOSED' ? (
                                            <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                                Đóng
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                                {article.registrationStatus || 'Chưa xác định'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Featured/Pinned indicator */}
                                    {(article.isPinned || article.isFeatured) && (
                                        <div className="absolute top-3 right-3">
                                            {article.isPinned && (
                                                <span className="inline-flex items-center rounded-full bg-[#FFD66D] px-3 py-1 text-xs font-bold text-[#001C44] shadow-md">
                                                    Ghim
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Wishlist button */}
                                    <button
                                        onClick={(e) => handleWishlistToggle(article.slug, e)}
                                        disabled={wishlistToggles.has(article.slug)}
                                        className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg hover:scale-110 transition-all disabled:opacity-50"
                                        title={
                                            isWishlisted(article.slug)
                                                ? 'Xóa khỏi yêu thích'
                                                : 'Thêm vào yêu thích'
                                        }
                                    >
                                        <span className="text-2xl">
                                            {isWishlisted(article.slug) ? '❤️' : '🤍'}
                                        </span>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <ArticleTypeBadge type={article.articleType} />
                                        {article.isPrimary && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                                                ★ Chính
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors text-lg mb-3">
                                        {article.title}
                                    </h3>

                                    {article.seoDescription && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {article.seoDescription}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="flex items-center gap-1">
                                            <span className="text-lg">👁</span> {(article.viewCount || 0).toLocaleString('vi-VN')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-lg">❤</span> {(article.wishlistCount || 0).toLocaleString('vi-VN')}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    {article.publishedAt && (
                                        <p className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                                            📅 {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {articlesPage && totalPages > 1 && (
                    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md border-2 border-[#001C44] border-opacity-10 sm:flex-row">
                        <div className="text-sm font-semibold text-[#001C44]">
                            Trang {articlesPage.number + 1} / {totalPages} — Tổng {totalElements} bài
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                disabled={page <= 0}
                                className="rounded-lg bg-[#001C44] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Trước
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                disabled={page >= totalPages - 1}
                                className="rounded-lg bg-[#FFD66D] px-4 py-2 text-sm font-semibold text-[#001C44] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau →
                            </button>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPage(0);
                                    setPageSize(Number(e.target.value));
                                }}
                                className="rounded-lg border-2 border-[#001C44] px-3 py-2 text-sm font-medium text-[#001C44] bg-white hover:bg-gray-50 cursor-pointer transition-all"
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

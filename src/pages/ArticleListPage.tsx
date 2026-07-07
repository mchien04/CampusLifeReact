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
                <div className="mb-10 max-w-2xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-4">Bài viết sự kiện</h1>
                    <p className="text-lg text-gray-500 font-medium">Khám phá các bài viết nổi bật, thông báo và tổng kết hoạt động từ hệ thống CampusLife.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        {/* Filters & Search */}
                        <div className="mb-8 rounded-3xl bg-white p-6 shadow-premium">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-5">
                                {/* Search */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
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
                                            className="w-full rounded-2xl border-0 bg-gray-50 pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-[#001C44] transition-all text-sm shadow-inner-light"
                                        />
                                    </div>
                                </div>

                                {/* Filter */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as FilterStatus)}
                                        className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-[#001C44] transition-all cursor-pointer text-sm shadow-inner-light"
                                    >
                                        <option value="published">Đã xuất bản</option>
                                        <option value="featured">Nổi bật</option>
                                        <option value="all">Tất cả</option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                                        Sắp xếp
                                    </label>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortOption)}
                                        className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-[#001C44] transition-all cursor-pointer text-sm shadow-inner-light"
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
                            <div className="text-center py-24 bg-white rounded-3xl shadow-premium border border-transparent">
                                <span className="text-5xl block mb-4">✨</span>
                                <h2 className="text-2xl font-extrabold text-[#001C44] mt-3 mb-2">Không tìm thấy bài viết</h2>
                                <p className="text-gray-500 font-medium">Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        to={`/articles/${article.slug}`}
                                        className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-500 ease-out-expo border border-gray-50"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-52 bg-gray-100 overflow-hidden shrink-0">
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
                                                <div className="absolute top-4 left-4 z-10">
                                                    {article.registrationStatus === 'OPEN' ? (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-widest">
                                                            Mở đăng ký
                                                        </span>
                                                    ) : article.registrationStatus === 'WAITLIST' ? (
                                                        <span className="inline-flex items-center rounded-full bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-widest">
                                                            Danh sách chờ
                                                        </span>
                                                    ) : article.registrationStatus === 'CLOSED' ? (
                                                        <span className="inline-flex items-center rounded-full bg-rose-500/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-widest">
                                                            Đã đóng
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-white uppercase tracking-widest">
                                                            {article.registrationStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pinned badge */}
                                            {article.isPinned && (
                                                <div className="absolute top-4 right-4 z-10">
                                                    <span className="inline-flex items-center rounded-full bg-[#FFD66D]/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-[#001C44] uppercase tracking-widest">
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
                                        <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <ArticleTypeBadge type={article.articleType} />
                                                    {article.isPrimary && (
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 px-2.5 py-1 text-[10px] font-extrabold tracking-widest uppercase">
                                                            Chính
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-extrabold text-[#001C44] line-clamp-2 group-hover:text-blue-600 transition-colors text-lg mb-2.5 leading-tight text-balance">
                                                    {article.title}
                                                </h3>

                                                {article.seoDescription && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">
                                                        {article.seoDescription}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                {/* Stats */}
                                                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 font-semibold">
                                                    <span className="flex items-center gap-1.5">
                                                        👁️ {(article.viewCount || 0).toLocaleString('vi-VN')} lượt xem
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        ❤️ {(article.wishlistCount || 0).toLocaleString('vi-VN')} đã lưu
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
                                ))}
                            </div>
                        )}

                        {articlesPage && totalPages > 1 && (
                            <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-3xl bg-white p-6 shadow-premium sm:flex-row">
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                    Trang {articlesPage.number + 1} / {totalPages} — Tổng số {totalElements} bài viết
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                        disabled={page <= 0}
                                        className="rounded-2xl bg-gray-50 px-5 py-3 text-xs font-extrabold text-[#001C44] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        ← Trước
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="rounded-2xl bg-[#001C44] px-5 py-3 text-xs font-extrabold text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                    >
                                        Sau →
                                    </button>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPage(0);
                                            setPageSize(Number(e.target.value));
                                        }}
                                        className="rounded-2xl border-0 bg-gray-50 px-4 py-3 text-xs font-extrabold text-[#001C44] hover:bg-gray-100 cursor-pointer transition-all focus:outline-none"
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

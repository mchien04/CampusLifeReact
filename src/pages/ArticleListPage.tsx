import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type {
    ArticleCategoryPublicResponse,
    ArticleListResponse,
    ArticleTagPublicResponse,
    SpringPage,
} from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';
import ArticleTypeBadge from '../components/article/ArticleTypeBadge';
import TrendingArticlesWidget from '../components/article/TrendingArticlesWidget';
import {
    MagnifyingGlass,
    Heart,
    Eye,
    PushPin,
    Image as ImageIcon,
    Sparkle,
    CaretLeft,
    CaretRight,
    Faders
} from '@phosphor-icons/react';

type SortOption = 'newest' | 'views' | 'wishlist';
type FilterStatus = 'all' | 'published' | 'featured';

const ArticleListPage: React.FC = () => {
    const navigate = useNavigate();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [articlesPage, setArticlesPage] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [categories, setCategories] = useState<ArticleCategoryPublicResponse[]>([]);
    const [tags, setTags] = useState<ArticleTagPublicResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortOption>('newest');
    const [filter, setFilter] = useState<FilterStatus>('published');
    const [wishlistToggles, setWishlistToggles] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(12);

    useEffect(() => {
        const loadTaxonomy = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    articleAPI.getCategories(),
                    articleAPI.getPublicTags(),
                ]);
                if (catRes.status && catRes.body) setCategories(catRes.body);
                if (tagRes.status && tagRes.body) setTags(tagRes.body);
            } catch {
                setCategories([]);
                setTags([]);
            }
        };
        void loadTaxonomy();
    }, []);

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const keyword = search.trim();
        if (keyword) {
            navigate(`/articles/search?keyword=${encodeURIComponent(keyword)}`);
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

                {categories.length > 0 && (
                    <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
                        <div className="flex gap-2.5 min-w-max">
                            <span className="inline-flex items-center px-4 py-2 rounded-xl bg-[#001C44] text-white text-sm font-bold">
                                Tất cả
                            </span>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/articles/category/${cat.slug}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-gray-600 border border-gray-100 text-sm font-bold hover:border-[#001C44]/30 hover:text-[#001C44] transition-colors"
                                >
                                    {cat.name}
                                    {typeof cat.articleCount === 'number' && (
                                        <span className="text-xs font-semibold text-gray-400 tabular-nums">{cat.articleCount}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {tags.length > 0 && (
                    <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
                        <div className="flex gap-2 min-w-max">
                            {tags.map((tag) => (
                                <Link
                                    key={tag.id}
                                    to={`/articles/tag/${tag.slug}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100 text-xs font-semibold hover:bg-[#FFD66D]/30 hover:border-[#FFD66D]/50 hover:text-[#001C44] transition-colors"
                                >
                                    #{tag.name}
                                    {typeof tag.articleCount === 'number' && tag.articleCount > 0 && (
                                        <span className="text-[10px] text-gray-400 tabular-nums">{tag.articleCount}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-6">
                        {/* Filters & Search */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="mb-8 rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            {/* Search */}
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <MagnifyingGlass size={20} weight="bold" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài viết..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Filter */}
                                <div className="relative min-w-[160px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Faders size={18} weight="bold" />
                                    </div>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as FilterStatus)}
                                        className="w-full appearance-none pl-10 pr-10 py-3 bg-gray-50/80 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all cursor-pointer"
                                    >
                                        <option value="published">Đã xuất bản</option>
                                        <option value="featured">Nổi bật</option>
                                        <option value="all">Tất cả</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="relative min-w-[160px]">
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortOption)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50/80 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001C44]/20 focus:border-[#001C44] transition-all cursor-pointer"
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="views">Nhiều lượt xem</option>
                                        <option value="wishlist">Được yêu thích</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Results count */}
                        <div className="mb-5 text-sm text-gray-500 font-medium pl-1">
                            Tìm thấy <span className="font-bold text-[#001C44]">{totalElements}</span> bài viết
                        </div>

                        {/* Articles Grid */}
                        {filteredArticles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-20 h-20 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-5">
                                    <Sparkle size={40} weight="duotone" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
                                <p className="text-gray-500 font-medium">Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc của bạn.</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        to={`/articles/${article.slug}`}
                                        className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-56 bg-gray-100 overflow-hidden shrink-0">
                                            {article.thumbnailUrl ? (
                                                <img
                                                    src={getImageUrl(article.thumbnailUrl) || ''}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                                    <ImageIcon size={48} weight="duotone" />
                                                </div>
                                            )}
                                            
                                            {/* Gradient overlay for better text contrast on image bottom if needed */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            {/* Status badge */}
                                            {article.registrationStatus && (
                                                <div className="absolute top-4 left-4 z-10">
                                                    {article.registrationStatus === 'OPEN' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white tracking-wide shadow-sm">
                                                            Mở đăng ký
                                                        </span>
                                                    ) : article.registrationStatus === 'WAITLIST' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white tracking-wide shadow-sm">
                                                            Danh sách chờ
                                                        </span>
                                                    ) : article.registrationStatus === 'CLOSED' ? (
                                                        <span className="inline-flex items-center rounded-lg bg-rose-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white tracking-wide shadow-sm">
                                                            Đã đóng
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-lg bg-gray-800/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white tracking-wide shadow-sm">
                                                            {article.registrationStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pinned badge */}
                                            {article.isPinned && (
                                                <div className="absolute top-4 right-4 z-10">
                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-600 shadow-sm border border-amber-100">
                                                        <PushPin size={12} weight="fill" /> Ghim
                                                    </span>
                                                </div>
                                            )}

                                            {/* Wishlist button */}
                                            <button
                                                onClick={(e) => handleWishlistToggle(article.slug, e)}
                                                disabled={wishlistToggles.has(article.slug)}
                                                className={`absolute bottom-4 right-4 rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all duration-300 z-10 ${
                                                    isWishlisted(article.slug) 
                                                        ? 'bg-rose-500 text-white' 
                                                        : 'bg-white/90 hover:bg-white text-gray-500 hover:text-rose-500'
                                                }`}
                                                title={isWishlisted(article.slug) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                            >
                                                <Heart size={20} weight={isWishlisted(article.slug) ? 'fill' : 'bold'} className={isWishlisted(article.slug) ? 'animate-pulse' : ''} />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-1 bg-white">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <ArticleTypeBadge type={article.articleType} />
                                                    {article.isPrimary && (
                                                        <span className="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border border-indigo-100">
                                                            Chính
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-[#001C44] transition-colors text-lg mb-2 line-clamp-2 leading-snug">
                                                    {article.title}
                                                </h3>

                                                {article.seoDescription && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                                        {article.seoDescription}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-gray-100">
                                                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1.5" title="Lượt xem">
                                                            <Eye size={16} weight="duotone" />
                                                            {article.viewCount || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1.5" title="Lượt thích">
                                                            <Heart size={16} weight="duotone" />
                                                            {article.wishlistCount || 0}
                                                        </span>
                                                    </div>
                                                    {article.publishedAt && (
                                                        <span className="text-gray-400">
                                                            {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {articlesPage && totalPages > 1 && (
                            <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm sm:flex-row">
                                <div className="text-sm font-medium text-gray-500 pl-2">
                                    Trang <span className="font-bold text-gray-900">{articlesPage.number + 1}</span> / {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                        disabled={page <= 0}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-gray-200"
                                        title="Trang trước"
                                    >
                                        <CaretLeft size={20} weight="bold" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-gray-200"
                                        title="Trang sau"
                                    >
                                        <CaretRight size={20} weight="bold" />
                                    </button>
                                    <div className="h-6 w-px bg-gray-200 mx-2"></div>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPage(0);
                                            setPageSize(Number(e.target.value));
                                        }}
                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#001C44]/20"
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

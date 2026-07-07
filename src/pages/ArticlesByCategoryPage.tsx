import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { ArticleListResponse, SpringPage } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';

const ArticlesByCategoryPage: React.FC = () => {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [pageData, setPageData] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentCategory, setCurrentCategory] = useState<string>('');
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [wishlistToggles, setWishlistToggles] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize] = useState(12);

    // Load categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await articleAPI.getCategories();
                if (response.status && response.body) {
                    setCategories(response.body);
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };

        loadCategories();
    }, []);

    // Load articles by category
    useEffect(() => {
        if (!categorySlug) return;

        const loadByCategory = async () => {
            try {
                setLoading(true);
                setError(null);
                setCurrentCategory(categorySlug);
                const response = await articleAPI.getArticlesByCategory(categorySlug, { page, size: pageSize });
                if (response.status && response.body) {
                    setPageData(response.body);
                    setArticles(response.body.content || []);
                } else {
                    setError('Không thể tải bài viết theo danh mục');
                }
            } catch (err) {
                console.error('Failed to load articles by category:', err);
                setError('Lỗi khi tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        loadByCategory();
    }, [categorySlug, page, pageSize]);

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

    const currentCategoryName =
        categories.find((c) => c.slug === currentCategory)?.name || 'Danh mục';

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
            <Helmet>
                <title>{currentCategoryName} - CampusLife</title>
                <meta name="description" content={`Khám phá bài viết trong danh mục ${currentCategoryName}`} />
            </Helmet>

            <div>
                {/* Header */}
                <div className="mb-10 max-w-3xl">
                    <Link to="/articles" className="text-gray-400 font-extrabold tracking-widest text-[11px] uppercase hover:text-[#001C44] transition-colors mb-4 inline-flex items-center gap-1.5">
                        <span className="text-sm">←</span> Quay lại bài viết
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-4">{currentCategoryName}</h1>
                    <p className="text-lg text-gray-500 font-medium">
                        {articles.length} bài viết trong danh mục này
                    </p>
                </div>

                {/* Categories tabs */}
                {categories.length > 0 && (
                    <div className="mb-10 overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex gap-3">
                            <Link
                                to="/articles"
                                className={`px-5 py-2.5 rounded-2xl whitespace-nowrap font-extrabold transition-all text-sm shadow-sm ${
                                    !currentCategory
                                        ? 'bg-[#001C44] text-white hover:bg-blue-900 hover:shadow-md'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-100 hover:text-[#001C44] hover:bg-blue-50/50'
                                }`}
                            >
                                Tất cả
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/articles/category/${cat.slug}`}
                                    className={`px-5 py-2.5 rounded-2xl whitespace-nowrap font-extrabold transition-all text-sm shadow-sm ${
                                        currentCategory === cat.slug
                                            ? 'bg-[#0B5FFF] text-white hover:bg-blue-600 hover:shadow-md'
                                            : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-100 hover:text-[#001C44] hover:bg-blue-50/50'
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-10 rounded-3xl bg-red-50 p-6 text-red-600 border-0 shadow-inner-light font-medium">
                        {error}
                    </div>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium px-6">
                        <span className="text-5xl block mb-4">✨</span>
                        <h2 className="text-2xl font-extrabold text-[#001C44] mb-3">Chưa có bài viết trong danh mục này</h2>
                        <Link
                            to="/articles"
                            className="mt-6 inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md"
                        >
                            Xem tất cả bài viết →
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {articles.map((article) => {
                            const thumbUrl = getImageUrl(article.thumbnailUrl || undefined);
                            const isWished = isWishlisted(article.slug);

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
                                            disabled={wishlistToggles.has(article.slug)}
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

export default ArticlesByCategoryPage;

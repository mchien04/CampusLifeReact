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
                <div className="mb-6">
                    <Link to="/articles" className="text-[#0B5FFF] hover:underline text-sm mb-3 inline-block">
                        ← Quay lại bài viết
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#001C44] mb-1">{currentCategoryName}</h1>
                    <p className="text-lg text-gray-600">
                        {articles.length} bài viết trong danh mục này
                    </p>
                </div>

                {/* Categories tabs */}
                {categories.length > 0 && (
                    <div className="mb-8 overflow-x-auto pb-2">
                        <div className="flex gap-2">
                            <Link
                                to="/articles"
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-colors ${
                                    !currentCategory
                                        ? 'bg-[#001C44] text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Tất cả
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/articles/category/${cat.slug}`}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-colors ${
                                        currentCategory === cat.slug
                                            ? 'bg-[#0B5FFF] text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">Chưa có bài viết trong danh mục này</p>
                        <Link
                            to="/articles"
                            className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            Xem tất cả bài viết →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => {
                            const thumbUrl = getImageUrl(article.thumbnailUrl || undefined);
                            const isWished = isWishlisted(article.slug);

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
                                            disabled={wishlistToggles.has(article.slug)}
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

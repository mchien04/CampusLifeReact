import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { EventArticleDetailResponse } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ArticlesByCategoryPage: React.FC = () => {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<EventArticleDetailResponse[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentCategory, setCurrentCategory] = useState<string>('');
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [wishlistToggles, setWishlistToggles] = useState<Set<number>>(new Set());

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
                const response = await articleAPI.getArticlesByCategory(categorySlug);
                if (response.status && response.body) {
                    setArticles(response.body);
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
    }, [categorySlug]);

    const handleWishlistToggle = async (articleId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setWishlistToggles((prev) => new Set([...Array.from(prev), articleId]));
            await toggleWishlist(articleId);
        } finally {
            setWishlistToggles((prev) => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
        }
    };

    const currentCategoryName =
        categories.find((c) => c.slug === currentCategory)?.name || 'Danh mục';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF]">
            <Helmet>
                <title>{currentCategoryName} - CampusLife</title>
                <meta name="description" content={`Khám phá bài viết trong danh mục ${currentCategoryName}`} />
            </Helmet>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <Link to="/articles" className="text-[#0B5FFF] hover:underline text-sm mb-3 inline-block">
                        ← Quay lại bài viết
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-black text-[#001C44] mb-3">
                        📂 {currentCategoryName}
                    </h1>
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
                        <div className="text-5xl mb-4">📭</div>
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
                            const isWished = isWishlisted(article.id);
                            const isToggling = wishlistToggles.has(article.id);

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
                                            onClick={(e) => handleWishlistToggle(article.id, e)}
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
                )}
            </div>
        </div>
    );
};

export default ArticlesByCategoryPage;

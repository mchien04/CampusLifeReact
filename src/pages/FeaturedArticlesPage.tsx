import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { ArticleListResponse } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';

const FeaturedArticlesPage: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [wishlistToggles, setWishlistToggles] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadFeatured = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await articleAPI.getFeaturedArticles(12);
                if (response.status && response.body) {
                    setArticles(response.body);
                } else {
                    setError('Không thể tải bài viết nổi bật');
                }
            } catch (err) {
                console.error('Failed to load featured articles:', err);
                setError('Lỗi khi tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        loadFeatured();
    }, []);

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
            <Helmet>
                <title>Bài viết nổi bật - CampusLife</title>
                <meta name="description" content="Khám phá những bài viết nổi bật từ các sự kiện campus" />
            </Helmet>

            <div>
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#001C44] mb-1">Bài viết nổi bật</h1>
                    <p className="text-lg text-gray-600">
                        Những bài viết được chọn lọc từ các sự kiện hấp dẫn nhất
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">Chưa có bài viết nổi bật</p>
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

                                        {/* Featured badge */}
                                        <div className="absolute top-3 right-3 bg-[#FFD66D] text-[#001C44] px-3 py-1 rounded-full text-xs font-bold">
                                            Nổi bật
                                        </div>

                                        {/* Wishlist button */}
                                        <button
                                            onClick={(e) => handleWishlistToggle(article.slug, e)}
                                            disabled={isToggling}
                                            className="absolute top-3 left-3 text-2xl hover:scale-125 transition-transform"
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
        </ArticleLayout>
    );
};

export default FeaturedArticlesPage;

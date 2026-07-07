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
                <div className="mb-10 max-w-2xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#001C44] tracking-tight mb-4">Bài viết nổi bật</h1>
                    <p className="text-lg text-gray-500 font-medium">
                        Những bài viết được chọn lọc từ các sự kiện hấp dẫn nhất
                    </p>
                </div>

                {error && (
                    <div className="mb-10 rounded-2xl bg-red-50 p-5 text-red-700 border-0 shadow-inner-light">
                        {error}
                    </div>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-premium">
                        <span className="text-5xl block mb-4">✨</span>
                        <h2 className="text-2xl font-extrabold text-[#001C44] mt-3 mb-2">Chưa có bài viết nổi bật</h2>
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

                                        {/* Featured badge */}
                                        <div className="absolute top-4 right-4 z-10">
                                            <span className="inline-flex items-center rounded-full bg-[#FFD66D]/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-extrabold text-[#001C44] uppercase tracking-widest">
                                                Nổi bật
                                            </span>
                                        </div>

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
                )}
            </div>
        </ArticleLayout>
    );
};

export default FeaturedArticlesPage;

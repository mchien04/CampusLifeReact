import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { articleAPI } from '../services/articleAPI';
import { sanitizeArticleContent } from '../utils/sanitizeHtml';
import { downloadCalendarFile } from '../utils/calendarExport';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import type { ArticleListResponse, EventArticleDetailResponse } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleLayout from '../components/layout/ArticleLayout';
import RegistrationCTA from '../components/article/RegistrationCTA';
import ReactionBar from '../components/article/ReactionBar';
import CommentSection from '../components/article/CommentSection';
import ShareButton from '../components/article/ShareButton';
import '../components/article/article-components.css';


const ArticleDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const { isAuthenticated } = useAuth();
    const [article, setArticle] = useState<EventArticleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [wishlisting, setWishlisting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [relatedArticles, setRelatedArticles] = useState<ArticleListResponse[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) {
                setLoading(false);
                setNotFound(true);
                return;
            }

            setLoading(true);
            setNotFound(false);

            try {
                const response = await articleAPI.getArticleBySlug(slug);
                if (response.status && response.body) {
                    const data = response.body;

                    // Handle slug redirect (Phase 3)
                    if (data.redirectedFrom && data.currentSlug && data.currentSlug !== slug) {
                        navigate(`/articles/${data.currentSlug}`, { replace: true });
                        return;
                    }

                    setArticle(data);
                    // Track view (fire and forget)
                    articleAPI.trackArticleView(slug);
                } else {
                    setNotFound(true);
                }
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    setNotFound(true);
                } else {
                    setNotFound(true);
                }
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [slug, navigate]);

    useEffect(() => {
        const loadRelated = async () => {
            if (!slug) return;
            try {
                setLoadingRelated(true);
                const response = await articleAPI.getRelatedArticles(slug, { limit: 3 });
                if (response.status && response.body) {
                    setRelatedArticles(response.body);
                } else {
                    setRelatedArticles([]);
                }
            } catch {
                setRelatedArticles([]);
            } finally {
                setLoadingRelated(false);
            }
        };

        loadRelated();
    }, [slug]);

    const seoTitle = article?.seoTitle || article?.title || 'CampusLife';
    const seoDescription = article?.seoDescription || '';
    const sanitizedContent = useMemo(() => sanitizeArticleContent(article?.content || ''), [article?.content]);
    const thumbnailUrl = article ? getImageUrl(article.thumbnailUrl || undefined) : null;
    const coverImages = (article?.coverImages || []).map((img) => ({ ...img, imageUrl: getImageUrl(img.imageUrl) || img.imageUrl }));
    const galleryImages = (article?.images || []).map((img) => ({ ...img, imageUrl: getImageUrl(img.imageUrl) || img.imageUrl }));
    const heroImageUrl = coverImages[0]?.imageUrl || thumbnailUrl || null;

    const handleWishlistToggle = async () => {
        if (!article) return;
        try {
            setWishlisting(true);
            await toggleWishlist(article.slug);
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        } finally {
            setWishlisting(false);
        }
    };

    const handleExportCalendar = async () => {
        if (!article) return;
        try {
            setExporting(true);
            const blob = await articleAPI.getArticleCalendar(article.slug);
            downloadCalendarFile(blob, `${article.slug}.ics`);
        } catch (error) {
            console.error('Failed to export calendar:', error);
            toast.error('Không tải được file lịch (.ics)');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <ArticleLayout
                chatbotEnabled={true}
                chatbotPageContext="ARTICLE_DETAIL"
                chatbotContextArticleSlug={slug ?? null}
            >
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </ArticleLayout>
        );
    }

    if (notFound || !article) {
        return (
            <ArticleLayout
                chatbotEnabled={true}
                chatbotPageContext="ARTICLE_DETAIL"
                chatbotContextArticleSlug={slug ?? null}
            >
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h1 className="text-2xl font-bold text-[#001C44] mb-3">Không tìm thấy bài viết</h1>
                        <p className="text-gray-600 mb-6">Bài viết có thể chưa được xuất bản hoặc không tồn tại.</p>
                        <button
                            onClick={() => navigate('/articles')}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </ArticleLayout>
        );
    }

    return (
        <ArticleLayout
            chatbotEnabled={true}
            chatbotPageContext="ARTICLE_DETAIL"
            chatbotContextArticleSlug={slug ?? null}
        >
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
            </Helmet>

            <div className="mx-auto max-w-6xl w-full">
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <button onClick={() => navigate('/articles')} className="hover:text-[#001C44] transition-colors">
                        Bài viết
                    </button>
                    <span>/</span>
                    <span className="text-[#001C44] font-semibold truncate">{article.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <article className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm">
                        {heroImageUrl && (
                            <div className="bg-gray-100">
                                <img src={heroImageUrl} alt={article.title} className="w-full max-h-[460px] object-cover" />
                            </div>
                        )}

                        {coverImages.length > 1 && (
                            <div className="px-6 pt-4">
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {coverImages.map((img) => (
                                        <div key={img.id} className="shrink-0 w-28">
                                            <img src={img.imageUrl} alt={img.caption || article.title} className="w-28 h-20 object-cover rounded-lg border border-gray-200" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-6 py-8">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                                {article.publishedAt && (
                                    <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                                )}
                                <span>•</span>
                                <span>{article.viewCount.toLocaleString('vi-VN')} lượt xem</span>
                                {article.category?.name && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                                            {article.category.name}
                                        </span>
                                    </>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#001C44] mb-4">{article.title}</h1>

                            {article.seoDescription && (
                                <p className="text-lg text-gray-700 mb-8">{article.seoDescription}</p>
                            )}

                            {galleryImages.length > 0 && (
                                <div className="mb-10">
                                    <h2 className="text-lg font-bold text-[#001C44] mb-4">Hình ảnh</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {galleryImages.map((img) => (
                                            <figure key={img.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                                <img src={img.imageUrl} alt={img.caption || article.title} className="w-full h-56 object-cover" />
                                                {img.caption && (
                                                    <figcaption className="px-4 py-3 text-sm text-gray-600">{img.caption}</figcaption>
                                                )}
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-lg prose-slate max-w-none prose-headings:text-[#001C44] prose-a:text-[#0B5FFF] prose-img:rounded-2xl prose-img:shadow-lg prose-strong:text-[#001C44] prose-code:bg-gray-100 prose-code:text-red-600 prose-code:rounded-lg prose-code:px-2 prose-code:py-1">
                                <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                            </div>

                            {/* Reaction Bar */}
                            <ReactionBar
                                slug={article.slug}
                                initialMyReaction={article.myReaction}
                                isAuthenticated={isAuthenticated}
                            />

                            {/* Comment Section */}
                            <CommentSection
                                slug={article.slug}
                                isAuthenticated={isAuthenticated}
                                currentUserId={null}
                            />
                        </div>
                    </article>

                    <aside className="space-y-4">
                        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                            <div className="flex flex-col gap-3">
                                <RegistrationCTA
                                    activityInfo={article.activityInfo}
                                    registrationStatus={article.registrationStatus}
                                    slug={article.slug}
                                />

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleWishlistToggle}
                                        disabled={wishlisting}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all border ${(article.isWishlisted || isWishlisted(article.slug))
                                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                            } disabled:opacity-50`}
                                    >
                                        {(article.isWishlisted || isWishlisted(article.slug)) ? 'Đã lưu' : 'Lưu bài viết'}
                                    </button>

                                    <ShareButton slug={article.slug} title={article.title} />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExportCalendar}
                                    disabled={exporting}
                                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-[#FFD66D] text-[#001C44] font-semibold hover:bg-yellow-400 disabled:opacity-50"
                                >
                                    {exporting ? 'Đang tải...' : 'Thêm vào lịch (.ics)'}
                                </button>
                            </div>

                            {article.activityInfo && (
                                <div className="mt-5 pt-5 border-t border-gray-200 space-y-2 text-sm text-gray-700">
                                    <div className="font-semibold text-[#001C44]">Thông tin sự kiện</div>
                                    <div className="text-gray-800 font-medium">{article.activityInfo.name}</div>
                                    {article.activityInfo.location && <div className="text-gray-600">{article.activityInfo.location}</div>}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-[#001C44]">Bài viết liên quan</h3>
                                <button
                                    type="button"
                                    onClick={() => navigate('/articles')}
                                    className="text-sm font-semibold text-[#0B5FFF] hover:underline"
                                >
                                    Xem thêm
                                </button>
                            </div>

                            {loadingRelated ? (
                                <div className="text-sm text-gray-600">Đang tải...</div>
                            ) : relatedArticles.length === 0 ? (
                                <div className="text-sm text-gray-600">Chưa có bài viết liên quan</div>
                            ) : (
                                <div className="space-y-3">
                                    {relatedArticles.map((ra) => (
                                        <button
                                            key={ra.id}
                                            type="button"
                                            onClick={() => navigate(`/articles/${ra.slug}`)}
                                            className="w-full text-left rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-semibold text-[#001C44] line-clamp-2">{ra.title}</div>
                                            {ra.publishedAt && <div className="text-xs text-gray-500 mt-1">{new Date(ra.publishedAt).toLocaleDateString('vi-VN')}</div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </ArticleLayout>
    );
};

export default ArticleDetail;

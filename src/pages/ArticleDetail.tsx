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
import { studentAPI } from '../services/studentAPI';
import type { ArticleListResponse, EventArticleDetailResponse } from '../types/article';
import { Role } from '../types';
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
    const { isAuthenticated, userRole } = useAuth();
    const [article, setArticle] = useState<EventArticleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [wishlisting, setWishlisting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [relatedArticles, setRelatedArticles] = useState<ArticleListResponse[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (isAuthenticated && userRole === Role.STUDENT) {
                try {
                    const profile = await studentAPI.getMyProfile();
                    setCurrentUserProfile(profile);
                } catch (err) {
                    console.error('Failed to load profile:', err);
                }
            }
        };
        loadProfile();
    }, [isAuthenticated]);

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

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
                    <article className="overflow-hidden rounded-[2.5rem] bg-white shadow-premium border-0">
                        {/* Elegant Header Area (Medium Style) */}
                        <div className="px-8 pt-10 pb-6">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 mb-5">
                                {article.category?.name && (
                                    <span className="rounded-full bg-blue-50/50 text-[#0B5FFF] px-3.5 py-1.5 border border-blue-100/50">
                                        {article.category.name}
                                    </span>
                                )}
                                {article.publishedAt && (
                                    <span className="bg-gray-50 text-gray-500 px-3.5 py-1.5 rounded-full border border-gray-100">
                                        {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                <span className="bg-gray-50 text-gray-500 px-3.5 py-1.5 rounded-full border border-gray-100">
                                    {article.viewCount.toLocaleString('vi-VN')} lượt xem
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#001C44] mb-6 leading-[1.15] text-balance">
                                {article.title}
                            </h1>

                            {article.seoDescription && (
                                <p className="text-xl text-gray-500 font-medium leading-relaxed mb-6 border-l-4 border-[#FFD66D] pl-6 text-pretty">
                                    {article.seoDescription}
                                </p>
                            )}
                        </div>

                        {heroImageUrl && (
                            <div className="bg-gray-50">
                                <img src={heroImageUrl} alt={article.title} className="w-full max-h-[480px] object-cover" />
                            </div>
                        )}

                        {coverImages.length > 1 && (
                            <div className="px-8 pt-6">
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                    {coverImages.map((img) => (
                                        <div key={img.id} className="shrink-0 w-32">
                                            <img src={img.imageUrl} alt={img.caption || article.title} className="w-32 h-24 object-cover rounded-2xl shadow-sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-8 py-10">

                            {galleryImages.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-2xl font-extrabold text-[#001C44] mb-6 tracking-tight">Hình ảnh nổi bật</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {galleryImages.map((img) => (
                                            <figure key={img.id} className="rounded-3xl border-0 overflow-hidden bg-gray-50 shadow-inner-light group">
                                                <img src={img.imageUrl} alt={img.caption || article.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700 ease-out-expo" />
                                                {img.caption && (
                                                    <figcaption className="px-5 py-4 text-sm font-medium text-gray-500 bg-white">{img.caption}</figcaption>
                                                )}
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-lg prose-slate max-w-none prose-headings:text-[#001C44] prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-[#0B5FFF] prose-img:rounded-3xl prose-img:shadow-lg prose-strong:text-[#001C44] prose-strong:font-bold prose-code:bg-gray-50 prose-code:text-[#D92D20] prose-code:rounded-xl prose-code:px-2.5 prose-code:py-1">
                                <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                            </div>

                            {/* Reaction Bar */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <ReactionBar
                                    slug={article.slug}
                                    initialMyReaction={article.myReaction}
                                    isAuthenticated={isAuthenticated}
                                />
                            </div>

                            {/* Comment Section */}
                            <CommentSection
                                slug={article.slug}
                                isAuthenticated={isAuthenticated}
                                currentUserId={currentUserProfile?.id}
                                currentUserAvatarUrl={currentUserProfile?.avatarUrl}
                                currentUserFullName={currentUserProfile?.fullName}
                            />
                        </div>
                    </article>

                    <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
                        <div className="rounded-3xl bg-white shadow-premium p-6 border-0">
                            <div className="flex flex-col gap-4">
                                <RegistrationCTA
                                    activityInfo={article.activityInfo}
                                    registrationStatus={article.registrationStatus}
                                    slug={article.slug}
                                />

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleWishlistToggle}
                                        disabled={wishlisting}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold transition-all border-0 shadow-inner-light ${(article.isWishlisted || isWishlisted(article.slug))
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
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
                                    className="inline-flex items-center justify-center rounded-2xl px-5 py-4 bg-[#001C44] text-[#FFD66D] text-sm font-extrabold hover:bg-blue-900 transition-all shadow-md disabled:opacity-50"
                                >
                                    {exporting ? 'Đang tải...' : 'Thêm vào lịch (.ics)'}
                                </button>
                            </div>

                            {article.activityInfo && (
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Thông tin sự kiện</div>
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/10 rounded-xl border border-blue-100/50 p-4 space-y-2.5">
                                        <div className="text-sm font-bold text-[#001C44] leading-tight">{article.activityInfo.name}</div>
                                        {article.activityInfo.location && (
                                            <div className="flex items-start gap-2 text-xs text-gray-600">
                                                <span className="shrink-0 text-base">📍</span>
                                                <span>{article.activityInfo.location}</span>
                                            </div>
                                        )}
                                        {article.activityInfo.startDate && (
                                            <div className="flex items-start gap-2 text-xs text-gray-600">
                                                <span className="shrink-0 text-base">📅</span>
                                                <span className="leading-normal">
                                                    {new Date(article.activityInfo.startDate).toLocaleDateString('vi-VN')}
                                                    {article.activityInfo.endDate && ` - ${new Date(article.activityInfo.endDate).toLocaleDateString('vi-VN')}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>



                        <div className="rounded-3xl bg-white border-0 shadow-premium p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-extrabold text-[#001C44]">Bài viết liên quan</h3>
                                <button
                                    type="button"
                                    onClick={() => navigate('/articles')}
                                    className="text-sm font-bold text-[#0B5FFF] hover:underline"
                                >
                                    Xem thêm
                                </button>
                            </div>

                            {loadingRelated ? (
                                <div className="text-sm font-medium text-gray-400">Đang tải...</div>
                            ) : relatedArticles.length === 0 ? (
                                <div className="text-sm font-medium text-gray-400">Chưa có bài viết liên quan</div>
                            ) : (
                                <div className="space-y-3">
                                    {relatedArticles.map((ra) => (
                                        <button
                                            key={ra.id}
                                            type="button"
                                            onClick={() => navigate(`/articles/${ra.slug}`)}
                                            className="w-full text-left rounded-2xl border-0 bg-gray-50 p-4 hover:bg-gray-100 hover:-translate-y-0.5 transition-all shadow-inner-light"
                                        >
                                            <div className="font-extrabold text-[#001C44] line-clamp-2 leading-snug">{ra.title}</div>
                                            {ra.publishedAt && <div className="text-xs font-semibold text-gray-400 mt-2 tracking-wide uppercase">{new Date(ra.publishedAt).toLocaleDateString('vi-VN')}</div>}
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

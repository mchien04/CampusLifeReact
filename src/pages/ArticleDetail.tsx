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
                    // View count is incremented by GET /articles/{slug} — do not also call track-view
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
                <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate('/articles')}
                        className="font-semibold hover:text-[#001C44] transition-colors"
                    >
                        Bài viết
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-[#001C44] font-semibold truncate">{article.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10">
                    <article className="min-w-0">
                        <header className="mb-8">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {article.category?.name && (
                                    <span className="inline-flex rounded-lg bg-[#001C44]/5 px-2.5 py-1 text-xs font-bold text-[#001C44]">
                                        {article.category.name}
                                    </span>
                                )}
                                {article.publishedAt && (
                                    <time className="text-xs font-semibold text-slate-400">
                                        {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                    </time>
                                )}
                                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                                    {article.viewCount.toLocaleString('vi-VN')} lượt xem
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-[#001C44] leading-[1.15] text-balance mb-4">
                                {article.title}
                            </h1>

                            {article.seoDescription && (
                                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-[65ch]">
                                    {article.seoDescription}
                                </p>
                            )}

                            {article.tags && article.tags.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {article.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </header>

                        {heroImageUrl && (
                            <figure className="mb-8 -mx-0 overflow-hidden rounded-2xl bg-slate-100">
                                <img
                                    src={heroImageUrl}
                                    alt={article.title}
                                    className="w-full max-h-[480px] object-cover"
                                />
                            </figure>
                        )}

                        {coverImages.length > 1 && (
                            <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                                {coverImages.slice(1).map((img) => (
                                    <img
                                        key={img.id}
                                        src={img.imageUrl}
                                        alt={img.caption || article.title}
                                        className="h-24 w-36 shrink-0 rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 sm:px-8 py-8 sm:py-10">
                            {galleryImages.length > 0 && (
                                <div className="mb-10">
                                    <h2 className="text-xl font-extrabold text-[#001C44] mb-4 tracking-tight">
                                        Hình ảnh
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {galleryImages.map((img) => (
                                            <figure key={img.id} className="overflow-hidden rounded-xl bg-slate-50">
                                                <img
                                                    src={img.imageUrl}
                                                    alt={img.caption || article.title}
                                                    className="w-full h-56 object-cover"
                                                />
                                                {img.caption && (
                                                    <figcaption className="px-4 py-3 text-sm text-slate-500">
                                                        {img.caption}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preserve TipTap inline styles (font-size, color, …) */}
                            <div
                                className="article-body"
                                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                            />

                            <div className="mt-10 pt-6 border-t border-slate-100">
                                <ReactionBar
                                    slug={article.slug}
                                    initialMyReaction={article.myReaction}
                                    isAuthenticated={isAuthenticated}
                                />
                            </div>

                            <CommentSection
                                slug={article.slug}
                                isAuthenticated={isAuthenticated}
                                currentUserId={currentUserProfile?.id}
                                currentUserAvatarUrl={currentUserProfile?.avatarUrl}
                                currentUserFullName={currentUserProfile?.fullName}
                            />
                        </div>
                    </article>

                    <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
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
                                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                                        article.isWishlisted || isWishlisted(article.slug)
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    } disabled:opacity-50`}
                                >
                                    {article.isWishlisted || isWishlisted(article.slug) ? 'Đã lưu' : 'Lưu bài'}
                                </button>
                                <ShareButton slug={article.slug} title={article.title} />
                            </div>

                            {article.activityInfo && (
                                <button
                                    type="button"
                                    onClick={handleExportCalendar}
                                    disabled={exporting}
                                    className="w-full inline-flex items-center justify-center rounded-xl px-4 py-3 bg-[#001C44] text-[#FFD66D] text-sm font-bold hover:bg-[#002A66] transition-colors disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {exporting ? 'Đang tải...' : 'Thêm lịch ngoài (.ics)'}
                                </button>
                            )}

                            {article.activityInfo && (
                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="text-xs font-bold text-slate-400">Sự kiện liên kết</div>
                                    <div className="text-sm font-bold text-[#001C44] leading-snug">
                                        {article.activityInfo.name}
                                    </div>
                                    {article.activityInfo.location && (
                                        <div className="text-xs text-slate-500">{article.activityInfo.location}</div>
                                    )}
                                    {article.activityInfo.startDate && (
                                        <div className="text-xs text-slate-500">
                                            {new Date(article.activityInfo.startDate).toLocaleDateString('vi-VN')}
                                            {article.activityInfo.endDate &&
                                                ` - ${new Date(article.activityInfo.endDate).toLocaleDateString('vi-VN')}`}
                                        </div>
                                    )}
                                    {article.activityInfo.id && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/student/events/${article.activityInfo!.id}`)}
                                            className="text-xs font-bold text-[#0B5FFF] hover:underline"
                                        >
                                            Xem chi tiết sự kiện
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-extrabold text-[#001C44]">Liên quan</h3>
                                <button
                                    type="button"
                                    onClick={() => navigate('/articles')}
                                    className="text-xs font-bold text-slate-400 hover:text-[#001C44]"
                                >
                                    Tất cả
                                </button>
                            </div>

                            {loadingRelated ? (
                                <div className="text-sm text-slate-400">Đang tải...</div>
                            ) : relatedArticles.length === 0 ? (
                                <div className="text-sm text-slate-400">Chưa có bài liên quan</div>
                            ) : (
                                <ul className="space-y-2">
                                    {relatedArticles.map((ra) => (
                                        <li key={ra.id}>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/articles/${ra.slug}`)}
                                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="font-bold text-[#001C44] text-sm line-clamp-2 leading-snug">
                                                    {ra.title}
                                                </div>
                                                {ra.publishedAt && (
                                                    <div className="text-[11px] font-semibold text-slate-400 mt-1.5">
                                                        {new Date(ra.publishedAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </ArticleLayout>
    );
};

export default ArticleDetail;

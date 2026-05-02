import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articleAPI } from '../services/articleAPI';
import { sanitizeArticleContent } from '../utils/sanitizeHtml';
import { generateCalendarFile, downloadCalendarFile } from '../utils/calendarExport';
import { getImageUrl } from '../utils/imageUtils';
import { useWishlist } from '../contexts/WishlistContext';
import type { EventArticleDetailResponse, RegistrationCtaStatus } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StudentLayout from '../components/layout/StudentLayout';

const CTA_LABELS: Record<RegistrationCtaStatus, string> = {
    UPCOMING: 'Sắp mở đăng ký',
    OPEN: 'Đăng ký ngay',
    WAITLIST: 'Đăng ký danh sách chờ',
    FULL: 'Hết chỗ',
    CLOSED: 'Đã đóng đăng ký',
};

const ArticleDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const [article, setArticle] = useState<EventArticleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [wishlisting, setWishlisting] = useState(false);
    const [exporting, setExporting] = useState(false);

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
                    setArticle(response.body);
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
    }, [slug]);

    const seoTitle = article?.seoTitle || article?.title || 'CampusLife';
    const seoDescription = article?.seoDescription || '';
    const sanitizedContent = useMemo(() => sanitizeArticleContent(article?.content || ''), [article?.content]);
    const thumbnailUrl = article ? getImageUrl(article.thumbnailUrl || undefined) : null;
    const ctaLabel = (article?.registrationStatus && CTA_LABELS[article.registrationStatus as RegistrationCtaStatus]) || CTA_LABELS.CLOSED;

    const handleWishlistToggle = async () => {
        if (!article) return;
        try {
            setWishlisting(true);
            await toggleWishlist(article.id);
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        } finally {
            setWishlisting(false);
        }
    };

    const handleExportCalendar = () => {
        if (!article) return;
        try {
            setExporting(true);
            const { blob, filename } = generateCalendarFile(article);
            downloadCalendarFile(blob, filename);
        } catch (error) {
            console.error('Failed to export calendar:', error);
        } finally {
            setExporting(false);
        }
    };

    const handleCtaClick = () => {
        if (!article || article.registrationStatus !== 'OPEN') return;

        const link = article.registrationLink || '';
        if (/^https?:\/\//i.test(link)) {
            window.location.href = link;
            return;
        }
        if (link.startsWith('/')) {
            navigate(link);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (notFound || !article) {
        return (
            <StudentLayout>
                <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
                        <div className="text-5xl mb-4">📰</div>
                        <h1 className="text-2xl font-bold text-[#001C44] mb-3">Không tìm thấy bài viết</h1>
                        <p className="text-gray-600 mb-6">Bài viết bạn đang truy cập có thể chưa được xuất bản hoặc không tồn tại.</p>
                        <button
                            onClick={() => navigate('/articles')}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                        >
                            ← Quay lại danh sách
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] text-gray-900">
                <Helmet>
                    <title>{seoTitle}</title>
                    <meta name="description" content={seoDescription} />
                </Helmet>

                <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                        <button onClick={() => navigate('/articles')} className="hover:text-[#001C44] transition-colors">
                            📰 Bài viết
                        </button>
                        <span>/</span>
                        <span className="text-[#001C44] font-semibold truncate">{article.title}</span>
                    </div>

                    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)] border border-gray-100">
                        {/* Thumbnail */}
                        {thumbnailUrl && (
                            <div className="h-64 sm:h-96 w-full bg-cover bg-center" style={{ backgroundImage: `url(${thumbnailUrl})` }} />
                        )}

                        <div className="px-6 py-8 sm:px-10 sm:py-12">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="inline-flex items-center rounded-full bg-[#001C44] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                                    Event Article
                                </span>
                                {article.publishedAt && (
                                    <span className="text-sm text-gray-500">
                                        📅 {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                {article.viewCount !== undefined && (
                                    <span className="text-sm text-gray-500">
                                        👁️ {article.viewCount.toLocaleString('vi-VN')} lượt xem
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-black tracking-tight text-[#001C44] sm:text-4xl mb-6">{article.title}</h1>

                            {/* Description */}
                            {article.seoDescription && (
                                <p className="text-lg text-gray-600 mb-8 pb-6 border-b border-gray-200">{article.seoDescription}</p>
                            )}

                            {/* CTA Buttons */}
                            <div className="flex flex-col gap-3 sm:gap-4 mb-8 pb-8 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                                    {/* Main CTA Button */}
                                    <button
                                        type="button"
                                        disabled={article.registrationStatus !== 'OPEN'}
                                        onClick={handleCtaClick}
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all shadow-md ${article.registrationStatus === 'OPEN'
                                            ? 'bg-[#001C44] text-white hover:bg-[#002A66] hover:shadow-lg hover:-translate-y-0.5'
                                            : article.registrationStatus === 'CLOSED'
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                            }`}
                                    >
                                        <span className="text-lg">
                                            {article.registrationStatus === 'OPEN' ? '📝' : article.registrationStatus === 'CLOSED' ? '🚫' : '⏳'}
                                        </span>
                                        {ctaLabel}
                                    </button>

                                    {/* Wishlist Button */}
                                    <button
                                        type="button"
                                        onClick={handleWishlistToggle}
                                        disabled={wishlisting}
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all shadow-md ${
                                            isWishlisted(article.id)
                                                ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                                                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                                        } disabled:opacity-50`}
                                        title={isWishlisted(article.id) ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                                    >
                                        <span className="text-lg">{isWishlisted(article.id) ? '❤️' : '🤍'}</span>
                                        {isWishlisted(article.id) ? 'Đã lưu' : 'Lưu bài viết'}
                                    </button>

                                    {/* Calendar Button */}
                                    <button
                                        type="button"
                                        onClick={handleExportCalendar}
                                        disabled={exporting}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 bg-[#FFD66D] text-[#001C44] font-semibold hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                                        title="Thêm vào lịch"
                                    >
                                        <span className="text-lg">📅</span>
                                        {exporting ? 'Đang xử lý...' : 'Thêm vào lịch'}
                                    </button>
                                </div>

                                {/* Registration Link */}
                                {article.registrationStatus === 'OPEN' && article.registrationLink && (
                                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                        Link đăng ký: <span className="font-mono break-all">{article.registrationLink}</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="prose prose-lg prose-slate max-w-none prose-headings:text-[#001C44] prose-a:text-[#0B5FFF] prose-img:rounded-2xl prose-img:shadow-lg prose-strong:text-[#001C44] prose-code:bg-gray-100 prose-code:text-red-600 prose-code:rounded-lg prose-code:px-2 prose-code:py-1">
                                <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                            </div>
                        </div>
                    </article>

                    {/* Related Articles or Footer */}
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => navigate('/articles')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-all shadow-md"
                        >
                            ← Quay lại danh sách bài viết
                        </button>
                    </div>
                </main>
            </div>
        </StudentLayout>
    );
};

export default ArticleDetail;
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { articleAPI } from '../services/articleAPI';
import { getImageUrl } from '../utils/imageUtils';
import type { EventArticleDetailResponse, RegistrationCtaStatus } from '../types/article';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CTA_LABELS: Record<RegistrationCtaStatus, string> = {
    UPCOMING: 'Sắp mở đăng ký',
    OPEN: 'Đăng ký ngay',
    FULL: 'Hết chỗ',
    CLOSED: 'Đã đóng đăng ký',
};

const ArticleDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<EventArticleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

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
    const sanitizedContent = useMemo(() => DOMPurify.sanitize(article?.content || ''), [article?.content]);
    const thumbnailUrl = article ? getImageUrl(article.thumbnailUrl || undefined) : null;

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
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (notFound || !article) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
                    <div className="text-5xl mb-4">📰</div>
                    <h1 className="text-2xl font-bold text-[#001C44] mb-3">Không tìm thấy bài viết</h1>
                    <p className="text-gray-600 mb-6">Bài viết bạn đang truy cập có thể chưa được xuất bản hoặc không tồn tại.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] text-gray-900">
            <Helmet>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
            </Helmet>

            <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <article className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)] border border-gray-100">
                    {thumbnailUrl && (
                        <div className="h-64 sm:h-96 w-full bg-cover bg-center" style={{ backgroundImage: `url(${thumbnailUrl})` }} />
                    )}

                    <div className="px-6 py-8 sm:px-10 sm:py-12">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-flex items-center rounded-full bg-[#001C44] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                                Event Article
                            </span>
                            {article.publishedAt && (
                                <span className="text-sm text-gray-500">
                                    Cập nhật: {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-[#001C44] sm:text-5xl">{article.title}</h1>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                disabled={article.registrationStatus !== 'OPEN'}
                                onClick={handleCtaClick}
                                className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold shadow-lg transition-all ${article.registrationStatus === 'OPEN'
                                    ? 'bg-[#001C44] text-white hover:bg-[#002A66] hover:-translate-y-0.5'
                                    : 'cursor-not-allowed bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {CTA_LABELS[article.registrationStatus]}
                            </button>
                            {article.registrationStatus === 'OPEN' && article.registrationLink && (
                                <span className="text-sm text-gray-500 break-all">{article.registrationLink}</span>
                            )}
                        </div>

                        <div className="prose prose-lg prose-slate mt-10 max-w-none prose-headings:text-[#001C44] prose-a:text-[#0B5FFF] prose-img:rounded-2xl prose-img:shadow-lg">
                            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
};

export default ArticleDetail;
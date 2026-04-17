import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articleAPI } from '../../services/articleAPI';
import type { EventArticleAdminResponse, EventArticleUpsertRequest } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RichHtmlEditor from '../../components/article/RichHtmlEditor';

const slugify = (value: string): string => {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const ArticleEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const activityId = Number(id);

    const [article, setArticle] = useState<EventArticleAdminResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [form, setForm] = useState<EventArticleUpsertRequest>({
        title: '',
        slug: '',
        thumbnailUrl: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
        activityId: Number.isFinite(activityId) ? activityId : undefined,
    });

    useEffect(() => {
        const loadArticle = async () => {
            if (!Number.isFinite(activityId)) {
                setError('Activity ID không hợp lệ');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            setNotFound(false);

            try {
                const response = await articleAPI.getArticleByActivityId(activityId);
                if (response.status && response.body) {
                    setArticle(response.body);
                    setForm({
                        activityId: response.body.activityId,
                        title: response.body.title,
                        slug: response.body.slug,
                        thumbnailUrl: response.body.thumbnailUrl || '',
                        content: response.body.content,
                        seoTitle: response.body.seoTitle || '',
                        seoDescription: response.body.seoDescription || '',
                    });
                } else {
                    setNotFound(true);
                }
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    setNotFound(true);
                } else {
                    setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải bài viết');
                }
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [activityId]);

    const updateField = (field: keyof EventArticleUpsertRequest, value: string | number | undefined | null) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleGenerateSlug = () => {
        const nextSlug = slugify(form.title || '');
        updateField('slug', nextSlug);
    };

    const handleSave = async () => {
        if (!Number.isFinite(activityId)) return;
        if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
            setError('Vui lòng nhập đủ title, slug và content');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload: EventArticleUpsertRequest = {
                ...form,
                activityId: article?.activityId ?? activityId,
                thumbnailUrl: form.thumbnailUrl || null,
                seoTitle: form.seoTitle || null,
                seoDescription: form.seoDescription || null,
            };

            const response = article
                ? await articleAPI.updateArticle(article.id, payload)
                : await articleAPI.createArticle(payload);

            if (response.status && response.body) {
                setArticle(response.body);
                setNotFound(false);
                setForm({
                    activityId: response.body.activityId,
                    title: response.body.title,
                    slug: response.body.slug,
                    thumbnailUrl: response.body.thumbnailUrl || '',
                    content: response.body.content,
                    seoTitle: response.body.seoTitle || '',
                    seoDescription: response.body.seoDescription || '',
                });
            } else {
                setError(response.message || 'Không thể lưu bài viết');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể lưu bài viết');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishToggle = async () => {
        if (!article) return;

        setPublishing(true);
        setError('');

        try {
            const response = article.published
                ? await articleAPI.unpublishArticle(article.id)
                : await articleAPI.publishArticle(article.id);

            if (response.status && response.body) {
                setArticle(response.body);
                setForm({
                    activityId: response.body.activityId,
                    title: response.body.title,
                    slug: response.body.slug,
                    thumbnailUrl: response.body.thumbnailUrl || '',
                    content: response.body.content,
                    seoTitle: response.body.seoTitle || '',
                    seoDescription: response.body.seoDescription || '',
                });
            } else {
                setError(response.message || 'Không thể cập nhật trạng thái xuất bản');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái xuất bản');
        } finally {
            setPublishing(false);
        }
    };

    const handlePreview = () => {
        if (!form.slug.trim()) return;
        const url = `${window.location.origin}/articles/${encodeURIComponent(form.slug.trim())}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Admin Article Editor</h1>
                    <p className="text-gray-600 mt-2">Activity ID: {activityId}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Preview public link
                    </button>
                    {article && (
                        <button
                            type="button"
                            onClick={handlePublishToggle}
                            disabled={publishing}
                            className={`px-4 py-2 rounded-lg text-white transition-colors ${article.published ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-60`}
                        >
                            {publishing ? 'Đang xử lý...' : article.published ? 'Unpublish' : 'Publish'}
                        </button>
                    )}
                    <Link
                        to={`/manager/events/${activityId}`}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Quay lại activity
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {notFound && !article && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8">
                    <h2 className="text-xl font-semibold text-[#001C44] mb-2">Chưa có bài viết</h2>
                    <p className="text-gray-600 mb-4">Activity này chưa có bài viết quảng bá. Bạn có thể tạo mới ngay bên dưới.</p>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                        <span className="block text-sm font-medium text-gray-700">Title</span>
                        <input
                            value={form.title || ''}
                            onChange={(event) => updateField('title', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                            placeholder="Workshop React 2026"
                        />
                    </label>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="block text-sm font-medium text-gray-700">Slug</span>
                            <button
                                type="button"
                                onClick={handleGenerateSlug}
                                className="text-xs font-semibold text-[#001C44] hover:text-[#002A66]"
                            >
                                Tạo từ title
                            </button>
                        </div>
                        <input
                            value={form.slug || ''}
                            onChange={(event) => updateField('slug', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                            placeholder="workshop-react-2026"
                        />
                    </div>
                </div>

                <label className="space-y-2 block">
                    <span className="block text-sm font-medium text-gray-700">Thumbnail URL</span>
                    <input
                        value={form.thumbnailUrl || ''}
                        onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        placeholder="https://... or /uploads/..."
                    />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2 block">
                        <span className="block text-sm font-medium text-gray-700">SEO Title</span>
                        <input
                            value={form.seoTitle || ''}
                            onChange={(event) => updateField('seoTitle', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </label>
                    <label className="space-y-2 block">
                        <span className="block text-sm font-medium text-gray-700">SEO Description</span>
                        <input
                            value={form.seoDescription || ''}
                            onChange={(event) => updateField('seoDescription', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </label>
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="block text-sm font-medium text-gray-700">Content HTML</span>
                        <span className="text-xs text-gray-500">Sử dụng Visual/HTML/Split để biên tập nhanh</span>
                    </div>
                    <RichHtmlEditor
                        value={form.content || ''}
                        onChange={(nextValue) => updateField('content', nextValue)}
                        placeholder="Nhập nội dung landing page bằng visual editor hoặc HTML source"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Độ dài title</div>
                        <div className="text-lg font-semibold text-[#001C44]">{(form.title || '').length}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Độ dài SEO description</div>
                        <div className="text-lg font-semibold text-[#001C44]">{(form.seoDescription || '').length}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Trạng thái</div>
                        <div className={`text-lg font-semibold ${article?.published ? 'text-green-700' : 'text-yellow-700'}`}>
                            {article ? (article.published ? 'Published' : 'Draft') : 'Draft mới'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-3 rounded-lg bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors disabled:opacity-60"
                    >
                        {saving ? 'Đang lưu...' : article ? 'Save changes' : 'Save new article'}
                    </button>
                    <span className="text-sm font-medium text-gray-500">{article ? 'Chế độ cập nhật' : 'Chế độ tạo mới'}</span>
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;
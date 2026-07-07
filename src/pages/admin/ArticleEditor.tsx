import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articleAPI } from '../../services/articleAPI';
import { uploadAPI } from '../../services/uploadAPI';
import type { ArticleCategoryResponse, ArticleImageResponse, ArticleTagResponse, EventArticleAdminResponse, EventArticleUpsertRequest } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RichTextEditorTipTap from '../../components/article/RichTextEditorTipTap';
import { compressImage } from '../../utils/compressImage';
import { getImageUrl } from '../../utils/imageUtils';

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
    const [categories, setCategories] = useState<ArticleCategoryResponse[]>([]);
    const [tags, setTags] = useState<ArticleTagResponse[]>([]);
    const [tagIdsInitialized, setTagIdsInitialized] = useState(false);
    const [galleryImages, setGalleryImages] = useState<ArticleImageResponse[]>([]);
    const [addingImage, setAddingImage] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [imageForm, setImageForm] = useState({ imageUrl: '', caption: '', displayOrder: 0, isCover: false });
    const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const [form, setForm] = useState<EventArticleUpsertRequest>({
        title: '',
        slug: '',
        thumbnailUrl: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
        activityId: Number.isFinite(activityId) ? activityId : undefined,
        categoryId: null,
        tagIds: [],
        isFeatured: false,
        isPinned: false,
        priority: 0,
        articleType: 'ANNOUNCEMENT',
        isPrimary: false,
    });

    useEffect(() => {
        const loadTaxonomy = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    articleAPI.getAdminCategories(),
                    articleAPI.getAdminTags(),
                ]);
                if (catRes.status && catRes.body) setCategories(catRes.body);
                if (tagRes.status && tagRes.body) setTags(tagRes.body);
            } catch {
                setCategories([]);
                setTags([]);
            }
        };

        loadTaxonomy();
    }, []);

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
                    setTagIdsInitialized(false);
                    setForm({
                        activityId: response.body.activityId ?? undefined,
                        title: response.body.title,
                        slug: response.body.slug,
                        thumbnailUrl: response.body.thumbnailUrl || '',
                        content: response.body.content,
                        seoTitle: response.body.seoTitle || '',
                        seoDescription: response.body.seoDescription || '',
                        categoryId: response.body.categoryId ?? null,
                        tagIds: [],
                        isFeatured: Boolean(response.body.featured),
                        isPinned: Boolean(response.body.pinned),
                        priority: response.body.priority ?? 0,
                        articleType: response.body.articleType || 'ANNOUNCEMENT',
                        isPrimary: response.body.isPrimary || false,
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

    useEffect(() => {
        if (!article) return;
        if (tagIdsInitialized) return;
        if (tags.length === 0) return;
        const tagNames = article.tagNames || [];
        if (tagNames.length === 0) {
            setTagIdsInitialized(true);
            return;
        }
        const matched = tags.filter((t) => tagNames.includes(t.name)).map((t) => t.id);
        setForm((prev) => ({ ...prev, tagIds: matched }));
        setTagIdsInitialized(true);
    }, [article, tags, tagIdsInitialized]);

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
                activityId: article?.activityId ?? activityId ?? undefined,
                thumbnailUrl: form.thumbnailUrl || null,
                seoTitle: form.seoTitle || null,
                seoDescription: form.seoDescription || null,
            };

            const canUpdate = article && Number.isFinite(article.id);

            const response = canUpdate
                ? await articleAPI.updateArticle(article.id, payload)
                : await articleAPI.createArticle(payload);

            if (response.status && response.body) {
                setArticle(response.body);
                setNotFound(false);
                setTagIdsInitialized(false);
                setForm({
                    activityId: response.body.activityId ?? undefined,
                    title: response.body.title,
                    slug: response.body.slug,
                    thumbnailUrl: response.body.thumbnailUrl || '',
                    content: response.body.content,
                    seoTitle: response.body.seoTitle || '',
                    seoDescription: response.body.seoDescription || '',
                    categoryId: response.body.categoryId ?? null,
                    tagIds: form.tagIds ?? [],
                    isFeatured: Boolean(response.body.featured),
                    isPinned: Boolean(response.body.pinned),
                    priority: response.body.priority ?? 0,
                    articleType: response.body.articleType || 'ANNOUNCEMENT',
                    isPrimary: response.body.isPrimary || false,
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
                    activityId: response.body.activityId ?? undefined,
                    title: response.body.title,
                    slug: response.body.slug,
                    thumbnailUrl: response.body.thumbnailUrl || '',
                    content: response.body.content,
                    seoTitle: response.body.seoTitle || '',
                    seoDescription: response.body.seoDescription || '',
                    categoryId: response.body.categoryId ?? null,
                    tagIds: form.tagIds ?? [],
                    isFeatured: Boolean(response.body.featured),
                    isPinned: Boolean(response.body.pinned),
                    priority: response.body.priority ?? 0,
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
        if (!form.slug?.trim()) {
            alert('Vui lòng tạo đường dẫn (slug) trước khi xem thử');
            return;
        }
        const url = `${window.location.origin}/articles/${encodeURIComponent(form.slug.trim())}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handlePickThumbnail = () => {
        thumbnailInputRef.current?.click();
    };

    const handleThumbnailSelected = async (file: File) => {
        try {
            setUploadingThumbnail(true);
            const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
            const response = await uploadAPI.uploadImage(compressed);
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Upload failed');
            }
            updateField('thumbnailUrl', response.data);
        } catch (err: any) {
            setError(err?.message || 'Không upload được thumbnail');
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const handlePickGalleryFiles = () => {
        galleryInputRef.current?.click();
    };

    const handleGallerySelected = async (files: FileList) => {
        if (!article) return;
        try {
            setUploadingGallery(true);
            const fileArr = Array.from(files);
            for (let idx = 0; idx < fileArr.length; idx++) {
                const file = fileArr[idx];
                const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.82 });
                const uploadRes = await uploadAPI.uploadImage(compressed);
                if (!uploadRes.status || !uploadRes.data) {
                    throw new Error('Upload failed');
                }
                
                const response = await articleAPI.addArticleImage(article.id, {
                    imageUrl: uploadRes.data,
                    caption: null,
                    displayOrder: (galleryImages.length || 0) + idx,
                    isCover: false,
                });
                if (response.status && response.body) {
                    setGalleryImages((prev) => [...prev, response.body!]);
                }
            }
        } catch (err: any) {
            setError(err?.message || 'Không upload được ảnh gallery');
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleAddImage = async () => {
        if (!article) return;
        if (!imageForm.imageUrl.trim()) return;
        try {
            setAddingImage(true);
            const response = await articleAPI.addArticleImage(article.id, {
                imageUrl: imageForm.imageUrl.trim(),
                caption: imageForm.caption.trim() ? imageForm.caption.trim() : null,
                displayOrder: Number.isFinite(imageForm.displayOrder) ? imageForm.displayOrder : 0,
                isCover: Boolean(imageForm.isCover),
            });
            if (response.status && response.body) {
                setGalleryImages((prev) => [...prev, response.body!]);
                setImageForm({ imageUrl: '', caption: '', displayOrder: 0, isCover: false });
            } else {
                setError(response.message || 'Không thể thêm ảnh');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể thêm ảnh');
        } finally {
            setAddingImage(false);
        }
    };

    const handleRemoveImage = async (imageId: number) => {
        if (!article) return;
        try {
            const response = await articleAPI.removeArticleImage(article.id, imageId);
            if (response.status) {
                setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
            } else {
                setError(response.message || 'Không thể xóa ảnh');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể xóa ảnh');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white rounded-3xl shadow-premium p-8 border-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0B5FFF]/10 to-[#FFD66D]/10 blur-3xl mix-blend-screen pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#001C44]">📝 Soạn thảo Bài viết</h1>
                    <p className="text-gray-500 font-semibold mt-2 flex items-center gap-2">
                        Activity ID: <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-[#001C44]">{activityId}</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gray-100 text-[#001C44] font-extrabold hover:bg-gray-200 transition-all active:scale-95 text-sm"
                    >
                        👁️ Xem thử
                    </button>
                    {article && (
                        <button
                            type="button"
                            onClick={handlePublishToggle}
                            disabled={publishing}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-extrabold transition-all active:scale-95 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 ${article.published ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} disabled:opacity-60 disabled:transform-none`}
                        >
                            {publishing ? 'Đang xử lý...' : article.published ? 'Gỡ bài' : 'Xuất bản'}
                        </button>
                    )}
                    <Link
                        to={`/manager/events/${activityId}`}
                        className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-[#FFD66D] text-[#001C44] font-extrabold hover:bg-yellow-400 transition-all active:scale-95 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 text-center"
                    >
                        🔙 Quay lại
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {notFound && !article && (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center flex flex-col items-center justify-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h2 className="text-2xl font-extrabold text-[#001C44] mb-2">Chưa có bài viết</h2>
                    <p className="text-gray-500 font-medium">Activity này chưa có bài viết quảng bá. Vui lòng tạo mới ngay bên dưới.</p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-premium border-0 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="space-y-2 block">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">Tiêu đề (Title)</span>
                        <input
                            value={form.title || ''}
                            onChange={(event) => updateField('title', event.target.value)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                            placeholder="Nhập tiêu đề bài viết..."
                        />
                    </label>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">Đường dẫn (Slug)</span>
                            <button
                                type="button"
                                onClick={handleGenerateSlug}
                                className="text-xs font-extrabold text-[#001C44] hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                                🔄 Tự động
                            </button>
                        </div>
                        <input
                            value={form.slug || ''}
                            onChange={(event) => updateField('slug', event.target.value)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                            placeholder="duong-dan-bai-viet"
                        />
                    </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 space-y-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200/50 pb-4">
                        <div>
                            <div className="text-lg font-extrabold text-[#001C44]">Ảnh đại diện (Thumbnail)</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Chọn ảnh từ máy hoặc nhập URL trực tiếp</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleThumbnailSelected(file);
                                    e.currentTarget.value = '';
                                }}
                            />
                            <button
                                type="button"
                                onClick={handlePickThumbnail}
                                disabled={uploadingThumbnail}
                                className="px-6 py-2.5 rounded-2xl bg-[#001C44] text-white font-extrabold hover:bg-blue-900 disabled:opacity-60 transition-all active:scale-95 shadow-md text-sm"
                            >
                                {uploadingThumbnail ? 'Đang upload...' : '📤 Tải ảnh lên'}
                            </button>
                        </div>
                    </div>

                    {form.thumbnailUrl ? (
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
                            <img
                                src={getImageUrl(form.thumbnailUrl) || form.thumbnailUrl}
                                alt="thumbnail"
                                className="w-full h-48 object-cover rounded-2xl shadow-md bg-white"
                            />
                            <div className="space-y-2 w-full">
                                <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">Thumbnail URL</div>
                                <input
                                    value={form.thumbnailUrl || ''}
                                    onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                                    className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">Thumbnail URL</div>
                            <input
                                value={form.thumbnailUrl || ''}
                                onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                                className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white"
                                placeholder="https://... hoặc /uploads/..."
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">Danh mục</span>
                        <select
                            value={form.categoryId ?? ''}
                            onChange={(e) => updateField('categoryId', e.target.value ? Number(e.target.value) : null)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white cursor-pointer"
                        >
                            <option value="">Không chọn</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">Loại bài viết</span>
                        <select
                            value={form.articleType || 'ANNOUNCEMENT'}
                            onChange={(e) => updateField('articleType', e.target.value)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white cursor-pointer"
                        >
                            <option value="ANNOUNCEMENT">Thông báo</option>
                            <option value="RECAP">Tổng kết</option>
                            <option value="BEHIND_SCENE">Hậu trường</option>
                            <option value="RESULT">Kết quả</option>
                            <option value="UPDATE">Cập nhật</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">Tags</span>
                        <select
                            multiple
                            value={(form.tagIds ?? []).map(String)}
                            onChange={(e) => {
                                const next = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                                setForm((prev) => ({ ...prev, tagIds: next }));
                            }}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white min-h-[52px]"
                        >
                            {tags.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <div className="text-[11px] font-bold text-gray-400">Giữ Ctrl (Windows) / Cmd (Mac) để chọn nhiều</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                    <label className="flex items-center justify-center gap-2.5 text-sm font-extrabold text-[#001C44] h-[48px] cursor-pointer hover:bg-white rounded-xl transition-colors">
                        <input
                            type="checkbox"
                            checked={Boolean(form.isFeatured)}
                            onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        🌟 Nổi bật
                    </label>
                    <label className="flex items-center justify-center gap-2.5 text-sm font-extrabold text-[#001C44] h-[48px] cursor-pointer hover:bg-white rounded-xl transition-colors">
                        <input
                            type="checkbox"
                            checked={Boolean(form.isPinned)}
                            onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        📌 Ghim
                    </label>
                    <label className="flex items-center justify-center gap-2.5 text-sm font-extrabold text-[#001C44] h-[48px] cursor-pointer hover:bg-white rounded-xl transition-colors">
                        <input
                            type="checkbox"
                            checked={Boolean(form.isPrimary)}
                            onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        🏆 Đại diện
                    </label>
                    <div className="space-y-1.5 w-full">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase px-2">Độ ưu tiên (Priority)</span>
                        <input
                            type="number"
                            value={Number(form.priority ?? 0)}
                            onChange={(e) => updateField('priority', Number(e.target.value))}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-2 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white text-center"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="space-y-2 block">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">SEO Title</span>
                        <input
                            value={form.seoTitle || ''}
                            onChange={(event) => updateField('seoTitle', event.target.value)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                            placeholder="Tiêu đề hiển thị trên Google"
                        />
                    </label>
                    <label className="space-y-2 block">
                        <span className="block text-xs font-bold tracking-wide text-gray-500 uppercase">SEO Description</span>
                        <input
                            value={form.seoDescription || ''}
                            onChange={(event) => updateField('seoDescription', event.target.value)}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                            placeholder="Đoạn mô tả ngắn hiển thị trên Google"
                        />
                    </label>
                </div>

                {article && (
                    <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 space-y-6">
                        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200/50 pb-4">
                            <div>
                                <div className="text-lg font-extrabold text-[#001C44]">Hình ảnh bổ sung (Gallery)</div>
                                <div className="text-sm font-medium text-gray-500 mt-1">Thêm ảnh vào bộ sưu tập của bài viết này</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            void handleGallerySelected(e.target.files);
                                        }
                                        e.currentTarget.value = '';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handlePickGalleryFiles}
                                    disabled={uploadingGallery}
                                    className="px-6 py-2.5 rounded-2xl bg-white text-[#001C44] border border-gray-200 font-extrabold hover:bg-gray-50 disabled:opacity-60 transition-all active:scale-95 shadow-sm text-sm"
                                >
                                    {uploadingGallery ? 'Đang tải lên...' : '📤 Tải nhiều ảnh'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <input
                                value={imageForm.imageUrl}
                                onChange={(e) => setImageForm((p) => ({ ...p, imageUrl: e.target.value }))}
                                className="md:col-span-5 w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white"
                                placeholder="Dán URL ảnh vào đây..."
                            />
                            <input
                                value={imageForm.caption}
                                onChange={(e) => setImageForm((p) => ({ ...p, caption: e.target.value }))}
                                className="md:col-span-4 w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white"
                                placeholder="Chú thích (caption)"
                            />
                            <input
                                type="number"
                                value={imageForm.displayOrder}
                                onChange={(e) => setImageForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                                className="md:col-span-3 w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold bg-white text-center"
                                placeholder="Order"
                            />
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-2.5 text-sm font-extrabold text-[#001C44] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={imageForm.isCover}
                                    onChange={(e) => setImageForm((p) => ({ ...p, isCover: e.target.checked }))}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                Đặt làm cover
                            </label>
                            <button
                                type="button"
                                disabled={addingImage || !imageForm.imageUrl.trim()}
                                onClick={handleAddImage}
                                className="px-6 py-2.5 rounded-2xl bg-[#FFD66D] text-[#001C44] font-extrabold hover:bg-yellow-400 disabled:opacity-60 transition-all active:scale-95 shadow-md text-sm"
                            >
                                {addingImage ? 'Đang lưu...' : '➕ Thêm URL'}
                            </button>
                        </div>

                        {galleryImages.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200/50">
                                {galleryImages.map((img) => (
                                    <div key={img.id} className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden group">
                                        <div className="relative">
                                            <img src={img.imageUrl} alt={img.caption || 'image'} className="w-full h-40 object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(img.id)}
                                                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-extrabold text-sm hover:bg-red-600 transform hover:scale-105 transition-all"
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-sm font-bold text-[#001C44] truncate">{img.caption || 'Chưa có chú thích'}</div>
                                            <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
                                                <span>Thứ tự: {img.displayOrder}</span>
                                                {img.isCover && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Cover</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="block text-xl font-extrabold text-[#001C44]">Nội dung bài viết (Content)</span>
                    </div>
                    <RichTextEditorTipTap
                        value={form.content || ''}
                        onChange={(nextValue) => updateField('content', nextValue)}
                        placeholder="Nhập nội dung chi tiết bài viết..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5 flex flex-col justify-between">
                        <div className="text-xs font-bold tracking-wide text-blue-500 uppercase mb-2">Độ dài tiêu đề</div>
                        <div className="text-3xl font-extrabold text-[#001C44]">{(form.title || '').length}</div>
                    </div>
                    <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-5 flex flex-col justify-between">
                        <div className="text-xs font-bold tracking-wide text-amber-600 uppercase mb-2">Độ dài mô tả SEO</div>
                        <div className="text-3xl font-extrabold text-[#001C44]">{(form.seoDescription || '').length}</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5 flex flex-col justify-between">
                        <div className="text-xs font-bold tracking-wide text-emerald-600 uppercase mb-2">Trạng thái</div>
                        <div className={`text-2xl font-extrabold ${article?.published ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {article ? (article.published ? '✅ Đã xuất bản' : '📝 Đang nháp') : '✨ Mới'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-4 pt-6 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-400 mr-auto">{article ? 'Đang trong chế độ CHỈNH SỬA' : 'Đang trong chế độ TẠO MỚI'}</span>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-4 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 disabled:opacity-60 disabled:transform-none text-base"
                    >
                        {saving ? 'Đang lưu...' : article ? '💾 Lưu thay đổi' : '💾 Khởi tạo bài viết'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;

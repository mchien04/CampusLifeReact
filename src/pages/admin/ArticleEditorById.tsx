import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleCategoryResponse, ArticleImageResponse, ArticleTagResponse, EventArticleAdminResponse, EventArticleUpsertRequest } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RichTextEditorTipTap from '../../components/article/RichTextEditorTipTap';
import { uploadAPI } from '../../services/uploadAPI';
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

const ArticleEditorById: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const id = Number(articleId);
    const location = useLocation();
    const base = location.pathname.startsWith('/manager') ? '/manager' : '/admin';

    const [article, setArticle] = useState<EventArticleAdminResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');

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
        activityId: undefined,
        title: '',
        slug: '',
        thumbnailUrl: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
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
            if (!Number.isFinite(id)) {
                setError('Article ID không hợp lệ');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = await articleAPI.getArticleById(id);
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
                    setError(response.message || 'Không tải được bài viết');
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || err?.message || 'Không tải được bài viết');
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [id]);

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
        updateField('slug', slugify(form.title || ''));
    };

    const handleSave = async () => {
        if (!article) return;
        if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
            setError('Vui lòng nhập đủ title, slug và content');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload: EventArticleUpsertRequest = {
                ...form,
                activityId: article.activityId ?? undefined,
                thumbnailUrl: form.thumbnailUrl || null,
                seoTitle: form.seoTitle || null,
                seoDescription: form.seoDescription || null,
            };

            const response = await articleAPI.updateArticle(article.id, payload);
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
                setForm((prev) => ({
                    ...prev,
                    isFeatured: Boolean(response.body?.featured),
                    isPinned: Boolean(response.body?.pinned),
                    priority: response.body?.priority ?? 0,
                    categoryId: response.body?.categoryId ?? null,
                }));
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
                const addRes = await articleAPI.addArticleImage(article.id, {
                    imageUrl: uploadRes.data,
                    caption: null,
                    displayOrder: (galleryImages.length || 0) + idx,
                    isCover: false,
                });
                if (addRes.status && addRes.body) {
                    setGalleryImages((prev) => [...prev, addRes.body!]);
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
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-[#001C44]">Article Editor</h1>
                    <p className="text-gray-600 mt-2">Article ID: {id}</p>
                    {article?.activityId && <p className="text-gray-600">Activity ID: {article.activityId}</p>}
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
                        to={`${base}/articles`}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Quay lại danh sách
                    </Link>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                </div>
            )}

            {article && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-2">
                            <span className="block text-sm font-medium text-gray-700">Title</span>
                            <input
                                value={form.title || ''}
                                onChange={(event) => updateField('title', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
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
                            />
                        </div>
                    </div>

                    <label className="space-y-2 block">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <div className="text-lg font-bold text-[#001C44]">Thumbnail</div>
                                    <div className="text-sm text-gray-600">Chọn ảnh từ máy hoặc dán URL</div>
                                </div>
                                <div className="flex items-center gap-2">
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
                                        className="px-4 py-2 rounded-lg bg-[#001C44] text-white font-semibold hover:bg-[#002A66] disabled:opacity-60"
                                    >
                                        {uploadingThumbnail ? 'Đang upload...' : 'Chọn ảnh'}
                                    </button>
                                </div>
                            </div>

                            {form.thumbnailUrl ? (
                                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
                                    <img
                                        src={getImageUrl(form.thumbnailUrl) || form.thumbnailUrl}
                                        alt="thumbnail"
                                        className="w-full h-40 object-cover rounded-xl border border-gray-200 bg-white"
                                    />
                                    <div className="space-y-2">
                                        <div className="text-sm font-semibold text-gray-700">Thumbnail URL</div>
                                        <input
                                            value={form.thumbnailUrl || ''}
                                            onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-700">Thumbnail URL</div>
                                    <input
                                        value={form.thumbnailUrl || ''}
                                        onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                                        placeholder="https://... hoặc /uploads/..."
                                    />
                                </div>
                            )}
                        </div>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <span className="block text-sm font-medium text-gray-700">Danh mục</span>
                            <select
                                value={form.categoryId ?? ''}
                                onChange={(e) => updateField('categoryId', e.target.value ? Number(e.target.value) : null)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
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
                            <span className="block text-sm font-medium text-gray-700">Loại bài viết</span>
                            <select
                                value={form.articleType || 'ANNOUNCEMENT'}
                                onChange={(e) => updateField('articleType', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                            >
                                <option value="ANNOUNCEMENT">Thông báo</option>
                                <option value="RECAP">Tổng kết</option>
                                <option value="BEHIND_SCENE">Hậu trường</option>
                                <option value="RESULT">Kết quả</option>
                                <option value="UPDATE">Cập nhật</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <span className="block text-sm font-medium text-gray-700">Tags</span>
                            <select
                                multiple
                                value={(form.tagIds ?? []).map(String)}
                                onChange={(e) => {
                                    const next = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                                    setForm((prev) => ({ ...prev, tagIds: next }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white min-h-[52px]"
                            >
                                {tags.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <div className="text-xs text-gray-500">Giữ Ctrl (Windows) để chọn nhiều</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 h-[52px]">
                            <input
                                type="checkbox"
                                checked={Boolean(form.isFeatured)}
                                onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            Nổi bật
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 h-[52px]">
                            <input
                                type="checkbox"
                                checked={Boolean(form.isPinned)}
                                onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            Ghim
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 h-[52px]">
                            <input
                                type="checkbox"
                                checked={Boolean(form.isPrimary)}
                                onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            Đại diện chính
                        </label>
                        <div className="space-y-2">
                            <span className="block text-sm font-medium text-gray-700">Priority</span>
                            <input
                                type="number"
                                value={Number(form.priority ?? 0)}
                                onChange={(e) => updateField('priority', Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                            />
                        </div>
                    </div>

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

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                        <div>
                            <div className="text-lg font-bold text-[#001C44]">Gallery</div>
                            <div className="text-sm text-gray-600">Thêm ảnh theo URL hoặc upload từ máy</div>
                        </div>

                        <div className="flex items-center gap-2">
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
                                className="px-4 py-2 rounded-lg bg-[#001C44] text-white font-semibold hover:bg-[#002A66] disabled:opacity-60"
                            >
                                {uploadingGallery ? 'Đang upload...' : 'Upload ảnh'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                value={imageForm.imageUrl}
                                onChange={(e) => setImageForm((p) => ({ ...p, imageUrl: e.target.value }))}
                                className="md:col-span-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                                placeholder="Image URL"
                            />
                            <input
                                value={imageForm.caption}
                                onChange={(e) => setImageForm((p) => ({ ...p, caption: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                                placeholder="Caption (tùy chọn)"
                            />
                            <input
                                type="number"
                                value={imageForm.displayOrder}
                                onChange={(e) => setImageForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none bg-white"
                                placeholder="Order"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={imageForm.isCover}
                                onChange={(e) => setImageForm((p) => ({ ...p, isCover: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            Đặt làm cover
                        </label>
                        <button
                            type="button"
                            disabled={addingImage || !imageForm.imageUrl.trim()}
                            onClick={handleAddImage}
                            className="px-4 py-2 rounded-lg bg-[#001C44] text-white font-semibold hover:bg-[#002A66] disabled:opacity-60"
                        >
                            {addingImage ? 'Đang thêm...' : 'Thêm ảnh'}
                        </button>

                        {galleryImages.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {galleryImages.map((img) => (
                                    <div key={img.id} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                                        <img src={img.imageUrl} alt={img.caption || 'image'} className="w-full h-40 object-cover" />
                                        <div className="p-3 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 truncate">{img.caption || 'Ảnh'}</div>
                                                <div className="text-xs text-gray-500">Order: {img.displayOrder} {img.isCover ? '• Cover' : ''}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(img.id)}
                                                className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="block text-sm font-medium text-gray-700">Content HTML</span>
                            <span className="text-xs text-gray-500">Sử dụng Visual/HTML/Split để biên tập nhanh</span>
                        </div>
                        <RichTextEditorTipTap
                            value={form.content || ''}
                            onChange={(nextValue) => updateField('content', nextValue)}
                            placeholder="Nhập nội dung landing page bằng visual editor hoặc HTML source"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-3 rounded-lg bg-[#001C44] text-white font-semibold hover:bg-[#002A66] transition-colors disabled:opacity-60"
                        >
                            {saving ? 'Đang lưu...' : 'Save changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleEditorById;

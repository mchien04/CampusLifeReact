import React, { useEffect, useState } from 'react';
import { articleAPI } from '../../../services/articleAPI';
import type { ArticleTagRequest, ArticleTagResponse } from '../../../types/article';
import LoadingSpinner from '../../common/LoadingSpinner';

const TagsPanel: React.FC = () => {
    const [tags, setTags] = useState<ArticleTagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState<ArticleTagRequest>({
        name: '',
        slug: '',
        isActive: true,
    });

    useEffect(() => {
        const loadTags = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await articleAPI.getAdminTags();
                if (response.status && response.body) {
                    setTags(response.body);
                } else {
                    setTags([]);
                }
            } catch {
                setError('Lỗi khi tải tag');
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }) as ArticleTagRequest);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Vui lòng nhập tên tag');
            return;
        }

        try {
            setCreating(true);
            setError(null);
            const payload: ArticleTagRequest = {
                name: formData.name.trim(),
                slug: formData.slug?.trim() ? formData.slug.trim() : null,
                isActive: Boolean(formData.isActive),
            };

            if (editingId) {
                const response = await articleAPI.updateTag(editingId, payload);
                if (response.status && response.body) {
                    setTags((prev) => prev.map((t) => (t.id === editingId ? response.body! : t)));
                    setEditingId(null);
                    setFormData({ name: '', slug: '', isActive: true });
                } else {
                    setError(response.message || 'Không thể cập nhật tag');
                }
            } else {
                const response = await articleAPI.createTag(payload);
                if (response.status && response.body) {
                    setTags((prev) => [...prev, response.body!]);
                    setFormData({ name: '', slug: '', isActive: true });
                } else {
                    setError(response.message || 'Không thể tạo tag');
                }
            }
        } catch {
            setError(editingId ? 'Lỗi khi cập nhật tag' : 'Lỗi khi tạo tag');
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = (tag: ArticleTagResponse) => {
        setEditingId(tag.id);
        setFormData({
            name: tag.name,
            slug: tag.slug || '',
            isActive: Boolean(tag.isActive),
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', isActive: true });
    };

    const handleDelete = async (tagId: number) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa tag này?')) return;
        try {
            const response = await articleAPI.deleteTag(tagId);
            if (response.status) {
                setTags((prev) => prev.filter((t) => t.id !== tagId));
            } else {
                setError(response.message || 'Không thể xóa tag');
            }
        } catch {
            setError('Lỗi khi xóa tag');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-red-700 border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-premium border-0 p-8">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <div className="text-xl font-extrabold text-[#001C44]">{editingId ? 'Chỉnh sửa tag' : 'Tạo tag mới'}</div>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95 text-sm"
                        >
                            Hủy
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">Tên</div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">Slug</div>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug || ''}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                        />
                    </div>
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-center pb-3">
                            <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#001C44] cursor-pointer">
                                <input type="checkbox" name="isActive" checked={Boolean(formData.isActive)} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                Kích hoạt
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-8 py-3 rounded-2xl bg-[#001C44] text-[#FFD66D] font-extrabold hover:bg-blue-900 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 text-sm whitespace-nowrap"
                        >
                            {creating ? 'Đang xử lý...' : editingId ? 'Cập nhật tag' : '➕ Tạo tag'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">Tên</th>
                                <th className="px-6 py-5">Slug</th>
                                <th className="px-6 py-5">Trạng thái</th>
                                <th className="px-6 py-5 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tags.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Chưa có tag</td>
                                </tr>
                            ) : (
                                tags.map((t) => (
                                    <tr key={t.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 font-extrabold text-[#001C44]">{t.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs font-semibold">{t.slug || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold ${t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {t.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-amber-500 transition-colors transform hover:scale-110 active:scale-95" title="Sửa">
                                                    <span className="text-xl">✏️</span>
                                                </button>
                                                <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors transform hover:scale-110 active:scale-95" title="Xóa">
                                                    <span className="text-xl">🗑️</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TagsPanel;


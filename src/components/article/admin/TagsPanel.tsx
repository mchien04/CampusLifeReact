import React, { useEffect, useState } from 'react';
import { articleAPI } from '../../../services/articleAPI';
import type { ArticleTagRequest, ArticleTagResponse } from '../../../types/article';
import LoadingSpinner from '../../common/LoadingSpinner';

const TagsPanel: React.FC = () => {
    const [tags, setTags] = useState<ArticleTagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

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
            const response = await articleAPI.createTag(payload);
            if (response.status && response.body) {
                setTags((prev) => [...prev, response.body!]);
                setFormData({ name: '', slug: '', isActive: true });
            } else {
                setError(response.message || 'Không thể tạo tag');
            }
        } catch {
            setError('Lỗi khi tạo tag');
        } finally {
            setCreating(false);
        }
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-lg font-bold text-[#001C44] mb-4">Tạo tag mới</div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700">Tên</div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700">Slug</div>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug || ''}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input type="checkbox" name="isActive" checked={Boolean(formData.isActive)} onChange={handleChange} className="h-4 w-4" />
                            Kích hoạt
                        </label>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-5 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66] disabled:opacity-60"
                        >
                            {creating ? 'Đang tạo...' : 'Tạo'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Chưa có tag</td>
                                </tr>
                            ) : (
                                tags.map((t) => (
                                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{t.name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{t.slug || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {t.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleDelete(t.id)} className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200">
                                                    Xóa
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


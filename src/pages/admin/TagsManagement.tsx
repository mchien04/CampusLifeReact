import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { articleAPI } from '../../services/articleAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { ArticleTagRequest, ArticleTagResponse } from '../../types/article';

const TagsManagement: React.FC = () => {
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
            } catch (err) {
                console.error('Failed to load tags:', err);
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
        } catch (err) {
            console.error('Failed to create tag:', err);
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
        } catch (err) {
            console.error('Failed to delete tag:', err);
            setError('Lỗi khi xóa tag');
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
        <div className="w-full">
            <Helmet>
                <title>Quản lý tag bài viết - CampusLife</title>
                <meta name="description" content="Quản lý tag bài viết" />
            </Helmet>

            <div className="mx-auto max-w-4xl w-full">
                <h1 className="text-4xl font-black text-[#001C44] mb-8">🏷️ Quản lý tag</h1>

                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700 border border-red-200">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 text-sm underline hover:no-underline"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                <div className="mb-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-[#001C44] mb-6">➕ Tạo tag mới</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên tag
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="VD: react, workshop..."
                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Slug (tùy chọn)
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug || ''}
                                onChange={handleChange}
                                placeholder="VD: react"
                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none"
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={Boolean(formData.isActive)}
                                onChange={handleChange}
                                className="h-4 w-4"
                            />
                            Kích hoạt
                        </label>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-6 py-2 bg-[#001C44] text-white font-semibold rounded-xl hover:bg-[#002A66] transition-colors disabled:opacity-60"
                            >
                                {creating ? 'Đang tạo...' : 'Tạo'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
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
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Chưa có tag nào
                                        </td>
                                    </tr>
                                ) : (
                                    tags.map((tag) => (
                                        <tr key={tag.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{tag.name}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">{tag.slug || '-'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tag.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {tag.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(tag.id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                                                    >
                                                        🗑️ Xóa
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
        </div>
    );
};

export default TagsManagement;

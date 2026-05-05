import React, { useEffect, useState } from 'react';
import { articleAPI } from '../../../services/articleAPI';
import type { ArticleCategoryRequest, ArticleCategoryResponse } from '../../../types/article';
import LoadingSpinner from '../../common/LoadingSpinner';

const CategoriesPanel: React.FC = () => {
    const [categories, setCategories] = useState<ArticleCategoryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        displayOrder: 0,
        isActive: true,
    });

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await articleAPI.getAdminCategories();
                if (response.status && response.body) {
                    setCategories(response.body);
                } else {
                    setCategories([]);
                }
            } catch {
                setError('Lỗi khi tải danh mục');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'displayOrder' ? Number(value) : value,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleAutoSlug = () => {
        setFormData((prev) => ({
            ...prev,
            slug: generateSlug(formData.name),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.slug.trim()) {
            setError('Vui lòng điền tên và slug');
            return;
        }

        try {
            setError(null);
            const payload: ArticleCategoryRequest = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description || null,
                displayOrder: Number.isFinite(formData.displayOrder) ? formData.displayOrder : 0,
                isActive: Boolean(formData.isActive),
            };

            if (editingId) {
                const response = await articleAPI.updateCategory(editingId, payload);
                if (response.status && response.body) {
                    setCategories((prev) => prev.map((c) => (c.id === editingId ? response.body! : c)));
                    setEditingId(null);
                } else {
                    setError(response.message || 'Lỗi khi lưu danh mục');
                }
            } else {
                const response = await articleAPI.createCategory(payload);
                if (response.status && response.body) {
                    setCategories((prev) => [...prev, response.body!]);
                } else {
                    setError(response.message || 'Lỗi khi tạo danh mục');
                }
            }

            setFormData({ name: '', slug: '', description: '', displayOrder: 0, isActive: true });
        } catch {
            setError('Lỗi khi lưu danh mục');
        }
    };

    const handleEdit = (category: ArticleCategoryResponse) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug || '',
            description: category.description || '',
            displayOrder: category.displayOrder ?? 0,
            isActive: Boolean(category.isActive),
        });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;

        try {
            const response = await articleAPI.deleteCategory(id);
            if (response.status) {
                setCategories((prev) => prev.filter((c) => c.id !== id));
            } else {
                setError(response.message || 'Lỗi khi xóa danh mục');
            }
        } catch {
            setError('Lỗi khi xóa danh mục');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', description: '', displayOrder: 0, isActive: true });
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
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="text-lg font-bold text-[#001C44]">{editingId ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</div>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                        >
                            Hủy
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700">Tên</div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-gray-700">Slug</div>
                            <button type="button" onClick={handleAutoSlug} className="text-xs font-semibold text-[#001C44] hover:text-[#002A66]">
                                Tự động
                            </button>
                        </div>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleFormChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-semibold text-gray-700">Mô tả</div>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            rows={2}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700">Thứ tự</div>
                        <input
                            type="number"
                            name="displayOrder"
                            value={formData.displayOrder}
                            onChange={handleFormChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleCheckboxChange} className="h-4 w-4" />
                            Kích hoạt
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="px-5 py-3 rounded-xl bg-[#001C44] text-white font-semibold hover:bg-[#002A66]"
                        >
                            {editingId ? 'Cập nhật' : 'Tạo'}
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
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thứ tự</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chưa có danh mục</td>
                                </tr>
                            ) : (
                                categories
                                    .slice()
                                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                                    .map((c) => (
                                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{c.name}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">{c.slug || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{c.displayOrder}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(c)} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200">
                                                        Sửa
                                                    </button>
                                                    <button onClick={() => handleDelete(c.id)} className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200">
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

export default CategoriesPanel;


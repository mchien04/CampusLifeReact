import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { articleAPI } from '../../services/articleAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

const CategoriesManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await articleAPI.getCategories();
            if (response.status && response.body) {
                setCategories(response.body);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
            setError('Lỗi khi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
            if (editingId) {
                const response = await articleAPI.updateCategory(editingId, formData);
                if (response.status) {
                    setCategories((prev) =>
                        prev.map((c) =>
                            c.id === editingId
                                ? { ...c, ...formData }
                                : c
                        )
                    );
                    setEditingId(null);
                }
            } else {
                const response = await articleAPI.createCategory(formData);
                if (response.status && response.body) {
                    setCategories((prev) => [...prev, response.body]);
                }
            }

            setFormData({ name: '', slug: '', description: '' });
            setError(null);
        } catch (err) {
            console.error('Failed to save category:', err);
            setError('Lỗi khi lưu danh mục');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
        });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;

        try {
            const response = await articleAPI.deleteCategory(id);
            if (response.status) {
                setCategories((prev) => prev.filter((c) => c.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete category:', err);
            setError('Lỗi khi xóa danh mục');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', description: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF]">
            <Helmet>
                <title>Quản lý danh mục bài viết - CampusLife</title>
                <meta name="description" content="Quản lý danh mục bài viết" />
            </Helmet>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black text-[#001C44] mb-8">📂 Quản lý danh mục</h1>

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

                {/* Form */}
                <div className="mb-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-[#001C44] mb-6">
                        {editingId ? '✏️ Chỉnh sửa danh mục' : '➕ Tạo danh mục mới'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tên danh mục
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="VD: Hội thảo, Workshop, ..."
                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Slug (URL)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleFormChange}
                                    placeholder="VD: hoi-thao"
                                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAutoSlug}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
                                >
                                    Tự động
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mô tả (tùy chọn)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Mô tả danh mục..."
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-[#0B5FFF] focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-[#001C44] text-white font-semibold rounded-xl hover:bg-[#002A66] transition-colors"
                            >
                                {editingId ? 'Cập nhật' : 'Tạo'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-400 transition-colors"
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Chưa có danh mục nào
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {category.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                                {category.slug}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {category.description && (
                                                    <span className="line-clamp-1">{category.description}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(category)}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category.id)}
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

export default CategoriesManagement;

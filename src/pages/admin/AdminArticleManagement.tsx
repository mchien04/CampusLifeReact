import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleAPI } from '../../services/articleAPI';
import { getImageUrl } from '../../utils/imageUtils';
import type { ArticleListResponse, SpringPage } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type SortKey = 'title' | 'views' | 'wishlist' | 'date';

const AdminArticleManagement: React.FC = () => {
    const [articlesPage, setArticlesPage] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('date');
    const [sortDesc, setSortDesc] = useState(true);
    const [deleting, setDeleting] = useState<Set<number>>(new Set());
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(20);

    useEffect(() => {
        loadArticles();
    }, [page, pageSize]);

    const loadArticles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await articleAPI.getArticlesList?.({ status: 'all', page, size: pageSize });

            if (response?.status && response.body) {
                setArticlesPage(response.body);
            } else {
                setArticlesPage(null);
            }
        } catch (err: any) {
            console.error('Failed to load articles:', err);
            setError(err?.response?.data?.message || 'Không tải được danh sách bài viết');
            setArticlesPage(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sort === key) {
            setSortDesc(!sortDesc);
        } else {
            setSort(key);
            setSortDesc(true);
        }
    };

    const handleDelete = async (articleId: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        try {
            setDeleting((prev) => new Set([...Array.from(prev), articleId]));
            // Assuming there's a delete endpoint
            // await articleAPI.deleteArticle(articleId);
            setArticlesPage((prev) => {
                if (!prev) return prev;
                const newContent = prev.content.filter((a) => a.id !== articleId);
                return {
                    ...prev,
                    content: newContent,
                    totalElements: Math.max(0, prev.totalElements - 1),
                    number: prev.number,
                } as SpringPage<ArticleListResponse>;
            });
        } catch (err) {
            console.error('Failed to delete article:', err);
            alert('Xóa bài viết thất bại');
        } finally {
            setDeleting((prev) => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
        }
    };

    const getFilteredSorted = (items: ArticleListResponse[]) => {
        let result = [...items];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((a) => a.title.toLowerCase().includes(q));
        }

        result.sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sort) {
                case 'views':
                    aVal = a.viewCount;
                    bVal = b.viewCount;
                    break;
                case 'wishlist':
                    aVal = a.wishlistCount;
                    bVal = b.wishlistCount;
                    break;
                case 'date':
                    aVal = new Date(a.publishedAt || '').getTime();
                    bVal = new Date(b.publishedAt || '').getTime();
                    break;
                case 'title':
                default:
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
            }

            if (sortDesc) {
                return typeof aVal === 'number'
                    ? (bVal as number) - (aVal as number)
                    : (bVal as string).localeCompare(aVal as string);
            } else {
                return typeof aVal === 'number'
                    ? (aVal as number) - (bVal as number)
                    : (aVal as string).localeCompare(bVal as string);
            }
        });

        return result;
    };

    const SortIcon: React.FC<{ active: boolean }> = ({ active }) => (
        <span className="ml-1 text-xs">
            {active && (sortDesc ? '↓' : '↑')}
        </span>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10 py-8 rounded-2xl bg-gradient-to-r from-[#001C44] via-[#002A66] to-[#001C44] text-white shadow-lg">
                    <div className="flex flex-col items-start justify-between gap-4 px-4">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">📝 Quản lý bài viết</h1>
                            <p className="text-gray-100">Tổng cộng <span className="font-bold text-[#FFD66D]">{articlesPage?.totalElements ?? 0}</span> bài viết</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {/* Search */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#001C44] mb-2">Tìm kiếm bài viết</label>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all"
                    />
                </div>

                {/* Table */}
                {(articlesPage?.content || []).length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Không có bài viết nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border-2 border-[#001C44] border-opacity-20 bg-white shadow-md">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-[#001C44] border-opacity-20 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white">
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('title')}
                                            className="flex items-center font-semibold text-white hover:text-[#FFD66D] transition-colors"
                                        >
                                            Tiêu đề
                                            <SortIcon active={sort === 'title'} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('views')}
                                            className="flex items-center font-semibold text-white hover:text-[#FFD66D] transition-colors"
                                        >
                                            Lượt xem
                                            <SortIcon active={sort === 'views'} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('wishlist')}
                                            className="flex items-center font-semibold text-white hover:text-[#FFD66D] transition-colors"
                                        >
                                            Yêu thích
                                            <SortIcon active={sort === 'wishlist'} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('date')}
                                            className="flex items-center font-semibold text-white hover:text-[#FFD66D] transition-colors"
                                        >
                                            Ngày tạo
                                            <SortIcon active={sort === 'date'} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-center font-semibold text-white">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredSorted(articlesPage?.content || []).map((article, idx) => (
                                    <tr
                                        key={article.id}
                                        className={`border-b border-[#001C44] border-opacity-10 hover:bg-[#FFD66D] hover:bg-opacity-5 transition-colors ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    to={`/articles/${article.slug}`}
                                                    className="text-[#001C44] font-semibold hover:text-blue-600 line-clamp-1 transition-colors"
                                                >
                                                    {article.title}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                                                👁️ {article.viewCount.toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-red-800 font-semibold">
                                                ❤️ {article.wishlistCount.toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    to={`/articles/${article.slug}`}
                                                    className="text-sm px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition-all"
                                                    title="Xem bài viết"
                                                >
                                                    👁️
                                                </Link>
                                                <Link
                                                    to={`/manager/events/${article.id}/article`}
                                                    className="text-sm px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-semibold transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(article.id)}
                                                    disabled={deleting.has(article.id)}
                                                    className="text-sm px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {articlesPage && (
                    <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md border-2 border-[#001C44] border-opacity-10 sm:flex-row">
                        <div className="text-sm font-semibold text-[#001C44]">Trang {articlesPage.number + 1} / {articlesPage.totalPages} — Tổng {articlesPage.totalElements} bài</div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { const prev = Math.max(0, page - 1); setPage(prev); }}
                                disabled={page <= 0}
                                className="px-4 py-2 bg-[#001C44] text-white rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Trước
                            </button>
                            <button
                                onClick={() => { const next = Math.min(articlesPage.totalPages - 1, page + 1); setPage(next); }}
                                disabled={page >= (articlesPage.totalPages - 1)}
                                className="px-4 py-2 bg-[#FFD66D] text-[#001C44] rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau →
                            </button>
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="px-3 py-2 rounded-lg border-2 border-[#001C44] font-medium text-[#001C44] bg-white hover:bg-gray-50 cursor-pointer transition-all">
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                                <option value={50}>50 / trang</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminArticleManagement;

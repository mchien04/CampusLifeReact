import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleListResponse, ArticleStatisticsResponse, SpringPage } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategoriesPanel from '../../components/article/admin/CategoriesPanel';
import TagsPanel from '../../components/article/admin/TagsPanel';
import CreateArticleModal from '../../components/article/admin/CreateArticleModal';

type SortKey = 'title' | 'views' | 'wishlist' | 'date';
type TabKey = 'articles' | 'categories' | 'tags';

const COLORS = ['#0B5FFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const AdminArticleManagement: React.FC = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/manager') ? '/manager' : '/admin';
    const navigate = useNavigate();
    const [articlesPage, setArticlesPage] = useState<SpringPage<ArticleListResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('date');
    const [sortDesc, setSortDesc] = useState(true);
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(20);
    const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [tab, setTab] = useState<TabKey>('articles');
    const [stats, setStats] = useState<ArticleStatisticsResponse | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        loadArticles();
    }, [page, pageSize, status]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoadingStats(true);
                const response = await articleAPI.getStatistics();
                if (response.status && response.body) {
                    setStats(response.body);
                } else {
                    setStats(null);
                }
            } finally {
                setLoadingStats(false);
            }
        };

        loadStats();
    }, []);

    const loadArticles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await articleAPI.getArticlesList?.({ status, page, size: pageSize });

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

    const filteredSorted = useMemo(() => {
        const items = articlesPage?.content || [];
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
            }
            return typeof aVal === 'number'
                ? (aVal as number) - (bVal as number)
                : (aVal as string).localeCompare(bVal as string);
        });

        return result;
    }, [articlesPage, search, sort, sortDesc]);

    const SortIcon: React.FC<{ active: boolean }> = ({ active }) => (
        <span className="ml-1 text-xs">
            {active && (sortDesc ? '↓' : '↑')}
        </span>
    );

    const statsByMonth = Object.entries(stats?.articlesByMonth || {}).map(([month, count]) => ({ month, count }));
    const statsByCategory = Object.entries(stats?.articlesByCategory || {}).map(([name, value]) => ({ name, value }));

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mx-auto max-w-7xl w-full">
                {/* Header */}
                <div className="mb-10 py-8 rounded-2xl bg-gradient-to-r from-[#001C44] via-[#002A66] to-[#001C44] text-white shadow-lg">
                    <div className="flex flex-col items-start justify-between gap-4 px-4">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">📝 Quản lý bài viết</h1>
                            <p className="text-gray-100">Tổng cộng <span className="font-bold text-[#FFD66D]">{articlesPage?.totalElements ?? 0}</span> bài viết</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="px-4 py-2 rounded-xl bg-[#FFD66D] text-[#001C44] font-bold hover:bg-yellow-400 transition-colors"
                            >
                                ➕ Tạo bài viết
                            </button>
                            <Link
                                to={`${base}/articles/analytics`}
                                className="px-4 py-2 rounded-xl bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-semibold transition-colors"
                            >
                                Mở Dashboard riêng
                            </Link>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div className="text-lg font-bold text-[#001C44]">Dashboard</div>
                    </div>

                    {loadingStats ? (
                        <div className="min-h-[120px] flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : stats ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-2xl border border-gray-200 p-5">
                                    <div className="text-sm text-gray-600">Tổng view</div>
                                    <div className="text-2xl font-bold text-[#001C44] mt-1">{stats.totalViews.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5">
                                    <div className="text-sm text-gray-600">Tổng wishlist</div>
                                    <div className="text-2xl font-bold text-red-600 mt-1">{stats.totalWishlists.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5">
                                    <div className="text-sm text-gray-600">Published / Draft</div>
                                    <div className="text-2xl font-bold mt-1">
                                        <span className="text-green-600">{stats.publishedArticles}</span>
                                        <span className="text-gray-300 mx-2">/</span>
                                        <span className="text-yellow-600">{stats.draftArticles}</span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5">
                                    <div className="text-sm text-gray-600">Pinned / Featured</div>
                                    <div className="text-2xl font-bold mt-1">
                                        <span className="text-[#001C44]">{stats.pinnedArticles}</span>
                                        <span className="text-gray-300 mx-2">/</span>
                                        <span className="text-[#0B5FFF]">{stats.featuredArticles}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="rounded-2xl border border-gray-200 p-4">
                                    <div className="font-semibold text-[#001C44] mb-3">Bài theo tháng</div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={statsByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" name="Số bài" fill="#0B5FFF" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-4">
                                    <div className="font-semibold text-[#001C44] mb-3">Phân bổ danh mục</div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Tooltip />
                                            <Legend />
                                            <Pie data={statsByCategory} dataKey="value" nameKey="name" outerRadius={95}>
                                                {statsByCategory.map((_, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-gray-600">Không tải được dữ liệu dashboard</div>
                    )}
                </div>

                <div className="mb-6 flex items-center gap-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setTab('articles')}
                        className={`px-4 py-2 rounded-xl font-semibold border ${tab === 'articles' ? 'bg-[#001C44] text-white border-[#001C44]' : 'bg-white text-[#001C44] border-gray-200 hover:bg-gray-50'}`}
                    >
                        Bài viết
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('categories')}
                        className={`px-4 py-2 rounded-xl font-semibold border ${tab === 'categories' ? 'bg-[#001C44] text-white border-[#001C44]' : 'bg-white text-[#001C44] border-gray-200 hover:bg-gray-50'}`}
                    >
                        Categories
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('tags')}
                        className={`px-4 py-2 rounded-xl font-semibold border ${tab === 'tags' ? 'bg-[#001C44] text-white border-[#001C44]' : 'bg-white text-[#001C44] border-gray-200 hover:bg-gray-50'}`}
                    >
                        Tags
                    </button>
                </div>

                {/* Table */}
                {tab === 'categories' ? (
                    <CategoriesPanel />
                ) : tab === 'tags' ? (
                    <TagsPanel />
                ) : filteredSorted.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Không có bài viết nào</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-[#001C44] mb-2">Tìm kiếm bài viết</label>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tiêu đề..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#001C44] mb-2">Trạng thái</label>
                                <select
                                    value={status}
                                    onChange={(e) => { setStatus(e.target.value as any); setPage(0); }}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[#001C44] focus:ring-2 focus:ring-[#001C44] focus:ring-opacity-10 focus:outline-none transition-all bg-white"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

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
                                    {filteredSorted.map((article, idx) => (
                                        <tr
                                            key={article.id}
                                            className={`border-b border-[#001C44] border-opacity-10 hover:bg-[#FFD66D] hover:bg-opacity-5 transition-colors ${
                                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {article.isPinned && (
                                                        <span className="inline-flex items-center rounded-full bg-[#FFD66D] px-3 py-1 text-xs font-bold text-[#001C44]">
                                                            Ghim
                                                        </span>
                                                    )}
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
                                                        to={`${base}/articles/${article.id}/edit`}
                                                        className="text-sm px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-semibold transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        ✏️
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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
                    </>
                )}
            </div>

            <CreateArticleModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSelectActivity={(activityId) => {
                    setCreateOpen(false);
                    navigate(`/manager/events/${activityId}/article`);
                }}
            />
        </div>
    );
};


export default AdminArticleManagement;

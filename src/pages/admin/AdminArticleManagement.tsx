import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { toast } from 'react-toastify';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleCategoryResponse, ArticleStatisticsResponse, ArticleType, EventArticleAdminResponse, SpringPage } from '../../types/article';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategoriesPanel from '../../components/article/admin/CategoriesPanel';
import TagsPanel from '../../components/article/admin/TagsPanel';
import CreateArticleModal from '../../components/article/admin/CreateArticleModal';
import SetPrimaryButton from '../../components/article/admin/SetPrimaryButton';
import ArticleTypeBadge from '../../components/article/ArticleTypeBadge';

type SortKey = 'title' | 'views' | 'wishlist' | 'date';
type TabKey = 'articles' | 'categories' | 'tags';

const COLORS = ['#0B5FFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const AdminArticleManagement: React.FC = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/manager') ? '/manager' : '/admin';
    const navigate = useNavigate();
    const [articlesPage, setArticlesPage] = useState<SpringPage<EventArticleAdminResponse> | null>(null);
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

    // Advanced Filters States
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [articleType, setArticleType] = useState<ArticleType | ''>('');
    const [featured, setFeatured] = useState<boolean | ''>('');
    const [pinned, setPinned] = useState<boolean | ''>('');
    const [primary, setPrimary] = useState<boolean | ''>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [categories, setCategories] = useState<ArticleCategoryResponse[]>([]);
    const [exporting, setExporting] = useState(false);

    const loadArticles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await articleAPI.getAdminArticlesFiltered({
                status: status === 'all' ? 'ALL' : status === 'published' ? 'PUBLISHED' : 'DRAFT',
                categoryId: categoryId || undefined,
                articleType: articleType || undefined,
                featured: featured === true ? true : featured === false ? false : undefined,
                pinned: pinned === true ? true : pinned === false ? false : undefined,
                primary: primary === true ? true : primary === false ? false : undefined,
                search: search || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                page,
                size: pageSize,
            });

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

    useEffect(() => {
        loadArticles();
    }, [page, pageSize, status, categoryId, articleType, featured, pinned, primary, dateFrom, dateTo, search]);

    useEffect(() => {
        const loadStatsAndCategories = async () => {
            try {
                setLoadingStats(true);
                const statsResponse = await articleAPI.getStatistics();
                if (statsResponse.status && statsResponse.body) {
                    setStats(statsResponse.body);
                } else {
                    setStats(null);
                }

                const catResponse = await articleAPI.getAdminCategories();
                if (catResponse.status && catResponse.body) {
                    setCategories(catResponse.body);
                }
            } catch (err) {
                console.error('Error loading initial stats/categories:', err);
            } finally {
                setLoadingStats(false);
            }
        };

        loadStatsAndCategories();
    }, []);

    const handleSort = (key: SortKey) => {
        if (sort === key) {
            setSortDesc(!sortDesc);
        } else {
            setSort(key);
            setSortDesc(true);
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatus('all');
        setCategoryId('');
        setArticleType('');
        setFeatured('');
        setPinned('');
        setPrimary('');
        setDateFrom('');
        setDateTo('');
        setPage(0);
    };

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const filters = {
                status: status === 'all' ? 'ALL' : status === 'published' ? 'PUBLISHED' : 'DRAFT',
                categoryId: categoryId || undefined,
                articleType: articleType || undefined,
                featured: featured === true ? true : featured === false ? false : undefined,
                pinned: pinned === true ? true : pinned === false ? false : undefined,
                primary: primary === true ? true : primary === false ? false : undefined,
                search: search || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            };
            const blob = await articleAPI.exportArticlesExcel(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `danh_sach_bai_viet_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Xuất file Excel thành công');
        } catch (error) {
            console.error('Failed to export Excel:', error);
            toast.error('Có lỗi xảy ra khi xuất Excel');
        } finally {
            setExporting(false);
        }
    };

    const filteredSorted = useMemo(() => {
        const items = articlesPage?.content || [];
        let result = [...items];

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
    }, [articlesPage, sort, sortDesc]);

    const SortIcon: React.FC<{ active: boolean }> = ({ active }) => (
        <span className="ml-1 text-xs">
            {active && (sortDesc ? '↓' : '↑')}
        </span>
    );

    const statsByMonth = Object.entries(stats?.articlesByMonth || {}).map(([month, count]) => ({ month, count }));
    const statsByCategory = Object.entries(stats?.articlesByCategory || {}).map(([name, value]) => ({ name, value }));

    if (loading && categories.length === 0 && !stats) {
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
                    <div className="flex flex-col items-start justify-between gap-4 px-6 md:flex-row md:items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">📝 Quản lý bài viết</h1>
                            <p className="text-gray-100">Tổng cộng <span className="font-bold text-[#FFD66D]">{articlesPage?.totalElements ?? 0}</span> bài viết</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="px-4 py-2.5 rounded-xl bg-[#FFD66D] text-[#001C44] font-bold hover:bg-yellow-400 transition-colors shadow"
                            >
                                ➕ Tạo bài viết
                            </button>
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow disabled:opacity-50"
                            >
                                {exporting ? 'Đang xuất...' : '📥 Xuất Excel'}
                            </button>
                            <Link
                                to={`${base}/articles/analytics`}
                                className="px-4 py-2.5 rounded-xl bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-semibold transition-colors shadow"
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
                                <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-blue-50/50 to-white">
                                    <div className="text-sm text-gray-600">Tổng view</div>
                                    <div className="text-2xl font-bold text-[#001C44] mt-1">{stats.totalViews.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-red-50/50 to-white">
                                    <div className="text-sm text-gray-600">Tổng wishlist</div>
                                    <div className="text-2xl font-bold text-red-600 mt-1">{stats.totalWishlists.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-green-50/50 to-white">
                                    <div className="text-sm text-gray-600">Published / Draft</div>
                                    <div className="text-2xl font-bold mt-1">
                                        <span className="text-green-600">{stats.publishedArticles}</span>
                                        <span className="text-gray-300 mx-2">/</span>
                                        <span className="text-yellow-600">{stats.draftArticles}</span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-amber-50/50 to-white">
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
                ) : (
                    <>
                        {/* Advanced Filters Panel */}
                        <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-base font-bold text-[#001C44] mb-4">🔍 Bộ lọc nâng cao</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tìm kiếm bài viết</label>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tiêu đề..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:ring-1 focus:ring-[#001C44] focus:outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái xuất bản</label>
                                    <select
                                        value={status}
                                        onChange={(e) => { setStatus(e.target.value as any); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:outline-none transition-all bg-white"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Danh mục</label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:outline-none transition-all bg-white"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Loại bài viết</label>
                                    <select
                                        value={articleType}
                                        onChange={(e) => { setArticleType(e.target.value as any); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:outline-none transition-all bg-white"
                                    >
                                        <option value="">Tất cả loại</option>
                                        <option value="ANNOUNCEMENT">Thông báo</option>
                                        <option value="RECAP">Tổng kết</option>
                                        <option value="BEHIND_SCENE">Hậu trường</option>
                                        <option value="RESULT">Kết quả</option>
                                        <option value="UPDATE">Cập nhật</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end mb-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:outline-none transition-all bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#001C44] focus:outline-none transition-all bg-white"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex flex-wrap gap-4 py-2">
                                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={pinned === true}
                                            onChange={(e) => { setPinned(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] w-4 h-4 cursor-pointer"
                                        />
                                        Ghim
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={featured === true}
                                            onChange={(e) => { setFeatured(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] w-4 h-4 cursor-pointer"
                                        />
                                        Nổi bật
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={primary === true}
                                            onChange={(e) => { setPrimary(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44] w-4 h-4 cursor-pointer"
                                        />
                                        Đại diện chính
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
                                >
                                    🔄 Reset bộ lọc
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="min-h-[200px] flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : filteredSorted.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <p className="text-gray-600">Không tìm thấy bài viết nào khớp với bộ lọc</p>
                            </div>
                        ) : (
                            <>
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
                                                <th className="px-6 py-4 text-left font-semibold">Loại</th>
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
                                                        Ngày đăng
                                                        <SortIcon active={sort === 'date'} />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-center font-semibold">Đại diện</th>
                                                <th className="px-6 py-4 text-center font-semibold">
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
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {article.pinned && (
                                                                <span className="inline-flex items-center rounded-full bg-[#FFD66D] px-2.5 py-0.5 text-xs font-bold text-[#001C44]">
                                                                    Ghim
                                                                </span>
                                                            )}
                                                            {article.featured && (
                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                                                    Nổi bật
                                                                </span>
                                                            )}
                                                            {!article.published && (
                                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
                                                                    Nháp
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
                                                    <td className="px-6 py-4">
                                                        <ArticleTypeBadge type={article.articleType} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 font-semibold border border-blue-100">
                                                            👁️ {article.viewCount.toLocaleString('vi-VN')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-red-700 font-semibold border border-red-100">
                                                            ❤️ {article.wishlistCount.toLocaleString('vi-VN')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <SetPrimaryButton
                                                            articleId={article.id}
                                                            isPrimary={article.isPrimary}
                                                            onSuccess={loadArticles}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Link
                                                                to={`/articles/${article.slug}`}
                                                                className="text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-all border border-blue-200"
                                                                title="Xem bài viết"
                                                            >
                                                                👁️
                                                            </Link>
                                                            <Link
                                                                to={`${base}/articles/${article.id}/edit`}
                                                                className="text-sm px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-semibold transition-all border border-yellow-200"
                                                                title="Chỉnh sửa"
                                                            >
                                                                ✏️
                                                            </Link>
                                                            <Link
                                                                to={`${base}/articles/${article.id}/comments`}
                                                                className="text-sm px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-all border border-indigo-200"
                                                                title="Quản lý bình luận"
                                                            >
                                                                💬
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
                                                type="button"
                                                onClick={() => { const prev = Math.max(0, page - 1); setPage(prev); }}
                                                disabled={page <= 0}
                                                className="px-4 py-2 bg-[#001C44] text-white rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                ← Trước
                                            </button>
                                            <button
                                                type="button"
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

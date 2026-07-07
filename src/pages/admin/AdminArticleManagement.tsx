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
                <div className="mb-10 py-10 px-8 rounded-3xl bg-[#001C44] text-white shadow-premium relative overflow-hidden">
                    {/* Decorative abstract shape */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0B5FFF]/30 to-[#FFD66D]/20 blur-3xl mix-blend-screen pointer-events-none" />
                    
                    <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">Quản lý bài viết</h1>
                            <p className="text-blue-100 font-medium">
                                Tổng cộng <span className="font-extrabold text-[#FFD66D] text-lg px-1">{articlesPage?.totalElements ?? 0}</span> bài viết
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="px-6 py-3 rounded-2xl bg-[#FFD66D] text-[#001C44] font-extrabold hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                            >
                                ➕ Tạo bài viết
                            </button>
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="px-6 py-3 rounded-2xl bg-white text-[#001C44] font-extrabold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none"
                            >
                                {exporting ? 'Đang xuất...' : '📥 Xuất Excel'}
                            </button>
                            <Link
                                to={`${base}/articles/analytics`}
                                className="px-6 py-3 rounded-2xl bg-blue-900/50 hover:bg-blue-800/80 text-white font-extrabold transition-all border border-blue-700/50 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                            >
                                📊 Analytics
                            </Link>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error}
                    </div>
                )}

                <div className="mb-8 bg-white rounded-3xl shadow-premium border-0 p-8">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                        <div className="text-xl font-extrabold text-[#001C44]">Tổng quan Dashboard</div>
                    </div>

                    {loadingStats ? (
                        <div className="min-h-[120px] flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : stats ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
                                <div className="rounded-2xl border border-gray-300 shadow-sm bg-white/50 p-6 bg-white flex flex-col justify-between">
                                    <div className="text-sm font-bold tracking-wide text-gray-400 uppercase">Tổng view</div>
                                    <div className="text-3xl font-extrabold text-[#001C44] mt-2 tracking-tight">{stats.totalViews.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-300 shadow-sm bg-white/50 p-6 bg-white flex flex-col justify-between">
                                    <div className="text-sm font-bold tracking-wide text-gray-400 uppercase">Tổng wishlist</div>
                                    <div className="text-3xl font-extrabold text-[#0B5FFF] mt-2 tracking-tight">{stats.totalWishlists.toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="rounded-2xl border border-gray-300 shadow-sm bg-white/50 p-6 bg-white flex flex-col justify-between">
                                    <div className="text-sm font-bold tracking-wide text-gray-400 uppercase">Published / Draft</div>
                                    <div className="text-3xl font-extrabold mt-2 tracking-tight flex items-center">
                                        <span className="text-emerald-500">{stats.publishedArticles}</span>
                                        <span className="text-gray-300 mx-2 font-light">/</span>
                                        <span className="text-amber-500">{stats.draftArticles}</span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-gray-300 shadow-sm bg-white/50 p-6 bg-white flex flex-col justify-between">
                                    <div className="text-sm font-bold tracking-wide text-gray-400 uppercase">Pinned / Featured</div>
                                    <div className="text-3xl font-extrabold mt-2 tracking-tight flex items-center">
                                        <span className="text-indigo-500">{stats.pinnedArticles}</span>
                                        <span className="text-gray-300 mx-2 font-light">/</span>
                                        <span className="text-rose-500">{stats.featuredArticles}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                                    <div className="font-extrabold text-[#001C44] mb-4">Bài theo tháng</div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={statsByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="count" name="Số bài" fill="#001C44" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                                    <div className="font-extrabold text-[#001C44] mb-4">Phân bổ danh mục</div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend iconType="circle" />
                                            <Pie data={statsByCategory} dataKey="value" nameKey="name" outerRadius={95} innerRadius={60} paddingAngle={2} stroke="none">
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

                <div className="mb-8 flex items-center gap-3 overflow-x-auto p-1.5 bg-gray-100 rounded-2xl w-fit">
                    <button
                        type="button"
                        onClick={() => setTab('articles')}
                        className={`px-6 py-2.5 rounded-xl font-extrabold transition-all text-sm ${tab === 'articles' ? 'bg-white text-[#001C44] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                    >
                        Bài viết
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('categories')}
                        className={`px-6 py-2.5 rounded-xl font-extrabold transition-all text-sm ${tab === 'categories' ? 'bg-white text-[#001C44] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                    >
                        Categories
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('tags')}
                        className={`px-6 py-2.5 rounded-xl font-extrabold transition-all text-sm ${tab === 'tags' ? 'bg-white text-[#001C44] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
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
                        <div className="mb-8 bg-white rounded-3xl border border-gray-100 p-8 shadow-premium">
                            <h3 className="text-lg font-extrabold text-[#001C44] mb-6 flex items-center gap-2">
                                <span className="text-xl">🔍</span> Bộ lọc nâng cao
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Tìm kiếm bài viết</label>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tiêu đề..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Trạng thái xuất bản</label>
                                    <select
                                        value={status}
                                        onChange={(e) => { setStatus(e.target.value as any); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Danh mục</label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white font-semibold cursor-pointer"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Loại bài viết</label>
                                    <select
                                        value={articleType}
                                        onChange={(e) => { setArticleType(e.target.value as any); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white font-semibold cursor-pointer"
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end mb-6">
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white font-semibold cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                        className="w-full rounded-2xl border border-gray-300 shadow-sm bg-white/50 px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white font-semibold cursor-pointer"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex flex-wrap gap-6 py-3 px-2 bg-gray-50/50 rounded-2xl">
                                    <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#001C44] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={pinned === true}
                                            onChange={(e) => { setPinned(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                                        />
                                        Ghim
                                    </label>
                                    <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#001C44] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={featured === true}
                                            onChange={(e) => { setFeatured(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                                        />
                                        Nổi bật
                                    </label>
                                    <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#001C44] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={primary === true}
                                            onChange={(e) => { setPrimary(e.target.checked ? true : ''); setPage(0); }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                                        />
                                        Đại diện chính
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all text-sm active:scale-95"
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
                                <div className="overflow-x-auto rounded-3xl bg-white shadow-premium border border-gray-100">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase text-xs font-bold tracking-wider">
                                                <th className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleSort('title')}
                                                        className="flex items-center hover:text-[#001C44] transition-colors"
                                                    >
                                                        Tiêu đề
                                                        <SortIcon active={sort === 'title'} />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-5">Loại</th>
                                                <th className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleSort('views')}
                                                        className="flex items-center hover:text-[#001C44] transition-colors"
                                                    >
                                                        Lượt xem
                                                        <SortIcon active={sort === 'views'} />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleSort('wishlist')}
                                                        className="flex items-center hover:text-[#001C44] transition-colors"
                                                    >
                                                        Yêu thích
                                                        <SortIcon active={sort === 'wishlist'} />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleSort('date')}
                                                        className="flex items-center hover:text-[#001C44] transition-colors"
                                                    >
                                                        Ngày đăng
                                                        <SortIcon active={sort === 'date'} />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-5 text-center">Đại diện</th>
                                                <th className="px-6 py-5 text-center">
                                                    Hành động
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredSorted.map((article) => (
                                                <tr
                                                    key={article.id}
                                                    className="bg-white hover:bg-blue-50/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            {article.pinned && (
                                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold text-amber-800">
                                                                    Ghim
                                                                </span>
                                                            )}
                                                            {article.featured && (
                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold text-blue-800">
                                                                    Nổi bật
                                                                </span>
                                                            )}
                                                            {!article.published && (
                                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold text-gray-600 border border-gray-200">
                                                                    Nháp
                                                                </span>
                                                            )}
                                                            <Link
                                                                to={`/articles/${article.slug}`}
                                                                className="text-[#001C44] font-extrabold hover:text-blue-600 line-clamp-2 transition-colors"
                                                            >
                                                                {article.title}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <ArticleTypeBadge type={article.articleType} />
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-gray-700">
                                                        {article.viewCount.toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-rose-600">
                                                        {article.wishlistCount.toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-semibold tracking-wide">
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
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Link
                                                                to={`/articles/${article.slug}`}
                                                                className="text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110 active:scale-95"
                                                                title="Xem bài viết"
                                                            >
                                                                <span className="text-xl">👁️</span>
                                                            </Link>
                                                            <Link
                                                                to={`${base}/articles/${article.id}/edit`}
                                                                className="text-gray-400 hover:text-amber-500 transition-colors transform hover:scale-110 active:scale-95"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <span className="text-xl">✏️</span>
                                                            </Link>
                                                            <Link
                                                                to={`${base}/articles/${article.id}/comments`}
                                                                className="text-gray-400 hover:text-indigo-500 transition-colors transform hover:scale-110 active:scale-95"
                                                                title="Quản lý bình luận"
                                                            >
                                                                <span className="text-xl">💬</span>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {articlesPage && (
                                    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-sm border border-gray-100 sm:flex-row px-8">
                                        <div className="text-sm font-extrabold text-gray-500">Trang {articlesPage.number + 1} / {articlesPage.totalPages} <span className="mx-2 font-normal text-gray-300">|</span> Tổng <span className="text-[#001C44]">{articlesPage.totalElements}</span> bài</div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => { const prev = Math.max(0, page - 1); setPage(prev); }}
                                                disabled={page <= 0}
                                                className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                            >
                                                ← Trước
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { const next = Math.min(articlesPage.totalPages - 1, page + 1); setPage(next); }}
                                                disabled={page >= (articlesPage.totalPages - 1)}
                                                className="px-6 py-2.5 bg-[#001C44] text-[#FFD66D] rounded-2xl font-bold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
                                            >
                                                Sau →
                                            </button>
                                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="px-4 py-2.5 rounded-2xl border border-gray-300 shadow-sm bg-white/50 font-bold text-[#001C44] bg-white cursor-pointer transition-all ml-2 focus:ring-4 focus:ring-blue-100">
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

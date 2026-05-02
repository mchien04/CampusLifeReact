import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { articleAPI } from '../../services/articleAPI';
import type { DashboardAnalytics, ArticleMetrics } from '../../types/article';
import ArticleMetricsCard from '../../components/article/ArticleMetricsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#0B5FFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const ArticleAnalyticsDashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'published'>('published');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setError('');

                // Load dashboard analytics
                const dashboardResponse = await articleAPI.getDashboardAnalytics();
                if (dashboardResponse.status && dashboardResponse.body) {
                    setAnalytics(dashboardResponse.body);
                } else {
                    setError('Không tải được dữ liệu thống kê');
                }
            } catch (err: any) {
                console.error('Failed to load analytics:', err);
                setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [filter, dateRange]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF]">
                <main className="mx-auto max-w-7xl px-4 py-10">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error || 'Không tải được dữ liệu'}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F9FC] via-white to-[#EEF3FF]">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-[#001C44] mb-2">Thống kê bài viết</h1>
                    <p className="text-gray-600">Xem chi tiết hiệu quả quảng bá các sự kiện</p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'published')}
                        className="rounded-lg border border-gray-300 px-4 py-2 focus:border-[#001C44] focus:outline-none"
                    >
                        <option value="published">Bài viết đã xuất bản</option>
                        <option value="all">Tất cả bài viết</option>
                    </select>

                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-[#001C44] focus:outline-none text-sm"
                        />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-[#001C44] focus:outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="mb-10 grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Tổng lượt xem</p>
                        <p className="text-3xl font-bold text-[#001C44]">{analytics.totalViews.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Tổng yêu thích</p>
                        <p className="text-3xl font-bold text-red-600">{analytics.totalWishlists.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Bài viết xuất bản</p>
                        <p className="text-3xl font-bold text-green-600">{analytics.articlesPublished}</p>
                    </div>
                </div>

                {/* Views Trend Chart */}
                {analytics.viewsTrend.length > 0 && (
                    <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Xu hướng lượt xem</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.viewsTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#0B5FFF"
                                    name="Lượt xem"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Articles */}
                {analytics.topArticles.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Bài viết hàng đầu</h2>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {analytics.topArticles.map((article, idx) => (
                                <ArticleMetricsCard
                                    key={article.id}
                                    title={article.title}
                                    viewCount={article.viewCount}
                                    wishlistCount={article.wishlistCount}
                                    clicksToRegistration={article.clicksToRegistration}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Articles Bar Chart */}
                {analytics.topArticles.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Xếp hạng theo lượt xem</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={analytics.topArticles.slice(0, 10).map((article) => ({
                                    name: article.title.slice(0, 15),
                                    views: article.viewCount,
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="views" fill="#0B5FFF" name="Lượt xem">
                                    {analytics.topArticles.slice(0, 10).map((_, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArticleAnalyticsDashboard;

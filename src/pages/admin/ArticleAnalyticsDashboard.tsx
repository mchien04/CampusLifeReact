import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { articleAPI } from '../../services/articleAPI';
import type { ArticleStatisticsResponse } from '../../types/article';
import ArticleMetricsCard from '../../components/article/ArticleMetricsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#0B5FFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const ArticleAnalyticsDashboard: React.FC = () => {
    const [stats, setStats] = useState<ArticleStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await articleAPI.getStatistics();
                if (response.status && response.body) {
                    setStats(response.body);
                    return;
                }

                const fallback = await articleAPI.getDashboardAnalytics();
                if (fallback.status && fallback.body) {
                    setStats({
                        totalArticles: fallback.body.topArticles?.length ?? 0,
                        publishedArticles: fallback.body.articlesPublished ?? 0,
                        draftArticles: 0,
                        totalViews: fallback.body.totalViews ?? 0,
                        totalWishlists: fallback.body.totalWishlists ?? 0,
                        featuredArticles: 0,
                        pinnedArticles: 0,
                        topViewedArticles: fallback.body.topArticles as any,
                        recentlyPublished: null,
                        articlesByCategory: null,
                        articlesByMonth: null,
                    });
                    return;
                }

                setError('Không tải được dữ liệu thống kê');
            } catch (err: any) {
                console.error('Failed to load analytics:', err);
                setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="w-full">
                <main className="mx-auto max-w-7xl w-full">
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                        {error || 'Không tải được dữ liệu'}
                    </div>
                </main>
            </div>
        );
    }

    const articlesByMonthData = Object.entries(stats.articlesByMonth || {}).map(([month, count]) => ({
        month,
        count,
    }));

    const articlesByCategoryData = Object.entries(stats.articlesByCategory || {}).map(([name, value]) => ({
        name,
        value,
    }));

    const getTitle = (row: Record<string, unknown>) => String(row.title ?? row.name ?? row.slug ?? 'Bài viết');
    const getViews = (row: Record<string, unknown>) => Number(row.viewCount ?? row.views ?? 0);
    const getWishlists = (row: Record<string, unknown>) => Number(row.wishlistCount ?? row.wishlists ?? 0);

    return (
        <div className="w-full">
            <main className="mx-auto max-w-7xl w-full">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-[#001C44] mb-2">Thống kê bài viết</h1>
                    <p className="text-gray-600">Xem chi tiết hiệu quả quảng bá các sự kiện</p>
                </div>

                {/* Key Metrics */}
                <div className="mb-10 grid gap-4 grid-cols-1 sm:grid-cols-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Tổng lượt xem</p>
                        <p className="text-3xl font-bold text-[#001C44]">{stats.totalViews.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Tổng yêu thích</p>
                        <p className="text-3xl font-bold text-red-600">{stats.totalWishlists.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Tổng bài viết</p>
                        <p className="text-3xl font-bold text-[#001C44]">{stats.totalArticles}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Published / Draft</p>
                        <p className="text-3xl font-bold text-green-600">{stats.publishedArticles} <span className="text-gray-400 font-semibold">/</span> <span className="text-yellow-600">{stats.draftArticles}</span></p>
                    </div>
                </div>

                {articlesByMonthData.length > 0 && (
                    <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Số bài theo tháng</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={articlesByMonthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0B5FFF" name="Số bài" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Articles */}
                {(stats.topViewedArticles || []).length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Bài viết hàng đầu</h2>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {(stats.topViewedArticles || []).slice(0, 6).map((row, idx) => (
                                <ArticleMetricsCard
                                    key={idx}
                                    title={getTitle(row)}
                                    viewCount={getViews(row)}
                                    wishlistCount={getWishlists(row)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {articlesByCategoryData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-[#001C44] mb-4">Phân bổ theo danh mục</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie data={articlesByCategoryData} dataKey="value" nameKey="name" outerRadius={110}>
                                    {articlesByCategoryData.map((_, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArticleAnalyticsDashboard;

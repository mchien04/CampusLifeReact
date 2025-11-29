import React, { useState, useEffect } from 'react';
import { statisticsAPI } from '../../services/statisticsAPI';
import { LoadingSpinner } from '../../components/common';
import {
    DashboardStatisticsResponse,
    ActivityStatisticsResponse,
    StudentStatisticsResponse,
    ScoreStatisticsResponse,
    SeriesStatisticsResponse,
    MinigameStatisticsResponse,
    TimelineStatisticsResponse
} from '../../types/statistics';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Statistics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'students' | 'scores' | 'series' | 'minigames' | 'timeline'>('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Dashboard data
    const [dashboardData, setDashboardData] = useState<DashboardStatisticsResponse | null>(null);
    
    // Activities data
    const [activityData, setActivityData] = useState<ActivityStatisticsResponse | null>(null);
    const [activityFilters, setActivityFilters] = useState({
        activityType: '' as '' | 'SUKIEN' | 'MINIGAME' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE_DOANH_NGHIEP',
        scoreType: '' as '' | 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE',
        departmentId: '',
        startDate: '',
        endDate: ''
    });

    // Students data
    const [studentData, setStudentData] = useState<StudentStatisticsResponse | null>(null);
    const [studentFilters, setStudentFilters] = useState({
        departmentId: '',
        classId: '',
        semesterId: ''
    });

    // Scores data
    const [scoreData, setScoreData] = useState<ScoreStatisticsResponse | null>(null);
    const [scoreFilters, setScoreFilters] = useState({
        scoreType: '' as '' | 'REN_LUYEN' | 'CONG_TAC_XA_HOI' | 'CHUYEN_DE',
        semesterId: '',
        departmentId: '',
        classId: ''
    });

    // Series data
    const [seriesData, setSeriesData] = useState<SeriesStatisticsResponse | null>(null);
    const [seriesFilters, setSeriesFilters] = useState({
        seriesId: '',
        semesterId: ''
    });

    // Minigames data
    const [minigameData, setMinigameData] = useState<MinigameStatisticsResponse | null>(null);
    const [minigameFilters, setMinigameFilters] = useState({
        miniGameId: '',
        startDate: '',
        endDate: ''
    });

    // Timeline data
    const [timelineData, setTimelineData] = useState<TimelineStatisticsResponse | null>(null);
    const [timelineFilters, setTimelineFilters] = useState({
        startDate: '',
        endDate: '',
        groupBy: 'day' as 'day' | 'week' | 'month' | 'quarter' | 'year'
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadDashboardData();
        } else if (activeTab === 'activities') {
            loadActivityData();
        } else if (activeTab === 'students') {
            loadStudentData();
        } else if (activeTab === 'scores') {
            loadScoreData();
        } else if (activeTab === 'series') {
            loadSeriesData();
        } else if (activeTab === 'minigames') {
            loadMinigameData();
        } else if (activeTab === 'timeline') {
            loadTimelineData();
        }
    }, [activeTab]);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await statisticsAPI.getDashboardStatistics();
            if (response.status && response.data) {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu dashboard');
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadActivityData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (activityFilters.activityType) params.activityType = activityFilters.activityType;
            if (activityFilters.scoreType) params.scoreType = activityFilters.scoreType;
            if (activityFilters.departmentId) params.departmentId = parseInt(activityFilters.departmentId);
            if (activityFilters.startDate) params.startDate = activityFilters.startDate;
            if (activityFilters.endDate) params.endDate = activityFilters.endDate;

            const response = await statisticsAPI.getActivityStatistics(params);
            if (response.status && response.data) {
                setActivityData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu activities');
            }
        } catch (err) {
            console.error('Error loading activity data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu activities');
        } finally {
            setLoading(false);
        }
    };

    const loadStudentData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (studentFilters.departmentId) params.departmentId = parseInt(studentFilters.departmentId);
            if (studentFilters.classId) params.classId = parseInt(studentFilters.classId);
            if (studentFilters.semesterId) params.semesterId = parseInt(studentFilters.semesterId);

            const response = await statisticsAPI.getStudentStatistics(params);
            if (response.status && response.data) {
                setStudentData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu students');
            }
        } catch (err) {
            console.error('Error loading student data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu students');
        } finally {
            setLoading(false);
        }
    };

    const loadScoreData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (scoreFilters.scoreType) params.scoreType = scoreFilters.scoreType;
            if (scoreFilters.semesterId) params.semesterId = parseInt(scoreFilters.semesterId);
            if (scoreFilters.departmentId) params.departmentId = parseInt(scoreFilters.departmentId);
            if (scoreFilters.classId) params.classId = parseInt(scoreFilters.classId);

            const response = await statisticsAPI.getScoreStatistics(params);
            if (response.status && response.data) {
                setScoreData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu scores');
            }
        } catch (err) {
            console.error('Error loading score data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu scores');
        } finally {
            setLoading(false);
        }
    };

    const loadSeriesData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (seriesFilters.seriesId) params.seriesId = parseInt(seriesFilters.seriesId);
            if (seriesFilters.semesterId) params.semesterId = parseInt(seriesFilters.semesterId);

            const response = await statisticsAPI.getSeriesStatistics(params);
            if (response.status && response.data) {
                setSeriesData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu series');
            }
        } catch (err) {
            console.error('Error loading series data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu series');
        } finally {
            setLoading(false);
        }
    };

    const loadMinigameData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (minigameFilters.miniGameId) params.miniGameId = parseInt(minigameFilters.miniGameId);
            if (minigameFilters.startDate) params.startDate = minigameFilters.startDate;
            if (minigameFilters.endDate) params.endDate = minigameFilters.endDate;

            const response = await statisticsAPI.getMinigameStatistics(params);
            if (response.status && response.data) {
                setMinigameData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu minigames');
            }
        } catch (err) {
            console.error('Error loading minigame data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu minigames');
        } finally {
            setLoading(false);
        }
    };

    const loadTimelineData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (timelineFilters.startDate) params.startDate = timelineFilters.startDate;
            if (timelineFilters.endDate) params.endDate = timelineFilters.endDate;
            if (timelineFilters.groupBy) params.groupBy = timelineFilters.groupBy;

            const response = await statisticsAPI.getTimelineStatistics(params);
            if (response.status && response.data) {
                setTimelineData(response.data);
            } else {
                setError(response.message || 'Không thể tải dữ liệu timeline');
            }
        } catch (err) {
            console.error('Error loading timeline data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu timeline');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const formatPercentage = (num: number) => {
        return (num * 100).toFixed(1) + '%';
    };

    const COLORS = ['#001C44', '#002A66', '#FFD66D', '#4A90E2', '#50C878', '#FF6B6B'];

    const tabs = [
        { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
        { id: 'activities', label: 'Hoạt động', icon: '📅' },
        { id: 'students', label: 'Sinh viên', icon: '👥' },
        { id: 'scores', label: 'Điểm số', icon: '⭐' },
        { id: 'series', label: 'Chuỗi sự kiện', icon: '📋' },
        { id: 'minigames', label: 'Mini Game', icon: '🎮' },
        { id: 'timeline', label: 'Theo thời gian', icon: '📈' }
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl p-6 text-white mb-6">
                <h1 className="text-3xl font-bold mb-2">Thống kê hệ thống</h1>
                <p className="text-gray-200">Xem và phân tích dữ liệu thống kê chi tiết</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-1 px-4" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-[#001C44] text-white'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <>
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && dashboardData && (
                                <DashboardTab data={dashboardData} formatNumber={formatNumber} formatPercentage={formatPercentage} COLORS={COLORS} />
                            )}

                            {/* Activities Tab */}
                            {activeTab === 'activities' && (
                                <ActivitiesTab
                                    data={activityData}
                                    filters={activityFilters}
                                    setFilters={setActivityFilters}
                                    onApplyFilters={loadActivityData}
                                    formatNumber={formatNumber}
                                    formatPercentage={formatPercentage}
                                    COLORS={COLORS}
                                />
                            )}

                            {/* Students Tab */}
                            {activeTab === 'students' && (
                                <StudentsTab
                                    data={studentData}
                                    filters={studentFilters}
                                    setFilters={setStudentFilters}
                                    onApplyFilters={loadStudentData}
                                    formatNumber={formatNumber}
                                    COLORS={COLORS}
                                />
                            )}

                            {/* Scores Tab */}
                            {activeTab === 'scores' && (
                                <ScoresTab
                                    data={scoreData}
                                    filters={scoreFilters}
                                    setFilters={setScoreFilters}
                                    onApplyFilters={loadScoreData}
                                    formatNumber={formatNumber}
                                    COLORS={COLORS}
                                />
                            )}

                            {/* Series Tab */}
                            {activeTab === 'series' && (
                                <SeriesTab
                                    data={seriesData}
                                    filters={seriesFilters}
                                    setFilters={setSeriesFilters}
                                    onApplyFilters={loadSeriesData}
                                    formatNumber={formatNumber}
                                    formatPercentage={formatPercentage}
                                    COLORS={COLORS}
                                />
                            )}

                            {/* Minigames Tab */}
                            {activeTab === 'minigames' && (
                                <MinigamesTab
                                    data={minigameData}
                                    filters={minigameFilters}
                                    setFilters={setMinigameFilters}
                                    onApplyFilters={loadMinigameData}
                                    formatNumber={formatNumber}
                                    formatPercentage={formatPercentage}
                                    COLORS={COLORS}
                                />
                            )}

                            {/* Timeline Tab */}
                            {activeTab === 'timeline' && (
                                <TimelineTab
                                    data={timelineData}
                                    filters={timelineFilters}
                                    setFilters={setTimelineFilters}
                                    onApplyFilters={loadTimelineData}
                                    formatNumber={formatNumber}
                                    COLORS={COLORS}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Dashboard Tab Component
const DashboardTab: React.FC<{
    data: DashboardStatisticsResponse;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}> = ({ data, formatNumber, formatPercentage, COLORS }) => {
    const statsCards = [
        { name: 'Tổng hoạt động', value: data.totalActivities, icon: '📅', color: 'bg-blue-500' },
        { name: 'Tổng sinh viên', value: data.totalStudents, icon: '👥', color: 'bg-green-500' },
        { name: 'Chuỗi sự kiện', value: data.totalSeries, icon: '📋', color: 'bg-purple-500' },
        { name: 'Mini Games', value: data.totalMiniGames, icon: '🎮', color: 'bg-yellow-500' },
        { name: 'Đăng ký tháng này', value: data.monthlyRegistrations, icon: '📝', color: 'bg-indigo-500' },
        { name: 'Tham gia tháng này', value: data.monthlyParticipations, icon: '✅', color: 'bg-teal-500' },
        { name: 'Tỷ lệ tham gia', value: formatPercentage(data.averageParticipationRate), icon: '📊', color: 'bg-orange-500' }
    ];

    const topActivitiesChartData = data.topActivities.slice(0, 10).map(activity => ({
        name: activity.activityName.length > 20 ? activity.activityName.substring(0, 20) + '...' : activity.activityName,
        đăngKý: activity.registrationCount,
        thamGia: activity.participationCount
    }));

    const topStudentsChartData = data.topStudents.slice(0, 10).map(student => ({
        name: student.studentName,
        thamGia: student.participationCount
    }));

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Activities Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top hoạt động</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topActivitiesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="đăngKý" fill={COLORS[0]} />
                            <Bar dataKey="thamGia" fill={COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Students Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top sinh viên</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topStudentsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="thamGia" fill={COLORS[2]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Activities Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Top hoạt động</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hoạt động</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đăng ký</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.topActivities.slice(0, 10).map((activity) => (
                                    <tr key={activity.activityId}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{activity.activityName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(activity.registrationCount)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(activity.participationCount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Students Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Top sinh viên</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sinh viên</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SV</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.topStudents.slice(0, 10).map((student) => (
                                    <tr key={student.studentId}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{student.studentName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(student.participationCount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Activities Tab Component
const ActivitiesTab: React.FC<{
    data: ActivityStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, formatPercentage, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const countByTypeData = Object.entries(data.countByType).map(([name, value]) => ({ name, value }));
    const countByStatusData = Object.entries(data.countByStatus).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoạt động</label>
                        <select
                            value={filters.activityType}
                            onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Tất cả</option>
                            <option value="SUKIEN">Sự kiện</option>
                            <option value="MINIGAME">Mini Game</option>
                            <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                            <option value="CHUYEN_DE_DOANH_NGHIEP">Chuyên đề doanh nghiệp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại điểm</label>
                        <select
                            value={filters.scoreType}
                            onChange={(e) => setFilters({ ...filters, scoreType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Tất cả</option>
                            <option value="REN_LUYEN">Rèn luyện</option>
                            <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                            <option value="CHUYEN_DE">Chuyên đề</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Tổng hoạt động</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalActivities)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Trong chuỗi</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(data.activitiesInSeries)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Độc lập</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(data.standaloneActivities)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo loại</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={countByTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {countByTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo trạng thái</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={countByStatusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Activities Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Top hoạt động theo đăng ký</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hoạt động</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đăng ký</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham gia</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.topActivitiesByRegistrations.slice(0, 10).map((activity) => (
                                <tr key={activity.activityId}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{activity.activityName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(activity.registrationCount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(activity.participationCount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatPercentage(activity.participationCount / activity.registrationCount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Students Tab Component
const StudentsTab: React.FC<{
    data: StudentStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const countByDepartmentData = Object.entries(data.countByDepartment).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                        <input
                            type="text"
                            value={filters.departmentId}
                            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                            placeholder="ID khoa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                        <input
                            type="text"
                            value={filters.classId}
                            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                            placeholder="ID lớp"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Tổng sinh viên</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.totalStudents)}</p>
            </div>

            {/* Charts */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố theo khoa</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countByDepartmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS[0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Participants */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Top tham gia</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SV</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.topParticipants.slice(0, 10).map((student) => (
                                    <tr key={student.studentId}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{student.studentName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(student.participationCount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inactive Students */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Sinh viên không hoạt động</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SV</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.inactiveStudents.slice(0, 10).map((student) => (
                                    <tr key={student.studentId}>
                                        <td className="px-4 py-3 text-sm text-gray-900">{student.studentName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Scores Tab Component
const ScoresTab: React.FC<{
    data: ScoreStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const scoreDistributionData = Object.entries(data.scoreDistribution).map(([range, count]) => ({
        range,
        count
    }));

    const averageByDepartmentData = Object.entries(data.averageByDepartment).map(([name, value]) => ({
        name,
        value: Number(value)
    }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại điểm</label>
                        <select
                            value={filters.scoreType}
                            onChange={(e) => setFilters({ ...filters, scoreType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Tất cả</option>
                            <option value="REN_LUYEN">Rèn luyện</option>
                            <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                            <option value="CHUYEN_DE">Chuyên đề</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                        <input
                            type="text"
                            value={filters.departmentId}
                            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                            placeholder="ID khoa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats by Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(data.statisticsByType).map(([type, stats]) => (
                    <div key={type} className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">{type}</p>
                        <p className="text-xl font-bold text-gray-900">TB: {stats.averageScore.toFixed(1)}</p>
                        <p className="text-sm text-gray-500">Max: {stats.maxScore} | Min: {stats.minScore}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố điểm</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scoreDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Điểm TB theo khoa</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={averageByDepartmentData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Students Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Top sinh viên</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SV</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại điểm</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.topStudents.slice(0, 10).map((student, index) => (
                                <tr key={`${student.studentId}-${index}`}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{student.studentName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{student.studentCode}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{student.scoreType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{student.score.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Series Tab Component
const SeriesTab: React.FC<{
    data: SeriesStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, formatPercentage, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const studentsPerSeriesData = Object.entries(data.studentsPerSeries).map(([name, value]) => ({
        name: `Series ${name}`,
        value: Number(value)
    }));

    const completionRatesData = data.seriesDetails.map(series => ({
        name: series.seriesName.length > 15 ? series.seriesName.substring(0, 15) + '...' : series.seriesName,
        value: series.completionRate * 100
    }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Series ID</label>
                        <input
                            type="text"
                            value={filters.seriesId}
                            onChange={(e) => setFilters({ ...filters, seriesId: e.target.value })}
                            placeholder="ID series"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
                        <input
                            type="text"
                            value={filters.semesterId}
                            onChange={(e) => setFilters({ ...filters, semesterId: e.target.value })}
                            placeholder="ID học kỳ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Tổng chuỗi sự kiện</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.totalSeries)}</p>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sinh viên theo series</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={studentsPerSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tỷ lệ hoàn thành</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={completionRatesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Series Details Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Chi tiết series</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên series</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt động</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đăng ký</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoàn thành</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.seriesDetails.map((series) => (
                                <tr key={series.seriesId}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{series.seriesName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(series.totalActivities)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(series.registeredStudents)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(series.completedStudents)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatPercentage(series.completionRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Minigames Tab Component
const MinigamesTab: React.FC<{
    data: MinigameStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, formatPercentage, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const passRateData = [
        { name: 'Đạt', value: data.passedAttempts },
        { name: 'Không đạt', value: data.failedAttempts }
    ];

    const averageScoreData = Object.entries(data.averageScoreByMiniGame).slice(0, 10).map(([name, value]) => ({
        name: `Game ${name}`,
        value: Number(value)
    }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mini Game ID</label>
                        <input
                            type="text"
                            value={filters.miniGameId}
                            onChange={(e) => setFilters({ ...filters, miniGameId: e.target.value })}
                            placeholder="ID minigame"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Tổng Mini Games</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalMiniGames)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Tổng lượt thử</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalAttempts)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Đạt</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(data.passedAttempts)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Tỷ lệ đạt</p>
                    <p className="text-2xl font-bold text-blue-600">{formatPercentage(data.passRate)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tỷ lệ đạt/không đạt</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={passRateData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {passRateData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS[2] : COLORS[5]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Điểm TB theo minigame</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={averageScoreData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Popular Minigames Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Mini Game phổ biến</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lượt thử</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinh viên</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.popularMiniGames.slice(0, 10).map((game) => (
                                <tr key={game.miniGameId}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{game.title}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(game.attemptCount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(game.uniqueStudentCount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Timeline Tab Component
const TimelineTab: React.FC<{
    data: TimelineStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    COLORS: string[];
}> = ({ data, filters, setFilters, onApplyFilters, formatNumber, COLORS }) => {
    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có dữ liệu. Vui lòng áp dụng bộ lọc để xem thống kê.</p>
            </div>
        );
    }

    const registrationsData = data.registrationsOverTime.map(item => ({
        period: item.period,
        value: item.count || 0
    }));

    const participationsData = data.participationsOverTime.map(item => ({
        period: item.period,
        value: item.count || 0
    }));

    const scoresData = data.scoresOverTime.map(item => ({
        period: item.period,
        value: item.value || 0
    }));

    const peakHoursData = Object.entries(data.peakHours).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count: Number(count)
    }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm theo</label>
                        <select
                            value={filters.groupBy}
                            onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="day">Ngày</option>
                            <option value="week">Tuần</option>
                            <option value="month">Tháng</option>
                            <option value="quarter">Quý</option>
                            <option value="year">Năm</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-4 py-2 rounded-md hover:bg-[#002A66] transition-colors"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Đăng ký theo thời gian</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={registrationsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tham gia theo thời gian</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={participationsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke={COLORS[1]} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Điểm số theo thời gian</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoresData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Giờ cao điểm</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={peakHoursData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill={COLORS[3]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Statistics;


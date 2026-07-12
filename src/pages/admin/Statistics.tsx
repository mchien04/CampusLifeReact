import React, { useState, useEffect } from 'react';
import { statisticsAPI } from '../../services/statisticsAPI';
import { LoadingSpinner } from '../../components/common';
import {
    DashboardStatisticsResponse,
    ActivityStatisticsResponse,
    StudentStatisticsResponse,
    ScoreStatisticsResponse,
    SeriesStatisticsResponse,
    MinigameStatisticsResponse
} from '../../types/statistics';

// Import newly refactored tabs
import { DashboardTab } from '../../components/admin/statistics/DashboardTab';
import { ActivitiesTab } from '../../components/admin/statistics/ActivitiesTab';
import { StudentsTab } from '../../components/admin/statistics/StudentsTab';
import { ScoresTab } from '../../components/admin/statistics/ScoresTab';
import { SeriesTab } from '../../components/admin/statistics/SeriesTab';
import { MinigamesTab } from '../../components/admin/statistics/MinigamesTab';

import { ChartPieSlice, CalendarBlank, Users, Star, ListChecks, GameController } from '@phosphor-icons/react';

const Statistics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'students' | 'scores' | 'series' | 'minigames'>('dashboard');
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
                setError(response.message || 'Không thể tải dữ liệu hoạt động');
            }
        } catch (err) {
            console.error('Error loading activity data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu hoạt động');
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
                setError(response.message || 'Không thể tải dữ liệu sinh viên');
            }
        } catch (err) {
            console.error('Error loading student data:', err);
            setError('Có lỗi xảy ra khi tải dữ liệu sinh viên');
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

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const formatPercentage = (num: number) => {
        return (num * 100).toFixed(1) + '%';
    };

    // Modern harmonious color palette
    const COLORS = ['#001C44', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

    const tabs = [
        { id: 'dashboard', label: 'Tổng quan', icon: ChartPieSlice },
        { id: 'activities', label: 'Hoạt động', icon: CalendarBlank },
        { id: 'students', label: 'Sinh viên', icon: Users },
        { id: 'scores', label: 'Điểm số', icon: Star },
        { id: 'series', label: 'Chuỗi sự kiện', icon: ListChecks },
        { id: 'minigames', label: 'Mini Game', icon: GameController },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="relative overflow-hidden bg-[#001C44] rounded-2xl p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 animate-blob"></div>
                <div className="absolute bottom-0 right-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <ChartPieSlice weight="duotone" className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1 tracking-tight">Thống kê hệ thống</h1>
                            <p className="text-blue-100 text-lg">Xem và phân tích dữ liệu toàn diện</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Premium Tab Navigation */}
                <div className="border-b border-gray-100 bg-gray-50/50 p-2 sm:p-4">
                    <nav className="flex space-x-2 overflow-x-auto no-scrollbar" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap
                                        ${isActive 
                                            ? 'bg-white text-[#001C44] shadow-sm ring-1 ring-gray-200' 
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                        }
                                    `}
                                >
                                    <Icon weight={isActive ? "bold" : "regular"} className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 sm:p-8 min-h-[500px]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 text-[#001C44]">
                            <LoadingSpinner size="large" />
                            <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {activeTab === 'dashboard' && dashboardData && (
                                <DashboardTab data={dashboardData} formatNumber={formatNumber} formatPercentage={formatPercentage} COLORS={COLORS} />
                            )}

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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;

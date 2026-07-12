import React from 'react';
import { DashboardStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    CalendarBlank, Users, ListChecks, GameController, NotePencil, CheckCircle, ChartLineUp, Medal
} from '@phosphor-icons/react';

interface DashboardTabProps {
    data: DashboardStatisticsResponse;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ data, formatNumber, formatPercentage, COLORS }) => {
    const statsCards = [
        { name: 'Tổng hoạt động', value: data.totalActivities, icon: CalendarBlank, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Tổng sinh viên', value: data.totalStudents, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
        { name: 'Chuỗi sự kiện', value: data.totalSeries, icon: ListChecks, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Mini Games', value: data.totalMiniGames, icon: GameController, color: 'text-orange-600', bg: 'bg-orange-50' },
        { name: 'Đăng ký tháng này', value: data.monthlyRegistrations, icon: NotePencil, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Tham gia tháng này', value: data.monthlyParticipations, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
        { name: 'Tỷ lệ tham gia', value: formatPercentage(data.averageParticipationRate), icon: ChartLineUp, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    const topActivitiesChartData = data.topActivities.slice(0, 10).map(activity => ({
        name: activity.activityName.length > 20 ? activity.activityName.substring(0, 20) + '...' : activity.activityName,
        đăngKý: activity.registrationCount,
        thamGia: activity.participationCount
    }));

    // Beautiful tooltip styles
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            {entry.name}: {formatNumber(entry.value)}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8">
            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-premium transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon weight="duotone" className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.name}</p>
                                    <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                        {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Activities Chart */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <ChartLineUp weight="bold" className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Top sự kiện nổi bật</h3>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topActivitiesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80} 
                                    stroke="#9ca3af" 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    stroke="#9ca3af" 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar dataKey="đăngKý" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="thamGia" fill="#FFD66D" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Students List */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Medal weight="bold" className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Top sinh viên tích cực</h3>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                        <div className="space-y-3">
                            {data.topStudents.slice(0, 8).map((student, index) => (
                                <div key={student.studentId} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                            index === 1 ? 'bg-gray-200 text-gray-700 border border-gray-300' :
                                            index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-white text-gray-500 border border-gray-100'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{student.studentName}</p>
                                            <p className="text-xs text-gray-500 font-medium">{student.studentCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">
                                            {formatNumber(student.participationCount)}
                                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Lần</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

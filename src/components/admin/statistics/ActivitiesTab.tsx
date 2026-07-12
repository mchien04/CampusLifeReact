import React from 'react';
import { ActivityStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CalendarPlus, ListChecks, Star, Funnel, CalendarBlank } from '@phosphor-icons/react';

interface ActivitiesTabProps {
    data: ActivityStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ 
    data, filters, setFilters, onApplyFilters, formatNumber, formatPercentage, COLORS 
}) => {
    
    // Beautiful tooltip styles for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color || entry.fill }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
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
            {/* Filter Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Funnel className="text-blue-600 w-5 h-5" weight="bold" />
                    <h3 className="text-lg font-bold text-gray-900">Bộ lọc thống kê</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Loại hoạt động</label>
                        <select
                            value={filters.activityType}
                            onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 font-medium appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                        >
                            <option value="">Tất cả các loại</option>
                            <option value="SUKIEN">Sự kiện</option>
                            <option value="MINIGAME">Mini Game</option>
                            <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                            <option value="CHUYEN_DE_DOANH_NGHIEP">Chuyên đề doanh nghiệp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Loại điểm</label>
                        <select
                            value={filters.scoreType}
                            onChange={(e) => setFilters({ ...filters, scoreType: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 font-medium appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                        >
                            <option value="">Tất cả các loại điểm</option>
                            <option value="REN_LUYEN">Điểm rèn luyện</option>
                            <option value="CONG_TAC_XA_HOI">Điểm công tác xã hội</option>
                            <option value="CHUYEN_DE">Điểm chuyên đề</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-[#001C44] text-white px-6 py-2.5 rounded-xl hover:bg-blue-900 transition-all duration-300 shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
                        >
                            <Funnel weight="bold" className="w-4 h-4" />
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {!data ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <CalendarBlank weight="duotone" className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Chưa có dữ liệu</p>
                    <p className="text-gray-500 text-sm">Vui lòng chọn bộ lọc và nhấn Áp dụng để xem thống kê.</p>
                </div>
            ) : (
                <>
                    {/* Stats Summary Bento */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <CalendarPlus weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tổng hoạt động</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.totalActivities)}</p>
                        </div>
                        
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <ListChecks weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Trong chuỗi sự kiện</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.activitiesInSeries)}</p>
                        </div>
                        
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Star weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hoạt động độc lập</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.standaloneActivities)}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Phân bố theo loại hoạt động
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(data.countByType).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {Object.entries(data.countByType).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Custom Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {Object.entries(data.countByType).map(([name, value], index) => (
                                    <div key={name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium text-gray-700">{name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                                Phân bố theo trạng thái
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(data.countByStatus).map(([name, value]) => ({ name, value }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#9ca3af" 
                                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            stroke="#9ca3af" 
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip cursor={{ fill: '#f9fafb' }} content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="#001C44" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                            {
                                                Object.entries(data.countByStatus).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Activities Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm">
                                <Star weight="fill" className="w-4 h-4 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Top hoạt động theo lượt đăng ký</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                                        <th className="px-6 py-4">Tên hoạt động</th>
                                        <th className="px-6 py-4 text-right">Lượt đăng ký</th>
                                        <th className="px-6 py-4 text-right">Lượt tham gia</th>
                                        <th className="px-6 py-4 text-right">Tỷ lệ tham gia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.topActivitiesByRegistrations.slice(0, 10).map((activity, index) => {
                                        const rate = activity.registrationCount > 0 ? (activity.participationCount / activity.registrationCount) : 0;
                                        return (
                                            <tr key={activity.activityId} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-bold text-gray-400 text-sm w-4">{index + 1}</div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{activity.activityName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                    {formatNumber(activity.registrationCount)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                    {formatNumber(activity.participationCount)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        rate >= 0.8 ? 'bg-green-100 text-green-700' :
                                                        rate >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {formatPercentage(rate)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

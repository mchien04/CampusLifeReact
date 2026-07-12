import React from 'react';
import { SeriesStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ListChecks, Users, Funnel, Medal, ChartLineUp, CheckCircle } from '@phosphor-icons/react';

interface SeriesTabProps {
    data: SeriesStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}

export const SeriesTab: React.FC<SeriesTabProps> = ({ 
    data, filters, setFilters, onApplyFilters, formatNumber, formatPercentage, COLORS 
}) => {
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color || entry.fill }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                            {entry.name}: {typeof entry.value === 'number' && entry.name === 'Tỷ lệ' ? formatPercentage(entry.value / 100) : formatNumber(entry.value)}
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
                    <h3 className="text-lg font-bold text-gray-900">Bộ lọc chuỗi sự kiện</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Series ID</label>
                        <input
                            type="text"
                            value={filters.seriesId}
                            onChange={(e) => setFilters({ ...filters, seriesId: e.target.value })}
                            placeholder="Nhập ID series..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 font-medium placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Học kỳ</label>
                        <input
                            type="text"
                            value={filters.semesterId}
                            onChange={(e) => setFilters({ ...filters, semesterId: e.target.value })}
                            placeholder="Nhập ID học kỳ..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 font-medium placeholder:text-gray-400"
                        />
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
                        <ListChecks weight="duotone" className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Chưa có dữ liệu</p>
                    <p className="text-gray-500 text-sm">Vui lòng chọn bộ lọc và nhấn Áp dụng để xem thống kê.</p>
                </div>
            ) : (
                <>
                    {/* Stats Summary */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:scale-110 transition-transform duration-500">
                            <ListChecks weight="fill" className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                <ListChecks weight="duotone" className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Tổng chuỗi sự kiện</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.totalSeries)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Students Per Series */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Số lượng sinh viên tham gia theo series
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(data.studentsPerSeries).map(([name, value]) => ({ name: `Series ${name}`, Số_lượng: Number(value) }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
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
                                        <Bar dataKey="Số_lượng" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                            {
                                                Object.entries(data.studentsPerSeries).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Completion Rates */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                                Tỷ lệ hoàn thành series
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.seriesDetails.map(series => ({ name: series.seriesName.length > 15 ? series.seriesName.substring(0, 15) + '...' : series.seriesName, Tỷ_lệ: series.completionRate * 100 }))} margin={{ top: 20, right: 30, left: -20, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
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
                                        <Bar dataKey="Tỷ_lệ" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Series Details Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-200 text-purple-600 rounded-lg shadow-sm">
                                <ChartLineUp weight="bold" className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Chi tiết thống kê chuỗi sự kiện</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                                        <th className="px-6 py-4">Tên series</th>
                                        <th className="px-6 py-4 text-right">Số hoạt động</th>
                                        <th className="px-6 py-4 text-right">Sinh viên đăng ký</th>
                                        <th className="px-6 py-4 text-right">Sinh viên hoàn thành</th>
                                        <th className="px-6 py-4 text-center">Tỷ lệ hoàn thành</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.seriesDetails.map((series) => {
                                        const rate = series.completionRate;
                                        return (
                                            <tr key={series.seriesId} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gray-100 text-gray-500 rounded-md">
                                                            <ListChecks weight="bold" className="w-3 h-3" />
                                                        </div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{series.seriesName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                    {formatNumber(series.totalActivities)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-600 flex items-center justify-end gap-1.5">
                                                    <Users className="text-gray-400" />
                                                    {formatNumber(series.registeredStudents)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <CheckCircle className="text-green-500" />
                                                        {formatNumber(series.completedStudents)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
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

import React from 'react';
import { ScoreStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Star, TrendUp, Funnel, Medal, Exam } from '@phosphor-icons/react';

interface ScoresTabProps {
    data: ScoreStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    COLORS: string[];
}

export const ScoresTab: React.FC<ScoresTabProps> = ({ 
    data, filters, setFilters, onApplyFilters, formatNumber, COLORS 
}) => {
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color || entry.fill }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                            Giá trị: {typeof entry.value === 'number' && !Number.isInteger(entry.value) ? entry.value.toFixed(2) : formatNumber(entry.value)}
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
                    <h3 className="text-lg font-bold text-gray-900">Bộ lọc điểm số</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Khoa</label>
                        <input
                            type="text"
                            value={filters.departmentId}
                            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                            placeholder="Nhập ID khoa..."
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
                        <Star weight="duotone" className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Chưa có dữ liệu</p>
                    <p className="text-gray-500 text-sm">Vui lòng chọn bộ lọc và nhấn Áp dụng để xem thống kê.</p>
                </div>
            ) : (
                <>
                    {/* Stats by Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(data.statisticsByType).map(([type, stats], index) => {
                            const icons = [Star, TrendUp, Exam];
                            const colors = ['text-yellow-600', 'text-blue-600', 'text-purple-600'];
                            const bgs = ['bg-yellow-50', 'bg-blue-50', 'bg-purple-50'];
                            const borderColors = ['border-yellow-200', 'border-blue-200', 'border-purple-200'];
                            
                            const Icon = icons[index % icons.length];
                            
                            return (
                                <div key={type} className={`bg-white border ${borderColors[index % borderColors.length]} rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 ${bgs[index % bgs.length]} ${colors[index % colors.length]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon weight="duotone" className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">{type}</p>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-sm font-medium text-gray-500 mr-2">Điểm trung bình:</span>
                                        <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.averageScore.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                                            <TrendUp weight="bold" />
                                            Max: {stats.maxScore}
                                        </div>
                                        <div className="text-gray-400">|</div>
                                        <div className="flex items-center gap-1 text-red-500 font-semibold">
                                            <TrendUp weight="bold" className="rotate-180" />
                                            Min: {stats.minScore}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Distribution */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                                Phân bố điểm số
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(data.scoreDistribution).map(([range, count]) => ({ range, count }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="range" 
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
                                        <Bar dataKey="count" fill="#eab308" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                            {
                                                Object.entries(data.scoreDistribution).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Average by Department */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Điểm trung bình theo khoa
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(data.averageByDepartment).map(([name, value]) => ({ name, value: Number(value) }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
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
                                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Students Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-200 text-yellow-600 rounded-lg shadow-sm">
                                <Medal weight="fill" className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Top sinh viên xuất sắc</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                                        <th className="px-6 py-4">Sinh viên</th>
                                        <th className="px-6 py-4">Mã số</th>
                                        <th className="px-6 py-4">Loại điểm</th>
                                        <th className="px-6 py-4 text-right">Điểm số</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.topStudents.slice(0, 10).map((student, index) => (
                                        <tr key={`${student.studentId}-${index}`} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                                        index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                        index === 1 ? 'bg-gray-200 text-gray-700 border border-gray-300' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        'bg-white text-gray-500 border border-gray-100'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{student.studentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-500">
                                                {student.studentCode}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                                                    {student.scoreType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-blue-600 text-lg">
                                                    {student.score.toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

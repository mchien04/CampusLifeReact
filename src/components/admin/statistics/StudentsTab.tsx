import React from 'react';
import { StudentStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { UsersThree, Medal, UserMinus, Funnel, Users } from '@phosphor-icons/react';

interface StudentsTabProps {
    data: StudentStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    COLORS: string[];
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ 
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
                            Số lượng: {formatNumber(entry.value)}
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
                    <h3 className="text-lg font-bold text-gray-900">Bộ lọc sinh viên</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lớp</label>
                        <input
                            type="text"
                            value={filters.classId}
                            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                            placeholder="Nhập ID lớp..."
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
                        <Users weight="duotone" className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Chưa có dữ liệu</p>
                    <p className="text-gray-500 text-sm">Vui lòng chọn bộ lọc và nhấn Áp dụng để xem thống kê.</p>
                </div>
            ) : (
                <>
                    {/* Stats Summary */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute -right-6 -top-6 text-green-500/5 group-hover:scale-110 transition-transform duration-500">
                            <UsersThree weight="fill" className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                <UsersThree weight="duotone" className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Tổng sinh viên theo bộ lọc</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.totalStudents)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                            Phân bố sinh viên theo khoa
                        </h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Object.entries(data.countByDepartment).map(([name, value]) => ({ name, value }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
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
                                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {
                                            Object.entries(data.countByDepartment).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Top Participants */}
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col h-[500px]">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                                <div className="p-2 bg-white border border-gray-200 text-yellow-600 rounded-lg shadow-sm">
                                    <Medal weight="fill" className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Top sinh viên tham gia năng nổ</h3>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            <th className="px-6 py-3 border-b border-gray-100">Sinh viên</th>
                                            <th className="px-6 py-3 border-b border-gray-100 text-right">Mã số</th>
                                            <th className="px-6 py-3 border-b border-gray-100 text-right">Số lần tham gia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.topParticipants.slice(0, 10).map((student, index) => (
                                            <tr key={student.studentId} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-50 text-gray-400'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{student.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-500">
                                                    {student.studentCode}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                        {formatNumber(student.participationCount)} lần
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Inactive Students */}
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col h-[500px]">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                                <div className="p-2 bg-white border border-gray-200 text-red-500 rounded-lg shadow-sm">
                                    <UserMinus weight="bold" className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Sinh viên chưa tham gia hoạt động nào</h3>
                            </div>
                            <div className="flex-1 overflow-auto p-2">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            <th className="px-6 py-3 border-b border-gray-100">Sinh viên</th>
                                            <th className="px-6 py-3 border-b border-gray-100 text-right">Mã số</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.inactiveStudents.slice(0, 10).map((student) => (
                                            <tr key={student.studentId} className="hover:bg-red-50/50 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                        <span className="font-semibold text-gray-900">{student.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-500">
                                                    {student.studentCode}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

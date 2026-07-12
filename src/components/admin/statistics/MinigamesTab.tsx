import React from 'react';
import { MinigameStatisticsResponse } from '../../../types/statistics';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { GameController, Funnel, ArrowsClockwise, CheckCircle, ChartLineUp, Fire, Trophy } from '@phosphor-icons/react';

interface MinigamesTabProps {
    data: MinigameStatisticsResponse | null;
    filters: any;
    setFilters: any;
    onApplyFilters: () => void;
    formatNumber: (num: number) => string;
    formatPercentage: (num: number) => string;
    COLORS: string[];
}

export const MinigamesTab: React.FC<MinigamesTabProps> = ({ 
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
                            {entry.name}: {typeof entry.value === 'number' && !Number.isInteger(entry.value) ? entry.value.toFixed(1) : formatNumber(entry.value)}
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
                    <h3 className="text-lg font-bold text-gray-900">Bộ lọc Mini Game</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mini Game ID</label>
                        <input
                            type="text"
                            value={filters.miniGameId}
                            onChange={(e) => setFilters({ ...filters, miniGameId: e.target.value })}
                            placeholder="Nhập ID mini game..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 font-medium placeholder:text-gray-400"
                        />
                    </div>
                    {/* Add start/end dates if needed, but the original code had them in state, just omitted from UI inputs */}
                    <div className="md:col-span-2 flex items-end justify-end">
                        <button
                            onClick={onApplyFilters}
                            className="w-full md:w-auto bg-[#001C44] text-white px-8 py-2.5 rounded-xl hover:bg-blue-900 transition-all duration-300 shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
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
                        <GameController weight="duotone" className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">Chưa có dữ liệu</p>
                    <p className="text-gray-500 text-sm">Vui lòng chọn bộ lọc và nhấn Áp dụng để xem thống kê.</p>
                </div>
            ) : (
                <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <GameController weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng Mini Games</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.totalMiniGames)}</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <ArrowsClockwise weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng lượt thử</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">{formatNumber(data.totalAttempts)}</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lượt thử đạt</p>
                            </div>
                            <p className="text-4xl font-black text-green-600 tracking-tight">{formatNumber(data.passedAttempts)}</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-premium transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <ChartLineUp weight="duotone" className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tỷ lệ đạt chung</p>
                            </div>
                            <p className="text-4xl font-black text-indigo-600 tracking-tight">{formatPercentage(data.passRate)}</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pass Rate Chart */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                                Tỷ lệ Đạt / Không đạt (Lượt thử)
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Đạt', value: data.passedAttempts },
                                                { name: 'Không đạt', value: data.failedAttempts }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                            <Cell fill="#f43f5e" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                                    <span className="text-sm font-semibold text-gray-700">Đạt ({formatNumber(data.passedAttempts)})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
                                    <span className="text-sm font-semibold text-gray-700">Không đạt ({formatNumber(data.failedAttempts)})</span>
                                </div>
                            </div>
                        </div>

                        {/* Average Score Bar Chart */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-premium transition-all duration-300">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Điểm trung bình theo Mini Game (Top 10)
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(data.averageScoreByMiniGame).slice(0, 10).map(([name, value]) => ({ name: name, Điểm_TB: Number(value) }))} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
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
                                        <Bar dataKey="Điểm_TB" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Popular Minigames Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                            <div className="p-2 bg-white border border-gray-200 text-orange-500 rounded-lg shadow-sm">
                                <Fire weight="fill" className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Mini Game phổ biến nhất</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                                        <th className="px-6 py-4">Tên Mini Game</th>
                                        <th className="px-6 py-4 text-right">Lượt thử</th>
                                        <th className="px-6 py-4 text-right">Sinh viên tham gia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.popularMiniGames.slice(0, 10).map((game, index) => (
                                        <tr key={game.miniGameId} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        index === 0 ? 'bg-orange-100 text-orange-600' :
                                                        index === 1 ? 'bg-gray-100 text-gray-600' :
                                                        index === 2 ? 'bg-orange-50 text-orange-400' :
                                                        'bg-gray-50 text-gray-400'
                                                    }`}>
                                                        {index < 3 ? <Trophy weight="fill" className="w-4 h-4" /> : index + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{game.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                {formatNumber(game.attemptCount)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                                                    {formatNumber(game.uniqueStudentCount)}
                                                </div>
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

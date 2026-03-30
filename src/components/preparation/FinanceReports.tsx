import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinanceOverviewReportDto, CashFlowReportDto } from '../../types';

type FinanceReportsProps = {
    loading: boolean;
    financeOverview: FinanceOverviewReportDto | null;
    cashFlowReport: CashFlowReportDto | null;
};

const COLORS = ['#001C44', '#002A66', '#FFD66D', '#FFC947', '#4CAF50', '#F44336', '#9C27B0', '#FF9800', '#03A9F4', '#00BCD4'];

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
function formatMoney(amount: string | number) {
    const n = Number(amount);
    if (Number.isFinite(n)) return currencyFormatter.format(n);
    return amount.toString();
}

export default function FinanceReports({ loading, financeOverview, cashFlowReport }: FinanceReportsProps) {
    const hasData = useMemo(() => {
        if (!financeOverview || !cashFlowReport) return false;
        const totalBudget = Number(financeOverview.totalBudget);
        return totalBudget > 0;
    }, [financeOverview, cashFlowReport]);

    const walletPieData = useMemo(() => {
        if (!financeOverview) return [];
        const wallets = Array.isArray(financeOverview.wallets) ? financeOverview.wallets : [];
        return wallets
            .map(w => ({
                name: w.name || 'Unknown Wallet',
                value: Number(w.allocatedAmount)
            }))
            .filter(d => d.value > 0);
    }, [financeOverview]);

    const taskRenderData = useMemo(() => {
        if (!financeOverview) return [];
        const tasks = Array.isArray(financeOverview.tasks) ? financeOverview.tasks : [];
        return tasks.map(t => {
            const taskTitle = t.taskTitle || 'Untitled Task';
            return {
            name: taskTitle.length > 15 ? taskTitle.slice(0, 15) + '...' : taskTitle,
            fullTitle: taskTitle,
            allocated: Number(t.allocatedAmount),
            spent: Number(t.approvedSpent)
        };
        });
    }, [financeOverview]);

    if (loading) {
        return <div className="text-sm text-gray-500 mb-6">Đang tải biểu đồ báo cáo...</div>;
    }

    if (!hasData || !financeOverview || !cashFlowReport) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-semibold text-gray-900 mb-2">{payload[0]?.payload?.fullTitle || label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {entry.name}: {formatMoney(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p className="text-[#001C44]">{formatMoney(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mb-6 space-y-6">
            <h2 className="text-lg font-semibold text-[#001C44]">Báo cáo tài chính (Reports)</h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Wallet Distribution Chart */}
                <div className="card">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700">Phân bổ ngân sách theo ví (Wallets)</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                        {walletPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={walletPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {walletPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right"
                                        wrapperStyle={{ fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex bg-gray-50 items-center justify-center h-full text-sm text-gray-500 rounded-lg">Không có dữ liệu ví ngân sách</div>
                        )}
                    </div>
                </div>

                {/* Task Value Chart */}
                <div className="card">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700">Tình hình chi tiêu theo Task</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                        {taskRenderData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={taskRenderData}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#E5E7EB' }}
                                    />
                                    <YAxis 
                                        tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="allocated" name="Được cấp (Allocated)" fill="#FFD66D" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="spent" name="Đã duyệt (Spent)" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex bg-gray-50 items-center justify-center h-full text-sm text-gray-500 rounded-lg">Không có task tài chính</div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="financial-stat-card border border-[#002A66]">
                    <div className="text-xs text-[#FFD66D] font-medium uppercase mb-1">Tổng ngân sách</div>
                    <div className="financial-stat-value text-white">{formatMoney(financeOverview.totalBudget)}</div>
                </div>
                <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-green-700 font-medium uppercase mb-1">Đã chi (Approve Spent)</div>
                    <div className="text-xl font-bold text-green-900">{formatMoney(financeOverview.totalApprovedSpent)}</div>
                </div>
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                    <div className="text-xs text-orange-700 font-medium uppercase mb-1">Đã cấp cho Tasks</div>
                    <div className="text-xl font-bold text-orange-900">{formatMoney(financeOverview.totalAllocatedToTasks)}</div>
                </div>
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                    <div className="text-xs text-blue-700 font-medium uppercase mb-1">Tiền mặt trong ví</div>
                    <div className="text-xl font-bold text-blue-900">{formatMoney(cashFlowReport.cashInsideWallet)}</div>
                </div>
            </div>
        </div>
    );
}

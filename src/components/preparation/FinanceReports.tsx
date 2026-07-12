import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartPie, SpinnerGap, Wallet, CurrencyCircleDollar, TrendUp, Coins } from '@phosphor-icons/react';
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
            const taskTitle = t.title || t.taskTitle || 'Untitled Task';
            return {
            name: taskTitle.length > 15 ? taskTitle.slice(0, 15) + '...' : taskTitle,
            fullTitle: taskTitle,
            allocated: Number(t.allocatedAmount),
            spent: Number(t.approvedSpent)
        };
        });
    }, [financeOverview]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 py-4">
                <SpinnerGap size={18} className="animate-spin text-primary-900/40" />
                Đang tải biểu đồ báo cáo...
            </div>
        );
    }

    if (!hasData || !financeOverview || !cashFlowReport) {
        return null;
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm shadow-premium">
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
                <div className="rounded-xl border border-gray-100 bg-white p-2 text-sm shadow-premium">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p className="text-primary-900 tabular-nums">{formatMoney(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mb-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
                    <ChartPie size={22} weight="duotone" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-primary-900">Báo cáo tài chính</h2>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Wallet size={18} weight="duotone" className="text-primary-900" />
                        <h3 className="text-sm font-semibold text-gray-700">Phân bổ ngân sách theo ví</h3>
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
                            <div className="flex items-center justify-center h-full rounded-xl bg-gray-50/80 text-sm text-gray-500">
                                Không có dữ liệu ví ngân sách
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <TrendUp size={18} weight="duotone" className="text-primary-900" />
                        <h3 className="text-sm font-semibold text-gray-700">Tình hình chi tiêu theo nhiệm vụ</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                        {taskRenderData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={taskRenderData}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
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
                                    <Bar dataKey="allocated" name="Được cấp" fill="#FFD66D" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="spent" name="Đã duyệt" fill="#001C44" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full rounded-xl bg-gray-50/80 text-sm text-gray-500">
                                Không có nhiệm vụ tài chính
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-primary-900/20 bg-primary-900 p-5 text-white shadow-premium">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/90 mb-2">
                        <CurrencyCircleDollar size={16} weight="duotone" />
                        Tổng ngân sách
                    </div>
                    <div className="text-xl font-bold tabular-nums">{formatMoney(financeOverview.totalBudget)}</div>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                        <TrendUp size={16} weight="duotone" />
                        Đã chi (duyệt)
                    </div>
                    <div className="text-xl font-bold text-emerald-900 tabular-nums">{formatMoney(financeOverview.totalApprovedSpent)}</div>
                </div>
                <div className="rounded-2xl border border-orange-200/80 bg-orange-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-700 mb-2">
                        <Wallet size={16} weight="duotone" />
                        Đã cấp cho nhiệm vụ
                    </div>
                    <div className="text-xl font-bold text-orange-900 tabular-nums">{formatMoney(financeOverview.totalAllocatedToTasks)}</div>
                </div>
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                        <Coins size={16} weight="duotone" />
                        Tiền mặt trong ví
                    </div>
                    <div className="text-xl font-bold text-blue-900 tabular-nums">{formatMoney(cashFlowReport.cashInsideWallet)}</div>
                </div>
            </div>
        </div>
    );
}

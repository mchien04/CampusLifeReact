import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { preparationAPI } from '../../services';
import { ActivityBudgetDto, BudgetCategoryDto } from '../../types';

type TabKey = 'OVERVIEW' | 'SETUP';

type DraftCategory = {
  name: string;
  allocatedAmount: string;
};

type BudgetSetupPanelProps = {
  activityId: number;
  financeMessage?: string | null;
  onBudgetSaved?: () => void | Promise<void>;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

function parseAmount(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isSystemWallet(name: string) {
  const normalized = name.trim().toLowerCase();
  return normalized === 'khac' || normalized === 'khác' || normalized === 'tong' || normalized === 'tổng';
}

function isResidualWallet(name: string) {
  const normalized = name.trim().toLowerCase();
  return normalized === 'khac' || normalized === 'khác';
}

export default function BudgetSetupPanel({ activityId, financeMessage, onBudgetSaved }: BudgetSetupPanelProps) {
  const [tab, setTab] = useState<TabKey>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [budget, setBudget] = useState<ActivityBudgetDto | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [rows, setRows] = useState<DraftCategory[]>([]);

  const loadBudget = useCallback(async () => {
    try {
      setLoading(true);
      const data = await preparationAPI.getActivityBudget(activityId);
      setBudget(data);

      setTotalAmount(data?.totalAmount ?? '');
      const userEditableRows = (data?.categories ?? [])
        .filter((c) => !isSystemWallet(c.name))
        .map((c) => ({
          name: c.name,
          allocatedAmount: c.allocatedAmount,
        }));
      setRows(userEditableRows);
    } catch {
      setBudget(null);
      setTotalAmount('');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const residualAmount = useMemo(() => {
    const total = parseAmount(totalAmount);
    const principalSum = rows.reduce((sum, item) => sum + parseAmount(item.allocatedAmount), 0);
    return total - principalSum;
  }, [rows, totalAmount]);

  const wallets = useMemo(() => {
    if (!budget) return [] as BudgetCategoryDto[];
    const sorted = [...budget.categories];
    sorted.sort((a, b) => {
      const aResidual = isResidualWallet(a.name) ? 1 : 0;
      const bResidual = isResidualWallet(b.name) ? 1 : 0;
      if (aResidual !== bResidual) return aResidual - bResidual;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [budget]);

  const saveBudget = async () => {
    const total = totalAmount.trim();
    if (!total) {
      toast.warning('Vui lòng nhập tổng ngân sách');
      return;
    }

    const payloadRows = rows
      .map((row) => ({
        name: row.name.trim(),
        allocatedAmount: row.allocatedAmount.trim(),
      }))
      .filter((row) => row.name && row.allocatedAmount);

    if (residualAmount < 0) {
      toast.error('Tổng các ví chính đang vượt tổng ngân sách. Vui lòng điều chỉnh.');
      return;
    }

    try {
      setSaving(true);
      await preparationAPI.upsertActivityBudget(activityId, {
        totalAmount: total,
        categories: payloadRows,
      });
      toast.success('Đã cập nhật budget theo ví thành công');
      await loadBudget();
      await onBudgetSaved?.();
      setTab('OVERVIEW');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể lưu budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#001C44]">Budget Setup Theo Ví</h2>
            <p className="text-sm text-gray-500 mt-1">Residual ví Khác được tính tự động từ tổng ngân sách.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('OVERVIEW')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tab === 'OVERVIEW'
                  ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Wallet Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('SETUP')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tab === 'SETUP'
                  ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Budget Setup
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Đang tải budget...</div>
        ) : tab === 'OVERVIEW' ? (
          !budget ? (
            <div className="text-sm text-gray-500">{financeMessage || 'Chưa có ActivityBudget. Vào tab Budget Setup để khởi tạo.'}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="financial-stat-card">
                  <div className="financial-stat-label">Tổng ngân sách</div>
                  <div className="financial-stat-value">{formatMoney(budget.totalAmount)}</div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="text-xs text-gray-500">Số ví đang quản lý</div>
                  <div className="text-2xl font-bold text-[#001C44] mt-1">{wallets.length}</div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="text-xs text-gray-500">Residual ví Khác</div>
                  <div className="text-2xl font-bold text-[#001C44] mt-1">
                    {formatMoney(String(residualAmount))}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">Wallets</div>
                {wallets.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Chưa có ví ngân sách.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ví</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used %</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wallets.map((w) => (
                          <tr key={w.id} className={isResidualWallet(w.name) ? 'bg-yellow-50/50' : ''}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {w.name}
                              {isResidualWallet(w.name) && (
                                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFD66D] text-[#001C44]">Residual</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatMoney(w.allocatedAmount)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatMoney(w.usedAmount)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#001C44]">{formatMoney(w.remainingAmount)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{w.usedPercent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tổng ngân sách</label>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Ví dụ: 5000000"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
              />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Ví chính (admin cấu hình)</span>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, { name: '', allocatedAmount: '' }])}
                  className="btn-yellow px-4 py-1.5 rounded-lg text-xs font-semibold"
                >
                  + Thêm ví
                </button>
              </div>

              {rows.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Chưa có ví chính. Bạn có thể thêm ví mới, ví Khác sẽ tự tính.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <div key={idx} className="p-4 grid grid-cols-1 sm:grid-cols-7 gap-2">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) =>
                            setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                          }
                          placeholder="Tên ví (Ví dụ: Marketing, Hậu cần)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={row.allocatedAmount}
                          onChange={(e) =>
                            setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, allocatedAmount: e.target.value } : x)))
                          }
                          placeholder="Allocated"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="w-full px-3 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`allocation-info-box ${residualAmount < 0 ? 'error' : residualAmount === 0 ? 'warning' : ''}`}>
              <div className="allocation-info-label">Residual ví Khác (auto)</div>
              <div className="allocation-info-value">{formatMoney(String(residualAmount))}</div>
              <div className="text-xs text-gray-600 mt-1">
                Công thức: Tổng ngân sách - Tổng các ví chính.
                {residualAmount < 0 && ' Hiện đang âm, vui lòng giảm allocated của ví chính hoặc tăng tổng ngân sách.'}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (budget) {
                    setTotalAmount(budget.totalAmount);
                    setRows(
                      budget.categories
                        .filter((c) => !isSystemWallet(c.name))
                        .map((c) => ({ name: c.name, allocatedAmount: c.allocatedAmount }))
                    );
                  } else {
                    setTotalAmount('');
                    setRows([]);
                  }
                }}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveBudget}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu...' : 'Lưu Budget'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

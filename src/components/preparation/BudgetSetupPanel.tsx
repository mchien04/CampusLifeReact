import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Wallet, Plus, SpinnerGap, CurrencyCircleDollar, Trash } from '@phosphor-icons/react';
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
  readOnly?: boolean;
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

export default function BudgetSetupPanel({ activityId, financeMessage, onBudgetSaved, readOnly }: BudgetSetupPanelProps) {
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

  const tabBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
      active
        ? 'bg-primary-900 text-white shadow-sm'
        : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
    }`;

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
              <Wallet size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-primary-900">Thiết lập ngân sách theo ví</h2>
              <p className="text-sm text-gray-500 mt-0.5">Ví dư Khác được tính tự động từ tổng ngân sách.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setTab('OVERVIEW')} className={tabBtn(tab === 'OVERVIEW')}>
              Tổng quan ví
            </button>
            {!readOnly && (
              <button type="button" onClick={() => setTab('SETUP')} className={tabBtn(tab === 'SETUP')}>
                Cấu hình ngân sách
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
            <SpinnerGap size={20} className="animate-spin text-primary-900/40" />
            Đang tải ngân sách...
          </div>
        ) : tab === 'OVERVIEW' ? (
          !budget ? (
            <div className="text-sm text-gray-500">{financeMessage || 'Chưa có ActivityBudget. Vào tab Budget Setup để khởi tạo.'}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-primary-900/20 bg-primary-900 p-5 text-white shadow-premium">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent/90 mb-2">
                    <CurrencyCircleDollar size={16} weight="duotone" />
                    Tổng ngân sách
                  </div>
                  <div className="text-xl font-bold tabular-nums">{formatMoney(budget.totalAmount)}</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 ring-1 ring-gray-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Số ví quản lý</div>
                  <div className="text-2xl font-bold text-primary-900 mt-1 tabular-nums">{wallets.length}</div>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 ring-1 ring-accent/20">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-900/70">Dư ví Khác</div>
                  <div className="text-2xl font-bold text-primary-900 mt-1 tabular-nums">
                    {formatMoney(String(residualAmount))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
                <div className="bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-700">Danh sách ví</div>
                {wallets.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Chưa có ví ngân sách.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ví</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã cấp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã dùng</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Còn lại</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% dùng</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wallets.map((w) => (
                          <tr key={w.id} className={isResidualWallet(w.name) ? 'bg-accent/5' : 'hover:bg-gray-50/50'}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {w.name}
                              {isResidualWallet(w.name) && (
                                <span className="ml-2 inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold bg-accent/30 text-primary-900 ring-1 ring-accent/40">Dư</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{formatMoney(w.allocatedAmount)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{formatMoney(w.usedAmount)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-primary-900 tabular-nums">{formatMoney(w.remainingAmount)}</td>
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
                className={inputClass}
              />
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
              <div className="bg-gray-50/80 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Ví chính (admin cấu hình)</span>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, { name: '', allocatedAmount: '' }])}
                  className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-primary-900 hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <Plus size={14} weight="bold" />
                  Thêm ví
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
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={row.allocatedAmount}
                          onChange={(e) =>
                            setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, allocatedAmount: e.target.value } : x)))
                          }
                          placeholder="Số tiền cấp"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 ring-1 ring-red-200/80 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
                        >
                          <Trash size={14} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`rounded-xl border p-4 ${
                residualAmount < 0
                  ? 'border-red-200 bg-red-50/80'
                  : residualAmount === 0
                    ? 'border-amber-200 bg-amber-50/80'
                    : 'border-accent/30 bg-accent/10'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dư ví Khác (tự động)</div>
              <div className="text-xl font-bold text-primary-900 mt-1 tabular-nums">{formatMoney(String(residualAmount))}</div>
              <div className="text-xs text-gray-600 mt-1">
                Công thức: Tổng ngân sách − Tổng các ví chính.
                {residualAmount < 0 && ' Hiện đang âm, vui lòng giảm số tiền cấp của ví chính hoặc tăng tổng ngân sách.'}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/50"
              >
                Đặt lại
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveBudget}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-6 py-2.5 text-sm font-semibold text-white shadow-premium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
              >
                {saving && <SpinnerGap size={16} className="animate-spin" />}
                {saving ? 'Đang lưu...' : 'Lưu ngân sách'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

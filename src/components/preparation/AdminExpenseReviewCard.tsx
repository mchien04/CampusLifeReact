import React from 'react';
import { Receipt, Image, Funnel, SpinnerGap } from '@phosphor-icons/react';
import { ExpenseDto, ExpenseStatusFilter } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

type AdminExpenseReviewCardProps = {
  expenses: ExpenseDto[];
  loading: boolean;
  statusFilter: ExpenseStatusFilter;
  onStatusFilterChange: (status: ExpenseStatusFilter) => void;
  onViewEvidence: (url: string) => void;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

function statusBadgeClass(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 ring-red-200/80';
  if (status === 'PENDING_ADMIN') return 'bg-blue-50 text-blue-800 ring-blue-200/80';
  return 'bg-amber-50 text-amber-800 ring-amber-200/80';
}

function expenseStatusLabel(status: string) {
  if (status === 'PENDING_LEADER') return 'Chờ trưởng nhóm duyệt';
  if (status === 'PENDING_ADMIN') return 'Chờ quản trị duyệt';
  if (status === 'APPROVED') return 'Đã duyệt';
  return 'Từ chối';
}

export default function AdminExpenseReviewCard({
  expenses,
  loading,
  statusFilter,
  onStatusFilterChange,
  onViewEvidence,
}: AdminExpenseReviewCardProps) {
  const completedExpenses = expenses;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
              <Receipt size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-primary-900">Chi phí</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {expenses.length > 0 ? `Tổng số: ${expenses.length} chi phí` : 'Không có chi phí'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-gray-400 shrink-0" />
            <label htmlFor="admin-expense-filter" className="sr-only">
              Trạng thái
            </label>
            <select
              id="admin-expense-filter"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as ExpenseStatusFilter)}
            >
              <option value="PENDING_ADMIN">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="ALL">Tất cả</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <SpinnerGap size={32} className="animate-spin text-primary-900/40 mb-3" />
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center">
            <Receipt size={28} weight="duotone" className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Chưa có chi phí.</p>
          </div>
        ) : (
          <>
            {completedExpenses.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-100 ring-1 ring-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Số tiền
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Hạng mục
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Người tạo
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Mô tả
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Minh chứng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {completedExpenses.map((ex) => {
                      const imgUrl = getImageUrl(ex.evidenceUrl);
                      return (
                        <tr key={ex.id} className="hover:bg-primary-50/20 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-primary-900 tabular-nums">
                            {formatMoney(ex.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{ex.categoryName || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {ex.createdByName || `#${ex.createdById}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
                            <span className="line-clamp-2">{ex.description || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(
                                ex.status
                              )}`}
                            >
                              {expenseStatusLabel(ex.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {imgUrl ? (
                              <button
                                type="button"
                                onClick={() => onViewEvidence(imgUrl)}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 rounded"
                              >
                                <Image size={14} weight="duotone" />
                                Xem
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

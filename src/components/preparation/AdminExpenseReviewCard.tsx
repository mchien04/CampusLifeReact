import React, { useState } from 'react';
import { ExpenseDto, ExpenseStatusFilter } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

type AdminExpenseReviewCardProps = {
  expenses: ExpenseDto[];
  loading: boolean;
  statusFilter: ExpenseStatusFilter;
  onStatusFilterChange: (status: ExpenseStatusFilter) => void;
  onDecision: (expenseId: number, approved: boolean) => Promise<void>;
  onViewEvidence: (url: string) => void;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

function statusBadgeClass(status: string) {
  if (status === 'APPROVED') return 'bg-green-50 text-green-700 border border-green-200';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border border-red-200';
  if (status === 'PENDING_ADMIN') return 'bg-blue-50 text-blue-700 border border-blue-200';
  return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
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
  onDecision,
  onViewEvidence,
}: AdminExpenseReviewCardProps) {
  const [decidingExpenseId, setDecidingExpenseId] = useState<number | null>(null);

  const handleDecision = async (expenseId: number, approved: boolean) => {
    setDecidingExpenseId(expenseId);
    try {
      await onDecision(expenseId, approved);
    } finally {
      setDecidingExpenseId(null);
    }
  };

  // Separate pending admin expenses from completed
  const pendingAdminExpenses = expenses.filter((ex) => ex.status === 'PENDING_ADMIN');
  const completedExpenses = expenses.filter((ex) => ex.status !== 'PENDING_ADMIN');

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#001C44]">Duyệt chi phí (Cấp quản trị)</h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingAdminExpenses.length > 0
                ? `${pendingAdminExpenses.length} chi phí chờ duyệt`
                : 'Không có chi phí chờ duyệt'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="admin-expense-filter" className="text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <select
              id="admin-expense-filter"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
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
          <div className="text-sm text-gray-500 py-8 text-center">Đang tải...</div>
        ) : expenses.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">Chưa có chi phí.</div>
        ) : (
          <>
            {/* Pending Admin Section */}
            {(statusFilter === 'PENDING_ADMIN' || statusFilter === 'ALL') && pendingAdminExpenses.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#001C44] mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Chờ duyệt {statusFilter === 'ALL' && `(${pendingAdminExpenses.length})`}
                </h3>
                <div className="space-y-3">
                  {pendingAdminExpenses.map((ex) => {
                    const imgUrl = getImageUrl(ex.evidenceUrl);
                    return (
                      <div key={ex.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:opacity-90 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-4 flex-wrap">
                              <div className="text-lg font-bold text-[#001C44]">{formatMoney(ex.amount)}</div>
                              {ex.categoryName && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">Hạng mục:</span> {ex.categoryName}
                                </div>
                              )}
                            </div>

                            {ex.description && (
                              <div className="text-sm text-gray-700 mt-2 whitespace-normal break-words">
                                <span className="font-medium">Mô tả:</span> {ex.description}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-600 mt-2 flex-wrap">
                              <span>Người tạo: <span className="font-medium">{ex.createdByName || `#${ex.createdById}`}</span></span>
                              <span>Ngày tạo: <span className="font-medium">{new Date(ex.createdAt).toLocaleString('vi-VN')}</span></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {imgUrl && (
                              <button
                                type="button"
                                onClick={() => onViewEvidence(imgUrl)}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700"
                              >
                                Minh chứng
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-blue-200">
                          <button
                            type="button"
                            onClick={() => handleDecision(ex.id, false)}
                            disabled={decidingExpenseId === ex.id}
                            className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {decidingExpenseId === ex.id ? 'Đang xử lý...' : 'Từ chối'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(ex.id, true)}
                            disabled={decidingExpenseId === ex.id}
                            className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {decidingExpenseId === ex.id ? 'Đang xử lý...' : 'Duyệt'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed/Rejected Expenses - Table View */}
            {(statusFilter === 'ALL' || statusFilter === 'APPROVED' || statusFilter === 'REJECTED') &&
              completedExpenses.length > 0 && (
                <>
                  {statusFilter === 'ALL' && pendingAdminExpenses.length > 0 && (
                    <h3 className="text-sm font-semibold text-[#001C44] mb-4 mt-6 pt-6 border-t border-gray-200">
                      Lịch sử
                    </h3>
                  )}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số tiền
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hạng mục
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Người tạo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mô tả
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Minh chứng
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {completedExpenses.map((ex) => {
                          const imgUrl = getImageUrl(ex.evidenceUrl);
                          return (
                            <tr key={ex.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {formatMoney(ex.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{ex.categoryName || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {ex.createdByName || `#${ex.createdById}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <span className="line-clamp-2">{ex.description || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
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
                                    className="text-sm font-medium text-blue-600 hover:text-blue-900"
                                  >
                                    Xem
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
          </>
        )}
      </div>
    </div>
  );
}

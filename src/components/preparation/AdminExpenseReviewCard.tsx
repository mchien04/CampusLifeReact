import React, { useState } from 'react';
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
  onViewEvidence,
}: AdminExpenseReviewCardProps) {
  // We no longer separate pending admin expenses, show everything in table
  const completedExpenses = expenses;

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#001C44]">Chi phí</h2>
            <p className="text-sm text-gray-600 mt-1">
              {expenses.length > 0
                ? `Tổng số: ${expenses.length} chi phí`
                : 'Không có chi phí'}
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
            {/* All Expenses - Table View */}
            {completedExpenses.length > 0 && (
                <>
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

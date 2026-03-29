import React from 'react';
import { ExpenseDto } from '../../types';

type LeaderExpenseReviewCardProps = {
  expenses: ExpenseDto[];
  onDecision: (expenseId: number, approved: boolean) => void;
  onViewEvidence: (url: string) => void;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

export default function LeaderExpenseReviewCard({
  expenses,
  onDecision,
  onViewEvidence,
}: LeaderExpenseReviewCardProps) {
  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#001C44]">Pending Leader Review</h3>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
            {expenses.length} chứng từ
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-sm text-gray-500">Không có chi phí đang chờ leader duyệt.</div>
        ) : (
          <div className="space-y-3">
            {expenses.map((ex) => {
              const imgUrl = ex.evidenceUrl ? (ex.evidenceUrl.startsWith('http') ? ex.evidenceUrl : ex.evidenceUrl) : null;
              return (
                <div key={ex.id} className="expense-item pending-leader">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{formatMoney(ex.amount)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ex.createdByName || `#${ex.createdById ?? ''}`} • {new Date(ex.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-sm text-gray-700 mt-2">{ex.description || 'Không có mô tả'}</div>
                      <div className="text-xs text-gray-500 mt-1">Hạng mục: {ex.categoryName || '-'}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {imgUrl && (
                        <button
                          type="button"
                          onClick={() => onViewEvidence(imgUrl)}
                          className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          Xem minh chứng
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDecision(ex.id, true)}
                        className="px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecision(ex.id, false)}
                        className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

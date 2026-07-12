import React from 'react';
import { Receipt, Image, Check, X, Hourglass } from '@phosphor-icons/react';
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
    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Hourglass size={22} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-primary-900">Chờ trưởng nhóm duyệt</h3>
              <p className="text-xs text-gray-500 mt-0.5">Chi phí đang chờ phê duyệt cấp 1</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80 tabular-nums">
            {expenses.length} chứng từ
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center">
            <Receipt size={28} weight="duotone" className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Không có chi phí đang chờ trưởng nhóm duyệt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((ex) => {
              const imgUrl = ex.evidenceUrl ? (ex.evidenceUrl.startsWith('http') ? ex.evidenceUrl : ex.evidenceUrl) : null;
              return (
                <div
                  key={ex.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 transition-colors hover:bg-gray-50/80"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary-900 tabular-nums">{formatMoney(ex.amount)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ex.createdByName || `#${ex.createdById ?? ''}`} · {new Date(ex.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-sm text-gray-700 mt-2">{ex.description || 'Không có mô tả'}</div>
                      <div className="text-xs text-gray-500 mt-1">Hạng mục: {ex.categoryName || '—'}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {imgUrl && (
                        <button
                          type="button"
                          onClick={() => onViewEvidence(imgUrl)}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                        >
                          <Image size={16} weight="duotone" />
                          Xem minh chứng
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDecision(ex.id, true)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 hover:bg-emerald-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                      >
                        <Check size={16} weight="bold" />
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecision(ex.id, false)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 ring-1 ring-red-200/80 hover:bg-red-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
                      >
                        <X size={16} weight="bold" />
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

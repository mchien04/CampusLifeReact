import React, { useState } from 'react';
import { X, Info, CurrencyCircleDollar } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { preparationAPI } from '../../services';
import { PreparationTaskDto } from '../../types';

type AllocationAdjustmentRequestModalProps = {
  task: PreparationTaskDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

export default function AllocationAdjustmentRequestModal({
  task,
  isOpen,
  onClose,
  onSuccess,
}: AllocationAdjustmentRequestModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const descriptionLength = description.length;
  const descriptionError = descriptionLength > 500 ? 'Mô tả không được vượt quá 500 ký tự' : '';
  const amountError = !amount || Number(amount) <= 0 ? 'Vui lòng nhập số tiền lớn hơn 0' : '';
  const descriptionEmptyError = !description.trim() ? 'Vui lòng nhập lý do/mô tả' : '';

  const isValid = !amountError && !descriptionEmptyError && !descriptionError;

  const handleSubmit = async () => {
    if (!isValid) {
      if (amountError) toast.warning(amountError);
      else if (descriptionEmptyError) toast.warning(descriptionEmptyError);
      else if (descriptionError) toast.warning(descriptionError);
      return;
    }

    try {
      setSubmitting(true);
      await preparationAPI.createAllocationAdjustmentRequest(task.id, {
        amount: amount.trim(),
        description: description.trim(),
      });
      toast.success('Đã gửi yêu cầu bổ sung cấp phát (chờ admin duyệt)');
      setAmount('');
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tạo yêu cầu bổ sung');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-premium max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden bg-primary-900 px-6 py-4 text-white shrink-0">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%)',
            }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CurrencyCircleDollar size={22} weight="duotone" className="text-accent" />
              <h2 className="text-lg font-semibold">Yêu cầu bổ sung cấp phát</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Đóng"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Nhiệm vụ</div>
            <div className="text-sm font-semibold text-primary-900 mt-1">{task.title}</div>
            {task.allocatedAmount && (
              <div className="text-xs text-gray-600 mt-2">
                Cấp phát: <span className="font-semibold text-primary-900 tabular-nums">{formatMoney(task.allocatedAmount)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số tiền <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Ví dụ: 500000"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 disabled:opacity-50"
            />
            {amount && (
              <div className="text-xs text-gray-500 mt-1 tabular-nums">{formatMoney(amount)}</div>
            )}
            {amountError && <div className="text-xs text-red-600 mt-1">{amountError}</div>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Lý do / Mô tả <span className="text-red-600">*</span>
              </label>
              <span className={`text-xs tabular-nums ${descriptionLength > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                {descriptionLength}/500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Nhập lý do bạn cần bổ sung cấp phát..."
              disabled={submitting}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 disabled:opacity-50 resize-none"
            />
            {descriptionEmptyError && <div className="text-xs text-red-600 mt-1">{descriptionEmptyError}</div>}
            {descriptionError && <div className="text-xs text-red-600 mt-1">{descriptionError}</div>}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <Info size={16} weight="duotone" className="shrink-0 text-primary-900 mt-0.5" />
              <ul className="list-disc list-inside space-y-1">
                <li>Yêu cầu sẽ được gửi cho admin duyệt</li>
                <li>Admin sẽ tự động phân chia nguồn ví</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}

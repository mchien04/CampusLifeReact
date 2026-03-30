import React, { useState } from 'react';
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
    // Only allow numbers
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#001C44]">Yêu Cầu Bổ Sung Cấp Phát</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Task Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 font-medium">Nhiệm vụ</div>
            <div className="text-sm font-semibold text-[#001C44] mt-1">{task.title}</div>
            {task.allocatedAmount && (
              <div className="text-xs text-gray-600 mt-2">
                Cấp phát: <span className="font-semibold text-[#001C44]">{formatMoney(task.allocatedAmount)}</span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số Tiền <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Ví dụ: 500000"
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] disabled:opacity-50"
              />
              {amount && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatMoney(amount)}
                </div>
              )}
            </div>
            {amountError && <div className="text-xs text-red-600 mt-1">{amountError}</div>}
          </div>

          {/* Description Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Lý Do / Mô Tả <span className="text-red-600">*</span>
              </label>
              <span className={`text-xs ${descriptionLength > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                {descriptionLength}/500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Nhập lý do bạn cần bổ sung cấp phát..."
              disabled={submitting}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] disabled:opacity-50 resize-none"
            />
            {descriptionEmptyError && <div className="text-xs text-red-600 mt-1">{descriptionEmptyError}</div>}
            {descriptionError && <div className="text-xs text-red-600 mt-1">{descriptionError}</div>}
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              <div className="font-medium text-gray-700 mb-1">Lưu ý:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Yêu cầu sẽ được gửi cho admin duyệt</li>
                <li>Admin sẽ tự động phân chia nguồn ví</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#001C44] hover:to-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}

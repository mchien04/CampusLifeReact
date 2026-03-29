import React, { useEffect, useMemo, useState } from 'react';
import { BudgetCategoryDto, PreparationTaskDto } from '../../types';
import { compressImage } from '../../utils/compressImage';

type ExpenseFormSubmitPayload = {
  taskId: number;
  categoryId: number;
  amount: string;
  description: string | null;
  evidenceFile: File | null;
};

type ExpenseFormModalProps = {
  open: boolean;
  financialTasks: PreparationTaskDto[];
  categories: BudgetCategoryDto[];
  initialTaskId: number | null;
  initialCategoryId: number | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpenseFormSubmitPayload) => Promise<void>;
};

export default function ExpenseFormModal({
  open,
  financialTasks,
  categories,
  initialTaskId,
  initialCategoryId,
  submitting,
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const [taskId, setTaskId] = useState<number | null>(initialTaskId);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTaskId(initialTaskId);
    setCategoryId(initialCategoryId);
    setAmount('');
    setDescription('');
    setEvidenceFile(null);
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
    }
    setEvidencePreview(null);
  }, [open, initialTaskId, initialCategoryId]);

  const canSubmit = useMemo(() => {
    return !!taskId && !!categoryId && amount.trim().length > 0 && !submitting;
  }, [taskId, categoryId, amount, submitting]);

  const pickEvidence = async (file: File) => {
    const compressed = await compressImage(file);
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
    }
    setEvidenceFile(compressed);
    setEvidencePreview(URL.createObjectURL(compressed));
  };

  const clearEvidence = () => {
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
    }
    setEvidencePreview(null);
    setEvidenceFile(null);
  };

  const submit = async () => {
    if (!taskId || !categoryId || !amount.trim()) return;
    await onSubmit({
      taskId,
      categoryId,
      amount: amount.trim(),
      description: description.trim() || null,
      evidenceFile,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Thêm chi phí</h3>
              <p className="text-xs text-gray-200 mt-0.5">Gửi chi phí để quản trị duyệt</p>
            </div>
            <button type="button" onClick={onClose} className="text-white hover:text-[#FFD66D] transition-colors">
              <span className="sr-only">Đóng</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="prep-org-expense-task" className="block text-sm font-semibold text-gray-700 mb-2">Task tài chính</label>
            <select
              id="prep-org-expense-task"
              name="prepOrgExpenseTask"
              value={taskId ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTaskId(Number.isFinite(v) && v > 0 ? v : null);
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
            >
              <option value="">Chọn task...</option>
              {financialTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prep-org-expense-category" className="block text-sm font-semibold text-gray-700 mb-2">Hạng mục ngân sách</label>
            <select
              id="prep-org-expense-category"
              name="prepOrgExpenseCategory"
              value={categoryId ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCategoryId(Number.isFinite(v) && v > 0 ? v : null);
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
              disabled={!categories.length}
            >
              <option value="">Chọn hạng mục...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prep-org-expense-amount" className="block text-sm font-semibold text-gray-700 mb-2">Số tiền</label>
            <input
              id="prep-org-expense-amount"
              name="prepOrgExpenseAmount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 120000"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="prep-org-expense-desc" className="block text-sm font-semibold text-gray-700 mb-2">Nội dung</label>
            <textarea
              id="prep-org-expense-desc"
              name="prepOrgExpenseDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi phí (tùy chọn)"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="prep-org-expense-evidence" className="block text-sm font-semibold text-gray-700 mb-2">Chụp ảnh hóa đơn</label>
            <input
              id="prep-org-expense-evidence"
              name="prepOrgExpenseEvidence"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  pickEvidence(f).catch(() => null);
                }
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
            />
            {evidencePreview && (
              <div className="mt-3 flex items-start gap-3">
                <img src={evidencePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={clearEvidence}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Hủy
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {submitting ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

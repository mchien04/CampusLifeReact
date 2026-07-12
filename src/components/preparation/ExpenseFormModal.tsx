import React, { useEffect, useMemo, useState } from 'react';
import { X, Receipt, Camera, SpinnerGap } from '@phosphor-icons/react';
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

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30';

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative rounded-2xl border border-gray-100 bg-white shadow-premium w-full max-w-2xl overflow-hidden">
        <div className="relative overflow-hidden bg-primary-900 px-6 py-4 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 100% 0%, #FFD66D 0%, transparent 55%)',
            }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt size={22} weight="duotone" className="text-accent" />
              <div>
                <h3 className="text-lg font-bold">Thêm chi phí</h3>
                <p className="text-xs text-primary-100/80 mt-0.5">Gửi chi phí để quản trị duyệt</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Đóng"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="prep-org-expense-task" className="block text-sm font-semibold text-gray-700 mb-2">
              Nhiệm vụ tài chính
            </label>
            <select
              id="prep-org-expense-task"
              name="prepOrgExpenseTask"
              value={taskId ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTaskId(Number.isFinite(v) && v > 0 ? v : null);
              }}
              className={inputClass}
            >
              <option value="">Chọn nhiệm vụ...</option>
              {financialTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prep-org-expense-category" className="block text-sm font-semibold text-gray-700 mb-2">
              Hạng mục ngân sách
            </label>
            <select
              id="prep-org-expense-category"
              name="prepOrgExpenseCategory"
              value={categoryId ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCategoryId(Number.isFinite(v) && v > 0 ? v : null);
              }}
              className={inputClass}
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
            <label htmlFor="prep-org-expense-amount" className="block text-sm font-semibold text-gray-700 mb-2">
              Số tiền
            </label>
            <input
              id="prep-org-expense-amount"
              name="prepOrgExpenseAmount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 120000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="prep-org-expense-desc" className="block text-sm font-semibold text-gray-700 mb-2">
              Nội dung
            </label>
            <textarea
              id="prep-org-expense-desc"
              name="prepOrgExpenseDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi phí (tùy chọn)"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="prep-org-expense-evidence" className="block text-sm font-semibold text-gray-700 mb-2">
              Chụp ảnh hóa đơn
            </label>
            <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border cursor-pointer ${inputClass} bg-white hover:bg-gray-50`}>
              <Camera size={18} weight="duotone" className="text-primary-900" />
              Chọn ảnh
              <input
                id="prep-org-expense-evidence"
                name="prepOrgExpenseEvidence"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    pickEvidence(f).catch(() => null);
                  }
                }}
              />
            </label>
            {evidencePreview && (
              <div className="mt-3 flex items-start gap-3">
                <img src={evidencePreview} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-gray-200 ring-1 ring-gray-100" />
                <button
                  type="button"
                  onClick={clearEvidence}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/50"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-6 py-2.5 text-sm font-semibold text-white shadow-premium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
            >
              {submitting && <SpinnerGap size={16} className="animate-spin" />}
              {submitting ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

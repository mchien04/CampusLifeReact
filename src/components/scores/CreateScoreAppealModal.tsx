import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { scoresAPI } from '../../services/scoresAPI';
import {
    ScoreType,
    ScoreHistoryDetailResponse,
    getScoreTypeLabel,
    formatScore,
    formatDateTime,
    isScoreDeduction,
} from '../../types/score';

interface CreateScoreAppealModalProps {
    open: boolean;
    semesterId: number;
    /** Loại điểm của dòng đang khiếu nại — bắt buộc */
    scoreType: ScoreType;
    historyEntry: ScoreHistoryDetailResponse;
    onClose: () => void;
    onSuccess?: () => void;
}

const MAX_EVIDENCE = 5;
const MAX_FILE_MB = 5;

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const CreateScoreAppealModal: React.FC<CreateScoreAppealModalProps> = ({
    open,
    semesterId,
    scoreType,
    historyEntry,
    onClose,
    onSuccess,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const [reason, setReason] = useState('');
    const [requestedPoints, setRequestedPoints] = useState('');
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle(historyEntry ? `Khiếu nại điểm: ${historyEntry.reason.slice(0, 60)}` : '');
        setReason('');
        setRequestedPoints('');
        setEvidenceFiles([]);
        setEvidencePreviews((prev) => {
            prev.forEach((url) => URL.revokeObjectURL(url));
            return [];
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [open, historyEntry]);

    useEffect(() => {
        return () => {
            evidencePreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [evidencePreviews]);

    if (!open) return null;

    const handlePickFiles = (fileList: FileList | null) => {
        if (!fileList?.length) return;
        const incoming = Array.from(fileList);
        const next: File[] = [...evidenceFiles];

        for (const file of incoming) {
            if (!file.type.startsWith('image/')) {
                toast.warning(`Bỏ qua "${file.name}": chỉ nhận ảnh`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                toast.warning(`Bỏ qua "${file.name}": tối đa ${MAX_FILE_MB}MB`);
                continue;
            }
            if (next.length >= MAX_EVIDENCE) {
                toast.warning(`Tối đa ${MAX_EVIDENCE} ảnh minh chứng`);
                break;
            }
            next.push(file);
        }

        evidencePreviews.forEach((url) => URL.revokeObjectURL(url));
        setEvidenceFiles(next);
        setEvidencePreviews(next.map((f) => URL.createObjectURL(f)));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeEvidence = (index: number) => {
        URL.revokeObjectURL(evidencePreviews[index]);
        setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
        setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!historyEntry?.id) {
            toast.warning('Thiếu dòng điểm cần khiếu nại');
            return;
        }
        if (!isScoreDeduction(historyEntry)) {
            toast.warning('Chỉ khiếu nại được dòng điểm trừ');
            return;
        }
        if (!title.trim() || !reason.trim()) {
            toast.warning('Vui lòng nhập tiêu đề và lý do khiếu nại');
            return;
        }

        setSubmitting(true);
        try {
            let evidenceUrls: string[] | null = null;
            if (evidenceFiles.length > 0) {
                const uploadRes = await scoresAPI.uploadAppealEvidence(evidenceFiles);
                if (!uploadRes.status || !uploadRes.data?.urls?.length) {
                    toast.error(uploadRes.message || 'Không tải được ảnh minh chứng');
                    return;
                }
                evidenceUrls = uploadRes.data.urls;
            }

            const pointsTrimmed = requestedPoints.trim();
            const response = await scoresAPI.createScoreAppeal({
                semesterId,
                scoreType,
                relatedScoreEntryId: historyEntry.id,
                title: title.trim(),
                reason: reason.trim(),
                requestedPoints: pointsTrimmed === '' ? null : pointsTrimmed,
                evidenceUrls,
            });

            if (response.status) {
                toast.success(response.message || 'Đã gửi khiếu nại');
                onSuccess?.();
                onClose();
            } else {
                toast.error(response.message || 'Không gửi được khiếu nại');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            const lower = (msg || '').toLowerCase();
            if (lower.includes('deduction') || lower.includes('points < 0')) {
                toast.error('Chỉ khiếu nại được dòng điểm trừ');
            } else if (lower.includes('active')) {
                toast.error('Dòng điểm này không còn hiệu lực');
            } else if (lower.includes('belong') || lower.includes('access') || lower.includes('denied')) {
                toast.error('Không có quyền');
            } else {
                toast.error(msg || 'Không có quyền hoặc dữ liệu không hợp lệ');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-900/40 backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal
            aria-labelledby="create-appeal-title"
        >
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 sm:px-6 py-4">
                    <div>
                        <h2 id="create-appeal-title" className="text-lg font-bold text-primary-900">
                            Gửi khiếu nại điểm
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {getScoreTypeLabel(scoreType)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Đóng"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {historyEntry && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm space-y-1">
                            <p className="font-medium text-gray-900">{historyEntry.reason}</p>
                            <p className="text-gray-500">
                                {formatDateTime(historyEntry.changeDate)} ·{' '}
                                {formatScore(historyEntry.oldScore)} → {formatScore(historyEntry.newScore)}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="appeal-title" className="block text-sm font-medium text-gray-700">
                            Tiêu đề
                        </label>
                        <input
                            id="appeal-title"
                            className={inputClass}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Sai điểm điểm danh"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="appeal-reason" className="block text-sm font-medium text-gray-700">
                            Lý do khiếu nại
                        </label>
                        <textarea
                            id="appeal-reason"
                            className={inputClass}
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Mô tả rõ vấn đề và bằng chứng nếu có"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="appeal-points" className="block text-sm font-medium text-gray-700">
                            Điểm đề nghị (không bắt buộc)
                        </label>
                        <input
                            id="appeal-points"
                            type="number"
                            step="any"
                            className={inputClass}
                            value={requestedPoints}
                            onChange={(e) => setRequestedPoints(e.target.value)}
                            placeholder="Gợi ý cho cán bộ khi xử lý"
                        />
                        <p className="text-xs text-gray-400">
                            Điểm bạn cho rằng nên được ghi nhận lại (chỉ mang tính tham khảo).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="appeal-evidence" className="block text-sm font-medium text-gray-700">
                            Ảnh minh chứng (không bắt buộc)
                        </label>
                        <input
                            ref={fileInputRef}
                            id="appeal-evidence"
                            type="file"
                            accept="image/*"
                            multiple
                            className={inputClass}
                            onChange={(e) => handlePickFiles(e.target.files)}
                        />
                        <p className="text-xs text-gray-400">
                            Tối đa {MAX_EVIDENCE} ảnh, mỗi ảnh ≤ {MAX_FILE_MB}MB.
                        </p>
                        {evidencePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {evidencePreviews.map((url, idx) => (
                                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                        <img src={url} alt={`Minh chứng ${idx + 1}`} className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeEvidence(idx)}
                                            className="absolute top-1 right-1 rounded-md bg-primary-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 active:scale-[0.98] disabled:opacity-50 transition-all"
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateScoreAppealModal;

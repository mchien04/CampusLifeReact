import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { submissionAPI } from '../../services/submissionAPI';
import {
    TaskSubmissionSummary,
    getGradeBadgeClass,
    getGradeLabel,
    isSubmissionGraded,
} from '../../types/task';
import { getSubmissionStatusLabel } from '../../utils/submissionUtils';
import { SubmissionStatus } from '../../types/submission';

interface GradeSubmissionDrawerProps {
    submission: TaskSubmissionSummary;
    taskName: string;
    onClose: () => void;
    onGraded: (updated: TaskSubmissionSummary) => void;
}

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const isImageUrl = (url: string) =>
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url) || url.includes('/images/');

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const fileNameFromUrl = (url: string) => {
    try {
        const path = decodeURIComponent(new URL(url).pathname);
        return path.split('/').filter(Boolean).pop() || 'Tệp đính kèm';
    } catch {
        return url.split('/').pop() || 'Tệp đính kèm';
    }
};

const GradeSubmissionDrawer: React.FC<GradeSubmissionDrawerProps> = ({
    submission,
    taskName,
    onClose,
    onGraded,
}) => {
    const graded = isSubmissionGraded(submission);
    const [isCompleted, setIsCompleted] = useState<boolean | null>(
        graded ? submission.isCompleted : null
    );
    const [feedback, setFeedback] = useState(submission.feedback ?? '');
    const [saving, setSaving] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useEffect(() => {
        setIsCompleted(isSubmissionGraded(submission) ? submission.isCompleted : null);
        setFeedback(submission.feedback ?? '');
    }, [submission]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const fileUrls = submission.fileUrls ?? [];
    const imageUrls = fileUrls.filter(isImageUrl);
    const otherFiles = fileUrls.filter((u) => !isImageUrl(u));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isCompleted === null) {
            toast.error('Vui lòng chọn Đạt hoặc Không đạt');
            return;
        }

        setSaving(true);
        try {
            const response = await submissionAPI.gradeSubmission(
                submission.id,
                isCompleted,
                feedback.trim() || undefined
            );
            if (response.status && response.data) {
                const body = response.data;
                const updated: TaskSubmissionSummary = {
                    ...submission,
                    isCompleted: body.isCompleted ?? isCompleted,
                    feedback: body.feedback ?? (feedback.trim() || null),
                    status: 'GRADED',
                    gradedAt: body.gradedAt ?? new Date().toISOString(),
                };
                toast.success(graded ? 'Đã cập nhật kết quả chấm' : 'Chấm bài thành công');
                onGraded(updated);
            } else {
                toast.error(response.message || 'Chấm bài thất bại');
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
                ?.message;
            toast.error(msg || 'Lỗi khi chấm bài');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label="Đóng"
                className="absolute inset-0 bg-primary-900/35 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="grade-drawer-title"
                className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl translate-x-0"
            >
                <header className="shrink-0 border-b border-gray-100 bg-primary-900 px-5 py-4 text-white sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-white/55 truncate">{taskName}</p>
                            <h2
                                id="grade-drawer-title"
                                className="mt-1 text-lg font-semibold tracking-tight truncate"
                            >
                                {submission.studentName}
                            </h2>
                            <p className="mt-0.5 font-mono text-xs text-white/60 tabular-nums">
                                {submission.studentCode}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                            <span className="sr-only">Đóng</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getGradeBadgeClass(submission)}`}
                        >
                            {getGradeLabel(submission)}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/80">
                            {getSubmissionStatusLabel(submission.status as SubmissionStatus)}
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
                    <section className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-400">Nộp lúc</p>
                            <p className="mt-0.5 font-medium text-gray-800 tabular-nums">
                                {formatDate(submission.submittedAt)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-400">Chấm lúc</p>
                            <p className="mt-0.5 font-medium text-gray-800 tabular-nums">
                                {formatDate(submission.gradedAt)}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-primary-900">Nội dung bài nộp</h3>
                        {submission.content ? (
                            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {submission.content}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Không có nội dung văn bản.</p>
                        )}
                    </section>

                    {fileUrls.length > 0 && (
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-primary-900">
                                Tệp đính kèm ({fileUrls.length})
                            </h3>
                            {imageUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {imageUrls.map((url, idx) => (
                                        <button
                                            key={`${url}-${idx}`}
                                            type="button"
                                            onClick={() => setLightboxUrl(url)}
                                            className="aspect-square overflow-hidden rounded-xl border border-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                        >
                                            <img
                                                src={url}
                                                alt={`Ảnh ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {otherFiles.length > 0 && (
                                <ul className="space-y-1.5">
                                    {otherFiles.map((url, idx) => (
                                        <li key={`${url}-${idx}`}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm text-primary-900 hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="h-4 w-4 shrink-0 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                    />
                                                </svg>
                                                <span className="truncate">{fileNameFromUrl(url)}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}

                    {graded && submission.feedback && (
                        <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                            <p className="text-xs font-medium text-emerald-800/70">Nhận xét hiện tại</p>
                            <p className="mt-1 text-sm text-emerald-950 whitespace-pre-wrap">
                                {submission.feedback}
                            </p>
                        </section>
                    )}

                    <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-primary-900">
                            {graded ? 'Chấm lại' : 'Chấm bài'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCompleted(true)}
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
                                        isCompleted === true
                                            ? 'bg-emerald-700 text-white'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    Đạt
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCompleted(false)}
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
                                        isCompleted === false
                                            ? 'bg-red-700 text-white'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    Không đạt
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="grade-feedback" className="block text-sm font-medium text-gray-700">
                                    Nhận xét (không bắt buộc)
                                </label>
                                <textarea
                                    id="grade-feedback"
                                    className={inputClass}
                                    rows={3}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Góp ý ngắn cho sinh viên..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || isCompleted === null}
                                    className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 active:scale-[0.98] transition-all"
                                >
                                    {saving ? 'Đang lưu...' : graded ? 'Cập nhật kết quả' : 'Lưu kết quả'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </aside>

            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightboxUrl(null)}
                >
                    <img
                        src={lightboxUrl}
                        alt="Xem ảnh"
                        className="max-h-full max-w-full rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default GradeSubmissionDrawer;

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { scoresAPI } from '../../services/scoresAPI';
import {
    ScoreAppealResponse,
    ScoreAppealDecisionPreviewResponse,
    ScoreAppealDecisionRequest,
    ScoreType,
    getScoreTypeLabel,
    formatScore,
    formatDateTime,
} from '../../types/score';
import ScoreAppealStatusBadge from './ScoreAppealStatusBadge';

interface ScoreAppealDetailPanelProps {
    appeal: ScoreAppealResponse;
    mode: 'student' | 'staff';
    onUpdated: (appeal: ScoreAppealResponse) => void;
}

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const ScoreAppealDetailPanel: React.FC<ScoreAppealDetailPanelProps> = ({
    appeal,
    mode,
    onUpdated,
}) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [decisionNotes, setDecisionNotes] = useState('');
    const [addBonus, setAddBonus] = useState(false);
    const [adjustedPoints, setAdjustedPoints] = useState('');
    const [adjustScoreType, setAdjustScoreType] = useState<ScoreType>(appeal.scoreType);
    const [preview, setPreview] = useState<ScoreAppealDecisionPreviewResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [deciding, setDeciding] = useState(false);
    const [closing, setClosing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const canMessage = appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW';
    const canDecide = mode === 'staff' && (appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW');
    const canClose = mode === 'staff' && appeal.status !== 'CLOSED';
    const canWithdraw = mode === 'student' && appeal.status === 'PENDING';
    const evidenceUrls = appeal.evidenceUrls ?? [];

    useEffect(() => {
        if (!canDecide) {
            setPreview(null);
            setPreviewError(null);
            return;
        }

        const pointsTrimmed = adjustedPoints.trim();
        const body: ScoreAppealDecisionRequest = {
            decision,
            decisionNotes: decisionNotes.trim() || null,
            adjustedPoints:
                decision === 'APPROVED' && addBonus && pointsTrimmed !== ''
                    ? pointsTrimmed
                    : null,
            scoreType:
                decision === 'APPROVED' && addBonus && pointsTrimmed !== ''
                    ? adjustScoreType
                    : null,
        };

        const timer = setTimeout(async () => {
            setPreviewLoading(true);
            setPreviewError(null);
            try {
                const response = await scoresAPI.previewAppealDecision(appeal.id, body);
                if (response.status && response.data) {
                    setPreview(response.data);
                } else {
                    setPreview(null);
                    setPreviewError(response.message || 'Không xem trước được điểm');
                }
            } catch (error: unknown) {
                const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
                setPreview(null);
                setPreviewError(msg || 'Không xem trước được điểm');
            } finally {
                setPreviewLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [canDecide, appeal.id, decision, decisionNotes, addBonus, adjustedPoints, adjustScoreType]);

    const buildDecisionBody = (): ScoreAppealDecisionRequest => {
        const pointsTrimmed = adjustedPoints.trim();
        return {
            decision,
            decisionNotes: decisionNotes.trim() || null,
            adjustedPoints:
                decision === 'APPROVED' && addBonus && pointsTrimmed !== ''
                    ? pointsTrimmed
                    : null,
            scoreType:
                decision === 'APPROVED' && addBonus && pointsTrimmed !== ''
                    ? adjustScoreType
                    : null,
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.warning('Vui lòng nhập nội dung tin nhắn');
            return;
        }
        setSending(true);
        try {
            const response = await scoresAPI.addScoreAppealMessage(appeal.id, {
                content: message.trim(),
            });
            if (response.status && response.data) {
                toast.success('Đã gửi tin nhắn');
                setMessage('');
                onUpdated(response.data);
            } else {
                toast.error(response.message || 'Không gửi được tin nhắn');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Không gửi được tin nhắn');
        } finally {
            setSending(false);
        }
    };

    const handleDecide = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeciding(true);
        try {
            const body = buildDecisionBody();
            const response = await scoresAPI.decideScoreAppeal(appeal.id, body);
            if (response.status && response.data) {
                toast.success(
                    decision === 'APPROVED'
                        ? 'Đã chấp nhận khiếu nại'
                        : 'Đã từ chối khiếu nại'
                );
                onUpdated(response.data);
            } else {
                toast.error(response.message || 'Không xử lý được khiếu nại');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Không xử lý được khiếu nại');
        } finally {
            setDeciding(false);
        }
    };

    const handleClose = async () => {
        if (!window.confirm('Đóng hồ sơ khiếu nại này?')) return;
        setClosing(true);
        try {
            const response = await scoresAPI.closeScoreAppeal(appeal.id);
            if (response.status && response.data) {
                toast.success('Đã đóng hồ sơ');
                onUpdated(response.data);
            } else {
                toast.error(response.message || 'Không đóng được hồ sơ');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Không đóng được hồ sơ');
        } finally {
            setClosing(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm('Rút khiếu nại này?')) return;
        setWithdrawing(true);
        try {
            const response = await scoresAPI.withdrawScoreAppeal(appeal.id);
            if (response.status && response.data) {
                toast.success('Đã rút khiếu nại');
                onUpdated(response.data);
            } else {
                toast.error(response.message || 'Không rút được khiếu nại');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Không rút được khiếu nại');
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-primary-900">{appeal.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {getScoreTypeLabel(appeal.scoreType)}
                            {appeal.studentCode && (
                                <> · {appeal.studentCode}{appeal.studentFullName ? ` - ${appeal.studentFullName}` : ''}</>
                            )}
                        </p>
                    </div>
                    <ScoreAppealStatusBadge status={appeal.status} />
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Lý do</p>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{appeal.reason}</p>
                </div>

                {evidenceUrls.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Ảnh minh chứng</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {evidenceUrls.map((url, idx) => (
                                <button
                                    key={`${url}-${idx}`}
                                    type="button"
                                    onClick={() => setLightboxUrl(url)}
                                    className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                >
                                    <img
                                        src={url}
                                        alt={`Minh chứng ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {appeal.requestedPoints != null && appeal.requestedPoints !== '' && (
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-400">Điểm đề xuất</p>
                            <p className="font-semibold text-primary-900 tabular-nums">
                                {formatScore(appeal.requestedPoints)}
                            </p>
                        </div>
                    )}
                    {appeal.createdAt && (
                        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-400">Ngày gửi</p>
                            <p className="font-medium text-gray-800">{formatDateTime(appeal.createdAt)}</p>
                        </div>
                    )}
                    {appeal.decisionNotes && (
                        <div className="sm:col-span-2 rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-400">Ghi chú quyết định</p>
                            <p className="text-gray-800 mt-0.5">{appeal.decisionNotes}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    {canWithdraw && (
                        <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled={withdrawing}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {withdrawing ? 'Đang rút...' : 'Rút khiếu nại'}
                        </button>
                    )}
                    {canClose && (
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={closing}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {closing ? 'Đang đóng...' : 'Đóng hồ sơ'}
                        </button>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-primary-900">Trao đổi</h3>
                {appeal.messages?.length ? (
                    <ul className="space-y-3">
                        {appeal.messages.map((m) => (
                            <li key={m.id} className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">{m.senderUsername}</span>
                                    {m.createdAt && (
                                        <time className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</time>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.content}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">Chưa có tin nhắn.</p>
                )}

                {canMessage && (
                    <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-gray-100">
                        <label htmlFor="appeal-message" className="block text-sm font-medium text-gray-700">
                            Tin nhắn mới
                        </label>
                        <textarea
                            id="appeal-message"
                            className={inputClass}
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Nhập nội dung trao đổi..."
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={sending}
                                className="rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            {canDecide && (
                <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 sm:p-6 space-y-4">
                    <h3 className="text-base font-semibold text-primary-900">Quyết định</h3>
                    <form onSubmit={handleDecide} className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setDecision('APPROVED')}
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                    decision === 'APPROVED'
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200'
                                }`}
                            >
                                Chấp nhận
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDecision('REJECTED');
                                    setAddBonus(false);
                                    setAdjustedPoints('');
                                }}
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                    decision === 'REJECTED'
                                        ? 'bg-red-700 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200'
                                }`}
                            >
                                Từ chối
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="decision-notes" className="block text-sm font-medium text-gray-700">
                                Ghi chú quyết định
                            </label>
                            <textarea
                                id="decision-notes"
                                className={inputClass}
                                rows={2}
                                value={decisionNotes}
                                onChange={(e) => setDecisionNotes(e.target.value)}
                                placeholder="Giải thích ngắn gọn cho sinh viên"
                            />
                        </div>

                        {decision === 'APPROVED' && (
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={addBonus}
                                        onChange={(e) => {
                                            setAddBonus(e.target.checked);
                                            if (!e.target.checked) setAdjustedPoints('');
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                                    />
                                    <span className="text-sm font-medium text-gray-800">
                                        Cộng điểm bù thêm
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500">
                                    Mặc định chỉ gỡ trừ điểm bị khiếu nại. Bật tùy chọn này nếu cần cộng thêm điểm (có thể khác loại điểm).
                                </p>

                                {addBonus && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label htmlFor="adjusted-points" className="block text-sm font-medium text-gray-700">
                                                Số điểm cộng thêm
                                            </label>
                                            <input
                                                id="adjusted-points"
                                                type="number"
                                                step="any"
                                                className={inputClass}
                                                value={adjustedPoints}
                                                onChange={(e) => setAdjustedPoints(e.target.value)}
                                                placeholder="Ví dụ: 5"
                                                required={addBonus}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="adjust-score-type" className="block text-sm font-medium text-gray-700">
                                                Loại điểm cộng thêm
                                            </label>
                                            <select
                                                id="adjust-score-type"
                                                className={inputClass}
                                                value={adjustScoreType}
                                                onChange={(e) => setAdjustScoreType(e.target.value as ScoreType)}
                                            >
                                                <option value="REN_LUYEN">{getScoreTypeLabel('REN_LUYEN')}</option>
                                                <option value="CONG_TAC_XA_HOI">{getScoreTypeLabel('CONG_TAC_XA_HOI')}</option>
                                                <option value="CHUYEN_DE">{getScoreTypeLabel('CHUYEN_DE')}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {decision === 'APPROVED' && (
                            <div className="rounded-xl border border-amber-200/80 bg-white px-4 py-3 space-y-2">
                                <p className="text-xs font-medium text-gray-500">Xem trước điểm</p>
                                {previewLoading && (
                                    <p className="text-sm text-gray-400">Đang tính...</p>
                                )}
                                {!previewLoading && previewError && (
                                    <p className="text-sm text-red-700">{previewError}</p>
                                )}
                                {!previewLoading && preview && (
                                    <div className="space-y-2 text-sm">
                                        {preview.willReverseRelated && (
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <span className="text-gray-600">
                                                    Gỡ trừ{' '}
                                                    <strong className="text-gray-900">
                                                        {getScoreTypeLabel(preview.relatedScoreType ?? appeal.scoreType)}
                                                    </strong>
                                                    {preview.relatedEntryPoints != null && (
                                                        <span className="text-gray-400 ml-1">
                                                            ({formatScore(preview.relatedEntryPoints)})
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="font-semibold text-primary-900 tabular-nums">
                                                    {formatScore(preview.currentScore)}
                                                    {preview.projectedRelatedScore != null && (
                                                        <> → {formatScore(preview.projectedRelatedScore)}</>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {preview.willCreateLedgerEntry && preview.adjustedPoints != null && (
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <span className="text-gray-600">
                                                    Cộng thêm{' '}
                                                    <strong className="text-gray-900">
                                                        {getScoreTypeLabel(preview.scoreType)}
                                                    </strong>
                                                    <span className="text-gray-400 ml-1">
                                                        (+{formatScore(preview.adjustedPoints)})
                                                    </span>
                                                </span>
                                                <span className="font-semibold text-primary-900 tabular-nums">
                                                    → {formatScore(preview.projectedScore)}
                                                </span>
                                            </div>
                                        )}
                                        {!preview.willCreateLedgerEntry && !preview.willReverseRelated && (
                                            <p className="text-gray-500">Không thay đổi điểm trên sổ</p>
                                        )}
                                        {preview.note && (
                                            <p className="text-xs text-gray-600 pt-1 border-t border-gray-100">
                                                {preview.note}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={deciding || (decision === 'APPROVED' && previewLoading) || (addBonus && !adjustedPoints.trim())}
                                className="rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {deciding ? 'Đang lưu...' : 'Xác nhận quyết định'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/70 p-4"
                    role="dialog"
                    aria-modal
                    onClick={() => setLightboxUrl(null)}
                >
                    <img
                        src={lightboxUrl}
                        alt="Ảnh minh chứng phóng to"
                        className="max-h-[90dvh] max-w-full rounded-xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ScoreAppealDetailPanel;

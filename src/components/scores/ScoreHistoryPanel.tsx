import React from 'react';
import { Link } from 'react-router-dom';
import {
    ScoreHistoryViewResponse,
    ScoreHistoryDetailResponse,
    ScoreTotalResponse,
    ScoreType,
    SCORE_TYPE_ORDER,
    SCORE_TYPE_META,
    getScoreTypeLabel,
    getSourceTypeLabel,
    getSourceTypeColor,
    formatScore,
    formatDateTime,
    isScoreDeduction,
} from '../../types/score';

interface ScoreHistoryPanelProps {
    data: ScoreHistoryViewResponse;
    eventLinkPrefix?: string;
    showParticipations?: boolean;
    /** Hiện nút khiếu nại trên từng dòng lịch sử (sinh viên) */
    onAppeal?: (history: ScoreHistoryDetailResponse) => void;
    /** Tổng điểm theo loại — khi có, hiển thị cả 3 loại thay vì chỉ currentScore */
    totalData?: ScoreTotalResponse | null;
}

const ScoreChangeBadge: React.FC<{ history: ScoreHistoryDetailResponse }> = ({ history }) => {
    const delta = history.newScore - history.oldScore;
    const isPositive = delta >= 0;

    return (
        <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 tabular-nums">{formatScore(history.oldScore)}</p>
            </div>
            <div
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${
                    isPositive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-red-50 text-red-700'
                }`}
            >
                <span className="hidden sm:inline text-gray-400 font-normal">→</span>
                {isPositive ? '+' : ''}{formatScore(delta)}
        <div
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums ${
                isPositive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-700'
            }`}
        >
            {isPositive ? '+' : ''}{formatScore(delta)}
        </div>
    );
};

export const ScoreHistoryPanel: React.FC<ScoreHistoryPanelProps> = ({
    data,
    eventLinkPrefix = '/student/events',
    showParticipations = true,
    onAppeal,
    totalData,
}) => {
    return (
        <div className="space-y-6">
            <section
                aria-label="Tổng quan điểm"
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
                <h2 className="text-lg font-semibold text-primary-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Tổng quan điểm
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {totalData ? (
                        SCORE_TYPE_ORDER.map(type => (
                            <div key={type} className="rounded-xl bg-gray-50 p-4 border border-gray-100 transition-colors hover:bg-gray-100/50">
                                <p className="text-sm font-medium text-gray-500 mb-1">{getScoreTypeLabel(type)}</p>
                                <p className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">
                                    {formatScore(totalData.totalsByType[type] || 0)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 transition-colors hover:bg-gray-100/50">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                {data.scoreType ? getScoreTypeLabel(data.scoreType) : 'Tổng cộng'}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">
                                {formatScore(data.currentScore)}
                            </p>
                        </div>
                    )}
                    
                    {totalData && (
                        <div className="rounded-xl bg-primary-50 p-4 border border-primary-100">
                            <p className="text-sm font-medium text-primary-600 mb-1">Tổng cộng</p>
                            <p className="text-2xl font-bold text-primary-900 tabular-nums tracking-tight">
                                {formatScore(totalData.grandTotal)}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {data.scoreHistories && data.scoreHistories.length > 0 && (
                <section aria-label="Lịch sử thay đổi">
                    <h2 className="text-lg font-semibold text-primary-900 mb-4">
                        Lịch sử thay đổi
                    </h2>
                    
                    <ol className="relative space-y-0">
                        {data.scoreHistories.map((history, idx) => (
                            <li key={history.id} className="relative pl-8 pb-6 last:pb-0">
                                {idx < data.scoreHistories.length - 1 && (
                                    <span
                                        className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200"
                                        aria-hidden
                                    />
                                )}
                                
                                <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-primary-900 z-10" />

                                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSourceTypeColor(history.sourceType)}`}>
                                                    {getSourceTypeLabel(history.sourceType)}
                                                </span>
                                                <time className="text-xs text-gray-500 font-medium">
                                                    {formatDateTime(history.changeDate)}
                                                </time>
                                            </div>
                                            <p className="text-sm text-gray-900 leading-relaxed">
                                                {history.reason}
                                            </p>
                                            
                                            {history.activityName && (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <span className="text-gray-500">Hoạt động:</span>
                                                    {history.activityId ? (
                                                        <Link 
                                                            to={`${eventLinkPrefix}/${history.activityId}`}
                                                            className="font-medium text-primary-700 hover:text-primary-900 hover:underline decoration-primary-300 underline-offset-4 transition-all"
                                                        >
                                                            {history.activityName}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{history.activityName}</span>
                                                    )}
                                                </div>
                                            )}

                                            {history.changedByFullName && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Bởi {history.changedByFullName}
                                                </p>
                                            )}
                                            {onAppeal && isScoreDeduction(history) && (
                                                <button
                                                    type="button"
                                                    onClick={() => onAppeal(history)}
                                                    className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline underline-offset-4 decoration-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 rounded-sm"
                                                >
                                                    Khiếu nại điểm trừ
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end sm:flex-col sm:items-end gap-3 sm:gap-1.5 min-w-[120px]">
                                            <ScoreChangeBadge history={history} />
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <span>Mới</span>
                                                <span className="font-bold text-gray-900 tabular-nums">
                                                    {formatScore(history.newScore)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {showParticipations && data.activityParticipations && data.activityParticipations.length > 0 && (
                <section aria-label="Tham gia hoạt động">
                    <h2 className="text-lg font-semibold text-primary-900 mb-4">
                        Tham gia hoạt động
                    </h2>
                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Hoạt động
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                                        Loại
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Điểm
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {data.activityParticipations.map((p, idx) => (
                                    <tr key={p.id ?? idx} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {p.activityName ?? '—'}
                                            </p>
                                            {p.participationDate && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatDateTime(p.participationDate)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                                            {p.participationType}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-primary-900 tabular-nums">
                                            +{formatScore(p.pointsEarned)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {(!calculatedHistories || calculatedHistories.length === 0) &&
                (!data.activityParticipations || data.activityParticipations.length === 0) && (
                <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                    <p className="text-gray-500">Không có lịch sử điểm cho bộ lọc này.</p>
                </div>
            )}
        </div>
    );
};

export default ScoreHistoryPanel;

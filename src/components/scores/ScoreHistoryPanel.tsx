import React from 'react';
import { Link } from 'react-router-dom';
import {
    ScoreHistoryViewResponse,
    ScoreHistoryDetailResponse,
    getScoreTypeLabel,
    getSourceTypeLabel,
    getSourceTypeColor,
    formatScore,
    formatDateTime,
} from '../../types/score';

interface ScoreHistoryPanelProps {
    data: ScoreHistoryViewResponse;
    eventLinkPrefix?: string;
    showParticipations?: boolean;
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
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400">Mới</p>
                <p className="text-base font-bold text-primary-900 tabular-nums">
                    {formatScore(history.newScore)}
                </p>
            </div>
        </div>
    );
};

export const ScoreHistoryPanel: React.FC<ScoreHistoryPanelProps> = ({
    data,
    eventLinkPrefix = '/student/events',
    showParticipations = true,
}) => {
    return (
        <div className="space-y-6">
            <section
                aria-label="Điểm hiện tại"
                className="rounded-2xl bg-gradient-to-br from-primary-900 to-primary-800 p-6 text-white shadow-premium"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-sm text-white/70">Điểm hiện tại</p>
                        <p className="text-4xl font-bold tabular-nums mt-1 tracking-tight">
                            {formatScore(data.currentScore)}
                        </p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-sm font-medium">{data.semesterName}</p>
                        <p className="text-sm text-white/70 mt-1">
                            {getScoreTypeLabel(data.scoreType)}
                        </p>
                        {data.studentCode && (
                            <p className="text-xs text-white/50 mt-1 font-mono">
                                {data.studentCode}
                                {data.studentName ? ` · ${data.studentName}` : ''}
                            </p>
                        )}
                    </div>
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
                                <span
                                    className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 border-primary-900 bg-white"
                                    aria-hidden
                                />
                                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span
                                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getSourceTypeColor(history.sourceType)}`}
                                                >
                                                    {getSourceTypeLabel(history.sourceType)}
                                                </span>
                                                <time className="text-xs text-gray-500">
                                                    {formatDateTime(history.changeDate)}
                                                </time>
                                            </div>
                                            <p className="text-sm text-gray-800 leading-relaxed">
                                                {history.reason}
                                            </p>
                                            {history.activityName && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Hoạt động:{' '}
                                                    {history.activityId ? (
                                                        <Link
                                                            to={`${eventLinkPrefix}/${history.activityId}`}
                                                            className="text-primary-900 font-medium hover:underline underline-offset-2"
                                                        >
                                                            {history.activityName}
                                                        </Link>
                                                    ) : (
                                                        history.activityName
                                                    )}
                                                </p>
                                            )}
                                            {history.seriesName && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Chuỗi sự kiện: {history.seriesName}
                                                </p>
                                            )}
                                            {history.changedByFullName && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Bởi {history.changedByFullName}
                                                </p>
                                            )}
                                        </div>
                                        <ScoreChangeBadge history={history} />
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

            {(!data.scoreHistories || data.scoreHistories.length === 0) &&
                (!data.activityParticipations || data.activityParticipations.length === 0) && (
                <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                    <p className="text-gray-500">Không có lịch sử điểm cho bộ lọc này.</p>
                </div>
            )}
        </div>
    );
};

export default ScoreHistoryPanel;

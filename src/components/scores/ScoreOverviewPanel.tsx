import React from 'react';
import {
    ScoreTypeSummary,
    ScoreTotalResponse,
    SCORE_TYPE_ORDER,
    SCORE_TYPE_META,
    isCumulativeScoreType,
    formatScore,
    getScoreItemLabel,
    ScoreType,
} from '../../types/score';

interface ScoreOverviewPanelProps {
    totalData?: ScoreTotalResponse | null;
    summaries?: ScoreTypeSummary[];
    selectedType?: 'ALL' | ScoreType;
}

export const ScoreOverviewPanel: React.FC<ScoreOverviewPanelProps> = ({
    totalData,
    summaries = [],
    selectedType = 'ALL',
}) => {
    const visibleTypes = selectedType === 'ALL'
        ? SCORE_TYPE_ORDER
        : [selectedType];

    const summaryMap = Object.fromEntries(
        summaries.map(s => [s.scoreType, s])
    ) as Partial<Record<ScoreType, ScoreTypeSummary>>;

    return (
        <div className="space-y-6">
            {totalData && selectedType === 'ALL' && (
                <section
                    aria-label="Tổng điểm học kỳ"
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-white shadow-premium"
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                    />
                    <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div>
                            <p className="text-sm font-medium tracking-wide text-white/70 uppercase">
                                Tổng điểm học kỳ
                            </p>
                            <p className="mt-2 text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">
                                {formatScore(totalData.grandTotal)}
                            </p>
                            <p className="mt-2 text-sm text-white/60">
                                {totalData.scoreCount} khoản điểm trong kỳ
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {SCORE_TYPE_ORDER.map(type => (
                                <div
                                    key={type}
                                    className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10 min-w-[120px]"
                                >
                                    <p className="text-xs text-white/60 font-medium">
                                        {SCORE_TYPE_META[type].shortLabel}
                                    </p>
                                    <p className="text-lg font-semibold tabular-nums mt-0.5">
                                        {formatScore(totalData.totalsByType?.[type] ?? 0)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className={`grid gap-4 ${visibleTypes.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                {visibleTypes.map(type => {
                    const summary = summaryMap[type];
                    const meta = SCORE_TYPE_META[type];
                    const semesterTotal = summary?.total ?? totalData?.totalsByType?.[type] ?? 0;
                    const cumulative = summary?.cumulativeTotal ?? totalData?.cumulativeTotals?.[type] ?? null;
                    const items = summary?.items ?? [];

                    return (
                        <article
                            key={type}
                            className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className={`h-1.5 bg-gradient-to-r ${meta.accent}`} />
                            <div className="flex flex-col flex-1 p-5 sm:p-6">
                                <header className="flex items-start justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-base font-semibold text-primary-900 leading-tight">
                                            {meta.label}
                                        </h3>
                                        {isCumulativeScoreType(type) && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Tích lũy suốt các học kỳ
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Học kỳ này
                                        </p>
                                        <p className="text-2xl font-bold text-primary-900 tabular-nums">
                                            {formatScore(semesterTotal)}
                                        </p>
                                    </div>
                                </header>

                                {isCumulativeScoreType(type) && cumulative != null && (
                                    <div className="mb-5 rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Tích lũy</span>
                                            <span className="text-lg font-semibold text-primary-900 tabular-nums">
                                                {formatScore(cumulative)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {items.length > 0 ? (
                                    <ul className="flex-1 divide-y divide-gray-100 -mx-1">
                                        {items.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start justify-between gap-3 py-3 px-1 first:pt-0 last:pb-0"
                                            >
                                                <span className="text-sm text-gray-700 leading-snug line-clamp-2">
                                                    {getScoreItemLabel(item)}
                                                </span>
                                                <span className="text-sm font-semibold text-primary-900 tabular-nums shrink-0">
                                                    +{formatScore(item.score)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 italic flex-1">
                                        Chưa có khoản điểm trong học kỳ này.
                                    </p>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default ScoreOverviewPanel;

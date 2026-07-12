import React from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import ProgressBar from '../common/ProgressBar';
import { StudentSeriesProgress } from '../../types/series';
import { SeriesResponse } from '../../types/series';

interface SeriesProgressProps {
    series: SeriesResponse;
    progress?: StudentSeriesProgress;
}

const SeriesProgress: React.FC<SeriesProgressProps> = ({ series, progress }) => {
    const totalActivities = progress?.totalActivities || series.activities?.length || series.totalActivities || 0;
    const completedCount = progress?.completedCount || 0;

    let completedActivityIds: number[] = [];
    if (progress?.completedActivityIds) {
        if (typeof progress.completedActivityIds === 'string') {
            try {
                completedActivityIds = JSON.parse(progress.completedActivityIds);
            } catch {
                completedActivityIds = [];
            }
        } else if (Array.isArray(progress.completedActivityIds)) {
            completedActivityIds = progress.completedActivityIds;
        }
    }

    return (
        <div className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-primary-900 mb-4">Tiến độ chuỗi sự kiện</h3>

            <div className="space-y-4">
                <div>
                    <ProgressBar
                        current={completedCount}
                        total={totalActivities}
                        showLabel={true}
                        size="large"
                        color="primary"
                    />
                </div>

                {progress && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Đã hoàn thành
                            </p>
                            <p className="mt-1 text-2xl font-bold text-primary-900 tabular-nums">
                                {completedCount}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Tổng số sự kiện
                            </p>
                            <p className="mt-1 text-2xl font-bold text-gray-700 tabular-nums">
                                {totalActivities}
                            </p>
                        </div>
                    </div>
                )}

                {series.activities && series.activities.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                            Danh sách sự kiện
                        </h4>
                        <div className="space-y-2">
                            {series.activities
                                .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
                                .map((activity) => {
                                    const isCompleted = completedActivityIds.includes(activity.id);
                                    return (
                                        <div
                                            key={activity.id}
                                            className={`flex items-center justify-between gap-3 p-3 rounded-xl ${
                                                isCompleted
                                                    ? 'bg-emerald-50/80 border border-emerald-100'
                                                    : 'bg-gray-50/60 border border-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-xs font-semibold text-gray-400 flex-shrink-0 tabular-nums">
                                                    #{activity.seriesOrder || 0}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.name}
                                                </span>
                                            </div>
                                            {isCompleted ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold shrink-0">
                                                    <CheckCircle size={14} weight="fill" />
                                                    Hoàn thành
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400 text-xs shrink-0">
                                                    <Circle size={14} />
                                                    Chưa hoàn thành
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeriesProgress;

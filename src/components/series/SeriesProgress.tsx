import React from 'react';
import ProgressBar from '../common/ProgressBar';
import { StudentSeriesProgress, parseMilestonePoints } from '../../types/series';
import { SeriesResponse } from '../../types/series';

interface SeriesProgressProps {
    series: SeriesResponse;
    progress?: StudentSeriesProgress;
}

const SeriesProgress: React.FC<SeriesProgressProps> = ({ series, progress }) => {
    // Use totalActivities from progress (API response) if available, otherwise from series
    const totalActivities = progress?.totalActivities || series.activities?.length || series.totalActivities || 0;
    const completedCount = progress?.completedCount || 0;
    
    // Handle completedActivityIds - can be string (JSON) or array
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
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-[#001C44] mb-4">Tiến độ chuỗi sự kiện</h3>
            
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
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <div className="text-sm text-gray-500">Đã hoàn thành</div>
                            <div className="text-2xl font-bold text-[#001C44]">
                                {completedCount}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Tổng số sự kiện</div>
                            <div className="text-2xl font-bold text-gray-700">
                                {totalActivities}
                            </div>
                        </div>
                    </div>
                )}

                {series.activities && series.activities.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Danh sách sự kiện:
                        </h4>
                        <div className="space-y-2">
                            {series.activities
                                .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
                                .map((activity) => {
                                    const isCompleted = completedActivityIds.includes(activity.id);
                                    return (
                                        <div
                                            key={activity.id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                isCompleted
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-500 flex-shrink-0">
                                                    #{activity.seriesOrder || 0}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.name}
                                                </span>
                                            </div>
                                            {isCompleted ? (
                                                <span className="text-green-600 text-sm font-medium">
                                                    ✓ Hoàn thành
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">
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


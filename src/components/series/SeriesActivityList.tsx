import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityResponse } from '../../types/activity';
import { SeriesResponse } from '../../types/series';

interface SeriesActivityListProps {
    series: SeriesResponse;
    onAddActivity?: () => void;
    canManage?: boolean;
}

const SeriesActivityList: React.FC<SeriesActivityListProps> = ({
    series,
    onAddActivity,
    canManage = false
}) => {
    // Get activities and sort by seriesOrder (ascending)
    // Activities in series have type, scoreType, maxPoints = null (values come from series)
    const activities = (series.activities || [])
        .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));

    const getTypeLabel = (type: string | null) => {
        // Activities in series have type = null, so show "N/A" or "Sự kiện trong chuỗi"
        if (!type) return 'Sự kiện trong chuỗi';
        const labels: Record<string, string> = {
            SUKIEN: 'Sự kiện',
            MINIGAME: 'Mini Game',
            CONG_TAC_XA_HOI: 'Công tác xã hội',
            CHUYEN_DE_DOANH_NGHIEP: 'Chuyên đề doanh nghiệp'
        };
        return labels[type] || type;
    };

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#001C44]">
                    Danh sách sự kiện ({activities.length})
                </h3>
                {canManage && onAddActivity && (
                    <button
                        onClick={onAddActivity}
                        className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                        + Thêm sự kiện
                    </button>
                )}
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>Chưa có sự kiện nào trong chuỗi này</p>
                    {canManage && onAddActivity && (
                        <button
                            onClick={onAddActivity}
                            className="mt-4 btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Thêm sự kiện đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[#001C44] text-white rounded-full flex items-center justify-center font-bold">
                                        {activity.seriesOrder || 0}
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate" title={activity.name}>
                                            {activity.name}
                                        </h4>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-gray-500">
                                                {new Date(activity.startDate).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">{activity.location}</span>
                                            {activity.type && (
                                                <>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {getTypeLabel(activity.type)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {canManage ? (
                                        <Link
                                            to={`/manager/events/${activity.id}`}
                                            className="text-sm text-[#001C44] hover:underline"
                                        >
                                            Xem
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/student/events/${activity.id}`}
                                            className="text-sm text-[#001C44] hover:underline"
                                        >
                                            Xem
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default SeriesActivityList;


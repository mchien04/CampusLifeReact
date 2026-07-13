import React from 'react';
import { Link } from 'react-router-dom';
import {
    CalendarBlank,
    MapPin,
    Plus,
    ArrowSquareOut,
    ListBullets,
} from '@phosphor-icons/react';
import { ActivityResponse } from '../../types/activity';
import { SeriesResponse } from '../../types/series';
import { getActivityTypeLabel } from '../../utils/vietnameseLabels';

interface SeriesActivityListProps {
    series: SeriesResponse;
    onAddActivity?: () => void;
    canManage?: boolean;
}

const formatActivityDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const SeriesActivityList: React.FC<SeriesActivityListProps> = ({
    series,
    onAddActivity,
    canManage = false,
}) => {
    const activities = (series.activities || []).sort(
        (a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)
    );

    return (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
                        <ListBullets size={22} weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold tracking-tight text-primary-900">
                            Sự kiện trong chuỗi
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                            {activities.length} sự kiện
                        </p>
                    </div>
                </div>
                {canManage && onAddActivity && (
                    <button
                        type="button"
                        onClick={onAddActivity}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                    >
                        <Plus size={16} weight="bold" />
                        Thêm sự kiện
                    </button>
                )}
            </div>

            {activities.length === 0 ? (
                <div className="px-6 py-14 text-center">
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Chưa có sự kiện nào trong chuỗi này.
                    </p>
                    {canManage && onAddActivity && (
                        <button
                            type="button"
                            onClick={onAddActivity}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-primary-900 transition-all hover:border-primary-900 hover:bg-primary-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                        >
                            <Plus size={16} weight="bold" />
                            Thêm sự kiện đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                <th className="px-5 py-3 text-left w-14 tabular-nums">#</th>
                                <th className="px-5 py-3 text-left">Tên sự kiện</th>
                                <th className="px-5 py-3 text-left">Thời gian</th>
                                <th className="px-5 py-3 text-left">Địa điểm</th>
                                <th className="px-5 py-3 text-left">Loại</th>
                                <th className="px-5 py-3 text-right w-24">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activities.map((activity) => (
                                <ActivityRow
                                    key={activity.id}
                                    activity={activity}
                                    canManage={canManage}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

const ActivityRow: React.FC<{ activity: ActivityResponse; canManage: boolean }> = ({
    activity,
    canManage,
}) => {
    const detailPath = canManage
        ? `/manager/events/${activity.id}`
        : `/student/events/${activity.id}`;

    const typeLabel = activity.type
        ? getActivityTypeLabel(activity.type)
        : 'Sự kiện trong chuỗi';

    return (
        <tr className="transition-colors hover:bg-primary-50/30">
            <td className="px-5 py-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-xs font-bold text-white tabular-nums">
                    {activity.seriesOrder || 0}
                </span>
            </td>
            <td className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary-900 line-clamp-2" title={activity.name}>
                        {activity.name}
                    </p>
                    {canManage && (activity.isDraft ?? activity.draft) && (
                        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                            Nháp
                        </span>
                    )}
                </div>
            </td>
            <td className="px-5 py-4 text-gray-600">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <CalendarBlank size={15} className="shrink-0 text-gray-400" />
                    {formatActivityDate(activity.startDate)}
                </span>
            </td>
            <td className="px-5 py-4 text-gray-600">
                {activity.location ? (
                    <span className="inline-flex items-center gap-1.5 line-clamp-1">
                        <MapPin size={15} className="shrink-0 text-gray-400" />
                        {activity.location}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                )}
            </td>
            <td className="px-5 py-4">
                <span className="inline-flex rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {typeLabel}
                </span>
            </td>
            <td className="px-5 py-4 text-right">
                <Link
                    to={detailPath}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary-900 transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20 rounded"
                >
                    Xem
                    <ArrowSquareOut size={14} />
                </Link>
            </td>
        </tr>
    );
};

export default SeriesActivityList;

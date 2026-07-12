import React from 'react';
import { Link } from 'react-router-dom';
import {
    Stack,
    CalendarBlank,
    Clock,
    ClipboardText,
    Medal,
    CheckCircle,
} from '@phosphor-icons/react';
import { SeriesResponse } from '../../types/series';
import { getScoreTypeLabel } from '../../types/score';
import { localizeVi } from '../../utils/vietnameseLabels';
import ProgressBar from '../common/ProgressBar';

interface SeriesCardProps {
    series: SeriesResponse;
    progress?: {
        completedCount: number;
        pointsEarned: string;
    };
    onRegister?: (seriesId: number) => void;
    isRegistered?: boolean;
}

const btnPrimary =
    'w-full inline-flex items-center justify-center rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white text-center transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30';
const btnAccent =
    'w-full inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary-900 text-center transition-all hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const SeriesCard: React.FC<SeriesCardProps> = ({
    series,
    progress,
    onRegister,
    isRegistered,
}) => {
    const milestones = series.milestonePoints || {};
    const totalActivities = series.activities?.length || series.totalActivities || 0;
    const completedCount = progress?.completedCount || 0;
    const displayName = localizeVi(series.name) || series.name;
    const displayDescription = series.description ? localizeVi(series.description) : null;

    const canRegister = () => {
        if (isRegistered) return false;
        const now = new Date();
        if (series.registrationStartDate && new Date(series.registrationStartDate) > now) {
            return false;
        }
        if (series.registrationDeadline && new Date(series.registrationDeadline) < now) {
            return false;
        }
        return true;
    };

    return (
        <article className="group flex flex-col h-full rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden transition-all hover:border-accent/40 hover:shadow-lg">
            <div className="p-5 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-900 text-white">
                        <Stack size={20} weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-primary-900 line-clamp-2 leading-snug">
                            {displayName}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-900 ring-1 ring-primary-100">
                                <Medal size={12} weight="duotone" />
                                {getScoreTypeLabel(series.scoreType)}
                            </span>
                            {isRegistered && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                                    <CheckCircle size={12} weight="fill" />
                                    Đã đăng ký
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {displayDescription && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow leading-relaxed">
                        {displayDescription}
                    </p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarBlank size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate tabular-nums">
                            {totalActivities} sự kiện trong chuỗi
                        </span>
                    </div>
                    {series.registrationStartDate && (
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="shrink-0 text-gray-400" />
                            <span className="truncate">
                                Mở đăng ký: {formatDateTime(series.registrationStartDate)}
                            </span>
                        </div>
                    )}
                    {series.registrationDeadline && (
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="shrink-0 text-gray-400" />
                            <span className="truncate">
                                Hạn đăng ký: {formatDateTime(series.registrationDeadline)}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <ClipboardText size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate">
                            {series.requiresApproval ? 'Đăng ký cần duyệt' : 'Đăng ký tự duyệt'}
                        </span>
                    </div>
                </div>

                {progress && (
                    <div className="mb-4">
                        <ProgressBar
                            current={completedCount}
                            total={totalActivities}
                            showLabel={true}
                            size="medium"
                            color="primary"
                        />
                    </div>
                )}

                {Object.keys(milestones).length > 0 && (
                    <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Điểm milestone
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(milestones)
                                .slice(0, 3)
                                .map(([count, points]) => (
                                    <span
                                        key={count}
                                        className="text-xs px-2 py-1 bg-white rounded-lg border border-gray-100 font-medium text-gray-700 tabular-nums"
                                    >
                                        {count} sự kiện → {points} điểm
                                    </span>
                                ))}
                            {Object.keys(milestones).length > 3 && (
                                <span className="text-xs px-2 py-1 text-gray-500">
                                    +{Object.keys(milestones).length - 3} mốc khác
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-auto">
                    <Link to={`/student/series/${series.id}`} className={btnPrimary}>
                        Xem chi tiết
                    </Link>

                    {canRegister() && onRegister && (
                        <button
                            type="button"
                            onClick={() => onRegister(series.id)}
                            className={btnAccent}
                        >
                            Đăng ký chuỗi
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default SeriesCard;

import React from 'react';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { StudentSeriesProgress } from '../../types/series';

interface SeriesProgressBannerProps {
    progress: StudentSeriesProgress;
}

const SeriesProgressBanner: React.FC<SeriesProgressBannerProps> = ({ progress }) => {
    const minimumRequirementEnabled = progress?.minimumRequirementEnabled ?? false;
    const minimumRequirementMet = progress?.minimumRequirementMet ?? false;
    const minimumRequiredEvents = progress?.minimumRequiredEvents ?? 0;
    const remainingToAvoidPenalty = progress?.remainingToAvoidPenalty ?? 0;
    const minimumPenaltyPoints = progress?.minimumPenaltyPoints ?? 0;

    if (!minimumRequirementEnabled) {
        return null;
    }

    if (minimumRequirementMet) {
        return (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 sm:p-5 shadow-premium">
                <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle size={20} weight="fill" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-900">
                            Đã đạt điều kiện tối thiểu
                        </h3>
                        <p className="mt-1 text-sm text-emerald-800 leading-relaxed">
                            Bạn đã tham gia đủ số lượng sự kiện tối thiểu yêu cầu ({minimumRequiredEvents} sự kiện).
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 sm:p-5 shadow-premium">
            <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Warning size={20} weight="fill" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-amber-900">
                        Chưa đạt điều kiện tối thiểu
                    </h3>
                    <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                        Bạn cần tham gia thêm <strong className="tabular-nums">{remainingToAvoidPenalty}</strong>{' '}
                        sự kiện nữa để đạt điều kiện tối thiểu ({minimumRequiredEvents} sự kiện). Nếu không hoàn
                        thành, bạn sẽ bị phạt <strong className="tabular-nums">{minimumPenaltyPoints}</strong> điểm.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeriesProgressBanner;

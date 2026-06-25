import React from 'react';
import { StudentSeriesProgress } from '../../types/series';

interface SeriesProgressBannerProps {
    progress: StudentSeriesProgress;
}

const SeriesProgressBanner: React.FC<SeriesProgressBannerProps> = ({ progress }) => {
    // Defensive: backend returns Map<String, Object> with no fixed DTO contract
    // Guard against missing or undefined fields
    const minimumRequirementEnabled = progress?.minimumRequirementEnabled ?? false;
    const minimumRequirementMet = progress?.minimumRequirementMet ?? false;
    const minimumRequiredEvents = progress?.minimumRequiredEvents ?? 0;
    const remainingToAvoidPenalty = progress?.remainingToAvoidPenalty ?? 0;
    const minimumPenaltyPoints = progress?.minimumPenaltyPoints ?? 0;

    // Only show banner if minimum requirement is enabled
    if (!minimumRequirementEnabled) {
        return null;
    }

    if (minimumRequirementMet) {
        return (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-green-500">✅</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                            Đã đạt điều kiện tối thiểu
                        </h3>
                        <p className="mt-1 text-sm text-green-700">
                            Chúc mừng! Bạn đã tham gia đủ số lượng sự kiện tối thiểu yêu cầu ({minimumRequiredEvents} sự kiện).
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                    <span className="text-yellow-500">⚠️</span>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        Chưa đạt điều kiện tối thiểu
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                        Bạn cần tham gia thêm <strong>{remainingToAvoidPenalty}</strong> sự kiện nữa để đạt điều kiện tối thiểu ({minimumRequiredEvents} sự kiện).
                        Nếu không hoàn thành, bạn sẽ bị phạt <strong>{minimumPenaltyPoints}</strong> điểm.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeriesProgressBanner;

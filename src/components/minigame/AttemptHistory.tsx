import React from 'react';
import { MiniGameAttempt, AttemptStatus } from '../../types/minigame';

interface AttemptHistoryProps {
    attempts: MiniGameAttempt[];
}

const AttemptHistory: React.FC<AttemptHistoryProps> = ({ attempts }) => {
    const getStatusLabel = (status: AttemptStatus) => {
        const labels: Record<AttemptStatus, string> = {
            [AttemptStatus.IN_PROGRESS]: 'Đang làm',
            [AttemptStatus.PASSED]: 'Đạt',
            [AttemptStatus.FAILED]: 'Không đạt'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: AttemptStatus) => {
        const colors: Record<AttemptStatus, string> = {
            [AttemptStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
            [AttemptStatus.PASSED]: 'bg-green-100 text-green-800',
            [AttemptStatus.FAILED]: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (attempts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Chưa có lần làm bài nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {attempts
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((attempt) => (
                    <div
                        key={attempt.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                        attempt.status
                                    )}`}
                                >
                                    {getStatusLabel(attempt.status)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-900">
                                    {attempt.correctCount} câu đúng
                                </span>
                            </div>
                            {attempt.submittedAt && (
                                <span className="text-xs text-gray-500">
                                    Nộp lúc: {new Date(attempt.submittedAt).toLocaleTimeString('vi-VN')}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default AttemptHistory;


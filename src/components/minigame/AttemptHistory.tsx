import React from 'react';
import { MiniGameAttempt } from '../../types/minigame';
import { CheckCircle, XCircle, Clock, CalendarBlank, GameController } from '@phosphor-icons/react';

interface AttemptHistoryProps {
    attempts: MiniGameAttempt[];
}

const AttemptHistory: React.FC<AttemptHistoryProps> = ({ attempts }) => {
    const getStatusLabel = (status: string) => {
        const labels: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
            'IN_PROGRESS': { 
                text: 'Đang làm', 
                color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                icon: <Clock weight="duotone" className="w-3.5 h-3.5 mr-1" />
            },
            'PASSED': { 
                text: 'Đạt', 
                color: 'bg-green-50 text-green-700 border-green-200',
                icon: <CheckCircle weight="fill" className="w-3.5 h-3.5 mr-1" />
            },
            'FAILED': { 
                text: 'Không đạt', 
                color: 'bg-red-50 text-red-700 border-red-200',
                icon: <XCircle weight="fill" className="w-3.5 h-3.5 mr-1" />
            }
        };
        return labels[status] || { 
            text: status, 
            color: 'bg-gray-50 text-gray-700 border-gray-200',
            icon: null
        };
    };

    if (attempts.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                <GameController weight="duotone" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có lần làm bài nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {attempts
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((attempt, index) => {
                    const statusConfig = getStatusLabel(attempt.status);
                    const isLatest = index === 0;
                    
                    return (
                        <div
                            key={attempt.id}
                            className={`p-4 sm:p-5 border rounded-2xl transition-all ${
                                isLatest ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.color}`}
                                    >
                                        {statusConfig.icon}
                                        {statusConfig.text}
                                    </span>
                                    {isLatest && (
                                        <span className="text-[10px] uppercase font-black tracking-wider text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                                            Mới nhất
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center text-sm font-medium text-gray-500">
                                    <CalendarBlank weight="duotone" className="w-4 h-4 mr-1.5" />
                                    {new Date(attempt.startedAt).toLocaleString('vi-VN')}
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Kết quả:</span>
                                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                                        {attempt.correctCount} câu đúng
                                    </span>
                                </div>
                                {attempt.submittedAt && (
                                    <span className="text-xs font-medium text-gray-400 flex items-center">
                                        <Clock weight="duotone" className="w-3.5 h-3.5 mr-1" />
                                        Nộp: {new Date(attempt.submittedAt).toLocaleTimeString('vi-VN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};

export default AttemptHistory;


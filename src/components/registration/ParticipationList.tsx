import React from 'react';
import { ActivityParticipationResponse, getParticipationTypeLabel } from '../../types/registration';

interface ParticipationListProps {
    participations: ActivityParticipationResponse[];
    showActions?: boolean;
    isAdmin?: boolean;
}

const ParticipationList: React.FC<ParticipationListProps> = ({
    participations,
    showActions = true,
    isAdmin = false
}) => {
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ATTENDANCE':
                return 'bg-blue-100 text-blue-800';
            case 'SUBMISSION':
                return 'bg-green-100 text-green-800';
            case 'VOLUNTEER':
                return 'bg-purple-100 text-purple-800';
            case 'ORGANIZER':
                return 'bg-yellow-100 text-yellow-800';
            case 'OTHER':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {participations.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">🎯</div>
                    <p className="text-gray-500">Chưa có ghi nhận tham gia nào</p>
                </div>
            ) : (
                participations.map((participation) => (
                    <div key={participation.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {participation.activityName}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>📅 {new Date(participation.date).toLocaleDateString('vi-VN')}</span>
                                    {participation.pointsEarned && (
                                        <span>⭐ {participation.pointsEarned} điểm</span>
                                    )}
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(participation.participationType)}`}>
                                {getParticipationTypeLabel(participation.participationType)}
                            </span>
                        </div>

                        {participation.notes && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Ghi chú:</span> {participation.notes}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Ghi nhận lúc: {new Date(participation.date).toLocaleString('vi-VN')}</span>
                            {isAdmin && (
                                <span>SV: {participation.studentName} ({participation.studentCode})</span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ParticipationList;

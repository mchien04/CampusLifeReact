import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import ScoreAppealDetailPanel from '../components/scores/ScoreAppealDetailPanel';
import ScoreSkeleton from '../components/scores/ScoreSkeleton';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreAppealResponse } from '../types/score';

const StudentScoreAppealDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const appealId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isFetching, isError, refetch } = useQuery({
        enabled: Number.isFinite(appealId) && appealId > 0,
        queryKey: ['scoreAppeal', appealId],
        queryFn: async () => {
            const response = await scoresAPI.getScoreAppeal(appealId);
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được chi tiết khiếu nại');
            }
            return response.data;
        },
    });

    const handleUpdated = (appeal: ScoreAppealResponse) => {
        queryClient.setQueryData(['scoreAppeal', appealId], appeal);
        queryClient.invalidateQueries({ queryKey: ['myScoreAppeals'] });
    };

    return (
        <StudentLayout>
            <div className="max-w-3xl mx-auto space-y-6 pb-12">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/student/scores/appeals')}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Quay lại
                    </button>
                    <Link
                        to="/student/scores"
                        className="text-sm font-medium text-primary-900 hover:underline"
                    >
                        Bảng điểm
                    </Link>
                </div>

                {isFetching && <ScoreSkeleton variant="history" />}

                {isError && !isFetching && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                        <p className="text-red-800 font-medium">Không tải được khiếu nại.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!isFetching && !isError && data && (
                    <ScoreAppealDetailPanel
                        appeal={data}
                        mode="student"
                        onUpdated={handleUpdated}
                    />
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentScoreAppealDetail;

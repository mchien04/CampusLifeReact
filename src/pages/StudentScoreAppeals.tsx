import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import ScoreAppealStatusBadge from '../components/scores/ScoreAppealStatusBadge';
import ScoreSkeleton from '../components/scores/ScoreSkeleton';
import { scoresAPI } from '../services/scoresAPI';
import {
    getScoreTypeLabel,
    formatScore,
    formatDateTime,
} from '../types/score';

const StudentScoreAppeals: React.FC = () => {
    const { data, isFetching, isError, refetch } = useQuery({
        queryKey: ['myScoreAppeals'],
        queryFn: async () => {
            const response = await scoresAPI.listMyScoreAppeals();
            if (!response.status) {
                throw new Error(response.message || 'Không lấy được danh sách khiếu nại');
            }
            return response.data ?? [];
        },
    });

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                <header className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                        Điểm số
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 tracking-tight">
                                Khiếu nại của tôi
                            </h1>
                            <p className="text-gray-600 max-w-prose leading-relaxed mt-2">
                                Theo dõi trạng thái và trao đổi với cán bộ về các khiếu nại điểm đã gửi.
                            </p>
                        </div>
                        <Link
                            to="/student/scores"
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors self-start"
                        >
                            Về bảng điểm
                        </Link>
                    </div>
                </header>

                {isFetching && <ScoreSkeleton variant="table" />}

                {isError && !isFetching && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                        <p className="text-red-800 font-medium">Không tải được danh sách khiếu nại.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!isFetching && !isError && (
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        {!data?.length ? (
                            <div className="py-16 text-center">
                                <p className="text-gray-500">Bạn chưa có khiếu nại nào.</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Từ lịch sử điểm, chọn dòng cần khiếu nại để gửi yêu cầu.
                                </p>
                                <Link
                                    to="/student/scores"
                                    className="inline-block mt-4 text-sm font-medium text-primary-900 hover:underline"
                                >
                                    Mở bảng điểm
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {data.map((appeal) => (
                                    <li key={appeal.id}>
                                        <Link
                                            to={`/student/scores/appeals/${appeal.id}`}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <ScoreAppealStatusBadge status={appeal.status} />
                                                    <span className="text-xs text-gray-400">
                                                        {getScoreTypeLabel(appeal.scoreType)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {appeal.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {appeal.createdAt ? formatDateTime(appeal.createdAt) : ''}
                                                    {appeal.requestedPoints != null && appeal.requestedPoints !== '' && (
                                                        <> · Đề xuất {formatScore(appeal.requestedPoints)}</>
                                                    )}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-primary-900 shrink-0">
                                                Xem chi tiết
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentScoreAppeals;

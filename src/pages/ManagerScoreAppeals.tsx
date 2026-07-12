import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ScoreAppealDetailPanel from '../components/scores/ScoreAppealDetailPanel';
import ScoreAppealStatusBadge from '../components/scores/ScoreAppealStatusBadge';
import ScoreSkeleton from '../components/scores/ScoreSkeleton';
import { scoresAPI } from '../services/scoresAPI';
import { academicPublicAPI } from '../services/academicPublicAPI';
import {
    ScoreAppealStatus,
    ScoreAppealResponse,
    getScoreTypeLabel,
    formatDateTime,
    formatScore,
} from '../types/score';
import { Semester } from '../types/admin';

const selectClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15';

const STATUS_OPTIONS: { value: '' | ScoreAppealStatus; label: string }[] = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'IN_REVIEW', label: 'Đang xem xét' },
    { value: 'APPROVED', label: 'Đã chấp nhận' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'CLOSED', label: 'Đã đóng' },
];

const ManagerScoreAppeals: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const detailId = id ? Number(id) : null;

    const [status, setStatus] = useState<'' | ScoreAppealStatus>('PENDING');
    const [semesterId, setSemesterId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        academicPublicAPI.getSemesters()
            .then((data) => setSemesters(data))
            .catch(() => toast.error('Không lấy được danh sách học kỳ'));
    }, []);

    const { data, isFetching, isError, refetch } = useQuery({
        enabled: !detailId,
        queryKey: ['staffScoreAppeals', status, semesterId, page],
        queryFn: async () => {
            const response = await scoresAPI.listScoreAppeals({
                status: status || undefined,
                semesterId: semesterId ?? undefined,
                page,
                size: pageSize,
            });
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được hàng đợi khiếu nại');
            }
            return response.data;
        },
    });

    const {
        data: detail,
        isFetching: isDetailFetching,
        isError: isDetailError,
        refetch: refetchDetail,
    } = useQuery({
        enabled: Boolean(detailId && Number.isFinite(detailId)),
        queryKey: ['scoreAppeal', detailId],
        queryFn: async () => {
            const response = await scoresAPI.getScoreAppeal(detailId!);
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được chi tiết khiếu nại');
            }
            return response.data;
        },
    });

    const handleUpdated = (updated: ScoreAppealResponse) => {
        queryClient.setQueryData(['scoreAppeal', detailId], updated);
        queryClient.invalidateQueries({ queryKey: ['staffScoreAppeals'] });
        if (updated.status === 'APPROVED') {
            queryClient.invalidateQueries({ queryKey: ['scoreHistory'] });
            queryClient.invalidateQueries({ queryKey: ['scoresView'] });
            queryClient.invalidateQueries({ queryKey: ['scoresTotal'] });
        }
    };

    if (detailId) {
        return (
            <div className="space-y-6 pb-10">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/scores/appeals')}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Quay lại danh sách
                    </button>
                </div>

                {isDetailFetching && <ScoreSkeleton variant="history" />}

                {isDetailError && !isDetailFetching && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                        <p className="text-red-800 font-medium">Không tải được khiếu nại.</p>
                        <button
                            type="button"
                            onClick={() => refetchDetail()}
                            className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {!isDetailFetching && !isDetailError && detail && (
                    <ScoreAppealDetailPanel
                        appeal={detail}
                        mode="staff"
                        onUpdated={handleUpdated}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-white shadow-premium">
                <p className="text-sm font-medium text-white/60">
                    Quản lý điểm
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                    Hàng đợi khiếu nại
                </h1>
                <p className="mt-2 text-white/70 max-w-prose">
                    Xem xét, trao đổi và quyết định các khiếu nại điểm của sinh viên.
                </p>
            </header>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                        <select
                            className={selectClass}
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as '' | ScoreAppealStatus);
                                setPage(0);
                            }}
                        >
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Học kỳ</label>
                        <select
                            className={selectClass}
                            value={semesterId || ''}
                            onChange={(e) => {
                                setSemesterId(e.target.value ? Number(e.target.value) : null);
                                setPage(0);
                            }}
                        >
                            <option value="">Tất cả học kỳ</option>
                            {semesters.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="w-full rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 active:scale-[0.98]"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            </section>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                {isFetching ? (
                    <ScoreSkeleton variant="table" />
                ) : isError ? (
                    <div className="py-16 text-center">
                        <p className="text-red-800 font-medium">Không tải được hàng đợi.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : !data?.content?.length ? (
                    <div className="py-16 text-center text-gray-500">
                        Không có khiếu nại phù hợp bộ lọc.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80">
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Sinh viên</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Tiêu đề</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Loại điểm</th>
                                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">Ngày gửi</th>
                                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.content.map((appeal) => (
                                        <tr key={appeal.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <ScoreAppealStatusBadge status={appeal.status} />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {appeal.studentFullName || '-'}
                                                </p>
                                                <p className="text-xs font-mono text-gray-500">
                                                    {appeal.studentCode || ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm text-gray-900 line-clamp-2">{appeal.title}</p>
                                                {appeal.requestedPoints != null && appeal.requestedPoints !== '' && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Đề xuất {formatScore(appeal.requestedPoints)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-gray-600 hidden md:table-cell">
                                                {getScoreTypeLabel(appeal.scoreType)}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                                                {appeal.createdAt ? formatDateTime(appeal.createdAt) : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <Link
                                                    to={`/manager/scores/appeals/${appeal.id}`}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-900 hover:bg-primary-900/5"
                                                >
                                                    Xử lý
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {data.totalPages > 1 && (
                            <nav className="flex justify-center items-center gap-2 border-t border-gray-100 py-4" aria-label="Phân trang">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
                                >
                                    Trước
                                </button>
                                <span className="px-3 text-sm text-gray-600 tabular-nums">
                                    {page + 1} / {data.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                                    disabled={page >= data.totalPages - 1}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
                                >
                                    Sau
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ManagerScoreAppeals;

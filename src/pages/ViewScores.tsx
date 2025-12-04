import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreType, ScoreTypeSummary, ScoreHistoryViewResponse, getSourceTypeLabel, getSourceTypeColor, formatScore, formatDateTime } from '../types/score';
import { useAuth } from '../contexts/AuthContext';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { studentAPI } from '../services/studentAPI';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';

const ViewScores: React.FC = () => {
    const { user } = useAuth();
    const [studentId, setStudentId] = useState<number | null>(null);
    const [semesterId, setSemesterId] = useState<string>('');
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const [yearId, setYearId] = useState<string>('');
    const [years, setYears] = useState<Array<{ id: number; name: string }>>([]);
    const [scoreType, setScoreType] = useState<'ALL' | ScoreType>('ALL');
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [historyPage, setHistoryPage] = useState(0);
    const historyPageSize = 20;

    useEffect(() => {
        // Get student id
        studentAPI.getMyProfile().then(p => {
            console.log('Profile response:', p);
            setStudentId(p.id);
        }).catch((e) => {
            console.error('Profile error:', e);
            toast.error('Không lấy được profile SV');
        });
        // Load years
        academicPublicAPI.getYears().then(list => {
            console.log('Years response:', list);
            const ys = list.map((y: any) => ({ id: y.id, name: y.name }));
            setYears(ys);
            if (ys.length > 0) setYearId(String(ys[0].id));
        }).catch((e) => {
            console.error('Years error:', e);
            toast.error('Không lấy được danh sách năm học');
        });
    }, []);

    useEffect(() => {
        if (!yearId) return;
        academicPublicAPI.getSemestersByYear(Number(yearId)).then(list => {
            const sems = list.map((s: any) => ({ id: s.id, name: s.name }));
            setSemesters(sems);
            if (sems.length > 0) setSemesterId(String(sems[0].id));
        });
    }, [yearId]);

    const { data, isFetching, isError } = useQuery({
        enabled: Boolean(semesterId && studentId),
        queryKey: ['scoresView', studentId, yearId, semesterId],
        queryFn: async () => {
            console.log('Calling scoresAPI with:', { studentId, semesterId });
            const response = await scoresAPI.getSemesterScores(Number(studentId), Number(semesterId));
            console.log('Scores response:', response);
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được điểm');
            }
            return response.data;
        },
    });

    const summaries = useMemo(() => {
        if (!data?.summaries) return [] as ScoreTypeSummary[];
        if (scoreType === 'ALL') return data.summaries;
        return data.summaries.filter(s => s.scoreType === scoreType);
    }, [data, scoreType]);

    // Query for score history
    const { data: historyData, isFetching: isHistoryFetching, isError: isHistoryError } = useQuery({
        enabled: Boolean(semesterId && studentId && activeTab === 'history'),
        queryKey: ['scoreHistory', studentId, semesterId, scoreType, historyPage],
        queryFn: async () => {
            const response = await scoresAPI.getScoreHistory({
                studentId: Number(studentId),
                semesterId: Number(semesterId),
                scoreType: scoreType === 'ALL' ? null : scoreType,
                page: historyPage,
                size: historyPageSize,
            });
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được lịch sử điểm');
            }
            return response.data;
        },
    });

    return (
        <StudentLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-[#001C44]">Bảng điểm học kỳ</h1>
                
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'overview'
                                    ? 'border-[#001C44] text-[#001C44]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Tổng quan
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('history');
                                setHistoryPage(0);
                            }}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'history'
                                    ? 'border-[#001C44] text-[#001C44]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Lịch sử chi tiết
                        </button>
                    </nav>
                </div>
                
                {/* Filters */}
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Năm học</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                value={yearId}
                                onChange={(e) => setYearId(e.target.value)}
                            >
                                {years.map(y => (
                                    <option key={y.id} value={y.id}>{y.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Học kỳ
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                value={semesterId}
                                onChange={(e) => setSemesterId(e.target.value)}
                            >
                                {semesters.map(sem => (
                                    <option key={sem.id} value={sem.id}>
                                        {sem.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loại điểm</label>
                            <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                                value={scoreType}
                                onChange={(e) => setScoreType(e.target.value as any)}
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="REN_LUYEN">Điểm rèn luyện</option>
                                <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                                <option value="CHUYEN_DE">Chuyên đề doanh nghiệp</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {((activeTab === 'overview' && isFetching) || (activeTab === 'history' && isHistoryFetching)) && (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {((activeTab === 'overview' && isError) || (activeTab === 'history' && isHistoryError)) && (
                    <div className="card p-6">
                        <div className="text-center">
                            <div className="text-red-500 text-4xl mb-2">⚠️</div>
                            <p className="text-red-600 font-medium">Lỗi tải dữ liệu</p>
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                <>
                {/* Scores List */}
                {Array.isArray(summaries) && summaries.length > 0 && (
                    <div className="space-y-4">
                        {summaries.map((s: ScoreTypeSummary, idx: number) => (
                            <div key={s.scoreType ?? idx} className="card p-6">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                    <div className="text-lg font-semibold text-[#001C44]">
                                        {s.scoreType === 'REN_LUYEN' && 'Điểm rèn luyện'}
                                        {s.scoreType === 'CONG_TAC_XA_HOI' && 'Điểm công tác xã hội'}
                                        {s.scoreType === 'CHUYEN_DE' && 'Điểm chuyên đề doanh nghiệp'}
                                    </div>
                                    <div className="text-xl font-bold text-[#001C44] bg-[#FFD66D] px-4 py-2 rounded-lg">
                                        Tổng: {s.total}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {(s.items ?? []).map((it, itemIdx) => (
                                        <div key={itemIdx} className="py-3 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {it.sourceType === 'MANUAL' && 'Nhập tay'}
                                                    {it.sourceType === 'ACTIVITY_CHECKIN' && 'Điểm danh hoạt động'}
                                                    {it.sourceType === 'ACTIVITY_SUBMISSION' && 'Nộp bài hoạt động'}
                                                    {it.sourceType === 'SERIES_MILESTONE' && '🎯 Điểm milestone (chuỗi sự kiện)'}
                                                    {it.sourceType === 'MINIGAME' && '🎮 Điểm minigame quiz'}
                                                    {it.sourceType === 'CHUYEN_DE_COUNT' && '📚 Đếm số buổi (chuyên đề)'}
                                                </div>
                                                {it.sourceNote && (
                                                    <div className="text-sm text-gray-600 mt-1">{it.sourceNote}</div>
                                                )}
                                            </div>
                                            <div className="text-lg font-bold text-[#001C44] ml-4">{it.score}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {(!summaries || summaries.length === 0) && !isFetching && !isError && (
                    <div className="card p-8 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                        <p className="text-gray-600 text-lg">Không có dữ liệu điểm cho học kỳ này.</p>
                    </div>
                )}
                </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && historyData && (
                    <div className="space-y-6">
                        {/* Current Score */}
                        <div className="card p-6 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm opacity-90">Điểm hiện tại</p>
                                    <p className="text-3xl font-bold mt-1">{formatScore(historyData.currentScore)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm opacity-90">{historyData.semesterName}</p>
                                    <p className="text-sm opacity-90 mt-1">
                                        {historyData.scoreType 
                                            ? (historyData.scoreType === 'REN_LUYEN' ? 'Điểm rèn luyện' :
                                               historyData.scoreType === 'CONG_TAC_XA_HOI' ? 'Điểm công tác xã hội' :
                                               'Điểm chuyên đề doanh nghiệp')
                                            : 'Tất cả loại điểm'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Score Histories */}
                        {historyData.scoreHistories && historyData.scoreHistories.length > 0 && (
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold text-[#001C44] mb-4">Lịch sử thay đổi điểm</h2>
                                <div className="space-y-4">
                                    {historyData.scoreHistories.map((history) => (
                                        <div key={history.id} className="border-l-4 border-[#001C44] pl-4 py-2 bg-gray-50 rounded-r">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSourceTypeColor(history.sourceType)}`}>
                                                            {getSourceTypeLabel(history.sourceType)}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {formatDateTime(history.changeDate)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-1">{history.reason}</p>
                                                    {history.activityName && (
                                                        <p className="text-sm text-gray-600">
                                                            Hoạt động: {history.activityId ? (
                                                                <Link to={`/student/events/${history.activityId}`} className="text-[#001C44] hover:underline">
                                                                    {history.activityName}
                                                                </Link>
                                                            ) : (
                                                                history.activityName
                                                            )}
                                                        </p>
                                                    )}
                                                    {history.seriesName && (
                                                        <p className="text-sm text-gray-600">
                                                            Chuỗi sự kiện: {history.seriesName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm text-gray-600">Điểm cũ</div>
                                                    <div className="text-lg font-semibold text-gray-500">{formatScore(history.oldScore)}</div>
                                                    <div className="text-2xl font-bold text-[#001C44] mt-1">→</div>
                                                    <div className="text-sm text-gray-600 mt-1">Điểm mới</div>
                                                    <div className="text-lg font-semibold text-[#001C44]">{formatScore(history.newScore)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity Participations */}
                        {historyData.activityParticipations && historyData.activityParticipations.length > 0 && (
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold text-[#001C44] mb-4">Chi tiết tham gia hoạt động</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hoạt động</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Loại</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Chuỗi sự kiện</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Điểm</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nguồn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {historyData.activityParticipations.map((participation) => (
                                                <tr key={participation.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        {participation.activityId && participation.activityName ? (
                                                            <Link to={`/student/events/${participation.activityId}`} className="text-[#001C44] hover:underline">
                                                                {participation.activityName}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {participation.activityType || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {participation.seriesName || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[#001C44]">
                                                        {formatScore(participation.pointsEarned)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {formatDateTime(participation.date)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSourceTypeColor(participation.sourceType)}`}>
                                                            {getSourceTypeLabel(participation.sourceType)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Empty State for History */}
                        {(!historyData.scoreHistories || historyData.scoreHistories.length === 0) && 
                         (!historyData.activityParticipations || historyData.activityParticipations.length === 0) && 
                         !isHistoryFetching && !isHistoryError && (
                            <div className="card p-8 text-center">
                                <div className="text-gray-400 text-6xl mb-4">📊</div>
                                <p className="text-gray-600 text-lg">Không có lịch sử điểm cho học kỳ này.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {historyData.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                                    disabled={historyPage === 0}
                                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Trước
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    Trang {historyPage + 1} / {historyData.totalPages}
                                </span>
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(historyData.totalPages - 1, p + 1))}
                                    disabled={historyPage >= historyData.totalPages - 1}
                                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default ViewScores;
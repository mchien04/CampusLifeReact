import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreType } from '../types/score';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { studentAPI } from '../services/studentAPI';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';
import ScoreFiltersBar from '../components/scores/ScoreFiltersBar';
import ScoreOverviewPanel from '../components/scores/ScoreOverviewPanel';
import ScoreHistoryPanel from '../components/scores/ScoreHistoryPanel';
import ScoreSkeleton from '../components/scores/ScoreSkeleton';

type TabId = 'overview' | 'history';

const ViewScores: React.FC = () => {
    const [studentId, setStudentId] = useState<number | null>(null);
    const [semesterId, setSemesterId] = useState<string>('');
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const [yearId, setYearId] = useState<string>('');
    const [years, setYears] = useState<Array<{ id: number; name: string }>>([]);
    const [scoreType, setScoreType] = useState<'ALL' | ScoreType>('ALL');
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [historyPage, setHistoryPage] = useState(0);
    const historyPageSize = 20;

    useEffect(() => {
        studentAPI.getMyProfile()
            .then(p => setStudentId(p.id))
            .catch(() => toast.error('Không lấy được thông tin sinh viên'));

        academicPublicAPI.getYears()
            .then(list => {
                const ys = list.map((y: { id: number; name: string }) => ({ id: y.id, name: y.name }));
                setYears(ys);
                if (ys.length > 0) setYearId(String(ys[0].id));
            })
            .catch(() => toast.error('Không lấy được danh sách năm học'));
    }, []);

    useEffect(() => {
        if (!yearId) return;
        academicPublicAPI.getSemestersByYear(Number(yearId))
            .then(list => {
                const sems = list.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name }));
                setSemesters(sems);
                if (sems.length > 0) setSemesterId(String(sems[0].id));
            });
    }, [yearId]);

    const queryEnabled = Boolean(semesterId && studentId);

    const { data, isFetching, isError, refetch } = useQuery({
        enabled: queryEnabled,
        queryKey: ['scoresView', studentId, semesterId],
        queryFn: async () => {
            const response = await scoresAPI.getSemesterScores(Number(studentId), Number(semesterId));
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được điểm');
            }
            return response.data;
        },
    });

    const { data: totalData } = useQuery({
        enabled: queryEnabled,
        queryKey: ['scoresTotal', studentId, semesterId],
        queryFn: async () => {
            const response = await scoresAPI.getTotalScore(Number(studentId), Number(semesterId));
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được tổng điểm');
            }
            return response.data;
        },
    });

    const { data: historyData, isFetching: isHistoryFetching, isError: isHistoryError } = useQuery({
        enabled: queryEnabled && activeTab === 'history',
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

    const tabs: { id: TabId; label: string }[] = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'history', label: 'Lịch sử chi tiết' },
    ];

    const isLoading = activeTab === 'overview' ? isFetching : isHistoryFetching;
    const hasError = activeTab === 'overview' ? isError : isHistoryError;

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                <header className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 tracking-wide">
                        Học kỳ · Điểm rèn luyện
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 tracking-tight">
                        Bảng điểm của bạn
                    </h1>
                    <p className="text-gray-600 max-w-prose leading-relaxed">
                        Theo dõi điểm rèn luyện, công tác xã hội và chuyên đề theo từng học kỳ.
                        Với CTXH và chuyên đề, bạn cũng xem được điểm tích lũy suốt các kỳ.
                    </p>
                </header>

                <ScoreFiltersBar
                    showYearFilter
                    yearId={yearId}
                    years={years}
                    onYearChange={setYearId}
                    semesterId={semesterId}
                    semesters={semesters}
                    onSemesterChange={setSemesterId}
                    scoreType={scoreType}
                    onScoreTypeChange={(t) => setScoreType(t === null ? 'ALL' : t)}
                />

                <nav
                    className="flex gap-1 rounded-xl bg-gray-100/80 p-1 w-fit"
                    aria-label="Chế độ xem điểm"
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'history') setHistoryPage(0);
                            }}
                            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2 ${
                                activeTab === tab.id
                                    ? 'bg-white text-primary-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {isLoading && <ScoreSkeleton variant={activeTab === 'history' ? 'history' : 'overview'} />}

                {hasError && !isLoading && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                        <p className="text-red-800 font-medium">Không tải được dữ liệu điểm.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {activeTab === 'overview' && !isFetching && !isError && data && (
                    <>
                        {(data.summaries?.length ?? 0) > 0 || totalData ? (
                            <ScoreOverviewPanel
                                totalData={totalData}
                                summaries={data.summaries}
                                selectedType={scoreType}
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                                <p className="text-gray-500 text-lg">Chưa có dữ liệu điểm cho học kỳ này.</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Tham gia hoạt động để bắt đầu tích lũy điểm.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'history' && !isHistoryFetching && !isHistoryError && historyData && (
                    <>
                        <ScoreHistoryPanel
                            data={historyData}
                            eventLinkPrefix="/student/events"
                        />

                        {historyData.totalPages > 1 && (
                            <nav
                                className="flex justify-center items-center gap-2 pt-2"
                                aria-label="Phân trang lịch sử"
                            >
                                <button
                                    type="button"
                                    onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                                    disabled={historyPage === 0}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                >
                                    Trước
                                </button>
                                <span className="px-3 text-sm text-gray-600 tabular-nums">
                                    {historyPage + 1} / {historyData.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setHistoryPage(p => Math.min(historyData.totalPages - 1, p + 1))}
                                    disabled={historyPage >= historyData.totalPages - 1}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                >
                                    Sau
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </StudentLayout>
    );
};

export default ViewScores;

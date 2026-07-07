import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { scoresAPI } from '../services/scoresAPI';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { departmentAPI } from '../services/api';
import { classAPI } from '../services/classAPI';
import { Semester } from '../types/admin';
import { StudentClass } from '../types/class';
import {
    ScoreType,
    StudentRankingResponse,
    getScoreTypeLabel,
    formatScore,
    RecalculationJobResponse,
} from '../types/score';
import ScoreHistoryPanel from '../components/scores/ScoreHistoryPanel';
import ScoreSkeleton from '../components/scores/ScoreSkeleton';

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    const topStyle =
        rank === 1
            ? 'bg-accent text-primary-900 ring-accent/50'
            : rank === 2
                ? 'bg-gray-100 text-gray-800 ring-gray-200'
                : rank === 3
                    ? 'bg-amber-50 text-amber-900 ring-amber-200'
                    : 'bg-white text-primary-900 ring-gray-100';

    return (
        <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums ring-1 ${topStyle}`}
        >
            {rank}
        </span>
    );
};

const ManagerScores: React.FC = () => {
    const queryClient = useQueryClient();

    const [semesterId, setSemesterId] = useState<number | null>(null);
    const [scoreType, setScoreType] = useState<ScoreType | null>(null);
    const [departmentId, setDepartmentId] = useState<number | null>(null);
    const [classId, setClassId] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);

    const [loading, setLoading] = useState(false);
    const [rankings, setRankings] = useState<StudentRankingResponse[]>([]);
    const [rankingMetadata, setRankingMetadata] = useState<{
        semesterName?: string;
        totalStudents?: number;
    }>({});

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const historyPageSize = 20;
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [historyKeyword, setHistoryKeyword] = useState('');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [tempKeyword, setTempKeyword] = useState('');

    const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
    const [showRecalculateConfirm, setShowRecalculateConfirm] = useState(false);
    const [isRecalculatingStudent, setIsRecalculatingStudent] = useState(false);
    const [recalculationJob, setRecalculationJob] = useState<RecalculationJobResponse | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadSemesters();
        loadDepartments();
    }, []);

    useEffect(() => {
        loadClasses();
        setClassId(null);
    }, [departmentId]);

    useEffect(() => {
        if (semesterId) loadRanking();
    }, [semesterId, scoreType, departmentId, classId, sortOrder]);

    const loadSemesters = async () => {
        try {
            const data = await academicPublicAPI.getSemesters();
            setSemesters(data);
            if (data.length > 0 && !semesterId) setSemesterId(data[0].id);
        } catch (error) {
            console.error('Error loading semesters:', error);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await departmentAPI.getAll();
            if (response.status && response.data) {
                let departmentsData: Array<{ id: number; name: string }> = [];
                if (Array.isArray(response.data)) {
                    departmentsData = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    const dataObj = response.data as { body?: unknown; data?: unknown };
                    departmentsData = (dataObj.body || dataObj.data || []) as Array<{ id: number; name: string }>;
                }
                setDepartments(departmentsData);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadClasses = async () => {
        try {
            if (departmentId) {
                const classesData = await classAPI.getClassesByDepartment(departmentId);
                let classesList: StudentClass[] = [];
                if (Array.isArray(classesData)) {
                    classesList = classesData;
                } else if (classesData && typeof classesData === 'object') {
                    const dataObj = classesData as { body?: StudentClass[]; data?: StudentClass[] };
                    classesList = dataObj.body || dataObj.data || [];
                }
                setClasses(classesList);
            } else {
                const response = await classAPI.getClasses();
                setClasses(response.content ?? []);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            setClasses([]);
        }
    };

    const loadRanking = async () => {
        if (!semesterId) return;
        setLoading(true);
        try {
            const response = await scoresAPI.getStudentRanking({
                semesterId,
                scoreType: scoreType || null,
                departmentId: departmentId || null,
                classId: classId || null,
                sortOrder,
            });
            if (response.status && response.data) {
                setRankings(response.data.rankings || []);
                setRankingMetadata({
                    semesterName: response.data.semesterName,
                    totalStudents: response.data.totalStudents,
                });
            } else {
                setRankings([]);
                setRankingMetadata({});
            }
        } catch (error) {
            console.error('Error loading ranking:', error);
            setRankings([]);
            setRankingMetadata({});
        } finally {
            setLoading(false);
        }
    };

    const { data: historyData, isFetching: isHistoryFetching } = useQuery({
        enabled: Boolean(selectedStudentId && semesterId),
        queryKey: ['scoreHistory', selectedStudentId, semesterId, scoreType, historyPage, historyStartDate, historyEndDate, historyKeyword],
        queryFn: async () => {
            const response = await scoresAPI.getScoreHistory({
                studentId: selectedStudentId!,
                semesterId: semesterId!,
                scoreType: scoreType || null,
                page: historyPage,
                size: historyPageSize,
                startDate: historyStartDate ? new Date(historyStartDate).toISOString() : null,
                endDate: historyEndDate ? new Date(historyEndDate).toISOString() : null,
                keyword: historyKeyword.trim() || null,
            });
            if (!response.status || !response.data) {
                throw new Error(response.message || 'Không lấy được lịch sử điểm');
            }
            return response.data;
        },
    });

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const handleViewHistory = (studentId: number) => {
        setSelectedStudentId(studentId);
        setHistoryPage(0);
        setHistoryStartDate('');
        setHistoryEndDate('');
        setHistoryKeyword('');
        setTempStartDate('');
        setTempEndDate('');
        setTempKeyword('');
    };

    const handleCloseHistory = () => {
        setSelectedStudentId(null);
        setHistoryPage(0);
    };

    const handleRecalculateAll = async () => {
        if (!semesterId) {
            toast.warning('Vui lòng chọn học kỳ');
            return;
        }
        setShowRecalculateConfirm(false);
        setIsRecalculatingAll(true);
        setRecalculationJob(null);

        try {
            const response = await scoresAPI.recalculateAsync(semesterId);
            if (response.status && response.data) {
                const { jobId } = response.data;
                toast.info('Job tính lại điểm đã được khởi tạo.');

                const poll = async () => {
                    try {
                        const statusRes = await scoresAPI.getRecalculationStatus(jobId);
                        if (statusRes.status && statusRes.data) {
                            setRecalculationJob(statusRes.data);
                            const s = statusRes.data.status;
                            if (s === 'COMPLETED') {
                                stopPolling();
                                setIsRecalculatingAll(false);
                                toast.success('Tính lại điểm toàn trường hoàn tất');
                                loadRanking();
                            } else if (s === 'FAILED' || s === 'TIMEOUT') {
                                stopPolling();
                                toast.error(`Job thất bại: ${statusRes.data.errorDetails || s}`);
                            }
                        }
                    } catch {
                        /* keep polling */
                    }
                };

                pollingRef.current = setInterval(poll, 3000);
                poll();
            } else {
                toast.error(response.message || 'Không thể khởi tạo job tính lại điểm');
                setIsRecalculatingAll(false);
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Có lỗi xảy ra khi tính lại điểm');
            setIsRecalculatingAll(false);
        }
    };

    const handleRetryRecalculation = async () => {
        if (!recalculationJob) return;
        setIsRecalculatingAll(true);
        try {
            const response = await scoresAPI.retryRecalculation(recalculationJob.id);
            if (response.status && response.data) {
                const newJobId = (response.data as { jobId?: number }).jobId || (response.data as unknown as number);
                toast.info('Đang thử lại job...');
                setRecalculationJob(null);
                const poll = async () => {
                    try {
                        const statusRes = await scoresAPI.getRecalculationStatus(newJobId);
                        if (statusRes.status && statusRes.data) {
                            setRecalculationJob(statusRes.data);
                            const s = statusRes.data.status;
                            if (s === 'COMPLETED') {
                                stopPolling();
                                setIsRecalculatingAll(false);
                                toast.success('Tính lại điểm toàn trường hoàn tất');
                                loadRanking();
                            } else if (s === 'FAILED' || s === 'TIMEOUT') {
                                stopPolling();
                                toast.error(`Job thất bại: ${statusRes.data.errorDetails || s}`);
                            }
                        }
                    } catch { /* keep polling */ }
                };
                pollingRef.current = setInterval(poll, 3000);
                poll();
            } else {
                toast.error(response.message || 'Retry thất bại');
                setIsRecalculatingAll(false);
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Có lỗi xảy ra khi retry');
            setIsRecalculatingAll(false);
        }
    };

    const handleRecalculateStudent = async () => {
        if (!selectedStudentId || !semesterId) return;
        setIsRecalculatingStudent(true);
        try {
            const response = await scoresAPI.recalculateStudentScore(selectedStudentId, semesterId);
            if (response.status) {
                toast.success(response.message || 'Tính lại điểm sinh viên thành công');
                queryClient.invalidateQueries({ queryKey: ['scoreHistory', selectedStudentId, semesterId] });
                loadRanking();
            } else {
                toast.error(response.message || 'Tính lại điểm sinh viên thất bại');
            }
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Có lỗi xảy ra khi tính lại điểm sinh viên');
        } finally {
            setIsRecalculatingStudent(false);
        }
    };

    const selectClass =
        'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/15 hover:border-gray-300';

    return (
        <div className="space-y-8 pb-10">
            <header className="rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-6 sm:p-8 text-white shadow-premium">
                <p className="text-sm font-medium text-white/60 uppercase tracking-wide">
                    Quản lý điểm
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                    Xếp hạng sinh viên
                </h1>
                <p className="mt-2 text-white/70 max-w-prose">
                    Lọc theo học kỳ, loại điểm, khoa và lớp. Xem lịch sử chi tiết từng sinh viên.
                </p>
            </header>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-premium">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                    Bộ lọc
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Học kỳ</label>
                        <select className={selectClass} value={semesterId || ''} onChange={(e) => setSemesterId(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">Chọn học kỳ</option>
                            {semesters.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại điểm</label>
                        <select className={selectClass} value={scoreType || ''} onChange={(e) => setScoreType(e.target.value ? (e.target.value as ScoreType) : null)}>
                            <option value="">Tổng điểm</option>
                            <option value="REN_LUYEN">{getScoreTypeLabel('REN_LUYEN')}</option>
                            <option value="CONG_TAC_XA_HOI">{getScoreTypeLabel('CONG_TAC_XA_HOI')}</option>
                            <option value="CHUYEN_DE">{getScoreTypeLabel('CHUYEN_DE')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Khoa</label>
                        <select className={selectClass} value={departmentId || ''} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : null)}>
                            <option value="">Tất cả</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Lớp</label>
                        <select className={selectClass} value={classId || ''} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)} disabled={!departmentId}>
                            <option value="">Tất cả</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.className}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sắp xếp</label>
                        <select className={selectClass} value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}>
                            <option value="DESC">Cao → thấp</option>
                            <option value="ASC">Thấp → cao</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={loadRanking}
                            className="flex-1 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                        >
                            Làm mới
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRecalculateConfirm(true)}
                            disabled={!semesterId}
                            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900 transition-all hover:bg-amber-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            title="Tính lại toàn trường"
                        >
                            Tính lại
                        </button>
                    </div>
                </div>
            </section>

            {rankingMetadata.semesterName && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 px-1">
                    <span>
                        <span className="text-gray-400">Học kỳ:</span>{' '}
                        <strong className="text-primary-900">{rankingMetadata.semesterName}</strong>
                    </span>
                    <span>
                        <span className="text-gray-400">Loại:</span>{' '}
                        <strong className="text-primary-900">{getScoreTypeLabel(scoreType)}</strong>
                    </span>
                    <span>
                        <span className="text-gray-400">Sinh viên:</span>{' '}
                        <strong className="text-primary-900 tabular-nums">{rankingMetadata.totalStudents ?? 0}</strong>
                    </span>
                </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Hạng</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">MSSV</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Họ tên</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Lớp</th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Khoa</th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm</th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-28"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7}>
                                        <ScoreSkeleton variant="table" />
                                    </td>
                                </tr>
                            ) : rankings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                                        {semesterId ? 'Không có dữ liệu xếp hạng' : 'Vui lòng chọn học kỳ'}
                                    </td>
                                </tr>
                            ) : (
                                rankings.map(ranking => (
                                    <tr
                                        key={`${ranking.studentId}-${ranking.scoreType || 'total'}`}
                                        className="group transition-colors hover:bg-gray-50/80"
                                    >
                                        <td className="px-4 py-3.5">
                                            <RankBadge rank={ranking.rank} />
                                        </td>
                                        <td className="px-4 py-3.5 text-sm font-mono text-gray-700">
                                            {ranking.studentCode}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm font-medium text-gray-900">{ranking.studentName}</p>
                                            <p className="text-xs text-gray-400 md:hidden mt-0.5">
                                                {ranking.className} · {ranking.departmentName}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-600 hidden md:table-cell">
                                            {ranking.className || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-gray-600 hidden lg:table-cell">
                                            {ranking.departmentName || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="text-base font-bold text-primary-900 tabular-nums">
                                                {formatScore(ranking.score)}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-0.5">{ranking.scoreTypeLabel}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleViewHistory(ranking.studentId)}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-900 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-primary-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                            >
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedStudentId && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-900/40 backdrop-blur-sm p-0 sm:p-4"
                    role="dialog"
                    aria-modal
                    aria-labelledby="history-modal-title"
                >
                    <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 sm:px-6 py-4">
                            <div>
                                <h2 id="history-modal-title" className="text-lg font-bold text-primary-900">
                                    Lịch sử điểm
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {historyData?.studentName ?? 'Đang tải...'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleRecalculateStudent}
                                    disabled={isRecalculatingStudent}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
                                >
                                    {isRecalculatingStudent ? 'Đang tính...' : 'Tính lại SV'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseHistory}
                                    className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                    aria-label="Đóng"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                                    <input type="datetime-local" className={selectClass} value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                                    <input type="datetime-local" className={selectClass} value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Từ khóa</label>
                                        <input type="text" placeholder="Lý do, hoạt động..." className={selectClass} value={tempKeyword} onChange={(e) => setTempKeyword(e.target.value)} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHistoryStartDate(tempStartDate);
                                            setHistoryEndDate(tempEndDate);
                                            setHistoryKeyword(tempKeyword);
                                            setHistoryPage(0);
                                        }}
                                        className="rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
                                    >
                                        Lọc
                                    </button>
                                </div>
                            </div>

                            {isHistoryFetching ? (
                                <ScoreSkeleton variant="history" />
                            ) : historyData ? (
                                <>
                                    <ScoreHistoryPanel data={historyData} eventLinkPrefix="/manager/events" />
                                    {historyData.totalPages > 1 && (
                                        <nav className="flex justify-center items-center gap-2">
                                            <button type="button" onClick={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40">Trước</button>
                                            <span className="text-sm tabular-nums">{historyPage + 1} / {historyData.totalPages}</span>
                                            <button type="button" onClick={() => setHistoryPage(p => Math.min(historyData.totalPages - 1, p + 1))} disabled={historyPage >= historyData.totalPages - 1} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40">Sau</button>
                                        </nav>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-red-600 py-8">Không thể tải lịch sử điểm</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showRecalculateConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-primary-900 mb-2">Xác nhận tính lại điểm</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            Tính lại điểm cho toàn bộ sinh viên trong học kỳ này. Quá trình có thể mất nhiều thời gian.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowRecalculateConfirm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button type="button" onClick={handleRecalculateAll} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}

            {isRecalculatingAll && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-lg font-bold text-primary-900 text-center mb-4">
                            {recalculationJob ? 'Đang tính lại điểm...' : 'Đang khởi tạo job...'}
                        </h2>
                        {recalculationJob ? (
                            <div className="space-y-4">
                                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full bg-primary-900 transition-all duration-500 rounded-full" style={{ width: `${recalculationJob.progressPercent}%` }} />
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span className="tabular-nums">{recalculationJob.processedStudents} / {recalculationJob.totalStudents}</span>
                                    <span className="tabular-nums">{recalculationJob.progressPercent}%</span>
                                </div>
                                {(recalculationJob.status === 'FAILED' || recalculationJob.status === 'TIMEOUT') && (
                                    <div className="flex justify-center gap-3 pt-2">
                                        <button type="button" onClick={handleRetryRecalculation} className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white">Thử lại</button>
                                        <button type="button" onClick={() => { stopPolling(); setIsRecalculatingAll(false); setRecalculationJob(null); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Đóng</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-center py-4">
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-900 border-t-transparent" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerScores;

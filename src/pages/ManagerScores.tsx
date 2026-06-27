import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { scoresAPI } from '../services/scoresAPI';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { departmentAPI } from '../services/api';
import { classAPI } from '../services/classAPI';
import { Semester } from '../types/admin';
import { StudentClass } from '../types/class';
import { ScoreType, StudentRankingResponse, ScoreHistoryViewResponse, getSourceTypeLabel, getSourceTypeColor, formatScore, formatDateTime } from '../types/score';

const ManagerScores: React.FC = () => {
    const queryClient = useQueryClient();

    // Filter states
    const [semesterId, setSemesterId] = useState<number | null>(null);
    const [scoreType, setScoreType] = useState<ScoreType | null>(null);
    const [departmentId, setDepartmentId] = useState<number | null>(null);
    const [classId, setClassId] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

    // Data states
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);

    // Ranking data
    const [loading, setLoading] = useState<boolean>(false);
    const [rankings, setRankings] = useState<StudentRankingResponse[]>([]);
    const [rankingMetadata, setRankingMetadata] = useState<{
        semesterName?: string;
        scoreType?: string | null;
        totalStudents?: number;
    }>({});

    // Score history modal state
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const historyPageSize = 20;
    // Score history filters (new — backend DB-level filter)
    const [historyStartDate, setHistoryStartDate] = useState<string>('');
    const [historyEndDate, setHistoryEndDate] = useState<string>('');
    const [historyKeyword, setHistoryKeyword] = useState<string>('');
    
    // Temporary states for filters
    const [tempStartDate, setTempStartDate] = useState<string>('');
    const [tempEndDate, setTempEndDate] = useState<string>('');
    const [tempKeyword, setTempKeyword] = useState<string>('');

    // Recalculate states
    const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
    const [showRecalculateConfirm, setShowRecalculateConfirm] = useState(false);
    const [isRecalculatingStudent, setIsRecalculatingStudent] = useState(false);

    // Load initial data
    useEffect(() => {
        loadSemesters();
        loadDepartments();
    }, []);

    // Load classes when department changes
    useEffect(() => {
        loadClasses();
        // Reset class selection when department changes
        setClassId(null);
    }, [departmentId]);

    // Load ranking when filters change
    useEffect(() => {
        if (semesterId) {
            loadRanking();
        }
    }, [semesterId, scoreType, departmentId, classId, sortOrder]);

    const loadSemesters = async () => {
        try {
            const data = await academicPublicAPI.getSemesters();
            setSemesters(data);
            if (data.length > 0 && !semesterId) {
                setSemesterId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading semesters:', error);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await departmentAPI.getAll();
            if (response.status && response.data) {
                // Handle both response.data (direct array) and response.data.body (nested)
                let departmentsData: any[] = [];
                if (Array.isArray(response.data)) {
                    departmentsData = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    const dataObj = response.data as any;
                    departmentsData = dataObj.body || dataObj.data || [];
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
                // Load classes by department
                const classesData = await classAPI.getClassesByDepartment(departmentId);
                // Handle both array and object with body property
                let classesList: StudentClass[] = [];
                if (Array.isArray(classesData)) {
                    classesList = classesData;
                } else if (classesData && typeof classesData === 'object') {
                    const dataObj = classesData as any;
                    classesList = dataObj.body || dataObj.data || [];
                }
                setClasses(classesList);
            } else {
                // Load all classes
                const response = await classAPI.getClasses();
                if (response.content) {
                    setClasses(response.content);
                } else {
                    setClasses([]);
                }
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
                    scoreType: response.data.scoreType,
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

    const getScoreTypeLabel = (type: ScoreType | null): string => {
        if (!type) return 'Tổng điểm';
        switch (type) {
            case 'REN_LUYEN':
                return 'Điểm rèn luyện';
            case 'CONG_TAC_XA_HOI':
                return 'Điểm công tác xã hội';
            case 'CHUYEN_DE':
                return 'Điểm chuyên đề doanh nghiệp';
            default:
                return type;
        }
    };

    // Query for score history
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
        setHistoryStartDate('');
        setHistoryEndDate('');
        setHistoryKeyword('');
        setTempStartDate('');
        setTempEndDate('');
        setTempKeyword('');
    };

    const handleRecalculateAll = async () => {
        if (!semesterId) {
            toast.warning('Vui lòng chọn học kỳ');
            return;
        }
        setShowRecalculateConfirm(false);
        setIsRecalculatingAll(true);
        try {
            const response = await scoresAPI.recalculateAllScores(semesterId);
            if (response.status) {
                toast.success(response.message || 'Tính lại điểm toàn trường thành công');
                loadRanking();
            } else {
                toast.error(response.message || 'Tính lại điểm toàn trường thất bại');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tính lại điểm');
        } finally {
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
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tính lại điểm sinh viên');
        } finally {
            setIsRecalculatingStudent(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <span className="mr-3 text-4xl">📊</span>
                        Xếp hạng điểm sinh viên
                    </h1>
                    <p className="text-gray-200 text-lg">Xem, lọc và sắp xếp điểm theo học kỳ</p>
                </div>
            </div>

            <div>
                {/* Filters */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-4 border border-gray-100">
                    <h3 className="text-lg font-semibold text-[#001C44] mb-4 flex items-center">
                        <span className="mr-2">🔍</span>
                        Bộ lọc
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#001C44] mb-2">Học kỳ *</label>
                            <select
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                value={semesterId || ''}
                                onChange={(e) => setSemesterId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Chọn học kỳ</option>
                                {semesters.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#001C44] mb-2">Loại điểm</label>
                            <select
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                value={scoreType || ''}
                                onChange={(e) => setScoreType(e.target.value ? (e.target.value as ScoreType) : null)}
                            >
                                <option value="">Tổng điểm</option>
                                <option value="REN_LUYEN">Điểm rèn luyện</option>
                                <option value="CONG_TAC_XA_HOI">Điểm công tác xã hội</option>
                                <option value="CHUYEN_DE">Điểm chuyên đề doanh nghiệp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#001C44] mb-2">Khoa</label>
                            <select
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                value={departmentId || ''}
                                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Tất cả</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#001C44] mb-2">Lớp</label>
                            <select
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                value={classId || ''}
                                onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}
                                disabled={!departmentId}
                            >
                                <option value="">Tất cả</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.className}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#001C44] mb-2">Sắp xếp</label>
                            <select
                                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                            >
                                <option value="DESC">Điểm cao → thấp</option>
                                <option value="ASC">Điểm thấp → cao</option>
                            </select>
                        </div>
                        <div className="flex items-end space-x-2">
                            <button
                                className="px-4 py-2.5 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-all shadow-sm hover:shadow-md font-medium"
                                onClick={loadRanking}
                            >
                                🔄 Làm mới
                            </button>
                            <button
                                className="px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all shadow-sm hover:shadow-md font-medium whitespace-nowrap"
                                onClick={() => setShowRecalculateConfirm(true)}
                                disabled={!semesterId}
                            >
                                ⚠️ Tính lại toàn trường
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metadata Info */}
                {rankingMetadata.semesterName && (
                    <div className="bg-[#FFD66D] bg-opacity-20 border-2 border-[#FFD66D] rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-[#001C44]">
                                    📊 {rankingMetadata.semesterName}
                                </h3>
                                <p className="text-sm text-[#001C44] mt-1">
                                    Loại điểm: <span className="font-medium">{getScoreTypeLabel(scoreType)}</span> | 
                                    Tổng số sinh viên: <span className="font-medium">{rankingMetadata.totalStudents || 0}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ranking Table */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#001C44]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Thứ hạng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        MSSV
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Họ tên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Lớp
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Khoa
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Học kỳ
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Loại điểm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Điểm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                                Đang tải...
                                            </div>
                                        </td>
                                    </tr>
                                ) : rankings.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">
                                            {semesterId ? 'Không có dữ liệu' : 'Vui lòng chọn học kỳ'}
                                        </td>
                                    </tr>
                                ) : (
                                    rankings.map((ranking) => (
                                        <tr key={`${ranking.studentId}-${ranking.scoreType || 'total'}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FFD66D] text-[#001C44] font-bold text-sm shadow-sm">
                                                    {ranking.rank}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                {ranking.studentCode}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {ranking.studentName}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {ranking.className || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {ranking.departmentName || '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {ranking.semesterName}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {ranking.scoreTypeLabel}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#001C44]">
                                                {formatScore(ranking.score)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewHistory(ranking.studentId)}
                                                    className="px-3 py-1 bg-[#001C44] text-white rounded hover:bg-[#002A66] transition-colors text-xs"
                                                >
                                                    Xem lịch sử
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer with total count */}
                    {rankings.length > 0 && (
                        <div className="bg-[#001C44] bg-opacity-5 px-4 py-3 border-t border-gray-200">
                            <div className="text-sm text-[#001C44] font-medium">
                                Tổng số sinh viên: <span className="font-bold text-lg">{rankings.length}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Score History Modal */}
            {selectedStudentId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#001C44]">
                                Lịch sử điểm - {historyData?.studentName || 'Đang tải...'}
                            </h2>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleRecalculateStudent}
                                    disabled={isRecalculatingStudent}
                                    className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center disabled:opacity-50"
                                >
                                    {isRecalculatingStudent ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800 mr-2"></div>
                                            Đang tính...
                                        </>
                                    ) : (
                                        '🔄 Tính lại điểm SV này'
                                    )}
                                </button>
                                <button
                                    onClick={handleCloseHistory}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {isHistoryFetching ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44]"></div>
                                </div>
                            ) : historyData ? (
                                <div className="space-y-6">
                                    {/* Score History Filters */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4 items-end">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                                            <input 
                                                type="datetime-local" 
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#001C44] focus:border-[#001C44] px-3 py-2 border sm:text-sm"
                                                value={tempStartDate}
                                                onChange={(e) => setTempStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                                            <input 
                                                type="datetime-local" 
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#001C44] focus:border-[#001C44] px-3 py-2 border sm:text-sm"
                                                value={tempEndDate}
                                                onChange={(e) => setTempEndDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Từ khóa (Hoạt động)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Tên hoạt động..."
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#001C44] focus:border-[#001C44] px-3 py-2 border sm:text-sm"
                                                value={tempKeyword}
                                                onChange={(e) => setTempKeyword(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => {
                                                    setHistoryStartDate(tempStartDate);
                                                    setHistoryEndDate(tempEndDate);
                                                    setHistoryKeyword(tempKeyword);
                                                    setHistoryPage(0);
                                                }}
                                                className="px-4 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] transition-colors text-sm font-medium shadow-sm"
                                            >
                                                Lọc
                                            </button>
                                        </div>
                                    </div>

                                    {/* Current Score */}
                                    <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] text-white p-6 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm opacity-90">Điểm hiện tại</p>
                                                <p className="text-3xl font-bold mt-1">{formatScore(historyData.currentScore)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm opacity-90">{historyData.semesterName}</p>
                                                <p className="text-sm opacity-90 mt-1">
                                                    MSSV: {historyData.studentCode}
                                                </p>
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
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h3 className="text-xl font-semibold text-[#001C44] mb-4">Lịch sử thay đổi điểm</h3>
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
                                                                            <Link to={`/manager/events/${history.activityId}`} className="text-[#001C44] hover:underline">
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


                                    {/* Empty State */}
                                    {(!historyData.scoreHistories || historyData.scoreHistories.length === 0) && (
                                        <div className="text-center py-8">
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
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-red-600">Không thể tải lịch sử điểm</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showRecalculateConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Xác nhận tính lại điểm
                        </h3>
                        <p className="text-gray-700 mb-6">
                            Bạn sắp thực hiện tính lại điểm cho toàn bộ sinh viên trong học kỳ này. 
                            Quá trình này có thể mất nhiều thời gian và làm gián đoạn hệ thống. 
                            Bạn có chắc chắn muốn tiếp tục?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRecalculateConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleRecalculateAll}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Đồng ý tính lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Loading Overlay */}
            {isRecalculatingAll && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[9999]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Đang tính lại điểm toàn trường...</h2>
                    <p className="text-gray-300">Vui lòng không đóng trình duyệt. Quá trình này có thể mất vài phút.</p>
                </div>
            )}
        </div>
    );
};

export default ManagerScores;

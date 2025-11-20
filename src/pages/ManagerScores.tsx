import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scoresAPI } from '../services/scoresAPI';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { departmentAPI } from '../services/api';
import { classAPI } from '../services/classAPI';
import { Semester } from '../types/admin';
import { StudentClass } from '../types/class';
import { ScoreType, StudentRankingResponse } from '../types/score';

const ManagerScores: React.FC = () => {
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
            case 'KHAC':
                return 'Điểm khác';
            default:
                return type;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Xếp hạng điểm sinh viên</h1>
                                <p className="text-sm text-gray-500">Xem, lọc và sắp xếp điểm theo học kỳ</p>
                            </div>
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Về Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Học kỳ *</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
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
                            <label className="block text-sm text-gray-600 mb-1">Loại điểm</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={scoreType || ''}
                                onChange={(e) => setScoreType(e.target.value ? (e.target.value as ScoreType) : null)}
                            >
                                <option value="">Tổng điểm</option>
                                <option value="REN_LUYEN">Điểm rèn luyện</option>
                                <option value="CONG_TAC_XA_HOI">Điểm công tác xã hội</option>
                                <option value="CHUYEN_DE">Điểm chuyên đề doanh nghiệp</option>
                                <option value="KHAC">Điểm khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Khoa</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
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
                            <label className="block text-sm text-gray-600 mb-1">Lớp</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
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
                            <label className="block text-sm text-gray-600 mb-1">Sắp xếp</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                            >
                                <option value="DESC">Điểm cao → thấp</option>
                                <option value="ASC">Điểm thấp → cao</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                onClick={loadRanking}
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metadata Info */}
                {rankingMetadata.semesterName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900">
                                    {rankingMetadata.semesterName}
                                </h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    Loại điểm: {getScoreTypeLabel(scoreType)} |
                                    Tổng số sinh viên: {rankingMetadata.totalStudents || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ranking Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thứ hạng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        MSSV
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ tên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lớp
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Khoa
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Học kỳ
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại điểm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Điểm
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                                Đang tải...
                                            </div>
                                        </td>
                                    </tr>
                                ) : rankings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                                            {semesterId ? 'Không có dữ liệu' : 'Vui lòng chọn học kỳ'}
                                        </td>
                                    </tr>
                                ) : (
                                    rankings.map((ranking) => (
                                        <tr key={`${ranking.studentId}-${ranking.scoreType || 'total'}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
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
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                                                {typeof ranking.score === 'number'
                                                    ? ranking.score.toFixed(2)
                                                    : ranking.score}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer with total count */}
                    {rankings.length > 0 && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Tổng số sinh viên: <span className="font-semibold">{rankings.length}</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManagerScores;

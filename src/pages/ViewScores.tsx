import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreType, ScoreTypeSummary } from '../types/score';
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

    return (
        <StudentLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-[#001C44]">Bảng điểm học kỳ</h1>
                
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
                {isFetching && (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="card p-6">
                        <div className="text-center">
                            <div className="text-red-500 text-4xl mb-2">⚠️</div>
                            <p className="text-red-600 font-medium">Lỗi tải dữ liệu</p>
                        </div>
                    </div>
                )}

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
            </div>
        </StudentLayout>
    );
};

export default ViewScores;
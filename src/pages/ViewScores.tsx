import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreType, ScoreTypeSummary } from '../types/score';
import { useAuth } from '../contexts/AuthContext';
import { academicPublicAPI } from '../services/academicPublicAPI';
import { studentAPI } from '../services/studentAPI';
import { toast } from 'react-toastify';

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
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-xl font-semibold mb-4">Bảng điểm học kỳ</h1>
            <div className="bg-white p-4 rounded shadow space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={yearId}
                            onChange={(e) => setYearId(e.target.value)}
                        >
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Học kỳ
                        </label>
                        <select
                            className="w-full border rounded px-3 py-2"
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
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại điểm</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={scoreType}
                            onChange={(e) => setScoreType(e.target.value as any)}
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="REN_LUYEN">Điểm rèn luyện</option>
                            <option value="CONG_TAC_XA_HOI">Công tác xã hội</option>
                            <option value="CHUYEN_DE">Chuyên đề doanh nghiệp</option>
                            <option value="KHAC">Khác</option>
                        </select>
                    </div>
                </div>
            </div>

            {isFetching && <div className="mt-4">Đang tải...</div>}
            {isError && <div className="mt-4 text-red-600">Lỗi tải dữ liệu</div>}

            {Array.isArray(summaries) && summaries.length > 0 && (
                <div className="mt-6 space-y-4">
                    {summaries.map((s: ScoreTypeSummary, idx: number) => (
                        <div key={s.scoreType ?? idx} className="bg-white p-4 rounded shadow">
                            <div className="flex justify-between items-center">
                                <div className="text-lg font-semibold">
                                    {s.scoreType === 'REN_LUYEN' && 'Điểm rèn luyện'}
                                    {s.scoreType === 'CONG_TAC_XA_HOI' && 'Điểm công tác xã hội'}
                                    {s.scoreType === 'CHUYEN_DE' && 'Điểm chuyên đề doanh nghiệp'}
                                    {s.scoreType === 'KHAC' && 'Điểm khác'}
                                </div>
                                <div className="text-lg font-semibold">Tổng: {s.total}</div>
                            </div>
                            <div className="mt-3 divide-y">
                                {(s.items ?? []).map((it, itemIdx) => (
                                    <div key={itemIdx} className="py-2 text-sm flex justify-between">
                                        <div>
                                            <div className="font-medium">
                                                {it.sourceType === 'MANUAL' && 'Nhập tay'}
                                                {it.sourceType === 'ACTIVITY_CHECKIN' && 'Điểm danh hoạt động'}
                                                {it.sourceType === 'ACTIVITY_SUBMISSION' && 'Nộp bài hoạt động'}
                                            </div>
                                            {it.sourceNote && <div className="text-gray-600">{it.sourceNote}</div>}
                                        </div>
                                        <div className="font-semibold">{it.score}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {(!summaries || summaries.length === 0) && (
                <div className="mt-6 text-gray-600">Không có dữ liệu điểm cho học kỳ này.</div>
            )}
        </div>
    );
};

export default ViewScores;
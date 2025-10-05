import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scoresAPI } from '../services/scoresAPI';
import { ScoreTypeSummary } from '../types/score';
import { useAuth } from '../contexts/AuthContext';
import { academicYearAPI, semesterAPI } from '../services/adminAPI';

const ViewScores: React.FC = () => {
    const { user } = useAuth();
    const [semesterId, setSemesterId] = useState<string>('');
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const [yearId, setYearId] = useState<string>('');
    const [years, setYears] = useState<Array<{ id: number; name: string }>>([]);

    useEffect(() => {
        // Load years first then semesters
        academicYearAPI.getAcademicYears().then(resp => {
            if (resp.status && resp.data && resp.data.length > 0) {
                setYears(resp.data.map((y: any) => ({ id: y.id, name: y.name })));
                setYearId(String(resp.data[0].id));
            }
        });
    }, []);

    useEffect(() => {
        if (!yearId) return;
        semesterAPI.getSemestersByYear(Number(yearId)).then(resp => {
            if (resp.status && resp.data) {
                const list = resp.data.map((s: any) => ({ id: s.id, name: s.name }));
                setSemesters(list);
                if (list.length > 0) setSemesterId(String(list[0].id));
            }
        });
    }, [yearId]);

    const { data, isFetching, isError } = useQuery({
        enabled: Boolean(semesterId),
        queryKey: ['scoresView', user?.username, yearId, semesterId],
        queryFn: () => scoresAPI.getSemesterScores(Number(user?.username ? 0 : 0), Number(semesterId)),
    });

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-xl font-semibold mb-4">Bảng điểm học kỳ</h1>
            <div className="bg-white p-4 rounded shadow space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
            </div>

            {isFetching && <div className="mt-4">Đang tải...</div>}
            {isError && <div className="mt-4 text-red-600">Lỗi tải dữ liệu</div>}

            {data && Array.isArray(data.summaries) && (
                <div className="mt-6 space-y-4">
                    {(data.summaries ?? []).map((s: ScoreTypeSummary, idx: number) => (
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
            {data && (!Array.isArray(data.summaries) || (data.summaries ?? []).length === 0) && (
                <div className="mt-6 text-gray-600">Không có dữ liệu điểm cho học kỳ này.</div>
            )}
        </div>
    );
};

export default ViewScores;
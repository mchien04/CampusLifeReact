import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scoresAPI } from '../services/scoresAPI';
import { academicYearAPI, semesterAPI } from '../services/adminAPI';
import { TrainingCalculateResponse } from '../types/score';
import { toast } from 'react-toastify';

interface Criterion {
    id: number;
    name: string;
    description?: string;
    maxScore?: number;
    parentId?: number;
}

const TrainingScore: React.FC = () => {
    const [studentId, setStudentId] = useState<string>('');
    const [semesterId, setSemesterId] = useState<string>('');
    const [years, setYears] = useState<Array<{ id: number; name: string }>>([]);
    const [yearId, setYearId] = useState<string>('');
    const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [excludedIds, setExcludedIds] = useState<number[]>([]);
    const [result, setResult] = useState<TrainingCalculateResponse | null>(null);

    useEffect(() => {
        // Load years first
        academicYearAPI.getAcademicYears().then((resp: any) => {
            if (resp.status && resp.data) {
                const ys = resp.data.map((y: any) => ({ id: y.id, name: y.name }));
                setYears(ys);
                if (ys.length > 0) setYearId(String(ys[0].id));
            }
        });
    }, []);

    useEffect(() => {
        if (!yearId) return;
        semesterAPI.getSemestersByYear(Number(yearId)).then((resp: any) => {
            if (resp.status && resp.data) {
                const list = resp.data.map((s: any) => ({ id: s.id, name: s.name }));
                setSemesters(list);
                if (list.length > 0) setSemesterId(String(list[0].id));
            }
        });
    }, [yearId]);

    const mutation = useMutation<TrainingCalculateResponse, unknown, void>({
        mutationFn: async () => {
            if (!studentId || !semesterId) throw new Error('Thiếu studentId/semesterId');
            return await scoresAPI.calculateTrainingScore(Number(studentId), Number(semesterId), excludedIds);
        },
        onSuccess: (data: TrainingCalculateResponse) => {
            setResult(data);
            toast.success('Tính điểm thành công');
        },
        onError: (e: unknown) => {
            console.error(e);
            toast.error('Tính điểm thất bại');
        },
    });

    const toggleCriterion = (id: number) => {
        setExcludedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-xl font-semibold mb-4">Chấm điểm rèn luyện</h1>

            {/* Input Section */}
            <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            MSSV
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Nhập MSSV"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={yearId}
                            onChange={(e) => setYearId(e.target.value)}
                        >
                            {years.map((y) => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
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

            {/* Criteria Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-medium mb-4">Tiêu chí đánh giá</h2>
                    <div className="space-y-3">
                        {criteria.map(criterion => (
                            <div
                                key={criterion.id}
                                className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={!excludedIds.includes(criterion.id)}
                                    onChange={() => toggleCriterion(criterion.id)}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="font-medium">{criterion.name}</div>
                                    {criterion.description && (
                                        <div className="text-sm text-gray-600">{criterion.description}</div>
                                    )}
                                    {criterion.maxScore && (
                                        <div className="text-sm text-gray-500">Tối đa: {criterion.maxScore} điểm</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !studentId || !semesterId}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                        >
                            {mutation.isPending ? 'Đang tính...' : 'Tính điểm'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="text-lg font-medium mb-4">Kết quả tính điểm</h2>
                        <div className="text-2xl font-bold text-blue-600 mb-4">
                            Tổng điểm: {result.total}
                        </div>
                        <div className="space-y-3">
                            {result.items.map((item) => (
                                <div key={item.criterionId} className="flex justify-between p-2 border-b">
                                    <div>{item.criterionName}</div>
                                    <div className="font-medium">{item.score}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingScore;
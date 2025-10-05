import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionAPI } from '../services/submissionAPI';
import { TaskSubmissionResponse } from '../types/submission';
import { toast } from 'react-toastify';

interface Props {
    taskId: number;
}

const TaskSubmissions: React.FC<Props> = ({ taskId }) => {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['taskSubmissions', taskId],
        queryFn: async () => {
            const res = await submissionAPI.getTaskSubmissions(taskId);
            return res.data ?? [];
        },
    });

    const [grading, setGrading] = useState<{ id: number; score: string; feedback: string } | null>(null);

    const mutation = useMutation({
        mutationFn: async () => {
            if (!grading) return null as never;
            const confirmed = window.confirm('Xác nhận chấm điểm?');
            if (!confirmed) return null as never;
            const scoreNum = Number(grading.score);
            const res = await submissionAPI.gradeSubmission(grading.id, scoreNum, grading.feedback || undefined);
            return res.data!;
        },
        onSuccess: () => {
            toast.success('Chấm điểm thành công');
            setGrading(null);
            queryClient.invalidateQueries({ queryKey: ['taskSubmissions', taskId] });
        },
        onError: (e: unknown) => {
            console.error(e);
            toast.error('Chấm điểm thất bại');
        },
    });

    const rows = useMemo(() => (data ?? []), [data]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-xl font-semibold mb-4">Bài nộp của task #{taskId}</h1>
            {isLoading && <div>Đang tải...</div>}
            {isError && <div className="text-red-600">Lỗi tải dữ liệu</div>}

            {!isLoading && !isError && (
                <div className="overflow-x-auto bg-white shadow rounded">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left">Sinh viên</th>
                                <th className="px-3 py-2 text-left">MSSV</th>
                                <th className="px-3 py-2 text-left">Tiêu đề</th>
                                <th className="px-3 py-2 text-left">Điểm/Trạng thái</th>
                                <th className="px-3 py-2 text-left">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s: TaskSubmissionResponse) => (
                                <tr key={s.id} className="border-t">
                                    <td className="px-3 py-2">{s.studentName}</td>
                                    <td className="px-3 py-2">{s.studentCode}</td>
                                    <td className="px-3 py-2">{s.taskTitle}</td>
                                    <td className="px-3 py-2">
                                        {s.score != null ? s.score : '-'} / {s.status}
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            className="px-3 py-1 bg-blue-600 text-white rounded"
                                            onClick={() => setGrading({ id: s.id, score: String(s.score ?? ''), feedback: s.feedback ?? '' })}
                                        >
                                            Chấm điểm
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {grading && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded shadow p-4 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-3">Chấm điểm Submission #{grading.id}</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">Điểm</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    className="w-full border rounded px-3 py-2"
                                    value={grading.score}
                                    onChange={(e) => setGrading({ ...grading, score: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Nhận xét</label>
                                <textarea
                                    className="w-full border rounded px-3 py-2"
                                    rows={3}
                                    value={grading.feedback}
                                    onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button className="px-3 py-1 border rounded" onClick={() => setGrading(null)}>Hủy</button>
                            <button
                                type="button"
                                className="px-3 py-1 bg-green-600 text-white rounded"
                                onClick={() => {
                                    if ((mutation as any).isPending || (mutation as any).status === 'pending') return;
                                    mutation.mutate();
                                }}
                            >
                                {(mutation as any).isPending || (mutation as any).status === 'pending' ? 'Đang lưu...' : 'Lưu điểm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskSubmissions;



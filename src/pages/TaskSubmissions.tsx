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

    const [grading, setGrading] = useState<{ id: number; isCompleted: boolean | null; feedback: string } | null>(null);
    const [viewingSubmission, setViewingSubmission] = useState<TaskSubmissionResponse | null>(null);

    const mutation = useMutation({
        mutationFn: async () => {
            if (!grading) return null as never;
            if (grading.isCompleted === null) {
                toast.error('Vui lòng chọn Đạt hoặc Không đạt');
                return null as never;
            }
            const confirmed = window.confirm('Xác nhận chấm điểm?');
            if (!confirmed) return null as never;
            const res = await submissionAPI.gradeSubmission(grading.id, grading.isCompleted, grading.feedback || undefined);
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
                                <th className="px-3 py-2 text-left">Kết quả/Trạng thái</th>
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
                                        {s.isCompleted === true ? 'Đạt' : s.isCompleted === false ? 'Không đạt' : '-'} / {s.status}
                                    </td>
                                    <td className="px-3 py-2 space-x-2">
                                        <button
                                            className="px-3 py-1 bg-gray-600 text-white rounded"
                                            onClick={() => setViewingSubmission(s)}
                                        >
                                            Xem chi tiết
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-blue-600 text-white rounded"
                                            onClick={() => setGrading({ id: s.id, isCompleted: s.isCompleted ?? null, feedback: s.feedback ?? '' })}
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
                                <label className="block text-sm mb-2">Kết quả</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name={`isCompleted-${grading.id}`}
                                            checked={grading.isCompleted === true}
                                            onChange={() => setGrading({ ...grading, isCompleted: true })}
                                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700">Đạt</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name={`isCompleted-${grading.id}`}
                                            checked={grading.isCompleted === false}
                                            onChange={() => setGrading({ ...grading, isCompleted: false })}
                                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700">Không đạt</span>
                                    </label>
                                </div>
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
                                {(mutation as any).isPending || (mutation as any).status === 'pending' ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold text-[#001C44]">Chi tiết bài nộp</h2>
                            <button onClick={() => setViewingSubmission(null)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700">Sinh viên:</h3>
                                <p>{viewingSubmission.studentName} ({viewingSubmission.studentCode})</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700">Nội dung:</h3>
                                <div className="bg-gray-50 p-3 rounded mt-1 min-h-[60px] whitespace-pre-wrap">
                                    {viewingSubmission.content || <span className="text-gray-400 italic">Không có nội dung</span>}
                                </div>
                            </div>
                            
                            {/* Attachments */}
                            {viewingSubmission.attachments && viewingSubmission.attachments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Đính kèm:</h3>
                                    
                                    {/* Files */}
                                    {viewingSubmission.attachments.filter(a => a.type === 'file').length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Tệp tài liệu:</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {viewingSubmission.attachments.filter(a => a.type === 'file').map((file, idx) => (
                                                    <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center p-2 border rounded hover:bg-gray-50 text-blue-600 truncate text-sm">
                                                        📎 {file.url.split('/').pop()}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Images */}
                                    {viewingSubmission.attachments.filter(a => a.type === 'image').length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Hình ảnh:</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {viewingSubmission.attachments.filter(a => a.type === 'image').map((img, idx) => (
                                                    <a key={idx} href={img.url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden hover:opacity-90">
                                                        <img src={img.url} alt="Attachment" className="w-full h-32 object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t flex gap-2">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => {
                                        setGrading({ id: viewingSubmission.id, isCompleted: viewingSubmission.isCompleted ?? null, feedback: viewingSubmission.feedback ?? '' });
                                        setViewingSubmission(null);
                                    }}
                                >
                                    Chấm điểm ngay
                                </button>
                                <button className="px-4 py-2 border rounded hover:bg-gray-50" onClick={() => setViewingSubmission(null)}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskSubmissions;



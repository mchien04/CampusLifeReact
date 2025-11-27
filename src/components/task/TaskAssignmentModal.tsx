import React, { useState, useEffect } from 'react';
import { ActivityTask, StudentResponse, AssignTaskRequest } from '../../types';
import { RegisteredStudent, ActivityTaskResponse } from '../../types/task';
import { studentAPI, taskAPI } from '../../services';

interface TaskAssignmentModalProps {
    task: ActivityTask | ActivityTaskResponse;
    onClose: () => void;
    onRefresh: () => void;
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
    task,
    onClose,
    onRefresh,
}) => {
    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [useRegisteredStudents, setUseRegisteredStudents] = useState(true);

    useEffect(() => {
        loadStudents();
    }, [task]);

    const loadStudents = async () => {
        try {
            setLoading(true);

            // Handle both ActivityTask and ActivityTaskResponse types
            const activityId = 'activity' in task ? task.activity.id : task.activityId;

            // Load registered students for this activity
            const registeredResponse = await taskAPI.getRegisteredStudentsForActivity(activityId);

            if (registeredResponse.status && registeredResponse.data) {
                setRegisteredStudents(registeredResponse.data);
            } else {
                setRegisteredStudents([]);
            }

            // Load all students as fallback
            const allStudentsResponse = await studentAPI.getAllStudents(0, 1000);
            if (allStudentsResponse.status && allStudentsResponse.data) {
                setStudents(allStudentsResponse.data.content || []);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setError('Có lỗi xảy ra khi tải danh sách sinh viên');
            setStudents([]);
            setRegisteredStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentToggle = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        const filteredStudents = getFilteredStudents();
        const allSelected = filteredStudents.every(student => selectedStudents.includes(student.id));

        if (allSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(student => student.id));
        }
    };

    const getFilteredStudents = () => {
        const sourceStudents = useRegisteredStudents ? registeredStudents : students;

        if (!searchQuery.trim()) {
            return sourceStudents;
        }

        const filtered = sourceStudents.filter(student =>
            student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudents.length === 0) {
            setError('Vui lòng chọn ít nhất một sinh viên');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const data: AssignTaskRequest = {
                taskId: task.id,
                studentIds: selectedStudents,
                dueDate: dueDate || undefined,
                note: note.trim() || undefined,
            };

            const response = await taskAPI.assignTask(data);

            onRefresh();
            onClose();
        } catch (error) {
            console.error('Error assigning task:', error);
            setError('Có lỗi xảy ra khi phân công nhiệm vụ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoAssignToRegistered = async () => {
        if (registeredStudents.length === 0) {
            setError('Không có sinh viên đăng ký nào để phân công');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const activityId = 'activity' in task ? task.activity.id : task.activityId;
            const response = await taskAPI.assignTaskToRegisteredStudents(activityId, task.id);
            if (response.status) {
                onRefresh();
                onClose();
            } else {
                setError(response.message || 'Có lỗi xảy ra khi phân công tự động');
            }
        } catch (error) {
            console.error('Error auto-assigning task:', error);
            setError('Có lỗi xảy ra khi phân công tự động');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = getFilteredStudents();
    const allSelected = filteredStudents.length > 0 && filteredStudents.every(student => selectedStudents.includes(student.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200">
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                📋 Phân công nhiệm vụ: {'title' in task ? task.title : task.name}
                            </h3>
                            <p className="text-sm text-gray-200 mt-1">
                                Sự kiện: {'activity' in task ? task.activity.name : 'Unknown Activity'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-[#FFD66D] transition-colors"
                        >
                            <span className="sr-only">Đóng</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-6">

                    <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Assignment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                Hạn hoàn thành
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                                Ghi chú
                            </label>
                            <input
                                type="text"
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ghi chú thêm..."
                                className="mt-1 block w-full px-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                            />
                        </div>
                    </div>

                    {/* Student Source Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={useRegisteredStudents}
                                    onChange={(e) => setUseRegisteredStudents(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                    Chỉ hiển thị sinh viên đã đăng ký ({registeredStudents.length})
                                </span>
                            </label>
                        </div>
                        <div className="flex space-x-2">
                            {useRegisteredStudents && registeredStudents.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleAutoAssignToRegistered}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-[#FFD66D] text-[#001C44] text-sm font-medium rounded-lg hover:bg-[#FFC947] focus:outline-none focus:ring-2 focus:ring-[#FFD66D] disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                                >
                                    {submitting ? 'Đang phân công...' : `Phân công cho tất cả (${registeredStudents.length})`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Student Search */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                            Tìm kiếm sinh viên
                        </label>
                        <input
                            type="text"
                            id="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập tên hoặc mã sinh viên..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Student Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                                Chọn sinh viên ({selectedStudents.length} đã chọn)
                            </h4>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-600">Đang tải danh sách sinh viên...</p>
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                <div className="divide-y divide-gray-200">
                                    {filteredStudents.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            {searchQuery ? 'Không tìm thấy sinh viên nào' : 'Không có sinh viên nào'}
                                            <div className="text-xs text-gray-400 mt-2">
                                                Debug: useRegisteredStudents={useRegisteredStudents.toString()},
                                                registeredStudents={registeredStudents.length},
                                                students={students.length},
                                                filteredStudents={filteredStudents.length}
                                            </div>
                                        </div>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-blue-50 border-blue-200' : ''
                                                    }`}
                                                onClick={() => handleStudentToggle(student.id)}
                                            >
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => handleStudentToggle(student.id)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center">
                                                            {('avatarUrl' in student) && student.avatarUrl && (
                                                                <img
                                                                    className="h-8 w-8 rounded-full mr-3"
                                                                    src={student.avatarUrl}
                                                                    alt={student.fullName}
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {student.fullName}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {student.studentCode} • {student.email}
                                                                </div>
                                                                {student.className && (
                                                                    <div className="text-xs text-gray-400">
                                                                        Lớp: {student.className}
                                                                    </div>
                                                                )}
                                                                {('registrationStatus' in student) && (
                                                                    <div className="text-xs text-blue-600">
                                                                        Trạng thái: {student.registrationStatus}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#001C44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || selectedStudents.length === 0}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-[#001C44] border border-transparent rounded-lg hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                        >
                            {submitting ? 'Đang phân công...' : `Phân công cho ${selectedStudents.length} sinh viên`}
                        </button>
                    </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

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
    console.log('🔍 Modal: Component rendered with task:', task);

    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);

    // Debug registered students changes
    useEffect(() => {
        console.log('🔍 Registered students state changed:', registeredStudents.length, 'students');
    }, [registeredStudents]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [useRegisteredStudents, setUseRegisteredStudents] = useState(true);

    useEffect(() => {
        console.log('🔍 Modal: useEffect triggered, loading students...');
        loadStudents();
    }, [task]);

    const loadStudents = async () => {
        console.log('🔍 Modal: loadStudents function called');
        try {
            setLoading(true);
            console.log('🔍 Modal: Starting to load students...');
            console.log('🔍 Modal: Task object:', task);

            // Handle both ActivityTask and ActivityTaskResponse types
            const activityId = 'activity' in task ? task.activity.id : task.activityId;
            console.log('🔍 Modal: Activity ID:', activityId);

            // Load registered students for this activity
            console.log('🔍 Loading registered students for activity:', activityId);
            const registeredResponse = await taskAPI.getRegisteredStudentsForActivity(activityId);
            console.log('🔍 Registered students response:', registeredResponse);

            if (registeredResponse.status && registeredResponse.data) {
                console.log('🔍 Setting registered students:', registeredResponse.data);
                console.log('🔍 Registered students count:', registeredResponse.data.length);
                setRegisteredStudents(registeredResponse.data);
            } else {
                console.log('🔍 No registered students found - status:', registeredResponse.status, 'data:', registeredResponse.data);
                setRegisteredStudents([]);
            }

            // Load all students as fallback
            console.log('🔍 Loading all students as fallback...');
            const allStudentsResponse = await studentAPI.getAllStudents(0, 1000);
            if (allStudentsResponse.status && allStudentsResponse.data) {
                console.log('🔍 All students loaded:', allStudentsResponse.data.content?.length || 0);
                setStudents(allStudentsResponse.data.content || []);
            } else {
                console.log('🔍 Failed to load all students');
                setStudents([]);
            }

            console.log('🔍 Modal: Load students completed');
        } catch (error) {
            console.error('🔍 Modal: Error loading students:', error);
            console.error('🔍 Modal: Error details:', error);
            setError('Có lỗi xảy ra khi tải danh sách sinh viên');
            setStudents([]);
            setRegisteredStudents([]);
        } finally {
            console.log('🔍 Modal: loadStudents completed, setting loading to false');
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
        console.log('🔍 getFilteredStudents - useRegisteredStudents:', useRegisteredStudents);
        console.log('🔍 getFilteredStudents - sourceStudents length:', sourceStudents.length);
        console.log('🔍 getFilteredStudents - searchQuery:', searchQuery);

        if (!searchQuery.trim()) {
            console.log('🔍 getFilteredStudents - returning all source students:', sourceStudents.length);
            return sourceStudents;
        }

        const filtered = sourceStudents.filter(student =>
            student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log('🔍 getFilteredStudents - filtered result:', filtered.length);
        return filtered;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔍 Modal: handleSubmit called');
        console.log('🔍 Modal: selectedStudents:', selectedStudents);
        console.log('🔍 Modal: task:', task);

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

            console.log('🔍 Modal: Sending assign task request:', data);
            const response = await taskAPI.assignTask(data);
            console.log('🔍 Modal: Assign task response:', response);

            onRefresh();
            onClose();
        } catch (error) {
            console.error('🔍 Modal: Error assigning task:', error);
            console.error('🔍 Modal: Error details:', error);
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

    // Debug filtered students
    useEffect(() => {
        console.log('🔍 Filtered students:', filteredStudents.length, 'students');
        console.log('🔍 Use registered students:', useRegisteredStudents);
        console.log('🔍 Search query:', searchQuery);
    }, [filteredStudents, useRegisteredStudents, searchQuery]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Phân công nhiệm vụ: {'title' in task ? task.title : task.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Sự kiện: {'activity' in task ? task.activity.name : 'Unknown Activity'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="sr-only">Đóng</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('🔍 Test API call...');
                                    const activityId = 'activity' in task ? task.activity.id : task.activityId;
                                    taskAPI.getRegisteredStudentsForActivity(activityId).then(response => {
                                        console.log('🔍 Test API response:', response);
                                    });
                                }}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                                Test API
                            </button>
                            {useRegisteredStudents && registeredStudents.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleAutoAssignToRegistered}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
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
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || selectedStudents.length === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Đang phân công...' : `Phân công cho ${selectedStudents.length} sinh viên`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

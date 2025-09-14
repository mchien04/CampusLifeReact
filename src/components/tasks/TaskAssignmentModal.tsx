import React, { useState, useEffect } from 'react';
import { ActivityTaskResponse, TaskAssignmentRequest, Student, TaskStatus } from '../../types/task';
import { departmentAPI } from '../../services/api';

interface TaskAssignmentModalProps {
    task: ActivityTaskResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onAssign: (data: TaskAssignmentRequest) => void;
    loading?: boolean;
}

const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
    task,
    isOpen,
    onClose,
    onAssign,
    loading = false
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (isOpen && task) {
            loadStudents();
        }
    }, [isOpen, task]);

    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            // Load all departments first
            const deptResponse = await departmentAPI.getAll();
            if (deptResponse.status && deptResponse.data) {
                // Mock students data - in real app, you'd have a student API
                const mockStudents: Student[] = [
                    { id: 1, fullName: 'Nguyễn Văn A', studentCode: 'SV001', email: 'a@example.com', departmentId: 1, departmentName: 'Khoa CNTT' },
                    { id: 2, fullName: 'Trần Thị B', studentCode: 'SV002', email: 'b@example.com', departmentId: 1, departmentName: 'Khoa CNTT' },
                    { id: 3, fullName: 'Lê Văn C', studentCode: 'SV003', email: 'c@example.com', departmentId: 2, departmentName: 'Khoa Kinh tế' },
                    { id: 4, fullName: 'Phạm Thị D', studentCode: 'SV004', email: 'd@example.com', departmentId: 2, departmentName: 'Khoa Kinh tế' },
                    { id: 5, fullName: 'Hoàng Văn E', studentCode: 'SV005', email: 'e@example.com', departmentId: 1, departmentName: 'Khoa CNTT' },
                ];
                setStudents(mockStudents);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStudentToggle = (studentId: number) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        }
    };

    const handleSubmit = () => {
        if (!task || selectedStudentIds.length === 0) return;

        const assignmentData: TaskAssignmentRequest = {
            taskId: task.id,
            studentIds: selectedStudentIds,
            status: TaskStatus.PENDING
        };

        onAssign(assignmentData);
    };

    const handleClose = () => {
        setSelectedStudentIds([]);
        setSearchTerm('');
        onClose();
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Phân công nhiệm vụ: {task.name}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm sinh viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Student List */}
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                        {loadingStudents ? (
                            <div className="p-4 text-center text-gray-500">
                                Đang tải danh sách sinh viên...
                            </div>
                        ) : (
                            <>
                                <div className="p-3 border-b border-gray-200 bg-gray-50">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            Chọn tất cả ({filteredStudents.length})
                                        </span>
                                    </label>
                                </div>

                                {filteredStudents.map((student) => (
                                    <div key={student.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={() => handleStudentToggle(student.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.fullName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.studentCode} • {student.departmentName}
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                ))}

                                {filteredStudents.length === 0 && (
                                    <div className="p-4 text-center text-gray-500">
                                        Không tìm thấy sinh viên nào
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Selected Count */}
                    {selectedStudentIds.length > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                            Đã chọn {selectedStudentIds.length} sinh viên
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedStudentIds.length === 0 || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang phân công...' : `Phân công cho ${selectedStudentIds.length} sinh viên`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskAssignmentModal;

import React, { useState, useEffect } from 'react';
import { StudentResponse } from '../../types';
import { studentAPI } from '../../services';

interface AddStudentModalProps {
    classId: number;
    onAddStudent: (studentId: number) => Promise<void>;
    onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
    classId,
    onAddStudent,
    onClose,
}) => {
    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            searchStudents();
        } else {
            setStudents([]);
        }
    }, [searchQuery]);

    const searchStudents = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await studentAPI.searchStudents(searchQuery);
            if (response.status && response.data) {
                setStudents(response.data.content || []);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error searching students:', error);
            setError('Có lỗi xảy ra khi tìm kiếm sinh viên');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;

        try {
            await onAddStudent(selectedStudent.id);
            onClose();
        } catch (error) {
            console.error('Error adding student:', error);
            setError('Có lỗi xảy ra khi thêm sinh viên vào lớp');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Thêm sinh viên vào lớp
                    </h3>
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

                <div className="space-y-4">
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
                        <p className="mt-1 text-sm text-gray-500">
                            Nhập ít nhất 2 ký tự để tìm kiếm
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Đang tìm kiếm...</p>
                        </div>
                    )}

                    {!loading && students.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            <div className="divide-y divide-gray-200">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <div className="flex items-center">
                                            {student.avatarUrl && (
                                                <img
                                                    className="h-10 w-10 rounded-full mr-3"
                                                    src={student.avatarUrl}
                                                    alt={student.fullName}
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.fullName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.studentCode} • {student.email}
                                                </div>
                                                {student.className && (
                                                    <div className="text-xs text-orange-600">
                                                        Đã có lớp: {student.className}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedStudent?.id === student.id && (
                                                <div className="text-blue-600">
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && searchQuery.length >= 2 && students.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Không tìm thấy sinh viên nào</p>
                        </div>
                    )}

                    {!loading && searchQuery.length < 2 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Nhập tên hoặc mã sinh viên để tìm kiếm</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAddStudent}
                        disabled={!selectedStudent}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Thêm vào lớp
                    </button>
                </div>
            </div>
        </div>
    );
};

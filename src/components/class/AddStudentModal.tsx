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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#FFD66D] rounded-lg flex items-center justify-center mr-3">
                                <span className="text-2xl">➕</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Thêm sinh viên vào lớp
                                </h3>
                                <p className="text-xs text-gray-200 mt-0.5">
                                    Tìm kiếm và thêm sinh viên vào lớp học
                                </p>
                            </div>
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

                {/* Content */}
                <div className="p-6">

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                                Tìm kiếm sinh viên
                            </label>
                            <input
                                type="text"
                                id="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập tên hoặc mã sinh viên..."
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-colors"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Nhập ít nhất 2 ký tự để tìm kiếm
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001C44] mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-600">Đang tìm kiếm...</p>
                            </div>
                        )}

                        {!loading && students.length > 0 && (
                            <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg">
                                <div className="divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${
                                                selectedStudent?.id === student.id 
                                                    ? 'bg-gradient-to-r from-[#001C44] to-[#002A66] bg-opacity-10 border-l-4 border-[#001C44]' 
                                                    : ''
                                            }`}
                                            onClick={() => setSelectedStudent(student)}
                                        >
                                            <div className="flex items-center">
                                                {student.avatarUrl ? (
                                                    <img
                                                        className="h-12 w-12 rounded-full mr-4 border-2 border-gray-200"
                                                        src={student.avatarUrl}
                                                        alt={student.fullName}
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full mr-4 bg-gradient-to-br from-[#001C44] to-[#002A66] flex items-center justify-center text-white font-semibold text-lg">
                                                        {student.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className={`text-sm font-semibold ${selectedStudent?.id === student.id ? 'text-[#001C44]' : 'text-gray-900'}`}>
                                                        {student.fullName}
                                                    </div>
                                                    <div className={`text-sm mt-0.5 ${selectedStudent?.id === student.id ? 'text-gray-700' : 'text-gray-600'}`}>
                                                        {student.studentCode} • {student.email}
                                                    </div>
                                                    {student.className && (
                                                        <div className="text-xs text-orange-600 mt-1 font-medium">
                                                            ⚠️ Đã có lớp: {student.className}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedStudent?.id === student.id && (
                                                    <div className="text-[#001C44] bg-[#FFD66D] rounded-full p-1">
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
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="text-gray-400 text-5xl mb-3">🔍</div>
                                <p className="text-lg font-medium text-gray-600">Không tìm thấy sinh viên nào</p>
                                <p className="text-sm text-gray-500 mt-1">Thử tìm kiếm với từ khóa khác</p>
                            </div>
                        )}

                        {!loading && searchQuery.length < 2 && (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="text-gray-400 text-5xl mb-3">👤</div>
                                <p className="text-lg font-medium text-gray-600">Nhập tên hoặc mã sinh viên để tìm kiếm</p>
                                <p className="text-sm text-gray-500 mt-1">Tối thiểu 2 ký tự</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddStudent}
                            disabled={!selectedStudent}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg hover:from-[#002A66] hover:to-[#001C44] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            Thêm vào lớp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

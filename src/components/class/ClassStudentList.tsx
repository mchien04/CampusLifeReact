import React, { useState, useEffect } from 'react';
import { StudentClass, ClassStudent, StudentResponse } from '../../types';
import { classAPI } from '../../services';
import { AddStudentModal } from './AddStudentModal';

interface ClassStudentListProps {
    classData: StudentClass;
    onClose: () => void;
    onRefresh: () => void;
}

export const ClassStudentList: React.FC<ClassStudentListProps> = ({
    classData,
    onClose,
    onRefresh,
}) => {
    const [students, setStudents] = useState<ClassStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState('');

    console.log('🔍 ClassStudentList render - students:', students, 'length:', students?.length);

    useEffect(() => {
        loadStudents();
    }, [classData.id]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            console.log('🔍 Loading students for class:', classData.id);

            // Use the correct endpoint for getting students in a specific class
            const response = await classAPI.getStudentsInClass(classData.id);
            console.log('🔍 Students response received:', response);

            if (response.status && response.data) {
                // Backend trả về StudentResponse[] trực tiếp trong body
                const studentsData = response.data;

                // Convert StudentResponse[] to ClassStudent[]
                const classStudents: ClassStudent[] = studentsData.map((student: StudentResponse) => ({
                    id: student.id,
                    studentCode: student.studentCode,
                    fullName: student.fullName,
                    email: student.email,
                    phoneNumber: student.phone,
                    profileImageUrl: student.avatarUrl,
                    addedAt: student.createdAt
                }));
                console.log('🔍 Converted classStudents:', classStudents, 'length:', classStudents.length);
                setStudents(classStudents);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setError('Có lỗi xảy ra khi tải danh sách sinh viên');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (studentId: number) => {
        try {
            console.log('🔍 Adding student:', studentId, 'to class:', classData.id);
            await classAPI.addStudentToClass(classData.id, { studentId });
            console.log('🔍 Student added successfully, reloading students...');
            await loadStudents();
            onRefresh(); // Refresh the main list to update student count
        } catch (error) {
            console.error('Error adding student:', error);
            throw error;
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp?')) {
            return;
        }

        try {
            await classAPI.removeStudentFromClass(classData.id, studentId);
            await loadStudents();
            onRefresh(); // Refresh the main list to update student count
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Có lỗi xảy ra khi xóa sinh viên');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44] mx-auto"></div>
                        <p className="mt-4 text-gray-600 font-medium">Đang tải danh sách sinh viên...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] px-6 py-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#FFD66D] rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-2xl">👥</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Danh sách sinh viên - {classData.className}
                                    </h3>
                                    <p className="text-sm text-gray-200 mt-0.5">
                                        Khoa: {classData.department.name} | Tổng số: {students?.length || 0} sinh viên
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-5 py-2.5 bg-[#FFD66D] text-[#001C44] rounded-lg hover:bg-[#FFC947] font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    + Thêm sinh viên
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-white hover:text-[#FFD66D] transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {(!students || students.length === 0) ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="text-gray-400 text-6xl mb-4">👥</div>
                                <p className="text-gray-600 text-lg font-medium">Chưa có sinh viên nào trong lớp này</p>
                                <p className="text-gray-500 text-sm mt-2">Thêm sinh viên vào lớp để bắt đầu</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-[#001C44] to-[#002A66]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Mã sinh viên
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Họ và tên
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Số điện thoại
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Ngày thêm
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(students || []).map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-[#001C44]">
                                                        {student.studentCode}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {student.profileImageUrl ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full mr-3 border-2 border-gray-200"
                                                                src={student.profileImageUrl}
                                                                alt={student.fullName}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full mr-3 bg-gradient-to-br from-[#001C44] to-[#002A66] flex items-center justify-center text-white font-semibold text-sm">
                                                                {student.fullName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.fullName}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">{student.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">
                                                        {student.phoneNumber || <span className="text-gray-400">Chưa cập nhật</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">
                                                        {new Date(student.addedAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                        className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 font-semibold transition-all"
                                                    >
                                                        🗑️ Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <AddStudentModal
                    classId={classData.id}
                    onAddStudent={handleAddStudent}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </>
    );
};

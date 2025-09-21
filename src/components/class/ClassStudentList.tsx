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
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách sinh viên...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Danh sách sinh viên - {classData.className}
                            </h3>
                            <p className="text-sm text-gray-600">
                                Khoa: {classData.department.name} | Tổng số: {students?.length || 0} sinh viên
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                + Thêm sinh viên
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mã sinh viên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ và tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số điện thoại
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày thêm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(!students || students.length === 0) ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Chưa có sinh viên nào trong lớp này
                                        </td>
                                    </tr>
                                ) : (
                                    (students || []).map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.studentCode}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {student.profileImageUrl && (
                                                        <img
                                                            className="h-10 w-10 rounded-full mr-3"
                                                            src={student.profileImageUrl}
                                                            alt={student.fullName}
                                                        />
                                                    )}
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.fullName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {student.phoneNumber || 'Chưa cập nhật'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(student.addedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Xóa khỏi lớp
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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

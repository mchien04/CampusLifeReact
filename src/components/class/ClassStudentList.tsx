import React, { useState, useEffect } from 'react';
import { StudentClass, ClassStudent, StudentResponse } from '../../types';
import { classAPI } from '../../services';
import { AddStudentModal } from './AddStudentModal';
import {
    StructureModal,
    modalCancelBtnClass,
    modalPrimaryBtnClass,
} from '../admin/StructureModal';

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

    useEffect(() => {
        loadStudents();
    }, [classData.id]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await classAPI.getStudentsInClass(classData.id);

            if (response.status && response.data) {
                const studentsData = response.data;
                const classStudents: ClassStudent[] = studentsData.map((student: StudentResponse) => ({
                    id: student.id,
                    studentCode: student.studentCode,
                    fullName: student.fullName,
                    email: student.email,
                    phoneNumber: student.phone,
                    profileImageUrl: student.avatarUrl,
                    addedAt: student.createdAt,
                }));
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
            await classAPI.addStudentToClass(classData.id, { studentId });
            await loadStudents();
            onRefresh();
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
            onRefresh();
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Có lỗi xảy ra khi xóa sinh viên');
        }
    };

    return (
        <>
            <StructureModal
                title={`Sinh viên · ${classData.className}`}
                subtitle={`${classData.department.name} · ${students.length} sinh viên`}
                onClose={onClose}
                size="xl"
                align="start"
                footer={
                    <>
                        <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                            Đóng
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className={modalPrimaryBtnClass}
                        >
                            Thêm sinh viên
                        </button>
                    </>
                }
            >
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary-900 border-t-transparent" />
                        <p className="mt-3 text-sm text-gray-500">Đang tải danh sách...</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        {students.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-14 text-center">
                                <p className="font-medium text-gray-800">Chưa có sinh viên trong lớp</p>
                                <p className="mt-1 text-sm text-gray-500">Thêm sinh viên để bắt đầu quản lý</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/80">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                MSSV
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Họ tên
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                SĐT
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Ngày thêm
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold tabular-nums text-primary-900">
                                                    {student.studentCode}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {student.profileImageUrl ? (
                                                            <img
                                                                className="h-9 w-9 rounded-xl object-cover"
                                                                src={student.profileImageUrl}
                                                                alt={student.fullName}
                                                            />
                                                        ) : (
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-900 text-sm font-semibold text-white">
                                                                {student.fullName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {student.fullName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {student.email}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm tabular-nums text-gray-600">
                                                    {student.phoneNumber || (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm tabular-nums text-gray-500">
                                                    {new Date(student.addedAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-all hover:bg-rose-100 active:scale-[0.98]"
                                                    >
                                                        Gỡ khỏi lớp
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </StructureModal>

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

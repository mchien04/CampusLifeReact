import React, { useState, useEffect } from 'react';
import { StudentResponse } from '../../types';
import { studentAPI } from '../../services';
import {
    StructureModal,
    modalCancelBtnClass,
    modalFieldClass,
    modalLabelClass,
    modalPrimaryBtnClass,
} from '../admin/StructureModal';

interface AddStudentModalProps {
    classId: number;
    onAddStudent: (studentId: number) => Promise<void>;
    onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
    onAddStudent,
    onClose,
}) => {
    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
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
            setAdding(true);
            await onAddStudent(selectedStudent.id);
            onClose();
        } catch (error) {
            console.error('Error adding student:', error);
            setError('Có lỗi xảy ra khi thêm sinh viên vào lớp');
        } finally {
            setAdding(false);
        }
    };

    return (
        <StructureModal
            title="Thêm sinh viên vào lớp"
            subtitle="Tìm theo tên hoặc mã sinh viên (tối thiểu 2 ký tự)"
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <button type="button" onClick={onClose} className={modalCancelBtnClass}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleAddStudent()}
                        disabled={!selectedStudent || adding}
                        className={modalPrimaryBtnClass}
                    >
                        {adding ? 'Đang thêm...' : 'Thêm vào lớp'}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="search" className={modalLabelClass}>
                        Tìm kiếm
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tên hoặc MSSV..."
                        className={modalFieldClass()}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="py-10 text-center">
                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary-900 border-t-transparent" />
                        <p className="mt-2 text-sm text-gray-500">Đang tìm kiếm...</p>
                    </div>
                )}

                {!loading && students.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {students.map((student) => {
                                const selected = selectedStudent?.id === student.id;
                                return (
                                    <li key={student.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedStudent(student)}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                selected
                                                    ? 'bg-primary-50 border-l-4 border-primary-900'
                                                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                                            }`}
                                        >
                                            {student.avatarUrl ? (
                                                <img
                                                    className="h-10 w-10 rounded-xl object-cover"
                                                    src={student.avatarUrl}
                                                    alt={student.fullName}
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-900 text-sm font-semibold text-white">
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-primary-900">
                                                    {student.fullName}
                                                </p>
                                                <p className="truncate text-sm text-gray-500 tabular-nums">
                                                    {student.studentCode} · {student.email}
                                                </p>
                                                {student.className && (
                                                    <p className="mt-0.5 text-xs font-medium text-amber-700">
                                                        Đã có lớp: {student.className}
                                                    </p>
                                                )}
                                            </div>
                                            {selected && (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-primary-900">
                                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {!loading && searchQuery.length >= 2 && students.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-10 text-center">
                        <p className="font-medium text-gray-800">Không tìm thấy sinh viên</p>
                        <p className="mt-1 text-sm text-gray-500">Thử từ khóa khác</p>
                    </div>
                )}

                {!loading && searchQuery.length < 2 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 py-10 text-center">
                        <p className="font-medium text-gray-800">Nhập tên hoặc MSSV để tìm</p>
                        <p className="mt-1 text-sm text-gray-500">Tối thiểu 2 ký tự</p>
                    </div>
                )}
            </div>
        </StructureModal>
    );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Student, Department, StudentClass, UpdateStudentProfileRequest } from '../types';
import { studentAPI, departmentAPI, classAPI, uploadAPI } from '../services';
import { GENDER_OPTIONS, getGenderLabel } from '../types/student';

const StudentProfile: React.FC = () => {
    const [student, setStudent] = useState<Student | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        studentCode: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        profileImageUrl: '',
        departmentId: 0,
        classId: 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentData, departmentsData] = await Promise.all([
                studentAPI.getMyProfile(),
                departmentAPI.getAll()
            ]);

            setStudent(studentData);
            setDepartments(departmentsData.data || []);

            setFormData({
                fullName: studentData.fullName,
                studentCode: studentData.studentCode,
                phoneNumber: studentData.phoneNumber || '',
                dateOfBirth: studentData.dateOfBirth ? studentData.dateOfBirth.split('T')[0] : '',
                gender: studentData.gender || '',
                profileImageUrl: studentData.profileImageUrl || '',
                departmentId: studentData.studentClass?.department.id || 0,
                classId: studentData.studentClass?.id || 0,
            });

            if (studentData.studentClass?.department.id) {
                await loadClasses(studentData.studentClass.department.id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Có lỗi xảy ra khi tải thông tin profile');
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async (departmentId: number) => {
        try {
            const data = await classAPI.getClassesByDepartment(departmentId);
            setClasses(data);
        } catch (error) {
            console.error('Error loading classes:', error);
            setError('Có lỗi xảy ra khi tải danh sách lớp học');
        }
    };

    const handleDepartmentChange = async (departmentId: number) => {
        setFormData(prev => ({
            ...prev,
            departmentId,
            classId: 0, // Reset class selection
        }));
        setClasses([]); // Clear classes
        if (departmentId > 0) {
            await loadClasses(departmentId);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn file ảnh');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Kích thước file không được vượt quá 5MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ tên là bắt buộc';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
        } else if (formData.fullName.trim().length > 50) {
            newErrors.fullName = 'Họ tên không được quá 50 ký tự';
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.fullName.trim())) {
            newErrors.fullName = 'Họ tên chỉ được chứa chữ cái';
        }

        // Student code validation
        if (!formData.studentCode.trim()) {
            newErrors.studentCode = 'Mã sinh viên là bắt buộc';
        } else if (formData.studentCode.trim().length < 6) {
            newErrors.studentCode = 'Mã sinh viên phải có ít nhất 6 ký tự';
        } else if (formData.studentCode.trim().length > 20) {
            newErrors.studentCode = 'Mã sinh viên không được quá 20 ký tự';
        } else if (!/^[a-zA-Z0-9]+$/.test(formData.studentCode.trim())) {
            newErrors.studentCode = 'Mã sinh viên chỉ được chứa chữ cái và số';
        }

        // Phone number validation
        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
        }

        // Date of birth validation
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            if (birthDate > today) {
                newErrors.dateOfBirth = 'Ngày sinh không được trong tương lai';
            }
        }

        // Department validation
        if (!formData.departmentId) {
            newErrors.departmentId = 'Vui lòng chọn khoa';
        }

        // Class validation
        if (!formData.classId) {
            newErrors.classId = 'Vui lòng chọn lớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            let profileImageUrl = formData.profileImageUrl;

            // Upload new image if selected
            if (imageFile) {
                const uploadResponse = await uploadAPI.uploadImage(imageFile);
                if (uploadResponse.status && uploadResponse.data) {
                    profileImageUrl = uploadResponse.data.bannerUrl;
                }
            }

            const data: UpdateStudentProfileRequest = {
                fullName: formData.fullName.trim(),
                studentCode: formData.studentCode.trim(),
                phoneNumber: formData.phoneNumber.trim() || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
                profileImageUrl,
                departmentId: formData.departmentId,
                classId: formData.classId,
            };

            const updatedStudent = await studentAPI.updateMyProfile(data);
            setStudent(updatedStudent);
            setSuccess('Cập nhật profile thành công!');

            // Clear image file and preview
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Có lỗi xảy ra khi cập nhật profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'departmentId' || name === 'classId' ? parseInt(value) : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa profile</h1>
                            <p className="text-gray-600 mt-1">Cập nhật thông tin cá nhân của bạn</p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Image */}
                        <div className="flex items-center space-x-6">
                            <div className="flex-shrink-0">
                                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : formData.profileImageUrl ? (
                                        <img
                                            src={formData.profileImageUrl}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                                    Ảnh đại diện
                                </label>
                                <input
                                    type="file"
                                    id="profileImage"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="mt-1 block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    JPG, PNG hoặc GIF. Tối đa 5MB.
                                </p>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.fullName ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Nhập họ và tên"
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">
                                    Mã sinh viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="studentCode"
                                    name="studentCode"
                                    value={formData.studentCode}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.studentCode ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Nhập mã sinh viên"
                                />
                                {errors.studentCode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.studentCode}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Nhập số điện thoại"
                                />
                                {errors.phoneNumber && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                                    Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                                {errors.dateOfBirth && (
                                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                    Giới tính
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Chọn giới tính</option>
                                    {GENDER_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={student?.user?.email || ''}
                                    disabled
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Email không thể thay đổi
                                </p>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin học tập</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                                        Khoa <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="departmentId"
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={(e) => handleDepartmentChange(parseInt(e.target.value))}
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.departmentId ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value={0}>Chọn khoa</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.departmentId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
                                        Lớp <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="classId"
                                        name="classId"
                                        value={formData.classId}
                                        onChange={handleChange}
                                        disabled={!formData.departmentId || classes.length === 0}
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.classId ? 'border-red-300' : 'border-gray-300'
                                            } ${!formData.departmentId || classes.length === 0 ? 'bg-gray-100' : ''}`}
                                    >
                                        <option value={0}>
                                            {!formData.departmentId ? 'Chọn khoa trước' :
                                                classes.length === 0 ? 'Đang tải...' : 'Chọn lớp'}
                                        </option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.className}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.classId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.classId}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Link */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Địa chỉ</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Quản lý địa chỉ</p>
                                    <p className="text-sm text-gray-500">Cập nhật thông tin địa chỉ của bạn</p>
                                </div>
                                <Link
                                    to="/student/address"
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Quản lý địa chỉ
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;

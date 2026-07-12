import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Student, Department, StudentClass, UpdateStudentProfileRequest } from '../types';
import { StudentProfileResponse } from '../types/student';
import { studentAPI, departmentAPI, classAPI, uploadAPI, addressAPI } from '../services';
import { GENDER_OPTIONS, getGenderLabel } from '../types/student';
import { Address, Province, Ward, CreateAddressRequest, UpdateAddressRequest } from '../types/address';
import StudentLayout from '../components/layout/StudentLayout';
import SearchableSelect from '../components/common/SearchableSelect';
import { User, MapPin, GraduationCap, EnvelopeSimple, Phone, CalendarBlank, IdentificationCard, GenderIntersex, ArrowLeft, FloppyDisk, ImageSquare, Trash, MapTrifold, Buildings, WarningCircle, CheckCircle, Info, Camera } from '@phosphor-icons/react';

const StudentProfile: React.FC = () => {
    const [student, setStudent] = useState<StudentProfileResponse | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Address management states
    const [address, setAddress] = useState<Address | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [addressFormData, setAddressFormData] = useState({
        provinceCode: 0,
        wardCode: 0,
        street: '',
        note: ''
    });
    const [addressSaving, setAddressSaving] = useState(false);
    const [addressError, setAddressError] = useState('');
    const [addressSuccess, setAddressSuccess] = useState('');
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
            const [studentData, departmentsData, addressData, provincesData] = await Promise.all([
                studentAPI.getMyProfile(),
                departmentAPI.getAll(),
                addressAPI.getMyAddress().catch(() => null), // Ignore error if no address
                addressAPI.getProvinces()
            ]);

            setStudent(studentData);
            setDepartments(departmentsData.data || []);
            setAddress(addressData);
            setProvinces(provincesData || []);

            setFormData({
                fullName: studentData.fullName,
                studentCode: studentData.studentCode,
                phoneNumber: studentData.phone || '',
                dateOfBirth: studentData.dob ? studentData.dob.split('T')[0] : '',
                gender: studentData.gender || '',
                profileImageUrl: studentData.avatarUrl || '',
                departmentId: studentData.departmentId || 0,
                classId: studentData.classId || 0,
            });

            if (studentData.departmentId) {
                await loadClasses(studentData.departmentId);
            }

            // Set address form data if address exists
            if (addressData) {
                setAddressFormData({
                    provinceCode: addressData.provinceCode,
                    wardCode: addressData.wardCode,
                    street: addressData.street || '',
                    note: addressData.note || ''
                });
                // Load wards for the province
                if (addressData.provinceCode) {
                    await loadWards(addressData.provinceCode);
                }
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

    const loadWards = async (provinceCode: number) => {
        try {
            const response = await addressAPI.getWardsByProvince(provinceCode);
            const uniqueWards = response.filter((ward: Ward, index: number, self: Ward[]) =>
                index === self.findIndex((w: Ward) => w.code === ward.code)
            );
            setWards(uniqueWards);
        } catch (error) {
            console.error('Error loading wards:', error);
            setWards([]);
        }
    };

    const handleProvinceChange = async (provinceCode: number) => {
        setAddressFormData(prev => ({
            ...prev,
            provinceCode,
            wardCode: 0, // Reset ward selection
        }));
        setWards([]); // Clear wards
        if (provinceCode > 0) {
            await loadWards(provinceCode);
        }
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressFormData.provinceCode || !addressFormData.wardCode) {
            setAddressError('Vui lòng chọn tỉnh/thành phố và phường/xã');
            return;
        }

        setAddressSaving(true);
        setAddressError('');
        setAddressSuccess('');

        try {
            const selectedProvince = provinces.find(p => p.code === addressFormData.provinceCode);
            const selectedWard = wards.find(w => w.code === addressFormData.wardCode);

            const data: CreateAddressRequest | UpdateAddressRequest = {
                provinceCode: addressFormData.provinceCode,
                provinceName: selectedProvince?.name || '',
                wardCode: addressFormData.wardCode,
                wardName: selectedWard?.name || '',
                street: addressFormData.street.trim() || undefined,
                note: addressFormData.note.trim() || undefined,
            };

            if (address) {
                await addressAPI.updateMyAddress(data);
                setAddressSuccess('Cập nhật địa chỉ thành công!');
            } else {
                await addressAPI.createMyAddress(data);
                setAddressSuccess('Tạo địa chỉ thành công!');
            }

            // Reload address data and update form
            const addressData = await addressAPI.getMyAddress();
            setAddress(addressData);
            
            // Update form data with the new address
            if (addressData) {
                setAddressFormData({
                    provinceCode: addressData.provinceCode,
                    wardCode: addressData.wardCode,
                    street: addressData.street || '',
                    note: addressData.note || ''
                });
                // Reload wards for the province
                if (addressData.provinceCode) {
                    await loadWards(addressData.provinceCode);
                }
            }
        } catch (error: any) {
            console.error('Error saving address:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu địa chỉ';
            setAddressError(errorMessage);
        } finally {
            setAddressSaving(false);
        }
    };

    const handleDeleteAddress = async () => {
        if (!address) return;
        
        if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            return;
        }

        setAddressSaving(true);
        setAddressError('');
        setAddressSuccess('');

        try {
            await addressAPI.deleteMyAddress();
            setAddress(null);
            setAddressFormData({
                provinceCode: 0,
                wardCode: 0,
                street: '',
                note: ''
            });
            setWards([]);
            setAddressSuccess('Xóa địa chỉ thành công!');
        } catch (error: any) {
            console.error('Error deleting address:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi xóa địa chỉ';
            setAddressError(errorMessage);
        } finally {
            setAddressSaving(false);
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
                    profileImageUrl = uploadResponse.data;
                }
            }

            const data: UpdateStudentProfileRequest = {
                fullName: formData.fullName.trim(),
                studentCode: formData.studentCode.trim(),
                phone: formData.phoneNumber.trim() || undefined,
                dob: formData.dateOfBirth || undefined,
                gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
                avatarUrl: profileImageUrl,
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
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[500px]">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 font-medium">Đang tải thông tin cá nhân...</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6 md:p-8">
                {/* Header */}
                <div className="bg-primary-900 rounded-3xl shadow-premium p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
                            <User weight="duotone" className="w-8 h-8 text-secondary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Hồ sơ sinh viên</h1>
                            <p className="text-primary-100 font-medium">Quản lý thông tin cá nhân và địa chỉ liên lạc</p>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50/80 border border-green-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
                        <CheckCircle weight="fill" className="w-6 h-6 text-green-500 shrink-0" />
                        <p className="text-green-800 font-medium pt-0.5">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
                        <WarningCircle weight="fill" className="w-6 h-6 text-red-500 shrink-0" />
                        <p className="text-red-800 font-medium pt-0.5">{error}</p>
                    </div>
                )}

                {/* Profile Form */}
                <div className="bg-white rounded-3xl shadow-premium border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
                        
                        {/* Section 1: Profile Image */}
                        <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-full md:w-1/3 shrink-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <ImageSquare weight="duotone" className="w-5 h-5 text-primary-500" />
                                    Ảnh đại diện
                                </h3>
                                <p className="text-sm text-gray-500">Cập nhật ảnh đại diện của bạn. Ảnh chân dung rõ nét, kích thước tối đa 5MB.</p>
                            </div>
                            
                            <div className="w-full md:w-2/3 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-md ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                        ) : formData.profileImageUrl ? (
                                            <img
                                                src={formData.profileImageUrl}
                                                alt="Profile"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                        ) : (
                                            <User weight="fill" className="w-16 h-16 text-gray-300" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center text-center sm:text-left h-32">
                                    <label htmlFor="profileImage" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-50 text-primary-700 font-bold rounded-xl hover:bg-primary-100 transition-colors cursor-pointer border border-primary-100 shadow-sm mb-3">
                                        <Camera weight="bold" className="w-5 h-5" />
                                        Tải ảnh lên
                                    </label>
                                    <input
                                        type="file"
                                        id="profileImage"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <p className="text-xs font-medium text-gray-500">
                                        Định dạng hỗ trợ: JPG, PNG, GIF.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Basic Information */}
                        <div className="p-8 flex flex-col lg:flex-row gap-8 items-start bg-gray-50/50">
                            <div className="w-full lg:w-1/3 shrink-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <IdentificationCard weight="duotone" className="w-5 h-5 text-primary-500" />
                                    Thông tin cơ bản
                                </h3>
                                <p className="text-sm text-gray-500">Thông tin cá nhân và định danh của bạn trong hệ thống.</p>
                            </div>
                            
                            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <User weight="bold" className="text-gray-400" />
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Nhập họ và tên"
                                    />
                                    {errors.fullName && (
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="studentCode" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <IdentificationCard weight="bold" className="text-gray-400" />
                                        Mã sinh viên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="studentCode"
                                        name="studentCode"
                                        value={formData.studentCode}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.studentCode ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Nhập mã sinh viên"
                                    />
                                    {errors.studentCode && (
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.studentCode}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone weight="bold" className="text-gray-400" />
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Nhập số điện thoại"
                                    />
                                    {errors.phoneNumber && (
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.phoneNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="dateOfBirth" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <CalendarBlank weight="bold" className="text-gray-400" />
                                        Ngày sinh
                                    </label>
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                    />
                                    {errors.dateOfBirth && (
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.dateOfBirth}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="gender" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <GenderIntersex weight="bold" className="text-gray-400" />
                                        Giới tính
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <EnvelopeSimple weight="bold" className="text-gray-400" />
                                        Email <span className="text-xs text-gray-400 font-normal ml-2 bg-gray-100 px-2 py-0.5 rounded-full">(Chỉ đọc)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={student?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-gray-500 font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Academic Information */}
                        <div className="p-8 flex flex-col lg:flex-row gap-8 items-start">
                            <div className="w-full lg:w-1/3 shrink-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <GraduationCap weight="duotone" className="w-5 h-5 text-primary-500" />
                                    Thông tin học tập
                                </h3>
                                <p className="text-sm text-gray-500">Khoa và Lớp bạn đang trực thuộc.</p>
                            </div>
                            
                            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="departmentId" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Buildings weight="bold" className="text-gray-400" />
                                        Khoa <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="departmentId"
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={(e) => handleDepartmentChange(parseInt(e.target.value))}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.departmentId ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                    >
                                        <option value={0}>Chọn khoa</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.departmentId && (
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.departmentId}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="classId" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <GraduationCap weight="bold" className="text-gray-400" />
                                        Lớp <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="classId"
                                        name="classId"
                                        value={formData.classId}
                                        onChange={handleChange}
                                        disabled={!formData.departmentId || classes.length === 0}
                                        className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium ${errors.classId ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${(!formData.departmentId || classes.length === 0) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
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
                                        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1"><WarningCircle weight="fill" />{errors.classId}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Address Management */}
                        <div className="p-8 flex flex-col lg:flex-row gap-8 items-start bg-gray-50/50">
                            <div className="w-full lg:w-1/3 shrink-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <MapPin weight="duotone" className="w-5 h-5 text-primary-500" />
                                    Địa chỉ liên hệ
                                </h3>
                                <p className="text-sm text-gray-500">Nơi ở hiện tại của bạn.</p>
                            </div>
                            
                            <div className="w-full lg:w-2/3 space-y-6">
                                {/* Current Address Display */}
                                {address && (
                                    <div className="bg-primary-900 rounded-2xl p-5 text-white flex items-start gap-4 shadow-md relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-white/10 transition-colors"></div>
                                        <MapTrifold weight="duotone" className="w-8 h-8 text-secondary-400 shrink-0" />
                                        <div className="relative z-10">
                                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider mb-1">Địa chỉ hiện tại</p>
                                            <p className="text-white font-medium leading-relaxed">
                                                {address.street && `${address.street}, `}
                                                {address.wardName}, {address.provinceName}
                                                {address.note && <span className="block mt-1 text-primary-200 text-sm">Ghi chú: {address.note}</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <SearchableSelect
                                            id="addressProvince"
                                            label="Tỉnh/Thành phố"
                                            options={[
                                                { value: 0, label: 'Chọn tỉnh/thành phố' },
                                                ...provinces.map(province => ({
                                                    value: province.code,
                                                    label: province.name
                                                }))
                                            ]}
                                            value={addressFormData.provinceCode}
                                            onChange={(value) => handleProvinceChange(Number(value))}
                                            placeholder="Tìm kiếm..."
                                            required
                                        />

                                        <SearchableSelect
                                            id="addressWard"
                                            label="Phường/Xã"
                                            options={[
                                                { value: 0, label: 'Chọn phường/xã' },
                                                ...wards.map(ward => ({
                                                    value: ward.code,
                                                    label: ward.name
                                                }))
                                            ]}
                                            value={addressFormData.wardCode}
                                            onChange={(value) => setAddressFormData(prev => ({ ...prev, wardCode: Number(value) }))}
                                            placeholder="Tìm kiếm..."
                                            disabled={wards.length === 0}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="addressStreet" className="block text-sm font-bold text-gray-700 mb-2">
                                            Số nhà, tên đường
                                        </label>
                                        <input
                                            type="text"
                                            id="addressStreet"
                                            value={addressFormData.street}
                                            onChange={(e) => setAddressFormData(prev => ({ ...prev, street: e.target.value }))}
                                            placeholder="Nhập số nhà, tên đường..."
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="addressNote" className="block text-sm font-bold text-gray-700 mb-2">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            id="addressNote"
                                            value={addressFormData.note}
                                            onChange={(e) => setAddressFormData(prev => ({ ...prev, note: e.target.value }))}
                                            placeholder="Chỉ dẫn thêm về địa chỉ (không bắt buộc)..."
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    {/* Address Messages */}
                                    {addressError && (
                                        <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                                            <WarningCircle weight="fill" className="w-5 h-5 text-red-500 shrink-0" />
                                            <p className="text-sm font-medium text-red-700">{addressError}</p>
                                        </div>
                                    )}

                                    {addressSuccess && (
                                        <div className="bg-green-50/80 border border-green-200 rounded-xl p-3 flex items-start gap-2">
                                            <CheckCircle weight="fill" className="w-5 h-5 text-green-500 shrink-0" />
                                            <p className="text-sm font-medium text-green-700">{addressSuccess}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                                        {address && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteAddress}
                                                disabled={addressSaving}
                                                className="px-5 py-2.5 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Trash weight="bold" />
                                                {addressSaving ? 'Đang xử lý...' : 'Xóa địa chỉ'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleAddressSubmit}
                                            disabled={addressSaving}
                                            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <FloppyDisk weight="bold" />
                                            {addressSaving ? 'Đang lưu...' : (address ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Submit Action */}
                        <div className="p-8 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                            <Link
                                to="/student/dashboard"
                                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft weight="bold" />
                                Trở về
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 bg-primary-900 text-white font-bold rounded-xl hover:bg-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                <FloppyDisk weight="bold" className="w-5 h-5" />
                                {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;

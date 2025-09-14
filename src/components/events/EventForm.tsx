import React, { useState, useEffect, ChangeEvent } from 'react';
import { CreateActivityRequest, ActivityType, ScoreType } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { getImageUrl } from '../../utils/imageUtils';
import { departmentAPI } from '../../services/api';

interface EventFormProps {
    onSubmit: (data: CreateActivityRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityRequest>;
    title?: string;
    onCancel?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện mới",
    onCancel
}) => {
    const [formData, setFormData] = useState<CreateActivityRequest>({
        name: '',
        type: ActivityType.SUKIEN,
        scoreType: ScoreType.REN_LUYEN,
        description: '',
        startDate: '',
        endDate: '',
        requiresSubmission: false,
        maxPoints: 0,
        penaltyPointsIncomplete: 0,
        registrationStartDate: '',
        registrationDeadline: '',
        shareLink: '',
        isImportant: false,
        bannerUrl: '',
        location: '',
        ticketQuantity: 0,
        benefits: '',
        requirements: '',
        contactInfo: '',
        mandatoryForFacultyStudents: false,
        organizerIds: [],
        ...initialData
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [departments, setDepartments] = useState<any[]>([]);
    const [organizerInput, setOrganizerInput] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên sự kiện là bắt buộc';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Địa điểm là bắt buộc';
        }

        if (formData.requiresSubmission && (!formData.maxPoints || formData.maxPoints <= 0)) {
            newErrors.maxPoints = 'Điểm tối đa phải lớn hơn 0 khi yêu cầu nộp bài';
        }

        if (!formData.organizerIds || formData.organizerIds.length === 0) {
            newErrors.organizerIds = 'Phải chọn ít nhất một đơn vị tổ chức';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isUploading, setIsUploading] = useState(false);

    // Load departments on component mount
    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await departmentAPI.getAll();
                if (response.status && response.data) {
                    setDepartments(response.data);
                }
            } catch (error) {
                console.error('Error loading departments:', error);
            }
        };
        loadDepartments();
    }, []);

    // Handle organizer input change
    const handleOrganizerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrganizerInput(e.target.value);
    };

    // Add organizer IDs from input
    const addOrganizers = () => {
        if (organizerInput.trim()) {
            const ids = organizerInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            setFormData(prev => ({
                ...prev,
                organizerIds: [...prev.organizerIds, ...ids.filter(id => !prev.organizerIds.includes(id))]
            }));
            setOrganizerInput('');
        }
    };

    // Remove organizer ID
    const removeOrganizer = (idToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            organizerIds: prev.organizerIds.filter(id => id !== idToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsUploading(true);
                console.log('🔍 EventForm: Starting form submission...');
                console.log('🔍 EventForm: Form data before upload:', formData);

                // If there's a file to upload, upload it first
                if (formData.bannerFile) {
                    console.log('🔍 EventForm: File detected, starting upload...');
                    console.log('🔍 EventForm: File info:', {
                        name: formData.bannerFile.name,
                        size: formData.bannerFile.size,
                        type: formData.bannerFile.type
                    });

                    const uploadResponse = await uploadAPI.uploadImage(formData.bannerFile);
                    console.log('🔍 EventForm: Upload response:', uploadResponse);
                    console.log('🔍 EventForm: Upload response.data:', uploadResponse.data);
                    console.log('🔍 EventForm: Upload response.data.bannerUrl:', uploadResponse.data?.bannerUrl);

                    if (uploadResponse.status && uploadResponse.data) {
                        console.log('🔍 EventForm: Upload successful, bannerUrl:', uploadResponse.data.bannerUrl);

                        // Update formData with the uploaded image URL
                        const updatedFormData = {
                            ...formData,
                            bannerUrl: uploadResponse.data.bannerUrl,
                            bannerFile: undefined // Remove file reference
                        };

                        console.log('🔍 EventForm: Updated form data:', updatedFormData);
                        console.log('🔍 EventForm: Calling onSubmit with updated data...');

                        onSubmit(updatedFormData);
                    } else {
                        console.error('🔍 EventForm: Upload failed:', uploadResponse);
                        // Show upload error
                        setErrors(prev => ({
                            ...prev,
                            banner: uploadResponse.message || 'Upload ảnh thất bại'
                        }));
                        setIsUploading(false);
                        return;
                    }
                } else {
                    console.log('🔍 EventForm: No file to upload, submitting directly...');
                    console.log('🔍 EventForm: Final form data:', formData);
                    // No file to upload, submit directly
                    onSubmit(formData);
                }
            } catch (error) {
                console.error('🔍 EventForm: Error in form submission:', error);
                setErrors(prev => ({
                    ...prev,
                    banner: 'Có lỗi xảy ra khi xử lý form'
                }));
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-gray-600 mt-1">Điền thông tin chi tiết về sự kiện</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Tên sự kiện *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Nhập tên sự kiện"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                Loại sự kiện
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={ActivityType.SUKIEN}>Sự kiện</option>
                                <option value={ActivityType.MINIGAME}>Mini Game</option>
                                <option value={ActivityType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                                <option value={ActivityType.CHUYEN_DE_DOANH_NGHIEP}>Chuyên đề doanh nghiệp</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="scoreType" className="block text-sm font-medium text-gray-700 mb-2">
                                Kiểu tính điểm
                            </label>
                            <select
                                id="scoreType"
                                name="scoreType"
                                value={formData.scoreType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={ScoreType.REN_LUYEN}>Điểm rèn luyện</option>
                                <option value={ScoreType.CONG_TAC_XA_HOI}>Điểm công tác xã hội</option>
                                <option value={ScoreType.CHUYEN_DE}>Điểm chuyên đề doanh nghiệp</option>
                                <option value={ScoreType.KHAC}>Các loại khác</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Địa điểm *
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Nhập địa điểm tổ chức"
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả sự kiện
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả chi tiết về sự kiện..."
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày bắt đầu *
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                        </div>

                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày kết thúc *
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                        </div>

                        <div>
                            <label htmlFor="registrationStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày mở đăng ký
                            </label>
                            <input
                                type="date"
                                id="registrationStartDate"
                                name="registrationStartDate"
                                value={formData.registrationStartDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                                Hạn đăng ký
                            </label>
                            <input
                                type="date"
                                id="registrationDeadline"
                                name="registrationDeadline"
                                value={formData.registrationDeadline}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700 mb-2">
                                Điểm tối đa
                            </label>
                            <input
                                type="number"
                                id="maxPoints"
                                name="maxPoints"
                                value={formData.maxPoints}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxPoints ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="0"
                            />
                            {errors.maxPoints && <p className="text-red-500 text-sm mt-1">{errors.maxPoints}</p>}
                        </div>

                        <div>
                            <label htmlFor="penaltyPointsIncomplete" className="block text-sm font-medium text-gray-700 mb-2">
                                Điểm trừ khi không hoàn thành
                            </label>
                            <input
                                type="number"
                                id="penaltyPointsIncomplete"
                                name="penaltyPointsIncomplete"
                                value={formData.penaltyPointsIncomplete}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label htmlFor="ticketQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                                Số lượng vé/slot
                            </label>
                            <input
                                type="number"
                                id="ticketQuantity"
                                name="ticketQuantity"
                                value={formData.ticketQuantity}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0 (không giới hạn)"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="bannerUrl" className="block text-sm font-medium text-gray-700 mb-2">
                            Banner sự kiện
                        </label>
                        <div className="space-y-2">
                            {/* File Upload */}
                            <div>
                                <input
                                    type="file"
                                    id="bannerFile"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Validate file size (5MB)
                                            if (file.size > 5 * 1024 * 1024) {
                                                setErrors(prev => ({
                                                    ...prev,
                                                    banner: 'File quá lớn. Kích thước tối đa là 5MB'
                                                }));
                                                return;
                                            }

                                            // Validate file type
                                            if (!file.type.startsWith('image/')) {
                                                setErrors(prev => ({
                                                    ...prev,
                                                    banner: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)'
                                                }));
                                                return;
                                            }

                                            // Clear previous errors
                                            setErrors(prev => ({
                                                ...prev,
                                                banner: ''
                                            }));

                                            setFormData(prev => ({
                                                ...prev,
                                                bannerFile: file
                                            }));
                                            // Clear URL if file is selected
                                            setFormData(prev => ({
                                                ...prev,
                                                bannerUrl: ''
                                            }));
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Chọn ảnh từ máy tính (JPG, PNG, GIF - tối đa 5MB)</p>
                            </div>

                            {/* Or URL Input */}
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-2">hoặc</span>
                                <input
                                    type="url"
                                    id="bannerUrl"
                                    name="bannerUrl"
                                    value={formData.bannerUrl}
                                    onChange={(e) => {
                                        handleChange(e);
                                        // Clear file if URL is entered
                                        if (e.target.value) {
                                            setFormData(prev => ({
                                                ...prev,
                                                bannerFile: undefined
                                            }));
                                            // Clear file error
                                            setErrors(prev => ({
                                                ...prev,
                                                banner: ''
                                            }));
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập URL ảnh"
                                />
                            </div>

                            {/* Preview */}
                            {(formData.bannerUrl || formData.bannerFile) && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ảnh hiện tại:
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        {formData.bannerUrl && (
                                            <img
                                                src={getImageUrl(formData.bannerUrl) || ''}
                                                alt="Banner preview"
                                                className="w-32 h-20 object-cover rounded-lg border"
                                            />
                                        )}
                                        {formData.bannerFile && (
                                            <img
                                                src={URL.createObjectURL(formData.bannerFile)}
                                                alt="New banner preview"
                                                className="w-32 h-20 object-cover rounded-lg border"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Banner Error */}
                            {errors.banner && (
                                <p className="text-red-500 text-sm mt-1">{errors.banner}</p>
                            )}
                        </div>
                    </div>

                    {/* Text Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                                Quyền lợi khi tham gia
                            </label>
                            <textarea
                                id="benefits"
                                name="benefits"
                                value={formData.benefits}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Chứng nhận, quà tặng, học bổng..."
                            />
                        </div>

                        <div>
                            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                                Yêu cầu tham gia
                            </label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Điều kiện, chuẩn bị cần thiết..."
                            />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                            Thông tin liên hệ hỗ trợ
                        </label>
                        <input
                            type="text"
                            id="contactInfo"
                            name="contactInfo"
                            value={formData.contactInfo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Email hoặc số điện thoại"
                        />
                    </div>

                    {/* Organizer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đơn vị tổ chức *
                        </label>
                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={organizerInput}
                                    onChange={handleOrganizerInputChange}
                                    placeholder="Nhập ID đơn vị (phân tách bằng dấu phẩy)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={addOrganizers}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Thêm
                                </button>
                            </div>

                            {/* Selected Organizers */}
                            {formData.organizerIds.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.organizerIds.map(id => {
                                        const dept = departments.find(d => d.id === id);
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                            >
                                                {dept ? dept.name : `ID: ${id}`}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOrganizer(id)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Available Departments */}
                            {departments.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-1">Danh sách đơn vị có sẵn:</p>
                                    <div className="text-xs text-gray-500">
                                        {departments.map(dept => (
                                            <span key={dept.id} className="mr-2">
                                                {dept.id}: {dept.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.organizerIds && <p className="text-red-500 text-sm mt-1">{errors.organizerIds}</p>}
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="requiresSubmission"
                                name="requiresSubmission"
                                checked={formData.requiresSubmission}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requiresSubmission" className="ml-2 block text-sm text-gray-900">
                                Yêu cầu nộp bài thu hoạch
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isImportant"
                                name="isImportant"
                                checked={formData.isImportant}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-900">
                                Sự kiện quan trọng
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="mandatoryForFacultyStudents"
                                name="mandatoryForFacultyStudents"
                                checked={formData.mandatoryForFacultyStudents}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="mandatoryForFacultyStudents" className="ml-2 block text-sm text-gray-900">
                                Bắt buộc cho sinh viên thuộc khoa
                            </label>
                        </div>
                    </div>

                    {/* Share Link */}
                    <div>
                        <label htmlFor="shareLink" className="block text-sm font-medium text-gray-700 mb-2">
                            Link chia sẻ
                        </label>
                        <input
                            type="url"
                            id="shareLink"
                            name="shareLink"
                            value={formData.shareLink}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/event-link"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isUploading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Đang upload ảnh...' : loading ? 'Đang tạo...' : 'Tạo sự kiện'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default EventForm;

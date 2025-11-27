import React, { useState, useEffect, ChangeEvent } from 'react';
import { CreateActivityRequest, ActivityType, ScoreType } from '../../types/activity';
import { uploadAPI } from '../../services/uploadAPI';
import { getImageUrl } from '../../utils/imageUtils';
import OrganizerSelector from './OrganizerSelector';

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
    const [formData, setFormData] = useState<CreateActivityRequest>(() => {
        // Ensure all values are defined to prevent controlled/uncontrolled input warnings
        const defaultData: CreateActivityRequest = {
            name: '',
            type: ActivityType.SUKIEN,
            scoreType: ScoreType.REN_LUYEN,
            description: '',
            startDate: '',
            endDate: '',
            requiresSubmission: false,
            maxPoints: '0',
            penaltyPointsIncomplete: '0',
            registrationStartDate: '',
            registrationDeadline: '',
            shareLink: '',
            isImportant: false,
            isDraft: true,
            bannerUrl: '',
            location: '',
            ticketQuantity: 0,
            benefits: '',
            requirements: '',
            contactInfo: '',
            requiresApproval: true,
            mandatoryForFacultyStudents: false,
            organizerIds: [],
        };

        // Merge with initialData, ensuring no undefined values
        return {
            ...defaultData,
            ...Object.fromEntries(
                Object.entries(initialData).map(([key, value]) => [
                    key,
                    value !== undefined ? value : defaultData[key as keyof CreateActivityRequest]
                ])
            )
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [originalBannerUrl, setOriginalBannerUrl] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [unlimitedTickets, setUnlimitedTickets] = useState(false);

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

    const handleUnlimitedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setUnlimitedTickets(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, ticketQuantity: undefined }));
        } else {
            setFormData(prev => ({ ...prev, ticketQuantity: 0 }));
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

        if (formData.requiresSubmission && (!formData.maxPoints || parseFloat(formData.maxPoints) <= 0)) {
            newErrors.maxPoints = 'Điểm tối đa phải lớn hơn 0 khi yêu cầu nộp bài';
        }

        if (!formData.organizerIds || formData.organizerIds.length === 0) {
            newErrors.organizerIds = 'Phải chọn ít nhất một đơn vị tổ chức';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isUploading, setIsUploading] = useState(false);

    // Update formData when initialData changes
    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            setFormData(prev => ({
                ...prev,
                ...Object.fromEntries(
                    Object.entries(initialData).map(([key, value]) => [
                        key,
                        value !== undefined ? value : prev[key as keyof CreateActivityRequest]
                    ])
                )
            }));
            // Store original banner URL for comparison
            if (initialData.bannerUrl) {
                setOriginalBannerUrl(initialData.bannerUrl);
                // Clear the bannerUrl field to avoid showing the upload path
                setFormData(prev => ({
                    ...prev,
                    bannerUrl: ''
                }));
            }
            // Set unlimitedTickets based on ticketQuantity value
            if (initialData.ticketQuantity === undefined || initialData.ticketQuantity === null) {
                setUnlimitedTickets(true);
            } else {
                setUnlimitedTickets(false);
            }
            // Mark initial load as complete after initialData is set
            setIsInitialLoad(false);
        } else {
            setIsInitialLoad(false);
        }
    }, [initialData]);


    // Auto-set ticketQuantity to undefined (unlimited) when isImportant or mandatoryForFacultyStudents is true
    // Only run after initial load to preserve values when editing
    useEffect(() => {
        if (isInitialLoad) return; // Don't run on initial load
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setUnlimitedTickets(true);
            setFormData(prev => ({
                ...prev,
                ticketQuantity: undefined
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    // Auto-set requiresApproval to false (auto-approve) when isImportant or mandatoryForFacultyStudents is true
    // Only run after initial load to preserve values when editing
    useEffect(() => {
        if (isInitialLoad) return; // Don't run on initial load
        if (formData.isImportant || formData.mandatoryForFacultyStudents) {
            setFormData(prev => ({
                ...prev,
                requiresApproval: false
            }));
        }
    }, [formData.isImportant, formData.mandatoryForFacultyStudents, isInitialLoad]);

    // Handle organizer change
    const handleOrganizerChange = (ids: number[]) => {
        setFormData(prev => ({
            ...prev,
            organizerIds: ids
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsUploading(true);

                // If there's a file to upload, upload it first
                if (formData.bannerFile) {

                    const uploadResponse = await uploadAPI.uploadImage(formData.bannerFile);

                    if (uploadResponse.status && uploadResponse.data) {

                        // Update formData with the uploaded image URL
                        const updatedFormData = {
                            ...formData,
                            bannerUrl: uploadResponse.data.bannerUrl,
                            bannerFile: undefined // Remove file reference
                        };


                        onSubmit(updatedFormData);
                    } else {
                        // Show upload error
                        setErrors(prev => ({
                            ...prev,
                            banner: uploadResponse.message || 'Upload ảnh thất bại'
                        }));
                        setIsUploading(false);
                        return;
                    }
                } else {
                    // No file to upload, submit directly
                    // Only include bannerUrl if it's different from original or if user entered a new URL
                    const submitData = {
                        ...formData,
                        bannerUrl: formData.bannerUrl || (originalBannerUrl && formData.bannerUrl === '' ? originalBannerUrl : undefined)
                    };
                    onSubmit(submitData);
                }
            } catch (error) {
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
                    <h2 className="text-2xl font-bold text-[#001C44]">{title}</h2>
                    <p className="text-gray-600 mt-1">Điền thông tin chi tiết về sự kiện</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-[#001C44] mb-2">
                                Tên sự kiện *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.name ? 'border-red-500' : 'border-gray-300'
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
                                type="datetime-local"
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
                                type="datetime-local"
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
                                type="datetime-local"
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
                                type="datetime-local"
                                id="registrationDeadline"
                                name="registrationDeadline"
                                value={formData.registrationDeadline}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Important/Mandatory Checkboxes - Must be before ticketQuantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="unlimitedTickets"
                                        name="unlimitedTickets"
                                        checked={unlimitedTickets}
                                        onChange={handleUnlimitedChange}
                                        disabled={formData.isImportant || formData.mandatoryForFacultyStudents}
                                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <label htmlFor="unlimitedTickets" className={`ml-2 block text-sm ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'text-gray-500' : 'text-gray-900'}`}>
                                        Không giới hạn số lượng
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    id="ticketQuantity"
                                    name="ticketQuantity"
                                    value={formData.ticketQuantity ?? ''}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={unlimitedTickets || formData.isImportant || formData.mandatoryForFacultyStudents}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(unlimitedTickets || formData.isImportant || formData.mandatoryForFacultyStudents) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Nhập số lượng vé"
                                />
                            </div>
                            {(formData.isImportant || formData.mandatoryForFacultyStudents) && (
                                <p className="text-xs text-gray-500 mt-1">Không giới hạn (sự kiện quan trọng/bắt buộc)</p>
                            )}
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
                            {(formData.bannerUrl || formData.bannerFile || originalBannerUrl) && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ảnh hiện tại:
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        {formData.bannerFile && (
                                            <img
                                                src={URL.createObjectURL(formData.bannerFile)}
                                                alt="New banner preview"
                                                className="w-32 h-20 object-cover rounded-lg border"
                                            />
                                        )}
                                        {formData.bannerUrl && !formData.bannerFile && (
                                            <img
                                                src={getImageUrl(formData.bannerUrl) || ''}
                                                alt="Banner preview"
                                                className="w-32 h-20 object-cover rounded-lg border"
                                            />
                                        )}
                                        {!formData.bannerUrl && !formData.bannerFile && originalBannerUrl && (
                                            <img
                                                src={getImageUrl(originalBannerUrl) || ''}
                                                alt="Current banner"
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
                    <OrganizerSelector
                        selectedIds={formData.organizerIds}
                        onChange={handleOrganizerChange}
                        error={errors.organizerIds}
                        required={true}
                    />

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isDraft"
                                name="isDraft"
                                checked={!!formData.isDraft}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isDraft" className="ml-2 block text-sm text-gray-900">
                                Lưu dưới dạng bản nháp (chưa công bố)
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="requiresApproval"
                                name="requiresApproval"
                                checked={!!formData.requiresApproval}
                                onChange={handleChange}
                                disabled={formData.isImportant || formData.mandatoryForFacultyStudents}
                                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label htmlFor="requiresApproval" className={`ml-2 block text-sm ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'text-gray-500' : 'text-gray-900'}`}>
                                Đăng ký cần duyệt (tắt để auto-approve)
                            </label>
                        </div>
                        {(formData.isImportant || formData.mandatoryForFacultyStudents) && (
                            <p className="text-xs text-gray-500 ml-6 -mt-2">Tự động duyệt cho sự kiện quan trọng/bắt buộc</p>
                        )}

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
                            className="px-6 py-2 bg-[#001C44] text-white rounded-md hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-[#001C44] disabled:opacity-50 disabled:cursor-not-allowed"
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

import React from 'react';
import BaseEventForm, { RenderFieldsProps } from './BaseEventForm';
import { StandardActivityCreateRequest, ActivityType } from '../../types/activity';
import { getImageUrl } from '../../utils/imageUtils';
import OrganizerSelector from './OrganizerSelector';

interface StandardActivityFormProps {
    onSubmit: (data: StandardActivityCreateRequest) => void;
    loading?: boolean;
    initialData?: Partial<StandardActivityCreateRequest>;
    title?: string;
    onCancel?: () => void;
    lockApprovalWhenImportant?: boolean;
    activeScoreEntryCount?: number;
}

const formatAmPmPreview = (value?: string | null) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const hour = String(hours12).padStart(2, '0');

    return `${day}/${month}/${year}, ${hour}:${minutes} ${period}`;
};

const renderStandardFields = (props: RenderFieldsProps<StandardActivityCreateRequest>) => {
    const {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        unlimitedTickets,
        handleUnlimitedChange,
        originalBannerUrl,
        lockApprovalWhenImportant,
        isScoreLocked
    } = props;

    const isApprovalLocked = lockApprovalWhenImportant && (!!formData.isImportant || !!formData.mandatoryForFacultyStudents);

    return (
        <>
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
                        value={formData.name || ''}
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
                        value={formData.type || ''}
                        onChange={handleChange}
                        disabled={isScoreLocked}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.type ? 'border-red-500' : 'border-gray-300'} ${isScoreLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                        <option value={ActivityType.SUKIEN}>Sự kiện</option>
                        <option value={ActivityType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                        <option value={ActivityType.CHUYEN_DE_DOANH_NGHIEP}>Chuyên đề doanh nghiệp</option>
                    </select>
                    {isScoreLocked && (
                        <p className="text-xs text-amber-600 mt-1">Đã có lượt tính điểm, không thể đổi loại sự kiện</p>
                    )}
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Địa điểm *
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location || ''}
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
                    value={formData.description || ''}
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
                        value={formData.startDate || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {formData.startDate && (
                        <p className="mt-1 text-xs text-gray-500">
                            {formatAmPmPreview(formData.startDate)}
                        </p>
                    )}
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
                        value={formData.endDate || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {formData.endDate && (
                        <p className="mt-1 text-xs text-gray-500">
                            {formatAmPmPreview(formData.endDate)}
                        </p>
                    )}
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
                        value={formData.registrationStartDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.registrationStartDate && (
                        <p className="mt-1 text-xs text-gray-500">
                            {formatAmPmPreview(formData.registrationStartDate)}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                        Hạn đăng ký
                    </label>
                    <input
                        type="datetime-local"
                        id="registrationDeadline"
                        name="registrationDeadline"
                        value={formData.registrationDeadline || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.registrationDeadline && (
                        <p className="mt-1 text-xs text-gray-500">
                            {formatAmPmPreview(formData.registrationDeadline)}
                        </p>
                    )}
                </div>
            </div>

            {/* Important/Mandatory Checkboxes - Must be before ticketQuantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isImportant"
                        name="isImportant"
                        checked={!!formData.isImportant}
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
                        checked={!!formData.mandatoryForFacultyStudents}
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
                                disabled={!!formData.isImportant || !!formData.mandatoryForFacultyStudents}
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
                            disabled={unlimitedTickets || !!formData.isImportant || !!formData.mandatoryForFacultyStudents}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(unlimitedTickets || formData.isImportant || formData.mandatoryForFacultyStudents) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập số lượng vé"
                        />
                    </div>
                    {(formData.isImportant || formData.mandatoryForFacultyStudents) && (
                        <p className="text-xs text-gray-500 mt-1">Không giới hạn (sự kiện quan trọng/bắt buộc)</p>
                    )}
                </div>
            </div>

            {/* Banner */}
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
                                    if (file.size > 5 * 1024 * 1024) {
                                        handleChange({
                                            ...e,
                                            target: { ...e.target, name: 'bannerFile', value: '' } as any
                                        });
                                        return;
                                    }
                                    if (!file.type.startsWith('image/')) {
                                        handleChange({
                                            ...e,
                                            target: { ...e.target, name: 'bannerFile', value: '' } as any
                                        });
                                        return;
                                    }
                                    handleChange({
                                        ...e,
                                        target: { ...e.target, name: 'bannerFile', value: file } as any
                                    });
                                    handleChange({
                                        ...e,
                                        target: { ...e.target, name: 'bannerUrl', value: '' } as any
                                    });
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
                            value={formData.bannerUrl || ''}
                            onChange={(e) => {
                                handleChange(e);
                                if (e.target.value) {
                                    handleChange({
                                        ...e,
                                        target: { ...e.target, name: 'bannerFile', value: undefined } as any
                                    });
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập URL ảnh"
                        />
                    </div>

                    {/* Preview */}
                    {(formData.bannerUrl || (formData as any).bannerFile || originalBannerUrl) && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ảnh hiện tại:
                            </label>
                            <div className="flex items-center space-x-4">
                                {(formData as any).bannerFile && (
                                    <img
                                        src={URL.createObjectURL((formData as any).bannerFile)}
                                        alt="New banner preview"
                                        className="w-32 h-20 object-cover rounded-lg border"
                                    />
                                )}
                                {formData.bannerUrl && !(formData as any).bannerFile && (
                                    <img
                                        src={getImageUrl(formData.bannerUrl) || ''}
                                        alt="Banner preview"
                                        className="w-32 h-20 object-cover rounded-lg border"
                                    />
                                )}
                                {!formData.bannerUrl && !(formData as any).bannerFile && originalBannerUrl && (
                                    <img
                                        src={getImageUrl(originalBannerUrl) || ''}
                                        alt="Current banner"
                                        className="w-32 h-20 object-cover rounded-lg border"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {errors.banner && (
                        <p className="text-red-500 text-sm mt-1">{errors.banner}</p>
                    )}
                </div>
            </div>

            {/* Requirements & Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                        Quyền lợi khi tham gia
                    </label>
                    <textarea
                        id="benefits"
                        name="benefits"
                        value={formData.benefits || ''}
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
                        value={formData.requirements || ''}
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
                    value={formData.contactInfo || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email hoặc số điện thoại"
                />
            </div>

            {/* Organizer Selection */}
            <OrganizerSelector
                selectedIds={formData.organizerIds || []}
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
                        disabled={isApprovalLocked}
                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isApprovalLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <label htmlFor="requiresApproval" className={`ml-2 block text-sm ${isApprovalLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                        Đăng ký cần duyệt (tắt để auto-approve)
                    </label>
                </div>
                {isApprovalLocked && (
                    <p className="text-xs text-gray-500 ml-6 -mt-2">Tự động duyệt cho sự kiện quan trọng/bắt buộc</p>
                )}

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="requiresSubmission"
                        name="requiresSubmission"
                        checked={!!formData.requiresSubmission}
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
                    value={formData.shareLink || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/event-link"
                />
            </div>
        </>
    );
};

const StandardActivityForm: React.FC<StandardActivityFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện mới",
    onCancel,
    lockApprovalWhenImportant = true,
    activeScoreEntryCount = 0
}) => {
    return (
        <BaseEventForm<StandardActivityCreateRequest>
            mode="normal"
            onSubmit={onSubmit}
            loading={loading}
            initialData={initialData}
            title={title}
            onCancel={onCancel}
            lockApprovalWhenImportant={lockApprovalWhenImportant}
            activeScoreEntryCount={activeScoreEntryCount}
            renderFields={renderStandardFields}
        />
    );
};

export default StandardActivityForm;

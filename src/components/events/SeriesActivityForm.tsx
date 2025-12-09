import React from 'react';
import BaseEventForm, { RenderFieldsProps } from './BaseEventForm';
import { CreateActivityRequest, ActivityType } from '../../types/activity';
import { CreateActivityInSeriesRequest } from '../../types/series';
import OrganizerSelector from './OrganizerSelector';
import { getImageUrl } from '../../utils/imageUtils';

interface SeriesActivityFormProps {
    onSubmit: (data: CreateActivityInSeriesRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityInSeriesRequest>;
    title?: string;
    onCancel?: () => void;
    isMinigame?: boolean;
}

const renderSeriesActivityFields = (props: RenderFieldsProps & { isMinigame?: boolean }) => {
    const {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        originalBannerUrl,
        isMinigame
    } = props;

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleChange({
                ...e,
                target: {
                    ...e.target,
                    name: 'bannerFile',
                    value: file
                } as any
            });
        }
    };

    return (
        <>
            {/* Info Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#001C44] p-4 rounded-lg mb-6 shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-[#001C44]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-[#001C44] font-medium">
                            <strong>Lưu ý:</strong> Sự kiện trong chuỗi sẽ tự động lấy các thông tin đăng ký, 
                            điểm số và số lượng vé từ chuỗi sự kiện. Bạn chỉ cần điền thông tin cơ bản bên dưới.
                            {props.isMinigame && (
                                <span className="block mt-2 text-[#FFD66D] font-semibold">
                                    🎮 Bạn đang tạo minigame. Sau khi tạo activity, bạn sẽ tiếp tục tạo quiz.
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

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
                    <label htmlFor="location" className="block text-sm font-medium text-[#001C44] mb-2">
                        Địa điểm
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.location ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Nhập địa điểm tổ chức"
                    />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                <div>
                    <label htmlFor="order" className="block text-sm font-medium text-[#001C44] mb-2">
                        Thứ tự trong chuỗi
                    </label>
                    <input
                        type="number"
                        id="order"
                        name="order"
                        value={(formData as any).order || ''}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleChange({
                                ...e,
                                target: {
                                    ...e.target,
                                    name: 'order',
                                    value: value.toString()
                                } as any
                            });
                        }}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Thứ tự hiển thị trong chuỗi sự kiện</p>
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#001C44] mb-2">
                    Mô tả sự kiện
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    placeholder="Mô tả chi tiết về sự kiện..."
                />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-[#001C44] mb-2">
                        Ngày bắt đầu
                    </label>
                    <input
                        type="datetime-local"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-[#001C44] mb-2">
                        Ngày kết thúc
                    </label>
                    <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>
            </div>

            {/* Share Link */}
            <div>
                <label htmlFor="shareLink" className="block text-sm font-medium text-[#001C44] mb-2">
                    Link chia sẻ
                </label>
                <input
                    type="url"
                    id="shareLink"
                    name="shareLink"
                    value={formData.shareLink || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    placeholder="https://example.com"
                />
            </div>

            {/* Banner Upload */}
            <div>
                <label htmlFor="banner" className="block text-sm font-medium text-[#001C44] mb-2">
                    Banner sự kiện
                </label>
                <input
                    type="file"
                    id="banner"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                />
                {(formData.bannerFile || formData.bannerUrl || originalBannerUrl) && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Xem trước:
                        </label>
                        <div className="flex items-center space-x-4">
                            {formData.bannerFile && (
                                <img
                                    src={URL.createObjectURL(formData.bannerFile)}
                                    alt="New banner preview"
                                    className="w-32 h-20 object-cover rounded-lg border shadow-sm"
                                />
                            )}
                            {formData.bannerUrl && !formData.bannerFile && (
                                <img
                                    src={getImageUrl(formData.bannerUrl) || ''}
                                    alt="Banner preview"
                                    className="w-32 h-20 object-cover rounded-lg border shadow-sm"
                                />
                            )}
                            {!formData.bannerUrl && !formData.bannerFile && originalBannerUrl && (
                                <img
                                    src={getImageUrl(originalBannerUrl) || ''}
                                    alt="Current banner"
                                    className="w-32 h-20 object-cover rounded-lg border shadow-sm"
                                />
                            )}
                        </div>
                    </div>
                )}
                {errors.banner && (
                    <p className="text-red-500 text-sm mt-1">{errors.banner}</p>
                )}
            </div>

            {/* Benefits and Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="benefits" className="block text-sm font-medium text-[#001C44] mb-2">
                        Lợi ích khi tham gia
                    </label>
                    <textarea
                        id="benefits"
                        name="benefits"
                        value={formData.benefits || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        placeholder="Chứng nhận, quà tặng, học bổng..."
                    />
                </div>

                <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-[#001C44] mb-2">
                        Yêu cầu tham gia
                    </label>
                    <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        placeholder="Điều kiện, chuẩn bị cần thiết..."
                    />
                </div>
            </div>

            {/* Contact Info */}
            <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-[#001C44] mb-2">
                    Thông tin liên hệ hỗ trợ
                </label>
                <input
                    type="text"
                    id="contactInfo"
                    name="contactInfo"
                    value={formData.contactInfo || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    placeholder="Email hoặc số điện thoại"
                />
            </div>

            {/* Organizer Selection */}
            <div>
                <OrganizerSelector
                    selectedIds={formData.organizerIds || []}
                    onChange={handleOrganizerChange}
                    error={errors.organizerIds}
                    required={false}
                />
            </div>
        </>
    );
};

const SeriesActivityForm: React.FC<SeriesActivityFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện trong chuỗi",
    onCancel,
    isMinigame = false
}) => {
    const handleSubmit = (data: CreateActivityRequest) => {
        // BaseEventForm already handles banner upload, so bannerUrl is already set
        // Convert to CreateActivityInSeriesRequest
        const seriesActivityData: CreateActivityInSeriesRequest = {
            name: data.name,
            description: data.description || undefined,
            startDate: data.startDate || undefined,
            endDate: data.endDate || undefined,
            location: data.location || undefined,
            order: (data as any).order || undefined,
            shareLink: data.shareLink || undefined,
            bannerUrl: data.bannerUrl || undefined,
            benefits: data.benefits || undefined,
            requirements: data.requirements || undefined,
            contactInfo: data.contactInfo || undefined,
            organizerIds: data.organizerIds && data.organizerIds.length > 0 ? data.organizerIds : undefined,
            // If creating minigame, add type field
            ...(isMinigame && { type: ActivityType.MINIGAME })
        };
        onSubmit(seriesActivityData);
    };

    // Process initial data - only include fields needed for series activity
    const processedInitialData: Partial<CreateActivityRequest> = {
        name: initialData.name || '',
        description: initialData.description || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        location: initialData.location || '',
        shareLink: initialData.shareLink || '',
        bannerUrl: initialData.bannerUrl || '',
        benefits: initialData.benefits || '',
        requirements: initialData.requirements || '',
        contactInfo: initialData.contactInfo || '',
        organizerIds: initialData.organizerIds || [],
        type: ActivityType.SUKIEN, // Default type, will be null in series
        scoreType: undefined, // From series
        maxPoints: undefined, // Not used in series
        penaltyPointsIncomplete: undefined,
        registrationStartDate: undefined, // From series
        registrationDeadline: undefined, // From series
        ticketQuantity: undefined, // From series
        requiresApproval: undefined, // From series
        ...(initialData.order && { order: initialData.order } as any)
    };

    return (
        <BaseEventForm
            mode="series"
            onSubmit={handleSubmit}
            loading={loading}
            initialData={processedInitialData}
            title={title}
            onCancel={onCancel}
            renderFields={(props) => renderSeriesActivityFields({ ...props, isMinigame })}
            inline={!title}
        />
    );
};

export default SeriesActivityForm;


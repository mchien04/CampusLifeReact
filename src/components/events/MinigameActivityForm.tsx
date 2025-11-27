import React from 'react';
import BaseEventForm, { RenderFieldsProps } from './BaseEventForm';
import { CreateActivityRequest, ActivityType, ScoreType } from '../../types/activity';
import { getImageUrl } from '../../utils/imageUtils';
import OrganizerSelector from './OrganizerSelector';

interface MinigameActivityFormProps {
    onSubmit: (data: CreateActivityRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityRequest>;
    title?: string;
    onCancel?: () => void;
}

const renderMinigameFields = (props: RenderFieldsProps) => {
    const {
        formData,
        errors,
        handleChange,
        handleOrganizerChange,
        unlimitedTickets,
        handleUnlimitedChange,
        originalBannerUrl
    } = props;

    return (
        <>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-[#001C44] mb-2">
                        Tên Mini Game *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Nhập tên mini game"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="scoreType" className="block text-sm font-medium text-[#001C44] mb-2">
                        Kiểu tính điểm
                    </label>
                    <select
                        id="scoreType"
                        name="scoreType"
                        value={formData.scoreType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    >
                        <option value={ScoreType.REN_LUYEN}>Điểm rèn luyện</option>
                        <option value={ScoreType.CONG_TAC_XA_HOI}>Điểm công tác xã hội</option>
                        <option value={ScoreType.CHUYEN_DE}>Điểm chuyên đề doanh nghiệp</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-[#001C44] mb-2">
                        Địa điểm *
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.location ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Nhập địa điểm (hoặc 'Online')"
                    />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#001C44] mb-2">
                    Mô tả Mini Game
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    placeholder="Mô tả chi tiết về mini game..."
                />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-[#001C44] mb-2">
                        Ngày bắt đầu *
                    </label>
                    <input
                        type="datetime-local"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-[#001C44] mb-2">
                        Ngày kết thúc *
                    </label>
                    <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>

                <div>
                    <label htmlFor="registrationStartDate" className="block text-sm font-medium text-[#001C44] mb-2">
                        Ngày mở đăng ký
                    </label>
                    <input
                        type="datetime-local"
                        id="registrationStartDate"
                        name="registrationStartDate"
                        value={formData.registrationStartDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    />
                </div>

                <div>
                    <label htmlFor="registrationDeadline" className="block text-sm font-medium text-[#001C44] mb-2">
                        Hạn đăng ký
                    </label>
                    <input
                        type="datetime-local"
                        id="registrationDeadline"
                        name="registrationDeadline"
                        value={formData.registrationDeadline}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                    />
                </div>
            </div>

            {/* Important Notice for Minigame */}
            <div className="bg-[#FFD66D] bg-opacity-20 border-l-4 border-[#FFD66D] p-4 rounded">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-[#001C44]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-[#001C44]">
                            <strong>Lưu ý:</strong> Điểm thưởng cho Mini Game sẽ được cấu hình khi tạo Quiz. 
                            Các trường "Điểm tối đa" và "Điểm trừ khi không hoàn thành" không áp dụng cho Mini Game.
                        </p>
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div>
                <label htmlFor="bannerUrl" className="block text-sm font-medium text-[#001C44] mb-2">
                    Banner Mini Game
                </label>
                <div className="space-y-2">
                    <div>
                        <input
                            type="file"
                            id="bannerFile"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                        return;
                                    }
                                    if (!file.type.startsWith('image/')) {
                                        return;
                                    }
                                    // This will be handled by BaseEventForm
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44]"
                        />
                        <p className="text-xs text-gray-500 mt-1">Chọn ảnh từ máy tính (JPG, PNG, GIF - tối đa 5MB)</p>
                    </div>
                    {(formData.bannerUrl || originalBannerUrl) && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-[#001C44] mb-2">
                                Ảnh hiện tại:
                            </label>
                            <img
                                src={getImageUrl(formData.bannerUrl || originalBannerUrl) || ''}
                                alt="Banner preview"
                                className="w-32 h-20 object-cover rounded-lg border"
                            />
                        </div>
                    )}
                </div>
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
                        className="h-4 w-4 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
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
                        className="h-4 w-4 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
                    />
                    <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-900">
                        Đăng ký cần duyệt (tắt để auto-approve)
                    </label>
                </div>
            </div>
        </>
    );
};

const MinigameActivityForm: React.FC<MinigameActivityFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo Mini Game",
    onCancel
}) => {
    // Ensure type is MINIGAME
    const processedInitialData = {
        ...initialData,
        type: ActivityType.MINIGAME,
        maxPoints: undefined,
        penaltyPointsIncomplete: undefined,
    };

    return (
        <BaseEventForm
            mode="minigame"
            onSubmit={onSubmit}
            loading={loading}
            initialData={processedInitialData}
            title={title}
            onCancel={onCancel}
            renderFields={renderMinigameFields}
        />
    );
};

export default MinigameActivityForm;


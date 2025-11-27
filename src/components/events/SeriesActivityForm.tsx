import React from 'react';
import BaseEventForm, { RenderFieldsProps } from './BaseEventForm';
import { CreateActivityRequest, ActivityType } from '../../types/activity';
import { CreateActivityInSeriesRequest } from '../../types/series';

interface SeriesActivityFormProps {
    onSubmit: (data: CreateActivityInSeriesRequest) => void;
    loading?: boolean;
    initialData?: Partial<CreateActivityInSeriesRequest>;
    title?: string;
    onCancel?: () => void;
}

const renderSeriesActivityFields = (props: RenderFieldsProps) => {
    const {
        formData,
        errors,
        handleChange
    } = props;

    return (
        <>
            {/* Info Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Lưu ý:</strong> Sự kiện trong chuỗi sẽ tự động lấy các thông tin đăng ký, 
                            điểm số và số lượng vé từ chuỗi sự kiện. Bạn chỉ cần điền thông tin cơ bản bên dưới.
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
                    value={formData.description}
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
            </div>
        </>
    );
};

const SeriesActivityForm: React.FC<SeriesActivityFormProps> = ({
    onSubmit,
    loading = false,
    initialData = {},
    title = "Tạo sự kiện trong chuỗi",
    onCancel
}) => {
    const handleSubmit = (data: CreateActivityRequest) => {
        // Convert to CreateActivityInSeriesRequest
        const seriesActivityData: CreateActivityInSeriesRequest = {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            location: data.location,
            order: (data as any).order || 1
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
        type: ActivityType.SUKIEN, // Default type, will be null in series
        scoreType: undefined, // From series
        maxPoints: undefined, // Not used in series
        penaltyPointsIncomplete: undefined,
        registrationStartDate: undefined, // From series
        registrationDeadline: undefined, // From series
        ticketQuantity: undefined, // From series
        requiresApproval: undefined, // From series
        organizerIds: [], // Not needed for series activity
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
            renderFields={renderSeriesActivityFields}
        />
    );
};

export default SeriesActivityForm;


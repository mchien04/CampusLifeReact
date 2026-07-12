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

const fieldClass = (hasError?: boolean) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-900/15 focus:border-primary-900 ${
        hasError ? 'border-rose-300' : 'border-gray-200'
    }`;

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label htmlFor="name" className={labelClass}>
                        Tên sự kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className={fieldClass(!!errors.name)}
                        placeholder="Nhập tên sự kiện"
                    />
                    {errors.name && <p className="text-rose-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="type" className={labelClass}>
                        Loại sự kiện
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type || ''}
                        onChange={handleChange}
                        disabled={isScoreLocked}
                        className={`${fieldClass(!!errors.type)} ${isScoreLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                        <option value={ActivityType.SUKIEN}>Sự kiện</option>
                        <option value={ActivityType.CONG_TAC_XA_HOI}>Công tác xã hội</option>
                        <option value={ActivityType.CHUYEN_DE_DOANH_NGHIEP}>Chuyên đề doanh nghiệp</option>
                    </select>
                    {isScoreLocked && (
                        <p className="text-xs text-amber-700 mt-1">Đã có lượt tính điểm, không thể đổi loại sự kiện</p>
                    )}
                    {errors.type && <p className="text-rose-600 text-sm mt-1">{errors.type}</p>}
                </div>

                <div>
                    <label htmlFor="location" className={labelClass}>
                        Địa điểm <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        className={fieldClass(!!errors.location)}
                        placeholder="Nhập địa điểm tổ chức"
                    />
                    {errors.location && <p className="text-rose-600 text-sm mt-1">{errors.location}</p>}
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className={labelClass}>
                    Mô tả sự kiện
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className={`${fieldClass()} resize-none`}
                    placeholder="Mô tả chi tiết về sự kiện..."
                />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="startDate" className={labelClass}>
                        Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleChange}
                        className={fieldClass(!!errors.startDate)}
                    />
                    {formData.startDate && (
                        <p className="mt-1 text-xs text-gray-500 tabular-nums">
                            {formatAmPmPreview(formData.startDate)}
                        </p>
                    )}
                    {errors.startDate && <p className="text-rose-600 text-sm mt-1">{errors.startDate}</p>}
                </div>

                <div>
                    <label htmlFor="endDate" className={labelClass}>
                        Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate || ''}
                        onChange={handleChange}
                        className={fieldClass(!!errors.endDate)}
                    />
                    {formData.endDate && (
                        <p className="mt-1 text-xs text-gray-500 tabular-nums">
                            {formatAmPmPreview(formData.endDate)}
                        </p>
                    )}
                    {errors.endDate && <p className="text-rose-600 text-sm mt-1">{errors.endDate}</p>}
                </div>

                <div>
                    <label htmlFor="registrationStartDate" className={labelClass}>
                        Ngày mở đăng ký
                    </label>
                    <input
                        type="datetime-local"
                        id="registrationStartDate"
                        name="registrationStartDate"
                        value={formData.registrationStartDate || ''}
                        onChange={handleChange}
                        className={fieldClass()}
                    />
                    {formData.registrationStartDate && (
                        <p className="mt-1 text-xs text-gray-500 tabular-nums">
                            {formatAmPmPreview(formData.registrationStartDate)}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="registrationDeadline" className={labelClass}>
                        Hạn đăng ký
                    </label>
                    <input
                        type="datetime-local"
                        id="registrationDeadline"
                        name="registrationDeadline"
                        value={formData.registrationDeadline || ''}
                        onChange={handleChange}
                        className={fieldClass()}
                    />
                    {formData.registrationDeadline && (
                        <p className="mt-1 text-xs text-gray-500 tabular-nums">
                            {formatAmPmPreview(formData.registrationDeadline)}
                        </p>
                    )}
                </div>
            </div>

            {/* Important/Mandatory Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isImportant"
                        name="isImportant"
                        checked={!!formData.isImportant}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-gray-900">Sự kiện quan trọng</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="mandatoryForFacultyStudents"
                        name="mandatoryForFacultyStudents"
                        checked={!!formData.mandatoryForFacultyStudents}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-gray-900">Bắt buộc cho sinh viên thuộc khoa</span>
                </label>
            </div>

            {/* Ticket quantity */}
            <div>
                <label htmlFor="ticketQuantity" className={labelClass}>
                    Số lượng vé / suất
                </label>
                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'text-gray-500' : 'text-gray-900'}`}>
                        <input
                            type="checkbox"
                            id="unlimitedTickets"
                            name="unlimitedTickets"
                            checked={unlimitedTickets}
                            onChange={handleUnlimitedChange}
                            disabled={!!formData.isImportant || !!formData.mandatoryForFacultyStudents}
                            className={`h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900 ${(formData.isImportant || formData.mandatoryForFacultyStudents) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        Không giới hạn số lượng
                    </label>
                    <input
                        type="number"
                        id="ticketQuantity"
                        name="ticketQuantity"
                        value={formData.ticketQuantity ?? ''}
                        onChange={handleChange}
                        min="0"
                        disabled={unlimitedTickets || !!formData.isImportant || !!formData.mandatoryForFacultyStudents}
                        className={`${fieldClass()} ${(unlimitedTickets || formData.isImportant || formData.mandatoryForFacultyStudents) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Nhập số lượng vé"
                    />
                </div>
                {(formData.isImportant || formData.mandatoryForFacultyStudents) && (
                    <p className="text-xs text-gray-500 mt-1">Không giới hạn (sự kiện quan trọng / bắt buộc)</p>
                )}
            </div>

            {/* Banner */}
            <div>
                <label htmlFor="bannerUrl" className={labelClass}>
                    Banner sự kiện
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
                            className={fieldClass()}
                        />
                        <p className="text-xs text-gray-500 mt-1">Chọn ảnh từ máy tính (JPG, PNG, GIF — tối đa 5MB)</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 shrink-0">hoặc</span>
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
                            className={`flex-1 ${fieldClass()}`}
                            placeholder="Nhập đường dẫn ảnh"
                        />
                    </div>

                    {(formData.bannerUrl || (formData as any).bannerFile || originalBannerUrl) && (
                        <div className="mt-3">
                            <p className={labelClass}>Xem trước</p>
                            <div className="flex items-center gap-3">
                                {(formData as any).bannerFile && (
                                    <img
                                        src={URL.createObjectURL((formData as any).bannerFile)}
                                        alt="Xem trước banner mới"
                                        className="h-20 w-32 rounded-xl border border-gray-200 object-cover"
                                    />
                                )}
                                {formData.bannerUrl && !(formData as any).bannerFile && (
                                    <img
                                        src={getImageUrl(formData.bannerUrl) || ''}
                                        alt="Xem trước banner"
                                        className="h-20 w-32 rounded-xl border border-gray-200 object-cover"
                                    />
                                )}
                                {!formData.bannerUrl && !(formData as any).bannerFile && originalBannerUrl && (
                                    <img
                                        src={getImageUrl(originalBannerUrl) || ''}
                                        alt="Banner hiện tại"
                                        className="h-20 w-32 rounded-xl border border-gray-200 object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {errors.banner && (
                        <p className="text-rose-600 text-sm mt-1">{errors.banner}</p>
                    )}
                </div>
            </div>

            {/* Requirements & Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="benefits" className={labelClass}>
                        Quyền lợi khi tham gia
                    </label>
                    <textarea
                        id="benefits"
                        name="benefits"
                        value={formData.benefits || ''}
                        onChange={handleChange}
                        rows={3}
                        className={`${fieldClass()} resize-none`}
                        placeholder="Chứng nhận, quà tặng, học bổng..."
                    />
                </div>

                <div>
                    <label htmlFor="requirements" className={labelClass}>
                        Yêu cầu tham gia
                    </label>
                    <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements || ''}
                        onChange={handleChange}
                        rows={3}
                        className={`${fieldClass()} resize-none`}
                        placeholder="Điều kiện, chuẩn bị cần thiết..."
                    />
                </div>
            </div>

            {/* Contact Info */}
            <div>
                <label htmlFor="contactInfo" className={labelClass}>
                    Thông tin liên hệ hỗ trợ
                </label>
                <input
                    type="text"
                    id="contactInfo"
                    name="contactInfo"
                    value={formData.contactInfo || ''}
                    onChange={handleChange}
                    className={fieldClass()}
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
            <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="isDraft"
                        name="isDraft"
                        checked={!!formData.isDraft}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-gray-900">Lưu dưới dạng bản nháp (chưa công bố)</span>
                </label>

                <div>
                    <label className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 ${isApprovalLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            id="requiresApproval"
                            name="requiresApproval"
                            checked={!!formData.requiresApproval}
                            onChange={handleChange}
                            disabled={isApprovalLocked}
                            className={`h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900 ${isApprovalLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <span className={`text-sm font-medium ${isApprovalLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                            Đăng ký cần duyệt (tắt để tự động duyệt)
                        </span>
                    </label>
                    {isApprovalLocked && (
                        <p className="text-xs text-gray-500 mt-1.5 ml-1">Tự động duyệt cho sự kiện quan trọng / bắt buộc</p>
                    )}
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        id="requiresSubmission"
                        name="requiresSubmission"
                        checked={!!formData.requiresSubmission}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-900"
                    />
                    <span className="text-sm font-medium text-gray-900">Yêu cầu nộp bài thu hoạch</span>
                </label>
            </div>

            {/* Share Link */}
            <div>
                <label htmlFor="shareLink" className={labelClass}>
                    Liên kết chia sẻ
                </label>
                <input
                    type="url"
                    id="shareLink"
                    name="shareLink"
                    value={formData.shareLink || ''}
                    onChange={handleChange}
                    className={fieldClass()}
                    placeholder="https://..."
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

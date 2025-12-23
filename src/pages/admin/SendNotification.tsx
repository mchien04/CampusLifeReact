import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { emailAPI, recipientService } from '../../services/emailAPI';
import { eventAPI } from '../../services/eventAPI';
import { seriesAPI } from '../../services/seriesAPI';
import { classAPI } from '../../services/classAPI';
import { departmentAPI } from '../../services/api';
import {
    SendNotificationOnlyRequest,
    RecipientType,
    NotificationType,
    getRecipientTypeLabel,
    getNotificationTypeLabel
} from '../../types/email';
import { ActivityResponse } from '../../types/activity';
import { SeriesResponse } from '../../types/series';
import { StudentClass } from '../../types/class';
import { Department } from '../../types/admin';
import { UserResponse } from '../../types/auth';
import { RecipientSelectorCard, RecipientPreviewCard, UserSelector } from '../../components/email';

const ACTION_URL_OPTIONS: Array<{
    value: string;
    label: string;
    requiresId?: boolean;
    idLabel?: string;
    placeholder?: string;
}> = [
        { value: '', label: 'Không chọn hành động' },
        { value: '/manager/dashboard', label: 'Dashboard quản lý' },
        { value: '/activities', label: 'Danh sách sự kiện' },
        { value: '/series', label: 'Danh sách chuỗi sự kiện' },
        { value: '/notifications', label: 'Trung tâm thông báo' },
        { value: '/activities/:id', label: 'Chi tiết sự kiện (nhập ID)', requiresId: true, idLabel: 'Activity ID', placeholder: 'VD: 10' },
        { value: '/series/:id', label: 'Chi tiết chuỗi sự kiện (nhập ID)', requiresId: true, idLabel: 'Series ID', placeholder: 'VD: 5' }
    ];

const SendNotification: React.FC = () => {
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState<SendNotificationOnlyRequest>({
        recipientType: RecipientType.BULK, // Mặc định là BULK (Người dùng)
        title: '',
        content: '',
        type: NotificationType.SYSTEM_ANNOUNCEMENT
    });
    
    // Dropdown data
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    
    // For BULK: search and pagination
    const [searchKeyword, setSearchKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    
    // Action URL
    const [actionUrlOption, setActionUrlOption] = useState<string>('');
    const [actionUrlParam, setActionUrlParam] = useState<string>('');

    const buildActionUrl = (optionValue: string, param: string) => {
        const option = ACTION_URL_OPTIONS.find(o => o.value === optionValue);
        if (!option) return '';
        if (option.requiresId) {
            if (!param?.trim()) return '';
            return option.value.replace(':id', param.trim());
        }
        return option.value;
    };
    
    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Preview data
    const [previewData, setPreviewData] = useState<{
        totalCount: number;
        previewList: Array<{ id: number; name: string; code?: string; email?: string }>;
    } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        loadDropdownData();
    }, []);

    // Load preview when activity/series/class/department is selected
    useEffect(() => {
        const loadPreview = async () => {
            if (formData.recipientType === RecipientType.ACTIVITY_REGISTRATIONS && formData.activityId) {
                setLoadingPreview(true);
                try {
                    const preview = await recipientService.previewActivityRecipients(formData.activityId);
                    setPreviewData(preview);
                } catch (error) {
                    console.error('Error loading preview:', error);
                    setPreviewData(null);
                } finally {
                    setLoadingPreview(false);
                }
            } else if (formData.recipientType === RecipientType.SERIES_REGISTRATIONS && formData.seriesId) {
                setLoadingPreview(true);
                try {
                    const preview = await recipientService.previewSeriesRecipients(formData.seriesId);
                    setPreviewData(preview);
                } catch (error) {
                    console.error('Error loading preview:', error);
                    setPreviewData(null);
                } finally {
                    setLoadingPreview(false);
                }
            } else if (formData.recipientType === RecipientType.BY_CLASS && formData.classId) {
                setLoadingPreview(true);
                try {
                    const preview = await recipientService.previewClassRecipients(formData.classId);
                    setPreviewData(preview);
                } catch (error) {
                    console.error('Error loading preview:', error);
                    setPreviewData(null);
                } finally {
                    setLoadingPreview(false);
                }
            } else if (formData.recipientType === RecipientType.BY_DEPARTMENT && formData.departmentId) {
                setLoadingPreview(true);
                try {
                    const preview = await recipientService.previewDepartmentRecipients(formData.departmentId);
                    setPreviewData(preview);
                } catch (error) {
                    console.error('Error loading preview:', error);
                    setPreviewData(null);
                } finally {
                    setLoadingPreview(false);
                }
            } else {
                setPreviewData(null);
            }
        };

        loadPreview();
    }, [formData.recipientType, formData.activityId, formData.seriesId, formData.classId, formData.departmentId]);

    const loadDropdownData = async () => {
        setLoadingDropdowns(true);
        try {
            // Load activities
            const activitiesRes = await eventAPI.getEvents();
            if (activitiesRes.status && activitiesRes.data) {
                setActivities(activitiesRes.data);
            }

            // Load series
            const seriesRes = await seriesAPI.getSeries();
            if (seriesRes.status && seriesRes.data) {
                setSeries(Array.isArray(seriesRes.data) ? seriesRes.data : []);
            }

            // Load classes
            const classesRes = await classAPI.getClasses();
            if (classesRes.content) {
                setClasses(classesRes.content);
            }

            // Load departments (public API)
            const deptRes = await departmentAPI.getAll();
            console.log('Departments response:', deptRes);
            if (deptRes.status && deptRes.data) {
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            } else {
                console.error('Failed to load departments:', deptRes.message);
                toast.warning('Không thể tải danh sách khoa: ' + (deptRes.message || 'Lỗi không xác định'));
            }

            // Load initial users (for BULK/INDIVIDUAL/CUSTOM_LIST)
            // Chỉ load nếu recipientType là BULK, INDIVIDUAL, hoặc CUSTOM_LIST
            if (formData.recipientType === RecipientType.INDIVIDUAL || 
                formData.recipientType === RecipientType.BULK || 
                formData.recipientType === RecipientType.CUSTOM_LIST) {
                await loadUsers(0, 20);
            }
        } catch (error) {
            console.error('Error loading dropdown data:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear errors
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Clear conditional fields when recipientType changes
        if (name === 'recipientType') {
            setFormData(prev => ({
                ...prev,
                recipientType: value as RecipientType,
                recipientIds: undefined,
                activityId: undefined,
                seriesId: undefined,
                classId: undefined,
                departmentId: undefined
            }));
            setSelectedUserIds(new Set());
            setSearchKeyword('');
            setCurrentPage(0);
            setPreviewData(null);
            if (value === RecipientType.INDIVIDUAL || value === RecipientType.BULK || value === RecipientType.CUSTOM_LIST) {
                loadUsers(0, 20);
            }
        }
    };

    const handleNumberChange = (name: string, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setFormData(prev => ({ ...prev, [name]: numValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        // Clear preview when changing selection
        setPreviewData(null);
    };

    const handleRecipientTypeSelect = (type: RecipientType) => {
        setFormData(prev => ({
            ...prev,
            recipientType: type,
            recipientIds: undefined,
            activityId: undefined,
            seriesId: undefined,
            classId: undefined,
            departmentId: undefined
        }));
        setSelectedUserIds(new Set());
        setSearchKeyword('');
        setCurrentPage(0);
        setPreviewData(null);
        // Reload users for new type
        if (type === RecipientType.INDIVIDUAL || type === RecipientType.BULK || type === RecipientType.CUSTOM_LIST) {
            loadUsers(0, 20);
        }
    };

    const loadUsers = async (page: number = 0, size: number = 20, keyword?: string, role?: string) => {
        setLoadingUsers(true);
        try {
            console.log('🔍 SendNotification.loadUsers - Calling with:', { page, size, keyword, role });
            const result = await recipientService.getAllUsers(
                page,
                size,
                keyword,
                role && role !== 'ALL' ? (role as 'ADMIN' | 'MANAGER' | 'STUDENT') : undefined
            );

            console.log('🔍 SendNotification.loadUsers - Result:', result);
            console.log('🔍 SendNotification.loadUsers - Result.content length:', result.content?.length);

            if (result.content && result.content.length > 0) {
                const mappedUsers = result.content.map(u => ({
                    ...u,
                    fullName: (u as any).fullName || u.username || u.email
                }));

                if (page === 0) {
                    setUsers(mappedUsers);
                } else {
                    setUsers(prev => [...prev, ...mappedUsers]);
                }
                setTotalUsers(result.totalElements);
                setCurrentPage(page);
                console.log('🔍 SendNotification.loadUsers - Successfully set users, count:', mappedUsers.length);
            } else {
                console.warn('🔍 SendNotification.loadUsers - No users found in result');
                if (page === 0) {
                    setUsers([]);
                }
                setTotalUsers(0);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách người dùng');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(0);
        loadUsers(0, 20, searchKeyword, roleFilter);
    };

    const handleLoadMore = () => {
        loadUsers(currentPage + 1, 20, searchKeyword, roleFilter);
    };

    const handleUserToggle = (userId: number) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            setFormData(prev => ({ ...prev, recipientIds: Array.from(newSet) }));
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allIds = new Set(users.map(u => u.id));
        setSelectedUserIds(allIds);
        setFormData(prev => ({ ...prev, recipientIds: Array.from(allIds) }));
    };

    const handleDeselectAll = () => {
        setSelectedUserIds(new Set());
        setFormData(prev => ({ ...prev, recipientIds: [] }));
    };

    const handleRoleFilterChange = (role: string) => {
        setRoleFilter(role);
        setCurrentPage(0);
        loadUsers(0, 20, searchKeyword, role);
    };


    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề thông báo là bắt buộc';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Nội dung thông báo là bắt buộc';
        }

        if (!formData.type) {
            newErrors.type = 'Loại thông báo là bắt buộc';
        }

        // Validate conditional fields
        switch (formData.recipientType) {
            case RecipientType.INDIVIDUAL:
            case RecipientType.BULK:
            case RecipientType.CUSTOM_LIST:
                if (!formData.recipientIds || formData.recipientIds.length === 0) {
                    newErrors.recipientIds = 'Vui lòng chọn ít nhất một người nhận';
                }
                break;
            case RecipientType.ACTIVITY_REGISTRATIONS:
                if (!formData.activityId) {
                    newErrors.activityId = 'Vui lòng chọn sự kiện';
                }
                break;
            case RecipientType.SERIES_REGISTRATIONS:
                if (!formData.seriesId) {
                    newErrors.seriesId = 'Vui lòng chọn chuỗi sự kiện';
                }
                break;
            case RecipientType.BY_CLASS:
                if (!formData.classId) {
                    newErrors.classId = 'Vui lòng chọn lớp';
                }
                break;
            case RecipientType.BY_DEPARTMENT:
                if (!formData.departmentId) {
                    newErrors.departmentId = 'Vui lòng chọn khoa';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Build request
        const request: SendNotificationOnlyRequest = { ...formData };

        // QUAN TRỌNG: Convert INDIVIDUAL và CUSTOM_LIST thành BULK vì backend chỉ hỗ trợ BULK
        // UI vẫn giữ INDIVIDUAL và CUSTOM_LIST để phân biệt UX (giới hạn số lượng, v.v.)
        const backendRecipientType = 
            formData.recipientType === RecipientType.INDIVIDUAL ||
            formData.recipientType === RecipientType.CUSTOM_LIST
                ? RecipientType.BULK
                : formData.recipientType;
        
        request.recipientType = backendRecipientType; // Convert sang BULK nếu là INDIVIDUAL hoặc CUSTOM_LIST

        // Nếu có activityId hoặc seriesId, backend sẽ tự động tạo actionUrl
        // Chỉ set actionUrl thủ công nếu không có activityId/seriesId
        if (!request.activityId && !request.seriesId) {
            const finalActionUrl = buildActionUrl(actionUrlOption, actionUrlParam);
            if (finalActionUrl) {
                request.actionUrl = finalActionUrl;
            }
        } else {
            // Nếu có activityId hoặc seriesId, không gửi actionUrl (backend tự tạo)
            delete request.actionUrl;
        }

        // Remove undefined fields
        Object.keys(request).forEach(key => {
            if (request[key as keyof SendNotificationOnlyRequest] === undefined) {
                delete request[key as keyof SendNotificationOnlyRequest];
            }
        });

        setSending(true);
        try {
            const response = await emailAPI.sendNotificationOnly(request);
            
            if (response.status && response.body) {
                const { totalRecipients, successCount, failedCount } = response.body;
                
                // Show success animation
                toast.success(
                    `Gửi thông báo thành công! Tổng: ${totalRecipients}, Thành công: ${successCount}, Thất bại: ${failedCount}`,
                    {
                        autoClose: 3000
                    }
                );
                
                // Reset form
                setFormData({
                    recipientType: RecipientType.BULK, // Mặc định là BULK (Người dùng)
                    title: '',
                    content: '',
                    type: NotificationType.SYSTEM_ANNOUNCEMENT
                });
                setErrors({});
                setSelectedUserIds(new Set());
                setPreviewData(null);
                setActionUrlOption('');
                setActionUrlParam('');
                
                // Navigate to history after delay
                setTimeout(() => {
                    navigate('/manager/emails/history');
                }, 2000);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
            }
        } catch (error: any) {
            console.error('Error sending notification:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi thông báo');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#001C44]">Gửi Thông báo</h1>
                <p className="text-gray-600 mt-1">Tạo thông báo hệ thống cho sinh viên (không gửi email)</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Recipient Type - Card Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Loại người nhận <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Card "Người dùng" - Gộp INDIVIDUAL và BULK */}
                            <button
                                type="button"
                                onClick={() => handleRecipientTypeSelect(RecipientType.BULK)}
                                className={`
                                    relative w-full p-4 rounded-lg border-2 transition-all duration-200
                                    ${(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST)
                                        ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                        : 'border-gray-200 hover:border-[#001C44] hover:bg-gray-50'
                                    }
                                    focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:ring-offset-2
                                `}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 ${(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST) ? 'text-[#001C44]' : 'text-gray-600'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-sm font-semibold ${(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST) ? 'text-[#001C44]' : 'text-gray-900'}`}>
                                                Người dùng
                                            </h3>
                                            {(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST) && (
                                                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#001C44] text-white text-xs">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        {selectedUserIds.size > 0 && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {selectedUserIds.size} người đã chọn
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Các card khác (bỏ INDIVIDUAL, BULK, CUSTOM_LIST) */}
                            {Object.values(RecipientType)
                                .filter(type => 
                                    type !== RecipientType.INDIVIDUAL && 
                                    type !== RecipientType.BULK && 
                                    type !== RecipientType.CUSTOM_LIST
                                )
                                .map(type => (
                                    <RecipientSelectorCard
                                        key={type}
                                        recipientType={type}
                                        isSelected={formData.recipientType === type}
                                        onSelect={handleRecipientTypeSelect}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Preview Card for Activity/Series/Class/Department */}
                    {previewData && (
                        <RecipientPreviewCard
                            recipientType={formData.recipientType}
                            totalCount={previewData.totalCount}
                            previewList={previewData.previewList}
                            isLoading={loadingPreview}
                        />
                    )}

                    {/* Người dùng: Gộp INDIVIDUAL, BULK, CUSTOM_LIST thành một UI */}
                    {(formData.recipientType === RecipientType.INDIVIDUAL || 
                      formData.recipientType === RecipientType.BULK || 
                      formData.recipientType === RecipientType.CUSTOM_LIST) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn người nhận <span className="text-red-500">*</span>
                            </label>
                            <UserSelector
                                users={users}
                                selectedIds={selectedUserIds}
                                onToggle={handleUserToggle}
                                onSelectAll={handleSelectAll}
                                onDeselectAll={handleDeselectAll}
                                searchKeyword={searchKeyword}
                                onSearchChange={setSearchKeyword}
                                onSearch={handleSearch}
                                onLoadMore={users.length < totalUsers ? handleLoadMore : undefined}
                                isLoading={loadingUsers}
                                hasMore={users.length < totalUsers}
                                showCount={true}
                                roleFilter={roleFilter}
                                onRoleFilterChange={handleRoleFilterChange}
                            />
                            {errors.recipientIds && (
                                <p className="mt-2 text-sm text-red-600">{errors.recipientIds}</p>
                            )}
                        </div>
                    )}

                    {formData.recipientType === RecipientType.ACTIVITY_REGISTRATIONS && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="activityId"
                                value={formData.activityId || ''}
                                onChange={(e) => handleNumberChange('activityId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent bg-white"
                            >
                                <option value="">-- Chọn sự kiện --</option>
                                {activities.map(activity => (
                                    <option key={activity.id} value={activity.id}>
                                        {activity.name}
                                    </option>
                                ))}
                            </select>
                            {errors.activityId && (
                                <p className="mt-1 text-sm text-red-600">{errors.activityId}</p>
                            )}
                        </div>
                    )}

                    {formData.recipientType === RecipientType.SERIES_REGISTRATIONS && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn chuỗi sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="seriesId"
                                value={formData.seriesId || ''}
                                onChange={(e) => handleNumberChange('seriesId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent bg-white"
                            >
                                <option value="">-- Chọn chuỗi sự kiện --</option>
                                {series.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            {errors.seriesId && (
                                <p className="mt-1 text-sm text-red-600">{errors.seriesId}</p>
                            )}
                        </div>
                    )}

                    {formData.recipientType === RecipientType.BY_CLASS && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="classId"
                                value={formData.classId || ''}
                                onChange={(e) => handleNumberChange('classId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent bg-white"
                            >
                                <option value="">-- Chọn lớp --</option>
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
                    )}

                    {formData.recipientType === RecipientType.BY_DEPARTMENT && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn khoa <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId || ''}
                                onChange={(e) => handleNumberChange('departmentId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent bg-white"
                            >
                                <option value="">-- Chọn khoa --</option>
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
                    )}

                    {/* Content Section */}
                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nội dung Thông báo</h2>
                        
                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề thông báo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                placeholder="Nhập tiêu đề thông báo"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nội dung thông báo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={8}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                placeholder="Nhập nội dung thông báo..."
                            />
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Sử dụng biến template: {'{{studentName}}'}, {'{{studentCode}}'}, {'{{email}}'}, etc.
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formData.content.length} ký tự
                                </p>
                            </div>
                            {errors.content && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.content}
                                </p>
                            )}

                            {/* Template helper */}
                            <div className="mt-3 border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Hướng dẫn biến template</p>
                                        <p className="text-xs text-gray-500">Chèn vào nội dung thông báo để tự động thay thế</p>
                                    </div>
                                    <span className="text-[11px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Tip</span>
                                </div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div className="space-y-1">
                                        <p><span className="font-semibold">{'{{studentName}}'}</span> - Tên sinh viên</p>
                                        <p><span className="font-semibold">{'{{studentCode}}'}</span> - Mã sinh viên</p>
                                        <p><span className="font-semibold">{'{{activityName}}'}</span> - Tên sự kiện (nếu có)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p><span className="font-semibold">{'{{seriesName}}'}</span> - Tên chuỗi sự kiện (nếu có)</p>
                                        <p><span className="font-semibold">{'{{email}}'}</span> - Email người nhận</p>
                                        <p className="text-gray-500">Các biến sẽ được thay thế tự động cho từng người nhận.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loại thông báo <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                        >
                            {Object.values(NotificationType).map(type => (
                                <option key={type} value={type}>
                                    {getNotificationTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                        )}
                    </div>

                    {/* Action URL - Chỉ hiển thị khi không có activityId/seriesId */}
                    {!formData.activityId && !formData.seriesId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL hành động (tùy chọn)
                            </label>
                            <div className="space-y-2">
                                <select
                                    value={actionUrlOption}
                                    onChange={(e) => {
                                        setActionUrlOption(e.target.value);
                                        if (!e.target.value) {
                                            setActionUrlParam('');
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                >
                                    {ACTION_URL_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption)?.requiresId && (
                                    <input
                                        type="text"
                                        value={actionUrlParam}
                                        onChange={(e) => setActionUrlParam(e.target.value)}
                                        placeholder={ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption)?.placeholder || 'Nhập ID'}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                    />
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                URL sẽ được tự động build từ lựa chọn trên. Ví dụ: chọn "Chi tiết sự kiện" và nhập ID "10" → "/activities/10"
                            </p>
                        </div>
                    )}
                    
                    {/* Thông báo khi đã chọn activity/series */}
                    {(formData.activityId || formData.seriesId) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        URL hành động sẽ được tự động tạo
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {formData.activityId 
                                            ? `URL sẽ trỏ đến chi tiết sự kiện #${formData.activityId}`
                                            : `URL sẽ trỏ đến chi tiết chuỗi sự kiện #${formData.seriesId}`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/emails/history')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        disabled={sending}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={sending || loadingDropdowns}
                        className="px-6 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {sending ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Đang gửi...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span>Gửi Thông báo</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendNotification;


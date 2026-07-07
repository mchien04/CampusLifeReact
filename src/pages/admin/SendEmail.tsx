import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { emailAPI, recipientService } from '../../services/emailAPI';
import { eventAPI } from '../../services/eventAPI';
import { seriesAPI } from '../../services/seriesAPI';
import { classAPI } from '../../services/classAPI';
import { departmentAPI } from '../../services/api';
import {
    SendEmailRequest,
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
import { ACTION_URL_OPTIONS, buildActionUrlFromOptions } from '../../utils/urlBuilder';
import { useAuth } from '../../contexts/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SendEmail: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isManager = user?.role === 'MANAGER';
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // Form data
    const [formData, setFormData] = useState<SendEmailRequest>({
        recipientType: RecipientType.BULK, // Mặc định là BULK (Người dùng)
        subject: '',
        content: '',
        isHtml: false,
        createNotification: false
    });

    // Dropdown data
    const [activities, setActivities] = useState<ActivityResponse[]>([]);
    const [series, setSeries] = useState<SeriesResponse[]>([]);
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // For INDIVIDUAL/BULK/CUSTOM_LIST: search and pagination
    const [searchKeyword, setSearchKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

    // Attachments
    const [attachments, setAttachments] = useState<File[]>([]);

    // Template variables
    const [templateVars, setTemplateVars] = useState<Array<{ key: string; value: string }>>([]);
    const [actionUrlOption, setActionUrlOption] = useState<string>('');
    const [actionUrlParam, setActionUrlParam] = useState<string>('');
    const [externalUrl, setExternalUrl] = useState<string>('');

    const isValidUrl = (url: string): boolean => {
        if (!url.trim()) return false;
        // Relative path (bắt đầu bằng /)
        if (url.startsWith('/')) return true;
        // External URL (bắt đầu bằng http:// hoặc https://)
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
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

            // Load initial users (for INDIVIDUAL/BULK/CUSTOM_LIST)
            await loadUsers(0, 20);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoadingDropdowns(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'createNotification') {
            if (checked && !actionUrlOption) {
                setActionUrlOption('/notifications');
            }
            setFormData(prev => {
                // Nếu có activityId hoặc seriesId, không set notificationActionUrl (backend tự tạo)
                const hasActivityOrSeries = prev.activityId || prev.seriesId;
                return {
                    ...prev,
                    createNotification: checked,
                    ...(checked
                        ? {
                            notificationActionUrl: hasActivityOrSeries 
                                ? undefined 
                                : (buildActionUrlFromOptions(actionUrlOption || '/notifications', actionUrlParam, externalUrl) || undefined)
                        }
                        : {
                            notificationTitle: undefined,
                            notificationType: undefined,
                            notificationActionUrl: undefined
                        })
                };
            });
            if (!checked) {
                setActionUrlParam('');
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

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
            // Reload users for new type
            if (value === RecipientType.INDIVIDUAL || value === RecipientType.BULK || value === RecipientType.CUSTOM_LIST) {
                loadUsers(0, 20);
            }
        }
    };

    const handleNumberChange = (name: string, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setFormData(prev => {
            const updated = { ...prev, [name]: numValue };
            // Nếu chọn activityId hoặc seriesId, clear notificationActionUrl (backend tự tạo)
            if ((name === 'activityId' || name === 'seriesId') && formData.createNotification) {
                updated.notificationActionUrl = undefined;
            }
            return updated;
        });
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
        // Reload users for new type
        if (type === RecipientType.INDIVIDUAL || type === RecipientType.BULK || type === RecipientType.CUSTOM_LIST) {
            loadUsers(0, 20);
        }
    };

    const loadUsers = async (page: number = 0, size: number = 20, keyword?: string, role?: string) => {
        setLoadingUsers(true);
        try {
            const result = await recipientService.getAllUsers(
                page,
                size,
                keyword,
                role && role !== 'ALL' ? (role as 'ADMIN' | 'MANAGER' | 'STUDENT') : undefined
            );

            const mappedUsers = result.content.map(u => ({
                ...u,
                fullName: (u as any).fullName || u.username || u.email
            }));

            if (formData.recipientType === RecipientType.INDIVIDUAL) {
                setUsers(mappedUsers);
            } else {
                setUsers(prev => (page === 0 ? mappedUsers : [...prev, ...mappedUsers]));
            }
            setTotalUsers(result.totalElements);
            setCurrentPage(page);
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

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        setCurrentPage(0);
        loadUsers(0, 20, searchKeyword, value);
    };

    const handleActionOptionChange = (value: string) => {
        setActionUrlOption(value);
        if (!value) {
            setActionUrlParam('');
            setExternalUrl('');
        }
        // Nếu có activityId hoặc seriesId, không set notificationActionUrl (backend tự tạo)
        if (formData.activityId || formData.seriesId) {
            setFormData(prev => ({ ...prev, notificationActionUrl: undefined }));
        } else {
            const url = buildActionUrlFromOptions(value, actionUrlParam, externalUrl);
            setFormData(prev => ({ ...prev, notificationActionUrl: url || undefined }));
        }
        if (errors.notificationActionUrl) {
            setErrors(prev => ({ ...prev, notificationActionUrl: '' }));
        }
        if (errors.externalUrl) {
            setErrors(prev => ({ ...prev, externalUrl: '' }));
        }
        if (errors.actionUrlParam) {
            setErrors(prev => ({ ...prev, actionUrlParam: '' }));
        }
    };

    const handleActionParamChange = (value: string) => {
        setActionUrlParam(value);
        // Nếu có activityId hoặc seriesId, không set notificationActionUrl (backend tự tạo)
        if (formData.activityId || formData.seriesId) {
            setFormData(prev => ({ ...prev, notificationActionUrl: undefined }));
        } else {
            const url = buildActionUrlFromOptions(actionUrlOption, value, externalUrl);
            setFormData(prev => ({ ...prev, notificationActionUrl: url || undefined }));
        }
        if (errors.notificationActionUrl) {
            setErrors(prev => ({ ...prev, notificationActionUrl: '' }));
        }
        if (errors.actionUrlParam) {
            setErrors(prev => ({ ...prev, actionUrlParam: '' }));
        }
    };

    const handleExternalUrlChange = (value: string) => {
        setExternalUrl(value);
        // Nếu có activityId hoặc seriesId, không set notificationActionUrl (backend tự tạo)
        if (formData.activityId || formData.seriesId) {
            setFormData(prev => ({ ...prev, notificationActionUrl: undefined }));
        } else {
            const url = buildActionUrlFromOptions(actionUrlOption, actionUrlParam, value);
            setFormData(prev => ({ ...prev, notificationActionUrl: url || undefined }));
        }
        if (errors.notificationActionUrl) {
            setErrors(prev => ({ ...prev, notificationActionUrl: '' }));
        }
        if (errors.externalUrl) {
            setErrors(prev => ({ ...prev, externalUrl: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validate file sizes
        const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            toast.error(`Một số file vượt quá 10MB: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setAttachments(files);
    };

    const handleRemoveFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddTemplateVar = () => {
        setTemplateVars(prev => [...prev, { key: '', value: '' }]);
    };

    const handleTemplateVarChange = (index: number, field: 'key' | 'value', value: string) => {
        setTemplateVars(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveTemplateVar = (index: number) => {
        setTemplateVars(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.subject.trim()) {
            newErrors.subject = 'Tiêu đề email là bắt buộc';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Nội dung email là bắt buộc';
        }

        // Validate conditional fields based on recipientType
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

        // Validate notification fields if createNotification is true
        if (formData.createNotification) {
            if (!formData.notificationTitle?.trim()) {
                newErrors.notificationTitle = 'Tiêu đề thông báo là bắt buộc';
            }
            if (!formData.notificationType) {
                newErrors.notificationType = 'Loại thông báo là bắt buộc';
            }
            // Chỉ validate actionUrl nếu không có activityId/seriesId (backend tự tạo URL khi có activityId/seriesId)
            if (!formData.activityId && !formData.seriesId && actionUrlOption) {
                if (actionUrlOption === 'EXTERNAL') {
                    if (!externalUrl.trim()) {
                        newErrors.externalUrl = 'Vui lòng nhập URL';
                    } else if (!isValidUrl(externalUrl)) {
                        newErrors.externalUrl = 'URL không hợp lệ. Vui lòng nhập URL đầy đủ (http:// hoặc https://) hoặc đường dẫn tương đối (bắt đầu bằng /)';
                    }
                } else {
                    const selectedAction = ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption);
                    if (selectedAction?.requiresId && !actionUrlParam.trim()) {
                        newErrors.actionUrlParam = 'Vui lòng nhập ID cho URL hành động';
                    }
                }
            }
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
        // QUAN TRỌNG: Convert INDIVIDUAL và CUSTOM_LIST thành BULK vì backend chỉ hỗ trợ BULK
        // UI vẫn giữ INDIVIDUAL và CUSTOM_LIST để phân biệt UX (giới hạn số lượng, v.v.)
        const backendRecipientType =
            formData.recipientType === RecipientType.INDIVIDUAL ||
                formData.recipientType === RecipientType.CUSTOM_LIST
                ? RecipientType.BULK
                : formData.recipientType;

        const request: SendEmailRequest = {
            ...formData,
            recipientType: backendRecipientType, // Convert sang BULK nếu là INDIVIDUAL hoặc CUSTOM_LIST
            templateVariables: templateVars.length > 0
                ? templateVars.reduce((acc, item) => {
                    if (item.key && item.value) {
                        acc[item.key] = item.value;
                    }
                    return acc;
                }, {} as Record<string, string>)
                : undefined
        };

        // Nếu có activityId hoặc seriesId, không gửi notificationActionUrl (backend tự tạo)
        if (request.activityId || request.seriesId) {
            delete request.notificationActionUrl;
        }

        // Remove undefined fields
        Object.keys(request).forEach(key => {
            if (request[key as keyof SendEmailRequest] === undefined) {
                delete request[key as keyof SendEmailRequest];
            }
        });

        setSending(true);
        try {
            // Tự động chọn endpoint: JSON nếu không có attachments, multipart nếu có
            const hasAttachments = attachments.length > 0;
            const response = hasAttachments
                ? await emailAPI.sendEmail(request, attachments)
                : await emailAPI.sendEmailJson(request);

            if (response.status && response.body) {
                const { totalRecipients, successCount, failedCount } = response.body;

                // Show success animation
                toast.success(
                    `Gửi email thành công! Tổng: ${totalRecipients}, Thành công: ${successCount}, Thất bại: ${failedCount}`,
                    {
                        autoClose: 3000
                    }
                );

                // Reset form
                setFormData({
                    recipientType: RecipientType.BULK, // Mặc định là BULK (Người dùng)
                    subject: '',
                    content: '',
                    isHtml: false,
                    createNotification: false
                });
                setAttachments([]);
                setTemplateVars([]);
                setErrors({});
                setSelectedUserIds(new Set());
                setActionUrlOption('');
                setActionUrlParam('');
                setExternalUrl('');
                setPreviewData(null);

                // Navigate to history after delay
                setTimeout(() => {
                    navigate('/manager/emails/history');
                }, 2000);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi email');
            }
        } catch (error: any) {
            console.error('Error sending email:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi gửi email');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center">
                    <span className="mr-3 text-4xl">📧</span>
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Gửi Email</h1>
                        <p className="text-gray-200 text-lg">Gửi email cho người dùng với nhiều tùy chọn người nhận</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Recipient Type - Card Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            Loại người nhận <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card "Người dùng" - Gộp INDIVIDUAL và BULK */}
                            <button
                                type="button"
                                onClick={() => handleRecipientTypeSelect(RecipientType.BULK)}
                                className={`
                                    relative w-full p-5 rounded-lg border-2 transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105
                                    ${(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST)
                                        ? 'border-[#001C44] bg-gradient-to-br from-[#001C44] to-[#002A66] shadow-lg'
                                        : 'border-gray-200 hover:border-[#001C44] hover:bg-gray-50'
                                    }
                                    focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:ring-offset-2
                                `}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            (formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST)
                                                ? 'bg-white bg-opacity-20 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-sm font-semibold ${
                                                (formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST)
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}>
                                                Người dùng
                                            </h3>
                                            {(formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST) && (
                                                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-30 text-white text-xs shadow-md">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        {selectedUserIds.size > 0 && (
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
                                                    (formData.recipientType === RecipientType.INDIVIDUAL || formData.recipientType === RecipientType.BULK || formData.recipientType === RecipientType.CUSTOM_LIST)
                                                        ? 'bg-white bg-opacity-30 text-white'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
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
                                    type !== RecipientType.CUSTOM_LIST &&
                                    !(isManager && type === RecipientType.ALL_STUDENTS)
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
                            <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-md">
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
                        <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-md">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="activityId"
                                value={formData.activityId || ''}
                                onChange={(e) => handleNumberChange('activityId', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
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
                        <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-md">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn chuỗi sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="seriesId"
                                value={formData.seriesId || ''}
                                onChange={(e) => handleNumberChange('seriesId', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
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
                        <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-md">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="classId"
                                value={formData.classId || ''}
                                onChange={(e) => handleNumberChange('classId', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
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
                        <div className="bg-white border border-gray-100 p-5 rounded-lg shadow-md">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn khoa <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId || ''}
                                onChange={(e) => handleNumberChange('departmentId', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
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
                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-semibold text-[#001C44] mb-5 flex items-center">
                            <span className="mr-2 text-2xl">✉️</span>
                            Nội dung Email
                        </h2>

                        {/* Subject */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu đề email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                placeholder="Nhập tiêu đề email"
                            />
                            {errors.subject && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.subject}
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nội dung email <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={10}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] font-mono text-sm transition-all"
                                placeholder="Nhập nội dung email..."
                            />
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Sử dụng biến template: {'{{studentName}}'}, {'{{studentCode}}'}, {'{{activityName}}'}, etc.
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
                            <div className="mt-3 border-2 border-dashed border-blue-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Hướng dẫn biến template</p>
                                        <p className="text-xs text-gray-600 mt-1">Chèn vào nội dung email để tự động thay thế</p>
                                    </div>
                                    <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-medium shadow-sm">💡 Tip</span>
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
                                        <p className="text-gray-500">Có thể thêm biến tuỳ chọn ở mục “Biến template” phía dưới.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-semibold text-[#001C44] mb-5 flex items-center">
                            <span className="mr-2 text-2xl">⚙️</span>
                            Tùy chọn
                        </h2>

                        {/* HTML Toggle */}
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                name="isHtml"
                                checked={formData.isHtml || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                                Nội dung HTML
                            </label>
                        </div>

                        {/* Template Variables */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Biến template (tùy chọn)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddTemplateVar}
                                    className="text-sm text-[#001C44] hover:text-[#002A66] font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    + Thêm biến
                                </button>
                            </div>
                            {templateVars.map((item, index) => (
                                <div key={index} className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Tên biến"
                                        value={item.key}
                                        onChange={(e) => handleTemplateVarChange(index, 'key', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Giá trị"
                                        value={item.value}
                                        onChange={(e) => handleTemplateVarChange(index, 'value', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTemplateVar(index)}
                                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Attachments */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                File đính kèm (tối đa 10MB mỗi file)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#001C44] hover:bg-gray-50 transition-all duration-200">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#001C44] file:text-white hover:file:bg-[#002A66] cursor-pointer"
                                />
                            </div>
                            {attachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Create Notification */}
                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-semibold text-[#001C44] mb-4 flex items-center">
                            <span className="mr-2 text-2xl">🔔</span>
                            Tạo thông báo hệ thống
                        </h2>
                        <div className="flex items-center mb-5">
                            <input
                                type="checkbox"
                                name="createNotification"
                                checked={formData.createNotification || false}
                                onChange={handleChange}
                                className="h-5 w-5 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
                            />
                            <label className="ml-3 text-sm font-medium text-gray-700">
                                Tạo thông báo hệ thống khi gửi email
                            </label>
                        </div>

                        {formData.createNotification && (
                            <div className="ml-6 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề thông báo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="notificationTitle"
                                        value={formData.notificationTitle || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
                                        placeholder="Nhập tiêu đề thông báo"
                                    />
                                    {errors.notificationTitle && (
                                        <p className="mt-1 text-sm text-red-600">{errors.notificationTitle}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại thông báo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="notificationType"
                                        value={formData.notificationType || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
                                    >
                                        <option value="">-- Chọn loại --</option>
                                        {Object.values(NotificationType).map(type => (
                                            <option key={type} value={type}>
                                                {getNotificationTypeLabel(type)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.notificationType && (
                                        <p className="mt-1 text-sm text-red-600">{errors.notificationType}</p>
                                    )}
                                </div>

                                {/* Action URL - Chỉ hiển thị khi không có activityId/seriesId */}
                                {!formData.activityId && !formData.seriesId ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL hành động (chọn sẵn)
                                        </label>
                                        <div className="space-y-2">
                                            <select
                                                value={actionUrlOption}
                                                onChange={(e) => handleActionOptionChange(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] bg-white transition-all"
                                            >
                                                {ACTION_URL_OPTIONS.map(opt => (
                                                    <option key={opt.value || 'none'} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption)?.requiresId && (
                                                actionUrlOption === '/activities/:id' ? (
                                                    <select
                                                        value={actionUrlParam}
                                                        onChange={(e) => handleActionParamChange(e.target.value)}
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${
                                                            errors.actionUrlParam ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <option value="">-- Chọn sự kiện --</option>
                                                        {activities.map(activity => (
                                                            <option key={activity.id} value={activity.id.toString()}>
                                                                {activity.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : actionUrlOption === '/series/:id' ? (
                                                    <select
                                                        value={actionUrlParam}
                                                        onChange={(e) => handleActionParamChange(e.target.value)}
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${
                                                            errors.actionUrlParam ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <option value="">-- Chọn chuỗi sự kiện --</option>
                                                        {series.map(s => (
                                                            <option key={s.id} value={s.id.toString()}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={actionUrlParam}
                                                        onChange={(e) => handleActionParamChange(e.target.value)}
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${
                                                            errors.actionUrlParam ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                        placeholder={ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption)?.placeholder || 'Nhập ID'}
                                                    />
                                                )
                                            )}

                                            {ACTION_URL_OPTIONS.find(o => o.value === actionUrlOption)?.isExternal && (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={externalUrl}
                                                        onChange={(e) => handleExternalUrlChange(e.target.value)}
                                                        placeholder="VD: https://example.com hoặc /student/events/123"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44] transition-all ${
                                                            errors.externalUrl ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                                        }`}
                                                    />
                                                    {errors.externalUrl && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.externalUrl}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.actionUrlParam && (
                                            <p className="mt-1 text-sm text-red-600">{errors.actionUrlParam}</p>
                                        )}
                                        {errors.notificationActionUrl && (
                                            <p className="mt-1 text-sm text-red-600">{errors.notificationActionUrl}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            {actionUrlOption === 'EXTERNAL' 
                                                ? 'Nhập URL đầy đủ (http:// hoặc https://) hoặc đường dẫn tương đối (bắt đầu bằng /). Ví dụ: https://example.com hoặc /student/events/123'
                                                : 'Hệ thống sẽ tự build URL, không cần nhập tay.'
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mr-3 shadow-sm">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-blue-900">
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
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/emails/history')}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200 font-medium"
                        disabled={sending}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={sending || loadingDropdowns}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#001C44] to-[#002A66] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-md"
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Gửi Email</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendEmail;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { emailAPI, recipientService } from '../../services/emailAPI';
import { eventAPI } from '../../services/eventAPI';
import { seriesAPI } from '../../services/seriesAPI';
import { classAPI } from '../../services/classAPI';
import { departmentAPI } from '../../services/adminAPI';
import { studentAPI } from '../../services/studentAPI';
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
import { StudentResponse } from '../../types/student';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SendEmail: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState<SendEmailRequest>({
        recipientType: RecipientType.INDIVIDUAL,
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
    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    
    // For BULK/CUSTOM_LIST: search and pagination
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    
    // Attachments
    const [attachments, setAttachments] = useState<File[]>([]);
    
    // Template variables
    const [templateVars, setTemplateVars] = useState<Array<{ key: string; value: string }>>([]);
    
    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadDropdownData();
    }, []);

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

            // Load departments
            const deptRes = await departmentAPI.getDepartments();
            console.log('Departments response:', deptRes);
            if (deptRes.status && deptRes.data) {
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            } else {
                console.error('Failed to load departments:', deptRes.message);
                toast.warning('Không thể tải danh sách khoa: ' + (deptRes.message || 'Lỗi không xác định'));
            }

            // Load initial students (for INDIVIDUAL)
            await loadStudents(0, 20);
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

        if (type === 'checkbox') {
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
            setSelectedStudentIds(new Set());
            setSearchKeyword('');
            setCurrentPage(0);
            // Reload students for new type
            if (value === RecipientType.INDIVIDUAL || value === RecipientType.BULK || value === RecipientType.CUSTOM_LIST) {
                loadStudents(0, 20);
            }
        }
    };

    const handleNumberChange = (name: string, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setFormData(prev => ({ ...prev, [name]: numValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const loadStudents = async (page: number = 0, size: number = 20, keyword?: string) => {
        setLoadingStudents(true);
        try {
            const result = await recipientService.getAllStudents(page, size, keyword);
            if (formData.recipientType === RecipientType.INDIVIDUAL) {
                // For INDIVIDUAL, just set the list
                setStudents(result.content);
            } else {
                // For BULK/CUSTOM_LIST, append to existing list
                setStudents(prev => page === 0 ? result.content : [...prev, ...result.content]);
            }
            setTotalStudents(result.totalElements);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading students:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách sinh viên');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(0);
        loadStudents(0, 20, searchKeyword);
    };

    const handleLoadMore = () => {
        loadStudents(currentPage + 1, 20, searchKeyword);
    };

    const handleStudentToggle = (studentId: number) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                // For INDIVIDUAL, limit to 10
                if (formData.recipientType === RecipientType.INDIVIDUAL && newSet.size >= 10) {
                    toast.warning('Chỉ có thể chọn tối đa 10 người cho loại INDIVIDUAL');
                    return prev;
                }
                newSet.add(studentId);
            }
            // Update formData
            setFormData(prev => ({ ...prev, recipientIds: Array.from(newSet) }));
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allIds = new Set(students.map(s => s.id));
        setSelectedStudentIds(allIds);
        setFormData(prev => ({ ...prev, recipientIds: Array.from(allIds) }));
    };

    const handleDeselectAll = () => {
        setSelectedStudentIds(new Set());
        setFormData(prev => ({ ...prev, recipientIds: [] }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
        setFormData(prev => ({ ...prev, recipientIds: selectedOptions }));
        setSelectedStudentIds(new Set(selectedOptions));
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
                if (!formData.recipientIds || formData.recipientIds.length === 0) {
                    newErrors.recipientIds = 'Vui lòng chọn ít nhất một người nhận';
                } else if (formData.recipientIds.length > 10) {
                    newErrors.recipientIds = 'INDIVIDUAL chỉ cho phép chọn tối đa 10 người';
                }
                break;
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
        const request: SendEmailRequest = {
            ...formData,
            templateVariables: templateVars.length > 0
                ? templateVars.reduce((acc, item) => {
                    if (item.key && item.value) {
                        acc[item.key] = item.value;
                    }
                    return acc;
                }, {} as Record<string, string>)
                : undefined
        };

        // Remove undefined fields
        Object.keys(request).forEach(key => {
            if (request[key as keyof SendEmailRequest] === undefined) {
                delete request[key as keyof SendEmailRequest];
            }
        });

        setSending(true);
        try {
            const response = await emailAPI.sendEmail(request, attachments.length > 0 ? attachments : undefined);
            
            if (response.status && response.body) {
                const { totalRecipients, successCount, failedCount } = response.body;
                toast.success(
                    `Gửi email thành công! Tổng: ${totalRecipients}, Thành công: ${successCount}, Thất bại: ${failedCount}`
                );
                
                // Reset form
                setFormData({
                    recipientType: RecipientType.INDIVIDUAL,
                    subject: '',
                    content: '',
                    isHtml: false,
                    createNotification: false
                });
                setAttachments([]);
                setTemplateVars([]);
                setErrors({});
                
                // Navigate to history
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
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#001C44]">Gửi Email</h1>
                <p className="text-gray-600 mt-1">Gửi email cho sinh viên với nhiều tùy chọn người nhận</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Recipient Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loại người nhận <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="recipientType"
                            value={formData.recipientType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                        >
                            {Object.values(RecipientType).map(type => (
                                <option key={type} value={type}>
                                    {getRecipientTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* INDIVIDUAL: Simple dropdown/autocomplete for 1-10 people */}
                    {formData.recipientType === RecipientType.INDIVIDUAL && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn người nhận (tối đa 10 người) <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={loadingStudents}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    >
                                        🔍 Tìm
                                    </button>
                                </div>
                                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                                    {loadingStudents ? (
                                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                                    ) : students.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">Không tìm thấy sinh viên nào</div>
                                    ) : (
                                        students.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => handleStudentToggle(student.id)}
                                                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedStudentIds.has(student.id) ? 'bg-[#001C44] bg-opacity-10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{student.studentCode}</span>
                                                        <span className="ml-2 text-gray-600">{student.fullName}</span>
                                                    </div>
                                                    {selectedStudentIds.has(student.id) && (
                                                        <span className="text-[#001C44]">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {selectedStudentIds.size > 0 && (
                                    <div className="text-sm text-gray-600">
                                        Đã chọn: <strong>{selectedStudentIds.size}</strong> người
                                        {formData.recipientType === RecipientType.INDIVIDUAL && selectedStudentIds.size >= 10 && (
                                            <span className="text-orange-600 ml-2">(Đã đạt giới hạn)</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.recipientIds && (
                                <p className="mt-1 text-sm text-red-600">{errors.recipientIds}</p>
                            )}
                        </div>
                    )}

                    {/* BULK: Multi-select with search, filter, import file */}
                    {formData.recipientType === RecipientType.BULK && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn người nhận (có thể chọn nhiều) <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={loadingStudents}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    >
                                        🔍 Tìm
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                </div>
                                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                                    {loadingStudents ? (
                                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                                    ) : students.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">Không tìm thấy sinh viên nào</div>
                                    ) : (
                                        students.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => handleStudentToggle(student.id)}
                                                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedStudentIds.has(student.id) ? 'bg-[#001C44] bg-opacity-10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{student.studentCode}</span>
                                                        <span className="ml-2 text-gray-600">{student.fullName}</span>
                                                    </div>
                                                    {selectedStudentIds.has(student.id) && (
                                                        <span className="text-[#001C44]">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {students.length > 0 && students.length < totalStudents && (
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={loadingStudents}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {loadingStudents ? 'Đang tải...' : `Tải thêm (${totalStudents - students.length} còn lại)`}
                                    </button>
                                )}
                                {selectedStudentIds.size > 0 && (
                                    <div className="text-sm text-gray-600">
                                        Đã chọn: <strong>{selectedStudentIds.size}</strong> người
                                    </div>
                                )}
                            </div>
                            {errors.recipientIds && (
                                <p className="mt-1 text-sm text-red-600">{errors.recipientIds}</p>
                            )}
                        </div>
                    )}

                    {/* CUSTOM_LIST: Similar to BULK but with save/load functionality */}
                    {formData.recipientType === RecipientType.CUSTOM_LIST && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Danh sách tùy chọn <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={loadingStudents}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    >
                                        🔍 Tìm
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // TODO: Implement save list functionality
                                            toast.info('Tính năng lưu danh sách sẽ được thêm sau');
                                        }}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                        💾 Lưu danh sách
                                    </button>
                                </div>
                                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                                    {loadingStudents ? (
                                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                                    ) : students.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">Không tìm thấy sinh viên nào</div>
                                    ) : (
                                        students.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => handleStudentToggle(student.id)}
                                                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedStudentIds.has(student.id) ? 'bg-[#001C44] bg-opacity-10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{student.studentCode}</span>
                                                        <span className="ml-2 text-gray-600">{student.fullName}</span>
                                                    </div>
                                                    {selectedStudentIds.has(student.id) && (
                                                        <span className="text-[#001C44]">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {students.length > 0 && students.length < totalStudents && (
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={loadingStudents}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {loadingStudents ? 'Đang tải...' : `Tải thêm (${totalStudents - students.length} còn lại)`}
                                    </button>
                                )}
                                {selectedStudentIds.size > 0 && (
                                    <div className="text-sm text-gray-600">
                                        Đã chọn: <strong>{selectedStudentIds.size}</strong> người
                                    </div>
                                )}
                            </div>
                            {errors.recipientIds && (
                                <p className="mt-1 text-sm text-red-600">{errors.recipientIds}</p>
                            )}
                        </div>
                    )}

                    {formData.recipientType === RecipientType.ACTIVITY_REGISTRATIONS && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="activityId"
                                value={formData.activityId || ''}
                                onChange={(e) => handleNumberChange('activityId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn chuỗi sự kiện <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="seriesId"
                                value={formData.seriesId || ''}
                                onChange={(e) => handleNumberChange('seriesId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="classId"
                                value={formData.classId || ''}
                                onChange={(e) => handleNumberChange('classId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn khoa <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId || ''}
                                onChange={(e) => handleNumberChange('departmentId', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                            placeholder="Nhập tiêu đề email"
                        />
                        {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent font-mono text-sm"
                            placeholder="Nhập nội dung email..."
                        />
                        {errors.content && (
                            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Sử dụng biến template: {'{{studentName}}'}, {'{{studentCode}}'}, {'{{activityName}}'}, etc.
                        </p>
                    </div>

                    {/* HTML Toggle */}
                    <div className="flex items-center">
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
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Biến template (tùy chọn)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddTemplateVar}
                                className="text-sm text-[#001C44] hover:text-[#002A66] font-medium"
                            >
                                + Thêm biến
                            </button>
                        </div>
                        {templateVars.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Tên biến"
                                    value={item.key}
                                    onChange={(e) => handleTemplateVarChange(index, 'key', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Giá trị"
                                    value={item.value}
                                    onChange={(e) => handleTemplateVarChange(index, 'value', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTemplateVar(index)}
                                    className="px-3 py-2 text-red-600 hover:text-red-800"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File đính kèm (tối đa 10MB mỗi file)
                        </label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                        />
                        {attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                        <span className="text-sm text-gray-700">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create Notification */}
                    <div className="border-t pt-4">
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                name="createNotification"
                                checked={formData.createNotification || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm font-medium text-gray-700">
                                Tạo thông báo hệ thống khi gửi email
                            </label>
                        </div>

                        {formData.createNotification && (
                            <div className="ml-6 space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề thông báo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="notificationTitle"
                                        value={formData.notificationTitle || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL hành động (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        name="notificationActionUrl"
                                        value={formData.notificationActionUrl || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                                        placeholder="/activities/1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
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
                        className="px-6 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? 'Đang gửi...' : 'Gửi Email'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendEmail;


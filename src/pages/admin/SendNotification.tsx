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
import { StudentResponse } from '../../types/student';

const SendNotification: React.FC = () => {
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState<SendNotificationOnlyRequest>({
        recipientType: RecipientType.INDIVIDUAL,
        title: '',
        content: '',
        type: NotificationType.SYSTEM_ANNOUNCEMENT
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
            setSelectedStudentIds(new Set());
            setSearchKeyword('');
            setCurrentPage(0);
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
                setStudents(result.content);
            } else {
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
                if (formData.recipientType === RecipientType.INDIVIDUAL && newSet.size >= 10) {
                    toast.warning('Chỉ có thể chọn tối đa 10 người cho loại INDIVIDUAL');
                    return prev;
                }
                newSet.add(studentId);
            }
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
                toast.success(
                    `Gửi thông báo thành công! Tổng: ${totalRecipients}, Thành công: ${successCount}, Thất bại: ${failedCount}`
                );
                
                // Reset form
                setFormData({
                    recipientType: RecipientType.INDIVIDUAL,
                    title: '',
                    content: '',
                    type: NotificationType.SYSTEM_ANNOUNCEMENT
                });
                setErrors({});
                
                // Navigate to history
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
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#001C44]">Gửi Thông báo</h1>
                <p className="text-gray-600 mt-1">Tạo thông báo hệ thống cho sinh viên (không gửi email)</p>
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

                    {/* Conditional Fields - Same as SendEmail */}
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

                    {/* BULK: Multi-select with search, filter */}
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

                    {/* Title */}
                    <div>
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
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
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
                        {errors.content && (
                            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                        )}
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

                    {/* Action URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL hành động (tùy chọn)
                        </label>
                        <input
                            type="text"
                            name="actionUrl"
                            value={formData.actionUrl || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001C44] focus:border-transparent"
                            placeholder="/activities/1"
                        />
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
                        {sending ? 'Đang gửi...' : 'Gửi Thông báo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendNotification;


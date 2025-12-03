import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { studentAccountAPI } from '../../services/adminAPI';
import {
    ExcelStudentRow,
    UploadExcelResponse,
    StudentAccountResponse,
    UpdateStudentAccountRequest,
    BulkCreateResponse,
    BulkSendCredentialsResponse
} from '../../types/studentAccount';

type TabType = 'upload' | 'review' | 'create' | 'manage';

const StudentAccountManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Upload Excel state
    const [uploadResponse, setUploadResponse] = useState<UploadExcelResponse | null>(null);
    const [selectedValidRows, setSelectedValidRows] = useState<Set<number>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create accounts state
    const [createResponse, setCreateResponse] = useState<BulkCreateResponse | null>(null);

    // Manage accounts state
    const [accounts, setAccounts] = useState<StudentAccountResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [emailSentFilter, setEmailSentFilter] = useState<'ALL' | 'SENT' | 'NOT_SENT'>('ALL');
    const [selectedAccounts, setSelectedAccounts] = useState<Set<number>>(new Set());
    const [editingAccount, setEditingAccount] = useState<StudentAccountResponse | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; account: StudentAccountResponse | null }>({
        show: false,
        account: null
    });
    const [sendingCredentials, setSendingCredentials] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (activeTab === 'manage') {
            loadAccounts();
        }
    }, [activeTab]);

    const loadAccounts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await studentAccountAPI.getPendingAccounts();
            if (response.status && response.data) {
                setAccounts(response.data);
            } else {
                setError(response.message || 'Không thể tải danh sách tài khoản');
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
            setError('Có lỗi xảy ra khi tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setError('Chỉ chấp nhận file Excel (.xlsx hoặc .xls)');
            return;
        }

        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setLoading(true);
        setError('');
        setSuccess('');
        setUploadResponse(null);
        setSelectedValidRows(new Set());

        try {
            const response = await studentAccountAPI.uploadExcel(file);
            if (response.status && response.data) {
                setUploadResponse(response.data);
                setSuccess(`Đã parse ${response.data.totalRows} dòng. ${response.data.validRows.length} dòng hợp lệ, ${response.data.invalidRows.length} dòng không hợp lệ.`);
                setActiveTab('review');
            } else {
                setError(response.message || 'Không thể upload file Excel');
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Có lỗi xảy ra khi upload file');
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const toggleRowSelection = (index: number) => {
        const newSelected = new Set(selectedValidRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedValidRows(newSelected);
    };

    const toggleSelectAllValid = () => {
        if (!uploadResponse) return;
        if (selectedValidRows.size === uploadResponse.validRows.length) {
            setSelectedValidRows(new Set());
        } else {
            setSelectedValidRows(new Set(uploadResponse.validRows.map((_, index) => index)));
        }
    };

    const handleBulkCreate = async () => {
        if (!uploadResponse || selectedValidRows.size === 0) {
            setError('Vui lòng chọn ít nhất một dòng hợp lệ để tạo tài khoản');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const studentsToCreate = Array.from(selectedValidRows).map(index => uploadResponse.validRows[index]);

        try {
            const response = await studentAccountAPI.bulkCreate({ students: studentsToCreate });
            if (response.status && response.data) {
                setCreateResponse(response.data);
                setSuccess(`Đã tạo ${response.data.successCount} tài khoản thành công. ${response.data.errorCount} lỗi.`);
                setActiveTab('create');
                // Clear upload state
                setUploadResponse(null);
                setSelectedValidRows(new Set());
            } else {
                setError(response.message || 'Không thể tạo tài khoản');
            }
        } catch (err) {
            console.error('Error creating accounts:', err);
            setError('Có lỗi xảy ra khi tạo tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAccount = async (data: UpdateStudentAccountRequest) => {
        if (!editingAccount) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.updateAccount(editingAccount.studentId, data);
            if (response.status) {
                setShowEditModal(false);
                setEditingAccount(null);
                setSuccess('Cập nhật tài khoản thành công!');
                loadAccounts();
            } else {
                setError(response.message || 'Không thể cập nhật tài khoản');
            }
        } catch (err) {
            console.error('Error updating account:', err);
            setError('Có lỗi xảy ra khi cập nhật tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!showDeleteConfirm.account) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.deleteAccount(showDeleteConfirm.account.studentId);
            if (response.status) {
                setShowDeleteConfirm({ show: false, account: null });
                setSuccess('Xóa tài khoản thành công!');
                loadAccounts();
            } else {
                setError(response.message || 'Không thể xóa tài khoản');
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            setError('Có lỗi xảy ra khi xóa tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCredentials = async (studentId: number) => {
        setSendingCredentials(prev => new Set(prev).add(studentId));
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.sendCredentials(studentId);
            if (response.status) {
                setSuccess('Đã gửi email credentials thành công!');
                loadAccounts();
            } else {
                setError(response.message || 'Không thể gửi email');
            }
        } catch (err) {
            console.error('Error sending credentials:', err);
            setError('Có lỗi xảy ra khi gửi email');
        } finally {
            setSendingCredentials(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    };

    const handleBulkSendCredentials = async () => {
        if (selectedAccounts.size === 0) {
            setError('Vui lòng chọn ít nhất một tài khoản để gửi email');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await studentAccountAPI.bulkSendCredentials({
                studentIds: Array.from(selectedAccounts)
            });
            if (response.status && response.data) {
                setSuccess(`Đã gửi email cho ${response.data.successCount} tài khoản. ${response.data.errorCount} lỗi.`);
                setSelectedAccounts(new Set());
                loadAccounts();
            } else {
                setError(response.message || 'Không thể gửi email hàng loạt');
            }
        } catch (err) {
            console.error('Error bulk sending credentials:', err);
            setError('Có lỗi xảy ra khi gửi email hàng loạt');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccountSelection = (studentId: number) => {
        const newSelected = new Set(selectedAccounts);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedAccounts(newSelected);
    };

    const toggleSelectAllAccounts = () => {
        if (selectedAccounts.size === filteredAccounts.length) {
            setSelectedAccounts(new Set());
        } else {
            setSelectedAccounts(new Set(filteredAccounts.map(a => a.studentId)));
        }
    };

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = searchTerm === '' ||
            account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmailSent = emailSentFilter === 'ALL' ||
            (emailSentFilter === 'SENT' && account.emailSent) ||
            (emailSentFilter === 'NOT_SENT' && !account.emailSent);
        return matchesSearch && matchesEmailSent;
    });

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-2xl font-bold text-[#001C44]">Quản lý tài khoản sinh viên</h1>
                            <p className="text-gray-600 mt-1">Upload Excel, tạo tài khoản hàng loạt và quản lý tài khoản sinh viên</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-lg mb-6 border border-gray-100">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'upload'
                                            ? 'border-[#001C44] text-[#001C44]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Upload Excel
                                </button>
                                {uploadResponse && (
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === 'review'
                                                ? 'border-[#001C44] text-[#001C44]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Review Data
                                    </button>
                                )}
                                {createResponse && (
                                    <button
                                        onClick={() => setActiveTab('create')}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === 'create'
                                                ? 'border-[#001C44] text-[#001C44]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Create Results
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setActiveTab('manage');
                                        loadAccounts();
                                    }}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'manage'
                                            ? 'border-[#001C44] text-[#001C44]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Manage Accounts
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            {success}
                        </div>
                    )}

                    {/* Upload Excel Tab */}
                    {activeTab === 'upload' && (
                        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-semibold text-[#001C44] mb-4">Upload File Excel</h2>
                            <p className="text-gray-600 mb-4">
                                File Excel phải có 3 cột: Mã số sinh viên, Họ tên, Email
                            </p>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                                    isDragging
                                        ? 'border-[#001C44] bg-[#001C44] bg-opacity-5'
                                        : 'border-gray-300 hover:border-[#001C44]'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => handleFileSelect(e.target.files)}
                                    className="hidden"
                                />
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div className="mt-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#001C44] hover:bg-[#002A66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001C44]"
                                    >
                                        Chọn file Excel
                                    </button>
                                    <p className="mt-2 text-sm text-gray-600">
                                        hoặc kéo thả file vào đây
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Chỉ chấp nhận file .xlsx hoặc .xls
                                    </p>
                                </div>
                            </div>

                            {loading && (
                                <div className="mt-4 flex justify-center">
                                    <LoadingSpinner text="Đang upload và parse file..." />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review Parsed Data Tab */}
                    {activeTab === 'review' && uploadResponse && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h2 className="text-xl font-semibold text-[#001C44] mb-4">Kết quả Parse</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Tổng số dòng</p>
                                        <p className="text-2xl font-bold text-[#001C44]">{uploadResponse.totalRows}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Dòng hợp lệ</p>
                                        <p className="text-2xl font-bold text-green-600">{uploadResponse.validRows.length}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Dòng không hợp lệ</p>
                                        <p className="text-2xl font-bold text-red-600">{uploadResponse.invalidRows.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Valid Rows */}
                            {uploadResponse.validRows.length > 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-[#001C44]">
                                            Dòng hợp lệ ({uploadResponse.validRows.length})
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={toggleSelectAllValid}
                                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                {selectedValidRows.size === uploadResponse.validRows.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                            <button
                                                onClick={handleBulkCreate}
                                                disabled={selectedValidRows.size === 0 || loading}
                                                className="px-4 py-1 text-sm bg-[#001C44] text-white rounded hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Tạo tài khoản ({selectedValidRows.size})
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedValidRows.size === uploadResponse.validRows.length && uploadResponse.validRows.length > 0}
                                                            onChange={toggleSelectAllValid}
                                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {uploadResponse.validRows.map((row, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedValidRows.has(index)}
                                                                onChange={() => toggleRowSelection(index)}
                                                                className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.studentCode}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.fullName}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Invalid Rows */}
                            {uploadResponse.invalidRows.length > 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">
                                        Dòng không hợp lệ ({uploadResponse.invalidRows.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lỗi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {uploadResponse.invalidRows.map((row, index) => {
                                                    // Find error for this row (errors are keyed by row number)
                                                    const rowNumber = uploadResponse.validRows.length + index + 1;
                                                    const error = uploadResponse.errors[rowNumber] || 'Không xác định';
                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.studentCode || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.fullName || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.email || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">{error}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Create Results Tab */}
                    {activeTab === 'create' && createResponse && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h2 className="text-xl font-semibold text-[#001C44] mb-4">Kết quả tạo tài khoản</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Thành công</p>
                                        <p className="text-2xl font-bold text-green-600">{createResponse.successCount}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Lỗi</p>
                                        <p className="text-2xl font-bold text-red-600">{createResponse.errorCount}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Created Accounts */}
                            {createResponse.createdAccounts.length > 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-[#001C44] mb-4">
                                        Tài khoản đã tạo ({createResponse.createdAccounts.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {createResponse.createdAccounts.map((account) => (
                                                    <tr key={account.studentId} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.username}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.studentCode}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.fullName}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                                                            {account.password || 'Đã ẩn'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Errors */}
                            {createResponse.errors.length > 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                    <h3 className="text-lg font-semibold text-red-600 mb-4">Lỗi ({createResponse.errors.length})</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {createResponse.errors.map((error, index) => (
                                            <li key={index} className="text-sm text-red-600">{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setActiveTab('manage');
                                        loadAccounts();
                                    }}
                                    className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] transition-colors"
                                >
                                    Xem danh sách tài khoản
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manage Accounts Tab */}
                    {activeTab === 'manage' && (
                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-[#001C44] mb-4">Bộ lọc</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Tìm kiếm theo username, email, mã số SV, họ tên..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái email</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEmailSentFilter('ALL')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    emailSentFilter === 'ALL'
                                                        ? 'bg-[#001C44] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                onClick={() => setEmailSentFilter('SENT')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    emailSentFilter === 'SENT'
                                                        ? 'bg-[#001C44] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                Đã gửi
                                            </button>
                                            <button
                                                onClick={() => setEmailSentFilter('NOT_SENT')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    emailSentFilter === 'NOT_SENT'
                                                        ? 'bg-[#001C44] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                Chưa gửi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Actions */}
                            {selectedAccounts.size > 0 && (
                                <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            Đã chọn {selectedAccounts.size} tài khoản
                                        </span>
                                        <button
                                            onClick={handleBulkSendCredentials}
                                            disabled={loading}
                                            className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            Gửi email hàng loạt
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Accounts Table */}
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner text="Đang tải danh sách tài khoản..." />
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAccounts.size === filteredAccounts.length && filteredAccounts.length > 0}
                                                            onChange={toggleSelectAllAccounts}
                                                            className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số SV</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Sent</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredAccounts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                                            Không có tài khoản nào
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredAccounts.map((account) => (
                                                        <tr key={account.studentId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedAccounts.has(account.studentId)}
                                                                    onChange={() => toggleAccountSelection(account.studentId)}
                                                                    className="rounded border-gray-300 text-[#001C44] focus:ring-[#001C44]"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.username}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.email}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.studentCode}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.fullName}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                {account.emailSent ? (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        ✓ Đã gửi
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                        ✗ Chưa gửi
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(account.createdAt)}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingAccount(account);
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        className="text-[#001C44] hover:text-[#002A66]"
                                                                    >
                                                                        Sửa
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSendCredentials(account.studentId)}
                                                                        disabled={sendingCredentials.has(account.studentId)}
                                                                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {sendingCredentials.has(account.studentId) ? 'Đang gửi...' : 'Gửi email'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowDeleteConfirm({ show: true, account })}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            {/* Edit Account Modal */}
            {showEditModal && editingAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-[#001C44]">Chỉnh sửa tài khoản</h3>
                        </div>
                        <EditAccountForm
                            account={editingAccount}
                            onSave={handleUpdateAccount}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingAccount(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.show && showDeleteConfirm.account && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Bạn có chắc chắn muốn xóa tài khoản này?
                            </p>
                            <div className="bg-gray-50 p-3 rounded mb-4">
                                <p className="text-sm text-gray-600"><strong>Username:</strong> {showDeleteConfirm.account.username}</p>
                                <p className="text-sm text-gray-600"><strong>Email:</strong> {showDeleteConfirm.account.email}</p>
                                <p className="text-sm text-gray-600"><strong>Mã số SV:</strong> {showDeleteConfirm.account.studentCode}</p>
                                <p className="text-sm text-gray-600"><strong>Họ tên:</strong> {showDeleteConfirm.account.fullName}</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm({ show: false, account: null })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Edit Account Form Component
interface EditAccountFormProps {
    account: StudentAccountResponse;
    onSave: (data: UpdateStudentAccountRequest) => void;
    onCancel: () => void;
}

const EditAccountForm: React.FC<EditAccountFormProps> = ({ account, onSave, onCancel }) => {
    const [formData, setFormData] = useState<UpdateStudentAccountRequest>({
        username: account.username,
        email: account.email,
        studentCode: account.studentCode,
        fullName: account.fullName
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số sinh viên</label>
                    <input
                        type="text"
                        value={formData.studentCode || ''}
                        onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <input
                        type="text"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-[#001C44] text-white rounded-lg hover:bg-[#002A66]"
                >
                    Lưu
                </button>
            </div>
        </form>
    );
};

export default StudentAccountManagement;


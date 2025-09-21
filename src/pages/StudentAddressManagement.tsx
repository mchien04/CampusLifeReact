import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Address, Province, Ward, CreateAddressRequest, UpdateAddressRequest } from '../types';
import { addressAPI } from '../services';

const StudentAddressManagement: React.FC = () => {
    const [address, setAddress] = useState<Address | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        provinceCode: 0,
        wardCode: 0,
        street: '',
        note: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [addressData, provincesData] = await Promise.all([
                addressAPI.getMyAddress(),
                addressAPI.getProvinces()
            ]);

            setAddress(addressData);
            setProvinces(provincesData || []);

            if (addressData) {
                setFormData({
                    provinceCode: addressData.provinceCode,
                    wardCode: addressData.wardCode,
                    street: addressData.street || '',
                    note: addressData.note || '',
                });
                // Load wards for the selected province
                await loadWards(addressData.provinceCode);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const loadWards = async (provinceCode: number) => {
        try {
            const data = await addressAPI.getWardsByProvince(provinceCode);
            setWards(data || []);
        } catch (error) {
            console.error('Error loading wards:', error);
            setError('Có lỗi xảy ra khi tải danh sách phường/xã');
            setWards([]);
        }
    };

    const handleProvinceChange = async (provinceCode: number) => {
        setFormData(prev => ({
            ...prev,
            provinceCode,
            wardCode: 0, // Reset ward selection
        }));
        setWards([]); // Clear wards
        if (provinceCode > 0) {
            await loadWards(provinceCode);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.provinceCode) {
            newErrors.provinceCode = 'Vui lòng chọn tỉnh/thành phố';
        }

        if (!formData.wardCode) {
            newErrors.wardCode = 'Vui lòng chọn phường/xã';
        }

        if (formData.street && formData.street.length > 200) {
            newErrors.street = 'Địa chỉ không được quá 200 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const selectedProvince = provinces.find(p => p.code === formData.provinceCode);
            const selectedWard = wards.find(w => w.code === formData.wardCode);

            const data: CreateAddressRequest | UpdateAddressRequest = {
                provinceCode: formData.provinceCode,
                provinceName: selectedProvince?.name || '',
                wardCode: formData.wardCode,
                wardName: selectedWard?.name || '',
                street: formData.street.trim() || undefined,
                note: formData.note.trim() || undefined,
            };

            if (address) {
                await addressAPI.updateMyAddress(data);
                setSuccess('Cập nhật địa chỉ thành công!');
            } else {
                await addressAPI.createMyAddress(data);
                setSuccess('Tạo địa chỉ thành công!');
            }

            // Reload data to get updated address
            await loadData();
        } catch (error) {
            console.error('Error saving address:', error);
            setError('Có lỗi xảy ra khi lưu địa chỉ');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'provinceCode' || name === 'wardCode' ? parseInt(value) : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý địa chỉ</h1>
                            <p className="text-gray-600 mt-1">Cập nhật thông tin địa chỉ của bạn</p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            ← Quay lại Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Address Display */}
                {address && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Địa chỉ hiện tại:</h3>
                        <p className="text-sm text-blue-700">
                            {address.street && `${address.street}, `}
                            {address.wardName}, {address.provinceName}
                            {address.note && ` (${address.note})`}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Cập nhật lần cuối: {new Date(address.updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                )}

                {/* Address Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="provinceCode" className="block text-sm font-medium text-gray-700">
                                Tỉnh/Thành phố <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="provinceCode"
                                name="provinceCode"
                                value={formData.provinceCode}
                                onChange={(e) => handleProvinceChange(parseInt(e.target.value))}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.provinceCode ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value={0}>Chọn tỉnh/thành phố</option>
                                {provinces.map(province => (
                                    <option key={province.code} value={province.code}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                            {errors.provinceCode && (
                                <p className="mt-1 text-sm text-red-600">{errors.provinceCode}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="wardCode" className="block text-sm font-medium text-gray-700">
                                Phường/Xã <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="wardCode"
                                name="wardCode"
                                value={formData.wardCode}
                                onChange={handleChange}
                                disabled={!formData.provinceCode || !wards || wards.length === 0}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.wardCode ? 'border-red-300' : 'border-gray-300'
                                    } ${!formData.provinceCode || !wards || wards.length === 0 ? 'bg-gray-100' : ''}`}
                            >
                                <option value={0}>
                                    {!formData.provinceCode ? 'Chọn tỉnh/thành phố trước' :
                                        !wards || wards.length === 0 ? 'Đang tải...' : 'Chọn phường/xã'}
                                </option>
                                {wards && wards.map(ward => (
                                    <option key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                            {errors.wardCode && (
                                <p className="mt-1 text-sm text-red-600">{errors.wardCode}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                                Địa chỉ cụ thể
                            </label>
                            <input
                                type="text"
                                id="street"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="Số nhà, tên đường, tòa nhà..."
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.street ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.street && (
                                <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Tối đa 200 ký tự
                            </p>
                        </div>

                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                                Ghi chú
                            </label>
                            <textarea
                                id="note"
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ghi chú thêm về địa chỉ..."
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : (address ? 'Cập nhật địa chỉ' : 'Tạo địa chỉ')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentAddressManagement;

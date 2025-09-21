import api from './api';
import {
    Address,
    Province,
    Ward,
    CreateAddressRequest,
    UpdateAddressRequest
} from '../types/address';

export const addressAPI = {
    // Lấy danh sách tỉnh/thành phố
    getProvinces: async (): Promise<Province[]> => {
        const response = await api.get('/api/addresses/provinces');
        return response.data.body;
    },

    // Lấy danh sách phường/xã theo tỉnh
    getWardsByProvince: async (provinceCode: number): Promise<Ward[]> => {
        const response = await api.get(`/api/addresses/provinces/${provinceCode}/wards`);
        return response.data.body;
    },

    // Lấy địa chỉ sinh viên hiện tại
    getMyAddress: async (): Promise<Address | null> => {
        const response = await api.get('/api/addresses/my');
        return response.data.body;
    },

    // Cập nhật địa chỉ sinh viên
    updateMyAddress: async (data: UpdateAddressRequest): Promise<Address> => {
        const formData = new FormData();
        formData.append('provinceCode', data.provinceCode.toString());
        formData.append('provinceName', data.provinceName);
        formData.append('wardCode', data.wardCode.toString());
        formData.append('wardName', data.wardName);
        if (data.street) {
            formData.append('street', data.street);
        }
        if (data.note) {
            formData.append('note', data.note);
        }

        const response = await api.put('/api/addresses/my', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },

    // Tạo địa chỉ mới
    createMyAddress: async (data: CreateAddressRequest): Promise<Address> => {
        const formData = new FormData();
        formData.append('provinceCode', data.provinceCode.toString());
        formData.append('provinceName', data.provinceName);
        formData.append('wardCode', data.wardCode.toString());
        formData.append('wardName', data.wardName);
        if (data.street) {
            formData.append('street', data.street);
        }
        if (data.note) {
            formData.append('note', data.note);
        }

        const response = await api.post('/api/addresses/my', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.body;
    },
};

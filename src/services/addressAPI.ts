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
        const raw = response.data?.body || [];
        // Chuẩn hóa code thành number và name thành string
        const provinces: Province[] = (raw as any[])
            .map((item: any) => {
                const rawCode = item?.code ?? item?.matinhTMS ?? item?.ma_tinh_tms;
                const codeNum = typeof rawCode === 'number' ? rawCode : parseInt(String(rawCode ?? ''), 10);
                const nameStr = item?.name ?? item?.tentinhmoi ?? item?.ten_tinh_moi;
                if (!Number.isFinite(codeNum) || !nameStr) return null;
                return { code: codeNum, name: String(nameStr) } as Province;
            })
            .filter(Boolean) as Province[];
        return provinces;
    },

    // Lấy danh sách phường/xã theo tỉnh
    getWardsByProvince: async (provinceCode: number): Promise<Ward[]> => {
        console.log('🔍 API: Getting wards for province code:', provinceCode);
        const response = await api.get(`/api/addresses/provinces/${provinceCode}/wards`);
        const raw = response.data?.body || [];

        // Map dữ liệu phường/xã từ nguồn thô (keys khác nhau) về chuẩn { code, name }
        const wards: Ward[] = (raw as any[])
            .map((item: any) => {
                const rawCode = item?.code ?? item?.maphuongxa ?? item?.maphuongxaTMS ?? item?.maphuongTMS ?? item?.maPhuongXa ?? item?.ma_phuong_xa;
                const codeNum = typeof rawCode === 'number' ? rawCode : parseInt(String(rawCode ?? ''), 10);
                const nameStr = item?.name ?? item?.tenphuongxa ?? item?.tenphuongmoi ?? item?.ten_phuong_moi ?? item?.tenphuong ?? item?.tenPhuong ?? item?.ten_phuong ?? item?.ten_phuong_xa;

                if (!Number.isFinite(codeNum) || !nameStr) return null;
                return { code: codeNum, name: String(nameStr) } as Ward;
            })
            .filter(Boolean) as Ward[];

        console.log('🔍 API: Mapped wards count:', wards.length);
        if (wards.length === 0) {
            console.log('🔍 API: Sample raw ward item:', (raw as any[])[0]);
        }
        return wards;
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

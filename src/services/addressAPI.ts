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
        try {
            const response = await api.get('/api/addresses/my');
            // Backend trả về {status: true/false, message: "...", data: {...} hoặc body: {...}}
            if (response.data.status) {
                const addressData = response.data.data || response.data.body;
                if (addressData) {
                    return addressData;
                }
            }
            // Nếu status false hoặc không có data, trả về null (chưa có địa chỉ)
            return null;
        } catch (error: any) {
            // Nếu lỗi 404 hoặc không tìm thấy, trả về null (chưa có địa chỉ)
            if (error.response?.status === 404) {
                return null;
            }
            // Các lỗi khác, log và trả về null
            console.error('Error getting address:', error);
            return null;
        }
    },

    // Cập nhật địa chỉ sinh viên
    updateMyAddress: async (data: UpdateAddressRequest): Promise<Address> => {
        try {
            const params = new URLSearchParams();
            params.append('provinceCode', data.provinceCode.toString());
            params.append('provinceName', data.provinceName);
            params.append('wardCode', data.wardCode.toString());
            params.append('wardName', data.wardName);
            if (data.street) {
                params.append('street', data.street);
            }
            if (data.note) {
                params.append('note', data.note);
            }

            const response = await api.put('/api/addresses/my', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            // Backend trả về {status: true, message: "...", data: {...}}
            if (!response.data.status) {
                throw new Error(response.data.message || 'Cập nhật địa chỉ thất bại');
            }
            return response.data.data || response.data.body;
        } catch (error: any) {
            // Handle HTTP errors (4xx, 5xx)
            const errorMessage = error?.response?.data?.message || error?.message || 'Cập nhật địa chỉ thất bại';
            throw new Error(errorMessage);
        }
    },

    // Tạo địa chỉ mới
    createMyAddress: async (data: CreateAddressRequest): Promise<Address> => {
        try {
            const params = new URLSearchParams();
            params.append('provinceCode', data.provinceCode.toString());
            params.append('provinceName', data.provinceName);
            params.append('wardCode', data.wardCode.toString());
            params.append('wardName', data.wardName);
            if (data.street) {
                params.append('street', data.street);
            }
            if (data.note) {
                params.append('note', data.note);
            }

            console.log('🔍 addressAPI: Creating address with data:', {
                provinceCode: data.provinceCode,
                provinceName: data.provinceName,
                wardCode: data.wardCode,
                wardName: data.wardName,
                street: data.street,
                note: data.note
            });

            const response = await api.post('/api/addresses/my', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            console.log('🔍 addressAPI: Response from backend:', response.data);

            // Backend trả về {status: true, message: "...", data: {...}}
            if (!response.data.status) {
                const errorMsg = response.data.message || 'Tạo địa chỉ thất bại';
                console.error('🔍 addressAPI: Backend returned status false:', errorMsg);
                throw new Error(errorMsg);
            }
            return response.data.data || response.data.body;
        } catch (error: any) {
            // Handle HTTP errors (4xx, 5xx)
            console.error('🔍 addressAPI: Error creating address:', error);
            console.error('🔍 addressAPI: Error response:', error?.response?.data);
            const errorMessage = error?.response?.data?.message || error?.message || 'Tạo địa chỉ thất bại';
            throw new Error(errorMessage);
        }
    },

    // Xóa địa chỉ sinh viên
    deleteMyAddress: async (): Promise<void> => {
        try {
            const response = await api.delete('/api/addresses/my');

            // Backend trả về {status: true/false, message: "..."}
            if (!response.data.status) {
                throw new Error(response.data.message || 'Xóa địa chỉ thất bại');
            }
        } catch (error: any) {
            // Handle HTTP errors (4xx, 5xx)
            const errorMessage = error?.response?.data?.message || error?.message || 'Xóa địa chỉ thất bại';
            throw new Error(errorMessage);
        }
    },
};

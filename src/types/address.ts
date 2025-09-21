export interface Address {
    id: number;
    studentId: number;
    provinceCode: number;
    provinceName: string;
    wardCode: number;
    wardName: string;
    street?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Province {
    code: number;
    name: string;
}

export interface Ward {
    code: number;
    name: string;
}

export interface CreateAddressRequest {
    provinceCode: number;
    provinceName: string;
    wardCode: number;
    wardName: string;
    street?: string;
    note?: string;
}

export interface UpdateAddressRequest {
    provinceCode: number;
    provinceName: string;
    wardCode: number;
    wardName: string;
    street?: string;
    note?: string;
}

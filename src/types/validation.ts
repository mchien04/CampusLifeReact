import * as yup from 'yup';

export const studentProfileSchema = yup.object({
    fullName: yup
        .string()
        .required('Họ tên là bắt buộc')
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(50, 'Họ tên không được quá 50 ký tự')
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ tên chỉ được chứa chữ cái'),

    studentCode: yup
        .string()
        .required('Mã sinh viên là bắt buộc')
        .min(6, 'Mã sinh viên phải có ít nhất 6 ký tự')
        .max(20, 'Mã sinh viên không được quá 20 ký tự')
        .matches(/^[a-zA-Z0-9]+$/, 'Mã sinh viên chỉ được chứa chữ cái và số'),

    phoneNumber: yup
        .string()
        .matches(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),

    dateOfBirth: yup
        .date()
        .max(new Date(), 'Ngày sinh không được trong tương lai'),

    gender: yup
        .string()
        .oneOf(['MALE', 'FEMALE', 'OTHER'], 'Giới tính không hợp lệ'),

    departmentId: yup
        .number()
        .required('Vui lòng chọn khoa'),

    classId: yup
        .number()
        .required('Vui lòng chọn lớp'),
});

export const addressSchema = yup.object({
    provinceCode: yup
        .number()
        .required('Vui lòng chọn tỉnh/thành phố'),

    wardCode: yup
        .number()
        .required('Vui lòng chọn phường/xã'),

    street: yup
        .string()
        .max(200, 'Địa chỉ không được quá 200 ký tự'),
});

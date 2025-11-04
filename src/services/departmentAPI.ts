import api from './api';


export const departmentAPI = {
    getAllDepartments: async () => {

        const res = await api.get("/api/departments");
        return res.data;
    },
};

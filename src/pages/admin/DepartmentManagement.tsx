import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DepartmentList from '../../components/admin/DepartmentList';
import CreateDepartment from './CreateDepartment';
import EditDepartment from './EditDepartment';

const DepartmentManagement: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DepartmentList />} />
            <Route path="/create" element={<CreateDepartment />} />
            <Route path="/:id/edit" element={<EditDepartment />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default DepartmentManagement;

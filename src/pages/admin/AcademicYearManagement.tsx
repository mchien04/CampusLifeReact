import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AcademicYearList from '../../components/admin/AcademicYearList';
import CreateAcademicYear from './CreateAcademicYear';
import EditAcademicYear from './EditAcademicYear';

const AcademicYearManagement: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<AcademicYearList />} />
            <Route path="/create" element={<CreateAcademicYear />} />
            <Route path="/:id/edit" element={<EditAcademicYear />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default AcademicYearManagement;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SemesterList from '../../components/admin/SemesterList';
import CreateSemester from './CreateSemester';
import EditSemester from './EditSemester';

const SemesterManagement: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<SemesterList />} />
            <Route path="/create" element={<CreateSemester />} />
            <Route path="/:id/edit" element={<EditSemester />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default SemesterManagement;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CriteriaGroupList from '../../components/admin/CriteriaGroupList';
import CreateCriteriaGroup from './CreateCriteriaGroup';
import EditCriteriaGroup from './EditCriteriaGroup';

const CriteriaGroupManagement: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<CriteriaGroupList />} />
            <Route path="/create" element={<CreateCriteriaGroup />} />
            <Route path="/:id/edit" element={<EditCriteriaGroup />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default CriteriaGroupManagement;

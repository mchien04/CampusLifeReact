import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CriteriaItemList from '../../components/admin/CriteriaItemList';
import CreateCriteriaItem from './CreateCriteriaItem';
import EditCriteriaItem from './EditCriteriaItem';

const CriteriaItemManagement: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<CriteriaItemList />} />
            <Route path="/create" element={<CreateCriteriaItem />} />
            <Route path="/:id/edit" element={<EditCriteriaItem />} />
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
};

export default CriteriaItemManagement;

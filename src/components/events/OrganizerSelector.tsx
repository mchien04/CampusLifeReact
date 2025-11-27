import React, { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';

interface OrganizerSelectorProps {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    error?: string;
    required?: boolean;
}

const OrganizerSelector: React.FC<OrganizerSelectorProps> = ({
    selectedIds,
    onChange,
    error,
    required = true
}) => {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                setLoading(true);
                const response = await departmentAPI.getAll();
                if (response.status && response.data) {
                    setDepartments(response.data);
                }
            } catch (error) {
                console.error('Error loading departments:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDepartments();
    }, []);

    const handleToggle = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.id?.toString().includes(searchTerm)
    );

    return (
        <div>
            <label className="block text-sm font-medium text-[#001C44] mb-2">
                Đơn vị tổ chức {required && '*'}
            </label>

            {/* Search Input */}
            <div className="mb-3">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm đơn vị..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001C44] text-sm"
                />
            </div>

            {/* Departments List */}
            {loading ? (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#001C44] mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                </div>
            ) : filteredDepartments.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy đơn vị nào' : 'Không có đơn vị nào'}
                </div>
            ) : (
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {filteredDepartments.map((dept) => {
                            const isSelected = selectedIds.includes(dept.id);
                            return (
                                <label
                                    key={dept.id}
                                    className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                                        isSelected
                                            ? 'bg-[#FFD66D] bg-opacity-20 hover:bg-[#FFD66D] hover:bg-opacity-30'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggle(dept.id)}
                                        className="h-4 w-4 text-[#001C44] focus:ring-[#001C44] border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm text-gray-700 flex-1">
                                        <span className="font-medium">{dept.name}</span>
                                        {dept.id && (
                                            <span className="text-gray-500 ml-2">(ID: {dept.id})</span>
                                        )}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Count */}
            {selectedIds.length > 0 && (
                <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                        Đã chọn: <span className="font-medium text-[#001C44]">{selectedIds.length}</span> đơn vị
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedIds.map(id => {
                            const dept = departments.find(d => d.id === id);
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#FFD66D] bg-opacity-30 text-[#001C44]"
                                >
                                    {dept ? dept.name : `ID: ${id}`}
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(id)}
                                        className="ml-2 text-[#001C44] hover:text-red-600"
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default OrganizerSelector;


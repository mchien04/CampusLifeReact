import React, { useEffect, useMemo, useState } from 'react';
import { eventAPI } from '../../../services/eventAPI';
import type { ActivityResponse } from '../../../types/activity';
import LoadingSpinner from '../../common/LoadingSpinner';

type CreateArticleModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelectActivity: (activityId: number | null) => void;
};

const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ isOpen, onClose, onSelectActivity }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<ActivityResponse[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!isOpen) return;
            try {
                setLoading(true);
                setError(null);
                const res = await eventAPI.getEvents();
                if (res.status && Array.isArray(res.data)) {
                    setEvents(res.data);
                } else {
                    setEvents([]);
                    setError(res.message || 'Không tải được danh sách sự kiện');
                }
            } catch {
                setEvents([]);
                setError('Không tải được danh sách sự kiện');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = [...events];
        list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        if (!q) return list;
        return list.filter((e) => e.name.toLowerCase().includes(q) || String(e.id).includes(q));
    }, [events, search]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div>
                            <div className="text-lg font-bold text-[#001C44]">Tạo bài viết</div>
                            <div className="text-sm text-gray-600">Chọn nhanh sự kiện cần tạo landing page</div>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc ID sự kiện..."
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:border-[#001C44] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                            >
                                Xóa
                            </button>
                        </div>

                        <div className="pt-2 pb-2">
                            <button
                                type="button"
                                onClick={() => onSelectActivity(null)}
                                className="w-full py-3 px-4 bg-[#FFD66D] hover:bg-[#FFC63D] text-[#001C44] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Tạo bài viết độc lập (Không gắn sự kiện)
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-4 text-red-700 border border-red-200">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="min-h-[30vh] flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-gray-200">
                                {filtered.length === 0 ? (
                                    <div className="p-10 text-center text-gray-600">Không có sự kiện</div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filtered.map((ev) => (
                                            <button
                                                key={ev.id}
                                                type="button"
                                                onClick={() => onSelectActivity(ev.id)}
                                                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[#001C44] truncate">
                                                        #{ev.id} • {ev.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {new Date(ev.startDate).toLocaleDateString('vi-VN')} → {new Date(ev.endDate).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    <span className="inline-flex items-center rounded-full bg-[#001C44] px-3 py-1 text-xs font-semibold text-white">
                                                        Chọn
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateArticleModal;


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';
import { eventAPI, preparationAPI } from '../services';
import { ActivityResponse, PreparationDashboardDto } from '../types';
import { getImageUrl } from '../utils/imageUtils';

type PreparationItem = {
  activity: ActivityResponse;
  dashboard: PreparationDashboardDto;
};

function toEventStatus(event: ActivityResponse) {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  if (now < startDate) return 'UPCOMING';
  if (now >= startDate && now <= endDate) return 'ONGOING';
  return 'ENDED';
}

export default function StudentPreparation() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ActivityResponse[]>([]);
  const [items, setItems] = useState<PreparationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED'>('ALL');

  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((it) => toEventStatus(it.activity) === statusFilter);
  }, [items, statusFilter]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventAPI.getEvents();
      if (!res.status) {
        setEvents([]);
        toast.error(res.message || 'Không thể tải danh sách sự kiện');
        return;
      }
      const standalone = (res.data || []).filter((e) => !e.seriesId);
      setEvents(standalone);
    } catch (e: any) {
      setEvents([]);
      toast.error(e?.message || 'Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreparationItems = useCallback(async (allEvents: ActivityResponse[]) => {
    const results: PreparationItem[] = [];
    setLoadingPrep(true);
    for (const ev of allEvents) {
      try {
        const dash = await preparationAPI.getDashboard(ev.id);
        if (dash?.hasPreparation) {
          results.push({ activity: ev, dashboard: dash });
        }
      } catch {
      }
    }
    setItems(results);
    setLoadingPrep(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (events.length === 0) {
      setItems([]);
      return;
    }
    fetchPreparationItems(events);
  }, [events, fetchPreparationItems]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
              <span className="mr-3 text-4xl">🧰</span>
              Công tác chuẩn bị
            </h1>
            <p className="mt-2 text-gray-600">Danh sách sự kiện bạn thuộc BTC và đang bật chuẩn bị</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
            >
              <option value="ALL">Tất cả</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="ONGOING">Đang diễn ra</option>
              <option value="ENDED">Đã kết thúc</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44]"></div>
          </div>
        ) : (
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#001C44]">Sự kiện của bạn</h2>
                {loadingPrep && <span className="text-xs text-gray-500">Đang kiểm tra quyền BTC...</span>}
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Không có sự kiện nào đang bật công tác chuẩn bị cho tài khoản của bạn.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredItems.map(({ activity, dashboard }) => {
                    const banner = getImageUrl(activity.bannerUrl);
                    const pendingTasks = (dashboard.tasks || []).filter((t) => t.status === 'PENDING').length;
                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => navigate(`/student/preparation/${activity.id}`)}
                        className="text-left border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                      >
                        {banner && (
                          <div className="h-36 bg-gray-100">
                            <img src={banner} alt={activity.name} className="w-full h-36 object-cover" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate">{activity.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(activity.startDate).toLocaleString('vi-VN')} – {new Date(activity.endDate).toLocaleString('vi-VN')}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">{activity.location}</div>
                            </div>
                            <div className="shrink-0">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#001C44] bg-opacity-10 text-[#001C44] border border-[#001C44] border-opacity-20">
                                BTC
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="text-xs text-gray-600">
                              <span className="font-semibold text-[#001C44]">{dashboard.tasks.length}</span> nhiệm vụ
                              {pendingTasks > 0 && (
                                <span className="ml-1 text-yellow-700">({pendingTasks} chưa nhận)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 text-right">
                              {dashboard.budget ? (
                                <span>
                                  Còn lại: <span className="font-semibold text-[#001C44]">{dashboard.budget.remainingAmount}</span>
                                </span>
                              ) : (
                                <span>{dashboard.financeMessage || 'Chưa có ngân sách'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}


import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';
import { PreparationOrganizerPanel } from '../components/preparation/PreparationOrganizerPanel';
import { eventAPI } from '../services/eventAPI';
import { ActivityResponse } from '../types';
import { getImageUrl } from '../utils/imageUtils';

export default function StudentPreparationDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const id = Number(activityId);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<ActivityResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getEvent(id);
        if (res.status && res.data) {
          setEvent(res.data);
        } else {
          setEvent(null);
          toast.error(res.message || 'Không thể tải thông tin sự kiện');
        }
      } catch (e: any) {
        setEvent(null);
        toast.error(e?.message || 'Không thể tải thông tin sự kiện');
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(id) && id > 0) run();
  }, [id]);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <StudentLayout>
        <div className="card">
          <div className="p-6">
            <div className="text-sm text-gray-600">ActivityId không hợp lệ.</div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#001C44] flex items-center">
              <span className="mr-3 text-4xl">🧰</span>
              Công tác chuẩn bị
            </h1>
            <p className="mt-2 text-gray-600">Chi tiết công tác chuẩn bị của sự kiện</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/preparation')}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Quay lại
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001C44]"></div>
          </div>
        ) : event ? (
          <>
            <div className="card">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {event.bannerUrl && (
                    <div className="w-full md:w-56 shrink-0">
                      <img
                        src={getImageUrl(event.bannerUrl) || event.bannerUrl}
                        alt={event.name}
                        className="w-full h-36 md:h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold text-[#001C44]">{event.name}</div>
                    {event.description && <div className="text-sm text-gray-600 mt-1">{event.description}</div>}
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="mr-2">📅</span>
                      {new Date(event.startDate).toLocaleString('vi-VN')} – {new Date(event.endDate).toLocaleString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PreparationOrganizerPanel activityId={event.id} />
          </>
        ) : (
          <div className="card">
            <div className="p-6">
              <div className="text-sm text-gray-600">Không tìm thấy sự kiện.</div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}


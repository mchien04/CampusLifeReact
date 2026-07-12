import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarBlank,
  MapPin,
  Toolbox,
  WarningCircle,
  ShieldCheck,
  Clock,
  PlayCircle,
  CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';
import { PreparationOrganizerPanel } from '../components/preparation/PreparationOrganizerPanel';
import { eventAPI, preparationAPI, studentAPI } from '../services';
import { ActivityResponse } from '../types';
import { getImageUrl } from '../utils/imageUtils';

const formatEventDate = (date: string) =>
  new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function toEventStatus(event: ActivityResponse) {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  if (now < startDate) return 'UPCOMING' as const;
  if (now >= startDate && now <= endDate) return 'ONGOING' as const;
  return 'ENDED' as const;
}

const EventStatusBadge: React.FC<{ status: ReturnType<typeof toEventStatus> }> = ({ status }) => {
  if (status === 'UPCOMING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-semibold text-primary-900 ring-1 ring-accent/40">
        <Clock size={14} weight="duotone" />
        Sắp diễn ra
      </span>
    );
  }
  if (status === 'ONGOING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
        <PlayCircle size={14} weight="duotone" />
        Đang diễn ra
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
      <CheckCircle size={14} weight="duotone" />
      Đã kết thúc
    </span>
  );
};

const StudentPreparationDetailSkeleton: React.FC = () => (
  <div className="mx-auto max-w-6xl space-y-6 animate-pulse pb-12">
    <div className="h-40 rounded-2xl bg-gray-200/80" />
    <div className="h-48 rounded-2xl bg-gray-200/80" />
    <div className="h-96 rounded-2xl bg-gray-200/80" />
  </div>
);

export default function StudentPreparationDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const id = Number(activityId);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<ActivityResponse | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getEvent(id);
        if (res.status && res.data) {
          setEvent(res.data);
          try {
            const profile = await studentAPI.getMyProfile();
            const organizers = await preparationAPI.listOrganizers(id);
            const isSup = organizers.some((o) => o.studentId === profile.id && o.prepSupervisor);
            setIsSupervisor(isSup);
          } catch (err) {
            console.error('Error checking supervisor status:', err);
            setIsSupervisor(false);
          }
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
        <div className="mx-auto max-w-6xl pb-12">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-premium">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <WarningCircle size={28} weight="duotone" />
            </div>
            <p className="text-sm text-gray-600">ActivityId không hợp lệ.</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (loading) {
    return (
      <StudentLayout>
        <StudentPreparationDetailSkeleton />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
            }}
          />
          <div className="relative space-y-5">
            <button
              type="button"
              onClick={() => navigate('/student/preparation')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-100/90 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg px-1 -ml-1"
            >
              <ArrowLeft size={16} weight="bold" />
              Danh sách chuẩn bị
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100 ring-1 ring-white/15">
                    <Toolbox size={14} weight="duotone" />
                    Ban tổ chức
                  </span>
                  {isSupervisor && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-400/20 px-2.5 py-1 text-xs font-semibold text-violet-100 ring-1 ring-violet-300/30">
                      <ShieldCheck size={14} weight="duotone" />
                      Giám sát
                    </span>
                  )}
                  {event && <EventStatusBadge status={toEventStatus(event)} />}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                  {event ? event.name : 'Công tác chuẩn bị'}
                </h1>
                <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                  Chi tiết công tác chuẩn bị của sự kiện — nhiệm vụ, ngân sách và chi phí.
                </p>
              </div>
            </div>
          </div>
        </header>

        {isSupervisor && event && (
          <div className="rounded-2xl border border-gray-100 bg-white p-1.5 shadow-premium">
            <nav className="flex gap-1">
              <button
                type="button"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold bg-primary-900 text-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
              >
                Thông tin chuẩn bị (Sinh viên)
              </button>
              <button
                type="button"
                onClick={() => navigate(`/manager/preparation/${event.id}`)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 ring-1 ring-transparent hover:bg-gray-50 hover:text-primary-900 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
              >
                Quản trị (Giám sát)
              </button>
            </nav>
          </div>
        )}

        {event ? (
          <>
            <section className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {event.bannerUrl && (
                  <div className="w-full md:w-56 shrink-0">
                    <img
                      src={getImageUrl(event.bannerUrl) || event.bannerUrl}
                      alt={event.name}
                      className="w-full h-40 md:h-full min-h-[8rem] object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-5 sm:p-6 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 mb-1">
                    Sự kiện
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight text-primary-900">{event.name}</h2>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{event.description}</p>
                  )}
                  <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarBlank size={16} className="shrink-0 text-gray-400" weight="duotone" />
                      <span className="tabular-nums">
                        {formatEventDate(event.startDate)} – {formatEventDate(event.endDate)}
                      </span>
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <MapPin size={16} className="shrink-0 text-gray-400" weight="duotone" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <PreparationOrganizerPanel activityId={event.id} />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-premium">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
              <Toolbox size={28} weight="duotone" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-primary-900">Không tìm thấy sự kiện</h3>
            <p className="mt-2 text-sm text-gray-500">Sự kiện có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
            <button
              type="button"
              onClick={() => navigate('/student/preparation')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
            >
              <ArrowLeft size={18} weight="bold" />
              Quay lại danh sách
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

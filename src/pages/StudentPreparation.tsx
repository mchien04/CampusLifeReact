import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Toolbox,
    FolderOpen,
    CalendarBlank,
    MapPin,
    ListChecks,
    CurrencyCircleDollar,
    Wallet,
    ShieldCheck,
    UsersThree,
    ArrowRight,
    Clock,
    PlayCircle,
    CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import StudentLayout from '../components/layout/StudentLayout';
import { eventAPI, preparationAPI, studentAPI } from '../services';
import { ActivityResponse, FinancialReportDto, PreparationDashboardDto } from '../types';
import { getImageUrl } from '../utils/imageUtils';

type PreparationItem = {
  activity: ActivityResponse;
  dashboard: PreparationDashboardDto;
  report: FinancialReportDto | null;
  myHoldingAmount: string;
  isSupervisor: boolean;
};

type StatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatMoney(amount: string) {
  const n = Number(amount);
  if (Number.isFinite(n)) return currencyFormatter.format(n);
  return amount;
}

function sumMoney(values: string[]) {
  return values.reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function toEventStatus(event: ActivityResponse) {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  if (now < startDate) return 'UPCOMING';
  if (now >= startDate && now <= endDate) return 'ONGOING';
  return 'ENDED';
}

const formatEventDate = (date: string) =>
  new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'ENDED', label: 'Đã kết thúc' },
];

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

const StudentPreparationSkeleton: React.FC = () => (
  <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
    <div className="h-32 rounded-2xl bg-gray-200/80" />
    <div className="h-14 rounded-2xl bg-gray-200/80" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden">
          <div className="h-36 bg-gray-200/80" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200/80" />
            <div className="h-3 w-1/2 rounded bg-gray-100/80" />
            <div className="h-8 w-full rounded-xl bg-gray-100/80" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function StudentPreparation() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PreparationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [myStudentId, setMyStudentId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((it) => toEventStatus(it.activity) === statusFilter);
  }, [items, statusFilter]);

  const loadMyPreparationItems = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingPrep(true);

      const profile = await studentAPI.getMyProfile().catch(() => null);
      const currentStudentId = profile?.id ?? null;
      setMyStudentId(currentStudentId);

      const activityIds = await preparationAPI.getMyActivityIds();
      if (!activityIds.length) {
        setItems([]);
        return;
      }

      const settled = await Promise.allSettled(
        activityIds.map(async (activityId) => {
          const [dash, evRes, organizers] = await Promise.all([
            preparationAPI.getDashboard(activityId),
            eventAPI.getEvent(activityId),
            preparationAPI.listOrganizers(activityId).catch(() => []),
          ]);

          const rep = await preparationAPI.getFinancialReport(activityId).catch(() => null);
          const debts = currentStudentId
            ? await preparationAPI.getFundAdvanceDebts(activityId, currentStudentId).catch(() => [])
            : [];

          const myHolding = (debts ?? []).reduce((sum, d) => sum + (Number(d.holdingAmount) || 0), 0);

          if (!evRes.status || !evRes.data) return null;

          const isSup = currentStudentId
            ? organizers.some((o) => o.studentId === currentStudentId && o.prepSupervisor)
            : false;

          return {
            activity: evRes.data,
            dashboard: dash,
            report: rep,
            myHoldingAmount: String(myHolding),
            isSupervisor: isSup,
          } as PreparationItem;
        })
      );

      const results = settled.flatMap((s) => {
        if (s.status !== 'fulfilled') return [];
        if (!s.value) return [];
        return [s.value];
      });

      results.sort(
        (a, b) => new Date(b.activity.startDate).getTime() - new Date(a.activity.startDate).getTime()
      );
      setItems(results);
    } catch (e: any) {
      setItems([]);
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách công tác chuẩn bị');
    } finally {
      setLoading(false);
      setLoadingPrep(false);
    }
  }, []);

  useEffect(() => {
    loadMyPreparationItems();
  }, [loadMyPreparationItems]);

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
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
              Ban tổ chức
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Công tác chuẩn bị
            </h1>
            <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
              Danh sách sự kiện bạn thuộc ban tổ chức và đang bật chuẩn bị.
            </p>
            {!loading && items.length > 0 && (
              <p className="mt-4 text-xs font-medium text-primary-100/70 tabular-nums">
                {items.length} sự kiện
                {loadingPrep ? ' · đang tải chi tiết…' : ''}
              </p>
            )}
          </div>
        </header>

        {!loading && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-premium space-y-4">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30 ${
                    statusFilter === opt.value
                      ? 'bg-primary-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {statusFilter !== 'ALL' && (
              <p className="text-xs text-gray-500 tabular-nums">
                {filteredItems.length} kết quả
              </p>
            )}
          </div>
        )}

        {loading && <StudentPreparationSkeleton />}

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-premium">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-900">
              <FolderOpen size={28} weight="duotone" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-primary-900">
              {statusFilter !== 'ALL'
                ? 'Không có sự kiện phù hợp bộ lọc'
                : 'Chưa có sự kiện chuẩn bị'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              {statusFilter !== 'ALL'
                ? 'Thử chọn trạng thái khác để xem thêm sự kiện.'
                : 'Không có sự kiện nào đang bật công tác chuẩn bị cho tài khoản của bạn.'}
            </p>
            {statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-primary-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
              >
                <Toolbox size={18} weight="bold" />
                Xem tất cả
              </button>
            )}
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredItems.map(({ activity, dashboard, report, myHoldingAmount, isSupervisor }) => {
              const myHolding = Number(myHoldingAmount) || 0;
              const banner = getImageUrl(activity.bannerUrl);
              const pendingTasks = (dashboard.tasks || []).filter((t) => t.status === 'PENDING').length;
              const eventStatus = toEventStatus(activity);

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => navigate(`/student/preparation/${activity.id}`)}
                  className="group text-left rounded-2xl border border-gray-100 bg-white shadow-premium overflow-hidden transition-all hover:border-primary-900/20 hover:shadow-lg active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                >
                  {banner ? (
                    <div className="relative h-36 bg-gray-100 overflow-hidden">
                      <img
                        src={banner}
                        alt={activity.name}
                        className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-primary-50">
                      <Toolbox size={32} weight="duotone" className="text-primary-900/40" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-primary-900 truncate group-hover:underline">
                          {activity.name}
                        </h3>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <CalendarBlank size={14} className="shrink-0 text-gray-400" />
                          <span className="tabular-nums">
                            {formatEventDate(activity.startDate)} – {formatEventDate(activity.endDate)}
                          </span>
                        </p>
                        {activity.location && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 truncate">
                            <MapPin size={14} className="shrink-0 text-gray-400" />
                            {activity.location}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <EventStatusBadge status={eventStatus} />
                        <div className="flex gap-1.5">
                          {isSupervisor && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800 ring-1 ring-violet-200/80">
                              <ShieldCheck size={12} weight="duotone" />
                              Giám sát
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-900 ring-1 ring-primary-100">
                            <UsersThree size={12} weight="duotone" />
                            BTC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50/80 p-3 ring-1 ring-gray-100">
                      <div className="flex items-start gap-2">
                        <ListChecks size={16} className="mt-0.5 shrink-0 text-primary-900/60" weight="duotone" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-500">Nhiệm vụ</p>
                          <p className="text-xs font-semibold text-primary-900 tabular-nums">
                            {dashboard.tasks.length}
                            {pendingTasks > 0 && (
                              <span className="ml-1 font-medium text-amber-700">
                                ({pendingTasks} chưa nhận)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 justify-end text-right">
                        <CurrencyCircleDollar size={16} className="mt-0.5 shrink-0 text-primary-900/60" weight="duotone" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-500">Ngân sách</p>
                          <p className="text-xs font-semibold text-primary-900 tabular-nums truncate">
                            {report?.categories?.length
                              ? formatMoney(String(sumMoney(report.categories.map((c) => c.remainingAmount))))
                              : dashboard.financeMessage || 'Tài chính v2'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {myStudentId && myHolding > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                        <Wallet size={14} weight="duotone" />
                        Tiền đang giữ: {formatMoney(String(myHolding))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-end gap-1 text-xs font-semibold text-primary-900 opacity-0 transition-opacity group-hover:opacity-100">
                      Xem chi tiết
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

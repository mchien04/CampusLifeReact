import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  MagnifyingGlass,
  UserPlus,
  SpinnerGap,
  Warning,
  Crown,
  Trash,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { preparationAPI } from '../../services';
import { OrganizerDto, PreparationTaskDto, PreparationTaskMemberDto, WorkloadWarningDto } from '../../types';

type TaskMemberManagerProps = {
  task: PreparationTaskDto | null;
  organizers: OrganizerDto[];
  workloadWarnings: WorkloadWarningDto[];
  onChanged?: () => void;
};

export default function TaskMemberManager({ task, organizers, workloadWarnings, onChanged }: TaskMemberManagerProps) {
  const [members, setMembers] = useState<PreparationTaskMemberDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!task) {
      setMembers([]);
      return;
    }
    try {
      setLoading(true);
      const data = await preparationAPI.getTaskMembers(task.id);
      setMembers(data ?? []);
    } catch (e: any) {
      setMembers([]);
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const warningByStudentId = useMemo(() => {
    const map = new Map<number, WorkloadWarningDto>();
    (workloadWarnings ?? []).forEach((w) => {
      map.set(w.studentId, w);
    });
    return map;
  }, [workloadWarnings]);

  const memberIdSet = useMemo(() => {
    return new Set((members ?? []).map((m) => m.studentId));
  }, [members]);

  const filteredOrganizers = useMemo(() => {
    const source = organizers ?? [];
    const key = query.trim().toLowerCase();
    const filtered = key
      ? source.filter((o) => o.fullName.toLowerCase().includes(key))
      : source;

    return [...filtered].sort((a, b) => {
      const aInTask = memberIdSet.has(a.studentId) ? 1 : 0;
      const bInTask = memberIdSet.has(b.studentId) ? 1 : 0;
      if (aInTask !== bInTask) return aInTask - bInTask;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
  }, [organizers, query, memberIdSet]);

  const addMember = async (studentId: number) => {
    if (!task) return;
    if (memberIdSet.has(studentId)) {
      toast.info('Người này đã có trong nhiệm vụ');
      return;
    }
    try {
      setAdding(true);
      await preparationAPI.addTaskMember(task.id, studentId);
      toast.success('Đã thêm thành viên vào nhiệm vụ');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể thêm thành viên');
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (studentId: number) => {
    if (!task) return;
    if (!window.confirm('Xóa thành viên khỏi nhiệm vụ này?')) return;

    try {
      await preparationAPI.deleteTaskMember(task.id, studentId);
      toast.success('Đã xóa thành viên khỏi nhiệm vụ');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể xóa thành viên');
    }
  };

  const promoteLeader = async (studentId: number) => {
    if (!task) return;
    try {
      await preparationAPI.assignTaskLeader(task.id, studentId);
      toast.success('Đã gán quyền trưởng nhóm');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể gán trưởng nhóm');
    }
  };

  const demoteLeader = async (studentId: number) => {
    if (!task) return;
    try {
      await preparationAPI.removeTaskLeader(task.id, studentId);
      toast.success('Đã thu hồi quyền trưởng nhóm');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể thu hồi trưởng nhóm');
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-premium">
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-900">
            <Users size={22} weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-primary-900">Thành viên nhiệm vụ</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {task ? task.title : 'Chọn một nhiệm vụ để quản lý thành viên'}
            </p>
          </div>
        </div>

        {task ? (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
              <div className="px-4 py-3 bg-gray-50/80 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Danh sách thành viên</span>
                <span className="text-xs font-medium text-gray-400 tabular-nums">{members.length} người</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                  <SpinnerGap size={20} className="animate-spin text-primary-900/40" />
                  Đang tải...
                </div>
              ) : members.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Nhiệm vụ chưa có thành viên.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <div key={m.studentId} className="p-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 hover:bg-gray-50/50">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate" title={m.studentName || `#${m.studentId}`}>
                          {m.studentName || `#${m.studentId}`}
                        </div>
                        <div className="text-xs mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${
                              m.role === 'LEADER'
                                ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
                                : 'bg-gray-50 text-gray-700 ring-gray-200'
                            }`}
                          >
                            {m.role === 'LEADER' && <Crown size={12} weight="duotone" />}
                            {m.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 inline-flex items-center justify-end gap-2">
                        {m.role === 'LEADER' ? (
                          <button
                            type="button"
                            onClick={() => demoteLeader(m.studentId)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteLeader(m.studentId)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-primary-50 text-primary-900 ring-1 ring-primary-100 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/20"
                          >
                            Gán leader
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMember(m.studentId)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200/80 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
                        >
                          <Trash size={12} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm ban tổ chức</label>
                <div className="relative">
                  <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nhập tên ban tổ chức..."
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 overflow-hidden ring-1 ring-gray-100">
                <div className="px-4 py-3 bg-gray-50/80 text-sm font-semibold text-gray-700">
                  Ban tổ chức khả dụng
                </div>
                {filteredOrganizers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Không có thành viên ban tổ chức phù hợp.</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {filteredOrganizers.map((o) => {
                      const existed = memberIdSet.has(o.studentId);
                      const warning = warningByStudentId.get(o.studentId);
                      const isCurrentLeader = task.ownerId === o.studentId;
                      return (
                        <div key={o.studentId} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{o.fullName}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {isCurrentLeader && (
                                <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/80">
                                  <Crown size={11} weight="duotone" />
                                  Trưởng nhóm hiện tại
                                </span>
                              )}
                              {existed && (
                                <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-primary-50 text-primary-900 ring-1 ring-primary-100">
                                  Đã trong nhiệm vụ
                                </span>
                              )}
                              {warning && (
                                <span
                                  title={
                                    warning.type === 'OVERLOADED'
                                      ? 'Người này đang có nhiều nhiệm vụ, cần cân nhắc khi phân công thêm.'
                                      : 'Người này chưa được gán nhiệm vụ nào trong hoạt động hiện tại.'
                                  }
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${
                                    warning.type === 'OVERLOADED'
                                      ? 'bg-red-50 text-red-700 ring-red-200/80'
                                      : 'bg-amber-50 text-amber-800 ring-amber-200/80'
                                  }`}
                                >
                                  <Warning size={11} weight="duotone" />
                                  {warning.type === 'OVERLOADED'
                                    ? `Quá tải (${warning.taskCount} nhiệm vụ)`
                                    : 'Chưa gán nhiệm vụ'}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={existed || adding}
                            onClick={() => addMember(o.studentId)}
                            className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-primary-900 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/30"
                          >
                            <UserPlus size={16} weight="bold" />
                            {existed ? 'Đã thêm' : 'Thêm'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center text-sm text-gray-500">
            Chưa chọn nhiệm vụ.
          </div>
        )}
      </div>
    </div>
  );
}

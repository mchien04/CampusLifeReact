import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
      toast.error(e?.response?.data?.message || e?.message || 'Không thể tải danh sách member');
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
      toast.info('Người này đã có trong task');
      return;
    }
    try {
      setAdding(true);
      await preparationAPI.addTaskMember(task.id, studentId);
      toast.success('Đã thêm member vào task');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể thêm member');
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (studentId: number) => {
    if (!task) return;
    if (!window.confirm('Xóa member khỏi task này?')) return;

    try {
      await preparationAPI.deleteTaskMember(task.id, studentId);
      toast.success('Đã xóa member khỏi task');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể xóa member');
    }
  };

  const promoteLeader = async (studentId: number) => {
    if (!task) return;
    try {
      await preparationAPI.assignTaskLeader(task.id, studentId);
      toast.success('Đã gán quyền LEADER');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể gán LEADER');
    }
  };

  const demoteLeader = async (studentId: number) => {
    if (!task) return;
    try {
      await preparationAPI.removeTaskLeader(task.id, studentId);
      toast.success('Đã thu hồi quyền LEADER');
      await loadMembers();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không thể thu hồi LEADER');
    }
  };

  return (
    <div className="card">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#001C44]">Task Members</h3>
            <p className="text-sm text-gray-500 mt-1">
              {task ? `Task: ${task.title}` : 'Chọn một task để quản lý member'}
            </p>
          </div>
        </div>

        {task ? (
          <>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700">Danh sách member</div>
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Đang tải...</div>
              ) : members.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Task chưa có member.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {members.map((m) => (
                    <div key={m.studentId} className="p-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate" title={m.studentName || `#${m.studentId}`}>
                          {m.studentName || `#${m.studentId}`}
                        </div>
                        <div className="text-xs mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${m.role === 'LEADER'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                          >
                            {m.role}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 inline-flex items-center justify-end gap-2">
                        {m.role === 'LEADER' ? (
                          <button
                            type="button"
                            onClick={() => demoteLeader(m.studentId)}
                            className="w-20 px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 hover:bg-yellow-100"
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteLeader(m.studentId)}
                            className="w-20 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100"
                          >
                            Gán leader
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMember(m.studentId)}
                          className="w-16 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100"
                        >
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm organizer</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập tên organizer..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700">Danh sách organizer khả dụng</div>
                {filteredOrganizers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Không có organizer phù hợp.</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-200">
                    {filteredOrganizers.map((o) => {
                      const existed = memberIdSet.has(o.studentId);
                      const warning = warningByStudentId.get(o.studentId);
                      const isCurrentLeader = task.ownerId === o.studentId;
                      return (
                        <div key={o.studentId} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{o.fullName}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {isCurrentLeader && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Leader hiện tại
                                </span>
                              )}
                              {existed && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  Đã trong task
                                </span>
                              )}
                              {warning && (
                                <span
                                  title={warning.type === 'OVERLOADED' ? 'Người này đang có nhiều task, cần cân nhắc khi phân công thêm.' : 'Người này chưa được gán task nào trong activity hiện tại.'}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${warning.type === 'OVERLOADED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}
                                >
                                  {warning.type === 'OVERLOADED' ? `Cảnh báo: quá tải (${warning.taskCount} tasks)` : 'Cảnh báo: chưa gán task'}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={existed || adding}
                            onClick={() => addMember(o.studentId)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {existed ? 'Đã thêm' : 'Thêm vào task'}
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
          <div className="text-sm text-gray-500">Chưa chọn task.</div>
        )}
      </div>
    </div>
  );
}

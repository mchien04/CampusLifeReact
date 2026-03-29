import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { preparationAPI, studentAPI } from '../../services';
import { PreparationTaskDto, PreparationTaskMemberDto } from '../../types';

type StudentSearchResult = {
  id: number;
  fullName?: string;
  studentCode?: string;
  email?: string;
};

type TaskMemberManagerProps = {
  task: PreparationTaskDto | null;
  onChanged?: () => void;
};

export default function TaskMemberManager({ task, onChanged }: TaskMemberManagerProps) {
  const [members, setMembers] = useState<PreparationTaskMemberDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
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

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await studentAPI.searchStudents(query.trim());
        const list = (res?.status && res?.data?.content) ? res.data.content : [];
        setResults(list as StudentSearchResult[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const addMember = async () => {
    if (!task || !selectedStudentId) return;
    try {
      setAdding(true);
      await preparationAPI.addTaskMember(task.id, selectedStudentId);
      toast.success('Đã thêm member vào task');
      setQuery('');
      setResults([]);
      setSelectedStudentId(null);
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm sinh viên</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập tên hoặc mã sinh viên..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001C44] focus:border-[#001C44]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!selectedStudentId || adding}
                  onClick={addMember}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Đang thêm...' : 'Thêm member'}
                </button>
              </div>
            </div>

            {searching ? (
              <div className="text-sm text-gray-500">Đang tìm kiếm...</div>
            ) : results.length > 0 ? (
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                {results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full text-left p-3 transition-colors ${selectedStudentId === s.id ? 'bg-[#001C44]/5 border-l-4 border-[#001C44]' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{s.fullName || `#${s.id}`}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.studentCode || '-'} • {s.email || '-'}</div>
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="text-sm text-gray-500">Không tìm thấy sinh viên.</div>
            ) : null}

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700">Danh sách member</div>
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Đang tải...</div>
              ) : members.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Task chưa có member.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {members.map((m) => (
                    <div key={m.studentId} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{m.studentName || `#${m.studentId}`}</div>
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
                      <div className="flex items-center gap-2">
                        {m.role === 'LEADER' ? (
                          <button
                            type="button"
                            onClick={() => demoteLeader(m.studentId)}
                            className="px-3 py-1.5 text-sm font-medium bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100"
                          >
                            Thu hồi LEADER
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteLeader(m.studentId)}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100"
                          >
                            Gán LEADER
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(m.studentId)}
                        className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">Chưa chọn task.</div>
        )}
      </div>
    </div>
  );
}

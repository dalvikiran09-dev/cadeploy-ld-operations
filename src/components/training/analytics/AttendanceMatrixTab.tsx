import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Save, 
  RotateCcw,
  CheckCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { TrainingProgram, TrainingModule } from '../../../types/training';
import { TrainingBatch, BatchScheduleActivity, BatchNominee, TrainingAttendanceRecord, AttendanceStatus } from '../../../types/batch';
import { User } from '../../../types/index';
import { resolveEmployeeName, exportBatchToExcel } from '../../../utils/batchUtils';

interface Props {
  programs: TrainingProgram[];
  modules: TrainingModule[];
  batches: TrainingBatch[];
  schedules: BatchScheduleActivity[];
  nominees: BatchNominee[];
  attendance: TrainingAttendanceRecord[];
  users: User[];
  onSaveAttendance: (record: Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onBulkSaveAttendance?: (records: Array<Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export const AttendanceMatrixTab: React.FC<Props> = ({
  programs,
  modules,
  batches,
  schedules,
  nominees,
  attendance,
  users,
  onSaveAttendance,
  onBulkSaveAttendance
}) => {
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(batches[0]?.batchCode || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Batch object
  const activeBatch = batches.find(b => b.batchCode.toUpperCase() === selectedBatchCode.toUpperCase()) || batches[0];

  // Nominees for the active batch
  const batchNominees = useMemo(() => {
    if (selectedBatchCode === 'all') return nominees;
    return nominees.filter(n => 
      (n.batchCode && n.batchCode.toUpperCase() === selectedBatchCode.toUpperCase()) ||
      (activeBatch && n.batchId === activeBatch.id)
    );
  }, [nominees, selectedBatchCode, activeBatch]);

  // Schedules for the active batch
  const batchSchedules = useMemo(() => {
    if (selectedBatchCode === 'all') return schedules;
    return schedules.filter(s => 
      (s.batchCode && s.batchCode.toUpperCase() === selectedBatchCode.toUpperCase()) ||
      (activeBatch && s.batchId === activeBatch.id)
    );
  }, [schedules, selectedBatchCode, activeBatch]);

  // Filtered nominees by search
  const filteredNominees = useMemo(() => {
    return batchNominees.filter(n => {
      const name = resolveEmployeeName(n.employeeCode, users, n.employeeName);
      const q = searchTerm.toLowerCase();
      return n.employeeCode.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [batchNominees, users, searchTerm]);

  // Get unique module codes from schedules
  const scheduleModules = useMemo(() => {
    const list: Array<{ code: string; label: string; date: string }> = [];
    batchSchedules.forEach((s, idx) => {
      const mod = modules.find(m => m.moduleCode.toUpperCase() === s.moduleCode?.toUpperCase());
      list.push({
        code: s.moduleCode || `MOD-${idx + 1}`,
        label: mod?.moduleName || s.activity || `Session ${idx + 1}`,
        date: s.activityDate || ''
      });
    });
    // Fallback if no schedules
    if (list.length === 0 && modules.length > 0) {
      modules.slice(0, 5).forEach(m => {
        list.push({
          code: m.moduleCode,
          label: m.moduleName,
          date: 'Scheduled'
        });
      });
    }
    return list;
  }, [batchSchedules, modules]);

  // Handle cell status toggle
  const handleStatusToggle = async (empCode: string, moduleCode: string) => {
    const existing = attendance.find(a => 
      a.employeeCode.toUpperCase() === empCode.toUpperCase() && 
      a.moduleCode.toUpperCase() === moduleCode.toUpperCase() &&
      (!activeBatch || a.batchCode?.toUpperCase() === activeBatch.batchCode.toUpperCase() || a.batchId === activeBatch.id)
    );

    const statuses: AttendanceStatus[] = ['Attended', 'Late', 'Absent', 'Partial', 'Excused', 'Not Marked'];
    const currentStatus = existing?.status || 'Not Marked';
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    setIsUpdating(true);
    try {
      await onSaveAttendance({
        id: existing?.id,
        batchId: activeBatch?.id || '',
        batchCode: activeBatch?.batchCode || 'BTCH0000000001',
        employeeCode: empCode,
        moduleCode,
        status: nextStatus,
        reportedDatetime: (nextStatus === 'Attended' || nextStatus === 'Late') ? new Date().toISOString() : undefined,
        completedDatetime: nextStatus === 'Attended' ? new Date().toISOString() : undefined
      });
      setSuccessMsg(`Updated ${empCode} to ${nextStatus}`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Mark All Present for a given module session
  const handleMarkAllPresent = async (modCode: string) => {
    if (!onBulkSaveAttendance && !onSaveAttendance) return;
    setIsUpdating(true);
    try {
      const recordsToSave = filteredNominees.map(nom => ({
        batchId: activeBatch?.id || '',
        batchCode: activeBatch?.batchCode || 'BTCH0000000001',
        employeeCode: nom.employeeCode,
        moduleCode: modCode,
        status: 'Attended' as AttendanceStatus,
        reportedDatetime: new Date().toISOString(),
        completedDatetime: new Date().toISOString()
      }));

      if (onBulkSaveAttendance) {
        await onBulkSaveAttendance(recordsToSave);
      } else {
        for (const r of recordsToSave) {
          await onSaveAttendance(r);
        }
      }
      setSuccessMsg(`Marked all ${filteredNominees.length} attendees Present for ${modCode}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed bulk attendance mark:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (st: AttendanceStatus) => {
    switch (st) {
      case 'Attended':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-2xs inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Present
          </span>
        );
      case 'Late':
        return (
          <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded font-semibold text-2xs inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-600" />
            Late
          </span>
        );
      case 'Absent':
        return (
          <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded font-semibold text-2xs inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            Absent
          </span>
        );
      case 'Partial':
      case 'Excused':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold text-2xs">
            {st}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded font-medium text-2xs">
            Not Marked
          </span>
        );
    }
  };

  return (
    <div id="attendance-matrix-container" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                ATTENDANCE MATRIX & LOGGING
              </h3>
              <p className="text-xs text-slate-500">
                Interactive roster matrix — click any status cell to cycle through attendance states
              </p>
            </div>
          </div>
        </div>

        {/* Batch Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Batch:</span>
            <select
              value={selectedBatchCode}
              onChange={(e) => setSelectedBatchCode(e.target.value)}
              className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono font-medium"
            >
              {batches.map(b => (
                <option key={b.id} value={b.batchCode}>
                  {b.batchCode} ({b.programCode})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-44"
            />
          </div>

          {activeBatch && (
            <button
              type="button"
              onClick={() => exportBatchToExcel(activeBatch, batchSchedules, batchNominees, attendance, users)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matrix</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Matrix Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 w-44 border-r border-slate-200">
                Employee Details
              </th>
              {scheduleModules.map((mod) => (
                <th key={mod.code} className="py-3 px-3 text-center min-w-[130px] border-r border-slate-200">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-slate-800">{mod.code}</span>
                    <span className="text-3xs text-slate-500 line-clamp-1 font-normal">{mod.label}</span>
                    {mod.date && (
                      <span className="text-3xs text-slate-400 font-normal">{mod.date}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleMarkAllPresent(mod.code)}
                      disabled={isUpdating}
                      className="mt-1 px-1.5 py-0.5 text-3xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50"
                      title="Mark all nominees Present for this session"
                    >
                      All Present
                    </button>
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-right min-w-[100px]">
                Overall Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredNominees.length === 0 ? (
              <tr>
                <td colSpan={scheduleModules.length + 2} className="py-12 text-center text-slate-400">
                  No nominees found for this batch cohort.
                </td>
              </tr>
            ) : (
              filteredNominees.map((nom) => {
                const user = users.find(u => 
                  u.username?.toUpperCase() === nom.employeeCode.toUpperCase() || 
                  u.id === nom.employeeCode ||
                  u.name?.toUpperCase() === nom.employeeName?.toUpperCase()
                );
                const empName = nom.employeeName || user?.name || nom.employeeCode;
                const dept = user?.department || 'Operations';

                // Calculate employee overall attendance rate
                let attended = 0;
                scheduleModules.forEach(m => {
                  const rec = attendance.find(a => 
                    a.employeeCode.toUpperCase() === nom.employeeCode.toUpperCase() && 
                    a.moduleCode.toUpperCase() === m.code.toUpperCase()
                  );
                  if (rec?.status === 'Attended' || rec?.status === 'Late') attended++;
                });

                const rate = scheduleModules.length > 0 ? Math.round((attended / scheduleModules.length) * 100) : 0;

                return (
                  <tr key={nom.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Sticky Column */}
                    <td className="py-3 px-4 sticky left-0 bg-white hover:bg-slate-50/70 z-10 border-r border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 font-mono text-xs">{nom.employeeCode}</span>
                        <span className="text-slate-700 text-xs font-medium">{empName}</span>
                        <span className="text-3xs text-slate-400">{dept}</span>
                      </div>
                    </td>

                    {/* Module Session Status Cells */}
                    {scheduleModules.map((m) => {
                      const rec = attendance.find(a => 
                        a.employeeCode.toUpperCase() === nom.employeeCode.toUpperCase() && 
                        a.moduleCode.toUpperCase() === m.code.toUpperCase()
                      );
                      const status: AttendanceStatus = rec?.status || 'Not Marked';

                      return (
                        <td
                          key={m.code}
                          className="py-2.5 px-3 text-center border-r border-slate-200 hover:bg-blue-50/50 cursor-pointer transition-colors"
                          onClick={() => handleStatusToggle(nom.employeeCode, m.code)}
                          title="Click to toggle attendance status"
                        >
                          {getStatusBadge(status)}
                        </td>
                      );
                    })}

                    {/* Rate Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`font-bold text-xs ${
                        rate >= 80 ? 'text-emerald-700' : rate >= 50 ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

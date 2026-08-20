import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Download, 
  Filter,
  Layers
} from 'lucide-react';
import { useBatch } from '../../../context/BatchContext';
import { useTraining } from '../../../context/TrainingContext';
import { TrainingEmployee } from '../../../types/assessment';
import * as XLSX from 'xlsx';

interface EmployeeAttendanceTabProps {
  employee: TrainingEmployee;
}

export const EmployeeAttendanceTab: React.FC<EmployeeAttendanceTabProps> = ({
  employee
}) => {
  const { attendance = [], attendanceRecords = [], batches = [] } = useBatch();
  const { programs = [], modules = [] } = useTraining();
  const rawAttendance = attendance || attendanceRecords || [];

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');

  const empCode = (employee.employeeCode || '').toUpperCase();
  const empAttendance = (rawAttendance || []).filter(a => a.employeeCode && a.employeeCode.toUpperCase() === empCode);

  const presentCount = empAttendance.filter(a => a.status === 'Present').length;
  const absentCount = empAttendance.filter(a => a.status === 'Absent').length;
  const lateCount = empAttendance.filter(a => a.status === 'Late').length;
  const totalCount = empAttendance.length;
  const attRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredAttendance = empAttendance.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesBatch = filterBatch === 'all' || (a.batchCode && a.batchCode.toLowerCase() === filterBatch.toLowerCase());
    return matchesStatus && matchesBatch;
  });

  const handleExport = () => {
    const headers = ['Employee ID', 'Employee Name', 'Batch Code', 'Program', 'Module', 'Session Date', 'Status', 'Marked By', 'Remarks'];
    const rows = filteredAttendance.map(a => [
      a.employeeCode,
      a.employeeName || employee.employeeName,
      a.batchCode || '-',
      a.programName || a.programCode || '-',
      a.moduleName || a.moduleCode || '-',
      a.sessionDate,
      a.status,
      a.markedBy || '-',
      a.remarks || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `${employee.employeeCode}_Attendance_History.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Attendance Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{attRate}%</span>
            <span className="text-xs text-slate-500">overall</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Sessions Present</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Sessions Late</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateCount}</span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Sessions Absent</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{absentCount}</span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
        </div>
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Session Attendance Logs ({empAttendance.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified daily attendance records and training session participation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Attendance</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Session Date</th>
                <th className="p-3.5">Batch Code</th>
                <th className="p-3.5">Program & Module</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Marked By</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No attendance logs recorded for this employee.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {a.sessionDate}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {a.batchCode || '-'}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                        {a.programName || a.programCode || 'Training Program'}
                      </div>
                      {a.moduleName && (
                        <div className="text-2xs text-slate-500 truncate max-w-[220px]">
                          {a.moduleName} ({a.moduleCode})
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                        a.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : a.status === 'Late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {a.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : a.status === 'Late' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{a.status}</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {a.markedBy || '-'}
                    </td>

                    <td className="p-3.5 text-slate-500 italic max-w-[180px] truncate">
                      {a.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { 
  UserCheck, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { AttendanceAnalyticsSummary, ProgramAttendanceItem } from '../../../types/trainingAnalytics';

interface Props {
  attendanceSummary: AttendanceAnalyticsSummary;
  programAttendance: ProgramAttendanceItem[];
  onSelectProgram?: (programCode: string) => void;
}

export const AttendanceAnalyticsSection: React.FC<Props> = ({
  attendanceSummary,
  programAttendance,
  onSelectProgram
}) => {
  const chartData = [
    { name: 'Attended (On-Time)', value: attendanceSummary.presentCount, color: '#10B981', bg: 'bg-emerald-500' },
    { name: 'Late Arrival', value: attendanceSummary.lateCount, color: '#06B6D4', bg: 'bg-cyan-500' },
    { name: 'Absent', value: attendanceSummary.absentCount, color: '#EF4444', bg: 'bg-rose-500' },
    { name: 'Partial / Excused', value: attendanceSummary.partialCount + attendanceSummary.excusedCount, color: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'Not Marked', value: attendanceSummary.notMarkedCount, color: '#94A3B8', bg: 'bg-slate-400' }
  ].filter(d => d.value > 0);

  const totalRecords = attendanceSummary.totalRecords || 1;

  return (
    <div id="training-attendance-analytics-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              TRAINING ATTENDANCE & PARTICIPATION ANALYTICS
            </h3>
            <p className="text-xs text-slate-500">
              Verified attendance logs, punctuality rates and program-level attendance metrics
            </p>
          </div>
        </div>

        {/* Big Overall Rate Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-2xs font-semibold text-emerald-800 uppercase tracking-wider">Overall Attendance:</span>
          <span className="text-lg font-extrabold text-emerald-700">{attendanceSummary.attendanceRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Donut Chart & Breakdown Stats (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Donut Chart */}
          <div className="h-52 relative">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance logs found for selected period.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} sessions (${Math.round((Number(val) / totalRecords) * 100)}%)`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{attendanceSummary.totalRecords}</span>
                  <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Records</span>
                </div>
              </>
            )}
          </div>

          {/* Metric Pills Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-900 text-2xs font-medium">Attended</span>
              </div>
              <span className="font-bold text-emerald-800 text-xs">
                {attendanceSummary.presentCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-50/70 border border-cyan-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-cyan-900 text-2xs font-medium">Late Arrival</span>
              </div>
              <span className="font-bold text-cyan-800 text-xs">
                {attendanceSummary.lateCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-900 text-2xs font-medium">Absent</span>
              </div>
              <span className="font-bold text-rose-800 text-xs">
                {attendanceSummary.absentCount}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-700 text-2xs font-medium">Not Marked</span>
              </div>
              <span className="font-bold text-slate-800 text-xs">
                {attendanceSummary.notMarkedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance by Program Progress Bars (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attendance by Training Program
            </h4>
            <span className="text-2xs text-slate-400">Click to view program performance</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {programAttendance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No program attendance records found.
              </div>
            ) : (
              programAttendance.map((item) => (
                <div
                  key={item.programCode}
                  onClick={() => onSelectProgram?.(item.programCode)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors block">
                        {item.programName}
                      </span>
                      <span className="text-3xs text-slate-400 font-mono">
                        {item.programCode} • {item.batchesCount} batch(es) • {item.nomineesCount} nominees
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold ${
                        item.attendanceRate >= 80 ? 'text-emerald-700' : item.attendanceRate >= 50 ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        {item.attendanceRate}%
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.attendanceRate >= 80 ? 'bg-emerald-500' : item.attendanceRate >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, item.attendanceRate)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

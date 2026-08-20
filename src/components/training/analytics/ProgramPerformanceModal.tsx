import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Layers, 
  Users, 
  UserCheck, 
  Clock, 
  Award, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  User, 
  ExternalLink
} from 'lucide-react';
import { OngoingProgramItem } from '../../../types/trainingAnalytics';
import { TrainingProgram, TrainingModule, TrainingCourse } from '../../../types/training';
import { TrainingBatch, BatchScheduleActivity, BatchNominee, TrainingAttendanceRecord } from '../../../types/batch';
import { User as AppUser } from '../../../types/index';
import { parseDurationToMinutes, formatDurationDisplay } from '../../../utils/trainingUtils';

interface Props {
  programItem: OngoingProgramItem | null;
  onClose: () => void;
  programs: TrainingProgram[];
  modules: TrainingModule[];
  courses: TrainingCourse[];
  batches: TrainingBatch[];
  schedules: BatchScheduleActivity[];
  nominees: BatchNominee[];
  attendance: TrainingAttendanceRecord[];
  users: AppUser[];
}

export const ProgramPerformanceModal: React.FC<Props> = ({
  programItem,
  onClose,
  programs,
  modules,
  courses,
  batches,
  schedules,
  nominees,
  attendance,
  users
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'curriculum' | 'nominees'>('batches');

  if (!programItem) return null;

  const progCode = programItem.programCode;
  const programObj = programs.find(p => p.programCode.toUpperCase() === progCode.toUpperCase());
  const progName = programItem.programName || programObj?.programName || progCode;

  // Program's Batches
  const programBatches = batches.filter(b => b.programCode.toUpperCase() === progCode.toUpperCase());
  const programBatchCodes = new Set(programBatches.map(b => b.batchCode.toUpperCase()));

  // Program's Modules via Courses
  const programCourses = courses.filter(c => c.programCode.toUpperCase() === progCode.toUpperCase());
  const moduleCodes = new Set(programCourses.map(c => c.moduleCode.toUpperCase()));
  const programModules = modules.filter(m => moduleCodes.has(m.moduleCode.toUpperCase()));

  // Program's Nominees
  const programNominees = nominees.filter(n => 
    programBatchCodes.has(n.batchCode?.toUpperCase() || '') ||
    programBatches.some(b => b.id === n.batchId)
  );

  // Program's Attendance
  const programAttendance = attendance.filter(a => 
    programBatchCodes.has(a.batchCode?.toUpperCase() || '') ||
    programBatches.some(b => b.id === a.batchId)
  );

  const attendedCount = programAttendance.filter(a => a.status === 'Attended' || a.status === 'Late').length;
  const absentCount = programAttendance.filter(a => a.status === 'Absent').length;
  const markedCount = attendedCount + absentCount;
  const attRate = markedCount > 0 ? Math.round((attendedCount / markedCount) * 100) : 0;

  // Unique employees
  const uniqueEmps = new Set(programNominees.map(n => n.employeeCode.toUpperCase())).size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0 mt-0.5">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {progCode}
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {programObj?.status || 'Active'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{progName}</h2>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {programObj?.description || 'Training program curriculum and operational execution metrics'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 p-4 bg-slate-50 border-b border-slate-200/80 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Batches</span>
            <span className="text-base font-bold text-slate-900">{programBatches.length || 1}</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Nominees</span>
            <span className="text-base font-bold text-slate-900">{programNominees.length}</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Unique Trained</span>
            <span className="text-base font-bold text-teal-700">{uniqueEmps}</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Attendance Rate</span>
            <span className="text-base font-bold text-emerald-700">{attRate}%</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Total Hours</span>
            <span className="text-base font-bold text-orange-700">{programItem.totalHours} hrs</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/60">
            <span className="text-3xs font-semibold text-slate-500 uppercase block">Modules</span>
            <span className="text-base font-bold text-blue-700">{programModules.length || modules.length}</span>
          </div>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'batches'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Batches & Cohorts ({programBatches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'curriculum'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Curriculum & Modules ({programModules.length || modules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nominees')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'nominees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Nominee Roster ({programNominees.length})
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'batches' && (
            <div className="space-y-3">
              {programBatches.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No active batches recorded for this program.
                </div>
              ) : (
                programBatches.map((batch) => {
                  const bSchedules = schedules.filter(s => 
                    s.batchId === batch.id || 
                    s.batchCode?.toUpperCase() === batch.batchCode.toUpperCase()
                  );
                  const bNominees = nominees.filter(n => 
                    n.batchId === batch.id || 
                    n.batchCode?.toUpperCase() === batch.batchCode.toUpperCase()
                  );
                  const bAttendance = attendance.filter(a => 
                    a.batchId === batch.id || 
                    a.batchCode?.toUpperCase() === batch.batchCode.toUpperCase()
                  );

                  const bAttended = bAttendance.filter(a => a.status === 'Attended' || a.status === 'Late').length;
                  const bAbsent = bAttendance.filter(a => a.status === 'Absent').length;
                  const bRate = (bAttended + bAbsent) > 0 ? Math.round((bAttended / (bAttended + bAbsent)) * 100) : 0;

                  return (
                    <div key={batch.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-sm">{batch.batchCode}</span>
                          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-100 text-blue-800">
                            {batch.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-2xs text-slate-500">
                          <span>Facilitator: <strong>{batch.facilitatorCode || 'TBD'}</strong></span>
                          <span>Location: <strong>{batch.batchLocation}</strong></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-2xs">
                        <div>
                          <span className="text-slate-400 block">Nominees</span>
                          <span className="font-bold text-slate-800">{bNominees.length || batch.headCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Attendance Rate</span>
                          <span className="font-bold text-emerald-700">{bRate}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Sessions Scheduled</span>
                          <span className="font-bold text-slate-800">{bSchedules.length}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Created Date</span>
                          <span className="font-bold text-slate-800">{batch.batchCreatedDate || '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-3">
              {(programModules.length > 0 ? programModules : modules).map((mod) => (
                <div key={mod.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{mod.moduleCode}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-slate-800">{mod.moduleName}</span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1 line-clamp-1">
                      {mod.learningObjectives || 'Covers core competency objectives and practical hands-on exercises.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-2xs shrink-0">
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium">
                      {mod.duration ? formatDurationDisplay(mod.duration) : '1 hr'}
                    </span>
                    <span className="px-2 py-1 bg-blue-50 border border-blue-100 rounded text-blue-700 font-medium">
                      {mod.deliveryMode || 'Classroom'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'nominees' && (
            <div className="space-y-2">
              {programNominees.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No employee nominees registered under this program.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-2xs font-bold text-slate-500 uppercase">
                        <th className="py-2 px-3">Emp Code</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Batch</th>
                        <th className="py-2 px-3 text-right">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {programNominees.map((n) => {
                        const user = users.find(u => 
                          u.username?.toUpperCase() === n.employeeCode.toUpperCase() || 
                          u.id === n.employeeCode ||
                          u.name?.toUpperCase() === n.employeeName?.toUpperCase()
                        );
                        const empName = n.employeeName || user?.name || n.employeeCode;
                        const dept = user?.department || 'Operations';

                        const empAtt = programAttendance.filter(a => a.employeeCode.toUpperCase() === n.employeeCode.toUpperCase());
                        const attended = empAtt.filter(a => a.status === 'Attended' || a.status === 'Late').length;
                        const rate = empAtt.length > 0 ? Math.round((attended / empAtt.length) * 100) : 100;

                        return (
                          <tr key={n.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{n.employeeCode}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{empName}</td>
                            <td className="py-2 px-3 text-slate-500">{dept}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{n.batchCode}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">{rate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

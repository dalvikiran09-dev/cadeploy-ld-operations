import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Search, 
  Sparkles, 
  RotateCcw, 
  UserCheck, 
  MapPin, 
  User, 
  BookOpen, 
  Layers, 
  Check, 
  ShieldAlert,
  Loader2,
  Lock,
  GraduationCap
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';
import { useTraining } from '../../context/TrainingContext';
import { useAssessment } from '../../context/AssessmentContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  TrainingBatch, 
  BatchNominee, 
  TrainingAttendanceRecord, 
  AttendanceStatus 
} from '../../types/batch';
import { 
  resolveEmployeeDetails, 
  getTodayFormattedStrings, 
  formatCurrentTimeString,
  formatDisplayDate,
  parseAnyDate,
  normalizeAttendanceStatus
} from '../../utils/attendanceUtils';
import { canManageAttendance } from '../../utils/permissionUtils';

interface DailyAttendanceSheetProps {
  batchId: string;
  initialModuleCode?: string;
  initialSessionDate?: string;
  onBack: () => void;
}

export interface NomineeAttendanceDraft {
  employeeCode: string;
  status: AttendanceStatus;
  reportedDatetime: string;
  completedDatetime: string;
  remarks: string;
  existingId?: string;
  isModified: boolean;
}

export const DailyAttendanceSheet: React.FC<DailyAttendanceSheetProps> = ({
  batchId,
  initialModuleCode,
  initialSessionDate,
  onBack
}) => {
  const { 
    batches, 
    schedules, 
    nominees, 
    attendance, 
    saveAttendanceBatch, 
    isSyncing 
  } = useBatch();
  const { users, currentUser } = useApp();
  const { employees } = useAssessment();
  const { programs, modules, courses } = useTraining();

  const canEdit = canManageAttendance(currentUser?.role);

  const batch = useMemo(() => {
    return batches.find(b => b.id === batchId || (b.batchCode && b.batchCode.toUpperCase() === batchId.toUpperCase()));
  }, [batches, batchId]);

  const resolvedProgram = useMemo(() => {
    if (!batch) return null;
    return programs.find(p => p.programCode?.toUpperCase() === batch.programCode?.toUpperCase());
  }, [programs, batch]);

  // Batch schedules & nominees
  const batchSchedules = useMemo(() => {
    if (!batch) return [];
    return schedules.filter(s => s.batchId === batch.id || (batch.batchCode && s.batchCode === batch.batchCode));
  }, [schedules, batch]);

  const batchNominees = useMemo(() => {
    if (!batch) return [];
    return nominees.filter(n => n.batchId === batch.id || (batch.batchCode && n.batchCode === batch.batchCode));
  }, [nominees, batch]);

  // Available module options for this batch
  const moduleOptions = useMemo(() => {
    const list: Array<{ code: string; name: string }> = [];
    const seen = new Set<string>();

    batchSchedules.forEach(s => {
      if (s.moduleCode && s.moduleCode !== '-' && !seen.has(s.moduleCode.toUpperCase())) {
        seen.add(s.moduleCode.toUpperCase());
        const modObj = modules.find(m => m.moduleCode.toUpperCase() === s.moduleCode!.toUpperCase());
        list.push({
          code: s.moduleCode,
          name: modObj ? `${s.moduleCode} - ${modObj.moduleName}` : s.moduleCode
        });
      }
    });

    if (list.length === 0) {
      // Check program modules
      if (resolvedProgram) {
        const progMods = modules.filter(m => m.programId === resolvedProgram.id);
        progMods.forEach(m => {
          if (!seen.has(m.moduleCode.toUpperCase())) {
            seen.add(m.moduleCode.toUpperCase());
            list.push({ code: m.moduleCode, name: `${m.moduleCode} - ${m.moduleName}` });
          }
        });
      }
    }

    if (list.length === 0) {
      list.push({ code: 'MDL001', name: 'MDL001 - Core Session' });
    }

    return list;
  }, [batchSchedules, modules, resolvedProgram]);

  const { displayDate, isoDate } = getTodayFormattedStrings();

  // Active session parameters
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>(() => {
    if (initialModuleCode) return initialModuleCode;
    if (moduleOptions.length > 0) return moduleOptions[0].code;
    return 'MDL001';
  });

  const [selectedSessionDate, setSelectedSessionDate] = useState<string>(() => {
    if (initialSessionDate) return initialSessionDate;
    if (batchSchedules.length > 0 && batchSchedules[0].activityDate) {
      return formatDisplayDate(batchSchedules[0].activityDate.split(' ')[0]);
    }
    if (batch?.batchCreatedDate) {
      return formatDisplayDate(batch.batchCreatedDate);
    }
    return displayDate;
  });

  // Local draft state for attendance modifications
  const [drafts, setDrafts] = useState<Record<string, NomineeAttendanceDraft>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or reload draft records when batch/module/sessionDate changes or attendance updates
  useEffect(() => {
    if (!batch) return;

    // Pull attendance for this batch + module + sessionDate
    const currentRecords = attendance.filter(a => 
      (a.batchId === batch.id || (batch.batchCode && a.batchCode === batch.batchCode)) &&
      (a.moduleCode || '').toUpperCase() === selectedModuleCode.toUpperCase() &&
      (!a.sessionDate || a.sessionDate === selectedSessionDate)
    );

    const initialDrafts: Record<string, NomineeAttendanceDraft> = {};

    batchNominees.forEach(nom => {
      const codeKey = nom.employeeCode.toUpperCase();
      const existing = currentRecords.find(a => a.employeeCode.toUpperCase() === codeKey);

      initialDrafts[codeKey] = {
        employeeCode: nom.employeeCode,
        status: existing ? normalizeAttendanceStatus(existing.status) : 'Not Marked',
        reportedDatetime: existing?.reportedDatetime || '',
        completedDatetime: existing?.completedDatetime || '',
        remarks: existing?.remarks || '',
        existingId: existing?.id,
        isModified: false
      };
    });

    setDrafts(initialDrafts);
  }, [batch, batchNominees, attendance, selectedModuleCode, selectedSessionDate]);

  // Count metrics based on current drafts
  const metrics = useMemo(() => {
    let total = batchNominees.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let excused = 0;
    let notMarked = 0;

    (Object.values(drafts) as NomineeAttendanceDraft[]).forEach(d => {
      if (d.status === 'Present') present++;
      else if (d.status === 'Absent') absent++;
      else if (d.status === 'Late') late++;
      else if (d.status === 'Half Day') halfDay++;
      else if (d.status === 'Excused') excused++;
      else notMarked++;
    });

    const attended = present + late + halfDay;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    const hasUnsavedChanges = (Object.values(drafts) as NomineeAttendanceDraft[]).some(d => d.isModified);

    return { total, present, absent, late, halfDay, excused, notMarked, rate, hasUnsavedChanges };
  }, [batchNominees, drafts]);

  // Update a single draft row
  const handleUpdateDraft = (
    employeeCode: string, 
    field: keyof NomineeAttendanceDraft, 
    value: any
  ) => {
    if (!canEdit) return;
    const key = employeeCode.toUpperCase();
    setDrafts(prev => {
      const existing = prev[key] || {
        employeeCode,
        status: 'Not Marked',
        reportedDatetime: '',
        completedDatetime: '',
        remarks: '',
        isModified: false
      };

      const updated = {
        ...existing,
        [field]: value,
        isModified: true
      };

      // Auto set check-in time when marked Present or Late if empty
      if (field === 'status') {
        const newStatus = value as AttendanceStatus;
        if ((newStatus === 'Present' || newStatus === 'Late' || newStatus === 'Half Day') && !updated.reportedDatetime) {
          const nowStr = formatCurrentTimeString();
          updated.reportedDatetime = `${selectedSessionDate} ${nowStr}`;
        }
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    if (!canEdit) return;
    const nowStr = formatCurrentTimeString();
    const currentDateTime = `${selectedSessionDate} ${nowStr}`;

    setDrafts(prev => {
      const updated: Record<string, NomineeAttendanceDraft> = {};
      Object.keys(prev).forEach(key => {
        updated[key] = {
          ...prev[key],
          status: 'Present',
          reportedDatetime: prev[key].reportedDatetime || currentDateTime,
          isModified: true
        };
      });
      return updated;
    });

    setShowMarkAllModal(false);
  };

  // Clear / Reset to Not Marked
  const handleClearAllAttendance = () => {
    if (!canEdit) return;
    setDrafts(prev => {
      const updated: Record<string, NomineeAttendanceDraft> = {};
      Object.keys(prev).forEach(key => {
        updated[key] = {
          ...prev[key],
          status: 'Not Marked',
          reportedDatetime: '',
          completedDatetime: '',
          remarks: '',
          isModified: true
        };
      });
      return updated;
    });
  };

  // Save all attendance records directly to database
  const handleSaveAttendance = async () => {
    if (!batch) {
      setSaveErrorNotice('Selected batch does not exist in the database.');
      return;
    }
    if (!canEdit) {
      setSaveErrorNotice('You do not have permission to modify attendance records.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessNotice(null);
    setSaveErrorNotice(null);

    const recordsToSave: Array<Omit<TrainingAttendanceRecord, 'createdAt' | 'updatedAt'>> = [];

    (Object.values(drafts) as NomineeAttendanceDraft[]).forEach(d => {
      recordsToSave.push({
        id: d.existingId || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        batchId: batch.id,
        batchCode: batch.batchCode,
        employeeCode: d.employeeCode,
        moduleCode: selectedModuleCode,
        sessionDate: selectedSessionDate,
        status: d.status,
        reportedDatetime: d.reportedDatetime || undefined,
        completedDatetime: d.completedDatetime || undefined,
        remarks: d.remarks || undefined
      });
    });

    const res = await saveAttendanceBatch(recordsToSave);

    setIsSaving(false);
    if (res.success) {
      setSaveSuccessNotice(`Successfully saved attendance for ${recordsToSave.length} employees on ${selectedSessionDate}.`);
      // Reset modified flags
      setDrafts(prev => {
        const next: Record<string, NomineeAttendanceDraft> = {};
        Object.entries(prev).forEach(([k, v]) => {
          const item = v as NomineeAttendanceDraft;
          next[k] = { ...item, isModified: false };
        });
        return next;
      });
      setTimeout(() => setSaveSuccessNotice(null), 4500);
    } else {
      setSaveErrorNotice(res.error || 'Failed to save attendance records. Please try again.');
    }
  };

  // Filtered nominees list
  const filteredNominees = useMemo(() => {
    return batchNominees.filter(nom => {
      const details = resolveEmployeeDetails(nom.employeeCode, users, batchNominees);
      const codeKey = nom.employeeCode.toUpperCase();
      const draft = drafts[codeKey];

      // Status filter
      if (statusFilter !== 'ALL' && draft?.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = nom.employeeCode.toLowerCase().includes(q);
        const matchName = details.name.toLowerCase().includes(q);
        const matchDept = details.department.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDept) return false;
      }

      return true;
    });
  }, [batchNominees, users, drafts, statusFilter, searchQuery]);

  // Convert text date to input[type="date"] string or vice versa
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;
    const d = parseAnyDate(rawVal);
    if (d) {
      setSelectedSessionDate(formatDisplayDate(rawVal));
    } else {
      setSelectedSessionDate(rawVal);
    }
  };

  if (!batch) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Batch Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Selected batch does not exist in the database.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
        >
          Return to Attendance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card with Context Details */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Return to Batch-wise Attendance"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  {batch.batchCode}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  batch.status === 'In Progress' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  batch.status === 'Completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  batch.status === 'Planned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {batch.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">Batch Attendance Sheet</span>
                {!canEdit && (
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> View-Only Mode
                  </span>
                )}
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                {resolvedProgram?.programName || batch.programName || batch.programCode}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{batch.batchLocation || 'Hyderabad'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Facilitator: {batch.facilitatorCode || 'CE4490'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Program Code: {batch.programCode}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nominees: {batchNominees.length || batch.headCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Pickers: Module & Editable Date */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Module Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Session Module
              </label>
              <select
                value={selectedModuleCode}
                onChange={(e) => setSelectedModuleCode(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
              >
                {moduleOptions.map(m => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Editable Attendance Date Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Attendance Date (Editable)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={selectedSessionDate}
                    onChange={(e) => setSelectedSessionDate(e.target.value)}
                    placeholder="DD-MMM-YYYY"
                    className="text-xs font-semibold pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 w-36"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {/* HTML5 Native Date helper */}
                <input
                  type="date"
                  onChange={handleDateInputChange}
                  title="Pick a date from calendar"
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                />
              </div>
            </div>

            {/* Save Button */}
            {canEdit && (
              <div className="pt-4">
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving || isSyncing}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                    metrics.hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaving || isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Attendance</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success / Error Notices */}
        {saveSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {saveErrorNotice && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveErrorNotice}</span>
          </div>
        )}

        {/* Live Session KPIs for Selected Date */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nominees</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{metrics.total}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Present</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.present}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Absent</div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{metrics.absent}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Late</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{metrics.late}</div>
          </div>
          <div className="bg-sky-50 dark:bg-sky-950/30 p-3 rounded-xl border border-sky-100 dark:border-sky-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Half Day / Leave</div>
            <div className="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5">{metrics.halfDay + metrics.excused}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Attendance Rate</div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{metrics.rate}%</div>
          </div>
        </div>
      </div>

      {/* Action Bar: Fast Attendance Operations + Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Mark All Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button
                onClick={() => setShowMarkAllModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleClearAllAttendance}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Statuses</span>
              </button>
            </>
          )}

          {metrics.hasUnsavedChanges && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Unsaved changes on this date</span>
            </span>
          )}
        </div>

        {/* Right: Search & Status Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter chips */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['ALL', 'Present', 'Absent', 'Late', 'Not Marked'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 w-44"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Nominees Attendance Sheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredNominees.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Nominees Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {batchNominees.length === 0 
                ? "This batch has no nominated employees registered yet in public.training_batch_nominees."
                : "No nominees matched your search or status filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Attendance Status</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Check-In Time</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Check-Out Time</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNominees.map((nom, index) => {
                  const details = resolveEmployeeDetails(nom.employeeCode, employees, users);
                  const codeKey = nom.employeeCode.toUpperCase();
                  const draft = drafts[codeKey] || {
                    employeeCode: nom.employeeCode,
                    status: 'Not Marked',
                    reportedDatetime: '',
                    completedDatetime: '',
                    remarks: '',
                    isModified: false
                  };

                  return (
                    <tr 
                      key={nom.id || nom.employeeCode}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        draft.isModified ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Employee ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {nom.employeeCode}
                        </span>
                      </td>

                      {/* Name & Designation */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={details.name} size="md" className="w-7 h-7" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {details.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {details.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {details.department}
                      </td>

                      {/* Fast Status Toggle Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Present */}
                          <button
                            disabled={!canEdit}
                            onClick={() => handleUpdateDraft(nom.employeeCode, 'status', 'Present')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              draft.status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Present</span>
                          </button>

                          {/* Absent */}
                          <button
                            disabled={!canEdit}
                            onClick={() => handleUpdateDraft(nom.employeeCode, 'status', 'Absent')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              draft.status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Absent</span>
                          </button>

                          {/* Late */}
                          <button
                            disabled={!canEdit}
                            onClick={() => handleUpdateDraft(nom.employeeCode, 'status', 'Late')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                              draft.status === 'Late'
                                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Late</span>
                          </button>

                          {/* Half Day */}
                          <button
                            disabled={!canEdit}
                            onClick={() => handleUpdateDraft(nom.employeeCode, 'status', 'Half Day')}
                            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              draft.status === 'Half Day'
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50'
                            }`}
                          >
                            Half Day
                          </button>

                          {/* Excused */}
                          <button
                            disabled={!canEdit}
                            onClick={() => handleUpdateDraft(nom.employeeCode, 'status', 'Excused')}
                            className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              draft.status === 'Excused'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={draft.reportedDatetime}
                            onChange={(e) => handleUpdateDraft(nom.employeeCode, 'reportedDatetime', e.target.value)}
                            placeholder="e.g. 09:30"
                            className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 w-28 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                          />
                          {canEdit && (
                            <button
                              onClick={() => {
                                const time = formatCurrentTimeString();
                                handleUpdateDraft(nom.employeeCode, 'reportedDatetime', `${selectedSessionDate} ${time}`);
                              }}
                              className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded text-[10px] font-bold"
                              title="Set Check-In to Current Time"
                            >
                              Now
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={draft.completedDatetime}
                            onChange={(e) => handleUpdateDraft(nom.employeeCode, 'completedDatetime', e.target.value)}
                            placeholder="e.g. 17:30"
                            className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 w-28 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                          />
                          {canEdit && (
                            <button
                              onClick={() => {
                                const time = formatCurrentTimeString();
                                handleUpdateDraft(nom.employeeCode, 'completedDatetime', `${selectedSessionDate} ${time}`);
                              }}
                              className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded text-[10px] font-bold"
                              title="Set Check-Out to Current Time"
                            >
                              Now
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={draft.remarks}
                          onChange={(e) => handleUpdateDraft(nom.employeeCode, 'remarks', e.target.value)}
                          placeholder="Optional notes..."
                          className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 w-full disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Mark All Present */}
      {showMarkAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mark All Nominees as Present?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set status to Present for {batchNominees.length} nominees in {batch.batchCode} on {selectedSessionDate}.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div><strong className="text-slate-800 dark:text-white">Batch:</strong> {batch.batchCode} ({batch.programName || batch.programCode})</div>
              <div><strong className="text-slate-800 dark:text-white">Module:</strong> {selectedModuleCode}</div>
              <div><strong className="text-slate-800 dark:text-white">Date:</strong> {selectedSessionDate}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowMarkAllModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAllPresent}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
              >
                Confirm & Mark All Present
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

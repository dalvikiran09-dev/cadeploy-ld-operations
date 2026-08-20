import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Percent, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink,
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  RotateCcw,
  CheckCheck,
  BookOpen,
  Eye
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { 
  calculateBatchAttendanceStats, 
  exportBatchToExcel, 
  exportAttendanceReportToExcel, 
  formatBatchDateTime,
  formatBatchDateOnly,
  resolveEmployeeName
} from '../../utils/batchUtils';
import { AttendanceStatus, BatchScheduleActivity, BatchNominee } from '../../types/batch';
import { UserAvatar } from '../common/UserAvatar';
import { NomineeModal } from './NomineeModal';
import { ScheduleModal } from './ScheduleModal';
import { AttendanceDetailModal } from './AttendanceDetailModal';
import { BatchModal } from './BatchModal';

export const BatchDetailView: React.FC = () => {
  const { 
    selectedBatch, 
    setSelectedBatchId, 
    setActiveSubTab, 
    activeDetailTab, 
    setActiveDetailTab,
    getBatchNominees,
    getBatchSchedules,
    getBatchAttendance,
    removeNominee,
    deleteScheduleActivity,
    saveAttendanceRecord,
    bulkUpdateAttendance,
    resetBatchAttendance,
    deleteBatch
  } = useBatch();

  const { programs, modules } = useTraining();
  const { users, currentUser } = useApp();

  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canEdit = hasPermission(currentUser, 'TRAINING_EDIT');
  const canDelete = hasPermission(currentUser, 'TRAINING_DELETE');
  const canViewAttendance = hasPermission(currentUser, 'ATTENDANCE_VIEW') || hasPermission(currentUser, 'ATTENDANCE_MANAGE');
  const canManageAttendance = hasPermission(currentUser, 'ATTENDANCE_MANAGE');
  const canReports = hasPermission(currentUser, 'TRAINING_REPORTS_VIEW') || hasPermission(currentUser, 'TRAINING_VIEW');

  // Modals state
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [isAddNomineeOpen, setIsAddNomineeOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<BatchScheduleActivity | null>(null);

  // Selected cell for granular attendance modal
  const [attendanceModalCell, setAttendanceModalCell] = useState<{ empCode: string; modCode: string } | null>(null);

  // Bulk action confirmation dialog
  const [bulkConfirm, setBulkConfirm] = useState<{
    isOpen: boolean;
    moduleCode: string;
    action: 'present' | 'absent' | 'reset';
  } | null>(null);

  // Nominee removal confirmation dialog
  const [nomineeToRemove, setNomineeToRemove] = useState<BatchNominee | null>(null);

  // Filter for nominees search
  const [nomineeSearch, setNomineeSearch] = useState('');

  if (!selectedBatch) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Batch Selected</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please return to the batches list.</p>
        <button
          onClick={() => setActiveSubTab('list')}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
        >
          Return to Batches
        </button>
      </div>
    );
  }

  const batchNominees = getBatchNominees(selectedBatch.id);
  const batchSchedules = getBatchSchedules(selectedBatch.id);
  const batchAttendance = getBatchAttendance(selectedBatch.id);

  // Resolve matching program from Training Management
  const matchedProgram = programs.find(p => p.programCode?.toUpperCase() === selectedBatch.programCode?.toUpperCase());

  // Helper to resolve module name from Training Management
  const getModuleName = (moduleCode?: string) => {
    if (!moduleCode || moduleCode === '-') return '-';
    const found = modules.find(m => m.moduleCode?.toUpperCase() === moduleCode.toUpperCase());
    return found?.moduleName || 'Module details not found';
  };

  const stats = useMemo(() => {
    return calculateBatchAttendanceStats(
      selectedBatch.id,
      batchNominees,
      batchSchedules,
      batchAttendance
    );
  }, [selectedBatch.id, batchNominees, batchSchedules, batchAttendance]);

  const moduleCodes = useMemo(() => {
    return Array.from(new Set(
      batchSchedules
        .map(s => s.moduleCode)
        .filter((m): m is string => Boolean(m && m !== '-'))
    ));
  }, [batchSchedules]);

  const completedSessionsCount = batchSchedules.filter(s => s.status === 'Completed').length;
  const pendingSessionsCount = batchSchedules.filter(s => s.status !== 'Completed').length;

  const filteredNominees = batchNominees.filter(n => {
    const query = nomineeSearch.toLowerCase();
    const resolvedName = resolveEmployeeName(n.employeeCode, users, n.employeeName);
    return (
      n.employeeCode.toLowerCase().includes(query) ||
      resolvedName.toLowerCase().includes(query) ||
      (n.targetCompetencies && n.targetCompetencies.toLowerCase().includes(query)) ||
      (n.nominatorEmployeeCode && n.nominatorEmployeeCode.toLowerCase().includes(query))
    );
  });

  const handleBulkAttendanceExecute = async () => {
    if (!bulkConfirm) return;
    const { moduleCode, action } = bulkConfirm;

    if (action === 'present') {
      await bulkUpdateAttendance(selectedBatch.id, moduleCode, 'Attended');
    } else if (action === 'absent') {
      await bulkUpdateAttendance(selectedBatch.id, moduleCode, 'Absent');
    } else if (action === 'reset') {
      await resetBatchAttendance(selectedBatch.id, moduleCode);
    }
    setBulkConfirm(null);
  };

  const handleCellStatusQuickChange = async (empCode: string, modCode: string, newStatus: AttendanceStatus) => {
    await saveAttendanceRecord({
      batchId: selectedBatch.id,
      employeeCode: empCode,
      moduleCode: modCode,
      status: newStatus
    });
  };

  const handleConfirmRemoveNominee = async () => {
    if (!nomineeToRemove) return;
    await removeNominee(nomineeToRemove.id);
    setNomineeToRemove(null);
  };

  // Check headcount vs participants mismatch
  const headCountDiff = (selectedBatch.headCount || 0) - batchNominees.length;
  const hasHeadcountMismatch = selectedBatch.headCount > 0 && headCountDiff !== 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              setSelectedBatchId(null);
              setActiveSubTab('list');
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 mt-0.5"
            title="Back to Batches List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {selectedBatch.batchCode}
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                selectedBatch.status === 'Completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                  : selectedBatch.status === 'In Progress'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
              }`}>
                {selectedBatch.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {selectedBatch.programName || matchedProgram?.programName || selectedBatch.programCode}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Program: <strong>{selectedBatch.programCode}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Location: <strong>{selectedBatch.batchLocation}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Facilitator: <strong>{selectedBatch.facilitatorCode}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setIsEditBatchOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Batch</span>
            </button>
          )}
          {canReports && (
            <button
              onClick={() => exportBatchToExcel(selectedBatch, batchSchedules, batchNominees, batchAttendance, users)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Batch (.xlsx)</span>
            </button>
          )}
          {canViewAttendance && (
            <button
              onClick={() => setActiveDetailTab('attendance')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{canManageAttendance ? 'Mark Attendance' : 'View Attendance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Headcount Mismatch Warning (Requirement 2 & 23) */}
      {hasHeadcountMismatch && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Headcount vs Participant Roster Mismatch: </span>
              <span>
                Batch Head Count is <strong>{selectedBatch.headCount}</strong>, but actual participants roster has <strong>{batchNominees.length}</strong> employees. {headCountDiff > 0 ? `${headCountDiff} participant records are missing.` : `${Math.abs(headCountDiff)} extra participants are nominated.`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAddNomineeOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors"
          >
            + Add Missing Employees
          </button>
        </div>
      )}

      {/* 7 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Head Count & Participants */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Participants
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {batchNominees.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Target Head Count: {selectedBatch.headCount}
          </span>
        </div>

        {/* Present Records */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Present
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.presentCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {stats.lateCount > 0 ? `+ ${stats.lateCount} late` : 'Sessions attended'}
          </span>
        </div>

        {/* Absent Records */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Absent
          </span>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {stats.absentCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Missed sessions
          </span>
        </div>

        {/* Overall Attendance % */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Attendance Rate
          </span>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {stats.overallAttendanceRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                stats.overallAttendanceRate >= 80 ? 'bg-emerald-500' : stats.overallAttendanceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${stats.overallAttendanceRate}%` }}
            />
          </div>
        </div>

        {/* Modules Count */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Modules
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {moduleCodes.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Curriculum linked
          </span>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Completed
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {completedSessionsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Delivered activities
          </span>
        </div>

        {/* Pending Sessions */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pending
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {pendingSessionsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            To be completed
          </span>
        </div>
      </div>

      {/* Main Detail Navigation Tabs (6 TABS) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" />, visible: true },
          { id: 'employees', label: `Employees (${batchNominees.length})`, icon: <Users className="w-4 h-4" />, visible: true },
          { id: 'schedule', label: `Schedule (${batchSchedules.length})`, icon: <Calendar className="w-4 h-4" />, visible: true },
          { id: 'modules', label: `Modules (${moduleCodes.length})`, icon: <BookOpen className="w-4 h-4" />, visible: true },
          { id: 'attendance', label: 'Attendance Matrix', icon: <CheckCircle2 className="w-4 h-4" />, visible: canViewAttendance },
          { id: 'export', label: 'Export & Reports', icon: <Download className="w-4 h-4" />, visible: canReports }
        ].filter(tab => tab.visible).map(tab => {
          const isActive = activeDetailTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeDetailTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Metadata Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Training Batch Information</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Code</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedBatch.batchCode}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Program Code</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedBatch.programCode}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Schedule Code</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedBatch.scheduleCode || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Location</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedBatch.batchLocation}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Facilitator</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedBatch.facilitatorCode}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Created Date</span>
                  <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {formatBatchDateOnly(selectedBatch.batchCreatedDate)}
                  </span>
                </div>
              </div>

              {/* Dates grid */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Requested Date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatBatchDateOnly(selectedBatch.programRequestedDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Accepted Date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatBatchDateOnly(selectedBatch.programRequestAcceptedDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Requested Start:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatBatchDateOnly(selectedBatch.programRequestedStartDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Proposed Start:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatBatchDateOnly(selectedBatch.programProposedStartDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Program Information (Requirement 3) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Program Details (from Training Management)</span>
              </h3>
              {matchedProgram ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                    <div className="font-bold text-sm text-purple-900 dark:text-purple-200">
                      {matchedProgram.programName}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      {matchedProgram.description || 'No detailed description provided.'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{matchedProgram.category || 'General'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{matchedProgram.durationHours ? `${matchedProgram.durationHours} Hours` : 'Flexible'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Competency</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{matchedProgram.targetCompetency || 'Technical & Operational'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Program code <strong>{selectedBatch.programCode}</strong> is not currently registered in Training Management.
                </div>
              )}
            </div>

            {/* Schedule Snapshot */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Schedule Timeline ({batchSchedules.length})</span>
                </h3>
                <button
                  onClick={() => setActiveDetailTab('schedule')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Manage Schedule →
                </button>
              </div>

              {batchSchedules.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No schedule activities configured for this batch yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {batchSchedules.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{s.activity}</div>
                          <div className="text-[10px] text-slate-400">
                            {s.activityDate} • Module: {s.moduleCode} ({getModuleName(s.moduleCode)})
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        s.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Attendance & Nominees Quick Snapshot */}
          <div className="space-y-6">
            {/* Module-wise Attendance Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Module-wise Attendance</span>
              </h3>
              {stats.moduleBreakdown.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No modules linked in schedule yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.moduleBreakdown.map(mod => (
                    <div key={mod.moduleCode} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{mod.moduleCode}</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{mod.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div 
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${mod.attendanceRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Present: <strong>{mod.present}</strong></span>
                        <span>Absent: <strong>{mod.absent}</strong></span>
                        <span>Total: <strong>{mod.totalExpected}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Nominees list snapshot */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Participants ({batchNominees.length})</span>
                </h3>
                <button
                  onClick={() => setIsAddNomineeOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  + Add Employee
                </button>
              </div>
              <div className="space-y-2">
                {batchNominees.slice(0, 6).map(n => {
                  const empName = resolveEmployeeName(n.employeeCode, users, n.employeeName);
                  return (
                    <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{n.employeeCode}</span>
                        {empName && <span className="text-[10px] text-slate-400 block">{empName}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">{n.targetCompetencies || 'Nominated'}</span>
                    </div>
                  );
                })}
                {batchNominees.length > 6 && (
                  <button
                    onClick={() => setActiveDetailTab('employees')}
                    className="w-full py-1 text-center text-xs text-slate-500 hover:text-blue-600 font-semibold"
                  >
                    + View all {batchNominees.length} employees
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: EMPLOYEES / PARTICIPANTS */}
      {activeDetailTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={nomineeSearch}
                onChange={e => setNomineeSearch(e.target.value)}
                placeholder="Search by Employee ID, Name, or Competency..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {(canCreate || canEdit) && (
                <button
                  onClick={() => setIsAddNomineeOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Employee</span>
                </button>
              )}
            </div>
          </div>

          {filteredNominees.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Participants Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Add corporate employees (e.g. CE803, CE1885, CE2224) to this batch to build the roster and track attendance.
              </p>
              {(canCreate || canEdit) && (
                <button
                  onClick={() => setIsAddNomineeOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs cursor-pointer"
                >
                  + Add Employee
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Nominated By</th>
                      <th className="py-3 px-4">Nomination Date/Time</th>
                      <th className="py-3 px-4">Target Competency / KPI</th>
                      <th className="py-3 px-4">Current Level</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      {canDelete && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredNominees.map(n => {
                      const empStats = stats.nomineeBreakdown[n.employeeCode];
                      const rate = empStats?.rate ?? 0;
                      const empName = resolveEmployeeName(n.employeeCode, users, n.employeeName);

                      return (
                        <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {n.employeeCode}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={empName || n.employeeCode} size="sm" className="w-6 h-6" />
                              <div>
                                {empName ? (
                                  <span className="font-bold">{empName}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned Name</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {n.nominatorEmployeeCode || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {n.nominationDatetime || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {n.targetCompetencies || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {n.currentLevels || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              rate >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : rate >= 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                          {canDelete && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setNomineeToRemove(n)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Remove Nominee (Admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: BATCH SCHEDULE (Requirement 11 & 12) */}
      {activeDetailTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Batch Activities & Delivery Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage delivery sessions, reviews, and assessment milestones</p>
            </div>
            {(canCreate || canEdit) && (
              <button
                onClick={() => {
                  setScheduleToEdit(null);
                  setIsScheduleModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Schedule Activity</span>
              </button>
            )}
          </div>

          {batchSchedules.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Schedule Activities</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Add delivery sessions or milestones to this batch to build the curriculum timeline.
              </p>
              {(canCreate || canEdit) && (
                <button
                  onClick={() => {
                    setScheduleToEdit(null);
                    setIsScheduleModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs cursor-pointer"
                >
                  + Add Schedule Activity
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Activity Date</th>
                      <th className="py-3 px-4">Activity Description</th>
                      <th className="py-3 px-4">Module Code</th>
                      <th className="py-3 px-4">Module Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Arrangements</th>
                      {(canEdit || canDelete) && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {batchSchedules.map(s => {
                      const modName = getModuleName(s.moduleCode);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {s.activityDate}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {s.activity}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {s.moduleCode || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {modName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Completed' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                                : s.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                              s.arrangements === 'Completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {s.arrangements}
                            </span>
                          </td>
                          {(canEdit || canDelete) && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setScheduleToEdit(s);
                                      setIsScheduleModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                    title="Edit Activity"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => deleteScheduleActivity(s.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete Activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: MODULES / SESSIONS (Requirement 9 & 10) */}
      {activeDetailTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curriculum Modules & Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modules linked to this training batch from curriculum schedule and training management
              </p>
            </div>
            {(canCreate || canEdit) && (
              <button
                onClick={() => {
                  setScheduleToEdit(null);
                  setIsScheduleModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Module Activity</span>
              </button>
            )}
          </div>

          {moduleCodes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Modules Linked to Batch</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Add schedule activities with valid module codes (e.g. MDL0000000001) to link modules to this batch.
              </p>
              {(canCreate || canEdit) && (
                <button
                  onClick={() => {
                    setScheduleToEdit(null);
                    setIsScheduleModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs cursor-pointer"
                >
                  + Add Schedule Module
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Module Code</th>
                      <th className="py-3 px-4">Module Name</th>
                      <th className="py-3 px-4">Scheduled Date / Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Attendance Count</th>
                      <th className="py-3 px-4 text-center">Rate %</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {moduleCodes.map(modCode => {
                      const modName = getModuleName(modCode);
                      const schedule = batchSchedules.find(s => s.moduleCode === modCode);
                      const modAttendance = batchAttendance.filter(a => a.moduleCode.toUpperCase() === modCode.toUpperCase());
                      const present = modAttendance.filter(a => a.status === 'Attended' || a.status === 'Late').length;
                      const absent = modAttendance.filter(a => a.status === 'Absent').length;
                      const totalExpected = batchNominees.length || 1;
                      const rate = Math.round((present / totalExpected) * 100);

                      return (
                        <tr key={modCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {modCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {modName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {schedule?.activityDate || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              schedule?.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                            }`}>
                              {schedule?.status || 'Scheduled'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {present} / {batchNominees.length}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({absent} absent)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              rate >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : rate >= 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canManageAttendance && (
                                <button
                                  onClick={() => setBulkConfirm({ isOpen: true, moduleCode: modCode, action: 'present' })}
                                  className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  All Present
                                </button>
                              )}
                              {canViewAttendance && (
                                <button
                                  onClick={() => setActiveDetailTab('attendance')}
                                  className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  View in Matrix
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: ATTENDANCE MATRIX (THE CORE OPERATIONAL FUNCTION) */}
      {activeDetailTab === 'attendance' && (
        <div className="space-y-6">
          {/* Top Attendance Stats Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Attendance Matrix — Batch {selectedBatch.batchCode}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record employee attendance across all curriculum modules. Click any cell to update status or detailed timestamps.
                </p>
              </div>

              {/* Attendance Export Shortcut */}
              {canReports && (
                <button
                  onClick={() => exportAttendanceReportToExcel(selectedBatch, batchNominees, batchSchedules, batchAttendance, users)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Export Attendance Report (.xlsx)</span>
                </button>
              )}
            </div>

            {/* Attendance Top KPI numbers (Requirement 13) */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Employees</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{batchNominees.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Modules</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{moduleCodes.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Expected Records</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{stats.totalExpected}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Attended</span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.presentCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Absent</span>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.absentCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Not Marked</span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.notMarkedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Rate %</span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.overallAttendanceRate}%</div>
              </div>
            </div>
          </div>

          {/* Module-wise Bulk Controls Toolbar (Requirement 18) */}
          {canManageAttendance && moduleCodes.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-bold">
                <span>Quick Bulk Actions for Modules:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {moduleCodes.map(mod => (
                  <div key={mod} className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    <span className="font-mono font-bold px-2 py-0.5 text-slate-700 dark:text-slate-300">{mod}:</span>
                    <button
                      onClick={() => setBulkConfirm({ isOpen: true, moduleCode: mod, action: 'present' })}
                      className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                      title={`Mark all participants present for ${mod}`}
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => setBulkConfirm({ isOpen: true, moduleCode: mod, action: 'absent' })}
                      className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                      title={`Mark all participants absent for ${mod}`}
                    >
                      All Absent
                    </button>
                    <button
                      onClick={() => setBulkConfirm({ isOpen: true, moduleCode: mod, action: 'reset' })}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={`Reset attendance for ${mod}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Matrix Table */}
          {batchNominees.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Participants to Mark Attendance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Please add employee nominees to this batch first to render the attendance matrix.
              </p>
              <button
                onClick={() => setIsAddNomineeOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs"
              >
                + Add Employees
              </button>
            </div>
          ) : moduleCodes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Modules Scheduled</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Please add schedule activities linked to modules (e.g. MDL0000000001) to create the matrix columns.
              </p>
              <button
                onClick={() => {
                  setScheduleToEdit(null);
                  setIsScheduleModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-xs"
              >
                + Add Schedule Module
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 min-w-[160px]">
                        Participant
                      </th>
                      {moduleCodes.map(mod => (
                        <th key={mod} className="py-3.5 px-4 text-center min-w-[160px]">
                          <span className="font-mono text-blue-600 dark:text-blue-400 block">{mod}</span>
                          <span className="text-[10px] font-normal text-slate-400 block truncate max-w-[150px]">
                            {getModuleName(mod)}
                          </span>
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-center font-extrabold min-w-[100px]">
                        Overall %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {batchNominees.map(nom => {
                      const empStats = stats.nomineeBreakdown[nom.employeeCode];
                      const rate = empStats?.rate ?? 0;
                      const empName = resolveEmployeeName(nom.employeeCode, users, nom.employeeName);

                      return (
                        <tr key={nom.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <UserAvatar name={empName || nom.employeeCode} size="sm" className="w-6 h-6" />
                              <div>
                                <span className="font-mono text-blue-600 dark:text-blue-400 block text-xs">{nom.employeeCode}</span>
                                {empName ? (
                                  <span className="text-[10px] text-slate-400 font-normal block truncate max-w-[120px]">{empName}</span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {moduleCodes.map(mod => {
                            const record = batchAttendance.find(
                              a => a.employeeCode.toUpperCase() === nom.employeeCode.toUpperCase() && 
                                   a.moduleCode.toUpperCase() === mod.toUpperCase()
                            );
                            const currentStatus: AttendanceStatus = record ? record.status : 'Not Marked';

                            return (
                              <td key={mod} className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  {/* Status Selector dropdown (Requirement 14) */}
                                  <select
                                    value={currentStatus}
                                    disabled={!canManageAttendance}
                                    onChange={e => handleCellStatusQuickChange(nom.employeeCode, mod, e.target.value as AttendanceStatus)}
                                    className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-all ${
                                      !canManageAttendance ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                                    } ${
                                      currentStatus === 'Attended'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                                        : currentStatus === 'Absent'
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                                        : currentStatus === 'Late'
                                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                        : currentStatus === 'Partial'
                                        ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800'
                                        : currentStatus === 'Excused'
                                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                    }`}
                                  >
                                    <option value="Attended">Attended</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Excused">Excused</option>
                                    <option value="Not Marked">Not Marked</option>
                                  </select>

                                  {/* Detailed Edit button */}
                                  <button
                                    onClick={() => setAttendanceModalCell({ empCode: nom.employeeCode, modCode: mod })}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title={canManageAttendance ? "Edit Detailed Timestamps & Remarks" : "View Attendance Details"}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-center font-extrabold">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              rate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : rate >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module-Level Attendance Summary Table (Requirement 19) */}
          {moduleCodes.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Module-Level Attendance Summary</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Module Code</th>
                      <th className="py-3 px-4">Module Name</th>
                      <th className="py-3 px-4 text-center">Total Participants</th>
                      <th className="py-3 px-4 text-center">Present</th>
                      <th className="py-3 px-4 text-center">Absent</th>
                      <th className="py-3 px-4 text-center">Not Marked</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {stats.moduleBreakdown.map(mod => {
                      const modName = getModuleName(mod.moduleCode);
                      return (
                        <tr key={mod.moduleCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {mod.moduleCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {modName}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {mod.totalExpected}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {mod.present}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                            {mod.absent}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-400">
                            {mod.notMarked}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              mod.attendanceRate >= 80 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                                : mod.attendanceRate >= 50 
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' 
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}>
                              {mod.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: EXPORT & REPORTS (Requirement 24, 25, 26) */}
      {activeDetailTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Export Complete Batch Workbook (5 Sheets) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Export Complete Batch Workbook (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                Generates a multi-tab Microsoft Excel workbook matching the exact format of <strong>BTCH0000000002.xlsx</strong>, containing all 5 core sheets:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>Sheet 1:</strong> BatchData (Batch details & dates)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>Sheet 2:</strong> NominationData (Participant roster & competencies)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>Sheet 3:</strong> BatchSchedule (Delivery sessions & milestones)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>Sheet 4:</strong> Attendance (Detailed attendance records & timestamps)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>Sheet 5:</strong> Attendance Summary (Employee attendance rates & counts)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => exportBatchToExcel(selectedBatch, batchSchedules, batchNominees, batchAttendance, users)}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Batch Workbook (.xlsx)</span>
            </button>
          </div>

          {/* Card 2: Export Dedicated Attendance Report */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Export Attendance Matrix & Logs (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                Downloads an attendance audit report featuring the complete cross-tabulation matrix (Employee × Module), computed percentage rates, and granular attendance timestamps.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-6 space-y-1 text-slate-600 dark:text-slate-400">
                <div>Total Expected Records: <strong>{stats.totalExpected}</strong></div>
                <div>Overall Attendance Rate: <strong>{stats.overallAttendanceRate}%</strong></div>
              </div>
            </div>
            <button
              onClick={() => exportAttendanceReportToExcel(selectedBatch, batchNominees, batchSchedules, batchAttendance, users)}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Attendance Report (.xlsx)</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BatchModal
        isOpen={isEditBatchOpen}
        batchToEdit={selectedBatch}
        onClose={() => setIsEditBatchOpen(false)}
      />

      <NomineeModal
        batchId={selectedBatch.id}
        isOpen={isAddNomineeOpen}
        onClose={() => setIsAddNomineeOpen(false)}
      />

      <ScheduleModal
        batchId={selectedBatch.id}
        isOpen={isScheduleModalOpen}
        activityToEdit={scheduleToEdit}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
        }}
      />

      {attendanceModalCell && (
        <AttendanceDetailModal
          batchId={selectedBatch.id}
          employeeCode={attendanceModalCell.empCode}
          moduleCode={attendanceModalCell.modCode}
          isOpen={Boolean(attendanceModalCell)}
          readOnly={!canManageAttendance}
          onClose={() => setAttendanceModalCell(null)}
        />
      )}

      {/* Bulk Action Confirmation Dialog (Requirement 18) */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Bulk Attendance Action</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-5">
              {bulkConfirm.action === 'present' && `Mark all ${batchNominees.length} participants as Present for module ${bulkConfirm.moduleCode}?`}
              {bulkConfirm.action === 'absent' && `Mark all ${batchNominees.length} participants as Absent for module ${bulkConfirm.moduleCode}?`}
              {bulkConfirm.action === 'reset' && `Reset all attendance records to 'Not Marked' for module ${bulkConfirm.moduleCode}?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBulkConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAttendanceExecute}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nominee Removal Confirmation Dialog (Requirement 8) */}
      {nomineeToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Remove {nomineeToRemove.employeeCode} from {selectedBatch.batchCode}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-5">
              This employee has attendance records for this batch. Removing the employee may affect attendance history.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setNomineeToRemove(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveNominee}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

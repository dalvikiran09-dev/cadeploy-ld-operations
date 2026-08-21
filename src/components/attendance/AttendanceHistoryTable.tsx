import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Layers, 
  Building, 
  User, 
  Shield, 
  Save, 
  X,
  ExternalLink,
  GraduationCap,
  Award,
  UserCheck,
  Check
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';
import { useTraining } from '../../context/TrainingContext';
import { useAssessment } from '../../context/AssessmentContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  TrainingAttendanceRecord, 
  AttendanceStatus 
} from '../../types/batch';
import { 
  resolveEmployeeDetails, 
  exportAttendanceToExcel, 
  normalizeAttendanceStatus,
  formatDisplayDate,
  getEmployeeAttendanceHistory
} from '../../utils/attendanceUtils';
import { canManageAttendance, canDeleteTraining } from '../../utils/permissionUtils';

interface AttendanceHistoryTableProps {
  onOpenBatchSheet?: (batchId: string, moduleCode?: string, sessionDate?: string) => void;
}

export const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({
  onOpenBatchSheet
}) => {
  const { 
    attendance, 
    batches, 
    nominees, 
    deleteAttendanceRecord, 
    bulkDeleteAttendance, 
    saveAttendanceRecord,
    isSyncing 
  } = useBatch();
  const { users, currentUser } = useApp();
  const { employees } = useAssessment();
  const { programs, courses, modules } = useTraining();

  const isAdmin = currentUser?.role === 'Administrator';
  const canEdit = canManageAttendance(currentUser?.role);

  // Filters State
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('ALL');
  const [selectedProgramCode, setSelectedProgramCode] = useState<string>('ALL');
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dedicated Employee Profile Filter
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<string>('');

  // Bulk Selection State (Admin only)
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TrainingAttendanceRecord | null>(null);

  // Edit Single Record Modal State
  const [editingRecord, setEditingRecord] = useState<TrainingAttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Present');
  const [editCheckIn, setEditCheckIn] = useState<string>('');
  const [editCheckOut, setEditCheckOut] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);

  // Available Batch Options
  const batchOptions = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => { if (b.batchCode) set.add(b.batchCode); });
    attendance.forEach(a => { if (a.batchCode) set.add(a.batchCode); });
    return Array.from(set).sort();
  }, [batches, attendance]);

  // Available Program Options
  const programOptions = useMemo(() => {
    const map = new Map<string, string>();
    programs.forEach(p => map.set(p.programCode, p.programName));
    batches.forEach(b => {
      if (b.programCode && !map.has(b.programCode)) {
        map.set(b.programCode, b.programName || b.programCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [programs, batches]);

  // Available Employee List for Quick Profile Selection
  const allEmployeesList = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => {
      if (u.username) map.set(u.username.toUpperCase(), u.name);
    });
    nominees.forEach(n => {
      if (n.employeeCode) {
        const key = n.employeeCode.toUpperCase();
        if (!map.has(key)) map.set(key, n.employeeName || n.employeeCode);
      }
    });
    attendance.forEach(a => {
      if (a.employeeCode) {
        const key = a.employeeCode.toUpperCase();
        if (!map.has(key)) map.set(key, a.employeeCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [users, nominees, attendance]);

  // Enriched and Filtered Attendance Records
  const filteredRecords = useMemo(() => {
    return attendance.filter(rec => {
      // 1. Employee Profile quick filter
      if (selectedEmployeeProfile) {
        if (rec.employeeCode.toUpperCase() !== selectedEmployeeProfile.toUpperCase()) {
          return false;
        }
      }

      // 2. Batch Filter
      if (selectedBatchCode !== 'ALL') {
        const matchBatch = (rec.batchCode && rec.batchCode.toUpperCase() === selectedBatchCode.toUpperCase()) ||
          batches.some(b => b.id === rec.batchId && b.batchCode.toUpperCase() === selectedBatchCode.toUpperCase());
        if (!matchBatch) return false;
      }

      // 3. Program Filter
      if (selectedProgramCode !== 'ALL') {
        const batch = batches.find(b => b.id === rec.batchId || b.batchCode === rec.batchCode);
        if (!batch || batch.programCode.toUpperCase() !== selectedProgramCode.toUpperCase()) {
          return false;
        }
      }

      // 4. Module Filter
      if (selectedModuleCode !== 'ALL' && rec.moduleCode.toUpperCase() !== selectedModuleCode.toUpperCase()) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'ALL' && normalizeAttendanceStatus(rec.status) !== selectedStatus) {
        return false;
      }

      // 6. Date Filter
      if (selectedDate.trim()) {
        const qDate = selectedDate.trim().toLowerCase();
        const recDate = (rec.sessionDate || formatDisplayDate(rec.createdAt) || '').toLowerCase();
        if (!recDate.includes(qDate)) return false;
      }

      // 7. Department & Search Filter
      const details = resolveEmployeeDetails(rec.employeeCode, users, nominees);

      if (selectedDepartment !== 'ALL' && details.department.toLowerCase() !== selectedDepartment.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = rec.employeeCode.toLowerCase().includes(q);
        const matchName = details.name.toLowerCase().includes(q);
        const matchBatchCode = (rec.batchCode || '').toLowerCase().includes(q);
        const matchMod = rec.moduleCode.toLowerCase().includes(q);
        const matchRemarks = (rec.remarks || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchBatchCode && !matchMod && !matchRemarks) return false;
      }

      return true;
    });
  }, [
    attendance, 
    batches, 
    users, 
    nominees, 
    selectedEmployeeProfile,
    selectedBatchCode, 
    selectedProgramCode, 
    selectedModuleCode, 
    selectedStatus, 
    selectedDate, 
    selectedDepartment, 
    searchQuery
  ]);

  // Specific employee history summary if selected
  const employeeHistoryData = useMemo(() => {
    if (!selectedEmployeeProfile) return null;
    const history = getEmployeeAttendanceHistory(selectedEmployeeProfile, batches, attendance, programs, modules);
    const details = resolveEmployeeDetails(selectedEmployeeProfile, employees, users);
    
    let present = 0;
    let absent = 0;
    let other = 0;

    history.forEach(h => {
      if (h.status === 'Present' || h.status === 'Late' || h.status === 'Half Day') present++;
      else if (h.status === 'Absent') absent++;
      else other++;
    });

    const total = history.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const distinctBatches = new Set(history.map(h => h.batchCode)).size;

    return {
      details,
      code: selectedEmployeeProfile,
      history,
      total,
      present,
      absent,
      other,
      rate,
      distinctBatches
    };
  }, [selectedEmployeeProfile, batches, attendance, programs, modules, employees, users]);

  // Select all / Deselect visible
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRecordIds(filteredRecords.map(r => r.id));
    } else {
      setSelectedRecordIds([]);
    }
  };

  const isAllVisibleSelected = filteredRecords.length > 0 && filteredRecords.every(r => selectedRecordIds.includes(r.id));

  // Toggle single selection
  const handleToggleSelect = (id: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Perform Bulk Delete
  const handleExecuteBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    await bulkDeleteAttendance(selectedRecordIds);
    setSelectedRecordIds([]);
    setShowBulkDeleteModal(false);
  };

  // Perform Single Delete
  const handleExecuteSingleDelete = async () => {
    if (!recordToDelete) return;
    await deleteAttendanceRecord(recordToDelete.id);
    setRecordToDelete(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: TrainingAttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(normalizeAttendanceStatus(record.status));
    setEditCheckIn(record.reportedDatetime || '');
    setEditCheckOut(record.completedDatetime || '');
    setEditRemarks(record.remarks || '');
  };

  // Save Edit Record
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setEditSaving(true);
    await saveAttendanceRecord({
      id: editingRecord.id,
      batchId: editingRecord.batchId,
      batchCode: editingRecord.batchCode,
      employeeCode: editingRecord.employeeCode,
      moduleCode: editingRecord.moduleCode,
      sessionDate: editingRecord.sessionDate,
      status: editStatus,
      reportedDatetime: editCheckIn || undefined,
      completedDatetime: editCheckOut || undefined,
      remarks: editRemarks || undefined
    });
    setEditSaving(false);
    setEditingRecord(null);
  };

  // Export Filtered Records to Excel with complete requested columns
  const handleExportExcel = () => {
    const exportData = filteredRecords.map(rec => {
      const batch = batches.find(b => b.id === rec.batchId || b.batchCode === rec.batchCode);
      const program = programs.find(p => p.programCode?.toUpperCase() === batch?.programCode?.toUpperCase());
      const modObj = modules.find(m => m.moduleCode?.toUpperCase() === rec.moduleCode?.toUpperCase());
      const details = resolveEmployeeDetails(rec.employeeCode, employees, users);

      return {
        batchCode: rec.batchCode || batch?.batchCode || rec.batchId,
        programCode: batch?.programCode || '—',
        programName: program?.programName || batch?.programName || batch?.programCode || '—',
        moduleCode: rec.moduleCode,
        moduleName: modObj?.moduleName || rec.moduleCode || 'Module',
        sessionDate: rec.sessionDate || formatDisplayDate(rec.createdAt),
        employeeCode: rec.employeeCode,
        employeeName: details.name,
        department: details.department,
        status: rec.status,
        reportedDatetime: rec.reportedDatetime,
        completedDatetime: rec.completedDatetime,
        remarks: rec.remarks
      };
    });

    exportAttendanceToExcel(exportData, 'CADEPLOY_Attendance_Register');
  };

  const handleResetFilters = () => {
    setSelectedBatchCode('ALL');
    setSelectedProgramCode('ALL');
    setSelectedModuleCode('ALL');
    setSelectedDepartment('ALL');
    setSelectedStatus('ALL');
    setSelectedDate('');
    setSearchQuery('');
    setSelectedEmployeeProfile('');
    setSelectedRecordIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Attendance Filter Bar</h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
              {filteredRecords.length} records found
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {/* Employee Search / Profile Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Employee History
            </label>
            <select
              value={selectedEmployeeProfile}
              onChange={(e) => setSelectedEmployeeProfile(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="">All Employees</option>
              {allEmployeesList.map(e => (
                <option key={e.code} value={e.code}>{e.code} - {e.name}</option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Batch Code
            </label>
            <select
              value={selectedBatchCode}
              onChange={(e) => setSelectedBatchCode(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Batches</option>
              {batchOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Program Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Training Program
            </label>
            <select
              value={selectedProgramCode}
              onChange={(e) => setSelectedProgramCode(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 truncate"
            >
              <option value="ALL">All Programs</option>
              {programOptions.map(p => (
                <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Excused">Leave / Excused</option>
              <option value="Not Marked">Not Marked</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Attendance Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Search date..."
                className="w-full text-xs pl-8 pr-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Global Search */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keyword..."
                className="w-full text-xs pl-8 pr-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Employee Attendance Profile View */}
      {employeeHistoryData && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar name={employeeHistoryData.details.name} size="lg" className="w-12 h-12" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {employeeHistoryData.details.name}
                  </h3>
                  <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                    {employeeHistoryData.code}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {employeeHistoryData.details.department}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comprehensive Training Attendance Profile & Lifetime History
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmployeeProfile('')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Profile View</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batches Enrolled</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{employeeHistoryData.distinctBatches}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sessions</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{employeeHistoryData.total}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Attended</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{employeeHistoryData.present}</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Absent</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{employeeHistoryData.absent}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Attendance Rate</div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{employeeHistoryData.rate}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Controls (Admin only) */}
      {isAdmin && selectedRecordIds.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
              {selectedRecordIds.length} records selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRecordIds([])}
              className="text-xs px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400"
            >
              Deselect All
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Attendance Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Attendance Records Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or filter options.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  {isAdmin && (
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleSelectAllVisible}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4">Attendance Date</th>
                  <th className="py-3.5 px-4">Batch Code</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4">Module / Session</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(rec => {
                  const batch = batches.find(b => b.id === rec.batchId || b.batchCode === rec.batchCode);
                  const program = programs.find(p => p.programCode?.toUpperCase() === batch?.programCode?.toUpperCase());
                  const modObj = modules.find(m => m.moduleCode?.toUpperCase() === rec.moduleCode?.toUpperCase());
                  const details = resolveEmployeeDetails(rec.employeeCode, employees, users);
                  const isSelected = selectedRecordIds.includes(rec.id);
                  const normStatus = normalizeAttendanceStatus(rec.status);

                  return (
                    <tr 
                      key={rec.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(rec.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}

                      {/* Attendance Date */}
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.sessionDate || formatDisplayDate(rec.createdAt)}</span>
                        </div>
                      </td>

                      {/* Batch Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <button
                          onClick={() => onOpenBatchSheet?.(rec.batchId || batch?.id || '', rec.moduleCode, rec.sessionDate)}
                          className="hover:underline text-blue-600 dark:text-blue-400"
                          title="Open Batch Attendance Sheet"
                        >
                          {rec.batchCode || batch?.batchCode || rec.batchId}
                        </button>
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {program?.programName || batch?.programName || batch?.programCode || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {batch?.programCode || '—'}
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {modObj?.moduleName || rec.moduleCode}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rec.moduleCode}
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <button
                          onClick={() => setSelectedEmployeeProfile(rec.employeeCode)}
                          className="hover:underline text-blue-600 dark:text-blue-400"
                          title="View Employee History"
                        >
                          {rec.employeeCode}
                        </button>
                      </td>

                      {/* Employee Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={details.name} size="sm" className="w-6 h-6" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {details.name}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {details.department}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          normStatus === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          normStatus === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' :
                          normStatus === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                          normStatus === 'Half Day' ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400' :
                          normStatus === 'Excused' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {normStatus === 'Present' && <Check className="w-3 h-3 text-emerald-600" />}
                          {normStatus === 'Absent' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {normStatus === 'Late' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{normStatus}</span>
                        </span>
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {rec.reportedDatetime ? rec.reportedDatetime.split(' ').pop() : '—'}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {rec.completedDatetime ? rec.completedDatetime.split(' ').pop() : '—'}
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {rec.remarks || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setRecordToDelete(rec)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        )}
      </div>

      {/* Edit Single Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Attendance Record
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1">
              <div><strong>Employee:</strong> {editingRecord.employeeCode} ({resolveEmployeeDetails(editingRecord.employeeCode, users, nominees).name})</div>
              <div><strong>Batch:</strong> {editingRecord.batchCode || editingRecord.batchId}</div>
              <div><strong>Date:</strong> {editingRecord.sessionDate || '—'}</div>
              <div><strong>Module:</strong> {editingRecord.moduleCode}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Excused">Leave / Excused</option>
                  <option value="Not Marked">Not Marked</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    placeholder="HH:MM"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    placeholder="HH:MM"
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Optional remarks..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Attendance Record?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This action permanently removes the record from the database.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1">
              <div><strong>Employee:</strong> {recordToDelete.employeeCode}</div>
              <div><strong>Batch:</strong> {recordToDelete.batchCode || recordToDelete.batchId}</div>
              <div><strong>Date:</strong> {recordToDelete.sessionDate || '—'}</div>
              <div><strong>Module:</strong> {recordToDelete.moduleCode}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSingleDelete}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete {selectedRecordIds.length} Records?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete all selected attendance entries?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Delete Selected Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  Search, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Layers, 
  MapPin,
  PlayCircle,
  History,
  FileSpreadsheet,
  Filter,
  Check,
  Award,
  GraduationCap
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';
import { useTraining } from '../../context/TrainingContext';
import { DailyAttendanceSheet } from './DailyAttendanceSheet';
import { AttendanceHistoryTable } from './AttendanceHistoryTable';
import { 
  getBatchSessionAttendanceInfo, 
  getTodayFormattedStrings, 
  exportAttendanceToExcel,
  resolveEmployeeDetails,
  formatDisplayDate
} from '../../utils/attendanceUtils';

export const AttendanceView: React.FC = () => {
  const { 
    batches, 
    schedules, 
    nominees, 
    attendance, 
    refreshBatchData, 
    isLoading,
    isSyncing 
  } = useBatch();
  const { users, currentUser } = useApp();
  const { programs, modules, courses } = useTraining();

  const { displayDate } = getTodayFormattedStrings();

  // Active subview: 'batches' (Batch-wise Attendance) | 'history' (Attendance History) | 'sheet' (Daily Attendance Sheet)
  const [activeTab, setActiveTab] = useState<'batches' | 'history'>('batches');
  
  // Active batch selected for daily attendance marking sheet
  const [activeSheetBatchId, setActiveSheetBatchId] = useState<string | null>(null);
  const [activeSheetModuleCode, setActiveSheetModuleCode] = useState<string | undefined>(undefined);
  const [activeSheetDate, setActiveSheetDate] = useState<string | undefined>(undefined);

  // Filters on Batch-wise Attendance tab
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [selectedBatchStatus, setSelectedBatchStatus] = useState<string>('ALL');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Compute Batch Session & Attendance Summaries for ALL Batches
  const allBatchSummaries = useMemo(() => {
    return batches.map(batch => {
      const bNominees = nominees.filter(n => n.batchId === batch.id || (batch.batchCode && n.batchCode === batch.batchCode));
      const bAttendance = attendance.filter(a => a.batchId === batch.id || (batch.batchCode && a.batchCode === batch.batchCode));
      const bSchedules = schedules.filter(s => s.batchId === batch.id || (batch.batchCode && s.batchCode === batch.batchCode));

      const program = programs.find(p => p.programCode?.toUpperCase() === batch.programCode?.toUpperCase());
      const totalNominees = bNominees.length > 0 ? bNominees.length : (batch.headCount || 0);

      // Distinct employee codes with attendance marked
      const distinctMarkedEmployees = new Set(bAttendance.map(a => a.employeeCode.toUpperCase())).size;
      const totalRecords = bAttendance.length;

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let excusedCount = 0;

      bAttendance.forEach(a => {
        if (a.status === 'Present' || a.status === 'Attended') presentCount++;
        else if (a.status === 'Absent') absentCount++;
        else if (a.status === 'Late') lateCount++;
        else if (a.status === 'Half Day') halfDayCount++;
        else if (a.status === 'Excused') excusedCount++;
      });

      const attendedCount = presentCount + lateCount + halfDayCount;
      const attendanceRate = totalNominees > 0 
        ? Math.min(100, Math.round((attendedCount / totalNominees) * 100))
        : (totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 100) : 0);

      // Derive training date / period
      let dateDisplay = '—';
      if (bSchedules.length > 0 && bSchedules[0].activityDate) {
        dateDisplay = formatDisplayDate(bSchedules[0].activityDate.split(' ')[0]);
      } else if (batch.batchCreatedDate) {
        dateDisplay = formatDisplayDate(batch.batchCreatedDate);
      }

      return {
        batch,
        program,
        bNominees,
        bAttendance,
        bSchedules,
        totalNominees,
        distinctMarkedEmployees,
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        excusedCount,
        attendedCount,
        attendanceRate,
        dateDisplay
      };
    });
  }, [batches, nominees, attendance, schedules, programs]);

  // Overall Global Attendance Statistics for Summary KPIs
  const globalKPIs = useMemo(() => {
    const totalBatches = batches.length;
    const batchesWithNominees = allBatchSummaries.filter(b => b.totalNominees > 0).length;
    const batchesWithAttendance = allBatchSummaries.filter(b => b.totalRecords > 0).length;

    let totalEnrolled = 0;
    let totalAttended = 0;
    let totalRecordsCount = attendance.length;

    allBatchSummaries.forEach(b => {
      totalEnrolled += b.totalNominees;
      totalAttended += b.attendedCount;
    });

    const overallRate = totalEnrolled > 0 
      ? Math.round((totalAttended / totalEnrolled) * 100)
      : (totalRecordsCount > 0 ? Math.round((attendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day').length / totalRecordsCount) * 100) : 0);

    return {
      totalBatches,
      batchesWithNominees,
      batchesWithAttendance,
      totalEnrolled,
      totalRecordsCount,
      overallRate
    };
  }, [batches, allBatchSummaries, attendance]);

  // Filtered Batches for Tab A
  const filteredBatchSummaries = useMemo(() => {
    return allBatchSummaries.filter(item => {
      // 1. Status Filter
      if (selectedBatchStatus !== 'ALL') {
        if (item.batch.status !== selectedBatchStatus) return false;
      }

      // 2. Program Filter
      if (selectedProgramFilter !== 'ALL') {
        if (item.batch.programCode.toUpperCase() !== selectedProgramFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Date Filter
      if (selectedDateFilter.trim()) {
        const qDate = selectedDateFilter.toLowerCase();
        if (!item.dateDisplay.toLowerCase().includes(qDate)) return false;
      }

      // 4. Search Filter
      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matchCode = (item.batch.batchCode || '').toLowerCase().includes(q);
        const matchProgCode = (item.batch.programCode || '').toLowerCase().includes(q);
        const matchProgName = (item.program?.programName || item.batch.programName || '').toLowerCase().includes(q);
        const matchLoc = (item.batch.batchLocation || '').toLowerCase().includes(q);
        const matchNominee = item.bNominees.some(n => 
          n.employeeCode.toLowerCase().includes(q) || 
          (n.employeeName || '').toLowerCase().includes(q)
        );

        if (!matchCode && !matchProgCode && !matchProgName && !matchLoc && !matchNominee) {
          return false;
        }
      }

      return true;
    });
  }, [allBatchSummaries, selectedBatchStatus, selectedProgramFilter, selectedDateFilter, batchSearchQuery]);

  // Unique program options for filter
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

  // Open Attendance Sheet for a Batch
  const handleOpenSheet = (batchId: string, moduleCode?: string, sessionDate?: string) => {
    setActiveSheetBatchId(batchId);
    setActiveSheetModuleCode(moduleCode);
    setActiveSheetDate(sessionDate);
  };

  // Export All Attendance to Excel
  const handleExportAll = () => {
    const exportData = attendance.map(rec => {
      const batch = batches.find(b => b.id === rec.batchId || b.batchCode === rec.batchCode);
      const program = programs.find(p => p.programCode === batch?.programCode);
      const modObj = modules.find(m => m.moduleCode === rec.moduleCode);
      const details = resolveEmployeeDetails(rec.employeeCode, users, nominees);

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

    exportAttendanceToExcel(exportData, 'CADEPLOY_All_Training_Attendance');
  };

  // If in sheet view and a batch is selected, render DailyAttendanceSheet
  if (activeSheetBatchId) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <DailyAttendanceSheet
          batchId={activeSheetBatchId}
          initialModuleCode={activeSheetModuleCode}
          initialSessionDate={activeSheetDate}
          onBack={() => {
            setActiveSheetBatchId(null);
            setActiveSheetModuleCode(undefined);
            setActiveSheetDate(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Main Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Training Attendance Register
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive batch-wise attendance register for ongoing, planned, and completed batches
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('batches')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'batches'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>A. Batch-wise Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>B. Attendance History</span>
            </button>
          </div>

          <button
            onClick={() => refreshBatchData()}
            disabled={isLoading || isSyncing}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isSyncing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Register (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Global Attendance Register KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Batches</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{globalKPIs.totalBatches}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">{globalKPIs.batchesWithNominees} batches with nominees</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batches with Attendance</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{globalKPIs.batchesWithAttendance}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Recorded in database</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Nominees Enrolled</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{globalKPIs.totalEnrolled}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Across all active batches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance Records Logged</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{globalKPIs.totalRecordsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Session-wise entries</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Overall Attendance Rate</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{globalKPIs.overallRate}%</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${globalKPIs.overallRate}%` }} />
          </div>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'batches' ? (
        <div className="space-y-4">
          {/* Batch Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={batchSearchQuery}
                  onChange={(e) => setBatchSearchQuery(e.target.value)}
                  placeholder="Search batch code, program name, or nominee..."
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Status Filter */}
              <select
                value={selectedBatchStatus}
                onChange={(e) => setSelectedBatchStatus(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Batch Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Planned">Planned</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="On Hold">On Hold</option>
              </select>

              {/* Program Filter */}
              <select
                value={selectedProgramFilter}
                onChange={(e) => setSelectedProgramFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 max-w-[200px] truncate"
              >
                <option value="ALL">All Programs</option>
                {programOptions.map(p => (
                  <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                ))}
              </select>

              {/* Date Filter */}
              <div className="relative">
                <input
                  type="text"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  placeholder="Filter date..."
                  className="text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 w-32"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {(batchSearchQuery || selectedBatchStatus !== 'ALL' || selectedProgramFilter !== 'ALL' || selectedDateFilter) && (
              <button
                onClick={() => {
                  setBatchSearchQuery('');
                  setSelectedBatchStatus('ALL');
                  setSelectedProgramFilter('ALL');
                  setSelectedDateFilter('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Complete Batch-wise Attendance Register Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredBatchSummaries.length === 0 ? (
              <div className="p-12 text-center">
                <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Batches Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  No batches matched your filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Batch Code</th>
                      <th className="py-3.5 px-4">Program Code</th>
                      <th className="py-3.5 px-4">Program Name</th>
                      <th className="py-3.5 px-4">Training Date / Period</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Nominees Enrolled</th>
                      <th className="py-3.5 px-4">Attendance Marked</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Attendance Rate</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBatchSummaries.map(item => (
                      <tr 
                        key={item.batch.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Batch Code */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                            {item.batch.batchCode}
                          </span>
                        </td>

                        {/* Program Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.batch.programCode}
                        </td>

                        {/* Program Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white max-w-[240px] truncate">
                            {item.program?.programName || item.batch.programName || item.batch.programCode}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{item.batch.batchLocation || 'Hyderabad'}</span>
                          </div>
                        </td>

                        {/* Training Date / Period */}
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.dateDisplay}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                            item.batch.status === 'In Progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            item.batch.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' :
                            item.batch.status === 'Planned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' :
                            item.batch.status === 'Approved' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.batch.status}
                          </span>
                        </td>

                        {/* Nominees */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.totalNominees} employees</span>
                          </div>
                        </td>

                        {/* Attendance Marked */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {item.distinctMarkedEmployees} / {item.totalNominees} marked
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.totalRecords} total entries
                          </div>
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {item.attendanceRate}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.attendedCount} Attended
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.attendanceRate >= 80 ? 'bg-emerald-500' :
                                item.attendanceRate >= 50 ? 'bg-amber-500' :
                                item.attendanceRate > 0 ? 'bg-rose-500' : 'bg-slate-300'
                              }`}
                              style={{ width: `${item.attendanceRate}%` }}
                            />
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenSheet(item.batch.id, undefined, item.dateDisplay !== '—' ? item.dateDisplay : undefined)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Mark Attendance</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab B: Attendance History */
        <AttendanceHistoryTable
          onOpenBatchSheet={(batchId, mod, date) => handleOpenSheet(batchId, mod, date)}
        />
      )}
    </div>
  );
};

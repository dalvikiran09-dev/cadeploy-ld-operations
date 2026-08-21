import * as XLSX from 'xlsx';
import { 
  TrainingBatch, 
  BatchScheduleActivity, 
  BatchNominee, 
  TrainingAttendanceRecord, 
  AttendanceStatus 
} from '../types/batch';
import { User } from '../types';
import { TrainingProgram, TrainingModule, TrainingCourse } from '../types/training';

/**
 * Universal date parser that handles multiple string formats
 */
export const parseAnyDate = (dateStr?: string | null): Date | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();

  // Try standard Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // DD-MMM-YYYY or DD-MMM-YYYY HH:mm format
  const matchDmy = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{4})/);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const monthStr = matchDmy[2].toLowerCase();
    const year = parseInt(matchDmy[3], 10);
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    if (months[monthStr] !== undefined) {
      return new Date(year, months[monthStr], day);
    }
  }

  // YYYY-MM-DD format
  const matchIso = s.match(/^(\d{4})[-/ ](\d{1,2})[-/ ](\d{1,2})/);
  if (matchIso) {
    return new Date(parseInt(matchIso[1], 10), parseInt(matchIso[2], 10) - 1, parseInt(matchIso[3], 10));
  }

  return null;
};

/**
 * Normalize attendance status into standard categories
 */
export const normalizeAttendanceStatus = (status?: string): AttendanceStatus => {
  if (!status) return 'Not Marked';
  const s = status.trim().toLowerCase();
  if (s === 'present' || s === 'attended') return 'Present';
  if (s === 'absent') return 'Absent';
  if (s === 'late') return 'Late';
  if (s === 'half day' || s === 'half-day' || s === 'partial') return 'Half Day';
  if (s === 'excused' || s === 'on leave' || s === 'leave') return 'Excused';
  return 'Not Marked';
};

/**
 * Checks if status counts as attended / present
 */
export const isAttendedStatus = (status?: string): boolean => {
  const norm = normalizeAttendanceStatus(status);
  return norm === 'Present' || norm === 'Late' || norm === 'Half Day';
};

/**
 * Standard date string formatters for today
 */
export const getTodayFormattedStrings = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayDate = `${String(day).padStart(2, '0')}-${monthNames[month]}-${year}`;
  const shortDate = `${day} ${monthNames[month]} ${year}`;

  return { isoDate, displayDate, shortDate, now };
};

/**
 * Format date for display (e.g. 15-Jul-2026)
 */
export const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr || !dateStr.trim()) return '—';
  const d = parseAnyDate(dateStr);
  if (!d) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
};

/**
 * Check if a schedule activity or batch is scheduled for today
 */
export const isScheduledForToday = (dateStr?: string): boolean => {
  if (!dateStr || !dateStr.trim()) return false;
  const targetDate = parseAnyDate(dateStr);
  if (!targetDate) return false;

  const now = new Date();
  return (
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate()
  );
};

/**
 * Format date time display for check-in / check-out
 */
export const formatCurrentTimeString = (d: Date = new Date()): string => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatFullDateTimeString = (d: Date = new Date()): string => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Resolve employee name, department, designation, and location from Employee Master, users, or nominees
 */
export const resolveEmployeeDetails = (
  employeeCode: string,
  employeesOrUsers: any[] = [],
  fallbackUsersOrNominees: any[] = [],
  fallbackDefaults?: { employeeName?: string; department?: string; designation?: string; location?: string }
): { name: string; employeeName: string; department: string; designation: string; location?: string; avatar?: string; email?: string } => {
  if (!employeeCode) {
    return {
      name: fallbackDefaults?.employeeName || 'Unknown',
      employeeName: fallbackDefaults?.employeeName || 'Unknown',
      department: fallbackDefaults?.department || 'Operations',
      designation: fallbackDefaults?.designation || 'Employee',
      location: fallbackDefaults?.location || 'Hyderabad'
    };
  }

  const cleanCode = employeeCode.trim().toUpperCase();

  // 1. Try matching in primary array (e.g. employees from AssessmentContext or users)
  const empMatch = employeesOrUsers.find(e => 
    e.employeeCode?.toUpperCase() === cleanCode || 
    e.id?.toUpperCase() === cleanCode || 
    (e.username && e.username.toUpperCase() === cleanCode)
  );

  if (empMatch) {
    const resolvedName = empMatch.name || empMatch.employeeName || employeeCode;
    return {
      name: resolvedName,
      employeeName: resolvedName,
      department: empMatch.department || fallbackDefaults?.department || 'Operations',
      designation: empMatch.designation || fallbackDefaults?.designation || 'Engineer',
      location: empMatch.location || fallbackDefaults?.location || 'Hyderabad',
      avatar: empMatch.avatar,
      email: empMatch.email
    };
  }

  // 2. Try matching in fallback array (e.g. users or nominees)
  const userMatch = fallbackUsersOrNominees.find(u => 
    (u.username && u.username.toUpperCase() === cleanCode) ||
    u.id === employeeCode ||
    u.id?.toUpperCase() === cleanCode ||
    (u.employeeCode && u.employeeCode.toUpperCase() === cleanCode) ||
    (u.name && u.name.toUpperCase() === cleanCode)
  );

  if (userMatch) {
    const resolvedName = userMatch.name || userMatch.employeeName || employeeCode;
    return {
      name: resolvedName,
      employeeName: resolvedName,
      department: userMatch.department || fallbackDefaults?.department || 'Operations',
      designation: userMatch.designation || fallbackDefaults?.designation || 'Team Member',
      location: userMatch.location || fallbackDefaults?.location || 'Hyderabad',
      avatar: userMatch.avatar,
      email: userMatch.email
    };
  }

  // 3. Use default fallback values or code
  const finalName = fallbackDefaults?.employeeName || employeeCode;
  return {
    name: finalName,
    employeeName: finalName,
    department: fallbackDefaults?.department || 'Operations',
    designation: fallbackDefaults?.designation || 'Employee',
    location: fallbackDefaults?.location || 'Hyderabad'
  };
};

export interface BatchAttendanceSummary {
  batch: TrainingBatch;
  programName: string;
  programCode: string;
  trainingPeriod: string;
  status: string;
  headCount: number;
  totalMarkedRecords: number;
  distinctDatesCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  leaveCount: number;
  notMarkedCount: number;
  attendanceRate: number;
  allSchedules: BatchScheduleActivity[];
  nominees: BatchNominee[];
}

/**
 * Calculate overall batch attendance statistics across all dates and sessions
 */
export const computeBatchOverallAttendance = (
  batch: TrainingBatch,
  schedules: BatchScheduleActivity[],
  nominees: BatchNominee[],
  attendance: TrainingAttendanceRecord[],
  programs: TrainingProgram[]
): BatchAttendanceSummary => {
  const batchNominees = nominees.filter(n => 
    n.batchId === batch.id || (batch.batchCode && n.batchCode?.toUpperCase() === batch.batchCode.toUpperCase())
  );

  const batchSchedules = schedules.filter(s => 
    s.batchId === batch.id || (batch.batchCode && s.batchCode?.toUpperCase() === batch.batchCode.toUpperCase())
  );

  const batchAttendance = attendance.filter(a => 
    a.batchId === batch.id || (batch.batchCode && a.batchCode?.toUpperCase() === batch.batchCode.toUpperCase())
  );

  const program = programs.find(p => p.programCode?.toUpperCase() === batch.programCode?.toUpperCase());
  const programName = program?.programName || batch.programName || batch.programCode || 'Training Program';

  // Determine training period
  let trainingPeriod = '—';
  if (batchSchedules.length > 0) {
    const dates = batchSchedules
      .map(s => s.activityDate)
      .filter(Boolean)
      .map(d => formatDisplayDate(d.split(' ')[0]));
    if (dates.length === 1) {
      trainingPeriod = dates[0];
    } else if (dates.length > 1) {
      trainingPeriod = `${dates[0]} - ${dates[dates.length - 1]}`;
    }
  }
  if (trainingPeriod === '—' && batch.batchCreatedDate) {
    trainingPeriod = formatDisplayDate(batch.batchCreatedDate);
  }

  const headCount = batchNominees.length || batch.headCount || 0;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;
  let notMarkedCount = 0;

  const distinctDates = new Set<string>();

  batchAttendance.forEach(rec => {
    if (rec.sessionDate) distinctDates.add(rec.sessionDate);
    const norm = normalizeAttendanceStatus(rec.status);
    if (norm === 'Present') presentCount++;
    else if (norm === 'Absent') absentCount++;
    else if (norm === 'Late') lateCount++;
    else if (norm === 'Half Day') halfDayCount++;
    else if (norm === 'Excused') leaveCount++;
    else notMarkedCount++;
  });

  const totalMarkedRecords = batchAttendance.length;
  const attendedTotal = presentCount + lateCount + halfDayCount;
  
  // If distinct dates exist, attendance rate is attendedTotal / (headCount * distinctDates.size)
  const totalSlots = headCount * Math.max(1, distinctDates.size);
  const attendanceRate = totalSlots > 0 
    ? Math.round((attendedTotal / totalSlots) * 100) 
    : (totalMarkedRecords > 0 ? Math.round((attendedTotal / totalMarkedRecords) * 100) : 0);

  return {
    batch,
    programName,
    programCode: batch.programCode,
    trainingPeriod,
    status: batch.status,
    headCount,
    totalMarkedRecords,
    distinctDatesCount: distinctDates.size,
    presentCount,
    absentCount,
    lateCount,
    halfDayCount,
    leaveCount,
    notMarkedCount,
    attendanceRate: Math.min(100, attendanceRate),
    allSchedules: batchSchedules,
    nominees: batchNominees
  };
};

export interface EmployeeAttendanceHistoryItem {
  id: string;
  batchId: string;
  batchCode: string;
  programCode: string;
  programName: string;
  moduleCode: string;
  moduleName: string;
  sessionDate: string;
  status: AttendanceStatus;
  reportedDatetime?: string;
  completedDatetime?: string;
  remarks?: string;
}

/**
 * Fetch and sort an employee's full attendance history across all batches
 */
export const getEmployeeAttendanceHistory = (
  employeeCode: string,
  batches: TrainingBatch[],
  attendance: TrainingAttendanceRecord[],
  programs: TrainingProgram[],
  modules: TrainingModule[]
): EmployeeAttendanceHistoryItem[] => {
  if (!employeeCode || !employeeCode.trim()) return [];
  const cleanCode = employeeCode.trim().toUpperCase();

  const userRecords = attendance.filter(a => a.employeeCode && a.employeeCode.trim().toUpperCase() === cleanCode);

  return userRecords.map(rec => {
    const batch = batches.find(b => b.id === rec.batchId || (b.batchCode && rec.batchCode && b.batchCode.toUpperCase() === rec.batchCode.toUpperCase()));
    const programCode = batch?.programCode || '—';
    const program = programs.find(p => p.programCode?.toUpperCase() === programCode.toUpperCase());
    const moduleObj = modules.find(m => m.moduleCode?.toUpperCase() === (rec.moduleCode || '').toUpperCase());

    return {
      id: rec.id,
      batchId: rec.batchId,
      batchCode: rec.batchCode || batch?.batchCode || rec.batchId,
      programCode,
      programName: program?.programName || batch?.programName || programCode,
      moduleCode: rec.moduleCode || 'MDL001',
      moduleName: moduleObj?.moduleName || rec.moduleCode || 'Module Session',
      sessionDate: rec.sessionDate || formatDisplayDate(rec.createdAt),
      status: normalizeAttendanceStatus(rec.status),
      reportedDatetime: rec.reportedDatetime,
      completedDatetime: rec.completedDatetime,
      remarks: rec.remarks
    };
  }).sort((a, b) => {
    const da = parseAnyDate(a.sessionDate)?.getTime() || 0;
    const db = parseAnyDate(b.sessionDate)?.getTime() || 0;
    return db - da; // newest first
  });
};

export interface BatchAttendanceSessionInfo {
  batch: TrainingBatch;
  program?: TrainingProgram;
  module?: TrainingModule;
  course?: TrainingCourse;
  todaySchedule?: BatchScheduleActivity;
  allSchedules: BatchScheduleActivity[];
  nominees: BatchNominee[];
  attendanceRecords: TrainingAttendanceRecord[];
  isOngoingToday: boolean;
  totalNominees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  excusedCount: number;
  notMarkedCount: number;
  attendanceRate: number;
  sessionDate: string;
  moduleCode: string;
}

/**
 * Compute Session info for a specific batch session/date
 */
export const getBatchSessionAttendanceInfo = (
  batch: TrainingBatch,
  schedules: BatchScheduleActivity[],
  nominees: BatchNominee[],
  attendance: TrainingAttendanceRecord[],
  programs: TrainingProgram[],
  modules: TrainingModule[],
  courses: TrainingCourse[],
  targetDate?: string,
  targetModuleCode?: string
): BatchAttendanceSessionInfo => {
  const batchSchedules = schedules.filter(s => 
    (s.batchId && s.batchId === batch.id) || 
    (s.batchCode && s.batchCode.toUpperCase() === batch.batchCode.toUpperCase())
  );

  const batchNominees = nominees.filter(n => 
    (n.batchId && n.batchId === batch.id) || 
    (n.batchCode && n.batchCode.toUpperCase() === batch.batchCode.toUpperCase())
  );

  const program = programs.find(p => p.programCode.toUpperCase() === batch.programCode.toUpperCase());

  // Find schedule for target date
  let activeSchedule: BatchScheduleActivity | undefined;
  if (targetDate) {
    activeSchedule = batchSchedules.find(s => s.activityDate && s.activityDate.includes(targetDate));
  } else {
    activeSchedule = batchSchedules.find(s => isScheduledForToday(s.activityDate));
  }

  if (!activeSchedule && batchSchedules.length > 0) {
    activeSchedule = batchSchedules[0];
  }

  const { displayDate } = getTodayFormattedStrings();
  const sessionDate = targetDate || (activeSchedule?.activityDate ? activeSchedule.activityDate.split(' ')[0] : displayDate);
  const moduleCode = targetModuleCode || (activeSchedule?.moduleCode && activeSchedule.moduleCode !== '-' ? activeSchedule.moduleCode : (courses.find(c => c.programCode === batch.programCode)?.moduleCode || 'MDL001'));

  const moduleObj = modules.find(m => m.moduleCode.toUpperCase() === moduleCode.toUpperCase());
  const courseObj = courses.find(c => c.programCode.toUpperCase() === batch.programCode.toUpperCase() && c.moduleCode.toUpperCase() === moduleCode.toUpperCase());

  // Filter attendance records for this batch + module + sessionDate
  const batchAttendance = attendance.filter(a => 
    (a.batchId === batch.id || (a.batchCode && a.batchCode.toUpperCase() === batch.batchCode.toUpperCase())) &&
    (!moduleCode || (a.moduleCode && a.moduleCode.toUpperCase() === moduleCode.toUpperCase())) &&
    (!sessionDate || !a.sessionDate || a.sessionDate === sessionDate)
  );

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let excusedCount = 0;
  let notMarkedCount = 0;

  batchNominees.forEach(nom => {
    const record = batchAttendance.find(a => a.employeeCode.toUpperCase() === nom.employeeCode.toUpperCase());
    const status = normalizeAttendanceStatus(record?.status);
    if (status === 'Present') presentCount++;
    else if (status === 'Absent') absentCount++;
    else if (status === 'Late') lateCount++;
    else if (status === 'Half Day') halfDayCount++;
    else if (status === 'Excused') excusedCount++;
    else notMarkedCount++;
  });

  const totalNominees = batchNominees.length || batch.headCount || 0;
  const attendedTotal = presentCount + lateCount + halfDayCount;
  const attendanceRate = totalNominees > 0 
    ? Math.round((attendedTotal / totalNominees) * 100) 
    : 0;

  const isOngoingToday = Boolean(
    (batch.status === 'In Progress' || batch.status === 'Planned') &&
    (activeSchedule ? isScheduledForToday(activeSchedule.activityDate) : (batch.batchCreatedDate && isScheduledForToday(batch.batchCreatedDate)))
  );

  return {
    batch,
    program,
    module: moduleObj,
    course: courseObj,
    todaySchedule: activeSchedule,
    allSchedules: batchSchedules,
    nominees: batchNominees,
    attendanceRecords: batchAttendance,
    isOngoingToday,
    totalNominees,
    presentCount,
    absentCount,
    lateCount,
    halfDayCount,
    excusedCount,
    notMarkedCount,
    attendanceRate,
    sessionDate,
    moduleCode
  };
};

/**
 * Export Attendance Records to Excel (.xlsx) with complete consolidated columns
 */
export const exportAttendanceToExcel = (
  records: Array<{
    batchCode: string;
    programCode: string;
    programName: string;
    moduleCode: string;
    moduleName?: string;
    sessionDate: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    status: string;
    reportedDatetime?: string;
    completedDatetime?: string;
    remarks?: string;
  }>,
  fileNamePrefix: string = 'Attendance_Register'
) => {
  const exportRows = records.map(r => ({
    'Batch Code': r.batchCode || '—',
    'Program Code': r.programCode || '—',
    'Program Name': r.programName || '—',
    'Module Code': r.moduleCode || '—',
    'Module': r.moduleName || r.moduleCode || '—',
    'Attendance Date': r.sessionDate || '—',
    'Employee ID': r.employeeCode || '—',
    'Employee Name': r.employeeName || '—',
    'Department': r.department || '—',
    'Status': r.status || 'Not Marked',
    'Check-In': r.reportedDatetime || '—',
    'Check-Out': r.completedDatetime || '—',
    'Remarks': r.remarks || '—'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths for high legibility
  worksheet['!cols'] = [
    { wch: 18 }, // Batch Code
    { wch: 16 }, // Program Code
    { wch: 32 }, // Program Name
    { wch: 16 }, // Module Code
    { wch: 24 }, // Module
    { wch: 16 }, // Attendance Date
    { wch: 15 }, // Employee ID
    { wch: 22 }, // Employee Name
    { wch: 18 }, // Department
    { wch: 14 }, // Status
    { wch: 18 }, // Check-In
    { wch: 18 }, // Check-Out
    { wch: 30 }  // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Register');

  const { isoDate } = getTodayFormattedStrings();
  const filename = `${fileNamePrefix}_${isoDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

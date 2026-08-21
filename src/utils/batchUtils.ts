import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  TrainingBatch, 
  BatchScheduleActivity, 
  BatchNominee, 
  TrainingAttendanceRecord, 
  ParsedBatchImportData, 
  BatchImportValidationIssue,
  AttendanceStatus
} from '../types/batch';

/**
 * List of known column header names across all sheets.
 * Used to ensure column headers are NEVER mapped or saved as batch records.
 */
export const RESERVED_HEADER_STRINGS = new Set([
  'batchcode',
  'batch code',
  'batch_code',
  'batchno',
  'batch no',
  'batch_no',
  'batchid',
  'batch id',
  'programcode',
  'program code',
  'program_code',
  'programid',
  'program id',
  'prgcode',
  'prg code',
  'programname',
  'program name',
  'program_name',
  'headcount',
  'head count',
  'head_count',
  'createddate',
  'created date',
  'created_date',
  'batchcreateddate',
  'batch created date',
  'batch_created_date',
  'requesteddate',
  'requested date',
  'requested_date',
  'programrequesteddate',
  'program requested date',
  'program_requested_date',
  'requestaccepteddate',
  'request accepted date',
  'request_accepted_date',
  'programrequestaccepteddate',
  'program request accepted date',
  'program_request_accepted_date',
  'requestedstartdate',
  'requested start date',
  'requested_start_date',
  'programrequestedstartdate',
  'program requested start date',
  'program_requested_start_date',
  'proposedstartdate',
  'proposed start date',
  'proposed_start_date',
  'programproposedstartdate',
  'program proposed start date',
  'program_proposed_start_date',
  'schedulecode',
  'schedule code',
  'schedule_code',
  'scheduleid',
  'schedule id',
  'batchlocation',
  'batch location',
  'batch_location',
  'location',
  'venue',
  'facilitatorcode',
  'facilitator code',
  'facilitator_code',
  'facilitator',
  'trainer',
  'trainercode',
  'batchstatus',
  'batch status',
  'batch_status',
  'status',
  'activitydate',
  'activity date',
  'activity_date',
  'activity',
  'modulecode',
  'module code',
  'module_code',
  'arrangements',
  'nomineeemployeecode',
  'nominee employee code',
  'nominee_employee_code',
  'employeecode',
  'employee code',
  'employee_code',
  'empcode',
  'emp code',
  'emp_code',
  'nominatoremployeecode',
  'nominator employee code',
  'nominator_employee_code',
  'nominationdatetime',
  'nomination date/time',
  'nomination date',
  'nomination_datetime',
  'targetcompetency',
  'target competency',
  'targetcompetencies',
  'target competencies',
  'target competency/kpi',
  'target_competencies',
  'currentlevel',
  'current level',
  'currentlevels',
  'current levels',
  'current_levels',
  'reporteddatetime',
  'reported date/time',
  'reported_datetime',
  'intermittentexittime',
  'intermittent exit time',
  'intermittent_exit_time',
  'intermittententrytime',
  'intermittent entry time',
  'intermittent_entry_time',
  'completeddatetime',
  'completed date/time',
  'completed_datetime',
  'remarks'
]);

/**
 * Check if a string corresponds to a known Excel column header.
 */
export const isReservedHeaderString = (val?: string | null): boolean => {
  if (!val) return false;
  const clean = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return false;

  for (const reserved of RESERVED_HEADER_STRINGS) {
    const cleanReserved = reserved.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean === cleanReserved) return true;
  }
  return false;
};

/**
 * Check if a batch record is an invalid junk record (e.g. column header mapped as a batch)
 */
export const isInvalidBatchRecord = (batch: TrainingBatch | { batchCode?: string; programCode?: string }): boolean => {
  const code = (batch.batchCode || '').trim();
  if (!code) return true;

  // Exact header check
  if (isReservedHeaderString(code)) return true;

  // Specific common header mis-mappings
  const lower = code.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (
    lower.startsWith('schedulecode') ||
    lower.startsWith('programproposed') ||
    lower.startsWith('programrequested') ||
    lower.startsWith('requestaccepted') ||
    lower.startsWith('batchcode') ||
    lower.startsWith('programcode') ||
    lower.startsWith('batchcreated') ||
    lower.startsWith('facilitatorcode') ||
    lower.startsWith('batchlocation') ||
    lower.startsWith('headcount') ||
    lower.startsWith('batchstatus')
  ) {
    return true;
  }

  return false;
};

/**
 * Filter out invalid batch records from a list
 */
export const cleanInvalidBatches = <T extends { batchCode?: string; programCode?: string }>(batchList: T[]): T[] => {
  if (!Array.isArray(batchList)) return [];
  return batchList.filter(b => !isInvalidBatchRecord(b));
};

/**
 * Generate next sequential batch code e.g. BTCH0000000001, BTCH0000000002
 */
export const generateNextBatchCode = (existingBatches: TrainingBatch[]): string => {
  if (!existingBatches || existingBatches.length === 0) {
    return 'BTCH0000000001';
  }

  let maxNum = 0;
  existingBatches.forEach(b => {
    if (!b.batchCode || isInvalidBatchRecord(b)) return;
    const match = b.batchCode.trim().match(/^BTCH(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(10, '0');
  return `BTCH${padded}`;
};

/**
 * Normalize Excel cell value to string or formatted date
 */
export const normalizeExcelCellValue = (val: any, isDateField = false, includeTime = false): string => {
  if (val === null || val === undefined) return '';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return includeTime ? formatBatchDateTime(val) : formatBatchDateOnly(val);
  }

  if (typeof val === 'number') {
    // If it is a date field and value is an Excel serial number e.g. 45678
    if (isDateField && val > 20000 && val < 90000) {
      try {
        const utcDays = val - 25569;
        const utcValue = utcDays * 86400;
        const dateObj = new Date(utcValue * 1000);
        if (!isNaN(dateObj.getTime())) {
          return includeTime ? formatBatchDateTime(dateObj) : formatBatchDateOnly(dateObj);
        }
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  const str = String(val).trim();
  if (isDateField && str) {
    // Check if it is an ISO or standard date string
    if (str.includes('T') || (str.includes('-') && str.length >= 8)) {
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return includeTime ? formatBatchDateTime(d) : formatBatchDateOnly(d);
        }
      } catch {
        return str;
      }
    }
  }

  return str;
};

/**
 * Format datetime or date into readable string e.g. 07-Jan-2026 14:30 or 07-Jan-2026
 */
export const formatBatchDateTime = (val?: string | Date | null): string => {
  if (!val) return '—';
  if (typeof val === 'string' && (val.includes('-') || val.includes('/')) && val.length < 30 && !val.includes('T')) {
    return val;
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  } catch {
    return String(val);
  }
};

export const formatBatchDateOnly = (val?: string | Date | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(val);
  }
};

/**
 * Calculate attendance statistics for a batch
 */
export interface BatchAttendanceStats {
  totalNominees: number;
  totalSessions: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  partialCount: number;
  excusedCount: number;
  notMarkedCount: number;
  overallAttendanceRate: number; // 0 to 100
  moduleBreakdown: Array<{
    moduleCode: string;
    moduleName?: string;
    totalExpected: number;
    present: number;
    absent: number;
    attendanceRate: number;
  }>;
  nomineeBreakdown: Record<string, {
    totalSessions: number;
    attendedSessions: number;
    rate: number;
  }>;
}

export const calculateBatchAttendanceStats = (
  batchId: string,
  nominees: BatchNominee[],
  schedules: BatchScheduleActivity[],
  attendanceRecords: TrainingAttendanceRecord[]
): BatchAttendanceStats => {
  const batchNominees = nominees.filter(n => n.batchId === batchId);
  const batchSchedules = schedules.filter(s => s.batchId === batchId);
  const batchAttendance = attendanceRecords.filter(a => a.batchId === batchId);

  // Unique modules in this batch schedule
  const moduleCodes = Array.from(new Set(
    batchSchedules
      .map(s => s.moduleCode)
      .filter((m): m is string => Boolean(m && m !== '-'))
  ));

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let partialCount = 0;
  let excusedCount = 0;
  let notMarkedCount = 0;

  batchAttendance.forEach(a => {
    switch (a.status) {
      case 'Attended':
        presentCount++;
        break;
      case 'Absent':
        absentCount++;
        break;
      case 'Late':
        lateCount++;
        break;
      case 'Partial':
        partialCount++;
        break;
      case 'Excused':
        excusedCount++;
        break;
      default:
        notMarkedCount++;
    }
  });

  const totalRecords = batchAttendance.length;
  const attendedEquivalent = presentCount + lateCount + (partialCount * 0.5);
  const markedRecords = presentCount + absentCount + lateCount + partialCount + excusedCount;
  const overallAttendanceRate = markedRecords > 0 
    ? Math.round((attendedEquivalent / markedRecords) * 100) 
    : 0;

  // Module-level statistics
  const moduleBreakdown = moduleCodes.map(modCode => {
    const modRecords = batchAttendance.filter(a => a.moduleCode === modCode);
    const modPresent = modRecords.filter(a => a.status === 'Attended' || a.status === 'Late').length;
    const modAbsent = modRecords.filter(a => a.status === 'Absent').length;
    const modTotal = modRecords.length || batchNominees.length;
    const rate = modTotal > 0 ? Math.round((modPresent / modTotal) * 100) : 0;

    return {
      moduleCode: modCode,
      totalExpected: modTotal,
      present: modPresent,
      absent: modAbsent,
      attendanceRate: rate
    };
  });

  // Nominee-level statistics
  const nomineeBreakdown: Record<string, { totalSessions: number; attendedSessions: number; rate: number }> = {};
  batchNominees.forEach(nom => {
    const empRecords = batchAttendance.filter(a => a.employeeCode === nom.employeeCode);
    const attended = empRecords.filter(a => a.status === 'Attended' || a.status === 'Late').length;
    const totalExpected = moduleCodes.length || empRecords.length || 1;
    const rate = totalExpected > 0 ? Math.round((attended / totalExpected) * 100) : 0;

    nomineeBreakdown[nom.employeeCode] = {
      totalSessions: totalExpected,
      attendedSessions: attended,
      rate
    };
  });

  return {
    totalNominees: batchNominees.length,
    totalSessions: moduleCodes.length || batchSchedules.length,
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    partialCount,
    excusedCount,
    notMarkedCount,
    overallAttendanceRate,
    moduleBreakdown,
    nomineeBreakdown
  };
};

/**
 * Normalizes header string to clean alphanumeric key for matching
 * e.g. "Batch Code" -> "batchcode", "Program Proposed Start Date" -> "programproposedstartdate"
 */
export const cleanHeaderKey = (header: any): string => {
  if (header === null || header === undefined) return '';
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

// =========================================================================
// Canonical Header Normalization Mappings & Matchers
// =========================================================================

export type BatchFieldKey =
  | 'batch_code'
  | 'batch_created_date'
  | 'program_code'
  | 'program_name'
  | 'head_count'
  | 'program_requested_date'
  | 'program_requested_accepted_date'
  | 'program_requested_start_date'
  | 'program_proposed_start_date'
  | 'schedule_code'
  | 'batch_location'
  | 'facilitator_code'
  | 'status';

export const BATCH_HEADER_ALIASES: Record<BatchFieldKey, string[]> = {
  batch_code: ['batchcode', 'batch_code', 'batchno', 'batch_no', 'batchid', 'batch_id', 'batch', 'btchcode', 'code'],
  batch_created_date: ['batchcreateddate', 'batch_created_date', 'createddate', 'created_date', 'datecreated', 'createdon', 'batchcreated'],
  program_code: ['programcode', 'program_code', 'prgcode', 'prg_code', 'programid', 'program_id', 'program'],
  program_name: ['programname', 'program_name', 'trainingprogram', 'training_program', 'coursetitle', 'course', 'programtitle'],
  head_count: ['headcount', 'head_count', 'totalnominees', 'nomineescount', 'capacity', 'participants', 'headcounts', 'nomineecount'],
  program_requested_date: ['programrequesteddate', 'program_requested_date', 'requesteddate', 'requested_date', 'prgrequesteddate'],
  program_requested_accepted_date: ['programrequestedaccepteddate', 'program_requested_accepted_date', 'requestaccepteddate', 'request_accepted_date', 'accepteddate', 'accepted_date', 'programrequestaccepteddate', 'prgrequestaccepteddate'],
  program_requested_start_date: ['programrequestedstartdate', 'program_requested_start_date', 'requestedstartdate', 'requested_start_date', 'targetstartdate', 'prgrequestedstartdate'],
  program_proposed_start_date: ['programproposedstartdate', 'program_proposed_start_date', 'proposedstartdate', 'proposed_start_date', 'startdate', 'start_date', 'prgproposedstartdate'],
  schedule_code: ['schedulecode', 'schedule_code', 'scheduleid', 'schedule_id', 'schcode', 'schedule'],
  batch_location: ['batchlocation', 'batch_location', 'location', 'venue', 'city', 'mode', 'traininglocation', 'place'],
  facilitator_code: ['facilitatorcode', 'facilitator_code', 'facilitator', 'trainer', 'trainercode', 'trainer_code', 'instructor', 'faculty', 'facultycode'],
  status: ['batchstatus', 'batch_status', 'status', 'state']
};

export const matchBatchHeaderField = (headerCell: any): BatchFieldKey | null => {
  const clean = cleanHeaderKey(headerCell);
  if (!clean) return null;
  for (const [fieldKey, aliases] of Object.entries(BATCH_HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (clean === cleanHeaderKey(alias)) {
        return fieldKey as BatchFieldKey;
      }
    }
  }
  return null;
};

export type NominationFieldKey =
  | 'nominee_employee_code'
  | 'employee_name'
  | 'nominator_employee_code'
  | 'nomination_datetime'
  | 'target_competencies'
  | 'current_levels'
  | 'batch_code'
  | 'status';

export const NOMINATION_HEADER_ALIASES: Record<NominationFieldKey, string[]> = {
  nominee_employee_code: ['nomineeemployeecode', 'nominee_employee_code', 'employeecode', 'employee_code', 'empcode', 'emp_code', 'nomineecode', 'employeeid', 'nominee', 'empid', 'candidateid'],
  employee_name: ['employeename', 'employee_name', 'nomineename', 'nominee_name', 'name', 'fullname', 'empname'],
  nominator_employee_code: ['nominatoremployeecode', 'nominator_employee_code', 'nominatorcode', 'nominator_code', 'nominatedby', 'nominated_by', 'manager', 'managercode'],
  nomination_datetime: ['nominationdatetime', 'nomination_datetime', 'nominationdate', 'nomination_date', 'nominateddate', 'datetime', 'date'],
  target_competencies: ['targetcompetencykpi', 'targetcompetency', 'target_competency', 'targetcompetencies', 'target_competencies', 'competency', 'kpi', 'skill', 'skills'],
  current_levels: ['currentlevel', 'current_level', 'currentlevels', 'current_levels', 'level', 'proficiency', 'grade'],
  batch_code: ['batchcode', 'batch_code', 'batchno', 'batch_no', 'batchid', 'batch_id', 'batch'],
  status: ['status', 'nominationstatus', 'state']
};

export const matchNominationHeaderField = (headerCell: any): NominationFieldKey | null => {
  const clean = cleanHeaderKey(headerCell);
  if (!clean) return null;
  for (const [fieldKey, aliases] of Object.entries(NOMINATION_HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (clean === cleanHeaderKey(alias)) {
        return fieldKey as NominationFieldKey;
      }
    }
  }
  return null;
};

export type ScheduleFieldKey =
  | 'activity_date'
  | 'activity'
  | 'module_code'
  | 'status'
  | 'arrangements'
  | 'batch_code';

export const SCHEDULE_HEADER_ALIASES: Record<ScheduleFieldKey, string[]> = {
  activity_date: ['activitydate', 'activity_date', 'date', 'sessiondate', 'datetime', 'scheduledate', 'schedule_date', 'day'],
  activity: ['activity', 'activityname', 'activity_name', 'session', 'topic', 'event', 'description', 'activitydescription', 'title'],
  module_code: ['modulecode', 'module_code', 'moduleid', 'module_id', 'modcode', 'mod_code', 'module', 'sessioncode'],
  status: ['status', 'activitystatus', 'sessionstatus', 'state'],
  arrangements: ['arrangements', 'arrangementstatus', 'arrangement_status', 'logistics', 'setup'],
  batch_code: ['batchcode', 'batch_code', 'batchno', 'batch_no', 'batchid', 'batch_id', 'batch']
};

export const matchScheduleHeaderField = (headerCell: any): ScheduleFieldKey | null => {
  const clean = cleanHeaderKey(headerCell);
  if (!clean) return null;
  for (const [fieldKey, aliases] of Object.entries(SCHEDULE_HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (clean === cleanHeaderKey(alias)) {
        return fieldKey as ScheduleFieldKey;
      }
    }
  }
  return null;
};

export type AttendanceFieldKey =
  | 'nominee_employee_code'
  | 'module_code'
  | 'status'
  | 'reported_datetime'
  | 'intermittent_exit_time'
  | 'intermittent_entry_time'
  | 'completed_datetime'
  | 'remarks'
  | 'batch_code';

export const ATTENDANCE_HEADER_ALIASES: Record<AttendanceFieldKey, string[]> = {
  nominee_employee_code: ['nomineeemployeecode', 'nominee_employee_code', 'employeecode', 'employee_code', 'empcode', 'emp_code', 'nomineecode', 'employeeid', 'nominee', 'empid'],
  module_code: ['modulecode', 'module_code', 'moduleid', 'module_id', 'modcode', 'mod_code', 'module', 'sessioncode'],
  status: ['status', 'attendancestatus', 'attendance_status', 'presence', 'attendance'],
  reported_datetime: ['reporteddatetime', 'reported_datetime', 'reportedtime', 'intime', 'in_time', 'checkin', 'check_in', 'arrivaltime'],
  intermittent_exit_time: ['intermittentexittime', 'intermittent_exit_time', 'exittime', 'exit_time', 'outtime', 'out_time', 'breakout'],
  intermittent_entry_time: ['intermittententrytime', 'intermittent_entry_time', 'entrytime', 'entry_time', 'returntime', 'return_time', 'breakin'],
  completed_datetime: ['completeddatetime', 'completed_datetime', 'completedtime', 'completed_time', 'signout', 'sign_out', 'checkout', 'check_out', 'departuretime'],
  remarks: ['remarks', 'remark', 'comment', 'comments', 'notes', 'note', 'reason'],
  batch_code: ['batchcode', 'batch_code', 'batchno', 'batch_no', 'batchid', 'batch_id', 'batch']
};

export const matchAttendanceHeaderField = (headerCell: any): AttendanceFieldKey | null => {
  const clean = cleanHeaderKey(headerCell);
  if (!clean) return null;
  for (const [fieldKey, aliases] of Object.entries(ATTENDANCE_HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (clean === cleanHeaderKey(alias)) {
        return fieldKey as AttendanceFieldKey;
      }
    }
  }
  return null;
};

// =========================================================================
// Dynamic Header Detection Engine
// Detects Horizontal Tabular headers AND Vertical Key-Value forms
// =========================================================================

export interface HeaderDetectionResult<T extends string> {
  isVerticalKeyVal: boolean;
  headerRowIdx: number;
  dataStartRowIdx: number;
  colMap: Partial<Record<T, number>>;
  keyRowMap?: Partial<Record<T, number>>;
  keyColIdx?: number;
  detectedHeaders: string[];
}

export const detectSheetStructure = <T extends string>(
  rows: any[][],
  matcher: (cell: any) => T | null,
  allowVerticalForm = false
): HeaderDetectionResult<T> => {
  if (!rows || rows.length === 0) {
    return {
      isVerticalKeyVal: false,
      headerRowIdx: 0,
      dataStartRowIdx: 1,
      colMap: {},
      detectedHeaders: []
    };
  }

  // 1. Check for Vertical / Key-Value form layout if allowed (e.g. BatchData where Col A = Field Name, Col B = Value)
  if (allowVerticalForm) {
    const maxColsToCheck = Math.min(5, Math.max(...rows.map(r => (Array.isArray(r) ? r.length : 0))));
    for (let c = 0; c < maxColsToCheck; c++) {
      const matchedFieldRows = new Map<T, number>();
      for (let r = 0; r < Math.min(rows.length, 30); r++) {
        const cell = rows[r]?.[c];
        const match = matcher(cell);
        if (match && !matchedFieldRows.has(match)) {
          matchedFieldRows.set(match, r);
        }
      }

      // If at least 3 distinct field keys appear down this single column, it's a Vertical Key-Value sheet!
      if (matchedFieldRows.size >= 3) {
        const keyRowMap: Partial<Record<T, number>> = {};
        const detectedHeaders: string[] = [];
        matchedFieldRows.forEach((rowIdx, fieldKey) => {
          keyRowMap[fieldKey] = rowIdx;
          detectedHeaders.push(String(fieldKey));
        });

        return {
          isVerticalKeyVal: true,
          headerRowIdx: 0,
          dataStartRowIdx: c + 1, // Data starts in the next column(s)
          colMap: {},
          keyRowMap,
          keyColIdx: c,
          detectedHeaders
        };
      }
    }
  }

  // 2. Horizontal Tabular Layout Detection
  // Scan rows 0 to 25 to find the row with the best header match score
  let bestRowIdx = 0;
  let bestColMap: Partial<Record<T, number>> = {};
  let bestMatchedCount = 0;
  let bestDetectedHeaders: string[] = [];

  const maxScanRows = Math.min(rows.length, 25);
  for (let r = 0; r < maxScanRows; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const currentColMap: Partial<Record<T, number>> = {};
    const detected: string[] = [];

    row.forEach((cell, colIdx) => {
      const match = matcher(cell);
      if (match && currentColMap[match] === undefined) {
        currentColMap[match] = colIdx;
        detected.push(`${String(match)} (Col ${colIdx})`);
      }
    });

    const matchCount = Object.keys(currentColMap).length;
    if (matchCount > bestMatchedCount) {
      bestMatchedCount = matchCount;
      bestRowIdx = r;
      bestColMap = currentColMap;
      bestDetectedHeaders = detected;
    }
  }

  // If no match found at all, fall back to row 0
  if (bestMatchedCount === 0 && rows[0] && Array.isArray(rows[0])) {
    rows[0].forEach((cell, colIdx) => {
      const match = matcher(cell);
      if (match && bestColMap[match] === undefined) {
        bestColMap[match] = colIdx;
        bestDetectedHeaders.push(`${String(match)} (Col ${colIdx})`);
      }
    });
  }

  return {
    isVerticalKeyVal: false,
    headerRowIdx: bestRowIdx,
    dataStartRowIdx: bestRowIdx + 1,
    colMap: bestColMap,
    detectedHeaders: bestDetectedHeaders
  };
};

/**
 * Extract cell value safely from row or column with date formatting
 */
export const extractCellValue = (
  val: any,
  isDateField = false,
  includeTime = false
): string => {
  if (val === undefined || val === null) return '';
  return normalizeExcelCellValue(val, isDateField, includeTime);
};

/**
 * Explicit Row-to-Batch Mapper for Horizontal Tabular Rows
 * STRICT RULE: One Excel Row = One Batch Record.
 */
export const mapHorizontalRowToBatch = (
  row: any[],
  colMap: Partial<Record<BatchFieldKey, number>>,
  rowNumber: number,
  existingBatchCodesMap: Set<string>
): { batch: (TrainingBatch & { isExisting?: boolean; rowNumber?: number }) | null; error?: string } => {
  // Check if row is completely empty
  const hasData = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
  if (!hasData) {
    return { batch: null };
  }

  const rawBatchCode = colMap.batch_code !== undefined ? row[colMap.batch_code] : undefined;
  const batchCode = extractCellValue(rawBatchCode);

  // Validate missing Batch Code on actual data row
  if (!batchCode || batchCode.trim() === '') {
    return { batch: null, error: `Missing required BatchCode on Row ${rowNumber}` };
  }

  // Safety check: Ensure header strings are not mapped as batch code
  if (isReservedHeaderString(batchCode)) {
    const err = `Invalid batch record rejected on Row ${rowNumber}: '${batchCode}' is an Excel column header name, not a valid batch record.`;
    return { batch: null, error: err };
  }

  const programCode = extractCellValue(colMap.program_code !== undefined ? row[colMap.program_code] : undefined) || 'PRG0000000001';
  const programName = extractCellValue(colMap.program_name !== undefined ? row[colMap.program_name] : undefined);
  const rawHeadCount = extractCellValue(colMap.head_count !== undefined ? row[colMap.head_count] : undefined);
  const headCount = Number(rawHeadCount) || 0;

  const batchCreatedDate = extractCellValue(colMap.batch_created_date !== undefined ? row[colMap.batch_created_date] : undefined, true) || new Date().toISOString().split('T')[0];
  const programRequestedDate = extractCellValue(colMap.program_requested_date !== undefined ? row[colMap.program_requested_date] : undefined, true);
  const programRequestAcceptedDate = extractCellValue(colMap.program_requested_accepted_date !== undefined ? row[colMap.program_requested_accepted_date] : undefined, true);
  const programRequestedStartDate = extractCellValue(colMap.program_requested_start_date !== undefined ? row[colMap.program_requested_start_date] : undefined, true);
  const programProposedStartDate = extractCellValue(colMap.program_proposed_start_date !== undefined ? row[colMap.program_proposed_start_date] : undefined, true);
  const scheduleCode = extractCellValue(colMap.schedule_code !== undefined ? row[colMap.schedule_code] : undefined);
  const batchLocation = extractCellValue(colMap.batch_location !== undefined ? row[colMap.batch_location] : undefined) || 'Hyderabad';
  const facilitatorCode = extractCellValue(colMap.facilitator_code !== undefined ? row[colMap.facilitator_code] : undefined) || '';
  const status = extractCellValue(colMap.status !== undefined ? row[colMap.status] : undefined) || 'In Progress';

  const isExisting = existingBatchCodesMap.has(batchCode.toUpperCase());

  const batchObj: TrainingBatch & { isExisting?: boolean; rowNumber?: number } = {
    id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    batchCode,
    programCode,
    programName: programName || undefined,
    headCount,
    batchCreatedDate,
    programRequestedDate: programRequestedDate || undefined,
    programRequestAcceptedDate: programRequestAcceptedDate || undefined,
    programRequestedStartDate: programRequestedStartDate || undefined,
    programProposedStartDate: programProposedStartDate || undefined,
    scheduleCode: scheduleCode || undefined,
    batchLocation,
    facilitatorCode,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isExisting,
    rowNumber
  };

  return { batch: batchObj };
};

/**
 * Explicit Column-to-Batch Mapper for Vertical Key-Value Sheets
 */
export const mapVerticalColumnToBatch = (
  rows: any[][],
  keyRowMap: Partial<Record<BatchFieldKey, number>>,
  colIdx: number,
  existingBatchCodesMap: Set<string>
): { batch: (TrainingBatch & { isExisting?: boolean; rowNumber?: number }) | null; error?: string } => {
  const getVal = (key: BatchFieldKey, isDate = false, isTime = false) => {
    const r = keyRowMap[key];
    if (r === undefined) return '';
    return extractCellValue(rows[r]?.[colIdx], isDate, isTime);
  };

  const batchCode = getVal('batch_code');
  if (!batchCode || batchCode.trim() === '') {
    return { batch: null };
  }

  if (isReservedHeaderString(batchCode)) {
    return { batch: null, error: `Invalid batch record: '${batchCode}' is an Excel column header name.` };
  }

  const programCode = getVal('program_code') || 'PRG0000000001';
  const programName = getVal('program_name');
  const headCount = Number(getVal('head_count')) || 0;
  const batchCreatedDate = getVal('batch_created_date', true) || new Date().toISOString().split('T')[0];
  const programRequestedDate = getVal('program_requested_date', true);
  const programRequestAcceptedDate = getVal('program_requested_accepted_date', true);
  const programRequestedStartDate = getVal('program_requested_start_date', true);
  const programProposedStartDate = getVal('program_proposed_start_date', true);
  const scheduleCode = getVal('schedule_code');
  const batchLocation = getVal('batch_location') || 'Hyderabad';
  const facilitatorCode = getVal('facilitator_code') || '';
  const status = getVal('status') || 'In Progress';

  const isExisting = existingBatchCodesMap.has(batchCode.toUpperCase());

  const batchObj: TrainingBatch & { isExisting?: boolean; rowNumber?: number } = {
    id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    batchCode,
    programCode,
    programName: programName || undefined,
    headCount,
    batchCreatedDate,
    programRequestedDate: programRequestedDate || undefined,
    programRequestAcceptedDate: programRequestAcceptedDate || undefined,
    programRequestedStartDate: programRequestedStartDate || undefined,
    programProposedStartDate: programProposedStartDate || undefined,
    scheduleCode: scheduleCode || undefined,
    batchLocation,
    facilitatorCode,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isExisting,
    rowNumber: colIdx + 1
  };

  return { batch: batchObj };
};

/**
 * Backward compatible mapExcelRowToBatch
 */
export const mapExcelRowToBatch = (
  row: any[],
  headerMap: Record<string, number>,
  rowNumber: number,
  existingBatchCodesMap: Set<string>
): { batch: (TrainingBatch & { isExisting?: boolean; rowNumber?: number }) | null; error?: string } => {
  const colMap: Partial<Record<BatchFieldKey, number>> = {};
  Object.entries(headerMap).forEach(([rawKey, colIdx]) => {
    const matched = matchBatchHeaderField(rawKey);
    if (matched) colMap[matched] = colIdx;
  });
  return mapHorizontalRowToBatch(row, colMap, rowNumber, existingBatchCodesMap);
};

/**
 * Parse uploaded Excel file containing BatchData, BatchSchedule, NominationData, Attendance
 * STRICTLY uses ROW-BY-ROW parsing to prevent column headers from being mapped as records.
 */
export const parseBatchExcelWorkbook = async (
  fileOrBuffer: File | ArrayBuffer,
  existingBatches: TrainingBatch[] = []
): Promise<ParsedBatchImportData> => {
  const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellText: false });

  const issues: BatchImportValidationIssue[] = [];
  const warnings: string[] = [];
  const parsedBatches: Array<TrainingBatch & { isExisting?: boolean; rowNumber?: number }> = [];
  const parsedSchedules: Array<Omit<BatchScheduleActivity, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }> = [];
  const parsedNominees: Array<Omit<BatchNominee, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }> = [];
  const parsedAttendance: Array<Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }> = [];

  const existingBatchCodesMap = new Set(
    existingBatches
      .filter(b => !isInvalidBatchRecord(b))
      .map(b => b.batchCode.trim().toUpperCase())
  );

  // ----------------------------------------------------
  // 1. Parse BatchData Sheet
  // ----------------------------------------------------
  const batchSheetName = workbook.SheetNames.find(s => {
    const l = s.toLowerCase().trim();
    return l.includes('batchdata') || l === 'batch' || l === 'batches' || l.includes('trainingbatch');
  }) || (workbook.SheetNames.length === 1 ? workbook.SheetNames[0] : undefined);

  let detectedHeaderRowDisplay = '1';
  let detectedDataRowsCount = 0;
  let batchCodeColumnName = 'BatchCode';
  let firstActualBatchCode = '';
  let invalidRowsCount = 0;

  if (batchSheetName && workbook.Sheets[batchSheetName]) {
    const sheet = workbook.Sheets[batchSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const structure = detectSheetStructure<BatchFieldKey>(rawRows, matchBatchHeaderField, true);

    if (structure.isVerticalKeyVal && structure.keyRowMap) {
      // Key-Value Transposed Form (Column A = Keys, Column B/C = Data)
      detectedHeaderRowDisplay = 'Vertical Column ' + ((structure.keyColIdx ?? 0) + 1);
      batchCodeColumnName = 'Key Row ' + ((structure.keyRowMap.batch_code ?? 0) + 1);

      const maxCols = Math.max(...rawRows.map(r => (Array.isArray(r) ? r.length : 0)));
      for (let c = structure.dataStartRowIdx; c < maxCols; c++) {
        const { batch, error } = mapVerticalColumnToBatch(rawRows, structure.keyRowMap, c, existingBatchCodesMap);
        if (error) {
          invalidRowsCount++;
          issues.push({
            type: 'error',
            sheet: 'BatchData',
            row: c + 1,
            message: error
          });
        } else if (batch) {
          detectedDataRowsCount++;
          if (!firstActualBatchCode) firstActualBatchCode = batch.batchCode;
          parsedBatches.push(batch);
          console.log('BATCH ROW:', batch);
        }
      }
    } else {
      // Horizontal Tabular Format (Row H = Column Headers, Rows H+1..N = Data)
      detectedHeaderRowDisplay = `Row ${structure.headerRowIdx + 1}`;
      batchCodeColumnName = structure.colMap.batch_code !== undefined ? `Column ${structure.colMap.batch_code + 1}` : 'BatchCode';

      for (let r = structure.dataStartRowIdx; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        // Skip completely empty rows
        const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
        if (!hasContent) continue;

        const excelRowNum = r + 1;
        const { batch, error } = mapHorizontalRowToBatch(row, structure.colMap, excelRowNum, existingBatchCodesMap);

        if (error) {
          invalidRowsCount++;
          issues.push({
            type: 'error',
            sheet: 'BatchData',
            row: excelRowNum,
            message: error
          });
        } else if (batch) {
          detectedDataRowsCount++;
          if (!firstActualBatchCode) firstActualBatchCode = batch.batchCode;
          parsedBatches.push(batch);
          console.log('BATCH ROW:', batch);
        }
      }
    }

    // Diagnostic logging as required in Section 16
    console.log('========== BATCH EXCEL IMPORT ==========');
    console.log('Worksheet:', batchSheetName);
    console.log('Detected Header Row:', detectedHeaderRowDisplay);
    console.log('Detected Data Rows:', detectedDataRowsCount);
    console.log('BatchCode Column:', batchCodeColumnName);
    console.log('First Actual Batch Code:', firstActualBatchCode || 'None');
    console.log('Total Valid Batches:', parsedBatches.length);
    console.log('Total Invalid Rows:', invalidRowsCount);
    console.log('=========================================');
  } else {
    issues.push({
      type: 'warning',
      sheet: 'General',
      row: 1,
      message: 'Workbook did not contain a "BatchData" sheet. Looking for batch references in other sheets.'
    });
  }

  // Fallback default batch code if only 1 batch is in the file
  const defaultBatchCode = parsedBatches[0]?.batchCode || (existingBatches[0]?.batchCode || 'BTCH0000000001');

  // ----------------------------------------------------
  // 2. Parse BatchSchedule Sheet (ROW-BASED)
  // ----------------------------------------------------
  const scheduleSheetName = workbook.SheetNames.find(s => {
    const l = s.toLowerCase().trim();
    return l.includes('schedule') || l.includes('activity') || l.includes('activities');
  });

  if (scheduleSheetName && workbook.Sheets[scheduleSheetName]) {
    const sheet = workbook.Sheets[scheduleSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const structure = detectSheetStructure<ScheduleFieldKey>(rawRows, matchScheduleHeaderField, false);

    for (let r = structure.dataStartRowIdx; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasContent) continue;

      const excelRowNum = r + 1;
      const activity = extractCellValue(structure.colMap.activity !== undefined ? row[structure.colMap.activity] : undefined);
      const activityDate = extractCellValue(structure.colMap.activity_date !== undefined ? row[structure.colMap.activity_date] : undefined, true, true);
      const moduleCode = extractCellValue(structure.colMap.module_code !== undefined ? row[structure.colMap.module_code] : undefined);
      const status = extractCellValue(structure.colMap.status !== undefined ? row[structure.colMap.status] : undefined) || 'Completed';
      const arrangements = extractCellValue(structure.colMap.arrangements !== undefined ? row[structure.colMap.arrangements] : undefined) || 'Completed';
      const batchCode = extractCellValue(structure.colMap.batch_code !== undefined ? row[structure.colMap.batch_code] : undefined) || defaultBatchCode;

      // Skip blank or invalid header rows
      if (!activity && !activityDate) continue;
      if (isReservedHeaderString(activity) || isReservedHeaderString(activityDate)) continue;

      parsedSchedules.push({
        batchId: '',
        batchCode: isInvalidBatchRecord({ batchCode }) ? defaultBatchCode : batchCode,
        activityDate: activityDate || new Date().toISOString().split('T')[0],
        activity: activity || 'Delivery Session',
        moduleCode: moduleCode || '-',
        status,
        arrangements,
        rowNumber: excelRowNum
      });
    }
  }

  // ----------------------------------------------------
  // 3. Parse NominationData Sheet (ROW-BASED)
  // ----------------------------------------------------
  const nominationSheetName = workbook.SheetNames.find(s => {
    const l = s.toLowerCase().trim();
    return l.includes('nomination') || l.includes('nominee') || l.includes('employee');
  });

  if (nominationSheetName && workbook.Sheets[nominationSheetName]) {
    const sheet = workbook.Sheets[nominationSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const structure = detectSheetStructure<NominationFieldKey>(rawRows, matchNominationHeaderField, false);

    for (let r = structure.dataStartRowIdx; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasContent) continue;

      const excelRowNum = r + 1;
      const employeeCode = extractCellValue(structure.colMap.nominee_employee_code !== undefined ? row[structure.colMap.nominee_employee_code] : undefined);

      // Skip empty or header rows
      if (!employeeCode || isReservedHeaderString(employeeCode)) continue;

      const employeeName = extractCellValue(structure.colMap.employee_name !== undefined ? row[structure.colMap.employee_name] : undefined);
      const nominatorCode = extractCellValue(structure.colMap.nominator_employee_code !== undefined ? row[structure.colMap.nominator_employee_code] : undefined);
      const nominationDateTime = extractCellValue(structure.colMap.nomination_datetime !== undefined ? row[structure.colMap.nomination_datetime] : undefined, true, true);
      const targetCompetencies = extractCellValue(structure.colMap.target_competencies !== undefined ? row[structure.colMap.target_competencies] : undefined);
      const currentLevels = extractCellValue(structure.colMap.current_levels !== undefined ? row[structure.colMap.current_levels] : undefined);
      const batchCode = extractCellValue(structure.colMap.batch_code !== undefined ? row[structure.colMap.batch_code] : undefined) || defaultBatchCode;

      parsedNominees.push({
        batchId: '',
        batchCode: isInvalidBatchRecord({ batchCode }) ? defaultBatchCode : batchCode,
        employeeCode,
        employeeName: employeeName || undefined,
        nominatorEmployeeCode: nominatorCode || undefined,
        nominationDatetime: nominationDateTime || undefined,
        targetCompetencies: targetCompetencies || undefined,
        currentLevels: currentLevels || undefined,
        status: 'Nominated',
        rowNumber: excelRowNum
      });
    }
  }

  // ----------------------------------------------------
  // 4. Parse Attendance Sheet (ROW-BASED)
  // ----------------------------------------------------
  const attendanceSheetName = workbook.SheetNames.find(s => {
    const l = s.toLowerCase().trim();
    return l.includes('attendance');
  });

  if (attendanceSheetName && workbook.Sheets[attendanceSheetName]) {
    const sheet = workbook.Sheets[attendanceSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const structure = detectSheetStructure<AttendanceFieldKey>(rawRows, matchAttendanceHeaderField, false);

    for (let r = structure.dataStartRowIdx; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasContent) continue;

      const excelRowNum = r + 1;
      const employeeCode = extractCellValue(structure.colMap.nominee_employee_code !== undefined ? row[structure.colMap.nominee_employee_code] : undefined);
      const moduleCode = extractCellValue(structure.colMap.module_code !== undefined ? row[structure.colMap.module_code] : undefined);

      if (!employeeCode || !moduleCode || isReservedHeaderString(employeeCode) || isReservedHeaderString(moduleCode)) {
        continue;
      }

      const rawStatus = extractCellValue(structure.colMap.status !== undefined ? row[structure.colMap.status] : undefined) || 'Attended';

      let status: AttendanceStatus = 'Attended';
      const stLower = rawStatus.toLowerCase();
      if (stLower.includes('absent')) status = 'Absent';
      else if (stLower.includes('late')) status = 'Late';
      else if (stLower.includes('partial')) status = 'Partial';
      else if (stLower.includes('excused')) status = 'Excused';
      else if (stLower.includes('not') || stLower.includes('unmarked')) status = 'Not Marked';

      const reportedDatetime = extractCellValue(structure.colMap.reported_datetime !== undefined ? row[structure.colMap.reported_datetime] : undefined, true, true);
      const intermittentExitTime = extractCellValue(structure.colMap.intermittent_exit_time !== undefined ? row[structure.colMap.intermittent_exit_time] : undefined, true, true);
      const intermittentEntryTime = extractCellValue(structure.colMap.intermittent_entry_time !== undefined ? row[structure.colMap.intermittent_entry_time] : undefined, true, true);
      const completedDatetime = extractCellValue(structure.colMap.completed_datetime !== undefined ? row[structure.colMap.completed_datetime] : undefined, true, true);
      const remarks = extractCellValue(structure.colMap.remarks !== undefined ? row[structure.colMap.remarks] : undefined);
      const batchCode = extractCellValue(structure.colMap.batch_code !== undefined ? row[structure.colMap.batch_code] : undefined) || defaultBatchCode;

      parsedAttendance.push({
        batchId: '',
        batchCode: isInvalidBatchRecord({ batchCode }) ? defaultBatchCode : batchCode,
        employeeCode,
        moduleCode,
        reportedDatetime: reportedDatetime || undefined,
        intermittentExitTime: intermittentExitTime || undefined,
        intermittentEntryTime: intermittentEntryTime || undefined,
        completedDatetime: completedDatetime || undefined,
        status,
        remarks: remarks || undefined,
        rowNumber: excelRowNum
      });
    }
  }

  // Populate formatted warning messages
  issues.forEach(iss => {
    warnings.push(`[${iss.sheet}] Row ${iss.row}: ${iss.message}`);
  });

  return {
    batches: parsedBatches,
    schedules: parsedSchedules,
    nominees: parsedNominees,
    attendance: parsedAttendance,
    issues,
    warnings
  };
};

/**
 * Resolve employee name from user list if available, or return empty string
 */
export const resolveEmployeeName = (empCode?: string, users: any[] = [], storedName?: string): string => {
  if (storedName && storedName.trim()) return storedName.trim();
  const trimmed = empCode?.trim().toUpperCase();
  if (!trimmed) return '';
  const match = users.find(u => 
    u.id?.toUpperCase() === trimmed || 
    u.username?.toUpperCase() === trimmed || 
    u.name?.toUpperCase() === trimmed
  );
  return match?.name || '';
};

/**
 * Resolve employee details (name, department, designation, email, location)
 * from Employee Master (AssessmentContext) or User list with fallback
 */
export const resolveEmployeeDetails = (
  employeeCode?: string,
  employeesOrUsers: any[] = [],
  fallbackUsers: any[] = [],
  fallbackDefaults?: { employeeName?: string; department?: string; designation?: string; location?: string }
): { name: string; employeeName: string; department: string; designation: string; location?: string; email?: string } => {
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

  // 1. Search in first array (usually employees from AssessmentContext or users)
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
      email: empMatch.email || ''
    };
  }

  // 2. Search in fallback users array
  const userMatch = fallbackUsers.find(u => 
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
      designation: (userMatch as any).designation || fallbackDefaults?.designation || 'Employee',
      location: (userMatch as any).location || fallbackDefaults?.location || 'Hyderabad',
      email: userMatch.email || ''
    };
  }

  const finalName = fallbackDefaults?.employeeName || employeeCode;
  return {
    name: finalName,
    employeeName: finalName,
    department: fallbackDefaults?.department || 'Operations',
    designation: fallbackDefaults?.designation || 'Employee',
    location: fallbackDefaults?.location || 'Hyderabad'
  };
};

/**
 * Export Batch to Excel Workbook (.xlsx) matching exact structure of BTCH0000000002.xlsx
 * Includes 5 sheets: BatchData, NominationData, BatchSchedule, Attendance, Attendance Summary
 */
export const exportBatchToExcel = async (
  batch: TrainingBatch,
  schedules: BatchScheduleActivity[],
  nominees: BatchNominee[],
  attendance: TrainingAttendanceRecord[],
  users: any[] = []
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY Learning & Development Operations';
  workbook.created = new Date();

  const brandNavy = '1E3A8A';
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: brandNavy }
  };
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  };

  // Sheet 1: BatchData
  const batchSheet = workbook.addWorksheet('BatchData');
  batchSheet.columns = [
    { header: 'Batch Code', key: 'batchCode', width: 18 },
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 30 },
    { header: 'Head Count', key: 'headCount', width: 12 },
    { header: 'Created Date', key: 'createdDate', width: 18 },
    { header: 'Requested Date', key: 'requestedDate', width: 18 },
    { header: 'Request Accepted Date', key: 'requestAcceptedDate', width: 22 },
    { header: 'Requested Start Date', key: 'requestedStartDate', width: 20 },
    { header: 'Proposed Start Date', key: 'proposedStartDate', width: 20 },
    { header: 'Schedule Code', key: 'scheduleCode', width: 18 },
    { header: 'Location', key: 'location', width: 18 },
    { header: 'Facilitator', key: 'facilitator', width: 18 },
    { header: 'Batch Status', key: 'batchStatus', width: 16 }
  ];

  batchSheet.addRow({
    batchCode: batch.batchCode,
    programCode: batch.programCode,
    programName: batch.programName || '',
    headCount: batch.headCount || nominees.length || 0,
    createdDate: batch.batchCreatedDate || '',
    requestedDate: batch.programRequestedDate || '',
    requestAcceptedDate: batch.programRequestAcceptedDate || '',
    requestedStartDate: batch.programRequestedStartDate || '',
    proposedStartDate: batch.programProposedStartDate || '',
    scheduleCode: batch.scheduleCode || '',
    location: batch.batchLocation || '',
    facilitator: batch.facilitatorCode || '',
    batchStatus: batch.status || 'In Progress'
  });

  // Sheet 2: NominationData
  const nominationSheet = workbook.addWorksheet('NominationData');
  nominationSheet.columns = [
    { header: 'Nominee Employee Code', key: 'nomineeEmployeeCode', width: 24 },
    { header: 'Nominator Employee Code', key: 'nominatorEmployeeCode', width: 24 },
    { header: 'Nomination Date/Time', key: 'nominationDateTime', width: 22 },
    { header: 'Target Competency/KPI', key: 'targetCompetency', width: 35 },
    { header: 'Current Level', key: 'currentLevel', width: 24 }
  ];

  nominees.forEach(n => {
    nominationSheet.addRow({
      nomineeEmployeeCode: n.employeeCode,
      nominatorEmployeeCode: n.nominatorEmployeeCode || '',
      nominationDateTime: n.nominationDatetime || '',
      targetCompetency: n.targetCompetencies || '',
      currentLevel: n.currentLevels || ''
    });
  });

  // Sheet 3: BatchSchedule
  const scheduleSheet = workbook.addWorksheet('BatchSchedule');
  scheduleSheet.columns = [
    { header: 'Activity Date', key: 'activityDate', width: 22 },
    { header: 'Activity', key: 'activity', width: 32 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Arrangements', key: 'arrangements', width: 16 }
  ];

  schedules.forEach(s => {
    scheduleSheet.addRow({
      activityDate: s.activityDate,
      activity: s.activity,
      moduleCode: s.moduleCode || '-',
      status: s.status,
      arrangements: s.arrangements
    });
  });

  // Sheet 4: Attendance
  const attendanceSheet = workbook.addWorksheet('Attendance');
  attendanceSheet.columns = [
    { header: 'Nominee Employee Code', key: 'nomineeEmployeeCode', width: 24 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Reported Date/Time', key: 'reportedDateTime', width: 22 },
    { header: 'Intermittent Exit Time', key: 'intermittentExitTime', width: 22 },
    { header: 'Intermittent Entry Time', key: 'intermittentEntryTime', width: 22 },
    { header: 'Completed Date/Time', key: 'completedDateTime', width: 22 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Remarks', key: 'remarks', width: 28 }
  ];

  attendance.forEach(a => {
    attendanceSheet.addRow({
      nomineeEmployeeCode: a.employeeCode,
      moduleCode: a.moduleCode,
      reportedDateTime: a.reportedDatetime || '',
      intermittentExitTime: a.intermittentExitTime || '',
      intermittentEntryTime: a.intermittentEntryTime || '',
      completedDateTime: a.completedDatetime || '',
      status: a.status,
      remarks: a.remarks || ''
    });
  });

  // Sheet 5: Attendance Summary
  const summarySheet = workbook.addWorksheet('Attendance Summary');
  summarySheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 18 },
    { header: 'Employee Name', key: 'employeeName', width: 24 },
    { header: 'Module Count', key: 'moduleCount', width: 16 },
    { header: 'Attended', key: 'attended', width: 14 },
    { header: 'Absent', key: 'absent', width: 14 },
    { header: 'Attendance %', key: 'attendanceRate', width: 16 }
  ];

  const uniqueModules = Array.from(new Set(
    schedules.map(s => s.moduleCode).filter((m): m is string => Boolean(m && m !== '-'))
  ));

  nominees.forEach(n => {
    const empRecords = attendance.filter(a => a.employeeCode.toUpperCase() === n.employeeCode.toUpperCase());
    const attendedCount = empRecords.filter(a => a.status === 'Attended' || a.status === 'Late').length;
    const absentCount = empRecords.filter(a => a.status === 'Absent').length;
    const modCount = uniqueModules.length || empRecords.length || 1;
    const rate = modCount > 0 ? Math.round((attendedCount / modCount) * 100) : 0;
    const empName = resolveEmployeeName(n.employeeCode, users, n.employeeName);

    summarySheet.addRow({
      employeeId: n.employeeCode,
      employeeName: empName,
      moduleCount: uniqueModules.length,
      attended: attendedCount,
      absent: absentCount,
      attendanceRate: `${rate}%`
    });
  });

  // Style all worksheets
  [batchSheet, nominationSheet, scheduleSheet, attendanceSheet, summarySheet].forEach(ws => {
    ws.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 24;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell(cell => {
          cell.border = borderStyle;
          cell.font = { name: 'Calibri', size: 10 };
        });
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${batch.batchCode || 'Batch'}_Export.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Export Dedicated Attendance Matrix & Log Workbook (.xlsx)
 */
export const exportAttendanceReportToExcel = async (
  batch: TrainingBatch,
  nominees: BatchNominee[],
  schedules: BatchScheduleActivity[],
  attendance: TrainingAttendanceRecord[],
  users?: any[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY Learning & Development Operations';

  const brandNavy = '1E3A8A';
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: brandNavy }
  };
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  };

  const moduleCodes = Array.from(new Set(
    schedules
      .map(s => s.moduleCode)
      .filter((m): m is string => Boolean(m && m !== '-'))
  ));

  // 1. Attendance Matrix Sheet
  const matrixSheet = workbook.addWorksheet('Attendance Matrix');
  const matrixColumns: any[] = [
    { header: 'Employee Code', key: 'empCode', width: 18 },
    { header: 'Employee Name', key: 'empName', width: 24 }
  ];

  moduleCodes.forEach(mod => {
    matrixColumns.push({ header: mod, key: mod, width: 16 });
  });
  matrixColumns.push({ header: 'Overall Rate (%)', key: 'rate', width: 18 });
  matrixSheet.columns = matrixColumns;

  nominees.forEach(nom => {
    const resolvedName = resolveEmployeeName(nom.employeeCode, users, nom.employeeName);
    const rowObj: any = {
      empCode: nom.employeeCode,
      empName: resolvedName || ''
    };

    let attendedCount = 0;
    moduleCodes.forEach(mod => {
      const rec = attendance.find(a => a.employeeCode === nom.employeeCode && a.moduleCode === mod);
      const st = rec ? rec.status : 'Not Marked';
      rowObj[mod] = st;
      if (st === 'Attended' || st === 'Late') attendedCount++;
    });

    const rate = moduleCodes.length > 0 ? Math.round((attendedCount / moduleCodes.length) * 100) : 0;
    rowObj.rate = `${rate}%`;
    matrixSheet.addRow(rowObj);
  });

  // 2. Attendance Details Sheet
  const detailSheet = workbook.addWorksheet('Detailed Records');
  detailSheet.columns = [
    { header: 'Batch Code', key: 'batchCode', width: 18 },
    { header: 'Employee Code', key: 'empCode', width: 18 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Reported Date/Time', key: 'reported', width: 22 },
    { header: 'Intermittent Exit', key: 'exit', width: 20 },
    { header: 'Intermittent Entry', key: 'entry', width: 20 },
    { header: 'Completed Date/Time', key: 'completed', width: 22 },
    { header: 'Remarks', key: 'remarks', width: 26 }
  ];

  attendance.forEach(a => {
    detailSheet.addRow({
      batchCode: batch.batchCode,
      empCode: a.employeeCode,
      moduleCode: a.moduleCode,
      status: a.status,
      reported: a.reportedDatetime || '',
      exit: a.intermittentExitTime || '',
      entry: a.intermittentEntryTime || '',
      completed: a.completedDatetime || '',
      remarks: a.remarks || ''
    });
  });

  // Style worksheets
  [matrixSheet, detailSheet].forEach(ws => {
    ws.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 24;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell(cell => {
          cell.border = borderStyle;
          cell.font = { name: 'Calibri', size: 10 };
        });
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${batch.batchCode || 'Batch'}_Attendance_Report.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Generate a blank Batch Import Excel Template (.xlsx)
 */
export const generateSampleBatchTemplate = async (availablePrograms: any[] = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY Learning & Development Operations';

  const brandNavy = '1E3A8A';
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: brandNavy }
  };

  // Sheet 1: BatchData
  const batchSheet = workbook.addWorksheet('BatchData');
  batchSheet.columns = [
    { header: 'Batch Code', key: 'batchCode', width: 18 },
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 30 },
    { header: 'Head Count', key: 'headCount', width: 12 },
    { header: 'Created Date', key: 'createdDate', width: 18 },
    { header: 'Requested Date', key: 'requestedDate', width: 18 },
    { header: 'Request Accepted Date', key: 'requestAcceptedDate', width: 22 },
    { header: 'Requested Start Date', key: 'requestedStartDate', width: 20 },
    { header: 'Proposed Start Date', key: 'proposedStartDate', width: 20 },
    { header: 'Schedule Code', key: 'scheduleCode', width: 18 },
    { header: 'Location', key: 'location', width: 18 },
    { header: 'Facilitator', key: 'facilitator', width: 18 },
    { header: 'Batch Status', key: 'batchStatus', width: 16 }
  ];

  const progCode = availablePrograms[0]?.programCode || 'PRG0000000001';
  const progName = availablePrograms[0]?.programName || 'Tekla Structures Basic';

  batchSheet.addRow({
    batchCode: 'BTCH0000000001',
    programCode: progCode,
    programName: progName,
    headCount: 2,
    createdDate: '07-Jan-2026',
    requestedDate: '07-Jan-2026',
    requestAcceptedDate: '07-Jan-2026',
    requestedStartDate: '07-Jan-2026',
    proposedStartDate: '07-Jan-2026',
    scheduleCode: 'SCH0000000001',
    location: 'Hyderabad',
    facilitator: 'CE4490',
    batchStatus: 'In Progress'
  });

  // Sheet 2: BatchSchedule
  const scheduleSheet = workbook.addWorksheet('BatchSchedule');
  scheduleSheet.columns = [
    { header: 'Activity Date', key: 'activityDate', width: 22 },
    { header: 'Activity', key: 'activity', width: 32 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Arrangements', key: 'arrangements', width: 16 }
  ];

  scheduleSheet.addRow({
    activityDate: '07-Jan-2026 14:30',
    activity: 'Delivery Session 1',
    moduleCode: 'MDL0000000001',
    status: 'Completed',
    arrangements: 'Completed'
  });
  scheduleSheet.addRow({
    activityDate: '11-Mar-2026',
    activity: '30 Day Manager Review',
    moduleCode: '-',
    status: 'Pending',
    arrangements: 'Arranged'
  });

  // Sheet 3: NominationData
  const nominationSheet = workbook.addWorksheet('NominationData');
  nominationSheet.columns = [
    { header: 'Nominee Employee Code', key: 'nomineeEmployeeCode', width: 24 },
    { header: 'Nominator Employee Code', key: 'nominatorEmployeeCode', width: 24 },
    { header: 'Nomination Date/Time', key: 'nominationDateTime', width: 22 },
    { header: 'Target Competency/KPI', key: 'targetCompetency', width: 35 },
    { header: 'Current Level', key: 'currentLevel', width: 24 }
  ];

  nominationSheet.addRow({
    nomineeEmployeeCode: 'CE803',
    nominatorEmployeeCode: 'CE102',
    nominationDateTime: '07-Jan-2026 10:00',
    targetCompetency: 'Technical Drawing & Quality Standards',
    currentLevel: 'Level 2 - Practitioner'
  });
  nominationSheet.addRow({
    nomineeEmployeeCode: 'CE1885',
    nominatorEmployeeCode: 'CE102',
    nominationDateTime: '07-Jan-2026 10:00',
    targetCompetency: 'Technical Drawing & Quality Standards',
    currentLevel: 'Level 2 - Practitioner'
  });

  // Sheet 4: Attendance
  const attendanceSheet = workbook.addWorksheet('Attendance');
  attendanceSheet.columns = [
    { header: 'Nominee Employee Code', key: 'nomineeEmployeeCode', width: 24 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Reported Date/Time', key: 'reportedDateTime', width: 22 },
    { header: 'Intermittent Exit Time', key: 'intermittentExitTime', width: 22 },
    { header: 'Intermittent Entry Time', key: 'intermittentEntryTime', width: 22 },
    { header: 'Completed Date/Time', key: 'completedDateTime', width: 22 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Remarks', key: 'remarks', width: 28 }
  ];

  attendanceSheet.addRow({
    nomineeEmployeeCode: 'CE803',
    moduleCode: 'MDL0000000001',
    reportedDateTime: '07-Jan-2026 14:28',
    intermittentExitTime: '',
    intermittentEntryTime: '',
    completedDateTime: '07-Jan-2026 15:30',
    status: 'Attended',
    remarks: 'Active participant'
  });
  attendanceSheet.addRow({
    nomineeEmployeeCode: 'CE1885',
    moduleCode: 'MDL0000000001',
    reportedDateTime: '',
    intermittentExitTime: '',
    intermittentEntryTime: '',
    completedDateTime: '',
    status: 'Absent',
    remarks: 'Client meeting conflict'
  });

  [batchSheet, scheduleSheet, nominationSheet, attendanceSheet].forEach(ws => {
    ws.getRow(1).eachCell(cell => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Training_Batch_Import_Template.xlsx';
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadBatchExcelTemplate = generateSampleBatchTemplate;


export type BatchStatus = 
  | 'Planned' 
  | 'In Progress' 
  | 'Completed' 
  | 'Cancelled' 
  | 'On Hold';

export type AttendanceStatus = 
  | 'Present'
  | 'Attended' 
  | 'Absent' 
  | 'Late' 
  | 'Half Day'
  | 'Partial' 
  | 'Excused' 
  | 'Not Marked';

export type ScheduleActivityStatus = 
  | 'Completed' 
  | 'Pending' 
  | 'To be Scheduled' 
  | 'In Progress' 
  | 'Cancelled';

export type ArrangementStatus = 
  | 'Completed' 
  | 'Pending' 
  | 'To be Scheduled' 
  | 'Arranged';

export interface TrainingBatch {
  id: string;
  batchCode: string; // e.g. BTCH0000000001, BTCH0000000002
  programId?: string;
  programCode: string; // e.g. PRG0000000001
  programName?: string;
  batchType?: string; // e.g. Regular, Fast Track, Refresh
  headCount: number; // dynamically matches nominee count
  batchCreatedDate: string; // e.g. 2026-01-07 or 07-Jan-2026
  programRequestedDate?: string;
  programRequestAcceptedDate?: string;
  programRequestedStartDate?: string;
  programProposedStartDate?: string;
  scheduleCode?: string; // e.g. SCH0000000001
  batchLocation: string; // e.g. Hyderabad, Bangalore, Virtual
  facilitatorCode: string; // e.g. CE4490
  facilitatorName?: string;
  facilitatorEmail?: string;
  status: BatchStatus | string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface BatchScheduleActivity {
  id: string;
  batchId: string;
  batchCode?: string;
  dayNumber?: number;
  activityDate: string; // e.g. 07-Jan-2026 14:30
  activity: string; // e.g. Delivery Session 1, Session 1 Learning Review 1, 60 Day Manager Review
  moduleId?: string;
  moduleCode?: string; // e.g. MDL0000000001 or '-'
  moduleName?: string;
  durationHours?: number;
  status: ScheduleActivityStatus | string;
  arrangements: ArrangementStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchNominee {
  id: string;
  batchId: string;
  batchCode?: string;
  employeeCode: string; // e.g. CE803
  employeeName?: string;
  department?: string;
  designation?: string;
  email?: string;
  nominatorEmployeeCode?: string; // e.g. CE102
  nominationDatetime?: string; // e.g. 05-Jan-2026 10:00
  targetCompetencies?: string; // e.g. Technical Drawing & Quality Standards
  currentLevels?: string; // e.g. Level 2 - Practitioner
  status?: string; // e.g. Nominated, Confirmed, Completed
  createdAt: string;
  updatedAt: string;
}

export interface TrainingAttendanceRecord {
  id: string;
  batchId: string;
  batchCode?: string;
  employeeCode: string; // e.g. CE803
  moduleId?: string;
  moduleCode: string; // e.g. MDL0000000001
  sessionDate?: string;
  reportedDatetime?: string; // e.g. 07-Jan-2026 14:28 or ''
  intermittentExitTime?: string;
  intermittentEntryTime?: string;
  completedDatetime?: string; // e.g. 07-Jan-2026 15:32 or ''
  status: AttendanceStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchImportHistoryRecord {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  batchCodes: string[];
  newBatches: number;
  updatedBatches: number;
  nomineesAdded: number;
  schedulesAdded: number;
  attendanceRecordsAdded: number;
  errorCount: number;
  status: 'Success' | 'Partial' | 'Failed';
  details?: {
    batches?: { batchCode: string; action: 'created' | 'updated' | 'skipped' }[];
    nomineesCount?: number;
    schedulesCount?: number;
    attendanceCount?: number;
    errors?: string[];
    warnings?: string[];
  };
}

export interface BatchImportValidationIssue {
  type: 'error' | 'warning';
  sheet: 'BatchData' | 'BatchSchedule' | 'NominationData' | 'Attendance' | 'General';
  row: number;
  batchCode?: string;
  employeeCode?: string;
  moduleCode?: string;
  field?: string;
  message: string;
}

export interface ParsedBatchImportData {
  batches: Array<TrainingBatch & { isExisting?: boolean; rowNumber?: number }>;
  schedules: Array<Omit<BatchScheduleActivity, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }>;
  nominees: Array<Omit<BatchNominee, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }>;
  attendance: Array<Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> & { rowNumber?: number }>;
  issues: BatchImportValidationIssue[];
  warnings?: string[];
}

export type BatchImportParseResult = ParsedBatchImportData;

export type BatchSubTab = 
  | 'list' 
  | 'detail' 
  | 'import' 
  | 'history';

export type BatchDetailTab = 
  | 'overview' 
  | 'employees' 
  | 'schedule' 
  | 'modules'
  | 'attendance' 
  | 'export';

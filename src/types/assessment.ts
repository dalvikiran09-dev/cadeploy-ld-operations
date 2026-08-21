export type AssessmentType = 
  | 'Pre-Assessment' 
  | 'Post-Assessment' 
  | 'Module Assessment' 
  | 'Final Assessment' 
  | 'Other Assessment';

export type AssessmentResult = 'Pass' | 'Fail' | 'Not Attempted';
export type PKTResult = 'Pass' | 'Fail' | 'Not Attempted';
export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave' | 'Transferred' | 'Exited';

export interface TrainingEmployee {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  location?: string;
  employeeType?: string;
  joiningDate?: string;
  managerName?: string;
  email?: string;
  phone?: string;
  status: EmployeeStatus;
  targetCompetencies?: string;
  currentLevels?: string;
  avatar?: string;
  additionalFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type Employee = TrainingEmployee;

export type SkillLevelNumber = 1 | 2 | 3 | 4 | 0; // 0 for Not Assessed

export interface DepartmentSkillConfig {
  id: string;
  departmentName: string;
  skill1: string;
  requiredLevel1: number;
  skill2: string;
  requiredLevel2: number;
  skill3: string;
  requiredLevel3: number;
  skill4?: string;
  requiredLevel4?: number;
  skill5?: string;
  requiredLevel5?: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export type SkillGapStatus = 'Meets Requirement' | 'Development Needed' | 'Significant Gap' | 'Not Assessed';

export interface EmployeeSkillAssessment {
  id: string;
  employeeCode: string;
  employeeName?: string;
  department: string;
  skillName: string;
  skillIndex: number; // 1 to 5
  currentLevel: number; // 1 to 4, 0 for Not Assessed
  requiredLevel: number; // 1 to 4
  gap: number; // max(0, requiredLevel - currentLevel)
  status: SkillGapStatus;
  trainingRequired: boolean;
  recommendedProgramCode?: string;
  recommendedProgramName?: string;
  assessmentDate: string;
  assessedBy: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillAssessmentHistoryRecord {
  id: string;
  employeeCode: string;
  department: string;
  skillName: string;
  level: number;
  assessmentDate: string;
  assessedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface TrainingAssessment {
  id: string;
  employeeId?: string;
  employeeCode: string;
  employeeName?: string;
  department?: string;
  programId?: string;
  programCode: string;
  programName?: string;
  moduleId?: string;
  moduleCode?: string;
  moduleName?: string;
  batchId?: string;
  batchCode?: string;
  assessmentType: AssessmentType | string;
  assessmentDate: string;
  attemptNumber: number;
  maximumScore: number;
  scoreObtained: number;
  percentage: number;
  result: AssessmentResult;
  evaluator?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface TrainingPKT {
  id: string;
  employeeId?: string;
  employeeCode: string;
  employeeName?: string;
  department?: string;
  programId?: string;
  programCode: string;
  programName?: string;
  moduleId?: string;
  moduleCode?: string;
  moduleName?: string;
  batchId?: string;
  batchCode?: string;
  pktType: string;
  pktDate: string;
  attemptNumber: number;
  maximumScore: number;
  scoreObtained: number;
  percentage: number;
  result: PKTResult;
  evaluator?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export type EmployeeProfileTab = 
  | 'overview' 
  | 'training' 
  | 'attendance' 
  | 'assessments' 
  | 'pkts' 
  | 'skills'
  | 'history'
  | 'programs'
  | 'competencies'
  | 'skill-matrix';

export interface EmployeeConsolidatedRecord {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  programCode: string;
  programName: string;
  batchId?: string;
  batchCode: string;
  moduleId?: string;
  moduleCode: string;
  moduleName: string;
  attendanceStatus: string; // 'Present' | 'Absent' | 'Late' | 'Partial' | 'Not Marked'
  attendanceRate?: number;
  preScore?: number;
  preResult?: AssessmentResult;
  postScore?: number;
  postResult?: AssessmentResult;
  improvement?: number; // postScore - preScore (percentage points)
  pktScore?: number;
  pktResult?: PKTResult;
  pktAttemptNumber?: number;
  pktTotalAttempts?: number;
  finalResult: 'Pass' | 'Fail' | 'In Progress' | 'Not Attempted';
}

export interface PrePostComparison {
  programCode: string;
  programName: string;
  moduleCode?: string;
  moduleName?: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  preScore: number;
  postScore: number;
  improvement: number; // positive or negative
}

export interface PKTAttemptHistory {
  employeeCode: string;
  programCode: string;
  moduleCode?: string;
  batchCode?: string;
  attempts: TrainingPKT[];
  totalAttempts: number;
  latestAttempt?: TrainingPKT;
  bestAttempt?: TrainingPKT;
  finalStatus: PKTResult;
}

export interface AssessmentImportRow {
  row: number;
  employeeCode: string;
  programCode: string;
  moduleCode?: string;
  batchCode?: string;
  assessmentType: string;
  assessmentDate: string;
  attemptNumber: number;
  maximumScore: number;
  scoreObtained: number;
  percentage: number;
  result: AssessmentResult;
  evaluator?: string;
  remarks?: string;
  isValid: boolean;
  errors: string[];
}

export interface PKTImportRow {
  row: number;
  employeeCode: string;
  programCode: string;
  moduleCode?: string;
  batchCode?: string;
  pktType: string;
  pktDate: string;
  attemptNumber: number;
  maximumScore: number;
  scoreObtained: number;
  percentage: number;
  result: PKTResult;
  evaluator?: string;
  remarks?: string;
  isValid: boolean;
  errors: string[];
}

export interface EmployeeColumnMapping {
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  location: string;
  employeeType?: string;
  managerName?: string;
  email?: string;
  phone?: string;
  joiningDate?: string;
  status?: string;
}

export interface EmployeeImportRow {
  row: number; // Excel 1-based row index
  rawRecord: Record<string, any>;
  employeeCode: string;
  employeeName: string;
  department?: string;
  designation?: string;
  location?: string;
  employeeType?: string;
  managerName?: string;
  email?: string;
  phone?: string;
  joiningDate?: string;
  status: EmployeeStatus;
  isExisting: boolean;
  action: 'insert' | 'update' | 'error';
  isValid: boolean;
  errors: string[];
}

export interface EmployeeImportErrorDetail {
  row: number;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  designation?: string;
  location?: string;
  email?: string;
  phone?: string;
  employeeType?: string;
  managerName?: string;
  joiningDate?: string;
  errorCode?: string;
  error: string;
  reason: string;
  retryAttempts?: number;
  lastAttemptStatus?: 'PENDING' | 'RETRYING' | 'SUCCESS' | 'FAILED';
  originalRowData?: Partial<TrainingEmployee>;
}

export interface EmployeeImportChunkLog {
  chunkIndex: number;
  totalChunks: number;
  rowRange: string;
  count?: number;
  recordCount?: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  errorMessage?: string;
  errorCode?: string;
  errorDetails?: string;
  errorHint?: string;
  durationMs?: number;
  retryAttempts?: number;
  isSubChunk?: boolean;
}

export interface EmployeeSampleVerification {
  employeeCode: string;
  employeeName: string;
  foundInDb?: boolean;
  foundInDatabase?: boolean;
  department?: string;
  designation?: string;
}

export interface EmployeeImportResult {
  success: boolean;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  isTableMissing?: boolean;
  missingTableMessage?: string;
  databaseErrorCode?: string;
  fileName: string;
  importedBy: string;
  timestamp: string;
  rowsRead: number;
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  verifiedDbCount?: number;
  distinctDbCount?: number;
  duplicateCount?: number;
  initialStats?: {
    rowsRead: number;
    added: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  retryStats?: {
    attempted: number;
    successful: number;
    failed: number;
  };
  runtimeConfig?: {
    supabaseUrl: string;
    projectRef: string;
    isConfigured?: boolean;
    connectivity: 'PASS' | 'FAIL';
    tableStatus: 'FOUND' | 'NOT_FOUND';
    connectivityError?: string;
  };
  singleTestUpsertResult?: {
    employeeCode: string;
    employeeName: string;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorDetails?: string;
    errorHint?: string;
  };
  chunkLogs?: EmployeeImportChunkLog[];
  sampleVerifications?: EmployeeSampleVerification[];
  errors: EmployeeImportErrorDetail[];
  unmappedColumns: string[];
}

export interface EmployeeStatusBreakdown {
  active: number;
  inactive: number;
  onLeave: number;
  transferred: number;
  exited: number;
  other: number;
  allStatuses: Record<string, number>;
}

export interface EmployeeDatabaseDiagnostics {
  totalCount: number;
  distinctCount: number;
  duplicateCount: number;
  statusBreakdown: EmployeeStatusBreakdown;
  sampleVerifications: EmployeeSampleVerification[];
}


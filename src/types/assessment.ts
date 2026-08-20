export type AssessmentType = 
  | 'Pre-Assessment' 
  | 'Post-Assessment' 
  | 'Module Assessment' 
  | 'Final Assessment' 
  | 'Other Assessment';

export type AssessmentResult = 'Pass' | 'Fail' | 'Not Attempted';
export type PKTResult = 'Pass' | 'Fail' | 'Not Attempted';

export interface TrainingEmployee {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  location?: string;
  email?: string;
  joiningDate?: string;
  status: 'Active' | 'Inactive';
  targetCompetencies?: string;
  currentLevels?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  | 'history' 
  | 'attendance' 
  | 'assessments' 
  | 'pkts' 
  | 'programs' 
  | 'competencies';

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
  email?: string;
  joiningDate?: string;
}

export interface EmployeeImportRow {
  row: number; // Excel 1-based row index
  rawRecord: Record<string, any>;
  employeeCode: string;
  employeeName: string;
  department?: string;
  designation?: string;
  location?: string;
  email?: string;
  joiningDate?: string;
  status: 'Active' | 'Inactive';
  isExisting: boolean;
  action: 'insert' | 'update' | 'error';
  isValid: boolean;
  errors: string[];
}

export interface EmployeeImportResult {
  success: boolean;
  fileName: string;
  importedBy: string;
  timestamp: string;
  rowsRead: number;
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    employeeCode?: string;
    employeeName?: string;
    error: string;
    reason: string;
  }>;
  unmappedColumns: string[];
}


export type TrainingStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived';

export interface TrainingProgram {
  id: string;
  programCode: string; // e.g. PRG0000000001
  programName: string;
  programDescription?: string;
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModule {
  id: string;
  moduleCode: string; // e.g. MDL0000000001
  moduleName: string;
  duration: string; // e.g. 01:30:00, 02:00:00, 30 mins
  deliveryMode: string; // e.g. Classroom Training (Offline), Virtual Training (Online), etc.
  status: TrainingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCourse {
  id: string;
  courseCode: string; // e.g. CRS0000000001
  programCode: string;
  moduleCode: string;
  deliveryMode1?: string;
  deliveryMode2?: string;
  deliveryMode3?: string;
  deliveryDay: number; // numeric delivery day (e.g. 1, 8, 15)
  ownerRole: string; // e.g. Manager - Learning & Development
  courseStatus: string; // e.g. Approved, Draft, In Progress, Archived
  preAssessmentCode?: string;
  postAssessmentCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseGroup {
  courseCode: string;
  programCode: string;
  programName?: string;
  status?: string;
  modulesCount: number;
  totalDurationFormatted?: string;
  modules: Array<{
    id: string;
    moduleCode: string;
    moduleName?: string;
    duration?: string;
    deliveryDay: number;
    deliveryMode?: string;
    ownerRole: string;
    status: string;
    preAssessmentCode?: string;
    postAssessmentCode?: string;
    courseRecord: TrainingCourse;
  }>;
}

export interface TrainingImportLog {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  programsAdded: number;
  programsUpdated: number;
  modulesAdded: number;
  modulesUpdated: number;
  coursesAdded: number;
  coursesUpdated: number;
  errorsCount: number;
  status: 'Success' | 'Partial' | 'Failed';
  details?: {
    programs?: { code: string; name: string; action: 'added' | 'updated' | 'skipped' }[];
    modules?: { code: string; name: string; action: 'added' | 'updated' | 'skipped' }[];
    courses?: { courseCode: string; programCode: string; moduleCode: string; action: 'added' | 'updated' | 'skipped' }[];
    errors?: string[];
    warnings?: string[];
  };
}

export type TrainingSubTab = 
  | 'programs' 
  | 'modules' 
  | 'courses' 
  | 'structure' 
  | 'import' 
  | 'history';

export interface ImportValidationIssue {
  type: 'error' | 'warning';
  entity: 'Program' | 'Module' | 'Course';
  row: number;
  code?: string;
  field?: string;
  message: string;
}

export interface ParsedImportData {
  programs: Array<{
    row: number;
    programCode: string;
    programName: string;
    programDescription?: string;
    status: TrainingStatus;
    isExisting: boolean;
  }>;
  modules: Array<{
    row: number;
    moduleCode: string;
    moduleName: string;
    duration: string;
    deliveryMode: string;
    status: TrainingStatus;
    isExisting: boolean;
  }>;
  courses: Array<{
    row: number;
    courseCode: string;
    programCode: string;
    moduleCode: string;
    deliveryMode1?: string;
    deliveryMode2?: string;
    deliveryMode3?: string;
    deliveryDay: number;
    ownerRole: string;
    courseStatus: string;
    preAssessmentCode?: string;
    postAssessmentCode?: string;
    isExisting: boolean;
  }>;
  issues: ImportValidationIssue[];
}

export interface PreflightDiagnosticResult {
  timestamp: string;
  supabaseConfigured: boolean;
  supabaseAuth: 'PASS' | 'FAIL' | 'PENDING';
  authUserId: string | null;
  authUserEmail: string | null;
  publicUsersStatus: 'FOUND' | 'NOT FOUND' | 'PENDING';
  applicationRole: string;
  selectStatus: 'PASS' | 'FAIL' | 'PENDING';
  insertStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  updateStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  deleteStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  courseSchemaStatus: 'PASS' | 'FAIL' | 'PENDING';
  courseSchemaError?: string | null;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isMigrationAllowed: boolean;
  overallStatus: 'READY' | 'NOT READY' | 'FAILED';
  statusMessage: string;
  error?: {
    code: string;
    message: string;
    details?: string;
    hint?: string;
    table?: string;
  };
}

export interface MigrationSummary {
  success: boolean;
  programs: { local: number; supabase: number; added: number; updated: number; failed: number; errors: string[]; detailedErrors?: any[] };
  modules: { local: number; supabase: number; added: number; updated: number; failed: number; errors: string[]; detailedErrors?: any[] };
  courses: { local: number; supabase: number; added: number; updated: number; failed: number; errors: string[]; detailedErrors?: any[] };
  overall: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  sourceOfTruth: 'SUPABASE' | 'APPLICATION_STATE';
  dbCounts?: { programs: number; modules: number; courses: number };
  errorMessage?: string;
  details: {
    programs: Array<{ code: string; name: string; action: string }>;
    modules: Array<{ code: string; name: string; action: string }>;
    courses: Array<{ courseCode: string; programCode: string; moduleCode: string; action: string }>;
    errors: string[];
  };
}


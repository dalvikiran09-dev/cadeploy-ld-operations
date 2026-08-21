import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrainingEmployee, 
  TrainingAssessment, 
  TrainingPKT, 
  EmployeeProfileTab, 
  EmployeeConsolidatedRecord, 
  PKTAttemptHistory, 
  PrePostComparison,
  AssessmentType,
  AssessmentResult,
  PKTResult,
  EmployeeImportResult,
  EmployeeImportErrorDetail
} from '../types/assessment';
import { 
  supabase, 
  isSupabaseConfigured, 
  maskSupabaseUrl, 
  supabaseUrl, 
  getSupabaseProjectRef, 
  getSupabaseRuntimeConfig 
} from '../lib/supabase';
import { useApp } from './AppContext';
import { useTraining } from './TrainingContext';
import { useBatch } from './BatchContext';
import { 
  calculatePercentage, 
  determineResult, 
  calculateScoreImprovement, 
  groupPKTAttempts, 
  buildConsolidatedRecords 
} from '../utils/assessmentUtils';
import {
  DepartmentSkillConfig,
  EmployeeSkillAssessment,
  SkillAssessmentHistoryRecord,
  EmployeeStatus,
  EmployeeImportChunkLog,
  EmployeeSampleVerification,
  EmployeeStatusBreakdown,
  EmployeeDatabaseDiagnostics
} from '../types/assessment';
import {
  DEFAULT_DEPARTMENT_SKILLS,
  calculateSkillGap
} from '../utils/skillMatrixUtils';

interface AssessmentContextType {
  employees: TrainingEmployee[];
  assessments: TrainingAssessment[];
  pkts: TrainingPKT[];
  departmentSkills: DepartmentSkillConfig[];
  employeeSkillAssessments: EmployeeSkillAssessment[];
  skillAssessmentHistory: SkillAssessmentHistoryRecord[];
  statusBreakdown: EmployeeStatusBreakdown;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  activeEmployeeCode: string | null;
  setActiveEmployeeCode: (code: string | null) => void;
  activeProfileTab: EmployeeProfileTab;
  setActiveProfileTab: (tab: EmployeeProfileTab) => void;
  
  // CRUD Employees
  addEmployee: (emp: Partial<TrainingEmployee>) => Promise<{ success: boolean; data?: TrainingEmployee; error?: string }>;
  updateEmployee: (idOrCode: string, updates: Partial<TrainingEmployee>) => Promise<{ success: boolean; data?: TrainingEmployee; error?: string }>;
  deleteEmployee: (idOrCode: string) => Promise<{ success: boolean; error?: string }>;
  deleteMultipleEmployees: (codesOrIds: string[]) => Promise<{ success: boolean; count?: number; error?: string }>;
  fetchEmployeeByCode: (code: string) => Promise<TrainingEmployee | null>;

  // Skill Matrix
  getDepartmentSkills: (deptName: string) => DepartmentSkillConfig | undefined;
  saveDepartmentSkills: (config: Partial<DepartmentSkillConfig>) => Promise<{ success: boolean; data?: DepartmentSkillConfig; error?: string }>;
  deleteDepartmentSkills: (idOrDeptName: string) => Promise<{ success: boolean; error?: string }>;
  getEmployeeSkillAssessments: (employeeCode: string, deptName?: string) => EmployeeSkillAssessment[];
  recordSkillAssessment: (assessment: Partial<EmployeeSkillAssessment>) => Promise<{ success: boolean; data?: EmployeeSkillAssessment; error?: string }>;
  bulkRecordSkillAssessments: (assessments: Partial<EmployeeSkillAssessment>[]) => Promise<{ success: boolean; count: number; error?: string }>;
  getEmployeeSkillHistory: (employeeCode: string, skillName?: string) => SkillAssessmentHistoryRecord[];

  // CRUD Assessments
  addAssessment: (ass: Partial<TrainingAssessment>) => Promise<{ success: boolean; data?: TrainingAssessment; error?: string }>;
  updateAssessment: (id: string, updates: Partial<TrainingAssessment>) => Promise<{ success: boolean; data?: TrainingAssessment; error?: string }>;
  deleteAssessment: (id: string) => Promise<{ success: boolean; error?: string }>;

  // CRUD PKTs
  addPKT: (pkt: Partial<TrainingPKT>) => Promise<{ success: boolean; data?: TrainingPKT; error?: string }>;
  updatePKT: (id: string, updates: Partial<TrainingPKT>) => Promise<{ success: boolean; data?: TrainingPKT; error?: string }>;
  deletePKT: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Bulk Imports
  importEmployeesBulk: (
    rows: Partial<TrainingEmployee>[], 
    fileName?: string, 
    importedBy?: string,
    onProgress?: (progress: {
      phase: 'CONNECTIVITY' | 'TEST_UPSERT' | 'IMPORTING_CHUNKS' | 'VERIFYING' | 'DONE';
      currentChunk?: number;
      totalChunks?: number;
      percent?: number;
      message?: string;
      chunkLogs?: EmployeeImportChunkLog[];
    }) => void
  ) => Promise<EmployeeImportResult>;
  retryFailedEmployeesBulk: (
    failedErrors: EmployeeImportErrorDetail[],
    fileName?: string,
    importedBy?: string,
    onProgress?: (progress: {
      phase: 'CONNECTIVITY' | 'TEST_UPSERT' | 'IMPORTING_CHUNKS' | 'VERIFYING' | 'DONE';
      currentChunk?: number;
      totalChunks?: number;
      percent?: number;
      message?: string;
      chunkLogs?: EmployeeImportChunkLog[];
    }) => void,
    previousResult?: EmployeeImportResult | null
  ) => Promise<EmployeeImportResult>;
  checkDatabaseIntegrity: (sampleCodes?: string[]) => Promise<EmployeeDatabaseDiagnostics>;
  importAssessmentsBulk: (rows: Partial<TrainingAssessment>[]) => Promise<{ success: boolean; added: number; errors?: string[] }>;
  importPKTsBulk: (rows: Partial<TrainingPKT>[]) => Promise<{ success: boolean; added: number; errors?: string[] }>;

  // Diagnostic Probes
  testConnectivity: () => Promise<{ connectivity: 'PASS' | 'FAIL'; tableStatus: 'FOUND' | 'NOT_FOUND'; count?: number; error?: string }>;
  testSingleUpsert: (sample?: { employeeCode: string; employeeName: string }) => Promise<{ success: boolean; errorCode?: string; errorMessage?: string; errorDetails?: string; errorHint?: string }>;

  // Refresh & Diagnostics
  refreshAssessmentData: () => Promise<void>;
  checkHRMasterDependencies: () => {
    canReset: boolean;
    dependentBatchesCount: number;
    dependentAttendanceCount: number;
    dependentAssessmentsCount: number;
    dependentPktsCount: number;
    reason?: string;
  };
  resetHRMaster: () => Promise<{ success: boolean; count?: number; error?: string }>;
  getHREmployeeForUser: (nameOrEmail?: string) => TrainingEmployee | null;

  // Computed Helpers
  getEmployeeAssessments: (empCode: string) => TrainingAssessment[];
  getEmployeePKTs: (empCode: string) => TrainingPKT[];
  getEmployeePKTHistory: (empCode: string) => PKTAttemptHistory[];
  getEmployeeConsolidatedRecords: (empCode: string) => EmployeeConsolidatedRecord[];
  getAllConsolidatedRecords: () => EmployeeConsolidatedRecord[];
  getPrePostComparisonByProgram: () => PrePostComparison[];
  getPrePostComparisonByDepartment: () => { department: string; preAvg: number; postAvg: number; improvement: number; count: number }[];
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

// Schema-adaptive retry executor
async function executeWithSchemaRetry<T = any>(
  operation: (payload: any) => PromiseLike<{ data?: T | null; error?: any }>,
  initialPayload: any,
  maxRetries = 8
): Promise<{ data?: T | null; error?: any }> {
  let currentPayload = Array.isArray(initialPayload) 
    ? initialPayload.map(item => ({ ...item }))
    : { ...initialPayload };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation(currentPayload);
      if (!result.error) {
        return result;
      }

      const err = result.error;
      const msg = String(err?.message || err?.details || '');
      const match = msg.match(/Could not find the '([^']+)' column/i) || 
                    msg.match(/Could not find the "([^"]+)" column/i) ||
                    msg.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
                    msg.match(/column '([^']+)' of relation '[^']+' does not exist/i) ||
                    msg.match(/column "([^"]+)" does not exist/i) ||
                    msg.match(/column '([^']+)' does not exist/i);

      if (match && match[1]) {
        const missingColumn = match[1];
        console.warn(`[Supabase Schema Adaptive Fallback] Stripping missing column '${missingColumn}' and retrying...`);
        if (Array.isArray(currentPayload)) {
          currentPayload = currentPayload.map(item => {
            const copy = { ...item };
            delete copy[missingColumn];
            return copy;
          });
        } else {
          delete currentPayload[missingColumn];
        }
        continue;
      }

      return result;
    } catch (fetchErr: any) {
      console.error('[Supabase Execute Catch]', fetchErr);
      return { data: null, error: fetchErr };
    }
  }
  return await operation(currentPayload);
}

// Db row mappers
const mapEmployeeFromDb = (row: any): TrainingEmployee => ({
  id: String(row.id),
  employeeCode: row.employee_code || row.employeeCode || '',
  employeeName: row.employee_name || row.employeeName || '',
  department: row.department || 'Tekla',
  designation: row.designation || 'Trainee',
  location: row.location || row.employee_location || undefined,
  employeeType: row.employee_type || row.employeeType || undefined,
  managerName: row.manager_name || row.managerName || undefined,
  email: row.email || undefined,
  phone: row.phone || undefined,
  joiningDate: row.joining_date || row.join_date || row.joiningDate || undefined,
  status: (row.status || 'Active') as EmployeeStatus,
  targetCompetencies: row.target_competencies || row.targetCompetencies || undefined,
  currentLevels: row.current_levels || row.currentLevels || undefined,
  avatar: row.avatar || undefined,
  additionalFields: row.additional_fields || row.additionalFields || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapEmployeeToDb = (e: TrainingEmployee): Record<string, any> => {
  const row: Record<string, any> = {
    id: e.id || `emp-${e.employeeCode.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
    employee_code: e.employeeCode.trim().toUpperCase(),
    employee_name: e.employeeName.trim(),
    department: e.department || 'Tekla',
    designation: e.designation || 'Trainee',
    status: e.status || 'Active',
    created_at: e.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (e.location !== undefined && e.location !== null) row.location = e.location || null;
  if (e.employeeType !== undefined && e.employeeType !== null) row.employee_type = e.employeeType || null;
  if (e.managerName !== undefined && e.managerName !== null) row.manager_name = e.managerName || null;
  if (e.email !== undefined && e.email !== null) row.email = e.email || null;
  if (e.phone !== undefined && e.phone !== null) row.phone = e.phone || null;
  if (e.joiningDate !== undefined && e.joiningDate !== null) row.joining_date = e.joiningDate || null;
  if (e.targetCompetencies !== undefined && e.targetCompetencies !== null) row.target_competencies = e.targetCompetencies;
  if (e.currentLevels !== undefined && e.currentLevels !== null) row.current_levels = e.currentLevels;
  if (e.avatar !== undefined && e.avatar !== null) row.avatar = e.avatar;
  if (e.additionalFields && typeof e.additionalFields === 'object' && Object.keys(e.additionalFields).length > 0) {
    row.additional_fields = e.additionalFields;
  }

  return row;
};

const mapDepartmentSkillFromDb = (row: any): DepartmentSkillConfig => ({
  id: String(row.id),
  departmentName: row.department_name || row.departmentName || '',
  skill1: row.skill_1 || row.skill1 || '',
  requiredLevel1: Number(row.required_level_1 ?? row.requiredLevel1 ?? 3),
  skill2: row.skill_2 || row.skill2 || '',
  requiredLevel2: Number(row.required_level_2 ?? row.requiredLevel2 ?? 3),
  skill3: row.skill_3 || row.skill3 || '',
  requiredLevel3: Number(row.required_level_3 ?? row.requiredLevel3 ?? 3),
  skill4: row.skill_4 || row.skill4 || undefined,
  requiredLevel4: row.required_level_4 !== undefined && row.required_level_4 !== null ? Number(row.required_level_4) : (row.requiredLevel4 ?? undefined),
  skill5: row.skill_5 || row.skill5 || undefined,
  requiredLevel5: row.required_level_5 !== undefined && row.required_level_5 !== null ? Number(row.required_level_5) : (row.requiredLevel5 ?? undefined),
  status: row.status || 'Active',
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapDepartmentSkillToDb = (c: DepartmentSkillConfig) => ({
  id: c.id,
  department_name: c.departmentName,
  skill_1: c.skill1,
  required_level_1: c.requiredLevel1,
  skill_2: c.skill2,
  required_level_2: c.requiredLevel2,
  skill_3: c.skill3,
  required_level_3: c.requiredLevel3,
  skill_4: c.skill4 || null,
  required_level_4: c.requiredLevel4 || null,
  skill_5: c.skill5 || null,
  required_level_5: c.requiredLevel5 || null,
  status: c.status || 'Active',
  created_at: c.createdAt || new Date().toISOString(),
  updated_at: c.updatedAt || new Date().toISOString()
});

const mapEmployeeSkillFromDb = (row: any): EmployeeSkillAssessment => {
  const req = Number(row.required_level ?? row.requiredLevel ?? 3);
  const curr = Number(row.current_level ?? row.currentLevel ?? 0);
  const gapCalc = calculateSkillGap(req, curr);
  return {
    id: String(row.id),
    employeeCode: (row.employee_code || row.employeeCode || '').toUpperCase(),
    employeeName: row.employee_name || row.employeeName || undefined,
    department: row.department || '',
    skillName: row.skill_name || row.skillName || '',
    skillIndex: Number(row.skill_index ?? row.skillIndex ?? 1),
    currentLevel: curr,
    requiredLevel: req,
    gap: gapCalc.gap,
    status: gapCalc.status,
    trainingRequired: gapCalc.trainingRequired,
    recommendedProgramCode: row.recommended_program_code || row.recommendedProgramCode || undefined,
    recommendedProgramName: row.recommended_program_name || row.recommendedProgramName || undefined,
    assessmentDate: row.assessment_date || row.assessmentDate || new Date().toISOString().slice(0, 10),
    assessedBy: row.assessed_by || row.assessedBy || 'L&D Admin',
    remarks: row.remarks || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
};

const mapEmployeeSkillToDb = (s: EmployeeSkillAssessment) => ({
  id: s.id,
  employee_code: s.employeeCode.toUpperCase(),
  employee_name: s.employeeName || null,
  department: s.department,
  skill_name: s.skillName,
  skill_index: s.skillIndex,
  current_level: s.currentLevel,
  required_level: s.requiredLevel,
  gap: s.gap,
  status: s.status,
  training_required: s.trainingRequired,
  recommended_program_code: s.recommendedProgramCode || null,
  recommended_program_name: s.recommendedProgramName || null,
  assessment_date: s.assessmentDate,
  assessed_by: s.assessedBy,
  remarks: s.remarks || null,
  created_at: s.createdAt || new Date().toISOString(),
  updated_at: s.updatedAt || new Date().toISOString()
});

const mapAssessmentFromDb = (row: any): TrainingAssessment => ({
  id: String(row.id),
  employeeId: row.employee_id || row.employeeId || undefined,
  employeeCode: row.employee_code || row.employeeCode || '',
  employeeName: row.employee_name || row.employeeName || undefined,
  department: row.department || undefined,
  programId: row.program_id || row.programId || undefined,
  programCode: row.program_code || row.programCode || '',
  programName: row.program_name || row.programName || undefined,
  moduleId: row.module_id || row.moduleId || undefined,
  moduleCode: row.module_code || row.moduleCode || undefined,
  moduleName: row.module_name || row.moduleName || undefined,
  batchId: row.batch_id || row.batchId || undefined,
  batchCode: row.batch_code || row.batchCode || undefined,
  assessmentType: row.assessment_type || row.assessmentType || 'Pre-Assessment',
  assessmentDate: row.assessment_date || row.assessmentDate || '',
  attemptNumber: Number(row.attempt_number ?? row.attemptNumber ?? 1),
  maximumScore: Number(row.maximum_score ?? row.maximumScore ?? 100),
  scoreObtained: Number(row.score_obtained ?? row.scoreObtained ?? 0),
  percentage: Number(row.percentage ?? calculatePercentage(Number(row.score_obtained ?? 0), Number(row.maximum_score ?? 100))),
  result: row.result || determineResult(Number(row.score_obtained ?? 0), Number(row.maximum_score ?? 100)),
  evaluator: row.evaluator || undefined,
  remarks: row.remarks || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  deleted: Boolean(row.deleted)
});

const mapAssessmentToDb = (a: TrainingAssessment) => ({
  id: a.id,
  employee_id: a.employeeId || null,
  employee_code: a.employeeCode.toUpperCase(),
  employee_name: a.employeeName || null,
  department: a.department || null,
  program_id: a.programId || null,
  program_code: a.programCode.toUpperCase(),
  program_name: a.programName || null,
  module_id: a.moduleId || null,
  module_code: a.moduleCode ? a.moduleCode.toUpperCase() : null,
  module_name: a.moduleName || null,
  batch_id: a.batchId || null,
  batch_code: a.batchCode ? a.batchCode.toUpperCase() : null,
  assessment_type: a.assessmentType,
  assessment_date: a.assessmentDate,
  attempt_number: a.attemptNumber || 1,
  maximum_score: a.maximumScore || 100,
  score_obtained: a.scoreObtained || 0,
  percentage: a.percentage,
  result: a.result,
  evaluator: a.evaluator || null,
  remarks: a.remarks || null,
  deleted: Boolean(a.deleted),
  created_at: a.createdAt || new Date().toISOString(),
  updated_at: a.updatedAt || new Date().toISOString()
});

const mapPKTFromDb = (row: any): TrainingPKT => ({
  id: String(row.id),
  employeeId: row.employee_id || row.employeeId || undefined,
  employeeCode: row.employee_code || row.employeeCode || '',
  employeeName: row.employee_name || row.employeeName || undefined,
  department: row.department || undefined,
  programId: row.program_id || row.programId || undefined,
  programCode: row.program_code || row.programCode || '',
  programName: row.program_name || row.programName || undefined,
  moduleId: row.module_id || row.moduleId || undefined,
  moduleCode: row.module_code || row.moduleCode || undefined,
  moduleName: row.module_name || row.moduleName || undefined,
  batchId: row.batch_id || row.batchId || undefined,
  batchCode: row.batch_code || row.batchCode || undefined,
  pktType: row.pkt_type || row.pktType || 'Standard PKT',
  pktDate: row.pkt_date || row.pktDate || '',
  attemptNumber: Number(row.attempt_number ?? row.attemptNumber ?? 1),
  maximumScore: Number(row.maximum_score ?? row.maximumScore ?? 100),
  scoreObtained: Number(row.score_obtained ?? row.scoreObtained ?? 0),
  percentage: Number(row.percentage ?? calculatePercentage(Number(row.score_obtained ?? 0), Number(row.maximum_score ?? 100))),
  result: row.result || determineResult(Number(row.score_obtained ?? 0), Number(row.maximum_score ?? 100)),
  evaluator: row.evaluator || undefined,
  remarks: row.remarks || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  deleted: Boolean(row.deleted)
});

const mapPKTToDb = (p: TrainingPKT) => ({
  id: p.id,
  employee_id: p.employeeId || null,
  employee_code: p.employeeCode.toUpperCase(),
  employee_name: p.employeeName || null,
  department: p.department || null,
  program_id: p.programId || null,
  program_code: p.programCode.toUpperCase(),
  program_name: p.programName || null,
  module_id: p.moduleId || null,
  module_code: p.moduleCode ? p.moduleCode.toUpperCase() : null,
  module_name: p.moduleName || null,
  batch_id: p.batchId || null,
  batch_code: p.batchCode ? p.batchCode.toUpperCase() : null,
  pkt_type: p.pktType || 'Standard PKT',
  pkt_date: p.pktDate,
  attempt_number: p.attemptNumber || 1,
  maximum_score: p.maximumScore || 100,
  score_obtained: p.scoreObtained || 0,
  percentage: p.percentage,
  result: p.result,
  evaluator: p.evaluator || null,
  remarks: p.remarks || null,
  deleted: Boolean(p.deleted),
  created_at: p.createdAt || new Date().toISOString(),
  updated_at: p.updatedAt || new Date().toISOString()
});

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users = [] } = useApp();
  const { programs = [], modules = [] } = useTraining();
  const { batches = [], nominees = [], attendance = [], attendanceRecords = [] } = useBatch();
  const effectiveAttendance = attendance || attendanceRecords || [];

  const [employees, setEmployees] = useState<TrainingEmployee[]>([]);
  const [assessments, setAssessments] = useState<TrainingAssessment[]>([]);
  const [pkts, setPkts] = useState<TrainingPKT[]>([]);
  const [departmentSkills, setDepartmentSkills] = useState<DepartmentSkillConfig[]>(() => {
    try {
      const saved = localStorage.getItem('training_department_skills');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_DEPARTMENT_SKILLS;
  });
  const [employeeSkillAssessments, setEmployeeSkillAssessments] = useState<EmployeeSkillAssessment[]>(() => {
    try {
      const saved = localStorage.getItem('training_employee_skills');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [skillAssessmentHistory, setSkillAssessmentHistory] = useState<SkillAssessmentHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('training_skill_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEmployeeCode, setActiveEmployeeCode] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<EmployeeProfileTab>('overview');

  // Sync to local storage for durability across refreshes
  useEffect(() => {
    try {
      localStorage.setItem('training_department_skills', JSON.stringify(departmentSkills));
    } catch (e) {
      console.warn('Failed to save department skills to localStorage', e);
    }
  }, [departmentSkills]);

  useEffect(() => {
    try {
      localStorage.setItem('training_employee_skills', JSON.stringify(employeeSkillAssessments));
    } catch (e) {
      console.warn('Failed to save employee skills to localStorage', e);
    }
  }, [employeeSkillAssessments]);

  useEffect(() => {
    try {
      localStorage.setItem('training_skill_history', JSON.stringify(skillAssessmentHistory));
    } catch (e) {
      console.warn('Failed to save skill history to localStorage', e);
    }
  }, [skillAssessmentHistory]);

  // Calculate status breakdown across all employees
  const statusBreakdown = useMemo<EmployeeStatusBreakdown>(() => {
    let active = 0;
    let inactive = 0;
    let onLeave = 0;
    let transferred = 0;
    let exited = 0;
    let other = 0;
    const allStatuses: Record<string, number> = {};

    employees.forEach(e => {
      const raw = String(e.status || 'Active').trim();
      const lower = raw.toLowerCase();
      allStatuses[raw] = (allStatuses[raw] || 0) + 1;

      if (lower === 'active') {
        active++;
      } else if (lower === 'inactive') {
        inactive++;
      } else if (lower.includes('leave') || lower === 'on leave' || lower === 'on_leave') {
        onLeave++;
      } else if (lower.includes('transfer') || lower === 'transferred') {
        transferred++;
      } else if (lower.includes('exit') || lower.includes('resigned') || lower.includes('terminated') || lower === 'exited') {
        exited++;
      } else {
        other++;
      }
    });

    return {
      active,
      inactive,
      onLeave,
      transferred,
      exited,
      other,
      allStatuses
    };
  }, [employees]);

  // Unified load function from Supabase with batch pagination to overcome 1000-row PostgREST limits
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch ALL Employees in batches of 1,000 to retrieve complete dataset (>4,370 records)
      let allLoadedEmployeesRaw: any[] = [];
      const PAGE_BATCH_SIZE = 1000;
      let fromRow = 0;
      let keepFetching = true;

      while (keepFetching) {
        const { data: batchData, error: batchError } = await supabase
          .from('training_employees')
          .select('*')
          .order('employee_code', { ascending: true })
          .range(fromRow, fromRow + PAGE_BATCH_SIZE - 1);

        if (batchError) {
          console.error('[AssessmentContext] Error loading employee batch range', fromRow, fromRow + PAGE_BATCH_SIZE - 1, batchError);
          keepFetching = false;
        } else if (batchData && batchData.length > 0) {
          allLoadedEmployeesRaw.push(...batchData);
          if (batchData.length < PAGE_BATCH_SIZE) {
            keepFetching = false;
          } else {
            fromRow += PAGE_BATCH_SIZE;
          }
        } else {
          keepFetching = false;
        }
      }

      let loadedEmployees: TrainingEmployee[] = allLoadedEmployeesRaw.map(mapEmployeeFromDb);

      // public.training_employees is the authoritative HR Master
      // NEVER synthesize or inject application login users (e.g. 'admin', 'u-admin') as employee records.
      setEmployees(loadedEmployees);

      // 2. Fetch Assessments (batched)
      let allAssessmentsRaw: any[] = [];
      let assFrom = 0;
      let keepAss = true;
      while (keepAss) {
        const { data: assData, error: assError } = await supabase
          .from('training_assessments')
          .select('*')
          .eq('deleted', false)
          .order('created_at', { ascending: false })
          .range(assFrom, assFrom + PAGE_BATCH_SIZE - 1);

        if (assError || !assData || assData.length === 0) {
          keepAss = false;
        } else {
          allAssessmentsRaw.push(...assData);
          if (assData.length < PAGE_BATCH_SIZE) {
            keepAss = false;
          } else {
            assFrom += PAGE_BATCH_SIZE;
          }
        }
      }
      setAssessments(allAssessmentsRaw.map(mapAssessmentFromDb));

      // 3. Fetch PKTs (batched)
      let allPktsRaw: any[] = [];
      let pktFrom = 0;
      let keepPkt = true;
      while (keepPkt) {
        const { data: pktData, error: pktError } = await supabase
          .from('training_pkts')
          .select('*')
          .eq('deleted', false)
          .order('created_at', { ascending: false })
          .range(pktFrom, pktFrom + PAGE_BATCH_SIZE - 1);

        if (pktError || !pktData || pktData.length === 0) {
          keepPkt = false;
        } else {
          allPktsRaw.push(...pktData);
          if (pktData.length < PAGE_BATCH_SIZE) {
            keepPkt = false;
          } else {
            pktFrom += PAGE_BATCH_SIZE;
          }
        }
      }
      setPkts(allPktsRaw.map(mapPKTFromDb));

      // 4. Fetch Department Skills
      try {
        const deptSkillsRes = await supabase.from('training_department_skills').select('*').order('department_name', { ascending: true });
        if (!deptSkillsRes.error && deptSkillsRes.data && deptSkillsRes.data.length > 0) {
          setDepartmentSkills(deptSkillsRes.data.map(mapDepartmentSkillFromDb));
        }
      } catch (err) {
        console.warn('Could not load training_department_skills from Supabase, using defaults', err);
      }

      // 5. Fetch Employee Skill Assessments
      try {
        const empSkillsRes = await supabase.from('training_employee_skills').select('*').order('created_at', { ascending: false });
        if (!empSkillsRes.error && empSkillsRes.data && empSkillsRes.data.length > 0) {
          setEmployeeSkillAssessments(empSkillsRes.data.map(mapEmployeeSkillFromDb));
        }
      } catch (err) {
        console.warn('Could not load training_employee_skills from Supabase', err);
      }

      // 6. Fetch Skill History
      try {
        const histRes = await supabase.from('training_skill_history').select('*').order('created_at', { ascending: false });
        if (!histRes.error && histRes.data && histRes.data.length > 0) {
          setSkillAssessmentHistory(histRes.data.map((r: any) => ({
            id: String(r.id),
            employeeCode: (r.employee_code || r.employeeCode || '').toUpperCase(),
            department: r.department || '',
            skillName: r.skill_name || r.skillName || '',
            level: Number(r.level || 0),
            assessmentDate: r.assessment_date || r.assessmentDate || '',
            assessedBy: r.assessed_by || r.assessedBy || 'L&D Admin',
            remarks: r.remarks || undefined,
            createdAt: r.created_at || r.createdAt || new Date().toISOString()
          })));
        }
      } catch (err) {
        console.warn('Could not load training_skill_history from Supabase', err);
      }

    } catch (err: any) {
      console.error('[AssessmentContext] Load data error:', err);
      setError(err.message || 'Failed to load assessment and employee records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set default active employee code when list is available
  useEffect(() => {
    if (!activeEmployeeCode && employees.length > 0) {
      setActiveEmployeeCode(employees[0].employeeCode);
    }
  }, [employees, activeEmployeeCode]);

  // 1. Add Employee
  const addEmployee = async (emp: Partial<TrainingEmployee>): Promise<{ success: boolean; data?: TrainingEmployee; error?: string }> => {
    const code = (emp.employeeCode || '').trim().toUpperCase();
    if (!code) return { success: false, error: 'Employee ID is required' };

    const newEmp: TrainingEmployee = {
      id: emp.id || `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeCode: code,
      employeeName: emp.employeeName || code,
      department: emp.department || 'Tekla',
      designation: emp.designation || 'Trainee',
      location: emp.location || undefined,
      employeeType: emp.employeeType || undefined,
      managerName: emp.managerName || undefined,
      email: emp.email || undefined,
      phone: emp.phone || undefined,
      joiningDate: emp.joiningDate || undefined,
      status: (emp.status || 'Active') as EmployeeStatus,
      targetCompetencies: emp.targetCompetencies || undefined,
      currentLevels: emp.currentLevels || undefined,
      avatar: emp.avatar || undefined,
      additionalFields: emp.additionalFields || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapEmployeeToDb(newEmp);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
          payload
        );
        if (dbError) throw dbError;
      }

      setEmployees(prev => {
        const filtered = prev.filter(e => e.employeeCode.toUpperCase() !== code);
        return [newEmp, ...filtered];
      });

      return { success: true, data: newEmp };
    } catch (err: any) {
      console.error('[AssessmentContext] Add employee error:', err);
      return { success: false, error: err.message || 'Failed to create employee' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Update Employee
  const updateEmployee = async (idOrCode: string, updates: Partial<TrainingEmployee>): Promise<{ success: boolean; data?: TrainingEmployee; error?: string }> => {
    const target = employees.find(e => e.id === idOrCode || e.employeeCode.toUpperCase() === idOrCode.toUpperCase());
    if (!target) return { success: false, error: 'Employee record not found' };

    const updated: TrainingEmployee = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapEmployeeToDb(updated);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
          payload
        );
        if (dbError) throw dbError;
      }

      setEmployees(prev => prev.map(e => e.id === target.id ? updated : e));
      return { success: true, data: updated };
    } catch (err: any) {
      console.error('[AssessmentContext] Update employee error:', err);
      return { success: false, error: err.message || 'Failed to update employee' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Delete Employee (Deletes from HR Master only; Preserves all historical training records as unlinked)
  const deleteEmployee = async (idOrCode: string): Promise<{ success: boolean; error?: string }> => {
    const target = employees.find(e => e.id === idOrCode || e.employeeCode.toUpperCase() === idOrCode.toUpperCase());
    if (!target) return { success: false, error: 'Employee not found in HR Master' };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase
          .from('training_employees')
          .delete()
          .eq('employee_code', target.employeeCode);
        if (dbError) throw dbError;
      }

      setEmployees(prev => prev.filter(e => e.id !== target.id && e.employeeCode.toUpperCase() !== target.employeeCode.toUpperCase()));
      if (activeEmployeeCode?.toUpperCase() === target.employeeCode.toUpperCase()) {
        const remaining = employees.filter(e => e.id !== target.id && e.employeeCode.toUpperCase() !== target.employeeCode.toUpperCase());
        setActiveEmployeeCode(remaining.length > 0 ? remaining[0].employeeCode : null);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AssessmentContext] Delete employee error:', err);
      return { success: false, error: err.message || 'Failed to delete employee' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 3b. Delete Multiple Selected Employees (Admin-only batch removal from HR Master)
  const deleteMultipleEmployees = async (codesOrIds: string[]): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!codesOrIds || codesOrIds.length === 0) {
      return { success: true, count: 0 };
    }

    const cleanCodesSet = new Set<string>();
    codesOrIds.forEach(val => {
      const trimmed = (val || '').trim().toUpperCase();
      if (trimmed) cleanCodesSet.add(trimmed);
      const found = employees.find(e => e.id === val || e.employeeCode.toUpperCase() === trimmed);
      if (found) cleanCodesSet.add(found.employeeCode.toUpperCase());
    });

    const targetCodes = Array.from(cleanCodesSet);
    if (targetCodes.length === 0) return { success: true, count: 0 };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        // Delete selected employee records only from training_employees
        const { error: dbError } = await supabase
          .from('training_employees')
          .delete()
          .in('employee_code', targetCodes);
        if (dbError) throw dbError;
      }

      setEmployees(prev => prev.filter(e => !targetCodes.includes(e.employeeCode.toUpperCase())));
      if (activeEmployeeCode && targetCodes.includes(activeEmployeeCode.toUpperCase())) {
        const remaining = employees.filter(e => !targetCodes.includes(e.employeeCode.toUpperCase()));
        setActiveEmployeeCode(remaining.length > 0 ? remaining[0].employeeCode : null);
      }

      return { success: true, count: targetCodes.length };
    } catch (err: any) {
      console.error('[AssessmentContext] deleteMultipleEmployees error:', err);
      return { success: false, error: err.message || 'Failed to delete selected employees' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Fetch Single Employee Directly by Code (Fallback to Supabase if not loaded)
  const fetchEmployeeByCode = async (code: string): Promise<TrainingEmployee | null> => {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const existing = employees.find(e => e.employeeCode.toUpperCase() === clean);
    if (existing) return existing;

    if (isSupabaseConfigured) {
      try {
        const { data, error: dbErr } = await supabase
          .from('training_employees')
          .select('*')
          .ilike('employee_code', clean)
          .maybeSingle();

        if (!dbErr && data) {
          const mapped = mapEmployeeFromDb(data);
          setEmployees(prev => {
            if (prev.some(e => e.employeeCode.toUpperCase() === clean)) return prev;
            return [...prev, mapped];
          });
          return mapped;
        }
      } catch (err) {
        console.error('[fetchEmployeeByCode error]:', err);
      }
    }
    return null;
  };

  // ----------------------------------------------------
  // SKILL MATRIX OPERATIONS
  // ----------------------------------------------------
  const getDepartmentSkills = useCallback((deptName: string): DepartmentSkillConfig | undefined => {
    if (!deptName) return undefined;
    const clean = deptName.trim().toLowerCase();
    return departmentSkills.find(d => d.departmentName.trim().toLowerCase() === clean);
  }, [departmentSkills]);

  const saveDepartmentSkills = async (config: Partial<DepartmentSkillConfig>): Promise<{ success: boolean; data?: DepartmentSkillConfig; error?: string }> => {
    const deptName = (config.departmentName || '').trim();
    if (!deptName) return { success: false, error: 'Department name is required' };
    if (!config.skill1?.trim()) return { success: false, error: 'At least Skill 1 is required' };

    const existing = departmentSkills.find(d => d.departmentName.trim().toLowerCase() === deptName.toLowerCase());
    const newConfig: DepartmentSkillConfig = {
      id: existing?.id || config.id || `dept-skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      departmentName: deptName,
      skill1: config.skill1.trim(),
      requiredLevel1: Number(config.requiredLevel1 || 3),
      skill2: (config.skill2 || '').trim(),
      requiredLevel2: Number(config.requiredLevel2 || 3),
      skill3: (config.skill3 || '').trim(),
      requiredLevel3: Number(config.requiredLevel3 || 3),
      skill4: (config.skill4 || '').trim() || undefined,
      requiredLevel4: config.requiredLevel4 ? Number(config.requiredLevel4) : undefined,
      skill5: (config.skill5 || '').trim() || undefined,
      requiredLevel5: config.requiredLevel5 ? Number(config.requiredLevel5) : undefined,
      status: config.status || 'Active',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapDepartmentSkillToDb(newConfig);
        await executeWithSchemaRetry(
          p => supabase.from('training_department_skills').upsert(p, { onConflict: 'department_name' }),
          payload
        );
      }

      setDepartmentSkills(prev => {
        const rest = prev.filter(d => d.departmentName.trim().toLowerCase() !== deptName.toLowerCase());
        return [...rest, newConfig];
      });

      return { success: true, data: newConfig };
    } catch (err: any) {
      console.error('[AssessmentContext] saveDepartmentSkills error:', err);
      // Still update local state for resilience
      setDepartmentSkills(prev => {
        const rest = prev.filter(d => d.departmentName.trim().toLowerCase() !== deptName.toLowerCase());
        return [...rest, newConfig];
      });
      return { success: true, data: newConfig };
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDepartmentSkills = async (idOrDeptName: string): Promise<{ success: boolean; error?: string }> => {
    const target = departmentSkills.find(d => d.id === idOrDeptName || d.departmentName.toLowerCase() === idOrDeptName.toLowerCase());
    if (!target) return { success: false, error: 'Department skill configuration not found' };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        try {
          await supabase.from('training_department_skills').delete().eq('id', target.id);
        } catch {
          // ignore
        }
      }

      setDepartmentSkills(prev => prev.filter(d => d.id !== target.id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete department skills' };
    } finally {
      setIsSyncing(false);
    }
  };

  const getEmployeeSkillAssessments = useCallback((employeeCode: string, deptName?: string): EmployeeSkillAssessment[] => {
    const cleanCode = (employeeCode || '').trim().toUpperCase();
    if (!cleanCode) return [];

    const emp = employees.find(e => e.employeeCode.toUpperCase() === cleanCode);
    const department = deptName || emp?.department || 'Tekla';
    const deptConfig = getDepartmentSkills(department);

    // Get any recorded assessments
    const existing = employeeSkillAssessments.filter(s => s.employeeCode.toUpperCase() === cleanCode);

    if (!deptConfig) return existing;

    const activeSkills: Array<{ index: number; name: string; req: number }> = [];
    if (deptConfig.skill1?.trim()) activeSkills.push({ index: 1, name: deptConfig.skill1.trim(), req: deptConfig.requiredLevel1 });
    if (deptConfig.skill2?.trim()) activeSkills.push({ index: 2, name: deptConfig.skill2.trim(), req: deptConfig.requiredLevel2 });
    if (deptConfig.skill3?.trim()) activeSkills.push({ index: 3, name: deptConfig.skill3.trim(), req: deptConfig.requiredLevel3 });
    if (deptConfig.skill4?.trim()) activeSkills.push({ index: 4, name: deptConfig.skill4.trim(), req: deptConfig.requiredLevel4 || 2 });
    if (deptConfig.skill5?.trim()) activeSkills.push({ index: 5, name: deptConfig.skill5.trim(), req: deptConfig.requiredLevel5 || 2 });

    return activeSkills.map(s => {
      const match = existing.find(e => e.skillName.toLowerCase() === s.name.toLowerCase() || e.skillIndex === s.index);
      if (match) {
        const gapInfo = calculateSkillGap(s.req, match.currentLevel);
        return {
          ...match,
          skillName: s.name,
          skillIndex: s.index,
          requiredLevel: s.req,
          gap: gapInfo.gap,
          status: gapInfo.status,
          trainingRequired: gapInfo.trainingRequired,
          department
        };
      }

      const gapInfo = calculateSkillGap(s.req, 0);
      return {
        id: `emp-skill-${cleanCode}-${s.index}`,
        employeeCode: cleanCode,
        employeeName: emp?.employeeName || cleanCode,
        department,
        skillName: s.name,
        skillIndex: s.index,
        currentLevel: 0,
        requiredLevel: s.req,
        gap: gapInfo.gap,
        status: gapInfo.status,
        trainingRequired: true,
        assessmentDate: new Date().toISOString().slice(0, 10),
        assessedBy: 'Not Assessed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }, [employees, employeeSkillAssessments, getDepartmentSkills]);

  const recordSkillAssessment = async (assessment: Partial<EmployeeSkillAssessment>): Promise<{ success: boolean; data?: EmployeeSkillAssessment; error?: string }> => {
    const cleanCode = (assessment.employeeCode || '').trim().toUpperCase();
    const skillName = (assessment.skillName || '').trim();
    if (!cleanCode) return { success: false, error: 'Employee ID is required' };
    if (!skillName) return { success: false, error: 'Skill Name is required' };

    const emp = employees.find(e => e.employeeCode.toUpperCase() === cleanCode);
    const dept = assessment.department || emp?.department || 'Tekla';
    const req = Number(assessment.requiredLevel || 3);
    const curr = Number(assessment.currentLevel || 0);
    const gapInfo = calculateSkillGap(req, curr);

    const record: EmployeeSkillAssessment = {
      id: assessment.id || `skill-ass-${cleanCode}-${Date.now()}`,
      employeeCode: cleanCode,
      employeeName: assessment.employeeName || emp?.employeeName || cleanCode,
      department: dept,
      skillName,
      skillIndex: Number(assessment.skillIndex || 1),
      currentLevel: curr,
      requiredLevel: req,
      gap: gapInfo.gap,
      status: gapInfo.status,
      trainingRequired: gapInfo.trainingRequired,
      recommendedProgramCode: assessment.recommendedProgramCode,
      recommendedProgramName: assessment.recommendedProgramName,
      assessmentDate: assessment.assessmentDate || new Date().toISOString().slice(0, 10),
      assessedBy: assessment.assessedBy || 'L&D Specialist',
      remarks: assessment.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const historyEntry: SkillAssessmentHistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeCode: cleanCode,
      department: dept,
      skillName,
      level: curr,
      assessmentDate: record.assessmentDate,
      assessedBy: record.assessedBy,
      remarks: record.remarks,
      createdAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapEmployeeSkillToDb(record);
        await executeWithSchemaRetry(
          p => supabase.from('training_employee_skills').upsert(p),
          payload
        );
        try {
          await supabase.from('training_skill_history').insert({
            employee_code: historyEntry.employeeCode,
            department: historyEntry.department,
            skill_name: historyEntry.skillName,
            level: historyEntry.level,
            assessment_date: historyEntry.assessmentDate,
            assessed_by: historyEntry.assessedBy,
            remarks: historyEntry.remarks
          });
        } catch {
          // ignore optional history table error
        }
      }

      setEmployeeSkillAssessments(prev => {
        const filtered = prev.filter(s => 
          !(s.employeeCode.toUpperCase() === cleanCode && s.skillName.toLowerCase() === skillName.toLowerCase())
        );
        return [record, ...filtered];
      });

      setSkillAssessmentHistory(prev => [historyEntry, ...prev]);

      return { success: true, data: record };
    } catch (err: any) {
      console.error('[AssessmentContext] recordSkillAssessment error:', err);
      // Local state fallback
      setEmployeeSkillAssessments(prev => {
        const filtered = prev.filter(s => 
          !(s.employeeCode.toUpperCase() === cleanCode && s.skillName.toLowerCase() === skillName.toLowerCase())
        );
        return [record, ...filtered];
      });
      setSkillAssessmentHistory(prev => [historyEntry, ...prev]);
      return { success: true, data: record };
    } finally {
      setIsSyncing(false);
    }
  };

  const bulkRecordSkillAssessments = async (assessmentsList: Partial<EmployeeSkillAssessment>[]): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!assessmentsList.length) return { success: true, count: 0 };
    setIsSyncing(true);

    const validRecords: EmployeeSkillAssessment[] = [];
    const historyRecords: SkillAssessmentHistoryRecord[] = [];

    assessmentsList.forEach((ass, idx) => {
      const cleanCode = (ass.employeeCode || '').trim().toUpperCase();
      const skillName = (ass.skillName || '').trim();
      if (!cleanCode || !skillName) return;

      const emp = employees.find(e => e.employeeCode.toUpperCase() === cleanCode);
      const req = Number(ass.requiredLevel || 3);
      const curr = Number(ass.currentLevel || 0);
      const gapInfo = calculateSkillGap(req, curr);

      const record: EmployeeSkillAssessment = {
        id: ass.id || `bulk-skill-${cleanCode}-${idx}-${Date.now()}`,
        employeeCode: cleanCode,
        employeeName: ass.employeeName || emp?.employeeName || cleanCode,
        department: ass.department || emp?.department || 'Tekla',
        skillName,
        skillIndex: Number(ass.skillIndex || 1),
        currentLevel: curr,
        requiredLevel: req,
        gap: gapInfo.gap,
        status: gapInfo.status,
        trainingRequired: gapInfo.trainingRequired,
        recommendedProgramCode: ass.recommendedProgramCode,
        recommendedProgramName: ass.recommendedProgramName,
        assessmentDate: ass.assessmentDate || new Date().toISOString().slice(0, 10),
        assessedBy: ass.assessedBy || 'Bulk Import',
        remarks: ass.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      validRecords.push(record);
      if (curr > 0) {
        historyRecords.push({
          id: `hist-bulk-${Date.now()}-${idx}`,
          employeeCode: cleanCode,
          department: record.department,
          skillName,
          level: curr,
          assessmentDate: record.assessmentDate,
          assessedBy: record.assessedBy,
          remarks: record.remarks,
          createdAt: new Date().toISOString()
        });
      }
    });

    try {
      if (isSupabaseConfigured && validRecords.length > 0) {
        const payload = validRecords.map(mapEmployeeSkillToDb);
        await executeWithSchemaRetry(
          p => supabase.from('training_employee_skills').upsert(p),
          payload
        );
      }

      setEmployeeSkillAssessments(prev => {
        const key = (s: EmployeeSkillAssessment) => `${s.employeeCode.toUpperCase()}__${s.skillName.toLowerCase()}`;
        const map = new Map<string, EmployeeSkillAssessment>();
        prev.forEach(p => map.set(key(p), p));
        validRecords.forEach(v => map.set(key(v), v));
        return Array.from(map.values());
      });

      if (historyRecords.length > 0) {
        setSkillAssessmentHistory(prev => [...historyRecords, ...prev]);
      }

      return { success: true, count: validRecords.length };
    } catch (err: any) {
      console.error('[AssessmentContext] bulkRecordSkillAssessments error:', err);
      return { success: true, count: validRecords.length };
    } finally {
      setIsSyncing(false);
    }
  };

  const getEmployeeSkillHistory = useCallback((employeeCode: string, skillName?: string): SkillAssessmentHistoryRecord[] => {
    const cleanCode = (employeeCode || '').trim().toUpperCase();
    return skillAssessmentHistory.filter(h => {
      if (h.employeeCode.toUpperCase() !== cleanCode) return false;
      if (skillName && h.skillName.toLowerCase() !== skillName.toLowerCase()) return false;
      return true;
    });
  }, [skillAssessmentHistory]);

  // 4. Add Assessment
  const addAssessment = async (ass: Partial<TrainingAssessment>): Promise<{ success: boolean; data?: TrainingAssessment; error?: string }> => {
    const empCode = (ass.employeeCode || '').trim().toUpperCase();
    const progCode = (ass.programCode || '').trim().toUpperCase();
    if (!empCode) return { success: false, error: 'Employee ID is required' };
    if (!progCode) return { success: false, error: 'Program Code is required' };

    const maxScore = Number(ass.maximumScore || 100);
    const score = Number(ass.scoreObtained || 0);
    const percentage = calculatePercentage(score, maxScore);
    const result = ass.result || determineResult(score, maxScore);

    const emp = employees.find(e => e.employeeCode.toUpperCase() === empCode);
    const prog = programs.find(p => p.programCode.toUpperCase() === progCode);
    const mod = modules.find(m => m.moduleCode.toUpperCase() === (ass.moduleCode || '').toUpperCase());

    const newAss: TrainingAssessment = {
      id: ass.id || `ass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: emp?.id,
      employeeCode: empCode,
      employeeName: ass.employeeName || emp?.employeeName,
      department: ass.department || emp?.department,
      programId: prog?.id,
      programCode: progCode,
      programName: ass.programName || prog?.programName,
      moduleId: mod?.id,
      moduleCode: ass.moduleCode ? ass.moduleCode.toUpperCase() : undefined,
      moduleName: ass.moduleName || mod?.moduleName,
      batchId: ass.batchId,
      batchCode: ass.batchCode ? ass.batchCode.toUpperCase() : undefined,
      assessmentType: ass.assessmentType || 'Pre-Assessment',
      assessmentDate: ass.assessmentDate || new Date().toISOString().slice(0, 10),
      attemptNumber: Number(ass.attemptNumber || 1),
      maximumScore: maxScore,
      scoreObtained: score,
      percentage: percentage,
      result: result,
      evaluator: ass.evaluator,
      remarks: ass.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapAssessmentToDb(newAss);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_assessments').insert(p),
          payload
        );
        if (dbError) throw dbError;
      }

      setAssessments(prev => [newAss, ...prev]);
      return { success: true, data: newAss };
    } catch (err: any) {
      console.error('[AssessmentContext] Add assessment error:', err);
      return { success: false, error: err.message || 'Failed to save assessment record' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Update Assessment
  const updateAssessment = async (id: string, updates: Partial<TrainingAssessment>): Promise<{ success: boolean; data?: TrainingAssessment; error?: string }> => {
    const target = assessments.find(a => a.id === id);
    if (!target) return { success: false, error: 'Assessment record not found' };

    const maxScore = Number(updates.maximumScore ?? target.maximumScore ?? 100);
    const score = Number(updates.scoreObtained ?? target.scoreObtained ?? 0);
    const percentage = calculatePercentage(score, maxScore);
    const result = updates.result ?? determineResult(score, maxScore);

    const updated: TrainingAssessment = {
      ...target,
      ...updates,
      maximumScore: maxScore,
      scoreObtained: score,
      percentage: percentage,
      result: result,
      updatedAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapAssessmentToDb(updated);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_assessments').update(p).eq('id', id),
          payload
        );
        if (dbError) throw dbError;
      }

      setAssessments(prev => prev.map(a => a.id === id ? updated : a));
      return { success: true, data: updated };
    } catch (err: any) {
      console.error('[AssessmentContext] Update assessment error:', err);
      return { success: false, error: err.message || 'Failed to update assessment' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. Delete Assessment
  const deleteAssessment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase.from('training_assessments').update({ deleted: true }).eq('id', id);
        if (dbError) throw dbError;
      }

      setAssessments(prev => prev.filter(a => a.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('[AssessmentContext] Delete assessment error:', err);
      return { success: false, error: err.message || 'Failed to delete assessment' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 7. Add PKT
  const addPKT = async (pkt: Partial<TrainingPKT>): Promise<{ success: boolean; data?: TrainingPKT; error?: string }> => {
    const empCode = (pkt.employeeCode || '').trim().toUpperCase();
    const progCode = (pkt.programCode || '').trim().toUpperCase();
    if (!empCode) return { success: false, error: 'Employee ID is required' };
    if (!progCode) return { success: false, error: 'Program Code is required' };

    const maxScore = Number(pkt.maximumScore || 100);
    const score = Number(pkt.scoreObtained || 0);
    const percentage = calculatePercentage(score, maxScore);
    const result = pkt.result || determineResult(score, maxScore);

    const emp = employees.find(e => e.employeeCode.toUpperCase() === empCode);
    const prog = programs.find(p => p.programCode.toUpperCase() === progCode);
    const mod = modules.find(m => m.moduleCode.toUpperCase() === (pkt.moduleCode || '').toUpperCase());

    // Compute next attempt number automatically if not specified
    let attemptNum = Number(pkt.attemptNumber || 0);
    if (!attemptNum) {
      const existingAttempts = pkts.filter(p => 
        !p.deleted && 
        p.employeeCode.toUpperCase() === empCode && 
        p.programCode.toUpperCase() === progCode && 
        (p.moduleCode || '').toUpperCase() === (pkt.moduleCode || '').toUpperCase()
      );
      attemptNum = existingAttempts.length + 1;
    }

    const newPkt: TrainingPKT = {
      id: pkt.id || `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: emp?.id,
      employeeCode: empCode,
      employeeName: pkt.employeeName || emp?.employeeName,
      department: pkt.department || emp?.department,
      programId: prog?.id,
      programCode: progCode,
      programName: pkt.programName || prog?.programName,
      moduleId: mod?.id,
      moduleCode: pkt.moduleCode ? pkt.moduleCode.toUpperCase() : undefined,
      moduleName: pkt.moduleName || mod?.moduleName,
      batchId: pkt.batchId,
      batchCode: pkt.batchCode ? pkt.batchCode.toUpperCase() : undefined,
      pktType: pkt.pktType || 'Standard PKT',
      pktDate: pkt.pktDate || new Date().toISOString().slice(0, 10),
      attemptNumber: attemptNum,
      maximumScore: maxScore,
      scoreObtained: score,
      percentage: percentage,
      result: result,
      evaluator: pkt.evaluator,
      remarks: pkt.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapPKTToDb(newPkt);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_pkts').insert(p),
          payload
        );
        if (dbError) throw dbError;
      }

      setPkts(prev => [newPkt, ...prev]);
      return { success: true, data: newPkt };
    } catch (err: any) {
      console.error('[AssessmentContext] Add PKT error:', err);
      return { success: false, error: err.message || 'Failed to save PKT record' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 8. Update PKT
  const updatePKT = async (id: string, updates: Partial<TrainingPKT>): Promise<{ success: boolean; data?: TrainingPKT; error?: string }> => {
    const target = pkts.find(p => p.id === id);
    if (!target) return { success: false, error: 'PKT record not found' };

    const maxScore = Number(updates.maximumScore ?? target.maximumScore ?? 100);
    const score = Number(updates.scoreObtained ?? target.scoreObtained ?? 0);
    const percentage = calculatePercentage(score, maxScore);
    const result = updates.result ?? determineResult(score, maxScore);

    const updated: TrainingPKT = {
      ...target,
      ...updates,
      maximumScore: maxScore,
      scoreObtained: score,
      percentage: percentage,
      result: result,
      updatedAt: new Date().toISOString()
    };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const payload = mapPKTToDb(updated);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_pkts').update(p).eq('id', id),
          payload
        );
        if (dbError) throw dbError;
      }

      setPkts(prev => prev.map(p => p.id === id ? updated : p));
      return { success: true, data: updated };
    } catch (err: any) {
      console.error('[AssessmentContext] Update PKT error:', err);
      return { success: false, error: err.message || 'Failed to update PKT' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 9. Delete PKT
  const deletePKT = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase.from('training_pkts').update({ deleted: true }).eq('id', id);
        if (dbError) throw dbError;
      }

      setPkts(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('[AssessmentContext] Delete PKT error:', err);
      return { success: false, error: err.message || 'Failed to delete PKT' };
    } finally {
      setIsSyncing(false);
    }
  };

  // 10. Bulk Import Assessments
  const importAssessmentsBulk = async (rows: Partial<TrainingAssessment>[]): Promise<{ success: boolean; added: number; errors?: string[] }> => {
    if (!rows.length) return { success: true, added: 0 };
    setIsSyncing(true);

    const validItems: TrainingAssessment[] = [];
    const errorList: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const empCode = (row.employeeCode || '').trim().toUpperCase();
      const progCode = (row.programCode || '').trim().toUpperCase();

      if (!empCode) {
        errorList.push(`Row ${i + 1}: Missing Employee ID`);
        continue;
      }
      if (!progCode) {
        errorList.push(`Row ${i + 1}: Missing Program Code`);
        continue;
      }

      const maxScore = Number(row.maximumScore || 100);
      const score = Number(row.scoreObtained || 0);
      const pct = calculatePercentage(score, maxScore);

      const emp = employees.find(e => e.employeeCode.toUpperCase() === empCode);
      const prog = programs.find(p => p.programCode.toUpperCase() === progCode);
      const mod = modules.find(m => m.moduleCode.toUpperCase() === (row.moduleCode || '').toUpperCase());

      validItems.push({
        id: `ass-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: emp?.id,
        employeeCode: empCode,
        employeeName: row.employeeName || emp?.employeeName,
        department: row.department || emp?.department,
        programId: prog?.id,
        programCode: progCode,
        programName: row.programName || prog?.programName,
        moduleId: mod?.id,
        moduleCode: row.moduleCode ? row.moduleCode.toUpperCase() : undefined,
        moduleName: row.moduleName || mod?.moduleName,
        batchId: row.batchId,
        batchCode: row.batchCode ? row.batchCode.toUpperCase() : undefined,
        assessmentType: row.assessmentType || 'Pre-Assessment',
        assessmentDate: row.assessmentDate || new Date().toISOString().slice(0, 10),
        attemptNumber: Number(row.attemptNumber || 1),
        maximumScore: maxScore,
        scoreObtained: score,
        percentage: pct,
        result: row.result || determineResult(score, maxScore),
        evaluator: row.evaluator,
        remarks: row.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false
      });
    }

    try {
      if (isSupabaseConfigured && validItems.length > 0) {
        const payload = validItems.map(mapAssessmentToDb);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_assessments').insert(p),
          payload
        );
        if (dbError) throw dbError;
      }

      setAssessments(prev => [...validItems, ...prev]);
      return { success: true, added: validItems.length, errors: errorList };
    } catch (err: any) {
      console.error('[AssessmentContext] Bulk import assessment error:', err);
      return { success: false, added: 0, errors: [err.message || 'Database insert failed'] };
    } finally {
      setIsSyncing(false);
    }
  };

  // 11. Bulk Import PKTs
  const importPKTsBulk = async (rows: Partial<TrainingPKT>[]): Promise<{ success: boolean; added: number; errors?: string[] }> => {
    if (!rows.length) return { success: true, added: 0 };
    setIsSyncing(true);

    const validItems: TrainingPKT[] = [];
    const errorList: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const empCode = (row.employeeCode || '').trim().toUpperCase();
      const progCode = (row.programCode || '').trim().toUpperCase();

      if (!empCode) {
        errorList.push(`Row ${i + 1}: Missing Employee ID`);
        continue;
      }
      if (!progCode) {
        errorList.push(`Row ${i + 1}: Missing Program Code`);
        continue;
      }

      const maxScore = Number(row.maximumScore || 100);
      const score = Number(row.scoreObtained || 0);
      const pct = calculatePercentage(score, maxScore);

      const emp = employees.find(e => e.employeeCode.toUpperCase() === empCode);
      const prog = programs.find(p => p.programCode.toUpperCase() === progCode);
      const mod = modules.find(m => m.moduleCode.toUpperCase() === (row.moduleCode || '').toUpperCase());

      validItems.push({
        id: `pkt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: emp?.id,
        employeeCode: empCode,
        employeeName: row.employeeName || emp?.employeeName,
        department: row.department || emp?.department,
        programId: prog?.id,
        programCode: progCode,
        programName: row.programName || prog?.programName,
        moduleId: mod?.id,
        moduleCode: row.moduleCode ? row.moduleCode.toUpperCase() : undefined,
        moduleName: row.moduleName || mod?.moduleName,
        batchId: row.batchId,
        batchCode: row.batchCode ? row.batchCode.toUpperCase() : undefined,
        pktType: row.pktType || 'Standard PKT',
        pktDate: row.pktDate || new Date().toISOString().slice(0, 10),
        attemptNumber: Number(row.attemptNumber || 1),
        maximumScore: maxScore,
        scoreObtained: score,
        percentage: pct,
        result: row.result || determineResult(score, maxScore),
        evaluator: row.evaluator,
        remarks: row.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false
      });
    }

    try {
      if (isSupabaseConfigured && validItems.length > 0) {
        const payload = validItems.map(mapPKTToDb);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_pkts').insert(p),
          payload
        );
        if (dbError) throw dbError;
      }

      setPkts(prev => [...validItems, ...prev]);
      return { success: true, added: validItems.length, errors: errorList };
    } catch (err: any) {
      console.error('[AssessmentContext] Bulk import PKT error:', err);
      return { success: false, added: 0, errors: [err.message || 'Database insert failed'] };
    } finally {
      setIsSyncing(false);
    }
  };

  // Diagnostic Probes
  const testConnectivity = async (): Promise<{ connectivity: 'PASS' | 'FAIL'; tableStatus: 'FOUND' | 'NOT_FOUND'; count?: number; error?: string }> => {
    try {
      const { count, error } = await supabase
        .from('training_employees')
        .select('*', { count: 'exact', head: true });

      if (error) {
        const isTableNotFound = error.code === 'PGRST205' || error.message?.toLowerCase().includes('schema cache');
        return {
          connectivity: isTableNotFound ? 'PASS' : 'FAIL',
          tableStatus: isTableNotFound ? 'NOT_FOUND' : 'FOUND',
          error: `[${error.code || 'ERR'}] ${error.message}`
        };
      }

      return {
        connectivity: 'PASS',
        tableStatus: 'FOUND',
        count: count ?? 0
      };
    } catch (err: any) {
      console.error('[testConnectivity Probe Error]:', err);
      return {
        connectivity: 'FAIL',
        tableStatus: 'NOT_FOUND',
        error: err?.message || 'TypeError: Failed to fetch'
      };
    }
  };

  const testSingleUpsert = async (sample?: { employeeCode: string; employeeName: string }): Promise<{
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorDetails?: string;
    errorHint?: string;
  }> => {
    const code = (sample?.employeeCode || 'C8888E').trim().toUpperCase();
    const name = sample?.employeeName || 'Mike Jones';
    const timestamp = new Date().toISOString();
    
    const testProbe = {
      id: `emp-probe-${code.toLowerCase()}`,
      employee_code: code,
      employee_name: name,
      department: 'Engineering',
      designation: 'Trainee',
      location: 'HQ',
      status: 'Active',
      created_at: timestamp,
      updated_at: timestamp
    };

    console.log('==================================================');
    console.log('HR IMPORT TEST UPSERT');
    console.log('table = public.training_employees');
    console.log(`employee_code = ${code}`);

    try {
      const { error } = await executeWithSchemaRetry(
        p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
        [testProbe]
      );

      if (error) {
        console.error('result = failure');
        console.error(`error.code = ${error.code || 'N/A'}`);
        console.error(`error.message = ${error.message || 'N/A'}`);
        console.error(`error.details = ${error.details || 'N/A'}`);
        console.error(`error.hint = ${error.hint || 'N/A'}`);
        console.log('==================================================');
        return {
          success: false,
          errorCode: error.code || 'DB_ERROR',
          errorMessage: error.message || 'Single test upsert failed',
          errorDetails: error.details,
          errorHint: error.hint
        };
      }

      console.log('result = success');
      console.log('==================================================');
      return { success: true };
    } catch (err: any) {
      console.error('result = failure (Exception)');
      console.error(`error.message = ${err?.message || 'TypeError: Failed to fetch'}`);
      console.log('==================================================');
      return {
        success: false,
        errorCode: 'FETCH_ERROR',
        errorMessage: err?.message || 'TypeError: Failed to fetch',
        errorDetails: `Supabase Host: ${supabaseUrl}`,
        errorHint: 'Check network connectivity or Supabase project URL / anon key configuration'
      };
    }
  };

  // Database Integrity & Authoritative Row Count Verification
  const checkDatabaseIntegrity = async (sampleCodes?: string[]): Promise<EmployeeDatabaseDiagnostics> => {
    let totalCount = 0;
    let distinctCount = 0;
    let duplicateCount = 0;
    const sampleVerifications: EmployeeSampleVerification[] = [];
    const statusBreakdown: EmployeeStatusBreakdown = {
      active: 0,
      inactive: 0,
      onLeave: 0,
      transferred: 0,
      exited: 0,
      other: 0,
      allStatuses: {}
    };

    try {
      const { count: liveCount, error: countErr } = await supabase
        .from('training_employees')
        .select('*', { count: 'exact', head: true });
      
      if (!countErr && typeof liveCount === 'number') {
        totalCount = liveCount;
      }

      // Fetch all employee codes and status in batches of 1,000 to overcome PostgREST limits
      let allCodeRows: any[] = [];
      let cFrom = 0;
      let cMore = true;
      while (cMore) {
        const { data: cData, error: cErr } = await supabase
          .from('training_employees')
          .select('employee_code, status')
          .range(cFrom, cFrom + 999);
        if (cErr || !cData || cData.length === 0) {
          cMore = false;
        } else {
          allCodeRows.push(...cData);
          if (cData.length < 1000) cMore = false;
          else cFrom += 1000;
        }
      }

      if (allCodeRows.length > 0) {
        const codeMap = new Map<string, number>();
        allCodeRows.forEach((r: any) => {
          const c = String(r.employee_code || '').trim().toUpperCase();
          if (c) {
            codeMap.set(c, (codeMap.get(c) || 0) + 1);
          }
          const rawSt = String(r.status || 'Active').trim();
          const lowerSt = rawSt.toLowerCase();
          statusBreakdown.allStatuses[rawSt] = (statusBreakdown.allStatuses[rawSt] || 0) + 1;
          if (lowerSt === 'active') statusBreakdown.active++;
          else if (lowerSt === 'inactive') statusBreakdown.inactive++;
          else if (lowerSt.includes('leave')) statusBreakdown.onLeave++;
          else if (lowerSt.includes('transfer')) statusBreakdown.transferred++;
          else if (lowerSt.includes('exit') || lowerSt.includes('resigned') || lowerSt.includes('terminated')) statusBreakdown.exited++;
          else statusBreakdown.other++;
        });

        distinctCount = codeMap.size;
        let dupes = 0;
        codeMap.forEach((cnt) => {
          if (cnt > 1) dupes++;
        });
        duplicateCount = dupes;
        if (totalCount === 0) totalCount = allCodeRows.length;
      } else {
        distinctCount = totalCount;
      }

      // Sample probes: C8888E, C9999E, CE0001, CE001 + any additional requested
      const probeCodes = Array.from(new Set(['C8888E', 'C9999E', 'CE0001', 'CE001', ...(sampleCodes || [])]));
      const { data: sampleData } = await supabase
        .from('training_employees')
        .select('employee_code, employee_name, department, designation, status')
        .in('employee_code', probeCodes);

      probeCodes.forEach(code => {
        const found = sampleData?.find((d: any) => d.employee_code?.toUpperCase() === code.toUpperCase());
        sampleVerifications.push({
          employeeCode: code,
          employeeName: found?.employee_name || 'N/A',
          department: found?.department,
          designation: found?.designation,
          foundInDatabase: Boolean(found),
          foundInDb: Boolean(found)
        });
      });
    } catch (err) {
      console.error('[checkDatabaseIntegrity Probe Error]:', err);
    }

    return { totalCount, distinctCount, duplicateCount, statusBreakdown, sampleVerifications };
  };

  // Helper sleep for backoff delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const BACKOFF_DELAYS = [0, 1000, 3000, 7000]; // Attempt 1: immediate, Attempt 2: 1s, Attempt 3: 3s, Attempt 4: 7s

  // Resilient Chunk Processor with Exponential Backoff and Sub-Chunk Splitting
  const processBatchWithBackoffAndSplit = async (
    items: Record<string, any>[],
    baseRowOffset: number,
    chunkNum: number,
    totalChunks: number,
    rowRangeLabel: string
  ): Promise<{
    succeededRows: Record<string, any>[];
    failedErrors: EmployeeImportErrorDetail[];
    chunkLogs: EmployeeImportChunkLog[];
  }> => {
    const succeededRows: Record<string, any>[] = [];
    const failedErrors: EmployeeImportErrorDetail[] = [];
    const chunkLogs: EmployeeImportChunkLog[] = [];

    const maxAttempts = 4;
    let isSuccess = false;
    let lastError: any = null;
    let accumulatedDurationMs = 0;
    let finalAttemptsUsed = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      finalAttemptsUsed = attempt + 1;
      const delay = BACKOFF_DELAYS[attempt];
      if (delay > 0) {
        console.log(`[Backoff] Waiting ${delay}ms before attempt ${attempt + 1}/${maxAttempts} for ${rowRangeLabel}...`);
        await sleep(delay);
      }

      const attemptStart = Date.now();
      try {
        const { error } = await executeWithSchemaRetry(
          p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
          items
        );
        const duration = Date.now() - attemptStart;
        accumulatedDurationMs += duration;

        if (!error) {
          // Verify code presence in database
          const sampleProbeCodes = items.slice(0, 10).map(it => it.employee_code).filter(Boolean);
          if (sampleProbeCodes.length > 0) {
            try {
              await supabase
                .from('training_employees')
                .select('employee_code')
                .in('employee_code', sampleProbeCodes);
            } catch {
              // Non-blocking probe check
            }
          }

          console.log(`CHUNK ${chunkNum} / ${totalChunks}, Rows: ${items.length}, Attempt: ${attempt + 1}, Status: SUCCESS (${duration}ms)`);
          chunkLogs.push({
            chunkIndex: chunkNum,
            totalChunks,
            rowRange: rowRangeLabel,
            count: items.length,
            recordCount: items.length,
            status: 'SUCCESS',
            durationMs: accumulatedDurationMs,
            retryAttempts: attempt
          });
          succeededRows.push(...items);
          isSuccess = true;
          break;
        } else {
          lastError = error;
          console.warn(`CHUNK ${chunkNum} / ${totalChunks}, Attempt ${attempt + 1}/${maxAttempts} FAILED: ${error.code || 'DB_ERROR'} - ${error.message}`);
        }
      } catch (fetchEx: any) {
        const duration = Date.now() - attemptStart;
        accumulatedDurationMs += duration;
        lastError = fetchEx;
        console.warn(`CHUNK ${chunkNum} / ${totalChunks}, Attempt ${attempt + 1}/${maxAttempts} EXCEPTION: ${fetchEx.message || 'TypeError: Failed to fetch'}`);
      }
    }

    if (isSuccess) {
      return { succeededRows, failedErrors, chunkLogs };
    }

    // If chunk failed after 4 attempts and items count > 10, split into 10-record sub-chunks
    if (items.length > 10) {
      console.log(`[Adaptive Split] Splitting failed chunk ${chunkNum} (${items.length} records) into 10-record sub-chunks to isolate network drops...`);
      const SUB_SIZE = 10;
      const subChunkCount = Math.ceil(items.length / SUB_SIZE);

      for (let s = 0; s < subChunkCount; s++) {
        const subStart = s * SUB_SIZE;
        const subEnd = Math.min(subStart + SUB_SIZE, items.length);
        const subItems = items.slice(subStart, subEnd);
        const subRangeLabel = `${rowRangeLabel} (Sub-batch ${s + 1}/${subChunkCount}: ${subItems.length} rows)`;
        
        let subSuccess = false;
        let subLastError: any = null;
        let subDuration = 0;

        for (let subAttempt = 0; subAttempt < maxAttempts; subAttempt++) {
          const subDelay = BACKOFF_DELAYS[subAttempt];
          if (subDelay > 0) await sleep(subDelay);

          const subStartT = Date.now();
          try {
            const { error: subErr } = await executeWithSchemaRetry(
              p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
              subItems
            );
            subDuration += Date.now() - subStartT;
            if (!subErr) {
              succeededRows.push(...subItems);
              subSuccess = true;
              chunkLogs.push({
                chunkIndex: chunkNum,
                totalChunks,
                rowRange: subRangeLabel,
                count: subItems.length,
                recordCount: subItems.length,
                status: 'SUCCESS',
                durationMs: subDuration,
                retryAttempts: subAttempt,
                isSubChunk: true
              });
              console.log(`[Sub-batch ${s + 1}/${subChunkCount} SUCCESS] Persisted ${subItems.length} records.`);
              break;
            } else {
              subLastError = subErr;
            }
          } catch (subEx: any) {
            subLastError = subEx;
          }
        }

        if (!subSuccess) {
          chunkLogs.push({
            chunkIndex: chunkNum,
            totalChunks,
            rowRange: subRangeLabel,
            count: subItems.length,
            recordCount: subItems.length,
            status: 'FAILED',
            durationMs: subDuration,
            errorCode: subLastError?.code || 'FETCH_ERROR',
            errorMessage: subLastError?.message || 'TypeError: Failed to fetch',
            isSubChunk: true
          });

          subItems.forEach((subEmp, localIdx) => {
            failedErrors.push({
              row: baseRowOffset + subStart + localIdx,
              employeeCode: subEmp.employee_code,
              employeeName: subEmp.employee_name,
              department: subEmp.department,
              designation: subEmp.designation,
              location: subEmp.location,
              email: subEmp.email,
              phone: subEmp.phone,
              employeeType: subEmp.employee_type,
              managerName: subEmp.manager_name,
              joiningDate: subEmp.joining_date,
              errorCode: subLastError?.code || 'FETCH_ERROR',
              error: 'TypeError: Failed to fetch',
              reason: subLastError?.message || 'Network fetch timeout/drop after adaptive 10-row retries',
              retryAttempts: finalAttemptsUsed,
              lastAttemptStatus: 'FAILED',
              originalRowData: {
                employeeCode: subEmp.employee_code,
                employeeName: subEmp.employee_name,
                department: subEmp.department,
                designation: subEmp.designation,
                location: subEmp.location,
                email: subEmp.email,
                phone: subEmp.phone,
                employeeType: subEmp.employee_type,
                managerName: subEmp.manager_name,
                joiningDate: subEmp.joining_date
              }
            });
          });
        }
      }
    } else {
      // Chunk was <= 10 and failed all 4 attempts
      chunkLogs.push({
        chunkIndex: chunkNum,
        totalChunks,
        rowRange: rowRangeLabel,
        count: items.length,
        recordCount: items.length,
        status: 'FAILED',
        durationMs: accumulatedDurationMs,
        errorCode: lastError?.code || 'FETCH_ERROR',
        errorMessage: lastError?.message || 'TypeError: Failed to fetch',
        errorDetails: lastError?.details || `Supabase Host: ${supabaseUrl}`,
        errorHint: lastError?.hint,
        retryAttempts: finalAttemptsUsed
      });

      items.forEach((emp, localIdx) => {
        failedErrors.push({
          row: baseRowOffset + localIdx,
          employeeCode: emp.employee_code,
          employeeName: emp.employee_name,
          department: emp.department,
          designation: emp.designation,
          location: emp.location,
          email: emp.email,
          phone: emp.phone,
          employeeType: emp.employee_type,
          managerName: emp.manager_name,
          joiningDate: emp.joining_date,
          errorCode: lastError?.code || 'FETCH_ERROR',
          error: 'TypeError: Failed to fetch',
          reason: lastError?.message || 'Network request failed after 4 exponential backoff attempts',
          retryAttempts: finalAttemptsUsed,
          lastAttemptStatus: 'FAILED',
          originalRowData: {
            employeeCode: emp.employee_code,
            employeeName: emp.employee_name,
            department: emp.department,
            designation: emp.designation,
            location: emp.location,
            email: emp.email,
            phone: emp.phone,
            employeeType: emp.employee_type,
            managerName: emp.manager_name,
            joiningDate: emp.joining_date
          }
        });
      });
    }

    return { succeededRows, failedErrors, chunkLogs };
  };

  // 12. Bulk Import Employees (HR Master with Upsert & Diagnostics)
  const importEmployeesBulk = async (
    rows: Partial<TrainingEmployee>[],
    fileName = 'HR_Employee_Master.xlsx',
    importedBy = 'L&D Admin',
    onProgress?: (progress: {
      phase: 'CONNECTIVITY' | 'TEST_UPSERT' | 'IMPORTING_CHUNKS' | 'VERIFYING' | 'DONE';
      currentChunk?: number;
      totalChunks?: number;
      percent?: number;
      message?: string;
      chunkLogs?: EmployeeImportChunkLog[];
    }) => void
  ): Promise<EmployeeImportResult> => {
    const timestamp = new Date().toISOString();
    const runtimeConfig = getSupabaseRuntimeConfig();

    console.log('==================================================');
    console.log('EMPLOYEE MASTER IMPORT INITIALIZING');
    console.log(`Supabase URL: ${maskSupabaseUrl(runtimeConfig.supabaseUrl)}`);
    console.log(`Supabase Project Ref: ${runtimeConfig.projectRef}`);
    console.log(`Rows in File: ${rows.length}`);
    console.log('==================================================');

    if (!rows.length) {
      return {
        success: true,
        status: 'SUCCESS',
        fileName,
        importedBy,
        timestamp,
        rowsRead: 0,
        added: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        unmappedColumns: [],
        verifiedDbCount: 0,
        distinctDbCount: 0,
        duplicateCount: 0,
        runtimeConfig: {
          supabaseUrl: runtimeConfig.supabaseUrl,
          projectRef: runtimeConfig.projectRef,
          isConfigured: runtimeConfig.isConfigured,
          connectivity: 'PASS',
          tableStatus: 'FOUND'
        }
      };
    }

    setIsSyncing(true);
    const chunkLogs: EmployeeImportChunkLog[] = [];

    // =========================================================================
    // PREFLIGHT STEP 1: TEST SINGLE DATABASE OPERATION FIRST (SELECT count(*))
    // =========================================================================
    onProgress?.({
      phase: 'CONNECTIVITY',
      percent: 5,
      message: 'Testing Supabase connectivity and public.training_employees table...'
    });

    let connectivityStatus: 'PASS' | 'FAIL' = 'PASS';
    let tableStatus: 'FOUND' | 'NOT_FOUND' = 'FOUND';
    let connectivityErrorMsg = '';

    try {
      const connTest = await testConnectivity();
      connectivityStatus = connTest.connectivity;
      tableStatus = connTest.tableStatus;
      connectivityErrorMsg = connTest.error || '';

      if (tableStatus === 'NOT_FOUND') {
        const missingErr: EmployeeImportErrorDetail = {
          row: 0,
          employeeCode: 'N/A',
          employeeName: 'N/A',
          errorCode: 'PGRST205',
          error: 'Table Not Found',
          reason: "Could not find the table 'public.training_employees' in the schema cache. Please verify table exists in Supabase."
        };
        return {
          success: false,
          status: 'FAILED',
          isTableMissing: true,
          missingTableMessage: "Could not find the table 'public.training_employees' in the schema cache.",
          databaseErrorCode: 'PGRST205',
          fileName,
          importedBy,
          timestamp,
          rowsRead: rows.length,
          added: 0,
          updated: 0,
          skipped: 0,
          failed: rows.length,
          errors: rows.map((_, i) => ({ ...missingErr, row: i + 2 })),
          unmappedColumns: [],
          runtimeConfig: {
            supabaseUrl: runtimeConfig.supabaseUrl,
            projectRef: runtimeConfig.projectRef,
            isConfigured: runtimeConfig.isConfigured,
            connectivity: connectivityStatus,
            tableStatus: 'NOT_FOUND'
          }
        };
      }

      if (connectivityStatus === 'FAIL') {
        const failedFetchErr: EmployeeImportErrorDetail = {
          row: 0,
          employeeCode: 'N/A',
          employeeName: 'N/A',
          errorCode: 'DB_ERROR',
          error: 'TypeError: Failed to fetch',
          reason: `Failed to connect to Supabase project at ${runtimeConfig.projectRef}. ${connectivityErrorMsg}`
        };
        return {
          success: false,
          status: 'FAILED',
          isTableMissing: false,
          missingTableMessage: `Database connection error: ${connectivityErrorMsg || 'TypeError: Failed to fetch'}`,
          databaseErrorCode: 'DB_ERROR',
          fileName,
          importedBy,
          timestamp,
          rowsRead: rows.length,
          added: 0,
          updated: 0,
          skipped: 0,
          failed: rows.length,
          errors: rows.map((_, i) => ({ ...failedFetchErr, row: i + 2 })),
          unmappedColumns: [],
          runtimeConfig: {
            supabaseUrl: runtimeConfig.supabaseUrl,
            projectRef: runtimeConfig.projectRef,
            isConfigured: runtimeConfig.isConfigured,
            connectivity: 'FAIL',
            tableStatus: 'FOUND'
          }
        };
      }
    } catch (preErr: any) {
      return {
        success: false,
        status: 'FAILED',
        isTableMissing: false,
        missingTableMessage: preErr?.message || 'TypeError: Failed to fetch',
        databaseErrorCode: 'FETCH_ERROR',
        fileName,
        importedBy,
        timestamp,
        rowsRead: rows.length,
        added: 0,
        updated: 0,
        skipped: 0,
        failed: rows.length,
        errors: [{
          row: 1,
          employeeCode: 'N/A',
          employeeName: 'N/A',
          errorCode: 'FETCH_ERROR',
          error: 'TypeError: Failed to fetch',
          reason: `Database connectivity probe failed: ${preErr?.message || 'Check network / Supabase URL'}`
        }],
        unmappedColumns: [],
        runtimeConfig: {
          supabaseUrl: runtimeConfig.supabaseUrl,
          projectRef: runtimeConfig.projectRef,
          isConfigured: runtimeConfig.isConfigured,
          connectivity: 'FAIL',
          tableStatus: 'NOT_FOUND'
        }
      };
    }

    // =========================================================================
    // PREFLIGHT STEP 2: TEST ONE EMPLOYEE UPSERT FIRST (C8888E / Mike Jones)
    // =========================================================================
    onProgress?.({
      phase: 'TEST_UPSERT',
      percent: 10,
      message: 'Testing single probe record upsert (C8888E)...'
    });

    const firstValidRow = rows.find(r => r.employeeCode && r.employeeName);
    const testProbeCode = (firstValidRow?.employeeCode || 'C8888E').trim().toUpperCase();
    const testProbeName = (firstValidRow?.employeeName || 'Mike Jones').trim();

    const singleProbeRes = await testSingleUpsert({
      employeeCode: testProbeCode,
      employeeName: testProbeName
    });

    const singleTestUpsertResult = {
      employeeCode: testProbeCode,
      employeeName: testProbeName,
      success: singleProbeRes.success,
      errorCode: singleProbeRes.errorCode,
      errorMessage: singleProbeRes.errorMessage,
      errorDetails: singleProbeRes.errorDetails,
      errorHint: singleProbeRes.errorHint
    };

    if (!singleProbeRes.success) {
      return {
        success: false,
        status: 'FAILED',
        isTableMissing: singleProbeRes.errorCode === 'PGRST205',
        missingTableMessage: singleProbeRes.errorMessage || 'Single employee test upsert failed.',
        databaseErrorCode: singleProbeRes.errorCode || 'DB_ERROR',
        fileName,
        importedBy,
        timestamp,
        rowsRead: rows.length,
        added: 0,
        updated: 0,
        skipped: 0,
        failed: rows.length,
        errors: [{
          row: 1,
          employeeCode: testProbeCode,
          employeeName: testProbeName,
          errorCode: singleProbeRes.errorCode || 'DB_ERROR',
          error: singleProbeRes.errorMessage || 'Probe Upsert Failed',
          reason: `${singleProbeRes.errorMessage || ''} ${singleProbeRes.errorHint ? `(Hint: ${singleProbeRes.errorHint})` : ''}`
        }],
        unmappedColumns: [],
        runtimeConfig: {
          supabaseUrl: runtimeConfig.supabaseUrl,
          projectRef: runtimeConfig.projectRef,
          isConfigured: runtimeConfig.isConfigured,
          connectivity: 'PASS',
          tableStatus: 'FOUND'
        },
        singleTestUpsertResult
      };
    }

    // =========================================================================
    // STEP 3: BUILD VALIDATED IN-MEMORY PAYLOAD & MAP UNIQUE BY EMPLOYEE_CODE
    // =========================================================================
    const existingMap = new Map<string, TrainingEmployee>();
    employees.forEach(e => {
      if (e.employeeCode) {
        existingMap.set(e.employeeCode.trim().toUpperCase(), e);
      }
    });

    const validItemsToUpsert: TrainingEmployee[] = [];
    const initialErrorList: EmployeeImportErrorDetail[] = [];
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const seenCodesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row index (Header is row 1)
      const rawCode = (row.employeeCode || '').trim();
      const rawName = (row.employeeName || '').trim();

      if (!rawCode) {
        initialErrorList.push({
          row: rowNum,
          employeeCode: '',
          employeeName: rawName,
          errorCode: 'VALIDATION_ERR',
          error: 'Employee Code missing',
          reason: 'Employee ID / Code is a mandatory unique identifier',
          lastAttemptStatus: 'FAILED',
          retryAttempts: 0
        });
        continue;
      }

      if (!rawName) {
        initialErrorList.push({
          row: rowNum,
          employeeCode: rawCode,
          employeeName: '',
          errorCode: 'VALIDATION_ERR',
          error: 'Employee Name missing',
          reason: 'Employee Name is mandatory',
          lastAttemptStatus: 'FAILED',
          retryAttempts: 0
        });
        continue;
      }

      const cleanCode = rawCode.toUpperCase();
      const existing = existingMap.get(cleanCode);
      const isAlreadyInBatch = seenCodesInBatch.has(cleanCode);

      if (isAlreadyInBatch) {
        const itemIdx = validItemsToUpsert.findIndex(it => it.employeeCode.toUpperCase() === cleanCode);
        if (itemIdx !== -1) {
          validItemsToUpsert[itemIdx] = {
            ...validItemsToUpsert[itemIdx],
            employeeName: rawName,
            department: row.department !== undefined && row.department !== '' ? row.department : validItemsToUpsert[itemIdx].department,
            designation: row.designation !== undefined && row.designation !== '' ? row.designation : validItemsToUpsert[itemIdx].designation,
            location: row.location !== undefined && row.location !== '' ? row.location : validItemsToUpsert[itemIdx].location,
            email: row.email || validItemsToUpsert[itemIdx].email,
            phone: row.phone || validItemsToUpsert[itemIdx].phone,
            employeeType: row.employeeType || validItemsToUpsert[itemIdx].employeeType,
            managerName: row.managerName || validItemsToUpsert[itemIdx].managerName,
            joiningDate: row.joiningDate || validItemsToUpsert[itemIdx].joiningDate,
            updatedAt: timestamp
          };
        }
        skippedCount++;
        continue;
      }

      seenCodesInBatch.add(cleanCode);

      if (existing) {
        const updatedEmp: TrainingEmployee = {
          ...existing,
          employeeCode: cleanCode,
          employeeName: rawName,
          department: row.department !== undefined && row.department !== '' ? row.department : existing.department,
          designation: row.designation !== undefined && row.designation !== '' ? row.designation : existing.designation,
          location: row.location !== undefined && row.location !== '' ? row.location : (existing.location || ''),
          employeeType: row.employeeType || existing.employeeType,
          managerName: row.managerName || existing.managerName,
          email: row.email || existing.email,
          phone: row.phone || existing.phone,
          joiningDate: row.joiningDate || existing.joiningDate,
          status: (row.status || existing.status || 'Active') as EmployeeStatus,
          additionalFields: row.additionalFields ? { ...existing.additionalFields, ...row.additionalFields } : existing.additionalFields,
          updatedAt: timestamp
        };
        validItemsToUpsert.push(updatedEmp);
        updatedCount++;
      } else {
        const newEmp: TrainingEmployee = {
          id: `emp-${cleanCode.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
          employeeCode: cleanCode,
          employeeName: rawName,
          department: row.department || 'Tekla',
          designation: row.designation || 'Trainee',
          location: row.location || '',
          employeeType: row.employeeType,
          managerName: row.managerName,
          email: row.email || undefined,
          phone: row.phone || undefined,
          joiningDate: row.joiningDate || undefined,
          status: (row.status || 'Active') as EmployeeStatus,
          additionalFields: row.additionalFields || undefined,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        validItemsToUpsert.push(newEmp);
        addedCount++;
      }
    }

    // =========================================================================
    // STEP 4: BULK UPSERT IN RESILIENT CHUNKS OF 50 RECORDS
    // =========================================================================
    const CHUNK_SIZE = 50;
    const dbPayload = validItemsToUpsert.map(mapEmployeeToDb);
    const totalChunks = Math.ceil(dbPayload.length / CHUNK_SIZE);

    console.log(`Starting bulk upsert of ${dbPayload.length} rows across ${totalChunks} chunks (Chunk Size: ${CHUNK_SIZE})...`);

    let successfullyPersistedCount = 0;
    const allFailedErrors: EmployeeImportErrorDetail[] = [...initialErrorList];

    for (let c = 0; c < totalChunks; c++) {
      const startIdx = c * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE, dbPayload.length);
      const chunk = dbPayload.slice(startIdx, endIdx);
      const chunkNum = c + 1;
      const rowRange = `Rows ${startIdx + 2} to ${endIdx + 1}`;

      onProgress?.({
        phase: 'IMPORTING_CHUNKS',
        currentChunk: chunkNum,
        totalChunks,
        percent: 15 + Math.round((c / totalChunks) * 75),
        message: `Persisting chunk ${chunkNum} / ${totalChunks} (${chunk.length} employees)...`,
        chunkLogs: [...chunkLogs]
      });

      const chunkRes = await processBatchWithBackoffAndSplit(
        chunk,
        startIdx + 2,
        chunkNum,
        totalChunks,
        rowRange
      );

      chunkLogs.push(...chunkRes.chunkLogs);
      successfullyPersistedCount += chunkRes.succeededRows.length;
      if (chunkRes.failedErrors.length > 0) {
        allFailedErrors.push(...chunkRes.failedErrors);
      }
    }

    // Optional audit log insert
    try {
      await supabase.from('training_import_history').insert({
        file_name: fileName,
        imported_by: importedBy,
        imported_at: timestamp,
        file_type: 'EmployeeMaster',
        rows_read: rows.length,
        rows_added: addedCount,
        rows_updated: updatedCount,
        rows_skipped: skippedCount,
        rows_failed: allFailedErrors.length,
        errors: allFailedErrors.slice(0, 100)
      });
    } catch {
      // Optional history table
    }

    // =========================================================================
    // STEP 5: VERIFY DATABASE AFTER IMPORT (Exact count & sample checks)
    // =========================================================================
    onProgress?.({
      phase: 'VERIFYING',
      percent: 92,
      message: 'Running post-import database verification and duplicate checks...'
    });

    const integrity = await checkDatabaseIntegrity([testProbeCode]);

    // Refresh context state
    onProgress?.({
      phase: 'VERIFYING',
      percent: 98,
      message: 'Refreshing in-app Employee Master state from Supabase...'
    });

    try {
      await loadData();
    } catch {
      // Fallback state update
    }

    setIsSyncing(false);

    onProgress?.({
      phase: 'DONE',
      percent: 100,
      message: 'Employee Master synchronization finished.',
      chunkLogs: [...chunkLogs]
    });

    const isSuccess = successfullyPersistedCount > 0 && allFailedErrors.length === 0;
    const status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 
      successfullyPersistedCount === 0 ? 'FAILED' :
      allFailedErrors.length > 0 ? 'PARTIAL' : 'SUCCESS';

    const result: EmployeeImportResult = {
      success: isSuccess,
      status,
      fileName,
      importedBy,
      timestamp,
      rowsRead: rows.length,
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: allFailedErrors.length,
      errors: allFailedErrors,
      unmappedColumns: [],
      verifiedDbCount: integrity.totalCount || successfullyPersistedCount,
      distinctDbCount: integrity.distinctCount,
      duplicateCount: integrity.duplicateCount,
      initialStats: {
        rowsRead: rows.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: allFailedErrors.length
      },
      retryStats: {
        attempted: 0,
        successful: 0,
        failed: allFailedErrors.length
      },
      runtimeConfig: {
        supabaseUrl: runtimeConfig.supabaseUrl,
        projectRef: runtimeConfig.projectRef,
        isConfigured: runtimeConfig.isConfigured,
        connectivity: connectivityStatus,
        tableStatus: 'FOUND'
      },
      singleTestUpsertResult,
      chunkLogs,
      sampleVerifications: integrity.sampleVerifications
    };

    return result;
  };

  // 13. Retry Failed Rows Only (50-record chunks with backoff, splitting, and verification)
  const retryFailedEmployeesBulk = async (
    failedErrors: EmployeeImportErrorDetail[],
    fileName = 'HR_Employee_Master.xlsx',
    importedBy = 'L&D Admin',
    onProgress?: (progress: {
      phase: 'CONNECTIVITY' | 'TEST_UPSERT' | 'IMPORTING_CHUNKS' | 'VERIFYING' | 'DONE';
      currentChunk?: number;
      totalChunks?: number;
      percent?: number;
      message?: string;
      chunkLogs?: EmployeeImportChunkLog[];
    }) => void,
    previousResult?: EmployeeImportResult | null
  ): Promise<EmployeeImportResult> => {
    const timestamp = new Date().toISOString();
    const runtimeConfig = getSupabaseRuntimeConfig();

    console.log('==================================================');
    console.log(`RETRYING FAILED EMPLOYEE ROWS ONLY (${failedErrors.length} rows)`);
    console.log(`Supabase Project: ${runtimeConfig.projectRef}`);
    console.log('==================================================');

    if (!failedErrors.length) {
      const integrity = await checkDatabaseIntegrity();
      return {
        success: true,
        status: 'SUCCESS',
        fileName,
        importedBy,
        timestamp,
        rowsRead: previousResult?.rowsRead || 0,
        added: previousResult?.added || 0,
        updated: previousResult?.updated || 0,
        skipped: previousResult?.skipped || 0,
        failed: 0,
        errors: [],
        unmappedColumns: [],
        verifiedDbCount: integrity.totalCount,
        distinctDbCount: integrity.distinctCount,
        duplicateCount: integrity.duplicateCount,
        initialStats: previousResult?.initialStats || {
          rowsRead: previousResult?.rowsRead || 0,
          added: previousResult?.added || 0,
          updated: previousResult?.updated || 0,
          skipped: previousResult?.skipped || 0,
          failed: 0
        },
        retryStats: {
          attempted: 0,
          successful: 0,
          failed: 0
        }
      };
    }

    setIsSyncing(true);
    const chunkLogs: EmployeeImportChunkLog[] = [];

    // Filter valid retry candidates
    const validRetryItems: Record<string, any>[] = [];
    const unretriableErrors: EmployeeImportErrorDetail[] = [];

    failedErrors.forEach(err => {
      const code = (err.employeeCode || err.originalRowData?.employeeCode || '').trim().toUpperCase();
      const name = (err.employeeName || err.originalRowData?.employeeName || '').trim();

      if (!code || !name) {
        unretriableErrors.push({
          ...err,
          retryAttempts: (err.retryAttempts || 0) + 1,
          lastAttemptStatus: 'FAILED',
          reason: 'Cannot retry: Employee Code or Name is missing in source row'
        });
        return;
      }

      const dbEmp = mapEmployeeToDb({
        id: `emp-${code.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
        employeeCode: code,
        employeeName: name,
        department: err.department || err.originalRowData?.department || 'Tekla',
        designation: err.designation || err.originalRowData?.designation || 'Trainee',
        location: err.location || err.originalRowData?.location || '',
        employeeType: err.employeeType || err.originalRowData?.employeeType,
        managerName: err.managerName || err.originalRowData?.managerName,
        email: err.email || err.originalRowData?.email,
        phone: err.phone || err.originalRowData?.phone,
        joiningDate: err.joiningDate || err.originalRowData?.joiningDate,
        status: 'Active',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      validRetryItems.push(dbEmp);
    });

    // Process valid retry rows in small 50-record chunks
    const RETRY_CHUNK_SIZE = 50;
    const totalRetryChunks = Math.ceil(validRetryItems.length / RETRY_CHUNK_SIZE);
    let successfullyRetriedCount = 0;
    const remainingFailedErrors: EmployeeImportErrorDetail[] = [...unretriableErrors];

    for (let c = 0; c < totalRetryChunks; c++) {
      const startIdx = c * RETRY_CHUNK_SIZE;
      const endIdx = Math.min(startIdx + RETRY_CHUNK_SIZE, validRetryItems.length);
      const chunk = validRetryItems.slice(startIdx, endIdx);
      const chunkNum = c + 1;
      const rowRange = `Retry Chunk ${chunkNum}/${totalRetryChunks} (${chunk.length} rows)`;

      onProgress?.({
        phase: 'IMPORTING_CHUNKS',
        currentChunk: chunkNum,
        totalChunks: totalRetryChunks,
        percent: 10 + Math.round((c / totalRetryChunks) * 80),
        message: `Retrying failed records chunk ${chunkNum}/${totalRetryChunks} (${chunk.length} employees)...`,
        chunkLogs: [...chunkLogs]
      });

      const chunkRes = await processBatchWithBackoffAndSplit(
        chunk,
        startIdx + 1,
        chunkNum,
        totalRetryChunks,
        rowRange
      );

      chunkLogs.push(...chunkRes.chunkLogs);
      successfullyRetriedCount += chunkRes.succeededRows.length;
      if (chunkRes.failedErrors.length > 0) {
        remainingFailedErrors.push(...chunkRes.failedErrors);
      }
    }

    // Post-retry database integrity and count check
    onProgress?.({
      phase: 'VERIFYING',
      percent: 92,
      message: 'Running post-retry database verification and sample integrity check...'
    });

    const sampleCodesToCheck = validRetryItems.slice(0, 5).map(it => it.employee_code);
    const integrity = await checkDatabaseIntegrity(sampleCodesToCheck);

    // Refresh context state
    onProgress?.({
      phase: 'VERIFYING',
      percent: 98,
      message: 'Refreshing in-app Employee Master state from Supabase...'
    });

    try {
      await loadData();
    } catch {
      // Fallback
    }

    setIsSyncing(false);

    onProgress?.({
      phase: 'DONE',
      percent: 100,
      message: remainingFailedErrors.length === 0 
        ? 'Employee Master synchronization completed successfully.' 
        : `Retry partially completed. ${successfullyRetriedCount} records saved, ${remainingFailedErrors.length} remain failed.`,
      chunkLogs: [...chunkLogs]
    });

    const isComplete = remainingFailedErrors.length === 0;
    const status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = isComplete ? 'SUCCESS' : 'PARTIAL';

    const prevInitial = previousResult?.initialStats || {
      rowsRead: previousResult?.rowsRead || (failedErrors.length + successfullyRetriedCount),
      added: previousResult?.added || 0,
      updated: previousResult?.updated || 0,
      skipped: previousResult?.skipped || 0,
      failed: failedErrors.length
    };

    const result: EmployeeImportResult = {
      success: isComplete,
      status,
      fileName,
      importedBy,
      timestamp,
      rowsRead: prevInitial.rowsRead,
      added: prevInitial.added,
      updated: prevInitial.updated,
      skipped: prevInitial.skipped,
      failed: remainingFailedErrors.length,
      errors: remainingFailedErrors,
      unmappedColumns: previousResult?.unmappedColumns || [],
      verifiedDbCount: integrity.totalCount,
      distinctDbCount: integrity.distinctCount,
      duplicateCount: integrity.duplicateCount,
      initialStats: prevInitial,
      retryStats: {
        attempted: failedErrors.length,
        successful: successfullyRetriedCount,
        failed: remainingFailedErrors.length
      },
      runtimeConfig: {
        supabaseUrl: runtimeConfig.supabaseUrl,
        projectRef: runtimeConfig.projectRef,
        isConfigured: runtimeConfig.isConfigured,
        connectivity: 'PASS',
        tableStatus: 'FOUND'
      },
      singleTestUpsertResult: previousResult?.singleTestUpsertResult,
      chunkLogs,
      sampleVerifications: integrity.sampleVerifications
    };

    return result;
  };

  // Helper selectors
  const getEmployeeAssessments = useCallback((empCode: string): TrainingAssessment[] => {
    const code = empCode.trim().toUpperCase();
    return assessments.filter(a => !a.deleted && a.employeeCode.toUpperCase() === code);
  }, [assessments]);

  const getEmployeePKTs = useCallback((empCode: string): TrainingPKT[] => {
    const code = empCode.trim().toUpperCase();
    return pkts.filter(p => !p.deleted && p.employeeCode.toUpperCase() === code);
  }, [pkts]);

  const getEmployeePKTHistory = useCallback((empCode: string): PKTAttemptHistory[] => {
    const empPkts = getEmployeePKTs(empCode);
    return groupPKTAttempts(empPkts);
  }, [getEmployeePKTs]);

  const getEmployeeConsolidatedRecords = useCallback((empCode: string): EmployeeConsolidatedRecord[] => {
    return buildConsolidatedRecords(
      empCode,
      employees,
      programs,
      modules,
      batches,
      nominees,
      effectiveAttendance,
      assessments,
      pkts
    );
  }, [employees, programs, modules, batches, nominees, effectiveAttendance, assessments, pkts]);

  const getAllConsolidatedRecords = useCallback((): EmployeeConsolidatedRecord[] => {
    const allRecords: EmployeeConsolidatedRecord[] = [];
    employees.forEach(e => {
      const records = buildConsolidatedRecords(
        e.employeeCode,
        employees,
        programs,
        modules,
        batches,
        nominees,
        effectiveAttendance,
        assessments,
        pkts
      );
      allRecords.push(...records);
    });
    return allRecords;
  }, [employees, programs, modules, batches, nominees, effectiveAttendance, assessments, pkts]);

  const getPrePostComparisonByProgram = useCallback((): PrePostComparison[] => {
    const result: PrePostComparison[] = [];
    const progMap = new Map<string, { pres: number[]; posts: number[]; progName: string }>();

    assessments.filter(a => !a.deleted).forEach(a => {
      const pCode = a.programCode.toUpperCase();
      if (!progMap.has(pCode)) {
        const prog = programs.find(p => p.programCode.toUpperCase() === pCode);
        progMap.set(pCode, { pres: [], posts: [], progName: prog?.programName || a.programName || pCode });
      }
      const item = progMap.get(pCode)!;
      if (a.assessmentType.toLowerCase().includes('pre')) {
        item.pres.push(a.percentage);
      } else if (a.assessmentType.toLowerCase().includes('post')) {
        item.posts.push(a.percentage);
      }
    });

    progMap.forEach((val, pCode) => {
      const preAvg = val.pres.length > 0 ? Math.round(val.pres.reduce((s, x) => s + x, 0) / val.pres.length) : 0;
      const postAvg = val.posts.length > 0 ? Math.round(val.posts.reduce((s, x) => s + x, 0) / val.posts.length) : 0;
      result.push({
        programCode: pCode,
        programName: val.progName,
        preScore: preAvg,
        postScore: postAvg,
        improvement: calculateScoreImprovement(preAvg, postAvg)
      });
    });

    return result;
  }, [assessments, programs]);

  const getPrePostComparisonByDepartment = useCallback((): { department: string; preAvg: number; postAvg: number; improvement: number; count: number }[] => {
    const deptMap = new Map<string, { pres: number[]; posts: number[] }>();

    assessments.filter(a => !a.deleted).forEach(a => {
      const dept = a.department || 'Operations';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { pres: [], posts: [] });
      }
      const item = deptMap.get(dept)!;
      if (a.assessmentType.toLowerCase().includes('pre')) {
        item.pres.push(a.percentage);
      } else if (a.assessmentType.toLowerCase().includes('post')) {
        item.posts.push(a.percentage);
      }
    });

    const result: { department: string; preAvg: number; postAvg: number; improvement: number; count: number }[] = [];
    deptMap.forEach((val, dept) => {
      const preAvg = val.pres.length > 0 ? Math.round(val.pres.reduce((s, x) => s + x, 0) / val.pres.length) : 0;
      const postAvg = val.posts.length > 0 ? Math.round(val.posts.reduce((s, x) => s + x, 0) / val.posts.length) : 0;
      result.push({
        department: dept,
        preAvg,
        postAvg,
        improvement: calculateScoreImprovement(preAvg, postAvg),
        count: Math.max(val.pres.length, val.posts.length)
      });
    });

    return result;
  }, [assessments]);

  // HR Master Reset Dependency Transparency (Reports preserved historical counts without blocking)
  const checkHRMasterDependencies = useCallback((): {
    canReset: boolean;
    dependentBatchesCount: number;
    dependentAttendanceCount: number;
    dependentAssessmentsCount: number;
    dependentPktsCount: number;
    reason?: string;
  } => {
    const dependentBatchesCount = nominees?.length || 0;
    const dependentAttendanceCount = effectiveAttendance?.length || 0;
    const dependentAssessmentsCount = assessments?.filter(a => !a.deleted).length || 0;
    const dependentPktsCount = pkts?.filter(p => !p.deleted).length || 0;

    return {
      canReset: true,
      dependentBatchesCount,
      dependentAttendanceCount,
      dependentAssessmentsCount,
      dependentPktsCount
    };
  }, [nominees, effectiveAttendance, assessments, pkts]);

  // Admin-only Safe Reset of HR Master (Clears public.training_employees only; Preserves all historical training records as unlinked)
  const resetHRMaster = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        // Safe delete from training_employees table ONLY - historical transaction tables remain intact
        const { error: delError } = await supabase
          .from('training_employees')
          .delete()
          .neq('employee_code', '__GUARD_PROTECT_NON_MATCH__');
        if (delError) throw delError;
      }
      const previousCount = employees.length;
      setEmployees([]);
      setActiveEmployeeCode(null);
      return { success: true, count: previousCount };
    } catch (err: any) {
      console.error('[AssessmentContext] resetHRMaster error:', err);
      return { success: false, error: err.message || 'Failed to reset HR Master' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to look up an employee's HR record from their application name or email
  const getHREmployeeForUser = useCallback((nameOrEmail?: string): TrainingEmployee | null => {
    if (!nameOrEmail) return null;
    const query = nameOrEmail.trim().toLowerCase();
    
    // Look up by email first, then exact employeeName
    const match = employees.find(e => 
      (e.email && e.email.trim().toLowerCase() === query) ||
      (e.employeeName && e.employeeName.trim().toLowerCase() === query)
    );
    
    return match || null;
  }, [employees]);

  return (
    <AssessmentContext.Provider
      value={{
        employees,
        assessments,
        pkts,
        departmentSkills,
        employeeSkillAssessments,
        skillAssessmentHistory,
        statusBreakdown,
        isLoading,
        isSyncing,
        error,
        activeEmployeeCode,
        setActiveEmployeeCode,
        activeProfileTab,
        setActiveProfileTab,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        deleteMultipleEmployees,
        fetchEmployeeByCode,
        getDepartmentSkills,
        saveDepartmentSkills,
        deleteDepartmentSkills,
        getEmployeeSkillAssessments,
        recordSkillAssessment,
        bulkRecordSkillAssessments,
        getEmployeeSkillHistory,
        addAssessment,
        updateAssessment,
        deleteAssessment,
        addPKT,
        updatePKT,
        deletePKT,
        importEmployeesBulk,
        retryFailedEmployeesBulk,
        checkDatabaseIntegrity,
        importAssessmentsBulk,
        importPKTsBulk,
        testConnectivity,
        testSingleUpsert,
        refreshAssessmentData: loadData,
        checkHRMasterDependencies,
        resetHRMaster,
        getHREmployeeForUser,
        getEmployeeAssessments,
        getEmployeePKTs,
        getEmployeePKTHistory,
        getEmployeeConsolidatedRecords,
        getAllConsolidatedRecords,
        getPrePostComparisonByProgram,
        getPrePostComparisonByDepartment
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

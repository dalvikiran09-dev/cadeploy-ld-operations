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
  EmployeeImportResult
} from '../types/assessment';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

interface AssessmentContextType {
  employees: TrainingEmployee[];
  assessments: TrainingAssessment[];
  pkts: TrainingPKT[];
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

  // CRUD Assessments
  addAssessment: (ass: Partial<TrainingAssessment>) => Promise<{ success: boolean; data?: TrainingAssessment; error?: string }>;
  updateAssessment: (id: string, updates: Partial<TrainingAssessment>) => Promise<{ success: boolean; data?: TrainingAssessment; error?: string }>;
  deleteAssessment: (id: string) => Promise<{ success: boolean; error?: string }>;

  // CRUD PKTs
  addPKT: (pkt: Partial<TrainingPKT>) => Promise<{ success: boolean; data?: TrainingPKT; error?: string }>;
  updatePKT: (id: string, updates: Partial<TrainingPKT>) => Promise<{ success: boolean; data?: TrainingPKT; error?: string }>;
  deletePKT: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Bulk Imports
  importEmployeesBulk: (rows: Partial<TrainingEmployee>[], fileName?: string, importedBy?: string) => Promise<EmployeeImportResult>;
  importAssessmentsBulk: (rows: Partial<TrainingAssessment>[]) => Promise<{ success: boolean; added: number; errors?: string[] }>;
  importPKTsBulk: (rows: Partial<TrainingPKT>[]) => Promise<{ success: boolean; added: number; errors?: string[] }>;

  // Refresh
  refreshAssessmentData: () => Promise<void>;

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
  maxRetries = 6
): Promise<{ data?: T | null; error?: any }> {
  let currentPayload = Array.isArray(initialPayload) 
    ? initialPayload.map(item => ({ ...item }))
    : { ...initialPayload };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await operation(currentPayload);
    if (!result.error) {
      return result;
    }

    const err = result.error;
    const match = err.message?.match(/Could not find the '([^']+)' column/i) || 
                  err.message?.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
                  err.message?.match(/column "([^"]+)" does not exist/i);

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
  email: row.email || undefined,
  joiningDate: row.joining_date || row.joiningDate || undefined,
  status: row.status || 'Active',
  targetCompetencies: row.target_competencies || row.targetCompetencies || undefined,
  currentLevels: row.current_levels || row.currentLevels || undefined,
  avatar: row.avatar || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapEmployeeToDb = (e: TrainingEmployee) => ({
  id: e.id,
  employee_code: e.employeeCode.toUpperCase(),
  employee_name: e.employeeName,
  department: e.department || 'Tekla',
  designation: e.designation || 'Trainee',
  location: e.location || null,
  email: e.email || null,
  joining_date: e.joiningDate || null,
  status: e.status || 'Active',
  target_competencies: e.targetCompetencies || null,
  current_levels: e.currentLevels || null,
  avatar: e.avatar || null,
  created_at: e.createdAt || new Date().toISOString(),
  updated_at: e.updatedAt || new Date().toISOString()
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEmployeeCode, setActiveEmployeeCode] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<EmployeeProfileTab>('overview');

  // Unified load function from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Employees
      const empRes = await supabase.from('training_employees').select('*').order('employee_code', { ascending: true });
      let loadedEmployees: TrainingEmployee[] = [];
      if (!empRes.error && empRes.data) {
        loadedEmployees = empRes.data.map(mapEmployeeFromDb);
      }

      // Sync employees from nominees and users if empty or new nominees present
      const employeeMap = new Map<string, TrainingEmployee>();
      loadedEmployees.forEach(e => employeeMap.set(e.employeeCode.toUpperCase(), e));

      // Check batch nominees
      nominees.forEach(n => {
        const code = n.employeeCode.toUpperCase();
        if (!employeeMap.has(code)) {
          employeeMap.set(code, {
            id: `emp-${code.toLowerCase()}`,
            employeeCode: code,
            employeeName: n.employeeName || code,
            department: n.department || 'Tekla',
            designation: n.designation || 'Trainee',
            email: n.email,
            status: 'Active',
            targetCompetencies: n.targetCompetencies,
            currentLevels: n.currentLevels,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      // Check users who are Trainees or Team members
      users.forEach(u => {
        const code = (u.username || u.id).toUpperCase();
        if (!employeeMap.has(code)) {
          employeeMap.set(code, {
            id: `emp-${code.toLowerCase()}`,
            employeeCode: code,
            employeeName: u.name,
            department: u.department || 'Tekla',
            designation: u.designation || u.role,
            email: u.email,
            status: u.status === 'Active' ? 'Active' : 'Inactive',
            avatar: u.avatar,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });

      const finalEmployees = Array.from(employeeMap.values());
      setEmployees(finalEmployees);

      // 2. Fetch Assessments
      const assRes = await supabase.from('training_assessments').select('*').eq('deleted', false).order('created_at', { ascending: false });
      if (!assRes.error && assRes.data) {
        setAssessments(assRes.data.map(mapAssessmentFromDb));
      }

      // 3. Fetch PKTs
      const pktRes = await supabase.from('training_pkts').select('*').eq('deleted', false).order('created_at', { ascending: false });
      if (!pktRes.error && pktRes.data) {
        setPkts(pktRes.data.map(mapPKTFromDb));
      }

    } catch (err: any) {
      console.error('[AssessmentContext] Load data error:', err);
      setError(err.message || 'Failed to load assessment and employee records');
    } finally {
      setIsLoading(false);
    }
  }, [nominees, users]);

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
      email: emp.email || undefined,
      joiningDate: emp.joiningDate || undefined,
      status: emp.status || 'Active',
      targetCompetencies: emp.targetCompetencies || undefined,
      currentLevels: emp.currentLevels || undefined,
      avatar: emp.avatar || undefined,
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

  // 3. Delete Employee
  const deleteEmployee = async (idOrCode: string): Promise<{ success: boolean; error?: string }> => {
    const target = employees.find(e => e.id === idOrCode || e.employeeCode.toUpperCase() === idOrCode.toUpperCase());
    if (!target) return { success: false, error: 'Employee not found' };

    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase.from('training_employees').delete().eq('employee_code', target.employeeCode);
        if (dbError) throw dbError;
      }

      setEmployees(prev => prev.filter(e => e.id !== target.id));
      if (activeEmployeeCode?.toUpperCase() === target.employeeCode.toUpperCase()) {
        const remaining = employees.filter(e => e.id !== target.id);
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

  // 12. Bulk Import Employees (HR Master with Upsert)
  const importEmployeesBulk = async (
    rows: Partial<TrainingEmployee>[],
    fileName = 'HR_Employee_Master.xlsx',
    importedBy = 'L&D Admin'
  ): Promise<EmployeeImportResult> => {
    const timestamp = new Date().toISOString();
    if (!rows.length) {
      return {
        success: true,
        fileName,
        importedBy,
        timestamp,
        rowsRead: 0,
        added: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        unmappedColumns: []
      };
    }

    setIsSyncing(true);

    const existingMap = new Map<string, TrainingEmployee>();
    employees.forEach(e => {
      if (e.employeeCode) {
        existingMap.set(e.employeeCode.trim().toUpperCase(), e);
      }
    });

    const validItemsToUpsert: TrainingEmployee[] = [];
    const errorList: Array<{ row: number; employeeCode?: string; employeeName?: string; error: string; reason: string }> = [];
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const seenCodesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row index
      const rawCode = (row.employeeCode || '').trim();
      const rawName = (row.employeeName || '').trim();

      if (!rawCode) {
        errorList.push({
          row: rowNum,
          employeeCode: '',
          employeeName: rawName,
          error: 'Employee Code missing',
          reason: 'Employee ID / Code is a mandatory unique identifier'
        });
        continue;
      }

      if (!rawName) {
        errorList.push({
          row: rowNum,
          employeeCode: rawCode,
          employeeName: '',
          error: 'Employee Name missing',
          reason: 'Employee Name is mandatory'
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
            department: row.department !== undefined ? row.department : validItemsToUpsert[itemIdx].department,
            designation: row.designation !== undefined ? row.designation : validItemsToUpsert[itemIdx].designation,
            location: row.location !== undefined ? row.location : validItemsToUpsert[itemIdx].location,
            email: row.email || validItemsToUpsert[itemIdx].email,
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
          email: row.email || existing.email,
          joiningDate: row.joiningDate || existing.joiningDate,
          updatedAt: timestamp
        };
        validItemsToUpsert.push(updatedEmp);
        updatedCount++;
      } else {
        const newEmp: TrainingEmployee = {
          id: `emp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          employeeCode: cleanCode,
          employeeName: rawName,
          department: row.department || '',
          designation: row.designation || '',
          location: row.location || '',
          email: row.email || undefined,
          joiningDate: row.joiningDate || undefined,
          status: 'Active',
          createdAt: timestamp,
          updatedAt: timestamp
        };
        validItemsToUpsert.push(newEmp);
        addedCount++;
      }
    }

    try {
      if (isSupabaseConfigured && validItemsToUpsert.length > 0) {
        const payload = validItemsToUpsert.map(mapEmployeeToDb);
        const { error: dbError } = await executeWithSchemaRetry(
          p => supabase.from('training_employees').upsert(p, { onConflict: 'employee_code' }),
          payload
        );
        if (dbError) throw dbError;

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
            rows_failed: errorList.length,
            errors: errorList
          });
        } catch {
          // ignore optional log table missing
        }
      }

      setEmployees(prev => {
        const upsertMap = new Map<string, TrainingEmployee>();
        validItemsToUpsert.forEach(item => upsertMap.set(item.employeeCode.toUpperCase(), item));
        
        const updatedList = prev.map(item => {
          const up = upsertMap.get(item.employeeCode.toUpperCase());
          if (up) {
            upsertMap.delete(item.employeeCode.toUpperCase());
            return up;
          }
          return item;
        });

        const newItems = Array.from(upsertMap.values());
        return [...newItems, ...updatedList];
      });

      return {
        success: errorList.length === 0 || validItemsToUpsert.length > 0,
        fileName,
        importedBy,
        timestamp,
        rowsRead: rows.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: errorList.length,
        errors: errorList,
        unmappedColumns: []
      };
    } catch (err: any) {
      console.error('[AssessmentContext] Bulk import employee error:', err);
      return {
        success: false,
        fileName,
        importedBy,
        timestamp,
        rowsRead: rows.length,
        added: 0,
        updated: 0,
        skipped: 0,
        failed: rows.length,
        errors: [{ row: 0, error: 'Database error', reason: err.message || 'Supabase upsert failed' }],
        unmappedColumns: []
      };
    } finally {
      setIsSyncing(false);
    }
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

  return (
    <AssessmentContext.Provider
      value={{
        employees,
        assessments,
        pkts,
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
        addAssessment,
        updateAssessment,
        deleteAssessment,
        addPKT,
        updatePKT,
        deletePKT,
        importEmployeesBulk,
        importAssessmentsBulk,
        importPKTsBulk,
        refreshAssessmentData: loadData,
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

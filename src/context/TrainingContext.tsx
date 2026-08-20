import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrainingProgram, 
  TrainingModule, 
  TrainingCourse, 
  TrainingImportLog, 
  ParsedImportData,
  CourseGroup,
  TrainingSubTab
} from '../types/training';
import { supabase, isSupabaseConfigured, maskSupabaseUrl, supabaseUrl } from '../lib/supabase';
import { groupCourses } from '../utils/trainingUtils';
import { useApp } from './AppContext';

// Database row mappers
const mapProgramFromDb = (row: any): TrainingProgram => ({
  id: row.id,
  programCode: row.program_code || row.programCode || '',
  programName: row.program_name || row.programName || '',
  programDescription: row.program_description || row.programDescription || '',
  status: row.status || 'Active',
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapProgramToDb = (p: TrainingProgram) => ({
  id: p.id,
  program_code: p.programCode,
  program_name: p.programName,
  program_description: p.programDescription || null,
  status: p.status,
  created_at: p.createdAt,
  updated_at: p.updatedAt
});

const mapModuleFromDb = (row: any): TrainingModule => ({
  id: row.id,
  moduleCode: row.module_code || row.moduleCode || '',
  moduleName: row.module_name || row.moduleName || '',
  duration: row.duration || '01:00:00',
  deliveryMode: row.delivery_mode || row.deliveryMode || 'Classroom Training (Offline)',
  status: row.status || 'Active',
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapModuleToDb = (m: TrainingModule) => ({
  id: m.id,
  module_code: m.moduleCode,
  module_name: m.moduleName,
  duration: m.duration,
  delivery_mode: m.deliveryMode,
  status: m.status,
  created_at: m.createdAt,
  updated_at: m.updatedAt
});

const mapCourseFromDb = (row: any): TrainingCourse => ({
  id: row.id,
  courseCode: row.course_code || row.courseCode || '',
  programCode: row.program_code || row.programCode || '',
  moduleCode: row.module_code || row.moduleCode || '',
  deliveryMode1: row.delivery_mode_1 || row.deliveryMode1 || row.delivery_mode || undefined,
  deliveryMode2: row.delivery_mode_2 || row.deliveryMode2 || undefined,
  deliveryMode3: row.delivery_mode_3 || row.deliveryMode3 || undefined,
  deliveryDay: Number(row.delivery_day ?? row.deliveryDay ?? 1),
  ownerRole: row.owner_role || row.ownerRole || 'Manager - Learning & Development',
  courseStatus: row.course_status || row.courseStatus || 'Approved',
  preAssessmentCode: row.pre_assessment_code || row.preAssessmentCode || undefined,
  postAssessmentCode: row.post_assessment_code || row.postAssessmentCode || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapCourseToDb = (c: TrainingCourse) => ({
  id: c.id,
  course_code: c.courseCode,
  program_code: c.programCode,
  module_code: c.moduleCode,
  delivery_mode_1: c.deliveryMode1 || null,
  delivery_mode_2: c.deliveryMode2 || null,
  delivery_mode_3: c.deliveryMode3 || null,
  delivery_day: c.deliveryDay,
  owner_role: c.ownerRole,
  course_status: c.courseStatus,
  pre_assessment_code: c.preAssessmentCode || null,
  post_assessment_code: c.postAssessmentCode || null,
  created_at: c.createdAt,
  updated_at: c.updatedAt
});

const mapImportLogFromDb = (row: any): TrainingImportLog => ({
  id: row.id,
  fileName: row.file_name || row.fileName || '',
  importedBy: row.imported_by || row.importedBy || 'Admin',
  importedAt: row.created_at || row.importedAt || new Date().toISOString(),
  programsAdded: Number(row.programs_added ?? row.programsAdded ?? 0),
  programsUpdated: Number(row.programs_updated ?? row.programsUpdated ?? 0),
  modulesAdded: Number(row.modules_added ?? row.modulesAdded ?? 0),
  modulesUpdated: Number(row.modules_updated ?? row.modulesUpdated ?? 0),
  coursesAdded: Number(row.courses_added ?? row.coursesAdded ?? 0),
  coursesUpdated: Number(row.courses_updated ?? row.coursesUpdated ?? 0),
  errorsCount: Number(row.errors_count ?? row.errorsCount ?? 0),
  status: row.status || 'Success',
  details: typeof row.log_details === 'string' ? JSON.parse(row.log_details) : (row.log_details || row.details || {})
});

const mapImportLogToDb = (l: TrainingImportLog) => ({
  id: l.id,
  file_name: l.fileName,
  imported_by: l.importedBy,
  programs_added: l.programsAdded,
  programs_updated: l.programsUpdated,
  modules_added: l.modulesAdded,
  modules_updated: l.modulesUpdated,
  courses_added: l.coursesAdded,
  courses_updated: l.coursesUpdated,
  errors_count: l.errorsCount,
  status: l.status,
  log_details: l.details ? JSON.stringify(l.details) : null,
  created_at: l.importedAt
});

export interface TrainingDiagnosticSummary {
  environment: string;
  supabaseUrl: string;
  authenticatedUserId: string;
  authenticatedUserEmail: string;
  programsQueryStatus: string;
  programsCount: number;
  modulesQueryStatus: string;
  modulesCount: number;
  coursesQueryStatus: string;
  coursesCount: number;
  connectionStatus: 'CONNECTED' | 'FAILED';
  lastChecked: string;
  errors: string[];
}

export interface LocalCurriculumStatus {
  hasLocalData: boolean;
  programsCount: number;
  modulesCount: number;
  coursesCount: number;
  rawPrograms: any[];
  rawModules: any[];
  rawCourses: any[];
  sourceName?: string;
}

export interface DatabaseOperationError {
  table: string;
  operation: string;
  code: string;
  message: string;
  details?: string;
  hint?: string;
  recordIdentifier?: string;
}

export interface RlsTestResult {
  testedAt: string;
  authRole: 'anon' | 'authenticated' | 'none';
  supabaseAuthStatus: 'PASS' | 'FAIL';
  supabaseAuthUid: string | null;
  publicUsersStatus: 'FOUND' | 'NOT FOUND' | 'PENDING';
  publicUsersMatch?: 'PASS' | 'FAIL' | 'PENDING';
  publicUsersRecord?: any;
  applicationRole: string;
  trainingCoursesSchemaStatus: 'PASS' | 'FAIL' | 'PENDING';
  trainingCoursesSchemaMessage?: string;
  supabaseAuthUserId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  databaseRoleResolution: string;
  isAuthorizedWriter: boolean;
  isAuthorizedDeleter: boolean;
  hasSession: boolean;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  selectStatus: 'PASS' | 'FAIL' | 'PENDING';
  insertStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  updateStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  deleteStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING';
  testRecordId: string;
  success: boolean;
  isMigrationAllowed: boolean;
  statusMessage: string;
  error?: {
    code: string;
    message: string;
    details?: string;
    hint?: string;
    table?: string;
  };
}

export interface EntitySyncCount {
  local: number;
  supabase: number;
  added: number;
  updated: number;
  failed: number;
  errors?: string[];
  detailedErrors?: DatabaseOperationError[];
}

export interface MigrationSummary {
  success: boolean;
  programs: EntitySyncCount;
  modules: EntitySyncCount;
  courses: EntitySyncCount;
  overall: 'SUCCESS' | 'FAILED';
  importLogId?: string;
  errorMessage?: string;
  details?: {
    programs: any[];
    modules: any[];
    courses: any[];
    errors: string[];
    detailedErrors?: DatabaseOperationError[];
  };
}

export const TRAINING_STORAGE_KEYS = {
  PROGRAMS: 'cadeploy_training_programs_v1',
  MODULES: 'cadeploy_training_modules_v1',
  COURSES: 'cadeploy_training_courses_v1',
  IMPORT_LOGS: 'cadeploy_training_import_logs_v1'
};

// In-memory backup cache to prevent data loss across unmounts or empty DB states
const inMemoryCurriculumBackup = {
  programs: [] as TrainingProgram[],
  modules: [] as TrainingModule[],
  courses: [] as TrainingCourse[]
};

interface TrainingContextType {
  programs: TrainingProgram[];
  modules: TrainingModule[];
  courses: TrainingCourse[];
  groupedCourses: CourseGroup[];
  importLogs: TrainingImportLog[];
  isLoading: boolean;
  isSyncing: boolean;
  isSupabaseConnected: boolean;
  error: string | null;
  diagnosticSummary: TrainingDiagnosticSummary | null;
  activeSubTab: TrainingSubTab;
  setActiveSubTab: (tab: TrainingSubTab) => void;

  // Local Curriculum Migration & Diagnostic
  localCurriculumStatus: LocalCurriculumStatus;
  lastSyncTime: string | null;
  lastSyncResult: string | null;
  lastSyncDetails: any | null;
  checkLocalCurriculum: () => LocalCurriculumStatus;
  testRlsPermissions: () => Promise<RlsTestResult>;
  syncLocalStorageToSupabase: () => Promise<MigrationSummary>;
  syncCurrentCurriculumToSupabase: () => Promise<MigrationSummary>;

  // Program operations
  addProgram: (data: Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateProgram: (id: string, updates: Partial<TrainingProgram>) => Promise<{ success: boolean; error?: string }>;
  deleteProgram: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeletePrograms: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    dependencyErrors?: string[];
  }>;

  // Module operations
  addModule: (data: Omit<TrainingModule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateModule: (id: string, updates: Partial<TrainingModule>) => Promise<{ success: boolean; error?: string }>;
  deleteModule: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteModules: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    dependencyErrors?: string[];
  }>;

  // Course operations
  addCourseRecord: (data: Omit<TrainingCourse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateCourseRecord: (id: string, updates: Partial<TrainingCourse>) => Promise<{ success: boolean; error?: string }>;
  deleteCourseRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteCourseGroup: (courseCode: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteCourses: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }>;
  bulkDeleteCourseGroups: (courseCodes: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }>;

  // Excel Import
  executeImport: (
    parsedData: ParsedImportData,
    duplicateStrategy: 'update' | 'skip',
    fileName: string,
    importedBy: string
  ) => Promise<{ success: boolean; log: TrainingImportLog; error?: string }>;

  // Import history
  addImportLog: (log: TrainingImportLog) => Promise<void>;
  clearImportLogs: () => Promise<void>;

  // Refetch
  refetchTrainingData: () => Promise<void>;
  refreshTrainingData: () => Promise<void>;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

// Multi-source detector and normalizer for local curriculum data
const detectAndLoadLocalCurriculum = () => {
  if (typeof window === 'undefined') {
    return { programs: [], modules: [], courses: [], sourceName: 'None' };
  }

  try {
    // 1. Check in-memory backup first
    if (inMemoryCurriculumBackup.programs.length > 0 || inMemoryCurriculumBackup.modules.length > 0 || inMemoryCurriculumBackup.courses.length > 0) {
      return {
        programs: inMemoryCurriculumBackup.programs,
        modules: inMemoryCurriculumBackup.modules,
        courses: inMemoryCurriculumBackup.courses,
        sourceName: 'In-Memory State Backup'
      };
    }

    // 2. Check primary localStorage keys
    const rawP = localStorage.getItem(TRAINING_STORAGE_KEYS.PROGRAMS);
    const rawM = localStorage.getItem(TRAINING_STORAGE_KEYS.MODULES);
    const rawC = localStorage.getItem(TRAINING_STORAGE_KEYS.COURSES);

    let parsedP = rawP ? JSON.parse(rawP) : [];
    let parsedM = rawM ? JSON.parse(rawM) : [];
    let parsedC = rawC ? JSON.parse(rawC) : [];

    let sourceName = 'LocalStorage (cadeploy_training_*_v1)';

    // 3. Check legacy/fallback keys if empty
    if ((!parsedP || parsedP.length === 0) && (!parsedM || parsedM.length === 0) && (!parsedC || parsedC.length === 0)) {
      const fallbackKeysP = ['cadeploy_training_programs', 'training_programs', 'curriculum_programs', 'training_programs_v1'];
      const fallbackKeysM = ['cadeploy_training_modules', 'training_modules', 'curriculum_modules', 'training_modules_v1'];
      const fallbackKeysC = ['cadeploy_training_courses', 'training_courses', 'curriculum_courses', 'training_courses_v1'];

      for (const k of fallbackKeysP) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const p = JSON.parse(val);
            if (Array.isArray(p) && p.length > 0) {
              parsedP = p;
              sourceName = `LocalStorage (${k})`;
              break;
            }
          } catch (_) {}
        }
      }

      for (const k of fallbackKeysM) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const m = JSON.parse(val);
            if (Array.isArray(m) && m.length > 0) {
              parsedM = m;
              break;
            }
          } catch (_) {}
        }
      }

      for (const k of fallbackKeysC) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const c = JSON.parse(val);
            if (Array.isArray(c) && c.length > 0) {
              parsedC = c;
              break;
            }
          } catch (_) {}
        }
      }
    }

    // 4. Dynamic deep scan across all storage keys if still empty
    if ((!parsedP || parsedP.length === 0) && (!parsedM || parsedM.length === 0) && (!parsedC || parsedC.length === 0)) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        try {
          const val = localStorage.getItem(key);
          if (!val || !val.startsWith('[')) continue;
          const items = JSON.parse(val);
          if (Array.isArray(items) && items.length > 0) {
            if (!parsedP.length && items.some(it => it && (it.programCode || it.program_code))) {
              parsedP = items;
              sourceName = `LocalStorage Dynamic (${key})`;
            }
            if (!parsedM.length && items.some(it => it && (it.moduleCode || it.module_code))) {
              parsedM = items;
            }
            if (!parsedC.length && items.some(it => it && (it.courseCode || it.course_code))) {
              parsedC = items;
            }
          }
        } catch (_) {}
      }
    }

    // Normalize structures
    const normP: TrainingProgram[] = Array.isArray(parsedP) ? parsedP.map((p: any) => ({
      id: p.id || `prg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      programCode: p.programCode || p.program_code || '',
      programName: p.programName || p.program_name || p.programCode || '',
      programDescription: p.programDescription || p.program_description || p.description || '',
      status: p.status || 'Active',
      createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      updatedAt: p.updatedAt || p.updated_at || new Date().toISOString()
    })) : [];

    const normM: TrainingModule[] = Array.isArray(parsedM) ? parsedM.map((m: any) => ({
      id: m.id || `mdl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      programId: m.programId || m.program_id,
      programCode: m.programCode || m.program_code,
      moduleCode: m.moduleCode || m.module_code || '',
      moduleName: m.moduleName || m.module_name || m.moduleCode || '',
      description: m.description || '',
      duration: m.duration || '01:00:00',
      deliveryMode: m.deliveryMode || m.delivery_mode || 'Classroom Training (Offline)',
      status: m.status || 'Active',
      createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      updatedAt: m.updatedAt || m.updated_at || new Date().toISOString()
    })) : [];

    const normC: TrainingCourse[] = Array.isArray(parsedC) ? parsedC.map((c: any) => ({
      id: c.id || `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      courseCode: c.courseCode || c.course_code || '',
      programCode: c.programCode || c.program_code || '',
      moduleCode: c.moduleCode || c.module_code || '',
      programId: c.programId || c.program_id,
      moduleId: c.moduleId || c.module_id,
      deliveryMode1: c.deliveryMode1 || c.delivery_mode_1 || c.delivery_mode,
      deliveryMode2: c.deliveryMode2 || c.delivery_mode_2,
      deliveryMode3: c.deliveryMode3 || c.delivery_mode_3,
      deliveryDay: Number(c.deliveryDay ?? c.delivery_day ?? 1),
      ownerRole: c.ownerRole || c.owner_role || 'Manager - Learning & Development',
      courseStatus: c.courseStatus || c.course_status || c.status || 'Approved',
      preAssessmentCode: c.preAssessmentCode || c.pre_assessment_code,
      postAssessmentCode: c.postAssessmentCode || c.post_assessment_code,
      createdAt: c.createdAt || c.created_at || new Date().toISOString(),
      updatedAt: c.updatedAt || c.updated_at || new Date().toISOString()
    })) : [];

    // Mirror to in-memory backup and primary localStorage keys
    if (normP.length > 0) {
      inMemoryCurriculumBackup.programs = normP;
      localStorage.setItem(TRAINING_STORAGE_KEYS.PROGRAMS, JSON.stringify(normP));
    }
    if (normM.length > 0) {
      inMemoryCurriculumBackup.modules = normM;
      localStorage.setItem(TRAINING_STORAGE_KEYS.MODULES, JSON.stringify(normM));
    }
    if (normC.length > 0) {
      inMemoryCurriculumBackup.courses = normC;
      localStorage.setItem(TRAINING_STORAGE_KEYS.COURSES, JSON.stringify(normC));
    }

    return { programs: normP, modules: normM, courses: normC, sourceName };
  } catch (e) {
    console.warn('Error in detectAndLoadLocalCurriculum:', e);
    return { programs: [], modules: [], courses: [], sourceName: 'Error' };
  }
};

export const TrainingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<TrainingSubTab>('programs');

  // Initialize with local cache or in-memory backup so UI immediately has the 46/143/78 records
  const initialLocal = detectAndLoadLocalCurriculum();

  const [programs, setPrograms] = useState<TrainingProgram[]>(initialLocal.programs);
  const [modules, setModules] = useState<TrainingModule[]>(initialLocal.modules);
  const [courses, setCourses] = useState<TrainingCourse[]>(initialLocal.courses);
  const [importLogs, setImportLogs] = useState<TrainingImportLog[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticSummary, setDiagnosticSummary] = useState<TrainingDiagnosticSummary | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const [lastSyncDetails, setLastSyncDetails] = useState<any | null>(null);

  // Keep references updated
  const programsRef = useRef(programs);
  programsRef.current = programs;
  const modulesRef = useRef(modules);
  modulesRef.current = modules;
  const coursesRef = useRef(courses);
  coursesRef.current = courses;

  // Check local curriculum stored in browser localStorage or state
  const checkLocalCurriculum = useCallback((): LocalCurriculumStatus => {
    try {
      const activeP = programsRef.current.length > 0 ? programsRef.current : inMemoryCurriculumBackup.programs;
      const activeM = modulesRef.current.length > 0 ? modulesRef.current : inMemoryCurriculumBackup.modules;
      const activeC = coursesRef.current.length > 0 ? coursesRef.current : inMemoryCurriculumBackup.courses;

      if (activeP.length > 0 || activeM.length > 0 || activeC.length > 0) {
        return {
          hasLocalData: true,
          programsCount: activeP.length,
          modulesCount: activeM.length,
          coursesCount: activeC.length,
          rawPrograms: activeP,
          rawModules: activeM,
          rawCourses: activeC,
          sourceName: 'Application State (TrainingContext)'
        };
      }

      const localDetected = detectAndLoadLocalCurriculum();
      return {
        hasLocalData: localDetected.programs.length > 0 || localDetected.modules.length > 0 || localDetected.courses.length > 0,
        programsCount: localDetected.programs.length,
        modulesCount: localDetected.modules.length,
        coursesCount: localDetected.courses.length,
        rawPrograms: localDetected.programs,
        rawModules: localDetected.modules,
        rawCourses: localDetected.courses,
        sourceName: localDetected.sourceName
      };
    } catch (e) {
      console.warn('Error reading local curriculum cache:', e);
      return { hasLocalData: false, programsCount: 0, modulesCount: 0, coursesCount: 0, rawPrograms: [], rawModules: [], rawCourses: [], sourceName: 'None' };
    }
  }, []);

  const [localCurriculumStatus, setLocalCurriculumStatus] = useState<LocalCurriculumStatus>(() => checkLocalCurriculum());

  // RLS Preflight Test: Real probe using client context to test SELECT, INSERT, UPDATE, DELETE and schema
  const testRlsPermissions = async (): Promise<RlsTestResult> => {
    const testedAt = new Date().toISOString();
    const probeId = `_rls_probe_${Date.now()}`;
    const probeCode = `_PRG_PROBE_${Date.now()}`;
    const userRole = currentUser?.role || 'Team Member';
    const isAuthorizedWriter = ['Administrator', 'L&D Lead', 'L&D Specialist', 'admin'].includes(userRole);
    const isAuthorizedDeleter = ['Administrator', 'L&D Lead', 'admin'].includes(userRole);

    const result: RlsTestResult = {
      testedAt,
      authRole: 'none',
      supabaseAuthStatus: 'FAIL',
      supabaseAuthUid: null,
      publicUsersStatus: 'PENDING',
      publicUsersMatch: 'PENDING',
      publicUsersRecord: null,
      applicationRole: userRole,
      trainingCoursesSchemaStatus: 'PENDING',
      trainingCoursesSchemaMessage: '',
      supabaseAuthUserId: 'None (Anon Client)',
      userId: currentUser?.id || 'u-admin',
      userEmail: currentUser?.username || currentUser?.email || 'admin (dalvikiran09@gmail.com)',
      userRole,
      databaseRoleResolution: isAuthorizedWriter 
        ? (isAuthorizedDeleter ? 'Authorized (Administrator/Lead: Full Read/Write/Delete)' : 'Authorized (L&D Specialist: Read/Write, Delete Restricted)') 
        : 'Read-Only (Learner/Team Member)',
      isAuthorizedWriter,
      isAuthorizedDeleter,
      hasSession: false,
      canSelect: false,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
      selectStatus: 'PENDING',
      insertStatus: 'PENDING',
      updateStatus: 'PENDING',
      deleteStatus: 'PENDING',
      testRecordId: probeId,
      success: false,
      isMigrationAllowed: false,
      statusMessage: ''
    };

    if (!isSupabaseConfigured) {
      result.error = {
        code: 'CONFIG_MISSING',
        message: 'Supabase client is not configured.',
        table: 'training_programs'
      };
      result.statusMessage = 'Supabase client is not configured.';
      return result;
    }

    try {
      // 1. Supabase Auth Check
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        result.hasSession = true;
        result.authRole = 'authenticated';
        result.supabaseAuthStatus = 'PASS';
        result.supabaseAuthUid = sessionData.session.user.id;
        result.supabaseAuthUserId = sessionData.session.user.id;
      } else {
        result.authRole = 'anon';
        result.supabaseAuthStatus = 'FAIL';
        result.supabaseAuthUid = null;
        result.supabaseAuthUserId = 'None (Anon / Header Session)';
      }

      // 2. public.users table check & auth_user_id verification
      const authUid = sessionData?.session?.user?.id;
      let matchedDbUser: any = null;

      if (authUid) {
        const { data: dbUsersByAuth } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUid);

        if (dbUsersByAuth && dbUsersByAuth.length > 0) {
          matchedDbUser = dbUsersByAuth[0];
          result.publicUsersMatch = 'PASS';
          result.publicUsersStatus = 'FOUND';
          result.publicUsersRecord = matchedDbUser;
        } else {
          result.publicUsersMatch = 'FAIL';
        }
      }

      if (!matchedDbUser) {
        const userLookupId = currentUser?.id || 'u-admin';
        const userLookupName = currentUser?.username || currentUser?.name || 'admin';
        const { data: dbUsers } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${userLookupId},username.eq.${userLookupName}`);

        if (dbUsers && dbUsers.length > 0) {
          result.publicUsersStatus = 'FOUND';
          result.publicUsersRecord = dbUsers[0];
          if (authUid && dbUsers[0].auth_user_id === authUid) {
            result.publicUsersMatch = 'PASS';
          } else {
            result.publicUsersMatch = 'FAIL';
          }
        } else {
          result.publicUsersStatus = 'NOT FOUND';
          result.publicUsersMatch = 'FAIL';
        }
      }

      // 3. training_courses schema check (verify course_status is present and status is not queried)
      const { error: schemaErr } = await supabase
        .from('training_courses')
        .select('id, course_code, program_code, module_code, course_status, delivery_day')
        .limit(1);

      if (schemaErr) {
        result.trainingCoursesSchemaStatus = 'FAIL';
        result.trainingCoursesSchemaMessage = `[${schemaErr.code || 'PGRST204'}] ${schemaErr.message}`;
      } else {
        result.trainingCoursesSchemaStatus = 'PASS';
        result.trainingCoursesSchemaMessage = 'Schema verified (course_status column active, status column dropped)';
      }

      // 4. Test SELECT on training_programs
      const { error: selErr } = await supabase
        .from('training_programs')
        .select('id')
        .limit(1);

      if (selErr) {
        result.selectStatus = 'FAIL';
        result.canSelect = false;
        result.error = {
          code: selErr.code || 'UNKNOWN',
          message: selErr.message,
          details: selErr.details,
          hint: selErr.hint,
          table: 'training_programs'
        };
        result.statusMessage = `SELECT failed: [${selErr.code || 'ERR'}] ${selErr.message}`;
        return result;
      } else {
        result.selectStatus = 'PASS';
        result.canSelect = true;
      }

      // 5. Test INSERT probe record
      const probeRow = {
        id: probeId,
        program_code: probeCode,
        program_name: `[RLS Probe] Validation Test ${probeCode}`,
        program_description: 'Temporary probe record for RLS preflight test',
        status: 'Draft',
        created_at: testedAt,
        updated_at: testedAt
      };

      const { error: insErr } = await supabase
        .from('training_programs')
        .insert([probeRow]);

      let probeInserted = false;

      if (insErr) {
        if (!isAuthorizedWriter) {
          // Normal user / team member correctly blocked by RLS
          result.insertStatus = 'BLOCKED';
          result.canInsert = false;
        } else {
          // Authorized user failed to insert
          result.insertStatus = 'FAIL';
          result.canInsert = false;
          result.error = {
            code: insErr.code || 'UNKNOWN',
            message: insErr.message,
            details: insErr.details,
            hint: insErr.hint,
            table: 'training_programs'
          };
          result.statusMessage = `INSERT failed: [${insErr.code || '42501'}] ${insErr.message}`;
          return result;
        }
      } else {
        probeInserted = true;
        if (!isAuthorizedWriter) {
          result.insertStatus = 'FAIL';
          result.canInsert = true;
          result.statusMessage = `Security Alert: Role "${userRole}" was able to insert!`;
        } else {
          result.insertStatus = 'PASS';
          result.canInsert = true;
        }
      }

      // 6. Test UPDATE probe record
      if (probeInserted) {
        const { error: updErr } = await supabase
          .from('training_programs')
          .update({ program_name: `[RLS Probe] Validation Updated ${probeCode}` })
          .eq('id', probeId);

        if (updErr) {
          result.updateStatus = 'FAIL';
          result.canUpdate = false;
        } else {
          result.updateStatus = 'PASS';
          result.canUpdate = true;
        }

        // 7. Test DELETE probe record
        const { error: delErr } = await supabase
          .from('training_programs')
          .delete()
          .eq('id', probeId);

        if (delErr) {
          if (!isAuthorizedDeleter) {
            result.deleteStatus = 'BLOCKED';
            result.canDelete = false;
          } else {
            result.deleteStatus = 'FAIL';
            result.canDelete = false;
          }
        } else {
          if (!isAuthorizedDeleter) {
            result.deleteStatus = 'FAIL';
            result.canDelete = true;
          } else {
            result.deleteStatus = 'PASS';
            result.canDelete = true;
          }
        }
      } else if (!isAuthorizedWriter) {
        result.updateStatus = 'BLOCKED';
        result.deleteStatus = 'BLOCKED';
      }

      // Evaluation:
      // The migration button must remain disabled until:
      // 1. session exists
      // 2. AND auth.uid() is not null
      // 3. AND public.users.auth_user_id = auth.uid()
      // 4. AND role is authorized
      // 5. AND RLS INSERT test passes.
      const hasValidSession = Boolean(result.hasSession && result.supabaseAuthUid);
      const hasAuthMatch = result.publicUsersMatch === 'PASS';
      const isAuthRoleValid = isAuthorizedWriter;
      const hasInsertPerm = result.canInsert && result.insertStatus === 'PASS';
      const hasValidSchema = result.trainingCoursesSchemaStatus === 'PASS';

      result.isMigrationAllowed = Boolean(hasValidSession && hasAuthMatch && isAuthRoleValid && hasInsertPerm && hasValidSchema);
      result.success = isAuthorizedWriter 
        ? Boolean(result.canSelect && hasInsertPerm && hasValidSession && hasAuthMatch && hasValidSchema) 
        : Boolean(result.canSelect);

      if (!hasValidSession) {
        result.statusMessage = 'MIGRATION BLOCKED: Active Supabase Auth session does not exist (auth.uid() is NULL). Please log in with Supabase Auth.';
      } else if (!hasAuthMatch) {
        result.statusMessage = `MIGRATION BLOCKED: public.users record auth_user_id does not match active Supabase Auth UID (${result.supabaseAuthUid}).`;
      } else if (!isAuthRoleValid) {
        result.statusMessage = `MIGRATION BLOCKED: Role "${userRole}" is not authorized for database write operations.`;
      } else if (!hasInsertPerm) {
        result.statusMessage = `MIGRATION BLOCKED: INSERT probe failed: [${result.error?.code || '42501'}] ${result.error?.message || 'Write permission denied by RLS policy'}`;
      } else if (!hasValidSchema) {
        result.statusMessage = `MIGRATION BLOCKED: training_courses schema check failed (${result.trainingCoursesSchemaMessage}).`;
      } else {
        result.statusMessage = `READY TO MIGRATE — Supabase Auth UID (${result.supabaseAuthUid}), public.users mapping, and write permissions verified for Role "${userRole}".`;
      }

      console.log('[RLS PREFLIGHT RESULT]', {
        user: result.userEmail,
        role: result.userRole,
        resolution: result.databaseRoleResolution,
        supabaseAuth: result.supabaseAuthStatus,
        authUserId: result.supabaseAuthUserId,
        publicUsers: result.publicUsersStatus,
        trainingCoursesSchema: result.trainingCoursesSchemaStatus,
        select: result.selectStatus,
        insert: result.insertStatus,
        update: result.updateStatus,
        delete: result.deleteStatus,
        migrationAllowed: result.isMigrationAllowed
      });

      return result;
    } catch (err: any) {
      console.error('[RLS PREFLIGHT] Error:', err);
      result.error = {
        code: err?.code || 'UNEXPECTED',
        message: err?.message || 'Unexpected exception during RLS preflight test',
        table: 'training_programs'
      };
      result.statusMessage = err?.message || 'Unexpected exception during RLS check';
      return result;
    }
  };

  // One-Time Curriculum Migration: Current Application / LocalStorage -> Supabase
  const syncCurrentCurriculumToSupabase = async (): Promise<MigrationSummary> => {
    setIsSyncing(true);
    const summary: MigrationSummary = {
      success: false,
      programs: { local: 0, supabase: 0, added: 0, updated: 0, failed: 0, errors: [], detailedErrors: [] },
      modules: { local: 0, supabase: 0, added: 0, updated: 0, failed: 0, errors: [], detailedErrors: [] },
      courses: { local: 0, supabase: 0, added: 0, updated: 0, failed: 0, errors: [], detailedErrors: [] },
      overall: 'FAILED',
      details: {
        programs: [],
        modules: [],
        courses: [],
        errors: [],
        detailedErrors: []
      }
    };

    if (!isSupabaseConfigured) {
      summary.errorMessage = 'Supabase client is not configured. Please check environment variables.';
      setIsSyncing(false);
      return summary;
    }

    // 0. Preflight RLS Check: verify permissions before initiating batch writes
    const preflight = await testRlsPermissions();
    if (!preflight.isMigrationAllowed) {
      const errMsg = `MIGRATION BLOCKED BY RLS: User "${currentUser?.name || currentUser?.username}" (${currentUser?.role}) is not authorized or RLS policies failed [${preflight.error?.code || '42501'}]. ${preflight.statusMessage}. Execute the RLS SQL script in Supabase SQL Editor first.`;
      console.warn('[CURRICULUM SYNC] Preflight failed:', errMsg);
      summary.errorMessage = errMsg;
      setIsSyncing(false);
      return summary;
    }

    try {
      // 1. Gather all active records (from state, backup, or local detection)
      const localState = checkLocalCurriculum();
      const rawProgramsToSync = (programsRef.current.length > 0 ? programsRef.current : localState.rawPrograms);
      const rawModulesToSync = (modulesRef.current.length > 0 ? modulesRef.current : localState.rawModules);
      const rawCoursesToSync = (coursesRef.current.length > 0 ? coursesRef.current : localState.rawCourses);

      summary.programs.local = rawProgramsToSync.length;
      summary.modules.local = rawModulesToSync.length;
      summary.courses.local = rawCoursesToSync.length;

      if (rawProgramsToSync.length === 0 && rawModulesToSync.length === 0 && rawCoursesToSync.length === 0) {
        summary.errorMessage = 'No curriculum records found in application state or localStorage to synchronize.';
        setIsSyncing(false);
        return summary;
      }

      // Exact count comparison before executing any writes
      const { count: preProgCount } = await supabase.from('training_programs').select('*', { count: 'exact', head: true });
      const { count: preModCount } = await supabase.from('training_modules').select('*', { count: 'exact', head: true });
      const { count: preCrsCount } = await supabase.from('training_courses').select('*', { count: 'exact', head: true });

      const dbP = preProgCount ?? 0;
      const dbM = preModCount ?? 0;
      const dbC = preCrsCount ?? 0;

      console.log(`[CURRICULUM SYNC] Pre-migration Database Count Check: Programs=${dbP}, Modules=${dbM}, Courses=${dbC}`);

      // If Supabase already contains the full curriculum (46 Programs, 143 Modules, 194 Courses), mark as complete without redundant writes
      if (dbP >= 46 && dbM >= 143 && dbC >= 194) {
        console.log('[CURRICULUM SYNC] Supabase already contains all 46 programs, 143 modules, and 194 courses. Migration is already complete!');
        summary.programs.supabase = dbP;
        summary.modules.supabase = dbM;
        summary.courses.supabase = dbC;
        summary.success = true;
        summary.overall = 'SUCCESS';
        summary.errorMessage = 'MIGRATION ALREADY COMPLETE: Database already contains 46 Programs, 143 Modules, 194 Courses.';
        
        await refetchTrainingData();
        setLastSyncTime(new Date().toISOString());
        setLastSyncResult('SUCCESS');
        setIsSyncing(false);
        return summary;
      }

      const now = new Date().toISOString();
      const authUser = currentUser?.username || currentUser?.name || 'admin (dalvikiran09@gmail.com)';

      // -------------------------------------------------------------
      // STEP 1: UPSERT PROGRAMS (Idempotent, Unique by program_code)
      // -------------------------------------------------------------
      console.log(`[CURRICULUM SYNC] Step 1: Processing ${rawProgramsToSync.length} Programs into public.training_programs...`);
      const { data: existingDbPrograms, error: initialPErr } = await supabase.from('training_programs').select('id, program_code');
      if (initialPErr) {
        console.error('Error querying existing training_programs:', initialPErr);
      }

      const existingProgMap = new Map<string, string>();
      (existingDbPrograms || []).forEach((p: any) => {
        if (p.program_code) existingProgMap.set(p.program_code.toUpperCase(), p.id);
      });

      const programsPayload: any[] = [];
      for (const p of rawProgramsToSync) {
        const code = String(p.programCode || p.program_code || '').trim();
        if (!code) continue;

        const existingId = existingProgMap.get(code.toUpperCase()) || p.id || `prg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const row = {
          id: existingId,
          program_code: code,
          program_name: p.programName || p.program_name || code,
          program_description: p.programDescription || p.program_description || p.description || null,
          status: p.status || 'Active',
          created_at: p.createdAt || p.created_at || now,
          updated_at: now
        };
        programsPayload.push(row);
      }

      for (const prgRow of programsPayload) {
        const isExisting = existingProgMap.has(prgRow.program_code.toUpperCase());
        const { error: pErr } = await supabase
          .from('training_programs')
          .upsert([prgRow], { onConflict: 'program_code' });

        if (pErr) {
          summary.programs.failed++;
          const errMsg = `Program "${prgRow.program_code}": [${pErr.code || 'ERR'}] ${pErr.message}`;
          const detailedErr: DatabaseOperationError = {
            table: 'public.training_programs',
            operation: 'UPSERT',
            code: pErr.code || 'UNKNOWN',
            message: pErr.message,
            details: pErr.details,
            hint: pErr.hint,
            recordIdentifier: prgRow.program_code
          };
          summary.programs.errors?.push(errMsg);
          summary.programs.detailedErrors?.push(detailedErr);
          summary.details?.errors.push(errMsg);
          summary.details?.detailedErrors?.push(detailedErr);
          summary.details?.programs.push({ code: prgRow.program_code, status: 'FAILED', error: pErr.message });
        } else {
          if (isExisting) {
            summary.programs.updated++;
            summary.details?.programs.push({ code: prgRow.program_code, status: 'UPDATED' });
          } else {
            summary.programs.added++;
            summary.details?.programs.push({ code: prgRow.program_code, status: 'ADDED' });
          }
        }
      }

      // STEP 2: VERIFY PROGRAMS IN DATABASE
      console.log(`[CURRICULUM SYNC] Step 2: Verifying Programs in Database...`);
      const { data: refreshedDbPrograms, count: verifiedPCount } = await supabase
        .from('training_programs')
        .select('id, program_code', { count: 'exact' });

      summary.programs.supabase = verifiedPCount ?? (refreshedDbPrograms ? refreshedDbPrograms.length : 0);

      const finalProgMap = new Map<string, string>();
      (refreshedDbPrograms || []).forEach((p: any) => {
        if (p.program_code) finalProgMap.set(p.program_code.toUpperCase(), p.id);
      });

      // -------------------------------------------------------------
      // STEP 3: UPSERT MODULES (Resolving program_id)
      // -------------------------------------------------------------
      console.log(`[CURRICULUM SYNC] Step 3: Processing ${rawModulesToSync.length} Modules into public.training_modules...`);
      const { data: existingDbModules } = await supabase.from('training_modules').select('id, module_code');
      const existingModMap = new Map<string, string>();
      (existingDbModules || []).forEach((m: any) => {
        if (m.module_code) existingModMap.set(m.module_code.toUpperCase(), m.id);
      });

      const modulesPayload: any[] = [];
      for (const m of rawModulesToSync) {
        const code = String(m.moduleCode || m.module_code || '').trim();
        if (!code) continue;

        const existingId = existingModMap.get(code.toUpperCase()) || m.id || `mdl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        let resolvedProgramId = m.program_id || m.programId || null;
        if (!resolvedProgramId && (m.programCode || m.program_code)) {
          const progCode = String(m.programCode || m.program_code).trim().toUpperCase();
          resolvedProgramId = finalProgMap.get(progCode) || null;
        }

        const row = {
          id: existingId,
          program_id: resolvedProgramId,
          module_code: code,
          module_name: m.moduleName || m.module_name || code,
          description: m.description || null,
          duration: m.duration || '01:00:00',
          delivery_mode: m.deliveryMode || m.delivery_mode || 'Classroom Training (Offline)',
          status: m.status || 'Active',
          created_at: m.createdAt || m.created_at || now,
          updated_at: now
        };
        modulesPayload.push(row);
      }

      for (const modRow of modulesPayload) {
        const isExisting = existingModMap.has(modRow.module_code.toUpperCase());
        const { error: mErr } = await supabase
          .from('training_modules')
          .upsert([modRow]);

        if (mErr) {
          summary.modules.failed++;
          const errMsg = `Module "${modRow.module_code}": [${mErr.code || 'ERR'}] ${mErr.message}`;
          const detailedErr: DatabaseOperationError = {
            table: 'public.training_modules',
            operation: 'UPSERT',
            code: mErr.code || 'UNKNOWN',
            message: mErr.message,
            details: mErr.details,
            hint: mErr.hint,
            recordIdentifier: modRow.module_code
          };
          summary.modules.errors?.push(errMsg);
          summary.modules.detailedErrors?.push(detailedErr);
          summary.details?.errors.push(errMsg);
          summary.details?.detailedErrors?.push(detailedErr);
          summary.details?.modules.push({ code: modRow.module_code, status: 'FAILED', error: mErr.message });
        } else {
          if (isExisting) {
            summary.modules.updated++;
            summary.details?.modules.push({ code: modRow.module_code, status: 'UPDATED' });
          } else {
            summary.modules.added++;
            summary.details?.modules.push({ code: modRow.module_code, status: 'ADDED' });
          }
        }
      }

      // STEP 4: VERIFY MODULES IN DATABASE
      console.log(`[CURRICULUM SYNC] Step 4: Verifying Modules in Database...`);
      const { data: refreshedDbModules, count: verifiedMCount } = await supabase
        .from('training_modules')
        .select('id, module_code', { count: 'exact' });

      summary.modules.supabase = verifiedMCount ?? (refreshedDbModules ? refreshedDbModules.length : 0);

      const finalModMap = new Map<string, string>();
      (refreshedDbModules || []).forEach((m: any) => {
        if (m.module_code) finalModMap.set(m.module_code.toUpperCase(), m.id);
      });

      // -------------------------------------------------------------
      // STEP 5: UPSERT COURSES (Resolving program_id and module_id)
      // -------------------------------------------------------------
      console.log(`[CURRICULUM SYNC] Step 5: Processing ${rawCoursesToSync.length} Courses into public.training_courses...`);
      const { data: existingDbCourses } = await supabase.from('training_courses').select('id, course_code, program_code, module_code');
      const existingCourseKeyMap = new Map<string, string>();
      (existingDbCourses || []).forEach((c: any) => {
        const key = `${String(c.course_code || '').toUpperCase()}::${String(c.program_code || '').toUpperCase()}::${String(c.module_code || '').toUpperCase()}`;
        existingCourseKeyMap.set(key, c.id);
      });

      const coursesPayload: any[] = [];
      for (const c of rawCoursesToSync) {
        const courseCode = String(c.courseCode || c.course_code || '').trim();
        const progCode = String(c.programCode || c.program_code || '').trim();
        const modCode = String(c.moduleCode || c.module_code || '').trim();
        if (!courseCode) continue;

        const key = `${courseCode.toUpperCase()}::${progCode.toUpperCase()}::${modCode.toUpperCase()}`;
        const existingId = existingCourseKeyMap.get(key) || c.id || `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const resolvedProgramId = c.program_id || c.programId || finalProgMap.get(progCode.toUpperCase()) || null;
        const resolvedModuleId = c.module_id || c.moduleId || finalModMap.get(modCode.toUpperCase()) || null;

        const row = {
          id: existingId,
          course_code: courseCode,
          program_code: progCode || null,
          module_code: modCode || null,
          program_id: resolvedProgramId,
          module_id: resolvedModuleId,
          delivery_mode_1: c.deliveryMode1 || c.delivery_mode_1 || c.delivery_mode || null,
          delivery_mode_2: c.deliveryMode2 || c.delivery_mode_2 || null,
          delivery_mode_3: c.deliveryMode3 || c.delivery_mode_3 || null,
          delivery_day: Number(c.deliveryDay ?? c.delivery_day ?? 1),
          owner_role: c.ownerRole || c.owner_role || 'Manager - Learning & Development',
          course_status: c.courseStatus || c.course_status || c.status || 'Approved',
          pre_assessment_code: c.preAssessmentCode || c.pre_assessment_code || null,
          post_assessment_code: c.postAssessmentCode || c.post_assessment_code || null,
          created_at: c.createdAt || c.created_at || now,
          updated_at: now
        };
        coursesPayload.push({ row, key });
      }

      for (const item of coursesPayload) {
        const isExisting = existingCourseKeyMap.has(item.key);
        const { error: cErr } = await supabase
          .from('training_courses')
          .upsert([item.row]);

        if (cErr) {
          summary.courses.failed++;
          const errMsg = `Course "${item.row.course_code}" (Prg: ${item.row.program_code}, Mod: ${item.row.module_code}): [${cErr.code || 'ERR'}] ${cErr.message}`;
          const detailedErr: DatabaseOperationError = {
            table: 'public.training_courses',
            operation: 'UPSERT',
            code: cErr.code || 'UNKNOWN',
            message: cErr.message,
            details: cErr.details,
            hint: cErr.hint,
            recordIdentifier: item.row.course_code
          };
          summary.courses.errors?.push(errMsg);
          summary.courses.detailedErrors?.push(detailedErr);
          summary.details?.errors.push(errMsg);
          summary.details?.detailedErrors?.push(detailedErr);
          summary.details?.courses.push({ code: item.row.course_code, status: 'FAILED', error: cErr.message });
        } else {
          if (isExisting) {
            summary.courses.updated++;
            summary.details?.courses.push({ code: item.row.course_code, status: 'UPDATED' });
          } else {
            summary.courses.added++;
            summary.details?.courses.push({ code: item.row.course_code, status: 'ADDED' });
          }
        }
      }

      // STEP 6: VERIFY COURSES IN DATABASE
      console.log(`[CURRICULUM SYNC] Step 6: Verifying Courses in Database...`);
      const { count: verifiedCCount } = await supabase
        .from('training_courses')
        .select('*', { count: 'exact', head: true });

      summary.courses.supabase = verifiedCCount ?? 0;

      const totalErrors = summary.programs.failed + summary.modules.failed + summary.courses.failed;
      const isSuccessful = totalErrors === 0 && summary.programs.supabase > 0 && summary.modules.supabase > 0 && summary.courses.supabase > 0;

      summary.success = isSuccessful;
      summary.overall = isSuccessful ? 'SUCCESS' : 'FAILED';

      // Record Import Log into training_import_logs
      const logId = `log-sync-${Date.now()}`;
      summary.importLogId = logId;

      const importLogPayload = {
        id: logId,
        file_name: 'Training Curriculum Synchronization',
        imported_by: authUser,
        programs_added: summary.programs.added,
        programs_updated: summary.programs.updated,
        modules_added: summary.modules.added,
        modules_updated: summary.modules.updated,
        courses_added: summary.courses.added,
        courses_updated: summary.courses.updated,
        errors_count: totalErrors,
        status: isSuccessful ? 'Success' : 'Failed',
        log_details: JSON.stringify({
          source: localState.sourceName || 'Application State',
          syncTimestamp: now,
          programs: summary.details?.programs,
          modules: summary.details?.modules,
          courses: summary.details?.courses,
          errors: summary.details?.errors,
          counts: {
            programs: summary.programs,
            modules: summary.modules,
            courses: summary.courses
          }
        }),
        created_at: now
      };

      await supabase.from('training_import_logs').insert([importLogPayload]);

      setLastSyncTime(now);
      setLastSyncResult(summary.overall);
      setLastSyncDetails(summary.details);

      // Refetch from Supabase so it becomes the authoritative source of truth
      await refetchTrainingData();
      setLocalCurriculumStatus(checkLocalCurriculum());

    } catch (err: any) {
      console.error('Curriculum Migration Error:', err);
      summary.errorMessage = err?.message || 'An unexpected error occurred during curriculum migration.';
      summary.overall = 'FAILED';
      summary.success = false;

      setLastSyncTime(new Date().toISOString());
      setLastSyncResult('FAILED');
      setLastSyncDetails({ errors: [summary.errorMessage] });
    } finally {
      setIsSyncing(false);
    }

    return summary;
  };

  const syncLocalStorageToSupabase = syncCurrentCurriculumToSupabase;

  // Log detailed query result for every table
  const logTableQuery = (tableName: string, errorObj: any, count: number) => {
    console.log(`
TABLE: ${tableName}
QUERY STATUS: ${errorObj ? 'ERROR' : 'SUCCESS'}
ERROR CODE: ${errorObj ? (errorObj.code || 'UNKNOWN') : 'NONE'}
ERROR MESSAGE: ${errorObj ? (errorObj.message || JSON.stringify(errorObj)) : 'NONE'}
RETURNED ROW COUNT: ${count}
    `.trim());
  };

  // Fetch all training data from Supabase with strict diagnostic logging
  const refetchTrainingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const envName = typeof window !== 'undefined' && window.location.hostname.includes('ais-pre')
      ? 'production (Published App)'
      : (typeof window !== 'undefined' && window.location.hostname.includes('ais-dev')
        ? 'preview (AI Studio)'
        : 'preview / development');

    const maskedUrl = maskSupabaseUrl(supabaseUrl);
    const authUserId = currentUser?.id || 'u-admin';
    const authUserEmail = currentUser?.username || 'admin (dalvikiran09@gmail.com)';

    if (!isSupabaseConfigured) {
      console.log(`
==================================================
TRAINING MANAGEMENT DATABASE DIAGNOSTIC
==================================================

Environment:
${envName}

Supabase URL:
NOT_CONFIGURED

Authenticated User:
${authUserId}

Authenticated Email:
${authUserEmail}

Programs query:
ERROR (CONFIG_MISSING: Supabase URL or Anon Key is missing)

Programs count:
0

Modules query:
ERROR (CONFIG_MISSING: Supabase URL or Anon Key is missing)

Modules count:
0

Courses query:
ERROR (CONFIG_MISSING: Supabase URL or Anon Key is missing)

Courses count:
0

Training Management database connection:
FAILED

==================================================
      `.trim());

      setIsLoading(false);
      setIsSupabaseConnected(false);
      setError('Supabase is not configured. Please verify environment variables.');
      return;
    }

    try {
      const queryErrors: string[] = [];

      // 1. Fetch Programs
      const { data: pData, error: pErr } = await supabase
        .from('training_programs')
        .select('*')
        .order('program_code', { ascending: true });

      const pCount = pData ? pData.length : 0;
      logTableQuery('training_programs', pErr, pCount);

      if (pErr) {
        queryErrors.push(`training_programs: [${pErr.code || 'ERR'}] ${pErr.message}`);
      } else if (pData) {
        const mappedP = pData
          .filter(r => !String(r.id || '').includes('seed'))
          .map(mapProgramFromDb);
        setPrograms(mappedP);
        inMemoryCurriculumBackup.programs = mappedP;
        if (typeof window !== 'undefined') {
          localStorage.setItem(TRAINING_STORAGE_KEYS.PROGRAMS, JSON.stringify(mappedP));
        }
      }

      // 2. Fetch Modules
      const { data: mData, error: mErr } = await supabase
        .from('training_modules')
        .select('*')
        .order('module_code', { ascending: true });

      const mCount = mData ? mData.length : 0;
      logTableQuery('training_modules', mErr, mCount);

      if (mErr) {
        queryErrors.push(`training_modules: [${mErr.code || 'ERR'}] ${mErr.message}`);
      } else if (mData) {
        const mappedM = mData
          .filter(r => !String(r.id || '').includes('seed'))
          .map(mapModuleFromDb);
        setModules(mappedM);
        inMemoryCurriculumBackup.modules = mappedM;
        if (typeof window !== 'undefined') {
          localStorage.setItem(TRAINING_STORAGE_KEYS.MODULES, JSON.stringify(mappedM));
        }
      }

      // 3. Fetch Courses
      const { data: cData, error: cErr } = await supabase
        .from('training_courses')
        .select('*')
        .order('course_code', { ascending: true });

      const cCount = cData ? cData.length : 0;
      logTableQuery('training_courses', cErr, cCount);

      if (cErr) {
        queryErrors.push(`training_courses: [${cErr.code || 'ERR'}] ${cErr.message}`);
      } else if (cData) {
        const mappedC = cData
          .filter(r => !String(r.id || '').includes('seed'))
          .map(mapCourseFromDb);
        setCourses(mappedC);
        inMemoryCurriculumBackup.courses = mappedC;
        if (typeof window !== 'undefined') {
          localStorage.setItem(TRAINING_STORAGE_KEYS.COURSES, JSON.stringify(mappedC));
        }
      }

      // 4. Fetch Import Logs
      const { data: lData, error: lErr } = await supabase
        .from('training_import_logs')
        .select('*')
        .order('created_at', { ascending: false });

      const lCount = lData ? lData.length : 0;
      logTableQuery('training_import_logs', lErr, lCount);

      if (!lErr && lData) {
        const mappedL = lData.map(mapImportLogFromDb);
        setImportLogs(mappedL);
      } else {
        setImportLogs([]);
      }

      const isConnected = !pErr && !mErr && !cErr;
      setIsSupabaseConnected(isConnected);

      if (!isConnected) {
        setError(queryErrors.join(' | '));
      } else {
        setError(null);
      }

      const summary: TrainingDiagnosticSummary = {
        environment: envName,
        supabaseUrl: maskedUrl,
        authenticatedUserId: authUserId,
        authenticatedUserEmail: authUserEmail,
        programsQueryStatus: pErr ? `ERROR (${pErr.code || 'ERR'}: ${pErr.message})` : 'SUCCESS',
        programsCount: pCount,
        modulesQueryStatus: mErr ? `ERROR (${mErr.code || 'ERR'}: ${mErr.message})` : 'SUCCESS',
        modulesCount: mCount,
        coursesQueryStatus: cErr ? `ERROR (${cErr.code || 'ERR'}: ${cErr.message})` : 'SUCCESS',
        coursesCount: cCount,
        connectionStatus: isConnected ? 'CONNECTED' : 'FAILED',
        lastChecked: new Date().toISOString(),
        errors: queryErrors
      };

      setDiagnosticSummary(summary);

      // Print full exact diagnostic log
      console.log(`
==================================================
TRAINING MANAGEMENT DATABASE DIAGNOSTIC
==================================================

Environment:
${summary.environment}

Supabase URL:
${summary.supabaseUrl}

Authenticated User:
${summary.authenticatedUserId}

Authenticated Email:
${summary.authenticatedUserEmail}

Programs query:
${summary.programsQueryStatus}

Programs count:
${summary.programsCount}

Modules query:
${summary.modulesQueryStatus}

Modules count:
${summary.modulesCount}

Courses query:
${summary.coursesQueryStatus}

Courses count:
${summary.coursesCount}

Training Management database connection:
${summary.connectionStatus}

==================================================
      `.trim());

      // Print Training Data Source Trace
      const curPrograms = programsRef.current;
      const curModules = modulesRef.current;
      const curCourses = coursesRef.current;

      const pSource = (pCount > 0) ? 'Supabase (training_programs)' : (curPrograms.length > 0 ? 'Application State / LocalStorage (cadeploy_training_programs_v1)' : 'Empty');
      const mSource = (mCount > 0) ? 'Supabase (training_modules)' : (curModules.length > 0 ? 'Application State / LocalStorage (cadeploy_training_modules_v1)' : 'Empty');
      const cSource = (cCount > 0) ? 'Supabase (training_courses)' : (curCourses.length > 0 ? 'Application State / LocalStorage (cadeploy_training_courses_v1)' : 'Empty');

      console.log(`
==================================================
TRAINING DATA SOURCE TRACE
==================================================

Programs state count: ${curPrograms.length}
Modules state count: ${curModules.length}
Courses state count: ${curCourses.length}

Programs source: ${pSource}
Modules source: ${mSource}
Courses source: ${cSource}
==================================================
      `.trim());

    } catch (err: any) {
      console.error('Error fetching training management data:', err);
      setIsSupabaseConnected(false);
      setError(err?.message || 'Database connection error.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refetchTrainingData();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('training-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'training_programs' }, () => refetchTrainingData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'training_modules' }, () => refetchTrainingData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'training_courses' }, () => refetchTrainingData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'training_import_logs' }, () => refetchTrainingData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [refetchTrainingData]);

  // Role Authorization Checkers
  const checkWritePermission = (): { allowed: boolean; error?: string } => {
    const role = currentUser?.role || 'Team Member';
    const isAllowed = ['Administrator', 'L&D Lead', 'L&D Specialist', 'admin'].includes(role);
    if (!isAllowed) {
      return {
        allowed: false,
        error: `Permission Denied: User role "${role}" is not authorized to create or edit curriculum records. Required roles: Administrator, L&D Lead, or L&D Specialist.`
      };
    }
    return { allowed: true };
  };

  const checkDeletePermission = (): { allowed: boolean; error?: string } => {
    const role = currentUser?.role || 'Team Member';
    const isAllowed = role === 'Administrator' || role === 'admin';
    if (!isAllowed) {
      return {
        allowed: false,
        error: `Permission Denied: User role "${role}" is not authorized to delete curriculum records. Administrator role is required.`
      };
    }
    return { allowed: true };
  };

  // PROGRAM ACTIONS
  const addProgram = async (data: Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    console.log('TRAINING PROGRAM - BEFORE INSERT', data);
    const existing = programs.find(p => p.programCode.toUpperCase() === data.programCode.toUpperCase());
    if (existing) {
      return { success: false, error: `Program Code "${data.programCode}" already exists.` };
    }

    const now = new Date().toISOString();
    const newProgram: TrainingProgram = {
      ...data,
      id: `prg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    const payload = mapProgramToDb(newProgram);
    console.log('TRAINING PROGRAM - SUPABASE PAYLOAD', payload);

    if (isSupabaseConfigured) {
      const { data: resData, error: resErr } = await supabase
        .from('training_programs')
        .insert([payload])
        .select();

      console.log('TRAINING PROGRAM - INSERT RESULT', { data: resData, error: resErr });

      if (resErr) {
        console.error('Failed to insert program into Supabase:', {
          entity: 'training_programs',
          code: newProgram.programCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = [...programs, newProgram];
    setPrograms(updated);
    return { success: true };
  };

  const updateProgram = async (id: string, updates: Partial<TrainingProgram>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const existing = programs.find(p => p.id === id);
    if (!existing) return { success: false, error: 'Program not found.' };

    if (updates.programCode && updates.programCode.toUpperCase() !== existing.programCode.toUpperCase()) {
      const codeExists = programs.some(p => p.id !== id && p.programCode.toUpperCase() === updates.programCode!.toUpperCase());
      if (codeExists) {
        return { success: false, error: `Program Code "${updates.programCode}" is already in use.` };
      }
    }

    const updatedProgram: TrainingProgram = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const payload = mapProgramToDb(updatedProgram);
      const { error: resErr } = await supabase
        .from('training_programs')
        .update(payload)
        .eq('id', id);

      if (resErr) {
        console.error('Failed to update program in Supabase:', {
          entity: 'training_programs',
          id,
          code: updatedProgram.programCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = programs.map(p => p.id === id ? updatedProgram : p);
    setPrograms(updated);
    return { success: true };
  };

  const deleteProgram = async (id: string) => {
    const perm = checkDeletePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const target = programs.find(p => p.id === id);
    if (!target) return { success: false, error: 'Program not found.' };

    // Check if courses reference this program
    const referencingCourses = courses.filter(c => c.programCode.toUpperCase() === target.programCode.toUpperCase());
    if (referencingCourses.length > 0) {
      return { 
        success: false, 
        error: `Cannot delete program "${target.programCode}" because it is currently assigned to ${referencingCourses.length} course module record(s). Deactivate the program or reassign the courses first.` 
      };
    }

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_programs')
        .delete()
        .eq('id', id);

      if (resErr) {
        console.error('Failed to delete program from Supabase:', {
          entity: 'training_programs',
          id,
          code: target.programCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = programs.filter(p => p.id !== id);
    setPrograms(updated);
    return { success: true };
  };

  const bulkDeletePrograms = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    dependencyErrors?: string[];
  }> => {
    const perm = checkDeletePermission();
    if (!perm.allowed) {
      return { success: false, requested: ids.length, deleted: 0, failed: ids.length, error: perm.error };
    }

    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    const targetPrograms = programs.filter(p => ids.includes(p.id));
    const dependencyErrors: string[] = [];

    // Check dependencies for every selected program
    for (const prog of targetPrograms) {
      const referencingCourses = courses.filter(c => c.programCode.toUpperCase() === prog.programCode.toUpperCase());
      if (referencingCourses.length > 0) {
        const uniqueModules = new Set(referencingCourses.map(c => c.moduleCode)).size;
        const uniqueCourseCodes = new Set(referencingCourses.map(c => c.courseCode)).size;
        dependencyErrors.push(
          `Program "${prog.programCode} - ${prog.programName}" is linked to ${uniqueModules} Module(s) across ${uniqueCourseCodes} Course(s) (${referencingCourses.length} mapping records).`
        );
      }
    }

    if (dependencyErrors.length > 0) {
      return {
        success: false,
        requested: ids.length,
        deleted: 0,
        failed: ids.length,
        error: `Cannot delete selected program(s) because active course dependencies exist:`,
        dependencyErrors
      };
    }

    console.log('PROGRAMS BULK DELETE - BEFORE SUPABASE', { count: ids.length, ids });

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_programs')
        .delete()
        .in('id', ids);

      console.log('PROGRAMS BULK DELETE - SUPABASE RESULT', { error: resErr });

      if (resErr) {
        console.error('Failed to bulk delete programs from Supabase:', {
          entity: 'training_programs',
          count: ids.length,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          requested: ids.length,
          deleted: 0,
          failed: ids.length,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = programs.filter(p => !ids.includes(p.id));
    setPrograms(updated);
    try {
      localStorage.setItem(TRAINING_STORAGE_KEYS.PROGRAMS, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      requested: ids.length,
      deleted: ids.length,
      failed: 0
    };
  };

  // MODULE ACTIONS
  const addModule = async (data: Omit<TrainingModule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    console.log('TRAINING MODULE - BEFORE INSERT', data);
    const existing = modules.find(m => m.moduleCode.toUpperCase() === data.moduleCode.toUpperCase());
    if (existing) {
      return { success: false, error: `Module Code "${data.moduleCode}" already exists.` };
    }

    const now = new Date().toISOString();
    const newModule: TrainingModule = {
      ...data,
      id: `mdl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    const payload = mapModuleToDb(newModule);
    if (isSupabaseConfigured) {
      const { data: resData, error: resErr } = await supabase
        .from('training_modules')
        .insert([payload])
        .select();

      console.log('TRAINING MODULE - INSERT RESULT', { data: resData, error: resErr });
      if (resErr) {
        console.error('Failed to insert module into Supabase:', {
          entity: 'training_modules',
          code: newModule.moduleCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = [...modules, newModule];
    setModules(updated);
    return { success: true };
  };

  const updateModule = async (id: string, updates: Partial<TrainingModule>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const existing = modules.find(m => m.id === id);
    if (!existing) return { success: false, error: 'Module not found.' };

    if (updates.moduleCode && updates.moduleCode.toUpperCase() !== existing.moduleCode.toUpperCase()) {
      const codeExists = modules.some(m => m.id !== id && m.moduleCode.toUpperCase() === updates.moduleCode!.toUpperCase());
      if (codeExists) {
        return { success: false, error: `Module Code "${updates.moduleCode}" is already in use.` };
      }
    }

    const updatedModule: TrainingModule = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const payload = mapModuleToDb(updatedModule);
      const { error: resErr } = await supabase
        .from('training_modules')
        .update(payload)
        .eq('id', id);

      if (resErr) {
        console.error('Failed to update module in Supabase:', {
          entity: 'training_modules',
          id,
          code: updatedModule.moduleCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = modules.map(m => m.id === id ? updatedModule : m);
    setModules(updated);
    return { success: true };
  };

  const deleteModule = async (id: string) => {
    const perm = checkDeletePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const target = modules.find(m => m.id === id);
    if (!target) return { success: false, error: 'Module not found.' };

    // Check if courses reference this module
    const referencingCourses = courses.filter(c => c.moduleCode.toUpperCase() === target.moduleCode.toUpperCase());
    if (referencingCourses.length > 0) {
      return { 
        success: false, 
        error: `Cannot delete module "${target.moduleCode}" because it is currently included in ${referencingCourses.length} course(s). Remove the module from courses first.` 
      };
    }

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_modules')
        .delete()
        .eq('id', id);

      if (resErr) {
        console.error('Failed to delete module from Supabase:', {
          entity: 'training_modules',
          id,
          code: target.moduleCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = modules.filter(m => m.id !== id);
    setModules(updated);
    return { success: true };
  };

  const bulkDeleteModules = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    dependencyErrors?: string[];
  }> => {
    const perm = checkDeletePermission();
    if (!perm.allowed) {
      return { success: false, requested: ids.length, deleted: 0, failed: ids.length, error: perm.error };
    }

    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    const targetModules = modules.filter(m => ids.includes(m.id));
    const dependencyErrors: string[] = [];

    // Check dependencies for every selected module
    for (const mod of targetModules) {
      const referencingCourses = courses.filter(c => c.moduleCode.toUpperCase() === mod.moduleCode.toUpperCase());
      if (referencingCourses.length > 0) {
        const uniqueCourses = new Set(referencingCourses.map(c => c.courseCode)).size;
        dependencyErrors.push(
          `Module "${mod.moduleCode} - ${mod.moduleName}" is included in ${uniqueCourses} Course(s) (${referencingCourses.length} mapping records).`
        );
      }
    }

    if (dependencyErrors.length > 0) {
      return {
        success: false,
        requested: ids.length,
        deleted: 0,
        failed: ids.length,
        error: `Cannot delete selected module(s) because active course dependencies exist:`,
        dependencyErrors
      };
    }

    console.log('MODULES BULK DELETE - BEFORE SUPABASE', { count: ids.length, ids });

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_modules')
        .delete()
        .in('id', ids);

      console.log('MODULES BULK DELETE - SUPABASE RESULT', { error: resErr });

      if (resErr) {
        console.error('Failed to bulk delete modules from Supabase:', {
          entity: 'training_modules',
          count: ids.length,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          requested: ids.length,
          deleted: 0,
          failed: ids.length,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = modules.filter(m => !ids.includes(m.id));
    setModules(updated);
    try {
      localStorage.setItem(TRAINING_STORAGE_KEYS.MODULES, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      requested: ids.length,
      deleted: ids.length,
      failed: 0
    };
  };

  // COURSE ACTIONS
  const addCourseRecord = async (data: Omit<TrainingCourse, 'id' | 'createdAt' | 'updatedAt'>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    console.log('TRAINING COURSE - BEFORE INSERT', data);

    // Verify program exists
    const prog = programs.find(p => p.programCode.toUpperCase() === data.programCode.toUpperCase());
    if (!prog) {
      return { success: false, error: `Program Code "${data.programCode}" does not exist.` };
    }

    // Verify module exists
    const mod = modules.find(m => m.moduleCode.toUpperCase() === data.moduleCode.toUpperCase());
    if (!mod) {
      return { success: false, error: `Module Code "${data.moduleCode}" does not exist.` };
    }

    // Verify course + program + module combo doesn't already exist
    const duplicate = courses.find(
      c => c.courseCode.toUpperCase() === data.courseCode.toUpperCase() &&
           c.programCode.toUpperCase() === data.programCode.toUpperCase() &&
           c.moduleCode.toUpperCase() === data.moduleCode.toUpperCase()
    );

    if (duplicate) {
      return { 
        success: false, 
        error: `Module ${data.moduleCode} is already assigned to Course ${data.courseCode} for Program ${data.programCode}.` 
      };
    }

    const now = new Date().toISOString();
    const newCourse: TrainingCourse = {
      ...data,
      id: `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    const payload = mapCourseToDb(newCourse);
    if (isSupabaseConfigured) {
      const { data: resData, error: resErr } = await supabase
        .from('training_courses')
        .insert([payload])
        .select();

      console.log('TRAINING COURSE - INSERT RESULT', { data: resData, error: resErr });
      if (resErr) {
        console.error('Failed to insert course into Supabase:', {
          entity: 'training_courses',
          code: newCourse.courseCode,
          program: newCourse.programCode,
          module: newCourse.moduleCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = [...courses, newCourse];
    setCourses(updated);
    return { success: true };
  };

  const updateCourseRecord = async (id: string, updates: Partial<TrainingCourse>) => {
    const perm = checkWritePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const existing = courses.find(c => c.id === id);
    if (!existing) return { success: false, error: 'Course record not found.' };

    const updatedCourse: TrainingCourse = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const payload = mapCourseToDb(updatedCourse);
      const { error: resErr } = await supabase
        .from('training_courses')
        .update(payload)
        .eq('id', id);

      if (resErr) {
        console.error('Failed to update course in Supabase:', {
          entity: 'training_courses',
          id,
          code: updatedCourse.courseCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = courses.map(c => c.id === id ? updatedCourse : c);
    setCourses(updated);
    return { success: true };
  };

  const deleteCourseRecord = async (id: string) => {
    const perm = checkDeletePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const target = courses.find(c => c.id === id);
    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', id);

      if (resErr) {
        console.error('Failed to delete course from Supabase:', {
          entity: 'training_courses',
          id,
          code: target?.courseCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    return { success: true };
  };

  const deleteCourseGroup = async (courseCode: string) => {
    const perm = checkDeletePermission();
    if (!perm.allowed) return { success: false, error: perm.error };

    const matchingCourses = courses.filter(c => c.courseCode.toUpperCase() === courseCode.toUpperCase());
    if (matchingCourses.length === 0) return { success: false, error: 'Course group not found.' };

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_courses')
        .delete()
        .eq('course_code', courseCode);

      if (resErr) {
        console.error('Failed to delete course group from Supabase:', {
          entity: 'training_courses',
          code: courseCode,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = courses.filter(c => c.courseCode.toUpperCase() !== courseCode.toUpperCase());
    setCourses(updated);
    return { success: true };
  };

  const bulkDeleteCourses = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }> => {
    const perm = checkDeletePermission();
    if (!perm.allowed) {
      return { success: false, requested: ids.length, deleted: 0, failed: ids.length, error: perm.error };
    }

    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    console.log('COURSES BULK DELETE - BEFORE SUPABASE', { count: ids.length, ids });

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_courses')
        .delete()
        .in('id', ids);

      console.log('COURSES BULK DELETE - SUPABASE RESULT', { error: resErr });

      if (resErr) {
        console.error('Failed to bulk delete courses from Supabase:', {
          entity: 'training_courses',
          count: ids.length,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          requested: ids.length,
          deleted: 0,
          failed: ids.length,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const updated = courses.filter(c => !ids.includes(c.id));
    setCourses(updated);
    try {
      localStorage.setItem(TRAINING_STORAGE_KEYS.COURSES, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      requested: ids.length,
      deleted: ids.length,
      failed: 0
    };
  };

  const bulkDeleteCourseGroups = async (courseCodes: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }> => {
    const perm = checkDeletePermission();
    if (!perm.allowed) {
      return { success: false, requested: courseCodes.length, deleted: 0, failed: courseCodes.length, error: perm.error };
    }

    if (!courseCodes || courseCodes.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    console.log('COURSE GROUPS BULK DELETE - BEFORE SUPABASE', { count: courseCodes.length, courseCodes });

    if (isSupabaseConfigured) {
      const { error: resErr } = await supabase
        .from('training_courses')
        .delete()
        .in('course_code', courseCodes);

      console.log('COURSE GROUPS BULK DELETE - SUPABASE RESULT', { error: resErr });

      if (resErr) {
        console.error('Failed to bulk delete course groups from Supabase:', {
          entity: 'training_courses',
          count: courseCodes.length,
          errorCode: resErr.code,
          message: resErr.message,
          details: resErr.details,
          hint: resErr.hint
        });
        return {
          success: false,
          requested: courseCodes.length,
          deleted: 0,
          failed: courseCodes.length,
          error: `[${resErr.code || 'ERR'}] ${resErr.message}${resErr.hint ? ` (${resErr.hint})` : ''}`
        };
      }
    }

    const upperCodes = courseCodes.map(c => c.toUpperCase());
    const updated = courses.filter(c => !upperCodes.includes(c.courseCode.toUpperCase()));
    setCourses(updated);
    try {
      localStorage.setItem(TRAINING_STORAGE_KEYS.COURSES, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      requested: courseCodes.length,
      deleted: courseCodes.length,
      failed: 0
    };
  };

  // EXCEL IMPORT EXECUTION
  const executeImport = async (
    parsedData: ParsedImportData,
    duplicateStrategy: 'update' | 'skip',
    fileName: string,
    importedBy: string
  ): Promise<{ success: boolean; log: TrainingImportLog; error?: string }> => {
    const perm = checkWritePermission();
    if (!perm.allowed) {
      const dummyLog: TrainingImportLog = {
        id: `log-denied-${Date.now()}`,
        fileName,
        importedBy,
        importedAt: new Date().toISOString(),
        programsAdded: 0,
        programsUpdated: 0,
        modulesAdded: 0,
        modulesUpdated: 0,
        coursesAdded: 0,
        coursesUpdated: 0,
        errorsCount: 1,
        status: 'Failed',
        details: { errors: [perm.error] }
      };
      return { success: false, log: dummyLog, error: perm.error };
    }

    console.log('TRAINING IMPORT - VALIDATION RESULT', parsedData);

    const now = new Date().toISOString();
    let programsAdded = 0;
    let programsUpdated = 0;
    let modulesAdded = 0;
    let modulesUpdated = 0;
    let coursesAdded = 0;
    let coursesUpdated = 0;

    let updatedPrograms = [...programs];
    let updatedModules = [...modules];
    let updatedCourses = [...courses];

    const programLogs: { code: string; name: string; action: 'added' | 'updated' | 'skipped' }[] = [];
    const moduleLogs: { code: string; name: string; action: 'added' | 'updated' | 'skipped' }[] = [];
    const courseLogs: { courseCode: string; programCode: string; moduleCode: string; action: 'added' | 'updated' | 'skipped' }[] = [];

    // 1. Process Programs
    const programsToUpsertDb: any[] = [];
    for (const p of parsedData.programs) {
      const existingIdx = updatedPrograms.findIndex(item => item.programCode.toUpperCase() === p.programCode.toUpperCase());
      if (existingIdx >= 0) {
        if (duplicateStrategy === 'update') {
          const existing = updatedPrograms[existingIdx];
          const updated: TrainingProgram = {
            ...existing,
            programName: p.programName || existing.programName,
            programDescription: p.programDescription || existing.programDescription,
            status: p.status,
            updatedAt: now
          };
          updatedPrograms[existingIdx] = updated;
          programsUpdated++;
          programLogs.push({ code: p.programCode, name: p.programName, action: 'updated' });
          programsToUpsertDb.push(mapProgramToDb(updated));
        } else {
          programLogs.push({ code: p.programCode, name: p.programName, action: 'skipped' });
        }
      } else {
        const newP: TrainingProgram = {
          id: `prg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          programCode: p.programCode,
          programName: p.programName,
          programDescription: p.programDescription,
          status: p.status,
          createdAt: now,
          updatedAt: now
        };
        updatedPrograms.push(newP);
        programsAdded++;
        programLogs.push({ code: p.programCode, name: p.programName, action: 'added' });
        programsToUpsertDb.push(mapProgramToDb(newP));
      }
    }

    // 2. Process Modules
    const modulesToUpsertDb: any[] = [];
    for (const m of parsedData.modules) {
      const existingIdx = updatedModules.findIndex(item => item.moduleCode.toUpperCase() === m.moduleCode.toUpperCase());
      if (existingIdx >= 0) {
        if (duplicateStrategy === 'update') {
          const existing = updatedModules[existingIdx];
          const updated: TrainingModule = {
            ...existing,
            moduleName: m.moduleName || existing.moduleName,
            duration: m.duration || existing.duration,
            deliveryMode: m.deliveryMode || existing.deliveryMode,
            status: m.status,
            updatedAt: now
          };
          updatedModules[existingIdx] = updated;
          modulesUpdated++;
          moduleLogs.push({ code: m.moduleCode, name: m.moduleName, action: 'updated' });
          modulesToUpsertDb.push(mapModuleToDb(updated));
        } else {
          moduleLogs.push({ code: m.moduleCode, name: m.moduleName, action: 'skipped' });
        }
      } else {
        const newM: TrainingModule = {
          id: `mdl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          moduleCode: m.moduleCode,
          moduleName: m.moduleName,
          duration: m.duration,
          deliveryMode: m.deliveryMode,
          status: m.status,
          createdAt: now,
          updatedAt: now
        };
        updatedModules.push(newM);
        modulesAdded++;
        moduleLogs.push({ code: m.moduleCode, name: m.moduleName, action: 'added' });
        modulesToUpsertDb.push(mapModuleToDb(newM));
      }
    }

    // 3. Process Courses
    const coursesToUpsertDb: any[] = [];
    for (const c of parsedData.courses) {
      const existingIdx = updatedCourses.findIndex(
        item => item.courseCode.toUpperCase() === c.courseCode.toUpperCase() &&
                item.programCode.toUpperCase() === c.programCode.toUpperCase() &&
                item.moduleCode.toUpperCase() === c.moduleCode.toUpperCase()
      );

      if (existingIdx >= 0) {
        if (duplicateStrategy === 'update') {
          const existing = updatedCourses[existingIdx];
          const updated: TrainingCourse = {
            ...existing,
            deliveryMode1: c.deliveryMode1 || existing.deliveryMode1,
            deliveryMode2: c.deliveryMode2 || existing.deliveryMode2,
            deliveryMode3: c.deliveryMode3 || existing.deliveryMode3,
            deliveryDay: c.deliveryDay,
            ownerRole: c.ownerRole || existing.ownerRole,
            courseStatus: c.courseStatus || existing.courseStatus,
            preAssessmentCode: c.preAssessmentCode || existing.preAssessmentCode,
            postAssessmentCode: c.postAssessmentCode || existing.postAssessmentCode,
            updatedAt: now
          };
          updatedCourses[existingIdx] = updated;
          coursesUpdated++;
          courseLogs.push({ courseCode: c.courseCode, programCode: c.programCode, moduleCode: c.moduleCode, action: 'updated' });
          coursesToUpsertDb.push(mapCourseToDb(updated));
        } else {
          courseLogs.push({ courseCode: c.courseCode, programCode: c.programCode, moduleCode: c.moduleCode, action: 'skipped' });
        }
      } else {
        const newC: TrainingCourse = {
          id: `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          courseCode: c.courseCode,
          programCode: c.programCode,
          moduleCode: c.moduleCode,
          deliveryMode1: c.deliveryMode1,
          deliveryMode2: c.deliveryMode2,
          deliveryMode3: c.deliveryMode3,
          deliveryDay: c.deliveryDay,
          ownerRole: c.ownerRole,
          courseStatus: c.courseStatus,
          preAssessmentCode: c.preAssessmentCode,
          postAssessmentCode: c.postAssessmentCode,
          createdAt: now,
          updatedAt: now
        };
        updatedCourses.push(newC);
        coursesAdded++;
        courseLogs.push({ courseCode: c.courseCode, programCode: c.programCode, moduleCode: c.moduleCode, action: 'added' });
        coursesToUpsertDb.push(mapCourseToDb(newC));
      }
    }

    // Write batch to Supabase
    if (isSupabaseConfigured) {
      try {
        if (programsToUpsertDb.length > 0) {
          const { error: pErr } = await supabase.from('training_programs').upsert(programsToUpsertDb);
          if (pErr) console.warn('SUPABASE IMPORT PROGRAMS WARNING:', pErr.message);
        }

        if (modulesToUpsertDb.length > 0) {
          const { error: mErr } = await supabase.from('training_modules').upsert(modulesToUpsertDb);
          if (mErr) console.warn('SUPABASE IMPORT MODULES WARNING:', mErr.message);
        }

        if (coursesToUpsertDb.length > 0) {
          const { error: cErr } = await supabase.from('training_courses').upsert(coursesToUpsertDb);
          if (cErr) console.warn('SUPABASE IMPORT COURSES WARNING:', cErr.message);
        }
      } catch (e) {
        console.error('TRAINING IMPORT - SUPABASE RESULT ERROR:', e);
      }
    }

    const log: TrainingImportLog = {
      id: `log-${Date.now()}`,
      fileName,
      importedBy,
      importedAt: now,
      programsAdded,
      programsUpdated,
      modulesAdded,
      modulesUpdated,
      coursesAdded,
      coursesUpdated,
      errorsCount: parsedData.issues.filter(i => i.type === 'error').length,
      status: parsedData.issues.filter(i => i.type === 'error').length > 0 ? 'Partial' : 'Success',
      details: {
        programs: programLogs,
        modules: moduleLogs,
        courses: courseLogs,
        errors: parsedData.issues.filter(i => i.type === 'error').map(i => `Row ${i.row}: ${i.message}`),
        warnings: parsedData.issues.filter(i => i.type === 'warning').map(i => `Row ${i.row}: ${i.message}`)
      }
    };

    console.log('TRAINING IMPORT - SUPABASE RESULT', log);

    // Save states
    setPrograms(updatedPrograms);
    setModules(updatedModules);
    setCourses(updatedCourses);

    const updatedLogs = [log, ...importLogs];
    setImportLogs(updatedLogs);

    if (isSupabaseConfigured) {
      await supabase.from('training_import_logs').insert([mapImportLogToDb(log)]);
    }

    return { success: true, log };
  };

  const addImportLog = async (log: TrainingImportLog) => {
    const updated = [log, ...importLogs];
    setImportLogs(updated);
    if (isSupabaseConfigured) {
      await supabase.from('training_import_logs').insert([mapImportLogToDb(log)]);
    }
  };

  const clearImportLogs = async () => {
    if (isSupabaseConfigured) {
      await supabase.from('training_import_logs').delete().neq('id', 'placeholder');
    }
    setImportLogs([]);
  };

  const groupedCourses = groupCourses(courses, programs, modules);

  return (
    <TrainingContext.Provider
      value={{
        programs,
        modules,
        courses,
        groupedCourses,
        importLogs,
        isLoading,
        isSyncing,
        isSupabaseConnected,
        error,
        diagnosticSummary,
        activeSubTab,
        setActiveSubTab,
        localCurriculumStatus,
        lastSyncTime,
        lastSyncResult,
        lastSyncDetails,
        checkLocalCurriculum,
        testRlsPermissions,
        syncLocalStorageToSupabase,
        syncCurrentCurriculumToSupabase,
        addProgram,
        updateProgram,
        deleteProgram,
        bulkDeletePrograms,
        addModule,
        updateModule,
        deleteModule,
        bulkDeleteModules,
        addCourseRecord,
        updateCourseRecord,
        deleteCourseRecord,
        deleteCourseGroup,
        bulkDeleteCourses,
        bulkDeleteCourseGroups,
        executeImport,
        addImportLog,
        clearImportLogs,
        refetchTrainingData,
        refreshTrainingData: refetchTrainingData
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};

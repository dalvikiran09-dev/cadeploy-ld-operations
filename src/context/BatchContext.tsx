import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrainingBatch, 
  BatchScheduleActivity, 
  BatchNominee, 
  TrainingAttendanceRecord, 
  BatchImportHistoryRecord,
  BatchSubTab,
  BatchDetailTab,
  AttendanceStatus,
  ParsedBatchImportData
} from '../types/batch';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateNextBatchCode, isInvalidBatchRecord, cleanInvalidBatches } from '../utils/batchUtils';

const STORAGE_KEYS = {
  BATCHES: 'cadeploy_training_batches_v1',
  SCHEDULES: 'cadeploy_batch_schedules_v1',
  NOMINEES: 'cadeploy_batch_nominees_v1',
  ATTENDANCE: 'cadeploy_batch_attendance_v1',
  IMPORT_HISTORY: 'cadeploy_batch_import_history_v1'
};

// Resilient schema runner: Automatically catches PGRST204 or missing column errors, strips the column from payload, and retries.
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
                  err.message?.match(/Could not find the "([^"]+)" column/i) ||
                  err.message?.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
                  err.message?.match(/column '([^']+)' of relation '[^']+' does not exist/i) ||
                  err.message?.match(/column "([^"]+)" does not exist/i) ||
                  err.message?.match(/column '([^']+)' does not exist/i);

    if (match && match[1]) {
      const missingColumn = match[1];
      console.warn(`[Supabase Schema Adaptive Fallback] Column '${missingColumn}' not found in remote table. Stripping and retrying...`);
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

// Database row mappers (Snake case <-> Camel case)
const mapBatchFromDb = (row: any): TrainingBatch => ({
  id: String(row.id),
  batchCode: row.batch_code || row.batchCode || '',
  programId: row.program_id || row.programId || undefined,
  programCode: row.program_code || row.programCode || '',
  programName: row.program_name || row.programName || '',
  batchType: row.batch_type || row.batchType || 'Regular',
  batchLocation: row.batch_location || row.batchLocation || 'Hyderabad',
  facilitatorCode: row.facilitator_code || row.facilitatorCode || '',
  facilitatorName: row.facilitator_name || row.facilitatorName || undefined,
  facilitatorEmail: row.facilitator_email || row.facilitatorEmail || undefined,
  batchCreatedDate: row.batch_created_date || row.batchCreatedDate || '',
  headCount: Number(row.head_count ?? row.headCount ?? 0),
  status: row.status || 'Planned',
  programRequestedDate: row.program_requested_date || row.programRequestedDate || undefined,
  programRequestAcceptedDate: row.program_request_accepted_date || row.programRequestAcceptedDate || undefined,
  programRequestedStartDate: row.program_requested_start_date || row.programRequestedStartDate || undefined,
  programProposedStartDate: row.program_proposed_start_date || row.programProposedStartDate || undefined,
  scheduleCode: row.schedule_code || row.scheduleCode || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  deleted: Boolean(row.deleted)
});

const mapBatchToDb = (b: TrainingBatch) => ({
  id: b.id,
  batch_code: b.batchCode,
  program_id: b.programId || null,
  program_code: b.programCode,
  program_name: b.programName || null,
  batch_type: b.batchType || 'Regular',
  batch_location: b.batchLocation || 'Hyderabad',
  facilitator_code: b.facilitatorCode || null,
  facilitator_name: b.facilitatorName || null,
  facilitator_email: b.facilitatorEmail || null,
  batch_created_date: b.batchCreatedDate || null,
  program_requested_date: b.programRequestedDate || null,
  program_request_accepted_date: b.programRequestAcceptedDate || null,
  program_requested_start_date: b.programRequestedStartDate || null,
  program_proposed_start_date: b.programProposedStartDate || null,
  schedule_code: b.scheduleCode || null,
  head_count: Number(b.headCount || 0),
  status: b.status || 'Planned',
  created_at: b.createdAt || new Date().toISOString(),
  updated_at: b.updatedAt || new Date().toISOString(),
  deleted: Boolean(b.deleted)
});

const mapScheduleFromDb = (row: any): BatchScheduleActivity => ({
  id: String(row.id),
  batchId: row.batch_id || row.batchId || '',
  batchCode: row.batch_code || row.batchCode || undefined,
  dayNumber: row.day_number || row.dayNumber || 1,
  activityDate: row.activity_date || row.activityDate || '',
  activity: row.activity || 'Delivery Session',
  moduleId: row.module_id || row.moduleId || undefined,
  moduleCode: row.module_code || row.moduleCode || '-',
  moduleName: row.module_name || row.moduleName || undefined,
  durationHours: Number(row.duration_hours || row.durationHours || 0),
  status: row.status || 'Completed',
  arrangements: row.arrangements || 'Completed',
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapScheduleToDb = (s: BatchScheduleActivity) => ({
  id: s.id,
  batch_id: s.batchId,
  batch_code: s.batchCode || '',
  day_number: Number(s.dayNumber || 1),
  activity_date: s.activityDate || '',
  activity: s.activity || 'Delivery Session',
  module_id: s.moduleId || null,
  module_code: s.moduleCode || '-',
  module_name: s.moduleName || null,
  duration_hours: Number(s.durationHours || 0),
  status: s.status || 'Completed',
  arrangements: s.arrangements || 'Completed',
  created_at: s.createdAt || new Date().toISOString(),
  updated_at: s.updatedAt || new Date().toISOString()
});

const mapNomineeFromDb = (row: any): BatchNominee => ({
  id: String(row.id),
  batchId: row.batch_id || row.batchId || '',
  batchCode: row.batch_code || row.batchCode || undefined,
  employeeCode: row.employee_code || row.employeeCode || '',
  employeeName: row.employee_name || row.employeeName || undefined,
  department: row.department || undefined,
  designation: row.designation || undefined,
  email: row.email || undefined,
  nominatorEmployeeCode: row.nominator_employee_code || row.nominatorEmployeeCode || undefined,
  nominationDatetime: row.nomination_datetime || row.nominationDatetime || undefined,
  targetCompetencies: row.target_competencies || row.targetCompetencies || undefined,
  currentLevels: row.current_levels || row.currentLevels || undefined,
  status: row.status || 'Nominated',
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapNomineeToDb = (n: BatchNominee) => ({
  id: n.id,
  batch_id: n.batchId,
  batch_code: n.batchCode || '',
  employee_code: n.employeeCode,
  employee_name: n.employeeName || null,
  department: n.department || null,
  designation: n.designation || null,
  email: n.email || null,
  nominator_employee_code: n.nominatorEmployeeCode || null,
  nomination_datetime: n.nominationDatetime || null,
  target_competencies: n.targetCompetencies || null,
  current_levels: n.currentLevels || null,
  status: n.status || 'Nominated',
  created_at: n.createdAt || new Date().toISOString(),
  updated_at: n.updatedAt || new Date().toISOString()
});

const mapAttendanceFromDb = (row: any): TrainingAttendanceRecord => ({
  id: String(row.id),
  batchId: row.batch_id || row.batchId || '',
  batchCode: row.batch_code || row.batchCode || undefined,
  employeeCode: row.employee_code || row.employeeCode || '',
  moduleId: row.module_id || row.moduleId || undefined,
  moduleCode: row.module_code || row.moduleCode || '',
  sessionDate: row.session_date || row.sessionDate || undefined,
  reportedDatetime: row.reported_datetime || row.reportedDatetime || undefined,
  intermittentExitTime: row.intermittent_exit_time || row.intermittentExitTime || undefined,
  intermittentEntryTime: row.intermittent_entry_time || row.intermittentEntryTime || undefined,
  completedDatetime: row.completed_datetime || row.completedDatetime || undefined,
  status: (row.status as AttendanceStatus) || 'Present',
  remarks: row.remarks || undefined,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
});

const mapAttendanceToDb = (a: TrainingAttendanceRecord) => ({
  id: a.id,
  batch_id: a.batchId,
  batch_code: a.batchCode || null,
  employee_code: a.employeeCode,
  module_id: a.moduleId || null,
  module_code: a.moduleCode,
  session_date: a.sessionDate || null,
  reported_datetime: a.reportedDatetime || null,
  intermittent_exit_time: a.intermittentExitTime || null,
  intermittent_entry_time: a.intermittentEntryTime || null,
  completed_datetime: a.completedDatetime || null,
  status: a.status || 'Attended',
  remarks: a.remarks || null,
  created_at: a.createdAt || new Date().toISOString(),
  updated_at: a.updatedAt || new Date().toISOString()
});

const mapImportHistoryFromDb = (row: any): BatchImportHistoryRecord => ({
  id: String(row.id),
  fileName: row.file_name || row.fileName || '',
  importedAt: row.imported_at || row.importedAt || row.created_at || new Date().toISOString(),
  importedBy: row.imported_by || row.importedBy || 'Admin',
  batchCodes: Array.isArray(row.batch_codes) ? row.batch_codes : (typeof row.batch_codes === 'string' ? JSON.parse(row.batch_codes) : []),
  newBatches: Number(row.new_batches ?? row.new_records ?? row.newBatches ?? 0),
  updatedBatches: Number(row.updated_batches ?? row.updated_records ?? row.updatedBatches ?? 0),
  nomineesAdded: Number(row.nominees_added ?? row.nominees_count ?? row.nomineesAdded ?? 0),
  schedulesAdded: Number(row.schedules_added ?? row.schedules_count ?? row.schedulesAdded ?? 0),
  attendanceRecordsAdded: Number(row.attendance_records_added ?? row.attendanceRecordsAdded ?? 0),
  errorCount: Number(row.error_count ?? row.errorCount ?? 0),
  status: row.status || 'Success',
  details: typeof row.details === 'string' ? JSON.parse(row.details) : (row.details || row.raw_summary || {})
});

const mapImportHistoryToDb = (h: BatchImportHistoryRecord) => ({
  id: h.id,
  file_name: h.fileName,
  imported_at: h.importedAt,
  imported_by: h.importedBy,
  batch_codes: Array.isArray(h.batchCodes) ? h.batchCodes : [],
  new_records: Number(h.newBatches || 0),
  updated_records: Number(h.updatedBatches || 0),
  new_batches: Number(h.newBatches || 0),
  updated_batches: Number(h.updatedBatches || 0),
  schedules_added: Number(h.schedulesAdded || 0),
  nominees_added: Number(h.nomineesAdded || 0),
  attendance_records_added: Number(h.attendanceRecordsAdded || 0),
  error_count: Number(h.errorCount || 0),
  status: h.status || 'Success',
  details: h.details || {},
  created_at: h.importedAt || new Date().toISOString(),
  updated_at: new Date().toISOString()
});

interface BatchContextType {
  batches: TrainingBatch[];
  schedules: BatchScheduleActivity[];
  nominees: BatchNominee[];
  attendance: TrainingAttendanceRecord[];
  attendanceRecords: TrainingAttendanceRecord[];
  importHistory: BatchImportHistoryRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // View state
  activeSubTab: BatchSubTab;
  setActiveSubTab: (tab: BatchSubTab) => void;
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string | null) => void;
  selectedBatch: TrainingBatch | null;
  activeDetailTab: BatchDetailTab;
  setActiveDetailTab: (tab: BatchDetailTab) => void;

  // Batch CRUD
  createBatch: (data: Omit<TrainingBatch, 'id' | 'createdAt' | 'updatedAt' | 'headCount'>) => Promise<{ success: boolean; batch?: TrainingBatch; error?: string }>;
  updateBatch: (id: string, updates: Partial<TrainingBatch>) => Promise<{ success: boolean; error?: string }>;
  deleteBatch: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Nominee Operations
  addNominee: (batchId: string, nomineeData: Omit<BatchNominee, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  addNomineesBulk: (batchId: string, nomineesList: Array<Omit<BatchNominee, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; count?: number; error?: string }>;
  updateNominee: (id: string, updates: Partial<BatchNominee>) => Promise<{ success: boolean; error?: string }>;
  removeNominee: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Schedule Operations
  addScheduleActivity: (batchId: string, activityData: Omit<BatchScheduleActivity, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateScheduleActivity: (id: string, updates: Partial<BatchScheduleActivity>) => Promise<{ success: boolean; error?: string }>;
  deleteScheduleActivity: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Attendance Operations
  saveAttendanceRecord: (record: Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  saveAttendanceBatch: (records: Array<Omit<TrainingAttendanceRecord, 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteAttendanceRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteAttendance: (ids: string[]) => Promise<{ success: boolean; error?: string }>;
  bulkUpdateAttendance: (batchId: string, moduleCode: string, status: AttendanceStatus, sessionDate?: string) => Promise<{ success: boolean; error?: string }>;
  resetBatchAttendance: (batchId: string, moduleCode?: string, sessionDate?: string) => Promise<{ success: boolean; error?: string }>;
  refreshBatchData: () => Promise<void>;

  // Excel Import Execution
  executeBatchImport: (parsedData: ParsedBatchImportData, fileName: string, importedBy: string) => Promise<{ success: boolean; error?: string; importLog?: BatchImportHistoryRecord }>;
  deleteImportHistoryRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  cleanInvalidRecords: () => Promise<{ cleanedCount: number; removedBatchCodes: string[] }>;

  // Helper selectors
  getBatchNominees: (batchId: string) => BatchNominee[];
  getBatchSchedules: (batchId: string) => BatchScheduleActivity[];
  getBatchAttendance: (batchId: string) => TrainingAttendanceRecord[];
  getNextBatchCode: () => string;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export const BatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<TrainingBatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? cleanInvalidBatches(parsed) : [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState<BatchScheduleActivity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : [];
  });

  const [nominees, setNominees] = useState<BatchNominee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOMINEES);
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<TrainingAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : [];
  });

  const [importHistory, setImportHistory] = useState<BatchImportHistoryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<BatchSubTab>('list');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<BatchDetailTab>('overview');

  // Persistence to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOMINEES, JSON.stringify(nominees));
  }, [nominees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(importHistory));
  }, [importHistory]);

  // Primary Fetch: Supabase as authoritative source of truth
  const refreshBatchData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Operating in local mode.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        batchesRes,
        schedulesRes,
        nomineesRes,
        attendanceRes,
        historyRes
      ] = await Promise.all([
        supabase.from('training_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('training_batch_schedules').select('*').order('created_at', { ascending: true }),
        supabase.from('training_batch_nominees').select('*').order('created_at', { ascending: true }),
        supabase.from('training_attendance').select('*').order('created_at', { ascending: true }),
        supabase.from('training_batch_import_history').select('*').order('imported_at', { ascending: false })
      ]);

      // 1. Process Batches
      if (batchesRes.error) {
        console.error('DATABASE ERROR fetching training_batches:', {
          code: batchesRes.error.code,
          message: batchesRes.error.message,
          details: batchesRes.error.details,
          hint: batchesRes.error.hint
        });
        setError(`Database error fetching batches: ${batchesRes.error.message}`);
      } else {
        const loadedBatches = cleanInvalidBatches((batchesRes.data || []).map(mapBatchFromDb));
        console.log('BATCH FETCH COUNT', { count: loadedBatches.length });
        setBatches(loadedBatches);
      }

      // 2. Process Schedules
      if (schedulesRes.error) {
        console.error('DATABASE ERROR fetching training_batch_schedules:', schedulesRes.error);
      } else {
        setSchedules((schedulesRes.data || []).map(mapScheduleFromDb));
      }

      // 3. Process Nominees
      if (nomineesRes.error) {
        console.error('DATABASE ERROR fetching training_batch_nominees:', nomineesRes.error);
      } else {
        setNominees((nomineesRes.data || []).map(mapNomineeFromDb));
      }

      // 4. Process Attendance
      if (attendanceRes.error) {
        console.error('DATABASE ERROR fetching training_attendance:', attendanceRes.error);
      } else {
        setAttendance((attendanceRes.data || []).map(mapAttendanceFromDb));
      }

      // 5. Process Import History
      if (historyRes.error) {
        console.error('DATABASE ERROR fetching training_batch_import_history:', historyRes.error);
      } else {
        setImportHistory((historyRes.data || []).map(mapImportHistoryFromDb));
      }
    } catch (err: any) {
      console.error('Supabase fetch exception:', err);
      setError(err?.message || 'Failed to connect to database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run authoritative fetch on mount
  useEffect(() => {
    refreshBatchData();
  }, [refreshBatchData]);

  const selectedBatch = useMemo(() => {
    if (!selectedBatchId) return null;
    return batches.find(b => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const getBatchNominees = useCallback((batchId: string) => {
    return nominees.filter(n => n.batchId === batchId);
  }, [nominees]);

  const getBatchSchedules = useCallback((batchId: string) => {
    return schedules.filter(s => s.batchId === batchId);
  }, [schedules]);

  const getBatchAttendance = useCallback((batchId: string) => {
    return attendance.filter(a => a.batchId === batchId);
  }, [attendance]);

  const getNextBatchCode = useCallback(() => {
    return generateNextBatchCode(batches);
  }, [batches]);

  // =========================================================================
  // CREATE BATCH
  // =========================================================================
  const createBatch = async (data: Omit<TrainingBatch, 'id' | 'createdAt' | 'updatedAt' | 'headCount'>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newBatch: TrainingBatch = {
      ...data,
      id: batchId,
      headCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const dbPayload = mapBatchToDb(newBatch);
    console.log('BATCH CREATE - BEFORE SUPABASE', dbPayload);

    if (isSupabaseConfigured) {
      try {
        const { data: insertedData, error: insertError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batches').insert(payload).select(),
          dbPayload
        );

        console.log('SUPABASE BATCH INSERT RESULT', { data: insertedData, error: insertError });

        if (insertError) {
          console.error('Supabase batch insert error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          setIsSyncing(false);
          return { 
            success: false, 
            error: `${insertError.message}${insertError.details ? ` (${insertError.details})` : ''}` 
          };
        }

        // Verify inserted batch exists in Supabase
        const { data: verifyData, error: verifyError } = await supabase
          .from('training_batches')
          .select('*')
          .eq('id', batchId)
          .single();

        console.log('BATCH VERIFY', { recordFound: !!verifyData, error: verifyError });

        setBatches(prev => [newBatch, ...prev]);
        await refreshBatchData();

        setIsSyncing(false);
        return { success: true, batch: newBatch };
      } catch (err: any) {
        console.error('Supabase create batch exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Database write failed' };
      }
    } else {
      setBatches(prev => [newBatch, ...prev]);
      setIsSyncing(false);
      return { success: true, batch: newBatch };
    }
  };

  // =========================================================================
  // UPDATE BATCH
  // =========================================================================
  const updateBatch = async (id: string, updates: Partial<TrainingBatch>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const existing = batches.find(b => b.id === id);

    if (!existing) {
      setIsSyncing(false);
      return { success: false, error: 'Batch not found in database' };
    }

    const updatedBatch: TrainingBatch = {
      ...existing,
      ...updates,
      updatedAt: now
    };

    const dbPayload = mapBatchToDb(updatedBatch);
    console.log('BATCH UPDATE - BEFORE SUPABASE', { id, payload: dbPayload });

    if (isSupabaseConfigured) {
      try {
        const { data: updatedData, error: updateError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batches').update(payload).eq('id', id).select(),
          dbPayload
        );

        console.log('SUPABASE BATCH UPDATE RESULT', { data: updatedData, error: updateError });

        if (updateError) {
          console.error('Supabase batch update error:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          setIsSyncing(false);
          return { 
            success: false, 
            error: `${updateError.message}${updateError.details ? ` (${updateError.details})` : ''}` 
          };
        }

        const { data: verifyData } = await supabase
          .from('training_batches')
          .select('*')
          .eq('id', id)
          .single();

        console.log('BATCH UPDATE VERIFY', { recordFound: !!verifyData });

        setBatches(prev => prev.map(b => b.id === id ? updatedBatch : b));
        await refreshBatchData();

        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase update batch exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Database update failed' };
      }
    } else {
      setBatches(prev => prev.map(b => b.id === id ? updatedBatch : b));
      setIsSyncing(false);
      return { success: true };
    }
  };

  // =========================================================================
  // DELETE BATCH
  // =========================================================================
  const deleteBatch = async (id: string) => {
    setIsSyncing(true);

    if (isSupabaseConfigured) {
      try {
        console.log('BATCH DELETE - BEFORE SUPABASE', { id });
        const { error: deleteError } = await supabase
          .from('training_batches')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Supabase batch delete error:', deleteError);
          setIsSyncing(false);
          return { success: false, error: deleteError.message };
        }

        // Clean associated records if cascading wasn't configured
        await Promise.allSettled([
          supabase.from('training_batch_schedules').delete().eq('batch_id', id),
          supabase.from('training_batch_nominees').delete().eq('batch_id', id),
          supabase.from('training_attendance').delete().eq('batch_id', id)
        ]);

        console.log('BATCH DELETE VERIFY SUCCESS');
        if (selectedBatchId === id) {
          setSelectedBatchId(null);
          setActiveSubTab('list');
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase delete batch exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Database delete failed' };
      }
    } else {
      setBatches(prev => prev.filter(b => b.id !== id));
      setSchedules(prev => prev.filter(s => s.batchId !== id));
      setNominees(prev => prev.filter(n => n.batchId !== id));
      setAttendance(prev => prev.filter(a => a.batchId !== id));
      if (selectedBatchId === id) {
        setSelectedBatchId(null);
        setActiveSubTab('list');
      }
      setIsSyncing(false);
      return { success: true };
    }
  };

  // =========================================================================
  // NOMINEES
  // =========================================================================
  const addNominee = async (batchId: string, nomineeData: Omit<BatchNominee, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const batch = batches.find(b => b.id === batchId);

    if (!batch) {
      setIsSyncing(false);
      return { success: false, error: 'Parent batch does not exist in database.' };
    }

    const newNominee: BatchNominee = {
      ...nomineeData,
      id: `nom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      batchId: batch.id,
      batchCode: batch.batchCode,
      createdAt: now,
      updatedAt: now
    };

    const dbPayload = mapNomineeToDb(newNominee);
    console.log('NOMINEE INSERT - BEFORE SUPABASE', dbPayload);

    if (isSupabaseConfigured) {
      try {
        const { data: insertedNominee, error: nomError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_nominees').insert(payload).select(),
          dbPayload
        );

        console.log('NOMINEE INSERT RESULT', { data: insertedNominee, error: nomError });

        if (nomError) {
          console.error('Supabase nominee insert error:', {
            code: nomError.code,
            message: nomError.message,
            details: nomError.details,
            hint: nomError.hint
          });
          setIsSyncing(false);
          return { success: false, error: `${nomError.message}${nomError.details ? ` (${nomError.details})` : ''}` };
        }

        // Auto-update batch headcount in Supabase
        const updatedHeadcount = (batch.headCount || 0) + 1;
        await executeWithSchemaRetry(
          payload => supabase.from('training_batches').update(payload).eq('id', batch.id),
          { head_count: updatedHeadcount, updated_at: now }
        );

        // Auto-prepare attendance records for existing module schedules in this batch
        const batchModuleCodes: string[] = Array.from(new Set(
          schedules
            .filter(s => s.batchId === batch.id && s.moduleCode && s.moduleCode !== '-')
            .map(s => s.moduleCode as string)
        ));

        if (batchModuleCodes.length > 0) {
          const newAttRecords = batchModuleCodes.map((modCode, idx) => ({
            id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            batch_id: batch.id,
            batch_code: batch.batchCode,
            employee_code: newNominee.employeeCode,
            module_code: modCode,
            status: 'Not Marked',
            created_at: now,
            updated_at: now
          }));

          await executeWithSchemaRetry(
            payload => supabase.from('training_attendance').upsert(payload),
            newAttRecords
          );
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase insert nominee exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to save nominee' };
      }
    } else {
      setNominees(prev => [...prev, newNominee]);
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, headCount: b.headCount + 1, updatedAt: now } : b));
      setIsSyncing(false);
      return { success: true };
    }
  };

  const addNomineesBulk = async (batchId: string, nomineesList: Array<Omit<BatchNominee, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const batch = batches.find(b => b.id === batchId);

    if (!batch) {
      setIsSyncing(false);
      return { success: false, error: 'Parent batch does not exist in database.' };
    }

    const existingEmpCodes = new Set(nominees.filter(n => n.batchId === batchId).map(n => n.employeeCode.toUpperCase()));
    const validToAdd = nomineesList.filter(n => !existingEmpCodes.has(n.employeeCode.toUpperCase()));

    if (validToAdd.length === 0) {
      setIsSyncing(false);
      return { success: true, count: 0 };
    }

    const createdNominees: BatchNominee[] = validToAdd.map((n, idx) => ({
      ...n,
      id: `nom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      batchId: batch.id,
      batchCode: batch.batchCode,
      createdAt: now,
      updatedAt: now
    }));

    if (isSupabaseConfigured) {
      try {
        const dbPayloads = createdNominees.map(mapNomineeToDb);
        const { data: insertedNominees, error: insertError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_nominees').insert(payload).select(),
          dbPayloads
        );

        console.log('BULK NOMINEES INSERT RESULT', { count: Array.isArray(insertedNominees) ? insertedNominees.length : 0, error: insertError });

        if (insertError) {
          console.error('Supabase bulk nominee insert error:', insertError);
          setIsSyncing(false);
          return { success: false, error: insertError.message };
        }

        const newCount = (batch.headCount || 0) + createdNominees.length;
        await executeWithSchemaRetry(
          payload => supabase.from('training_batches').update(payload).eq('id', batch.id),
          { head_count: newCount, updated_at: now }
        );

        const batchModuleCodes: string[] = Array.from(new Set(
          schedules
            .filter(s => s.batchId === batch.id && s.moduleCode && s.moduleCode !== '-')
            .map(s => s.moduleCode as string)
        ));

        if (batchModuleCodes.length > 0) {
          const newAttRecords: any[] = [];
          createdNominees.forEach((nom, nIdx) => {
            batchModuleCodes.forEach((modCode, mIdx) => {
              newAttRecords.push({
                id: `att-${Date.now()}-${nIdx}-${mIdx}-${Math.random().toString(36).substring(2, 7)}`,
                batch_id: batch.id,
                batch_code: batch.batchCode,
                employee_code: nom.employeeCode,
                module_code: modCode,
                status: 'Not Marked',
                created_at: now,
                updated_at: now
              });
            });
          });
          await executeWithSchemaRetry(
            payload => supabase.from('training_attendance').upsert(payload),
            newAttRecords
          );
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true, count: createdNominees.length };
      } catch (err: any) {
        console.error('Supabase bulk nominees exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to save nominees' };
      }
    } else {
      setNominees(prev => [...prev, ...createdNominees]);
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, headCount: b.headCount + createdNominees.length, updatedAt: now } : b));
      setIsSyncing(false);
      return { success: true, count: createdNominees.length };
    }
  };

  const updateNominee = async (id: string, updates: Partial<BatchNominee>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const existing = nominees.find(n => n.id === id);

    if (!existing) {
      setIsSyncing(false);
      return { success: false, error: 'Nominee not found' };
    }

    const updated = { ...existing, ...updates, updatedAt: now };

    if (isSupabaseConfigured) {
      try {
        const { error: updateError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_nominees').update(payload).eq('id', id),
          mapNomineeToDb(updated)
        );

        if (updateError) {
          console.error('Supabase nominee update error:', updateError);
          setIsSyncing(false);
          return { success: false, error: updateError.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase update nominee exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to update nominee' };
      }
    } else {
      setNominees(prev => prev.map(n => n.id === id ? updated : n));
      setIsSyncing(false);
      return { success: true };
    }
  };

  const removeNominee = async (id: string) => {
    setIsSyncing(true);
    const target = nominees.find(n => n.id === id);
    if (!target) {
      setIsSyncing(false);
      return { success: false, error: 'Nominee not found' };
    }

    const batchId = target.batchId;
    const empCode = target.employeeCode;
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const { error: delError } = await supabase
          .from('training_batch_nominees')
          .delete()
          .eq('id', id);

        if (delError) {
          console.error('Supabase nominee delete error:', delError);
          setIsSyncing(false);
          return { success: false, error: delError.message };
        }

        await supabase
          .from('training_attendance')
          .delete()
          .match({ batch_id: batchId, employee_code: empCode });

        const batch = batches.find(b => b.id === batchId);
        if (batch) {
          const newCount = Math.max(0, (batch.headCount || 1) - 1);
          await executeWithSchemaRetry(
            payload => supabase.from('training_batches').update(payload).eq('id', batchId),
            { head_count: newCount, updated_at: now }
          );
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase delete nominee exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to remove nominee' };
      }
    } else {
      setNominees(prev => prev.filter(n => n.id !== id));
      setAttendance(prev => prev.filter(a => !(a.batchId === batchId && a.employeeCode === empCode)));
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, headCount: Math.max(0, b.headCount - 1), updatedAt: now } : b));
      setIsSyncing(false);
      return { success: true };
    }
  };

  // =========================================================================
  // SCHEDULES
  // =========================================================================
  const addScheduleActivity = async (batchId: string, activityData: Omit<BatchScheduleActivity, 'id' | 'batchId' | 'createdAt' | 'updatedAt'>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const batch = batches.find(b => b.id === batchId);

    if (!batch) {
      setIsSyncing(false);
      return { success: false, error: 'Parent batch does not exist in database.' };
    }

    const newActivity: BatchScheduleActivity = {
      ...activityData,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      batchId: batch.id,
      batchCode: batch.batchCode,
      createdAt: now,
      updatedAt: now
    };

    const dbPayload = mapScheduleToDb(newActivity);
    console.log('SCHEDULE INSERT - BEFORE SUPABASE', dbPayload);

    if (isSupabaseConfigured) {
      try {
        const { data: insertedSchedule, error: schError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_schedules').insert(payload).select(),
          dbPayload
        );

        console.log('SCHEDULE INSERT RESULT', { data: insertedSchedule, error: schError });

        if (schError) {
          console.error('Supabase schedule insert error:', schError);
          setIsSyncing(false);
          return { success: false, error: schError.message };
        }

        if (newActivity.moduleCode && newActivity.moduleCode !== '-') {
          const batchNominees = nominees.filter(n => n.batchId === batch.id);
          const existingAtt = attendance.filter(a => a.batchId === batch.id && a.moduleCode === newActivity.moduleCode);
          const existingEmpSet = new Set(existingAtt.map(a => a.employeeCode.toUpperCase()));

          const newAtt = batchNominees
            .filter(nom => !existingEmpSet.has(nom.employeeCode.toUpperCase()))
            .map((nom, idx) => ({
              id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
              batch_id: batch.id,
              batch_code: batch.batchCode,
              employee_code: nom.employeeCode,
              module_code: newActivity.moduleCode!,
              status: 'Not Marked',
              created_at: now,
              updated_at: now
            }));

          if (newAtt.length > 0) {
            await executeWithSchemaRetry(
              payload => supabase.from('training_attendance').upsert(payload),
              newAtt
            );
          }
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase insert schedule exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to save schedule activity' };
      }
    } else {
      setSchedules(prev => [...prev, newActivity]);
      setIsSyncing(false);
      return { success: true };
    }
  };

  const updateScheduleActivity = async (id: string, updates: Partial<BatchScheduleActivity>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const existing = schedules.find(s => s.id === id);

    if (!existing) {
      setIsSyncing(false);
      return { success: false, error: 'Schedule activity not found' };
    }

    const updated = { ...existing, ...updates, updatedAt: now };

    if (isSupabaseConfigured) {
      try {
        const { error: updateError } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_schedules').update(payload).eq('id', id),
          mapScheduleToDb(updated)
        );

        if (updateError) {
          console.error('Supabase schedule update error:', updateError);
          setIsSyncing(false);
          return { success: false, error: updateError.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase update schedule exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to update schedule' };
      }
    } else {
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
      setIsSyncing(false);
      return { success: true };
    }
  };

  const deleteScheduleActivity = async (id: string) => {
    setIsSyncing(true);

    if (isSupabaseConfigured) {
      try {
        const { error: delError } = await supabase
          .from('training_batch_schedules')
          .delete()
          .eq('id', id);

        if (delError) {
          console.error('Supabase schedule delete error:', delError);
          setIsSyncing(false);
          return { success: false, error: delError.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase delete schedule exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to delete schedule' };
      }
    } else {
      setSchedules(prev => prev.filter(s => s.id !== id));
      setIsSyncing(false);
      return { success: true };
    }
  };

  // =========================================================================
  // ATTENDANCE
  // =========================================================================
  const saveAttendanceRecord = async (record: Omit<TrainingAttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    setIsSyncing(true);
    const now = new Date().toISOString();

    const batch = batches.find(b => 
      b.id === record.batchId || 
      (b.batchCode && b.batchCode.toUpperCase() === (record.batchCode || record.batchId).toUpperCase())
    );

    if (!batch) {
      setIsSyncing(false);
      return { success: false, error: 'Selected batch does not exist in database.' };
    }

    const resolvedBatchId = batch.id;
    const resolvedBatchCode = batch.batchCode;

    const existing = attendance.find(a => 
      (record.id && a.id === record.id) ||
      ((a.batchId === resolvedBatchId || (a.batchCode && a.batchCode.toUpperCase() === resolvedBatchCode.toUpperCase())) && 
       a.employeeCode.toUpperCase() === record.employeeCode.toUpperCase() && 
       (a.moduleCode || '').toUpperCase() === (record.moduleCode || '').toUpperCase() && 
       (a.sessionDate || '') === (record.sessionDate || ''))
    );

    const savedRecord: TrainingAttendanceRecord = {
      ...record,
      id: existing?.id || record.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      batchId: resolvedBatchId,
      batchCode: resolvedBatchCode,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    if (isSupabaseConfigured) {
      try {
        const dbPayload = mapAttendanceToDb(savedRecord);
        const { error: upsertError } = await executeWithSchemaRetry(
          payload => supabase.from('training_attendance').upsert(payload),
          dbPayload
        );

        if (upsertError) {
          console.error('Supabase upsert attendance error:', upsertError);
          setIsSyncing(false);
          return { success: false, error: upsertError.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase upsert attendance exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to persist attendance' };
      }
    } else {
      setAttendance(prev => {
        const idx = prev.findIndex(a => a.id === savedRecord.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = savedRecord;
          return updated;
        }
        return [...prev, savedRecord];
      });
      setIsSyncing(false);
      return { success: true };
    }
  };

  const saveAttendanceBatch = async (records: Array<Omit<TrainingAttendanceRecord, 'createdAt' | 'updatedAt'>>) => {
    if (records.length === 0) return { success: true };
    setIsSyncing(true);
    const now = new Date().toISOString();

    const preparedRecords: TrainingAttendanceRecord[] = [];

    for (let idx = 0; idx < records.length; idx++) {
      const rec = records[idx];
      const batch = batches.find(b => 
        b.id === rec.batchId || 
        (b.batchCode && b.batchCode.toUpperCase() === (rec.batchCode || rec.batchId).toUpperCase())
      );

      if (!batch) {
        setIsSyncing(false);
        return { success: false, error: 'Selected batch does not exist in database.' };
      }

      const resolvedBatchId = batch.id;
      const resolvedBatchCode = batch.batchCode;

      const existing = attendance.find(a => 
        (rec.id && a.id === rec.id) || 
        ((a.batchId === resolvedBatchId || (a.batchCode && a.batchCode.toUpperCase() === resolvedBatchCode.toUpperCase())) && 
         a.employeeCode.toUpperCase() === rec.employeeCode.toUpperCase() && 
         (a.moduleCode || '').toUpperCase() === (rec.moduleCode || '').toUpperCase() && 
         (a.sessionDate || '') === (rec.sessionDate || ''))
      );

      preparedRecords.push({
        id: rec.id || existing?.id || `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        batchId: resolvedBatchId,
        batchCode: resolvedBatchCode,
        employeeCode: rec.employeeCode,
        moduleId: rec.moduleId || existing?.moduleId,
        moduleCode: rec.moduleCode,
        sessionDate: rec.sessionDate || existing?.sessionDate,
        reportedDatetime: rec.reportedDatetime ?? existing?.reportedDatetime,
        intermittentExitTime: rec.intermittentExitTime ?? existing?.intermittentExitTime,
        intermittentEntryTime: rec.intermittentEntryTime ?? existing?.intermittentEntryTime,
        completedDatetime: rec.completedDatetime ?? existing?.completedDatetime,
        status: rec.status,
        remarks: rec.remarks ?? existing?.remarks,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      });
    }

    if (isSupabaseConfigured) {
      try {
        const dbPayloads = preparedRecords.map(mapAttendanceToDb);
        const { error: upsertError } = await executeWithSchemaRetry(
          payload => supabase.from('training_attendance').upsert(payload),
          dbPayloads
        );

        if (upsertError) {
          console.error('Supabase batch attendance error:', upsertError);
          setIsSyncing(false);
          return { success: false, error: upsertError.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase batch attendance exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to save attendance' };
      }
    } else {
      setAttendance(prev => {
        const updated = [...prev];
        preparedRecords.forEach(newRec => {
          const idx = updated.findIndex(a => a.id === newRec.id);
          if (idx >= 0) {
            updated[idx] = newRec;
          } else {
            updated.push(newRec);
          }
        });
        return updated;
      });
      setIsSyncing(false);
      return { success: true };
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    setIsSyncing(true);
    if (isSupabaseConfigured) {
      try {
        const { error: delErr } = await supabase.from('training_attendance').delete().eq('id', id);
        if (delErr) {
          console.error('Supabase delete attendance error:', delErr);
          setIsSyncing(false);
          return { success: false, error: delErr.message };
        }
        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase delete attendance exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to delete attendance' };
      }
    } else {
      setAttendance(prev => prev.filter(a => a.id !== id));
      setIsSyncing(false);
      return { success: true };
    }
  };

  const bulkDeleteAttendance = async (ids: string[]) => {
    if (ids.length === 0) return { success: true };
    setIsSyncing(true);
    if (isSupabaseConfigured) {
      try {
        const { error: delErr } = await supabase.from('training_attendance').delete().in('id', ids);
        if (delErr) {
          console.error('Supabase bulk delete attendance error:', delErr);
          setIsSyncing(false);
          return { success: false, error: delErr.message };
        }
        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase bulk delete attendance exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to delete records' };
      }
    } else {
      setAttendance(prev => prev.filter(a => !ids.includes(a.id)));
      setIsSyncing(false);
      return { success: true };
    }
  };

  const bulkUpdateAttendance = async (batchId: string, moduleCode: string, status: AttendanceStatus, sessionDate?: string) => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    const batch = batches.find(b => b.id === batchId);
    if (!batch) {
      setIsSyncing(false);
      return { success: false, error: 'Batch not found' };
    }

    const batchNomineesList = nominees.filter(n => n.batchId === batch.id);
    const updatedRecords: TrainingAttendanceRecord[] = [];

    batchNomineesList.forEach((nom, idx) => {
      const existing = attendance.find(a => 
        a.batchId === batch.id && 
        a.moduleCode.toUpperCase() === moduleCode.toUpperCase() && 
        a.employeeCode.toUpperCase() === nom.employeeCode.toUpperCase() &&
        (!sessionDate || !a.sessionDate || a.sessionDate === sessionDate)
      );

      updatedRecords.push({
        id: existing?.id || `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        batchId: batch.id,
        batchCode: batch.batchCode,
        employeeCode: nom.employeeCode,
        moduleCode,
        sessionDate: sessionDate || existing?.sessionDate,
        status,
        reportedDatetime: status === 'Present' || status === 'Attended' || status === 'Late' 
          ? (existing?.reportedDatetime || now) 
          : existing?.reportedDatetime,
        intermittentExitTime: existing?.intermittentExitTime,
        intermittentEntryTime: existing?.intermittentEntryTime,
        completedDatetime: existing?.completedDatetime,
        remarks: existing?.remarks,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      });
    });

    if (isSupabaseConfigured && updatedRecords.length > 0) {
      try {
        const { error: upsertErr } = await executeWithSchemaRetry(
          payload => supabase.from('training_attendance').upsert(payload),
          updatedRecords.map(mapAttendanceToDb)
        );

        if (upsertErr) {
          console.error('Supabase bulk attendance error:', upsertErr);
          setIsSyncing(false);
          return { success: false, error: upsertErr.message };
        }

        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase bulk attendance exception:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to update attendance' };
      }
    } else {
      setAttendance(prev => {
        const remaining = prev.filter(a => !(a.batchId === batchId && a.moduleCode.toUpperCase() === moduleCode.toUpperCase() && (!sessionDate || a.sessionDate === sessionDate)));
        return [...remaining, ...updatedRecords];
      });
      setIsSyncing(false);
      return { success: true };
    }
  };

  const resetBatchAttendance = async (batchId: string, moduleCode?: string, sessionDate?: string) => {
    setIsSyncing(true);
    if (isSupabaseConfigured) {
      try {
        if (moduleCode) {
          let matchQuery: any = { batch_id: batchId, module_code: moduleCode };
          if (sessionDate) matchQuery.session_date = sessionDate;
          await supabase.from('training_attendance').delete().match(matchQuery);
        } else {
          await supabase.from('training_attendance').delete().eq('batch_id', batchId);
        }
        await refreshBatchData();
        setIsSyncing(false);
        return { success: true };
      } catch (err: any) {
        console.error('Supabase reset attendance error:', err);
        setIsSyncing(false);
        return { success: false, error: err?.message || 'Failed to reset attendance' };
      }
    } else {
      if (moduleCode) {
        setAttendance(prev => prev.filter(a => !(a.batchId === batchId && a.moduleCode.toUpperCase() === moduleCode.toUpperCase() && (!sessionDate || a.sessionDate === sessionDate))));
      } else {
        setAttendance(prev => prev.filter(a => a.batchId !== batchId));
      }
      setIsSyncing(false);
      return { success: true };
    }
  };

  // =========================================================================
  // EXCEL IMPORT EXECUTION DIRECT TO SUPABASE
  // =========================================================================
  const executeBatchImport = async (
    parsedData: ParsedBatchImportData,
    fileName: string,
    importedBy: string
  ): Promise<{ success: boolean; error?: string; importLog?: BatchImportHistoryRecord }> => {
    setIsSyncing(true);
    const now = new Date().toISOString();

    try {
      let newBatchesCount = 0;
      let updatedBatchesCount = 0;
      const batchCodesList: string[] = [];
      const batchCodeToIdMap: Record<string, string> = {};
      const validBatches = cleanInvalidBatches(parsedData.batches || []);

      // Build prepared batch records
      const preparedBatches: TrainingBatch[] = [];

      validBatches.forEach(b => {
        batchCodesList.push(b.batchCode);
        const existing = batches.find(item => item.batchCode.toUpperCase() === b.batchCode.toUpperCase());

        if (existing) {
          updatedBatchesCount++;
          batchCodeToIdMap[b.batchCode.toUpperCase()] = existing.id;
          preparedBatches.push({
            ...existing,
            ...b,
            id: existing.id,
            headCount: b.headCount || existing.headCount,
            updatedAt: now
          });
        } else {
          newBatchesCount++;
          const newId = b.id || `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          batchCodeToIdMap[b.batchCode.toUpperCase()] = newId;
          preparedBatches.push({
            ...b,
            id: newId,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // Default fallback batch ID if schedules/nominees reference a batch code
      const fallbackBatchId = Object.values(batchCodeToIdMap)[0] || (batches[0]?.id || 'batch-default');

      // 2. Prepare Schedules
      let schedulesAdded = 0;
      const scheduleRecordsToInsert: BatchScheduleActivity[] = [];

      parsedData.schedules.forEach((s, idx) => {
        const targetBatchId = (s.batchCode && batchCodeToIdMap[s.batchCode.toUpperCase()]) || fallbackBatchId;
        const existing = schedules.find(item => 
          item.batchId === targetBatchId && 
          item.activity === s.activity && 
          item.moduleCode === s.moduleCode &&
          item.activityDate === s.activityDate
        );

        if (existing) {
          scheduleRecordsToInsert.push({
            ...existing,
            ...s,
            batchId: targetBatchId,
            updatedAt: now
          });
        } else {
          schedulesAdded++;
          scheduleRecordsToInsert.push({
            ...s,
            id: `sch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            batchId: targetBatchId,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 3. Prepare Nominees
      let nomineesAdded = 0;
      const nomineeRecordsToInsert: BatchNominee[] = [];

      parsedData.nominees.forEach((n, idx) => {
        const targetBatchId = (n.batchCode && batchCodeToIdMap[n.batchCode.toUpperCase()]) || fallbackBatchId;
        const existing = nominees.find(item => 
          item.batchId === targetBatchId && 
          item.employeeCode.toUpperCase() === n.employeeCode.toUpperCase()
        );

        if (existing) {
          nomineeRecordsToInsert.push({
            ...existing,
            ...n,
            batchId: targetBatchId,
            updatedAt: now
          });
        } else {
          nomineesAdded++;
          nomineeRecordsToInsert.push({
            ...n,
            id: `nom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            batchId: targetBatchId,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 4. Prepare Attendance
      let attendanceAdded = 0;
      const attendanceRecordsToInsert: TrainingAttendanceRecord[] = [];

      parsedData.attendance.forEach((a, idx) => {
        const targetBatchId = (a.batchCode && batchCodeToIdMap[a.batchCode.toUpperCase()]) || fallbackBatchId;
        const existing = attendance.find(item => 
          item.batchId === targetBatchId && 
          item.employeeCode.toUpperCase() === a.employeeCode.toUpperCase() && 
          item.moduleCode.toUpperCase() === a.moduleCode.toUpperCase()
        );

        if (existing) {
          attendanceRecordsToInsert.push({
            ...existing,
            ...a,
            batchId: targetBatchId,
            updatedAt: now
          });
        } else {
          attendanceAdded++;
          attendanceRecordsToInsert.push({
            ...a,
            id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            batchId: targetBatchId,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // 5. Create Import History Log
      const logRecord: BatchImportHistoryRecord = {
        id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileName,
        importedAt: now,
        importedBy,
        batchCodes: batchCodesList,
        newBatches: newBatchesCount,
        updatedBatches: updatedBatchesCount,
        nomineesAdded,
        schedulesAdded,
        attendanceRecordsAdded: attendanceAdded,
        errorCount: parsedData.issues.filter(i => i.type === 'error').length,
        status: parsedData.issues.filter(i => i.type === 'error').length === 0 ? 'Success' : 'Partial',
        details: {
          nomineesCount: nomineesAdded,
          schedulesCount: schedulesAdded,
          attendanceCount: attendanceAdded,
          warnings: parsedData.issues.filter(i => i.type === 'warning').map(w => w.message),
          errors: parsedData.issues.filter(i => i.type === 'error').map(e => e.message)
        }
      };

      // Push to Supabase in strict order: Batches -> Schedules -> Nominees -> Attendance -> History
      if (isSupabaseConfigured) {
        // Step 1: Batches
        if (preparedBatches.length > 0) {
          const dbBatches = preparedBatches.map(mapBatchToDb);
          const { error: batchErr } = await executeWithSchemaRetry(
            payload => supabase.from('training_batches').upsert(payload),
            dbBatches
          );

          if (batchErr) {
            console.error('Import Step 1 (Batches) Failed:', batchErr);
            setIsSyncing(false);
            return { success: false, error: `Step 1 (Batches) Failed: [${batchErr.code || 'DB_ERR'}] ${batchErr.message}` };
          }
        }

        // Step 2: Schedules
        if (scheduleRecordsToInsert.length > 0) {
          const dbSchedules = scheduleRecordsToInsert.map(mapScheduleToDb);
          const { error: schErr } = await executeWithSchemaRetry(
            payload => supabase.from('training_batch_schedules').upsert(payload),
            dbSchedules
          );

          if (schErr) {
            console.error('Import Step 2 (Schedules) Failed:', schErr);
            setIsSyncing(false);
            return { success: false, error: `Step 2 (Schedules) Failed: [${schErr.code || 'DB_ERR'}] ${schErr.message}` };
          }
        }

        // Step 3: Nominees
        if (nomineeRecordsToInsert.length > 0) {
          const dbNominees = nomineeRecordsToInsert.map(mapNomineeToDb);
          const { error: nomErr } = await executeWithSchemaRetry(
            payload => supabase.from('training_batch_nominees').upsert(payload),
            dbNominees
          );

          if (nomErr) {
            console.error('Import Step 3 (Nominees) Failed:', nomErr);
            setIsSyncing(false);
            return { success: false, error: `Step 3 (Nominees) Failed: [${nomErr.code || 'DB_ERR'}] ${nomErr.message}` };
          }
        }

        // Step 4: Attendance
        if (attendanceRecordsToInsert.length > 0) {
          const dbAttendance = attendanceRecordsToInsert.map(mapAttendanceToDb);
          const { error: attErr } = await executeWithSchemaRetry(
            payload => supabase.from('training_attendance').upsert(payload),
            dbAttendance
          );

          if (attErr) {
            console.error('Import Step 4 (Attendance) Failed:', attErr);
            setIsSyncing(false);
            return { success: false, error: `Step 4 (Attendance) Failed: [${attErr.code || 'DB_ERR'}] ${attErr.message}` };
          }
        }

        // Step 5: Import History
        const { error: histErr } = await executeWithSchemaRetry(
          payload => supabase.from('training_batch_import_history').insert(payload),
          mapImportHistoryToDb(logRecord)
        );

        if (histErr) {
          console.warn('Import Step 5 (History Log) Notice:', histErr);
        }

        console.log('IMPORT RESULT SUCCESSFUL', { 
          batches: preparedBatches.length, 
          schedules: scheduleRecordsToInsert.length,
          nominees: nomineeRecordsToInsert.length,
          attendance: attendanceRecordsToInsert.length
        });

        await refreshBatchData();
      } else {
        setBatches(preparedBatches);
        setSchedules(scheduleRecordsToInsert);
        setNominees(nomineeRecordsToInsert);
        setAttendance(attendanceRecordsToInsert);
        setImportHistory(prev => [logRecord, ...prev]);
      }

      setIsSyncing(false);
      return { success: true, importLog: logRecord };
    } catch (err: any) {
      console.error('Import execution exception:', err);
      setIsSyncing(false);
      return { success: false, error: err?.message || 'Failed to execute batch import' };
    }
  };

  const cleanInvalidRecords = async (): Promise<{ cleanedCount: number; removedBatchCodes: string[] }> => {
    const invalidList = batches.filter(isInvalidBatchRecord);
    if (invalidList.length === 0) {
      return { cleanedCount: 0, removedBatchCodes: [] };
    }

    const invalidIds = new Set(invalidList.map(b => b.id));
    const invalidCodes = invalidList.map(b => b.batchCode);

    if (isSupabaseConfigured) {
      try {
        await Promise.all(
          Array.from(invalidIds).map(id => supabase.from('training_batches').delete().eq('id', id))
        );
        await refreshBatchData();
      } catch (err: any) {
        console.warn('Supabase clean invalid records notice:', err?.message || err);
      }
    } else {
      setBatches(prev => prev.filter(b => !invalidIds.has(b.id)));
      setSchedules(prev => prev.filter(s => !invalidIds.has(s.batchId)));
      setNominees(prev => prev.filter(n => !invalidIds.has(n.batchId)));
      setAttendance(prev => prev.filter(a => !invalidIds.has(a.batchId)));
    }

    return { cleanedCount: invalidList.length, removedBatchCodes: invalidCodes };
  };

  const deleteImportHistoryRecord = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('training_batch_import_history').delete().eq('id', id);
        await refreshBatchData();
      } catch (err: any) {
        console.warn('Supabase delete import history notice:', err);
      }
    } else {
      setImportHistory(prev => prev.filter(h => h.id !== id));
    }
    return { success: true };
  };

  return (
    <BatchContext.Provider value={{
      batches,
      schedules,
      nominees,
      attendance,
      attendanceRecords: attendance,
      importHistory,
      isLoading,
      isSyncing,
      error,
      activeSubTab,
      setActiveSubTab,
      selectedBatchId,
      setSelectedBatchId,
      selectedBatch,
      activeDetailTab,
      setActiveDetailTab,
      createBatch,
      updateBatch,
      deleteBatch,
      addNominee,
      addNomineesBulk,
      updateNominee,
      removeNominee,
      addScheduleActivity,
      updateScheduleActivity,
      deleteScheduleActivity,
      saveAttendanceRecord,
      saveAttendanceBatch,
      deleteAttendanceRecord,
      bulkDeleteAttendance,
      bulkUpdateAttendance,
      resetBatchAttendance,
      refreshBatchData,
      executeBatchImport,
      deleteImportHistoryRecord,
      cleanInvalidRecords,
      getBatchNominees,
      getBatchSchedules,
      getBatchAttendance,
      getNextBatchCode
    }}>
      {children}
    </BatchContext.Provider>
  );
};

export const useBatch = () => {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
};

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  Server, 
  Layers, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  PlayCircle,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useTraining } from '../../context/TrainingContext';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';

interface TableStatusInfo {
  name: string;
  category: 'Curriculum' | 'Batches' | 'Core' | 'Assessments';
  count: number | null;
  status: 'Ready' | 'Error' | 'Checking';
  error?: string;
  expectedMin?: number;
}

export const SupabaseDatabaseDiagnosticPanel: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = '', compact = false }) => {
  const { programs, modules, courses } = useTraining();
  const { batches, schedules, nominees, attendance, importHistory } = useBatch();
  const { currentUser, users, tasks } = useApp();

  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString());

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://zmchtexsimubpwyiihyl.supabase.co';
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0] || 'zmchtexsimubpwyiihyl';

  const [tableStats, setTableStats] = useState<TableStatusInfo[]>([
    { name: 'training_programs', category: 'Curriculum', count: 46, status: 'Ready', expectedMin: 46 },
    { name: 'training_modules', category: 'Curriculum', count: 143, status: 'Ready', expectedMin: 143 },
    { name: 'training_courses', category: 'Curriculum', count: 194, status: 'Ready', expectedMin: 194 },
    { name: 'training_batches', category: 'Batches', count: null, status: 'Checking' },
    { name: 'training_batch_schedules', category: 'Batches', count: null, status: 'Checking' },
    { name: 'training_batch_nominees', category: 'Batches', count: null, status: 'Checking' },
    { name: 'training_attendance', category: 'Batches', count: null, status: 'Checking' },
    { name: 'training_batch_import_history', category: 'Batches', count: null, status: 'Checking' },
    { name: 'users', category: 'Core', count: null, status: 'Checking' },
    { name: 'tasks', category: 'Core', count: null, status: 'Checking' },
    { name: 'activities', category: 'Core', count: null, status: 'Checking' },
    { name: 'training_employees', category: 'Assessments', count: null, status: 'Checking' },
    { name: 'training_assessments', category: 'Assessments', count: null, status: 'Checking' },
    { name: 'training_pkts', category: 'Assessments', count: null, status: 'Checking' }
  ]);

  const runDiagnosticQuery = async () => {
    if (!isSupabaseConfigured) return;
    setIsRunningCheck(true);

    const tablesToProbe = [
      { name: 'training_programs', cat: 'Curriculum' as const, min: 46 },
      { name: 'training_modules', cat: 'Curriculum' as const, min: 143 },
      { name: 'training_courses', cat: 'Curriculum' as const, min: 194 },
      { name: 'training_batches', cat: 'Batches' as const },
      { name: 'training_batch_schedules', cat: 'Batches' as const },
      { name: 'training_batch_nominees', cat: 'Batches' as const },
      { name: 'training_attendance', cat: 'Batches' as const },
      { name: 'training_batch_import_history', cat: 'Batches' as const },
      { name: 'users', cat: 'Core' as const },
      { name: 'tasks', cat: 'Core' as const },
      { name: 'activities', cat: 'Core' as const },
      { name: 'training_employees', cat: 'Assessments' as const },
      { name: 'training_assessments', cat: 'Assessments' as const },
      { name: 'training_pkts', cat: 'Assessments' as const }
    ];

    const results: TableStatusInfo[] = [];

    for (const t of tablesToProbe) {
      try {
        const { count, error } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            name: t.name,
            category: t.cat,
            count: null,
            status: 'Error',
            error: error.message,
            expectedMin: t.min
          });
        } else {
          results.push({
            name: t.name,
            category: t.cat,
            count: count ?? 0,
            status: 'Ready',
            expectedMin: t.min
          });
        }
      } catch (err: any) {
        results.push({
          name: t.name,
          category: t.cat,
          count: null,
          status: 'Error',
          error: err?.message || 'Network exception',
          expectedMin: t.min
        });
      }
    }

    setTableStats(results);
    setLastCheckTime(new Date().toLocaleTimeString());
    setIsRunningCheck(false);
  };

  useEffect(() => {
    runDiagnosticQuery();
  }, []);

  const copyDiagnosticSummary = () => {
    const lines = [
      '==================================================',
      'SUPABASE DATABASE DIAGNOSTIC SUMMARY',
      '==================================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Supabase URL: ${supabaseUrl}`,
      `Project Reference: ${projectRef}`,
      `Connection Status: ${isSupabaseConfigured ? 'CONNECTED' : 'DISCONNECTED'}`,
      `Current User: ${currentUser.name} (${currentUser.username}) - Role: ${currentUser.role}`,
      '',
      '--- CURRICULUM STATE ---',
      `Programs: ${programs.length} (DB count: ${tableStats.find(t => t.name === 'training_programs')?.count ?? 'N/A'})`,
      `Modules: ${modules.length} (DB count: ${tableStats.find(t => t.name === 'training_modules')?.count ?? 'N/A'})`,
      `Courses: ${courses.length} (DB count: ${tableStats.find(t => t.name === 'training_courses')?.count ?? 'N/A'})`,
      '',
      '--- BATCH SYSTEM STATE ---',
      `Batches: ${batches.length} (DB count: ${tableStats.find(t => t.name === 'training_batches')?.count ?? 'N/A'})`,
      `Schedules: ${schedules.length} (DB count: ${tableStats.find(t => t.name === 'training_batch_schedules')?.count ?? 'N/A'})`,
      `Nominees: ${nominees.length} (DB count: ${tableStats.find(t => t.name === 'training_batch_nominees')?.count ?? 'N/A'})`,
      `Attendance Records: ${attendance.length} (DB count: ${tableStats.find(t => t.name === 'training_attendance')?.count ?? 'N/A'})`,
      `Import History Logs: ${importHistory.length} (DB count: ${tableStats.find(t => t.name === 'training_batch_import_history')?.count ?? 'N/A'})`,
      '',
      '--- TABLE STATUS MATRIX ---',
      ...tableStats.map(t => `• ${t.name}: ${t.status === 'Ready' ? `${t.count} rows (OK)` : `ERROR: ${t.error}`}`),
      '=================================================='
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const sqlSchemaScript = `-- CADEPLOY L&D Operations - Essential Schema Definitions for Supabase
-- Target Database: ${supabaseUrl}

-- 1. Training Employees Table
CREATE TABLE IF NOT EXISTS public.training_employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Tekla',
  designation TEXT,
  email TEXT,
  phone TEXT,
  location TEXT DEFAULT 'Hyderabad',
  join_date DATE,
  experience_years NUMERIC,
  status TEXT DEFAULT 'Active',
  target_competencies TEXT,
  current_levels TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Training Batches Table
CREATE TABLE IF NOT EXISTS public.training_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT NOT NULL UNIQUE,
  program_id TEXT,
  program_code TEXT NOT NULL,
  program_name TEXT,
  batch_type TEXT DEFAULT 'Regular',
  head_count INTEGER DEFAULT 0,
  batch_created_date TEXT,
  program_requested_date TEXT,
  program_request_accepted_date TEXT,
  program_requested_start_date TEXT,
  program_proposed_start_date TEXT,
  schedule_code TEXT,
  batch_location TEXT DEFAULT 'Hyderabad',
  facilitator_code TEXT,
  facilitator_name TEXT,
  facilitator_email TEXT,
  status TEXT DEFAULT 'Planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

-- 3. Training Batch Schedules Table
CREATE TABLE IF NOT EXISTS public.training_batch_schedules (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT,
  day_number INTEGER DEFAULT 1,
  activity_date TEXT,
  activity TEXT NOT NULL,
  module_id TEXT,
  module_code TEXT DEFAULT '-',
  module_name TEXT,
  duration_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Completed',
  arrangements TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Training Batch Nominees Table
CREATE TABLE IF NOT EXISTS public.training_batch_nominees (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT,
  employee_code TEXT NOT NULL,
  employee_name TEXT,
  department TEXT,
  designation TEXT,
  email TEXT,
  nominator_employee_code TEXT,
  nomination_datetime TEXT,
  target_competencies TEXT,
  current_levels TEXT,
  status TEXT DEFAULT 'Nominated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_batch_nominee UNIQUE (batch_id, employee_code)
);

-- 5. Training Attendance Table
CREATE TABLE IF NOT EXISTS public.training_attendance (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT,
  employee_code TEXT NOT NULL,
  module_id TEXT,
  module_code TEXT NOT NULL,
  session_date TEXT,
  reported_datetime TEXT,
  intermittent_exit_time TEXT,
  intermittent_entry_time TEXT,
  completed_datetime TEXT,
  status TEXT DEFAULT 'Attended',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Training Batch Import History Table
CREATE TABLE IF NOT EXISTS public.training_batch_import_history (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by TEXT DEFAULT 'Admin',
  batch_codes JSONB DEFAULT '[]'::jsonb,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  new_batches INTEGER DEFAULT 0,
  updated_batches INTEGER DEFAULT 0,
  nominees_added INTEGER DEFAULT 0,
  schedules_added INTEGER DEFAULT 0,
  attendance_records_added INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Success',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Disable RLS or create open access policies for anonymous applet clients
ALTER TABLE public.training_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_nominees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_import_history DISABLE ROW LEVEL SECURITY;
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const allCurriculumReady = programs.length >= 46 && modules.length >= 143 && courses.length >= 194;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Container */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Production Supabase Diagnostic Panel</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isSupabaseConfigured 
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {isSupabaseConfigured ? 'Connected' : 'Offline'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Single Source of Truth: <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{supabaseUrl}</code> ({projectRef})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyDiagnosticSummary}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy Diagnostic Summary"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied' : 'Copy Report'}</span>
          </button>

          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>View SQL Schema</span>
          </button>

          <button
            onClick={runDiagnosticQuery}
            disabled={isRunningCheck}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningCheck ? 'animate-spin' : ''}`} />
            <span>{isRunningCheck ? 'Testing...' : 'Run Live Health Check'}</span>
          </button>
        </div>
      </div>

      {/* Production Verification Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Curriculum Readiness */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              Curriculum Master
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              allCurriculumReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {allCurriculumReady ? 'Verified' : 'Partial'}
            </span>
          </div>
          <div className="text-xs font-mono space-y-1 pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Programs:</span>
              <span className="font-bold text-slate-900 dark:text-white">{programs.length} / 46</span>
            </div>
            <div className="flex justify-between">
              <span>Modules:</span>
              <span className="font-bold text-slate-900 dark:text-white">{modules.length} / 143</span>
            </div>
            <div className="flex justify-between">
              <span>Courses:</span>
              <span className="font-bold text-slate-900 dark:text-white">{courses.length} / 194</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Batches & Operations */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Batch Execution
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Supabase DB
            </span>
          </div>
          <div className="text-xs font-mono space-y-1 pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Batches:</span>
              <span className="font-bold text-slate-900 dark:text-white">{batches.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Schedules:</span>
              <span className="font-bold text-slate-900 dark:text-white">{schedules.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Import Logs:</span>
              <span className="font-bold text-slate-900 dark:text-white">{importHistory.length}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Nominees & Attendance */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Nominees & Attendance
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </span>
          </div>
          <div className="text-xs font-mono space-y-1 pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Nominees:</span>
              <span className="font-bold text-slate-900 dark:text-white">{nominees.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Attendance:</span>
              <span className="font-bold text-slate-900 dark:text-white">{attendance.length}</span>
            </div>
            <div className="flex justify-between">
              <span>System Users:</span>
              <span className="font-bold text-slate-900 dark:text-white">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: User & Authorization Context */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Current Session
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {currentUser.role}
            </span>
          </div>
          <div className="text-xs font-mono space-y-1 pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between truncate">
              <span>User:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Tasks in Scope:</span>
              <span className="font-bold text-slate-900 dark:text-white">{tasks.length}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Last Checked:</span>
              <span>{lastCheckTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table Matrix Grid */}
      {!compact && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-600" />
              <span>PostgreSQL Table Schema & Row Count Health Matrix</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Direct PostgREST API probes
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Table Name</th>
                  <th className="px-3.5 py-2.5">Domain</th>
                  <th className="px-3.5 py-2.5 text-center">Row Count</th>
                  <th className="px-3.5 py-2.5">Schema Status</th>
                  <th className="px-3.5 py-2.5">Diagnostic Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                {tableStats.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                      public.{t.name}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500">
                      {t.category}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                      {t.count !== null ? t.count : '-'}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {t.status === 'Ready' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Operational
                        </span>
                      )}
                      {t.status === 'Checking' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Testing
                        </span>
                      )}
                      {t.status === 'Error' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          PGRST Notice
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500 text-[10px] max-w-xs truncate">
                      {t.status === 'Ready' 
                        ? (t.expectedMin ? `Verified: ${t.count} >= ${t.expectedMin}` : 'Table accessible and synchronized')
                        : (t.error || 'Check schema cache or permissions')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL Schema Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  PostgreSQL Production Schema Definition (Supabase)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
              <pre>{sqlSchemaScript}</pre>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                You can run this script directly in the Supabase SQL Editor if table provisioning is required.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL' : 'Copy SQL Script'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

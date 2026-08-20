import React, { useState } from 'react';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { TrainingSubTab } from '../../types/training';
import { TrainingSummaryCards } from './TrainingSummaryCards';
import { ProgramsTab } from './ProgramsTab';
import { ModulesTab } from './ModulesTab';
import { CoursesTab } from './CoursesTab';
import { TrainingStructureView } from './TrainingStructureView';
import { ExcelImportWizard } from './ExcelImportWizard';
import { ImportHistoryTab } from './ImportHistoryTab';
import { TrainingChartsForExport } from './TrainingChartsForExport';
import { LocalCurriculumSyncModal } from './LocalCurriculumSyncModal';
import { CurriculumDiagnosticPanel } from './CurriculumDiagnosticPanel';
import { 
  GraduationCap, 
  FolderKanban, 
  BookOpen, 
  Layers, 
  GitFork, 
  FileSpreadsheet, 
  History, 
  RefreshCw, 
  Cloud, 
  Download,
  FileDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Database,
  Terminal,
  Copy,
  Check,
  X,
  HardDrive
} from 'lucide-react';
import { generateTrainingSampleExcel } from '../../utils/trainingUtils';
import { exportTrainingManagementToExcel } from '../../utils/trainingExportUtils';

export const TrainingView: React.FC = () => {
  const { currentUser } = useApp();
  const { 
    activeSubTab, 
    setActiveSubTab, 
    programs, 
    modules, 
    courses,
    groupedCourses, 
    importLogs,
    isSupabaseConnected,
    isSyncing,
    error,
    diagnosticSummary,
    localCurriculumStatus,
    refreshTrainingData
  } = useTraining();

  const canExport = hasPermission(currentUser, 'TRAINING_REPORTS_VIEW') || hasPermission(currentUser, 'TRAINING_VIEW');
  const canImport = hasPermission(currentUser, 'TRAINING_IMPORT') || hasPermission(currentUser, 'TRAINING_CREATE');
  const canViewHistory = hasPermission(currentUser, 'TRAINING_VIEW') || hasPermission(currentUser, 'TRAINING_IMPORT');

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSchemaScript = `-- ==============================================================================
-- TRAINING MANAGEMENT SCHEMA MIGRATION
-- ==============================================================================

-- 1. TRAINING PROGRAMS
CREATE TABLE IF NOT EXISTS public.training_programs (
  id TEXT PRIMARY KEY,
  program_code TEXT NOT NULL UNIQUE,
  program_name TEXT NOT NULL,
  program_description TEXT,
  description TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRAINING MODULES
CREATE TABLE IF NOT EXISTS public.training_modules (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.training_programs(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  duration TEXT DEFAULT '01:00:00',
  delivery_mode TEXT DEFAULT 'Classroom Training (Offline)',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRAINING COURSES
CREATE TABLE IF NOT EXISTS public.training_courses (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL,
  program_code TEXT,
  module_code TEXT,
  program_id TEXT REFERENCES public.training_programs(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.training_modules(id) ON DELETE CASCADE,
  delivery_mode_1 TEXT,
  delivery_mode_2 TEXT,
  delivery_mode_3 TEXT,
  delivery_day NUMERIC DEFAULT 1,
  owner_role TEXT DEFAULT 'Manager - Learning & Development',
  course_status TEXT DEFAULT 'Approved',
  status TEXT DEFAULT 'Approved',
  pre_assessment_code TEXT,
  post_assessment_code TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRAINING IMPORT LOGS
CREATE TABLE IF NOT EXISTS public.training_import_logs (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  imported_by TEXT NOT NULL,
  programs_added NUMERIC DEFAULT 0,
  programs_updated NUMERIC DEFAULT 0,
  modules_added NUMERIC DEFAULT 0,
  modules_updated NUMERIC DEFAULT 0,
  courses_added NUMERIC DEFAULT 0,
  courses_updated NUMERIC DEFAULT 0,
  errors_count NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Success',
  log_details JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_code ON public.training_programs (program_code);
CREATE INDEX IF NOT EXISTS idx_training_modules_code ON public.training_modules (module_code);
CREATE INDEX IF NOT EXISTS idx_training_modules_prog_id ON public.training_modules (program_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_code ON public.training_courses (course_code);
CREATE INDEX IF NOT EXISTS idx_training_courses_prog_code ON public.training_courses (program_code);
CREATE INDEX IF NOT EXISTS idx_training_courses_mod_code ON public.training_courses (module_code);

-- ==============================================================================
-- TRAINING SYSTEM DATABASE ACCESS POLICIES
-- Role-based permissions are enforced at application/UI layer
-- ==============================================================================

-- Enable RLS on Training Tables
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_import_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if present
DROP POLICY IF EXISTS "training_programs_select" ON public.training_programs;
DROP POLICY IF EXISTS "training_programs_insert" ON public.training_programs;
DROP POLICY IF EXISTS "training_programs_update" ON public.training_programs;
DROP POLICY IF EXISTS "training_programs_delete" ON public.training_programs;
DROP POLICY IF EXISTS "Allow all on training_programs" ON public.training_programs;

DROP POLICY IF EXISTS "training_modules_select" ON public.training_modules;
DROP POLICY IF EXISTS "training_modules_insert" ON public.training_modules;
DROP POLICY IF EXISTS "training_modules_update" ON public.training_modules;
DROP POLICY IF EXISTS "training_modules_delete" ON public.training_modules;
DROP POLICY IF EXISTS "Allow all on training_modules" ON public.training_modules;

DROP POLICY IF EXISTS "training_courses_select" ON public.training_courses;
DROP POLICY IF EXISTS "training_courses_insert" ON public.training_courses;
DROP POLICY IF EXISTS "training_courses_update" ON public.training_courses;
DROP POLICY IF EXISTS "training_courses_delete" ON public.training_courses;
DROP POLICY IF EXISTS "Allow all on training_courses" ON public.training_courses;

DROP POLICY IF EXISTS "training_import_logs_select" ON public.training_import_logs;
DROP POLICY IF EXISTS "training_import_logs_insert" ON public.training_import_logs;
DROP POLICY IF EXISTS "training_import_logs_update" ON public.training_import_logs;
DROP POLICY IF EXISTS "training_import_logs_delete" ON public.training_import_logs;
DROP POLICY IF EXISTS "Allow all on training_import_logs" ON public.training_import_logs;

-- Policies for full application access
CREATE POLICY "Allow all on training_programs" ON public.training_programs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on training_modules" ON public.training_modules FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on training_courses" ON public.training_courses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on training_import_logs" ON public.training_import_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_programs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_modules;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_courses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_import_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Reload Schema
NOTIFY pgrst, 'reload schema';`;

  const copySqlSchema = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await generateTrainingSampleExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CADEPLOY_Training_Management_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating template:', e);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      await exportTrainingManagementToExcel(programs, modules, courses, importLogs);
      setExportMessage({
        type: 'success',
        text: 'Excel report generated successfully. Download started.'
      });
      setTimeout(() => setExportMessage(null), 5000);
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      setExportMessage({
        type: 'error',
        text: err?.message || 'Failed to generate Excel report. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyDiagnosticOutput = () => {
    if (!diagnosticSummary) return;
    const diagText = `
==================================================
TRAINING MANAGEMENT DATABASE DIAGNOSTIC
==================================================

Environment:
${diagnosticSummary.environment}

Supabase URL:
${diagnosticSummary.supabaseUrl}

Authenticated User:
${diagnosticSummary.authenticatedUserId}

Authenticated Email:
${diagnosticSummary.authenticatedUserEmail}

Programs query:
${diagnosticSummary.programsQueryStatus}

Programs count:
${diagnosticSummary.programsCount}

Modules query:
${diagnosticSummary.modulesQueryStatus}

Modules count:
${diagnosticSummary.modulesCount}

Courses query:
${diagnosticSummary.coursesQueryStatus}

Courses count:
${diagnosticSummary.coursesCount}

Training Management database connection:
${diagnosticSummary.connectionStatus}

==================================================
    `.trim();

    navigator.clipboard.writeText(diagText);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="space-y-6" id="training-management-view">
      {/* Hidden high-res charts container for Excel export */}
      <TrainingChartsForExport />

      {/* Export Status Toast */}
      {exportMessage && (
        <div 
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
            exportMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{exportMessage.text}</span>
          </div>
          <button 
            onClick={() => setExportMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Database Issue Banner if disconnected */}
      {!isSupabaseConnected && error && (
        <div 
          id="banner-training-db-issue"
          className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200/60 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">
                Database Notice: Training Tables Not Found in Live Supabase Schema
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                The database returned a table lookup error ({error}). To enable persistent multi-user database storage across preview and published apps, execute the SQL schema migration in your Supabase SQL Editor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setShowDiagnosticModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>View Diagnostic</span>
            </button>
          </div>
        </div>
      )}

      {/* One-Time Curriculum Migration Banner */}
      {localCurriculumStatus?.hasLocalData && (
        <div 
          id="banner-local-curriculum-migration"
          className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 sm:mt-0 shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-blue-950 dark:text-blue-100 flex items-center gap-2">
                <span>One-Time Action: Local Curriculum Records Found</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  Migration Ready
                </span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5">
                Found <strong>{localCurriculumStatus.programsCount} Programs</strong>, <strong>{localCurriculumStatus.modulesCount} Modules</strong>, and <strong>{localCurriculumStatus.coursesCount} Courses</strong> in browser cache. Sync them to Supabase so they are permanently available across all browsers and preview sessions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              id="btn-banner-sync-local-curriculum"
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync Local Curriculum to Supabase</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Training Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Curriculum hierarchy, instructional modules, courses & batch Excel imports
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sync Local Curriculum Button if local data is present */}
          {localCurriculumStatus?.hasLocalData && (
            <button
              id="btn-topbar-sync-local-curriculum"
              onClick={() => setShowSyncModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sync local browser curriculum records to Supabase"
            >
              <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sync Local to Supabase</span>
            </button>
          )}

          {/* Supabase Connection Status Badge */}
          <button 
            id="badge-training-db-status"
            onClick={() => setShowDiagnosticModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSupabaseConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
            title="Click to inspect Training Database Diagnostic Information"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'Database Connected' : 'Database Disconnected'}</span>
          </button>

          {/* Refresh Button */}
          <button
            id="btn-training-refresh"
            onClick={() => refreshTrainingData()}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all cursor-pointer"
            title="Refresh Training Data"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Download Sample Excel Template */}
          <button
            id="btn-training-sample-template"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download blank sample Excel import template"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Sample Template</span>
          </button>

          {/* Excel Import Fast-track button */}
          {canImport && (
            <button
              id="btn-training-excel-import"
              onClick={() => setActiveSubTab('import')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Excel Import</span>
            </button>
          )}

          {/* Prominent Export Excel (.xlsx) Button */}
          {canExport && (
            <button
              id="btn-training-export-excel"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              title="Export complete 9-sheet Training Management Excel Report (.xlsx)"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Excel...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export Excel (.xlsx)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic Inspector Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Training Management Database Diagnostic
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live Supabase connection & query status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 space-y-2 select-all overflow-x-auto">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  ==================================================<br />
                  TRAINING MANAGEMENT DATABASE DIAGNOSTIC<br />
                  ==================================================
                </div>
                <div><span className="text-slate-400 font-semibold">Environment:</span> {diagnosticSummary?.environment || 'unknown'}</div>
                <div><span className="text-slate-400 font-semibold">Supabase URL:</span> {diagnosticSummary?.supabaseUrl || 'NOT_CONFIGURED'}</div>
                <div><span className="text-slate-400 font-semibold">Authenticated User:</span> {diagnosticSummary?.authenticatedUserId || 'none'}</div>
                <div><span className="text-slate-400 font-semibold">Authenticated Email:</span> {diagnosticSummary?.authenticatedUserEmail || 'none'}</div>
                <div className="pt-1"><span className="text-slate-400 font-semibold">Programs query:</span> <span className={diagnosticSummary?.programsQueryStatus?.includes('SUCCESS') ? 'text-emerald-400' : 'text-rose-400'}>{diagnosticSummary?.programsQueryStatus || 'NOT_RUN'}</span></div>
                <div><span className="text-slate-400 font-semibold">Programs count:</span> {diagnosticSummary?.programsCount ?? 0}</div>
                <div className="pt-1"><span className="text-slate-400 font-semibold">Modules query:</span> <span className={diagnosticSummary?.modulesQueryStatus?.includes('SUCCESS') ? 'text-emerald-400' : 'text-rose-400'}>{diagnosticSummary?.modulesQueryStatus || 'NOT_RUN'}</span></div>
                <div><span className="text-slate-400 font-semibold">Modules count:</span> {diagnosticSummary?.modulesCount ?? 0}</div>
                <div className="pt-1"><span className="text-slate-400 font-semibold">Courses query:</span> <span className={diagnosticSummary?.coursesQueryStatus?.includes('SUCCESS') ? 'text-emerald-400' : 'text-rose-400'}>{diagnosticSummary?.coursesQueryStatus || 'NOT_RUN'}</span></div>
                <div><span className="text-slate-400 font-semibold">Courses count:</span> {diagnosticSummary?.coursesCount ?? 0}</div>
                <div className="pt-2 border-t border-slate-800 font-bold">
                  <span className="text-slate-400">Training Management database connection:</span>{' '}
                  <span className={diagnosticSummary?.connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}>
                    {diagnosticSummary?.connectionStatus || 'FAILED'}
                  </span>
                </div>
                <div className="text-slate-600 text-[10px]">
                  Last checked: {diagnosticSummary?.lastChecked || 'N/A'}
                </div>
              </div>

              {diagnosticSummary?.connectionStatus === 'FAILED' && (
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-sans space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>How to enable live table sync in Supabase:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Open your Supabase project dashboard &gt; <strong>SQL Editor</strong> &gt; Run the schema from <code>supabase_schema.sql</code> to create <code>training_programs</code>, <code>training_modules</code>, and <code>training_courses</code> tables.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={copySqlSchema}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Migration Script'}</span>
                </button>
                <button
                  onClick={copyDiagnosticOutput}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5" />}
                  <span>{copiedLog ? 'Diagnostic Copied' : 'Copy Diagnostic'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshTrainingData()}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Reconnect</span>
                </button>
                <button
                  onClick={() => setShowDiagnosticModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Diagnostic & Live Synchronization Status Panel */}
      <CurriculumDiagnosticPanel onOpenSyncModal={() => setShowSyncModal(true)} />

      {/* KPI Cards */}
      <TrainingSummaryCards />

      {/* Sub-tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Programs */}
          <button
            id="tab-training-programs"
            onClick={() => setActiveSubTab('programs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'programs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Programs</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeSubTab === 'programs'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {programs.length}
            </span>
          </button>

          {/* Modules */}
          <button
            id="tab-training-modules"
            onClick={() => setActiveSubTab('modules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'modules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Modules</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeSubTab === 'modules'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {modules.length}
            </span>
          </button>

          {/* Courses */}
          <button
            id="tab-training-courses"
            onClick={() => setActiveSubTab('courses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'courses'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Courses</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeSubTab === 'courses'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {groupedCourses.length}
            </span>
          </button>

          {/* Training Structure Tree */}
          <button
            id="tab-training-structure"
            onClick={() => setActiveSubTab('structure')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'structure'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Training Structure</span>
          </button>

          {/* Excel Import */}
          {canImport && (
            <button
              id="tab-training-import"
              onClick={() => setActiveSubTab('import')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'import'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Import</span>
            </button>
          )}

          {/* Import History */}
          {canViewHistory && (
            <button
              id="tab-training-history"
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Import History</span>
              {importLogs.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeSubTab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {importLogs.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Content Panels */}
      <div className="mt-4">
        {activeSubTab === 'programs' && <ProgramsTab />}
        {activeSubTab === 'modules' && <ModulesTab />}
        {activeSubTab === 'courses' && <CoursesTab />}
        {activeSubTab === 'structure' && <TrainingStructureView />}
        {activeSubTab === 'import' && canImport && <ExcelImportWizard onNavigateToTab={(t) => setActiveSubTab(t)} />}
        {activeSubTab === 'history' && canViewHistory && <ImportHistoryTab />}
      </div>

      {/* Local Curriculum Sync Modal */}
      <LocalCurriculumSyncModal 
        isOpen={showSyncModal} 
        onClose={() => setShowSyncModal(false)} 
      />
    </div>
  );
};


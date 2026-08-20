import React, { useState } from 'react';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { canEditTraining, canDeleteTraining } from '../../utils/permissionUtils';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Layers,
  Shield,
  User as UserIcon,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

interface CurriculumDiagnosticPanelProps {
  onOpenSyncModal?: () => void;
}

export const CurriculumDiagnosticPanel: React.FC<CurriculumDiagnosticPanelProps> = () => {
  const {
    programs,
    modules,
    courses,
    diagnosticSummary,
    isSupabaseConnected,
    isSyncing,
    refreshTrainingData
  } = useTraining();

  const { currentUser } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  const programsCount = diagnosticSummary?.programsCount ?? programs.length;
  const modulesCount = diagnosticSummary?.modulesCount ?? modules.length;
  const coursesCount = diagnosticSummary?.coursesCount ?? courses.length;

  const userCanEdit = canEditTraining(currentUser.role);
  const userCanDelete = canDeleteTraining(currentUser.role);

  const copyDiagnosticText = () => {
    const text = `
==================================================
APPLICATION ACCESS STATUS
==================================================

Database:
  ${isSupabaseConnected ? 'Connected to Supabase' : 'Disconnected'}

Current User:
  Name: ${currentUser.name}
  Username: ${currentUser.username}
  Role: ${currentUser.role}

Permissions:
  VIEW: Allowed
  EDIT: ${userCanEdit ? 'Allowed' : 'Disallowed'}
  DELETE: ${userCanDelete ? 'Allowed' : 'Disallowed'}

Curriculum:
  Programs: ${programsCount}
  Modules: ${modulesCount}
  Courses: ${coursesCount}

Source of Truth:
  SUPABASE
==================================================
`.trim();

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div 
      id="panel-application-access-status" 
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl text-white bg-blue-600 shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Application Access Status
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              User identity, role-based authorization, database connectivity & curriculum state
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-status-text"
            onClick={copyDiagnosticText}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title="Copy Status Text"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-refresh-status"
            onClick={() => refreshTrainingData()}
            disabled={isSyncing}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            id="btn-toggle-status-expand"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Grid */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Database Connection Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Database
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isSupabaseConnected 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}>
                  {isSupabaseConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-600 dark:text-slate-400">
                  {isSupabaseConnected ? 'Connected to Supabase' : 'Offline (Local storage fallback)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  PostgreSQL backend operational
                </div>
              </div>
            </div>

            {/* 2. Current User Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Current User
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  {currentUser.role}
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {/* 3. Permissions Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Permissions
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  Role Based
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">VIEW:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Allowed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">EDIT:</span>
                  <span className={`font-bold ${userCanEdit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {userCanEdit ? 'Allowed' : 'Disallowed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DELETE:</span>
                  <span className={`font-bold ${userCanDelete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {userCanDelete ? 'Allowed' : 'Disallowed'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Curriculum & Source Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Curriculum & Source
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                  SUPABASE
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Programs:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{programsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modules:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{modulesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Courses:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{coursesCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Source of truth footer bar */}
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>CADEPLOY Learning & Development Operations System • Source of Truth: <strong>SUPABASE</strong></span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
              Curriculum: {programsCount} Programs • {modulesCount} Modules • {coursesCount} Courses
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

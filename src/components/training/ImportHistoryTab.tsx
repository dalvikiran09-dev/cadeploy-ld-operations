import React, { useState } from 'react';
import { useTraining } from '../../context/TrainingContext';
import { TrainingImportLog } from '../../types/training';
import { downloadImportLogFile } from '../../utils/trainingUtils';
import { exportTrainingManagementToExcel } from '../../utils/trainingExportUtils';
import { 
  History, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  X, 
  Calendar, 
  User, 
  FileText,
  FileDown,
  Loader2
} from 'lucide-react';

export const ImportHistoryTab: React.FC = () => {
  const { programs, modules, courses, importLogs } = useTraining();
  const [selectedLog, setSelectedLog] = useState<TrainingImportLog | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4" id="training-import-history-tab">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Excel Import Audit History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of all spreadsheet import runs with entity additions and modification logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-history-export-excel"
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportTrainingManagementToExcel(programs, modules, courses, importLogs);
              } catch (e) {
                console.error('Export error in history tab:', e);
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Export complete 9-sheet Excel workbook including audit history"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            <span>Export Report (.xlsx)</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {importLogs.length} Total Runs
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Imported By</th>
                <th className="py-3 px-4 text-center">Programs (+ / ~)</th>
                <th className="py-3 px-4 text-center">Modules (+ / ~)</th>
                <th className="py-3 px-4 text-center">Courses (+ / ~)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {importLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-sm">No import logs recorded yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Use the Excel Import tab to upload your first curriculum spreadsheet.
                    </p>
                  </td>
                </tr>
              ) : (
                importLogs.map(log => (
                  <tr 
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {formatDate(log.importedAt || (log as any).createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate max-w-xs">{log.fileName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.importedBy}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">+{log.programsAdded}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{log.programsUpdated}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">+{log.modulesAdded}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{log.modulesUpdated}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">+{log.coursesAdded}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{log.coursesUpdated}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        log.status === 'Success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : log.status === 'Partial'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      }`}>
                        {log.status === 'Success' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="View Execution Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadImportLogFile(log)}
                          title="Download Audit Log File (.txt)"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Import Execution Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedLog.fileName} • {formatDate(selectedLog.importedAt || (selectedLog as any).createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Programs</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                    +{selectedLog.programsAdded} <span className="text-xs font-normal text-slate-400">({selectedLog.programsUpdated} upd)</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Modules</div>
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    +{selectedLog.modulesAdded} <span className="text-xs font-normal text-slate-400">({selectedLog.modulesUpdated} upd)</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Courses</div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
                    +{selectedLog.coursesAdded} <span className="text-xs font-normal text-slate-400">({selectedLog.coursesUpdated} upd)</span>
                  </div>
                </div>
              </div>

              {/* Execution Messages */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Execution Log Entries
                </h4>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 max-h-60 overflow-y-auto">
                  {(() => {
                    const d = selectedLog.details;
                    if (!d) return <div className="text-slate-500">No log entries available.</div>;
                    if (Array.isArray(d)) {
                      return d.length === 0 ? (
                        <div className="text-slate-500">No log entries available.</div>
                      ) : (
                        d.map((msg, i) => <div key={i} className="leading-relaxed">{String(msg)}</div>)
                      );
                    }
                    if (typeof d === 'object') {
                      const lines: string[] = [];
                      if (d.programs) {
                        lines.push(`-- Programs (${d.programs.length}) --`);
                        d.programs.forEach((p: any) => lines.push(`[Program ${p.action?.toUpperCase()}]: ${p.code} - ${p.name}`));
                      }
                      if (d.modules) {
                        lines.push(`-- Modules (${d.modules.length}) --`);
                        d.modules.forEach((m: any) => lines.push(`[Module ${m.action?.toUpperCase()}]: ${m.code} - ${m.name}`));
                      }
                      if (d.courses) {
                        lines.push(`-- Courses (${d.courses.length}) --`);
                        d.courses.forEach((c: any) => lines.push(`[Course ${c.action?.toUpperCase()}]: ${c.courseCode} (${c.programCode} / ${c.moduleCode})`));
                      }
                      if (d.errors && d.errors.length > 0) {
                        lines.push(`-- Errors (${d.errors.length}) --`);
                        d.errors.forEach((e: string) => lines.push(`[ERROR]: ${e}`));
                      }
                      if (d.warnings && d.warnings.length > 0) {
                        lines.push(`-- Warnings (${d.warnings.length}) --`);
                        d.warnings.forEach((w: string) => lines.push(`[WARNING]: ${w}`));
                      }
                      if (lines.length === 0) {
                        return <div className="text-slate-500">Import completed with 0 errors.</div>;
                      }
                      return lines.map((msg, i) => (
                        <div key={i} className={`leading-relaxed ${msg.startsWith('[ERROR]') ? 'text-rose-400' : msg.startsWith('[WARNING]') ? 'text-amber-400' : ''}`}>
                          {msg}
                        </div>
                      ));
                    }
                    return <div className="leading-relaxed">{String(d)}</div>;
                  })()}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                onClick={() => downloadImportLogFile(selectedLog)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Log</span>
              </button>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

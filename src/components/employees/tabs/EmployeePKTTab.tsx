import React, { useState } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Download, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  RotateCcw,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { canManagePKT, canDeletePKT } from '../../../utils/permissionUtils';
import { TrainingEmployee, TrainingPKT } from '../../../types/assessment';
import { exportPKTsToExcel } from '../../../utils/assessmentUtils';

interface EmployeePKTTabProps {
  employee: TrainingEmployee;
  onOpenPKTModal: (pktToEdit?: TrainingPKT | null, targetAttemptNumber?: number) => void;
}

export const EmployeePKTTab: React.FC<EmployeePKTTabProps> = ({
  employee,
  onOpenPKTModal
}) => {
  const { currentUser } = useApp();
  const { getEmployeePKTs, getEmployeePKTHistory, deletePKT } = useAssessment();

  const isAuthorized = canManagePKT(currentUser.role);
  const canDelete = canDeletePKT(currentUser.role);

  const [filterResult, setFilterResult] = useState<string>('all');

  const empCode = (employee.employeeCode || '').toUpperCase();
  const allPkts = (getEmployeePKTs ? getEmployeePKTs(empCode) : []) || [];
  const groupedHistories = (getEmployeePKTHistory ? getEmployeePKTHistory(empCode) : []) || [];

  const filteredHistories = groupedHistories.filter(h => {
    if (filterResult === 'all') return true;
    if (filterResult === 'multiple') return h.totalAttempts > 1;
    return h.finalStatus.toLowerCase() === filterResult.toLowerCase();
  });

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Only Administrators can delete PKT records.');
      return;
    }
    if (confirm('Are you sure you want to delete this PKT test record?')) {
      await deletePKT(id);
    }
  };

  const handleExport = () => {
    exportPKTsToExcel(allPkts, `${employee.employeeCode}_PKT_Results`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <span>Practical & Knowledge Tests (PKTs)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves full historical progression across multi-attempt evaluations without overwriting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterResult}
            onChange={e => setFilterResult(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All PKT Tests ({groupedHistories.length})</option>
            <option value="pass">Passed Modules</option>
            <option value="fail">Needs Retest (Failed)</option>
            <option value="multiple">Multi-Attempt Retests</option>
          </select>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PKTs</span>
          </button>

          {isAuthorized && (
            <button
              onClick={() => onOpenPKTModal(null)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record PKT Attempt</span>
            </button>
          )}
        </div>
      </div>

      {/* Grouped PKT History Cards */}
      {filteredHistories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <FileCheck2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-semibold">No PKT test attempts recorded for this employee yet.</p>
          {isAuthorized && (
            <button
              onClick={() => onOpenPKTModal(null)}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First PKT Attempt</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistories.map((group, idx) => {
            const hasMultipleAttempts = group.totalAttempts > 1;
            const isPassed = group.finalStatus === 'Pass';

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* Module Summary Header */}
                <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white shadow-xs ${
                      isPassed ? 'bg-emerald-600' : 'bg-red-500'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {group.latestAttempt?.programName || group.programCode}
                        </h4>
                        {group.moduleCode && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-2xs">
                            {group.latestAttempt?.moduleName || group.moduleCode}
                          </span>
                        )}
                        {group.batchCode && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-2xs font-bold">
                            {group.batchCode}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>Total Attempts: <strong>{group.totalAttempts}</strong></span>
                        <span>Best Score: <strong className="text-emerald-600">{group.bestAttempt?.percentage}%</strong></span>
                        <span>Latest Score: <strong>{group.latestAttempt?.percentage}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isPassed 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800'
                    }`}>
                      Final Status: {group.finalStatus}
                    </span>

                    {isAuthorized && (
                      <button
                        onClick={() => onOpenPKTModal(null, group.totalAttempts + 1)}
                        className="px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        title="Record next attempt"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retest Attempt #{group.totalAttempts + 1}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Attempts Timeline / Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/40 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3 text-center">Attempt #</th>
                        <th className="p-3">PKT Type</th>
                        <th className="p-3">Test Date</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Result</th>
                        <th className="p-3">Evaluator</th>
                        <th className="p-3">Remarks / Feedback</th>
                        {isAuthorized && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {group.attempts.map((att) => {
                        const isBest = group.bestAttempt?.id === att.id;
                        const isLatest = group.latestAttempt?.id === att.id;

                        return (
                          <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 text-center font-mono font-bold">
                              <span className="inline-flex items-center gap-1">
                                <span>Attempt {att.attemptNumber}</span>
                                {isBest && (
                                  <span className="px-1.5 py-0.2 rounded-full text-3xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    BEST
                                  </span>
                                )}
                              </span>
                            </td>

                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                              {att.pktType}
                            </td>

                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {att.pktDate}
                            </td>

                            <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                              {att.scoreObtained} / {att.maximumScore}
                            </td>

                            <td className="p-3 text-center font-black text-slate-900 dark:text-white">
                              {att.percentage}%
                            </td>

                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                                att.result === 'Pass'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}>
                                {att.result}
                              </span>
                            </td>

                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                              {att.evaluator || '-'}
                            </td>

                            <td className="p-3 text-slate-500 italic max-w-[200px] truncate" title={att.remarks}>
                              {att.remarks || '-'}
                            </td>

                            {isAuthorized && (
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onOpenPKTModal(att)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="Edit PKT Attempt"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDelete(att.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Attempt"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

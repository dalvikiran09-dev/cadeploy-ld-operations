import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { canManageAssessments, canDeleteAssessments } from '../../../utils/permissionUtils';
import { TrainingEmployee, TrainingAssessment, AssessmentType } from '../../../types/assessment';
import { exportAssessmentsToExcel } from '../../../utils/assessmentUtils';

interface EmployeeAssessmentsTabProps {
  employee: TrainingEmployee;
  onOpenAssessmentModal: (assessmentToEdit?: TrainingAssessment | null) => void;
}

export const EmployeeAssessmentsTab: React.FC<EmployeeAssessmentsTabProps> = ({
  employee,
  onOpenAssessmentModal
}) => {
  const { currentUser } = useApp();
  const { getEmployeeAssessments, deleteAssessment } = useAssessment();

  const isAuthorized = canManageAssessments(currentUser.role);
  const canDelete = canDeleteAssessments(currentUser.role);

  const [filterType, setFilterType] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  const empCode = (employee.employeeCode || '').toUpperCase();
  const allAssessments = (getEmployeeAssessments ? getEmployeeAssessments(empCode) : []) || [];

  const filteredAssessments = allAssessments.filter(a => {
    const matchesType = filterType === 'all' || a.assessmentType.toLowerCase() === filterType.toLowerCase();
    const matchesResult = filterResult === 'all' || a.result.toLowerCase() === filterResult.toLowerCase();
    return matchesType && matchesResult;
  });

  // Calculate Pre vs Post delta by program
  const programMap = new Map<string, { programName: string; preScore?: number; postScore?: number }>();
  allAssessments.forEach(a => {
    const pCode = a.programCode;
    if (!programMap.has(pCode)) {
      programMap.set(pCode, { programName: a.programName || pCode });
    }
    const item = programMap.get(pCode)!;
    if (a.assessmentType.toLowerCase().includes('pre')) {
      item.preScore = a.percentage;
    } else if (a.assessmentType.toLowerCase().includes('post')) {
      item.postScore = a.percentage;
    }
  });

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Only Administrators can delete assessment records.');
      return;
    }
    if (confirm('Are you sure you want to delete this assessment record?')) {
      await deleteAssessment(id);
    }
  };

  const handleExport = () => {
    exportAssessmentsToExcel(allAssessments, `${employee.employeeCode}_Assessments`);
  };

  return (
    <div className="space-y-6">
      {/* Pre vs Post Program Comparison Banner */}
      {programMap.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Pre vs Post Learning Impact by Program</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(programMap.entries()).map(([progCode, data]) => {
              const hasPre = data.preScore !== undefined;
              const hasPost = data.postScore !== undefined;
              const delta = (hasPre && hasPost) ? (data.postScore! - data.preScore!) : undefined;

              return (
                <div key={progCode} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate" title={data.programName}>
                    {data.programName}
                  </span>
                  <span className="text-2xs font-mono text-blue-600 dark:text-blue-400 block mb-2">{progCode}</span>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-2xs text-slate-500 block">Pre</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{hasPre ? `${data.preScore}%` : 'N/A'}</span>
                    </div>

                    <div className="text-center">
                      <span className="text-2xs text-slate-500 block">Post</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{hasPost ? `${data.postScore}%` : 'N/A'}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-2xs text-slate-500 block">Impact</span>
                      {delta !== undefined ? (
                        <span className={`font-black inline-flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {delta >= 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-2xs">-</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Assessment Records ({allAssessments.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical evaluation logs across Pre, Post, Module, and Final Assessments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Pre-Assessment">Pre-Assessment</option>
              <option value="Post-Assessment">Post-Assessment</option>
              <option value="Module Assessment">Module Assessment</option>
              <option value="Final Assessment">Final Assessment</option>
              <option value="Other Assessment">Other Assessment</option>
            </select>

            {/* Filter Result */}
            <select
              value={filterResult}
              onChange={e => setFilterResult(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Results</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Not Attempted">Not Attempted</option>
            </select>

            {/* Export */}
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Excel</span>
            </button>

            {/* Add Record */}
            {isAuthorized && (
              <button
                onClick={() => onOpenAssessmentModal(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* Assessment Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Assessment Type</th>
                <th className="p-3.5">Program & Module</th>
                <th className="p-3.5">Batch</th>
                <th className="p-3.5 text-center">Date</th>
                <th className="p-3.5 text-center">Attempt</th>
                <th className="p-3.5 text-center">Score</th>
                <th className="p-3.5 text-center">Percentage</th>
                <th className="p-3.5 text-center">Result</th>
                <th className="p-3.5">Evaluator</th>
                <th className="p-3.5">Remarks</th>
                {isAuthorized && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={isAuthorized ? 11 : 10} className="p-8 text-center text-slate-500">
                    No assessment records found.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                        a.assessmentType.toLowerCase().includes('pre')
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : a.assessmentType.toLowerCase().includes('post')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : a.assessmentType.toLowerCase().includes('final')
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {a.assessmentType}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[180px] truncate" title={a.programName || a.programCode}>
                        {a.programName || a.programCode}
                      </div>
                      {a.moduleName && (
                        <div className="text-2xs text-slate-500 truncate max-w-[180px]">
                          {a.moduleName} ({a.moduleCode})
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {a.batchCode || '-'}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {a.assessmentDate}
                    </td>

                    <td className="p-3.5 text-center font-mono text-slate-700 dark:text-slate-300">
                      #{a.attemptNumber || 1}
                    </td>

                    <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                      {a.scoreObtained} / {a.maximumScore}
                    </td>

                    <td className="p-3.5 text-center font-black text-slate-900 dark:text-white">
                      {a.percentage}%
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                        a.result === 'Pass'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {a.result === 'Pass' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{a.result}</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {a.evaluator || '-'}
                    </td>

                    <td className="p-3.5 text-slate-500 italic max-w-[150px] truncate" title={a.remarks}>
                      {a.remarks || '-'}
                    </td>

                    {isAuthorized && (
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAssessmentModal(a)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Assessment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete Assessment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

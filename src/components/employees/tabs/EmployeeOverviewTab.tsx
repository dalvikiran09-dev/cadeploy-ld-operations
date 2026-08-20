import React from 'react';
import { 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck2, 
  Clock, 
  BookOpen, 
  Layers, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useBatch } from '../../../context/BatchContext';
import { TrainingEmployee } from '../../../types/assessment';
import { ConsolidatedTrainingMatrixTable } from '../ConsolidatedTrainingMatrixTable';

interface EmployeeOverviewTabProps {
  employee: TrainingEmployee;
  onOpenAssessmentModal: () => void;
  onOpenPKTModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export const EmployeeOverviewTab: React.FC<EmployeeOverviewTabProps> = ({
  employee,
  onOpenAssessmentModal,
  onOpenPKTModal,
  onNavigateTab
}) => {
  const { 
    getEmployeeAssessments, 
    getEmployeePKTs, 
    getEmployeePKTHistory,
    getEmployeeConsolidatedRecords 
  } = useAssessment();
  const { nominees = [], attendance = [], attendanceRecords = [] } = useBatch();
  const rawAttendance = attendance || attendanceRecords || [];

  const empCode = (employee.employeeCode || '').toUpperCase();
  const assessments = getEmployeeAssessments(empCode) || [];
  const pkts = getEmployeePKTs(empCode) || [];
  const pktHistories = getEmployeePKTHistory(empCode) || [];
  const consolidated = getEmployeeConsolidatedRecords(empCode) || [];
  const empAttendance = (rawAttendance || []).filter(a => a.employeeCode && a.employeeCode.toUpperCase() === empCode);

  // Pre vs Post
  const preList = assessments.filter(a => a.assessmentType.toLowerCase().includes('pre'));
  const postList = assessments.filter(a => a.assessmentType.toLowerCase().includes('post'));
  const preAvg = preList.length > 0 ? Math.round(preList.reduce((s, a) => s + a.percentage, 0) / preList.length) : 0;
  const postAvg = postList.length > 0 ? Math.round(postList.reduce((s, a) => s + a.percentage, 0) / postList.length) : 0;
  const learningDelta = (preList.length > 0 && postList.length > 0) ? (postAvg - preAvg) : 0;

  // PKT pass summary
  const totalPktModules = pktHistories.length;
  const passedPktModules = pktHistories.filter(h => h.finalStatus === 'Pass').length;
  const pktPassPercent = totalPktModules > 0 ? Math.round((passedPktModules / totalPktModules) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Visual Analytics & Progression Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Assessment Progression (Pre vs Post) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment Impact</span>
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Award className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex-1 border border-slate-100 dark:border-slate-800">
                <span className="text-2xs text-slate-500 font-bold block">Pre-Assessment</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-200">{preAvg}%</span>
              </div>

              <div className="flex flex-col items-center">
                {learningDelta >= 0 ? (
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1 rounded-full bg-red-100 text-red-700">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                )}
                <span className={`text-2xs font-extrabold mt-1 ${learningDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {learningDelta >= 0 ? `+${learningDelta}%` : `${learningDelta}%`}
                </span>
              </div>

              <div className="text-center p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 flex-1 border border-blue-100 dark:border-blue-900">
                <span className="text-2xs text-blue-600 dark:text-blue-400 font-bold block">Post-Assessment</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">{postAvg}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('assessments')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between cursor-pointer"
          >
            <span>View all {assessments.length} assessment logs</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Card 2: PKT Test Competency & Retest Ratio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PKT Practical Mastery</span>
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <FileCheck2 className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{pktPassPercent}%</span>
                <span className="text-xs text-slate-500 block">Modules Cleared ({passedPktModules}/{totalPktModules})</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Attempts</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{pkts.length} attempts</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pktPassPercent)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('pkts')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-between cursor-pointer"
          >
            <span>View PKT attempt timeline</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Card 3: Target Competencies & Current Skill Level */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skill Level & Readiness</span>
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2.5 mt-2">
              <div>
                <span className="text-2xs text-slate-500 font-bold block">Assessed Level</span>
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {employee.currentLevels || 'Level 1 - Foundational'}
                </span>
              </div>

              <div>
                <span className="text-2xs text-slate-500 font-bold block">Focus Areas</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                  {employee.targetCompetencies || 'Tekla Modeling, Connection Checking, GA Drawings'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('competencies')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-between cursor-pointer"
          >
            <span>Competency breakdown</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Consolidated Matrix Table Preview */}
      <ConsolidatedTrainingMatrixTable 
        records={consolidated} 
        title={`${employee.employeeName}'s Consolidated Training Matrix`}
        subtitle="Individual training history across Programs, Batches, Attendance, Assessments & PKTs"
      />
    </div>
  );
};

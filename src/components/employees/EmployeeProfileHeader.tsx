import React from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Award, 
  Calendar, 
  CheckCircle2, 
  FileCheck2, 
  TrendingUp, 
  Download, 
  Plus, 
  Edit3, 
  BookOpen, 
  Clock, 
  Layers,
  MapPin
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';
import { canManageAssessments, canManagePKT } from '../../utils/permissionUtils';
import { EmployeeProfileTab, TrainingEmployee } from '../../types/assessment';
import { exportConsolidatedTrainingRecordsToExcel } from '../../utils/assessmentUtils';

interface EmployeeProfileHeaderProps {
  employee: TrainingEmployee;
  activeTab: EmployeeProfileTab;
  onSelectTab: (tab: EmployeeProfileTab) => void;
  onOpenAssessmentModal: () => void;
  onOpenPKTModal: () => void;
  onOpenEditProfile: () => void;
}

export const EmployeeProfileHeader: React.FC<EmployeeProfileHeaderProps> = ({
  employee,
  activeTab,
  onSelectTab,
  onOpenAssessmentModal,
  onOpenPKTModal,
  onOpenEditProfile
}) => {
  const { currentUser } = useApp();
  const { 
    getEmployeeAssessments, 
    getEmployeePKTs, 
    getEmployeeConsolidatedRecords 
  } = useAssessment();
  const { nominees = [], attendance = [], attendanceRecords = [] } = useBatch();
  const rawAttendance = attendance || attendanceRecords || [];

  const isAssManager = canManageAssessments(currentUser?.role || '');
  const isPktManager = canManagePKT(currentUser?.role || '');

  const empCode = (employee.employeeCode || '').toUpperCase();
  const assessments = getEmployeeAssessments(empCode) || [];
  const pkts = getEmployeePKTs(empCode) || [];
  const empNominees = (nominees || []).filter(n => n.employeeCode && n.employeeCode.toUpperCase() === empCode);
  const empAttendance = (rawAttendance || []).filter(a => a.employeeCode && a.employeeCode.toUpperCase() === empCode);
  const consolidated = getEmployeeConsolidatedRecords(empCode) || [];

  // Compute key summary statistics
  const totalBatches = empNominees.length;
  const presentCount = empAttendance.filter(a => a.status === 'Present').length;
  const totalAttCount = empAttendance.length;
  const overallAttPct = totalAttCount > 0 ? Math.round((presentCount / totalAttCount) * 100) : 0;

  // Pre vs Post
  const preAssessments = assessments.filter(a => a.assessmentType.toLowerCase().includes('pre'));
  const postAssessments = assessments.filter(a => a.assessmentType.toLowerCase().includes('post'));
  const preAvg = preAssessments.length > 0 ? Math.round(preAssessments.reduce((s, a) => s + a.percentage, 0) / preAssessments.length) : 0;
  const postAvg = postAssessments.length > 0 ? Math.round(postAssessments.reduce((s, a) => s + a.percentage, 0) / postAssessments.length) : 0;
  const learningDelta = (preAssessments.length > 0 && postAssessments.length > 0) ? (postAvg - preAvg) : 0;

  // PKT stats
  const bestPktScore = pkts.length > 0 ? Math.max(...pkts.map(p => p.percentage)) : 0;
  const pktPassCount = pkts.filter(p => p.result === 'Pass').length;
  const pktPassRate = pkts.length > 0 ? Math.round((pktPassCount / pkts.length) * 100) : 0;

  const handleExport = () => {
    exportConsolidatedTrainingRecordsToExcel(consolidated, `${employee.employeeCode}_${employee.employeeName.replace(/\s+/g, '_')}_Record`);
  };

  const tabs: { id: EmployeeProfileTab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'history', label: 'Training History', count: totalBatches, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', count: empAttendance.length, icon: <Clock className="w-4 h-4" /> },
    { id: 'assessments', label: 'Assessments', count: assessments.length, icon: <Award className="w-4 h-4" /> },
    { id: 'pkts', label: 'PKTs (Tests)', count: pkts.length, icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs', count: new Set(consolidated.map(c => c.programCode)).size, icon: <Building2 className="w-4 h-4" /> },
    { id: 'competencies', label: 'Competencies', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Profile Top Banner */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Employee Avatar & Core Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 border-2 border-white dark:border-slate-800 shrink-0">
                {employee.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM'}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                employee.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {employee.employeeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                  {employee.employeeCode}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                  employee.status === 'Active' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {employee.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {employee.designation} &bull; {employee.department}
                </span>
                {employee.location && (
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {employee.location}
                  </span>
                )}
                {employee.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {employee.email}
                  </span>
                )}
                {employee.joiningDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {employee.joiningDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAssManager && (
              <button
                onClick={onOpenAssessmentModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Assessment</span>
              </button>
            )}

            {isPktManager && (
              <button
                onClick={onOpenPKTModal}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Record PKT</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Record</span>
            </button>

            <button
              onClick={onOpenEditProfile}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Micro-KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Overall Attendance</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">{overallAttPct}%</span>
              <span className="text-2xs text-slate-500">({presentCount}/{totalAttCount} sessions)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Pre vs Post Gain</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                {preAvg}% &rarr; {postAvg}%
              </span>
              {learningDelta !== 0 && (
                <span className={`text-2xs font-bold ${learningDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ({learningDelta > 0 ? `+${learningDelta}` : learningDelta}%)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">PKT Test Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {bestPktScore > 0 ? `${bestPktScore}%` : 'N/A'}
              </span>
              <span className="text-2xs text-slate-500">({pkts.length} attempt{pkts.length !== 1 ? 's' : ''})</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Enrolled Batches</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">{totalBatches}</span>
              <span className="text-2xs text-slate-500">active batches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="px-6 flex items-center gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white/60 dark:bg-slate-800/60'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-2xs font-extrabold ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

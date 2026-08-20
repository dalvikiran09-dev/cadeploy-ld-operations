import React from 'react';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { TrainingEmployee } from '../../../types/assessment';

interface EmployeeCompetenciesTabProps {
  employee: TrainingEmployee;
}

export const EmployeeCompetenciesTab: React.FC<EmployeeCompetenciesTabProps> = ({
  employee
}) => {
  const { getEmployeeAssessments, getEmployeePKTs } = useAssessment();

  const empCode = (employee.employeeCode || '').toUpperCase();
  const assessments = (getEmployeeAssessments ? getEmployeeAssessments(empCode) : []) || [];
  const pkts = (getEmployeePKTs ? getEmployeePKTs(empCode) : []) || [];

  const rawCompetencies = employee.targetCompetencies 
    ? employee.targetCompetencies.split(',').map(c => c.trim()).filter(Boolean)
    : ['Tekla 3D Modeling', 'Structural Connection Detailing', 'General Arrangement (GA) Drawings', 'AISC Specification Compliance', 'Quality Control & Checking'];

  const passedPkts = pkts.filter(p => p.result === 'Pass').length;
  const postAssessments = assessments.filter(a => a.assessmentType.toLowerCase().includes('post'));
  const postAvg = postAssessments.length > 0 ? Math.round(postAssessments.reduce((s, a) => s + a.percentage, 0) / postAssessments.length) : 0;

  // Level milestones
  const currentLevel = employee.currentLevels || 'Level 1 - Foundational';

  return (
    <div className="space-y-6">
      {/* Skill Level Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/10 text-purple-200">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase tracking-widest text-purple-200 font-bold">
                Assessed Competency Level
              </span>
            </div>
            <h3 className="text-xl font-black mt-1">
              {currentLevel}
            </h3>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              Qualification rating based on verified Pre/Post scores, PKT practical detailing tests, and verified session attendance.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
            <div className="text-center px-2">
              <span className="text-2xs text-purple-200 uppercase font-bold block">PKT Verified</span>
              <span className="text-lg font-black">{passedPkts} Tests</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <span className="text-2xs text-purple-200 uppercase font-bold block">Avg Mastery</span>
              <span className="text-lg font-black">{postAvg > 0 ? `${postAvg}%` : 'In Review'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Competencies Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Assigned Competency Framework & Focus Areas</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rawCompetencies.map((comp, idx) => (
            <div key={idx} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs shrink-0 mt-0.5">
                0{idx + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {comp}
                </h4>
                <p className="text-2xs text-slate-500 mt-1">
                  Evaluated via practical drafting speed tests and module assessments.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-3xs font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Active Assessment</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

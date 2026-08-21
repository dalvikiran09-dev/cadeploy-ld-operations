import React, { useState } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck, 
  Target, 
  Edit
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { TrainingEmployee } from '../../../types/assessment';
import { getDepartmentSkillsList, calculateSkillGap, isSkillQualified, getProficiencyLabel } from '../../../utils/skillMatrixUtils';
import { SkillAssessmentModal } from '../../skillMatrix/modals/SkillAssessmentModal';

interface EmployeeCompetenciesTabProps {
  employee: TrainingEmployee;
}

export const EmployeeCompetenciesTab: React.FC<EmployeeCompetenciesTabProps> = ({
  employee
}) => {
  const { 
    getEmployeeAssessments, 
    getEmployeePKTs, 
    departmentSkills = [], 
    employeeSkillAssessments = [] 
  } = useAssessment();

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

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

  // Skill Matrix Department evaluation
  const deptConfig = departmentSkills.find(
    d => d.departmentName.trim().toLowerCase() === (employee.department || '').trim().toLowerCase()
  );
  const skillsList = getDepartmentSkillsList(deptConfig, employee.department || 'Tekla');

  const empAssessments = employeeSkillAssessments.filter(
    a => a.employeeCode.toUpperCase() === empCode
  );
  const hasEvaluations = empAssessments.length > 0;
  const latestDate = empAssessments[0]?.assessmentDate;
  const latestAssessor = empAssessments[0]?.assessedBy;
  const remarks = empAssessments.find(a => !!a.remarks)?.remarks;

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

      {/* Department Skill Matrix Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Department Skill Matrix Evaluation &mdash; {employee.department}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proficiency scale (Levels 1 to 4) against department benchmarks
            </p>
          </div>

          <button
            onClick={() => setIsAssessmentModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{hasEvaluations ? 'Update Evaluation' : 'Evaluate Skills'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {skillsList.map(skill => {
            const match = empAssessments.find(a => a.skillIndex === skill.slotNumber || a.skillName.toLowerCase() === skill.name.toLowerCase());
            const currentLvl = match?.currentLevel || 0;
            const isEvaluated = currentLvl > 0;
            const gapInfo = calculateSkillGap(skill.requiredLevel, currentLvl);
            const isQualified = isSkillQualified(skill.requiredLevel, currentLvl);

            return (
              <div 
                key={skill.slotNumber}
                className={`p-4 rounded-xl border transition-all ${
                  !isEvaluated
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    : isQualified
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-3xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Skill #{skill.slotNumber}
                  </span>
                  <span className="text-2xs font-bold text-slate-500">
                    Target: <span className="text-blue-600 font-extrabold">L{skill.requiredLevel}</span>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[32px]">
                  {skill.name}
                </h4>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-3xs text-slate-400 block font-bold">Current Rating</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {isEvaluated ? `Level ${currentLvl} (${getProficiencyLabel(currentLvl)})` : 'Not Evaluated'}
                    </span>
                  </div>

                  <div>
                    {isEvaluated ? (
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold flex items-center gap-1 ${
                        isQualified 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}>
                        {isQualified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{gapInfo.gap > 0 ? `Gap: -${gapInfo.gap}` : 'Qualified'}</span>
                      </span>
                    ) : (
                      <span className="text-3xs font-medium text-slate-400">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasEvaluations && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Last Evaluated: </span>
              <span>{latestDate}</span>
              {latestAssessor && <span> by {latestAssessor}</span>}
            </div>
            {remarks && (
              <div className="text-2xs italic text-slate-500">
                "{remarks}"
              </div>
            )}
          </div>
        )}
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

      {/* Assessment Modal */}
      <SkillAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        employee={employee}
        departmentName={employee.department}
      />
    </div>
  );
};

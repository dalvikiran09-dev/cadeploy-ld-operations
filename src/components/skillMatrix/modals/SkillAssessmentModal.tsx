import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Award } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { EmployeeSkillAssessment, TrainingEmployee } from '../../../types/assessment';
import { calculateSkillGap, getDepartmentSkillsList, getProficiencyLabel, isSkillQualified } from '../../../utils/skillMatrixUtils';

interface SkillAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: TrainingEmployee | null;
  departmentName?: string;
  existingAssessment?: EmployeeSkillAssessment | null;
}

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  departmentName,
  existingAssessment
}) => {
  const { currentUser } = useApp();
  const { 
    employees = [], 
    departmentSkills = [], 
    bulkRecordSkillAssessments, 
    employeeSkillAssessments = [] 
  } = useAssessment();

  const [selectedEmpCode, setSelectedEmpCode] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assessmentType, setAssessmentType] = useState('Periodic Evaluation');
  const [assessorName, setAssessorName] = useState(() => currentUser?.name || 'Lead Trainer');
  const [remarks, setRemarks] = useState('');

  const [level1, setLevel1] = useState(1);
  const [level2, setLevel2] = useState(1);
  const [level3, setLevel3] = useState(1);
  const [level4, setLevel4] = useState<number | undefined>(undefined);
  const [level5, setLevel5] = useState<number | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine target employee
  const targetEmployee = React.useMemo(() => {
    if (employee) return employee;
    return employees.find(e => e.employeeCode.toUpperCase() === selectedEmpCode.toUpperCase()) || null;
  }, [employee, selectedEmpCode, employees]);

  const targetDept = (targetEmployee?.department || departmentName || 'Tekla').trim();

  // Find department config
  const deptConfig = React.useMemo(() => {
    return departmentSkills.find(
      d => d.departmentName.trim().toLowerCase() === targetDept.toLowerCase()
    ) || null;
  }, [departmentSkills, targetDept]);

  const skillsList = React.useMemo(() => {
    return getDepartmentSkillsList(deptConfig, targetDept);
  }, [deptConfig, targetDept]);

  useEffect(() => {
    if (isOpen) {
      const initEmpCode = employee?.employeeCode || (employees.length > 0 ? employees[0].employeeCode : '');
      setSelectedEmpCode(initEmpCode);
      setAssessmentDate(new Date().toISOString().slice(0, 10));
      setAssessorName(currentUser?.name || 'Lead Evaluator');
      setAssessmentType('Periodic Evaluation');

      // Populate existing levels
      const existing = employeeSkillAssessments.filter(
        a => a.employeeCode.toUpperCase() === initEmpCode.toUpperCase()
      );

      const s1 = existing.find(e => e.skillIndex === 1 || e.skillName.toLowerCase() === (skillsList[0]?.name || '').toLowerCase());
      const s2 = existing.find(e => e.skillIndex === 2 || e.skillName.toLowerCase() === (skillsList[1]?.name || '').toLowerCase());
      const s3 = existing.find(e => e.skillIndex === 3 || e.skillName.toLowerCase() === (skillsList[2]?.name || '').toLowerCase());
      const s4 = existing.find(e => e.skillIndex === 4 || e.skillName.toLowerCase() === (skillsList[3]?.name || '').toLowerCase());
      const s5 = existing.find(e => e.skillIndex === 5 || e.skillName.toLowerCase() === (skillsList[4]?.name || '').toLowerCase());

      setLevel1(s1?.currentLevel || 1);
      setLevel2(s2?.currentLevel || 1);
      setLevel3(s3?.currentLevel || 1);
      setLevel4(skillsList.length >= 4 ? (s4?.currentLevel || 1) : undefined);
      setLevel5(skillsList.length >= 5 ? (s5?.currentLevel || 1) : undefined);

      const firstWithRemarks = existing.find(e => !!e.remarks);
      setRemarks(firstWithRemarks?.remarks || '');
      setError(null);
    }
  }, [isOpen, employee, existingAssessment, deptConfig, skillsList, employeeSkillAssessments]);

  // When changing employee code
  const handleEmpCodeChange = (code: string) => {
    setSelectedEmpCode(code);
    const existing = employeeSkillAssessments.filter(a => a.employeeCode.toUpperCase() === code.toUpperCase());

    const s1 = existing.find(e => e.skillIndex === 1 || e.skillName.toLowerCase() === (skillsList[0]?.name || '').toLowerCase());
    const s2 = existing.find(e => e.skillIndex === 2 || e.skillName.toLowerCase() === (skillsList[1]?.name || '').toLowerCase());
    const s3 = existing.find(e => e.skillIndex === 3 || e.skillName.toLowerCase() === (skillsList[2]?.name || '').toLowerCase());
    const s4 = existing.find(e => e.skillIndex === 4 || e.skillName.toLowerCase() === (skillsList[3]?.name || '').toLowerCase());
    const s5 = existing.find(e => e.skillIndex === 5 || e.skillName.toLowerCase() === (skillsList[4]?.name || '').toLowerCase());

    setLevel1(s1?.currentLevel || 1);
    setLevel2(s2?.currentLevel || 1);
    setLevel3(s3?.currentLevel || 1);
    setLevel4(skillsList.length >= 4 ? (s4?.currentLevel || 1) : undefined);
    setLevel5(skillsList.length >= 5 ? (s5?.currentLevel || 1) : undefined);

    const firstWithRemarks = existing.find(e => !!e.remarks);
    setRemarks(firstWithRemarks?.remarks || '');
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) {
      setError('Please select an employee.');
      return;
    }
    if (!assessorName.trim()) {
      setError('Assessor name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const assessmentsToSave: Partial<EmployeeSkillAssessment>[] = skillsList.map(skill => {
      let lvl = level1;
      if (skill.slotNumber === 2) lvl = level2;
      if (skill.slotNumber === 3) lvl = level3;
      if (skill.slotNumber === 4) lvl = level4 || 1;
      if (skill.slotNumber === 5) lvl = level5 || 1;

      return {
        employeeCode: targetEmployee.employeeCode,
        employeeName: targetEmployee.employeeName,
        department: targetDept,
        skillName: skill.name,
        skillIndex: skill.slotNumber,
        currentLevel: Number(lvl),
        requiredLevel: skill.requiredLevel,
        assessmentDate,
        assessedBy: assessorName.trim(),
        remarks: remarks.trim() || undefined
      };
    });

    const res = await bulkRecordSkillAssessments(assessmentsToSave);
    setIsSaving(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to record skill assessment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Record Employee Skill Assessment
              </h2>
              <p className="text-xs text-slate-500">
                Evaluate proficiency levels (1-4) against {targetDept} targets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Employee Name / ID *
              </label>
              {employee ? (
                <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{employee.employeeName}</span>
                  <span className="font-mono text-blue-600 text-2xs">{employee.employeeCode}</span>
                </div>
              ) : (
                <select
                  value={selectedEmpCode}
                  onChange={e => handleEmpCodeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.employeeCode}>
                      {e.employeeCode} - {e.employeeName} ({e.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Department & Role
              </label>
              <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <span className="font-bold text-blue-600 dark:text-blue-400">{targetDept}</span>
                {targetEmployee?.designation && <span className="text-slate-400"> &bull; {targetEmployee.designation}</span>}
              </div>
            </div>
          </div>

          {/* Skills Evaluation Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department Skills Evaluation (1 - 4)
              </span>
              <span className="text-3xs text-slate-500">
                Level 1: Basic | 2: Intermediate | 3: Proficient | 4: Lead
              </span>
            </div>

            {skillsList.map((skill) => {
              let currentLvl = level1;
              let setLvl = setLevel1;

              if (skill.slotNumber === 2) {
                currentLvl = level2;
                setLvl = setLevel2;
              } else if (skill.slotNumber === 3) {
                currentLvl = level3;
                setLvl = setLevel3;
              } else if (skill.slotNumber === 4) {
                currentLvl = level4 || 1;
                setLvl = (val: number) => setLevel4(val);
              } else if (skill.slotNumber === 5) {
                currentLvl = level5 || 1;
                setLvl = (val: number) => setLevel5(val);
              }

              const gapInfo = calculateSkillGap(skill.requiredLevel, currentLvl);
              const isQualified = isSkillQualified(skill.requiredLevel, currentLvl);

              return (
                <div 
                  key={skill.slotNumber}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isQualified
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-3xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Skill #{skill.slotNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {skill.name}
                        </span>
                      </div>
                      <div className="text-2xs text-slate-500 mt-0.5">
                        Target Requirement: <span className="font-semibold text-blue-600">Level {skill.requiredLevel} ({getProficiencyLabel(skill.requiredLevel)})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                        isQualified 
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                          : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                      }`}>
                        {gapInfo.gap > 0 ? `Gap: -${gapInfo.gap} Lvls (Training Needed)` : 'Meets Target'}
                      </span>
                    </div>
                  </div>

                  {/* Level Selector Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[1, 2, 3, 4].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLvl(lvl)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          currentLvl === lvl
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        L{lvl} - {lvl === 1 ? 'Basic' : lvl === 2 ? 'Interm.' : lvl === 3 ? 'Proficient' : 'Lead'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assessment Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Assessment Date *
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={e => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Evaluation Type
              </label>
              <select
                value={assessmentType}
                onChange={e => setAssessmentType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="Periodic Evaluation">Periodic Evaluation</option>
                <option value="Initial Baseline">Initial Baseline</option>
                <option value="Post-Training Evaluation">Post-Training Evaluation</option>
                <option value="Quarterly Audit">Quarterly Audit</option>
                <option value="Promotion Review">Promotion Review</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Evaluator / Assessor *
              </label>
              <input
                type="text"
                value={assessorName}
                onChange={e => setAssessorName(e.target.value)}
                placeholder="e.g. Lead Trainer"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Assessment Remarks & Recommendations
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Demonstrated strong Tekla modeling capabilities. Recommended for advanced connection design training batch..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Users } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { DepartmentSkillConfig, EmployeeSkillAssessment, TrainingEmployee } from '../../../types/assessment';
import { getDepartmentSkillsList } from '../../../utils/skillMatrixUtils';

interface BulkSkillAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  departmentConfig?: DepartmentSkillConfig | null;
  employeesInDept: TrainingEmployee[];
}

interface RowState {
  employeeCode: string;
  employeeName: string;
  designation?: string;
  location?: string;
  skill1Level: number;
  skill2Level: number;
  skill3Level: number;
  skill4Level?: number;
  skill5Level?: number;
}

export const BulkSkillAssessmentModal: React.FC<BulkSkillAssessmentModalProps> = ({
  isOpen,
  onClose,
  department,
  departmentConfig,
  employeesInDept
}) => {
  const { currentUser } = useApp();
  const { bulkRecordSkillAssessments, employeeSkillAssessments = [] } = useAssessment();

  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assessmentType, setAssessmentType] = useState('Periodic Evaluation');
  const [assessorName, setAssessorName] = useState(() => currentUser?.name || 'Lead Trainer');
  const [remarks, setRemarks] = useState('Bulk quarterly skill assessment');

  const [rows, setRows] = useState<RowState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skillsList = React.useMemo(() => {
    return getDepartmentSkillsList(departmentConfig, department);
  }, [departmentConfig, department]);

  useEffect(() => {
    if (isOpen) {
      setAssessmentDate(new Date().toISOString().slice(0, 10));
      setAssessorName(currentUser?.name || 'Lead Evaluator');
      setAssessmentType('Periodic Evaluation');
      setRemarks('Bulk quarterly skill assessment');

      // Initialize rows with current assessment values or default to 1
      const initialRows: RowState[] = employeesInDept.map(emp => {
        const existing = employeeSkillAssessments.filter(
          a => a.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()
        );

        const s1 = existing.find(e => e.skillIndex === 1 || e.skillName.toLowerCase() === (skillsList[0]?.name || '').toLowerCase());
        const s2 = existing.find(e => e.skillIndex === 2 || e.skillName.toLowerCase() === (skillsList[1]?.name || '').toLowerCase());
        const s3 = existing.find(e => e.skillIndex === 3 || e.skillName.toLowerCase() === (skillsList[2]?.name || '').toLowerCase());
        const s4 = existing.find(e => e.skillIndex === 4 || e.skillName.toLowerCase() === (skillsList[3]?.name || '').toLowerCase());
        const s5 = existing.find(e => e.skillIndex === 5 || e.skillName.toLowerCase() === (skillsList[4]?.name || '').toLowerCase());

        return {
          employeeCode: emp.employeeCode,
          employeeName: emp.employeeName,
          designation: emp.designation,
          location: emp.location,
          skill1Level: s1?.currentLevel || 1,
          skill2Level: s2?.currentLevel || 1,
          skill3Level: s3?.currentLevel || 1,
          skill4Level: skillsList.length >= 4 ? (s4?.currentLevel || 1) : undefined,
          skill5Level: skillsList.length >= 5 ? (s5?.currentLevel || 1) : undefined,
        };
      });

      setRows(initialRows);
      setError(null);
    }
  }, [isOpen, department, departmentConfig, employeesInDept, employeeSkillAssessments, skillsList]);

  if (!isOpen) return null;

  const handleLevelChange = (empCode: string, slotNumber: number, level: number) => {
    setRows(prev => prev.map(row => {
      if (row.employeeCode !== empCode) return row;
      if (slotNumber === 1) return { ...row, skill1Level: level };
      if (slotNumber === 2) return { ...row, skill2Level: level };
      if (slotNumber === 3) return { ...row, skill3Level: level };
      if (slotNumber === 4) return { ...row, skill4Level: level };
      if (slotNumber === 5) return { ...row, skill5Level: level };
      return row;
    }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) {
      setError('No employees to assess.');
      return;
    }
    if (!assessorName.trim()) {
      setError('Assessor name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const assessmentsPayload: Partial<EmployeeSkillAssessment>[] = [];

    rows.forEach(r => {
      skillsList.forEach(skill => {
        let lvl = r.skill1Level;
        if (skill.slotNumber === 2) lvl = r.skill2Level;
        if (skill.slotNumber === 3) lvl = r.skill3Level;
        if (skill.slotNumber === 4) lvl = r.skill4Level || 1;
        if (skill.slotNumber === 5) lvl = r.skill5Level || 1;

        assessmentsPayload.push({
          employeeCode: r.employeeCode,
          employeeName: r.employeeName,
          department: department,
          skillName: skill.name,
          skillIndex: skill.slotNumber,
          currentLevel: Number(lvl),
          requiredLevel: skill.requiredLevel,
          assessmentDate: assessmentDate,
          assessedBy: assessorName.trim(),
          remarks: remarks.trim() || undefined
        });
      });
    });

    const res = await bulkRecordSkillAssessments(assessmentsPayload);
    setIsSaving(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save bulk assessments');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bulk Skill Assessment &mdash; {department}
              </h2>
              <p className="text-xs text-slate-500">
                Quickly evaluate skill levels (1-4) for {rows.length} employees in {department}
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
        <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Assessment Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Assessment Date *
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={e => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
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
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="Periodic Evaluation">Periodic Evaluation</option>
                <option value="Initial Baseline">Initial Baseline</option>
                <option value="Post-Training Evaluation">Post-Training Evaluation</option>
                <option value="Quarterly Audit">Quarterly Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Assessor Name *
              </label>
              <input
                type="text"
                value={assessorName}
                onChange={e => setAssessorName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Batch Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Table of Employees */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-2xs uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    {skillsList.map(s => (
                      <th key={s.slotNumber} className="py-2.5 px-3 text-center">
                        <div className="truncate max-w-[140px]" title={s.name}>
                          S{s.slotNumber}: {s.name}
                        </div>
                        <div className="text-3xs font-normal text-blue-600 dark:text-blue-400">
                          Target: L{s.requiredLevel}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={2 + skillsList.length} className="py-8 text-center text-slate-400">
                        No employees found in {department}.
                      </td>
                    </tr>
                  ) : (
                    rows.map(row => (
                      <tr key={row.employeeCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                          {row.employeeCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          <div>{row.employeeName}</div>
                          {row.designation && <div className="text-3xs text-slate-400">{row.designation}</div>}
                        </td>
                        {skillsList.map(s => {
                          let lvl = row.skill1Level;
                          if (s.slotNumber === 2) lvl = row.skill2Level;
                          if (s.slotNumber === 3) lvl = row.skill3Level;
                          if (s.slotNumber === 4) lvl = row.skill4Level || 1;
                          if (s.slotNumber === 5) lvl = row.skill5Level || 1;

                          const isQualified = lvl >= s.requiredLevel;

                          return (
                            <td key={s.slotNumber} className="py-2 px-2 text-center">
                              <div className="inline-flex items-center gap-1">
                                <select
                                  value={lvl}
                                  onChange={e => handleLevelChange(row.employeeCode, s.slotNumber, Number(e.target.value))}
                                  className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    isQualified
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  <option value={1}>L1</option>
                                  <option value={2}>L2</option>
                                  <option value={3}>L3</option>
                                  <option value={4}>L4</option>
                                </select>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              disabled={isSaving || rows.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving {rows.length} Assessments...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Assessments</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

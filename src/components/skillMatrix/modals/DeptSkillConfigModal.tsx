import React, { useState, useEffect } from 'react';
import { X, Target, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { DepartmentSkillConfig } from '../../../types/assessment';
import { MAIN_DEPARTMENTS } from '../../../constants/departments';

interface DeptSkillConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDepartment?: string;
}

export const DeptSkillConfigModal: React.FC<DeptSkillConfigModalProps> = ({
  isOpen,
  onClose,
  initialDepartment
}) => {
  const { departmentSkills = [], saveDepartmentSkills, employees = [] } = useAssessment();

  const [selectedDept, setSelectedDept] = useState('Tekla');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptName, setCustomDeptName] = useState('');

  const [skill1, setSkill1] = useState('Tekla Modeling & 3D Environment');
  const [requiredLevel1, setRequiredLevel1] = useState(3);

  const [skill2, setSkill2] = useState('Connection Detailing & AISC Standards');
  const [requiredLevel2, setRequiredLevel2] = useState(3);

  const [skill3, setSkill3] = useState('Erection & General Arrangement Drawings');
  const [requiredLevel3, setRequiredLevel3] = useState(3);

  const [hasSkill4, setHasSkill4] = useState(true);
  const [skill4, setSkill4] = useState('NC File Generation & Fabrication Checking');
  const [requiredLevel4, setRequiredLevel4] = useState(2);

  const [hasSkill5, setHasSkill5] = useState(true);
  const [skill5, setSkill5] = useState('Quality Self-Check & Clash Resolution');
  const [requiredLevel5, setRequiredLevel5] = useState(2);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All known departments from HR master & existing configs
  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>(MAIN_DEPARTMENTS);
    employees.forEach(e => { if (e.department) set.add(e.department); });
    departmentSkills.forEach(d => { if (d.departmentName) set.add(d.departmentName); });
    return Array.from(set);
  }, [employees, departmentSkills]);

  // Load config when department changes
  const loadDeptConfig = (dept: string) => {
    const config = departmentSkills.find(d => d.departmentName.trim().toLowerCase() === dept.trim().toLowerCase());
    if (config) {
      setSkill1(config.skill1 || '');
      setRequiredLevel1(config.requiredLevel1 || 3);
      setSkill2(config.skill2 || '');
      setRequiredLevel2(config.requiredLevel2 || 3);
      setSkill3(config.skill3 || '');
      setRequiredLevel3(config.requiredLevel3 || 3);
      
      if (config.skill4) {
        setHasSkill4(true);
        setSkill4(config.skill4);
        setRequiredLevel4(config.requiredLevel4 || 2);
      } else {
        setHasSkill4(false);
        setSkill4('');
      }

      if (config.skill5) {
        setHasSkill5(true);
        setSkill5(config.skill5);
        setRequiredLevel5(config.requiredLevel5 || 2);
      } else {
        setHasSkill5(false);
        setSkill5('');
      }
    } else {
      // Defaults for standard departments
      setSkill1('Core Technical Modeling');
      setRequiredLevel1(3);
      setSkill2('Standards & Codes Compliance');
      setRequiredLevel2(3);
      setSkill3('Drawings & Documentation');
      setRequiredLevel3(3);
      setHasSkill4(false);
      setSkill4('');
      setHasSkill5(false);
      setSkill5('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initDept = initialDepartment || (departmentOptions.length > 0 ? departmentOptions[0] : 'Tekla');
      setSelectedDept(initDept);
      setIsCustomDept(false);
      setCustomDeptName('');
      loadDeptConfig(initDept);
      setError(null);
    }
  }, [isOpen, initialDepartment]);

  if (!isOpen) return null;

  const handleDeptSelectChange = (dept: string) => {
    if (dept === '__NEW__') {
      setIsCustomDept(true);
      setCustomDeptName('');
      setSkill1('');
      setSkill2('');
      setSkill3('');
      setSkill4('');
      setSkill5('');
      setHasSkill4(false);
      setHasSkill5(false);
    } else {
      setIsCustomDept(false);
      setSelectedDept(dept);
      loadDeptConfig(dept);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDeptName = isCustomDept ? customDeptName.trim() : selectedDept.trim();
    if (!finalDeptName) {
      setError('Please provide a Department name.');
      return;
    }
    if (!skill1.trim()) {
      setError('Skill 1 is mandatory.');
      return;
    }
    if (!skill2.trim()) {
      setError('Skill 2 is mandatory.');
      return;
    }
    if (!skill3.trim()) {
      setError('Skill 3 is mandatory.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: Partial<DepartmentSkillConfig> = {
      departmentName: finalDeptName,
      skill1: skill1.trim(),
      requiredLevel1: Number(requiredLevel1),
      skill2: skill2.trim(),
      requiredLevel2: Number(requiredLevel2),
      skill3: skill3.trim(),
      requiredLevel3: Number(requiredLevel3),
      skill4: hasSkill4 && skill4.trim() ? skill4.trim() : undefined,
      requiredLevel4: hasSkill4 && skill4.trim() ? Number(requiredLevel4) : undefined,
      skill5: hasSkill5 && skill5.trim() ? skill5.trim() : undefined,
      requiredLevel5: hasSkill5 && skill5.trim() ? Number(requiredLevel5) : undefined,
      status: 'Active'
    };

    const res = await saveDepartmentSkills(payload);
    setIsSaving(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save department skills configuration');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Department Skills Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Define up to 5 core department skills and required proficiency targets (Levels 1 to 4)
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

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Department Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Department to Configure
            </label>
            {!isCustomDept ? (
              <div className="flex gap-2">
                <select
                  value={selectedDept}
                  onChange={e => handleDeptSelectChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="__NEW__">+ Add New Department...</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter new Department name (e.g. SDS2, Offshore Structural)..."
                  value={customDeptName}
                  onChange={e => setCustomDeptName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsCustomDept(false)}
                  className="text-2xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Cancel and choose from existing departments
                </button>
              </div>
            )}
          </div>

          {/* Skills Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Department Skills & Target Levels (1-4)
              </span>
              <span className="text-2xs text-slate-400">
                1=Basic, 2=Intermediate, 3=Proficient, 4=Expert
              </span>
            </div>

            {/* Skill 1 */}
            <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-750">
              <div className="col-span-8">
                <label className="block text-2xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Skill 1 (Mandatory)
                </label>
                <input
                  type="text"
                  value={skill1}
                  onChange={e => setSkill1(e.target.value)}
                  placeholder="e.g. Tekla Modeling & 3D Environment"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  required
                />
              </div>
              <div className="col-span-4">
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Level
                </label>
                <select
                  value={requiredLevel1}
                  onChange={e => setRequiredLevel1(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                >
                  <option value={1}>L1 - Basic</option>
                  <option value={2}>L2 - Intermediate</option>
                  <option value={3}>L3 - Proficient</option>
                  <option value={4}>L4 - Lead / Expert</option>
                </select>
              </div>
            </div>

            {/* Skill 2 */}
            <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-750">
              <div className="col-span-8">
                <label className="block text-2xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Skill 2 (Mandatory)
                </label>
                <input
                  type="text"
                  value={skill2}
                  onChange={e => setSkill2(e.target.value)}
                  placeholder="e.g. Connection Detailing & AISC Standards"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  required
                />
              </div>
              <div className="col-span-4">
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Level
                </label>
                <select
                  value={requiredLevel2}
                  onChange={e => setRequiredLevel2(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                >
                  <option value={1}>L1 - Basic</option>
                  <option value={2}>L2 - Intermediate</option>
                  <option value={3}>L3 - Proficient</option>
                  <option value={4}>L4 - Lead / Expert</option>
                </select>
              </div>
            </div>

            {/* Skill 3 */}
            <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-750">
              <div className="col-span-8">
                <label className="block text-2xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Skill 3 (Mandatory)
                </label>
                <input
                  type="text"
                  value={skill3}
                  onChange={e => setSkill3(e.target.value)}
                  placeholder="e.g. GA & Erection Drawings"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  required
                />
              </div>
              <div className="col-span-4">
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Level
                </label>
                <select
                  value={requiredLevel3}
                  onChange={e => setRequiredLevel3(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                >
                  <option value={1}>L1 - Basic</option>
                  <option value={2}>L2 - Intermediate</option>
                  <option value={3}>L3 - Proficient</option>
                  <option value={4}>L4 - Lead / Expert</option>
                </select>
              </div>
            </div>

            {/* Skill 4 (Optional) */}
            {hasSkill4 ? (
              <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-750">
                <div className="col-span-8">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-2xs font-bold text-slate-700 dark:text-slate-300">
                      Skill 4 (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => { setHasSkill4(false); setSkill4(''); }}
                      className="text-3xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Remove Skill 4
                    </button>
                  </div>
                  <input
                    type="text"
                    value={skill4}
                    onChange={e => setSkill4(e.target.value)}
                    placeholder="e.g. NC File Generation & Checking"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Target Level
                  </label>
                  <select
                    value={requiredLevel4}
                    onChange={e => setRequiredLevel4(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                  >
                    <option value={1}>L1 - Basic</option>
                    <option value={2}>L2 - Intermediate</option>
                    <option value={3}>L3 - Proficient</option>
                    <option value={4}>L4 - Lead / Expert</option>
                  </select>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHasSkill4(true)}
                className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill 4</span>
              </button>
            )}

            {/* Skill 5 (Optional) */}
            {hasSkill5 ? (
              <div className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-750">
                <div className="col-span-8">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-2xs font-bold text-slate-700 dark:text-slate-300">
                      Skill 5 (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => { setHasSkill5(false); setSkill5(''); }}
                      className="text-3xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Remove Skill 5
                    </button>
                  </div>
                  <input
                    type="text"
                    value={skill5}
                    onChange={e => setSkill5(e.target.value)}
                    placeholder="e.g. Quality Self-Check & Clash Resolution"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Target Level
                  </label>
                  <select
                    value={requiredLevel5}
                    onChange={e => setRequiredLevel5(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                  >
                    <option value={1}>L1 - Basic</option>
                    <option value={2}>L2 - Intermediate</option>
                    <option value={3}>L3 - Proficient</option>
                    <option value={4}>L4 - Lead / Expert</option>
                  </select>
                </div>
              </div>
            ) : hasSkill4 ? (
              <button
                type="button"
                onClick={() => setHasSkill5(true)}
                className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill 5</span>
              </button>
            ) : null}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Save } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { TrainingEmployee } from '../../../types/assessment';
import { 
  MAIN_DEPARTMENTS, 
  PEMB_SUB_DEPARTMENTS, 
  isPembDepartment, 
  getPembSubDepartment, 
  formatDepartment 
} from '../../../constants/departments';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: TrainingEmployee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit
}) => {
  const { addEmployee, updateEmployee } = useAssessment();
  const { currentUser } = useApp();

  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('Tekla');
  const [subDepartment, setSubDepartment] = useState('');
  const [designation, setDesignation] = useState('Tekla Trainee');
  const [location, setLocation] = useState('Hyderabad');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [targetCompetencies, setTargetCompetencies] = useState('Tekla Structural Detailing, Connection Checking, GA Drawings');
  const [currentLevels, setCurrentLevels] = useState('Level 1 - Foundational');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setEmployeeCode(employeeToEdit.employeeCode);
        setEmployeeName(employeeToEdit.employeeName);
        
        const rawDept = employeeToEdit.department || 'Tekla';
        if (isPembDepartment(rawDept)) {
          setDepartment('PEMB');
          const sub = getPembSubDepartment(rawDept);
          setSubDepartment(sub || 'Tekla');
        } else {
          setDepartment(rawDept);
          setSubDepartment('');
        }

        setDesignation(employeeToEdit.designation || 'Trainee');
        setLocation(employeeToEdit.location || 'Hyderabad');
        setEmail(employeeToEdit.email || '');
        setJoiningDate(employeeToEdit.joiningDate || new Date().toISOString().slice(0, 10));
        setStatus(employeeToEdit.status || 'Active');
        setTargetCompetencies(employeeToEdit.targetCompetencies || '');
        setCurrentLevels(employeeToEdit.currentLevels || '');
      } else {
        setEmployeeCode('');
        setEmployeeName('');
        setDepartment('Tekla');
        setSubDepartment('');
        setDesignation('Tekla Trainee');
        setLocation('Hyderabad');
        setEmail('');
        setJoiningDate(new Date().toISOString().slice(0, 10));
        setStatus('Active');
        setTargetCompetencies('Tekla Structural Detailing, Connection Checking, GA Drawings');
        setCurrentLevels('Level 1 - Foundational');
      }
      setError(null);
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      setError('Employee ID is required.');
      return;
    }
    if (!employeeName.trim()) {
      setError('Employee Name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolvedDepartment = department === 'PEMB' && subDepartment 
      ? formatDepartment('PEMB', subDepartment)
      : department.trim();

    const payload: Partial<TrainingEmployee> = {
      employeeCode: employeeCode.trim().toUpperCase(),
      employeeName: employeeName.trim(),
      department: resolvedDepartment,
      designation: designation.trim(),
      location: location.trim() || undefined,
      email: email.trim() || undefined,
      joiningDate: joiningDate || undefined,
      status: status,
      targetCompetencies: targetCompetencies.trim() || undefined,
      currentLevels: currentLevels.trim() || undefined
    };

    let res;
    if (employeeToEdit) {
      res = await updateEmployee(employeeToEdit.id, payload);
    } else {
      res = await addEmployee(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save employee profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {employeeToEdit ? 'Edit Employee Profile' : 'Register New Employee / Trainee'}
              </h2>
              <p className="text-xs text-slate-500">
                Individual training master record & competency tracking
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value)}
                disabled={!!employeeToEdit}
                placeholder="e.g. EMP001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={e => {
                  const val = e.target.value;
                  setDepartment(val);
                  if (val === 'PEMB' && !subDepartment) {
                    setSubDepartment('Tekla');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MAIN_DEPARTMENTS.map(d => (
                  <option key={d} value={d}>
                    {d} {d === 'PEMB' ? '(Pre-Engineered Buildings)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {department === 'PEMB' && (
              <div>
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                  PEMB Sub-Division *
                </label>
                <select
                  value={subDepartment || 'Tekla'}
                  onChange={e => setSubDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 font-semibold text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PEMB_SUB_DEPARTMENTS.map(sub => (
                    <option key={sub} value={sub}>
                      PEMB - {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Tekla Detailer Trainee"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location / Base Office
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Hyderabad, Chennai"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john.doe@cadeploy.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={e => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Competencies (Comma separated)
            </label>
            <input
              type="text"
              value={targetCompetencies}
              onChange={e => setTargetCompetencies(e.target.value)}
              placeholder="e.g. Tekla Modeling, Connection Detailing, AISC Codes"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Skill Level
              </label>
              <select
                value={currentLevels}
                onChange={e => setCurrentLevels(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="Level 1 - Foundational">Level 1 - Foundational</option>
                <option value="Level 2 - Intermediate">Level 2 - Intermediate</option>
                <option value="Level 3 - Advanced / Production Ready">Level 3 - Advanced / Production Ready</option>
                <option value="Level 4 - Lead Specialist">Level 4 - Lead Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employment Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{employeeToEdit ? 'Update Profile' : 'Create Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

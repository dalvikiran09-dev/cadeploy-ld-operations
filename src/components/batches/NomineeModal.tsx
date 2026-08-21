import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  Search, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useAssessment } from '../../context/AssessmentContext';
import { useApp } from '../../context/AppContext';
import { resolveEmployeeDetails } from '../../utils/batchUtils';
import { UserAvatar } from '../common/UserAvatar';

interface NomineeModalProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NomineeModal: React.FC<NomineeModalProps> = ({ batchId, isOpen, onClose }) => {
  const { addNominee, addNomineesBulk, getBatchNominees } = useBatch();
  const { employees } = useAssessment();
  const { users, setActiveTab } = useApp();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Optional batch-level nomination parameters
  const [nominatorCode, setNominatorCode] = useState('');
  const [nominationDatetime, setNominationDatetime] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  });
  const [targetCompetencies, setTargetCompetencies] = useState('Technical Drawing & Quality Standards');
  const [currentLevels, setCurrentLevels] = useState('Level 2 - Practitioner');

  const [bulkInput, setBulkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setEmployeeCodeInput('');
      setSearchQuery('');
      setIsDropdownOpen(false);
      setNominatorCode('');
      setBulkInput('');
      setFormError(null);
    }
  }, [isOpen]);

  const existingNominees = useMemo(() => getBatchNominees(batchId), [getBatchNominees, batchId]);
  const existingCodes = useMemo(
    () => new Set(existingNominees.map(n => n.employeeCode.toUpperCase())),
    [existingNominees]
  );

  // Real-time lookup for Single Employee
  const currentResolved = useMemo(() => {
    const trimmed = employeeCodeInput.trim().toUpperCase();
    if (!trimmed) return null;
    return resolveEmployeeDetails(trimmed, employees, users);
  }, [employeeCodeInput, employees, users]);

  const isCurrentAssigned = useMemo(() => {
    if (!currentResolved?.employeeCode) return false;
    return existingCodes.has(currentResolved.employeeCode.toUpperCase());
  }, [currentResolved, existingCodes]);

  // Search autocomplete options in Employee Master
  const matchingEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter(e => {
        const codeMatch = e.employeeCode.toLowerCase().includes(q);
        const nameMatch = e.employeeName.toLowerCase().includes(q);
        return codeMatch || nameMatch;
      })
      .slice(0, 8);
  }, [searchQuery, employees]);

  // Bulk input resolution
  const bulkResolvedList = useMemo(() => {
    if (!bulkInput.trim()) return [];
    const rawTokens = bulkInput
      .split(/[\n,;\t]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    const uniqueTokens = Array.from(new Set(rawTokens));

    return uniqueTokens.map(code => {
      const resolved = resolveEmployeeDetails(code, employees, users);
      const isAlreadyAssigned = existingCodes.has(code);
      return {
        code,
        resolved,
        isAlreadyAssigned,
        isValid: resolved.found && !isAlreadyAssigned
      };
    });
  }, [bulkInput, employees, users, existingCodes]);

  const bulkValidCount = bulkResolvedList.filter(item => item.isValid).length;
  const bulkNotFoundCount = bulkResolvedList.filter(item => !item.resolved.found).length;
  const bulkAlreadyAssignedCount = bulkResolvedList.filter(item => item.isAlreadyAssigned).length;

  if (!isOpen) return null;

  const handleSelectEmployee = (emp: typeof employees[0]) => {
    setEmployeeCodeInput(emp.employeeCode.toUpperCase());
    setSearchQuery('');
    setIsDropdownOpen(false);
    setFormError(null);
  };

  const handleGoToEmployeeMaster = () => {
    onClose();
    setActiveTab('employees');
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = employeeCodeInput.trim().toUpperCase();

    if (!trimmedCode) {
      setFormError('Employee ID is required');
      return;
    }

    if (!currentResolved?.found) {
      setFormError(`Employee ID ${trimmedCode} was not found in the Employee Master. Please add the employee to Employee Master first.`);
      return;
    }

    if (isCurrentAssigned) {
      setFormError(`Employee ${trimmedCode} is already assigned to this batch.`);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await addNominee(batchId, {
      employeeCode: currentResolved.employeeCode,
      employeeName: currentResolved.employeeName,
      department: currentResolved.department,
      designation: currentResolved.designation,
      nominatorEmployeeCode: nominatorCode.trim().toUpperCase() || undefined,
      nominationDatetime: nominationDatetime.trim() || undefined,
      targetCompetencies: targetCompetencies.trim() || undefined,
      currentLevels: currentLevels.trim() || undefined,
      status: 'Nominated'
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setFormError(res.error || 'Failed to add employee to batch');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkValidCount === 0) {
      if (bulkNotFoundCount > 0) {
        setFormError('None of the entered Employee IDs exist in the Employee Master. Please register employees first.');
      } else if (bulkAlreadyAssignedCount > 0) {
        setFormError('All entered employees are already assigned to this batch.');
      } else {
        setFormError('Please enter valid Employee IDs.');
      }
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const validNomineesToAdd = bulkResolvedList
      .filter(item => item.isValid)
      .map(item => ({
        employeeCode: item.resolved.employeeCode,
        employeeName: item.resolved.employeeName,
        department: item.resolved.department,
        designation: item.resolved.designation,
        nominatorEmployeeCode: nominatorCode.trim().toUpperCase() || undefined,
        nominationDatetime: nominationDatetime.trim() || undefined,
        targetCompetencies: targetCompetencies.trim() || undefined,
        currentLevels: currentLevels.trim() || undefined,
        status: 'Nominated'
      }));

    const res = await addNomineesBulk(batchId, validNomineesToAdd);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setFormError(res.error || 'Failed to add employees in bulk');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Participant to Batch
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identify nominees by Employee ID with automatic Employee Master synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setMode('single'); setFormError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Single Employee (By ID)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('bulk'); setFormError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bulk Nominate (Multiple IDs)</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {mode === 'single' ? (
            <form id="single-nominee-form" onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Employee ID Search / Quick Pick from Employee Master */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Search & Select from Employee Master
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search by Employee Code (e.g. CE4337) or Name..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {isDropdownOpen && matchingEmployees.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 shadow-xl z-10">
                    {matchingEmployees.map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {emp.employeeCode}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {emp.employeeName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {emp.department} • {emp.designation}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Employee ID Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID / Employee Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={employeeCodeInput}
                    onChange={e => {
                      setEmployeeCodeInput(e.target.value.toUpperCase());
                      setFormError(null);
                    }}
                    placeholder="e.g. CE4337, CE803, CE1885"
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  {currentResolved?.found && (
                    <div className="absolute right-3 top-2.5 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Employee details are fetched automatically from the Employee Master and cannot be overridden manually.
                </p>
              </div>

              {/* Resolution Display Card */}
              {employeeCodeInput.trim() && (
                <div>
                  {currentResolved?.found ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={currentResolved.employeeName} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                                {currentResolved.employeeCode}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Active in Master
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {currentResolved.employeeName}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Display-Only Resolved Employee Master Attributes */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            Department
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                            {currentResolved.department}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            Designation
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                            {currentResolved.designation}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            Location
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                            {currentResolved.location}
                          </span>
                        </div>
                      </div>

                      {isCurrentAssigned && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>This employee is already nominated to this batch.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Not Found in Employee Master State */
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold">
                            Employee ID {employeeCodeInput} was not found in the Employee Master.
                          </h4>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                            Batch nominations require an authoritative Employee Master record. To add this person, register them in Employee Master first.
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleGoToEmployeeMaster}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Go to Employee Master</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Batch Nomination Details */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nomination Metadata (Optional)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nominated By (Emp Code)
                    </label>
                    <input
                      type="text"
                      value={nominatorCode}
                      onChange={e => setNominatorCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CE102"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomination Date & Time
                    </label>
                    <input
                      type="text"
                      value={nominationDatetime}
                      onChange={e => setNominationDatetime(e.target.value)}
                      placeholder="07-Jan-2026 10:00"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Competency
                    </label>
                    <input
                      type="text"
                      value={targetCompetencies}
                      onChange={e => setTargetCompetencies(e.target.value)}
                      placeholder="e.g. Technical Drawing & Standards"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current Level
                    </label>
                    <input
                      type="text"
                      value={currentLevels}
                      onChange={e => setCurrentLevels(e.target.value)}
                      placeholder="e.g. Level 2 - Practitioner"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Bulk Nomination Mode */
            <form id="bulk-nominee-form" onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee IDs / Employee Codes (Newline, Comma, or Space separated) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={bulkInput}
                  onChange={e => {
                    setBulkInput(e.target.value.toUpperCase());
                    setFormError(null);
                  }}
                  rows={4}
                  placeholder={`CE4337\nCE4351\nCE4492\nCE4550`}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Each Employee ID is verified live against the Employee Master. Unregistered IDs cannot be added.
                </p>
              </div>

              {/* Bulk Live Verification Table */}
              {bulkResolvedList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Validation Preview ({bulkResolvedList.length} total)</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {bulkValidCount} Valid
                      </span>
                      {bulkNotFoundCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400">
                          • {bulkNotFoundCount} NOT FOUND
                        </span>
                      )}
                      {bulkAlreadyAssignedCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          • {bulkAlreadyAssignedCount} Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2 px-3">Employee ID</th>
                          <th className="py-2 px-3">Employee Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Designation</th>
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {bulkResolvedList.map(item => (
                          <tr
                            key={item.code}
                            className={
                              item.isValid
                                ? 'bg-white dark:bg-slate-900'
                                : !item.resolved.found
                                ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                : 'bg-amber-50/50 dark:bg-amber-950/20'
                            }
                          >
                            <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {item.code}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {item.resolved.found ? item.resolved.employeeName : 'Unknown'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                              {item.resolved.found ? item.resolved.department : '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                              {item.resolved.found ? item.resolved.designation : '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                              {item.resolved.found ? item.resolved.location : '—'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Check className="w-3 h-3" />
                                  Found
                                </span>
                              ) : !item.resolved.found ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <XCircle className="w-3 h-3" />
                                  NOT FOUND
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Already in Batch
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {bulkNotFoundCount > 0 && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <span>{bulkNotFoundCount} employee(s) are not in Employee Master and will be skipped.</span>
                      <button
                        type="button"
                        onClick={handleGoToEmployeeMaster}
                        className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Master</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Batch Nomination Metadata */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominated By (Emp Code)
                  </label>
                  <input
                    type="text"
                    value={nominatorCode}
                    onChange={e => setNominatorCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CE102"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomination Date & Time
                  </label>
                  <input
                    type="text"
                    value={nominationDatetime}
                    onChange={e => setNominationDatetime(e.target.value)}
                    placeholder="07-Jan-2026 10:00"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {mode === 'single' ? (
            <button
              type="submit"
              form="single-nominee-form"
              disabled={isSubmitting || !employeeCodeInput.trim() || !currentResolved?.found || isCurrentAssigned}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add to Batch'}</span>
            </button>
          ) : (
            <button
              type="submit"
              form="bulk-nominee-form"
              disabled={isSubmitting || bulkValidCount === 0}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Importing...' : `Add ${bulkValidCount} Valid Nominee${bulkValidCount === 1 ? '' : 's'}`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

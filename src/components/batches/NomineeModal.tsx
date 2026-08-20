import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Search, Check, AlertCircle } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';
import { resolveEmployeeName } from '../../utils/batchUtils';

interface NomineeModalProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NomineeModal: React.FC<NomineeModalProps> = ({ batchId, isOpen, onClose }) => {
  const { addNominee, addNomineesBulk, getBatchNominees } = useBatch();
  const { users } = useApp();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
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
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmployeeCode('');
      setEmployeeName('');
      setNominatorCode('');
      setUserSearchQuery('');
      setBulkInput('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const existingNominees = getBatchNominees(batchId);
  const existingCodes = new Set(existingNominees.map(n => n.employeeCode.toUpperCase()));

  // Filter existing users matching search query
  const matchingUsers = users.filter(u => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return false;
    const nameMatch = u.name?.toLowerCase().includes(q);
    const idMatch = (u.username || u.id || '').toLowerCase().includes(q);
    return nameMatch || idMatch;
  });

  const handleSelectUser = (u: any) => {
    const code = (u.username || u.id || '').toUpperCase();
    setEmployeeCode(code);
    setEmployeeName(u.name || '');
    setUserSearchQuery('');
    setError(null);
  };

  const handleCodeChange = (codeVal: string) => {
    setEmployeeCode(codeVal);
    const resolved = resolveEmployeeName(codeVal, users);
    if (resolved) {
      setEmployeeName(resolved);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = employeeCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Employee ID is required');
      return;
    }

    if (existingCodes.has(trimmedCode)) {
      setError(`Employee ${trimmedCode} is already assigned to this batch.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await addNominee(batchId, {
      employeeCode: trimmedCode,
      employeeName: employeeName.trim() || undefined,
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
      setError(res.error || 'Failed to add employee');
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) {
      setError('Please enter at least one employee ID');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Split by comma, newline, or spaces
    const codes: string[] = Array.from(new Set(
      bulkInput
        .split(/[\n,;]+/)
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length > 0)
    ));

    const alreadyAssigned = codes.filter(c => existingCodes.has(c));
    const codesToAdd = codes.filter(c => !existingCodes.has(c));

    if (codesToAdd.length === 0) {
      setError(`Employee ${alreadyAssigned.join(', ')} is already assigned to this batch.`);
      setIsSubmitting(false);
      return;
    }

    const nomineesToAdd = codesToAdd.map(code => {
      const name = resolveEmployeeName(code, users);
      return {
        employeeCode: code,
        employeeName: name || undefined,
        nominatorEmployeeCode: nominatorCode.trim().toUpperCase() || undefined,
        nominationDatetime: nominationDatetime.trim() || undefined,
        targetCompetencies: targetCompetencies.trim() || undefined,
        currentLevels: currentLevels.trim() || undefined,
        status: 'Nominated'
      };
    });

    const res = await addNomineesBulk(batchId, nomineesToAdd);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to add employees in bulk');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Employee to Batch
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nominate corporate participants and automatically prepare attendance records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setMode('single'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Single Employee</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('bulk'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'bulk'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bulk Add</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forms */}
        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            {/* Quick search user management */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Search Employee from User Management
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by name or employee code..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {matchingUsers.length > 0 && (
                <div className="mt-1.5 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 shadow-lg">
                  {matchingUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                      <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{u.username || u.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={e => handleCodeChange(e.target.value)}
                  placeholder="e.g. CE803 or CE1885"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  placeholder="Leave blank if unknown"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominated By
                </label>
                <input
                  type="text"
                  value={nominatorCode}
                  onChange={e => setNominatorCode(e.target.value)}
                  placeholder="e.g. CE102"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomination Date
                </label>
                <input
                  type="text"
                  value={nominationDatetime}
                  onChange={e => setNominationDatetime(e.target.value)}
                  placeholder="07-Jan-2026 10:00"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Competency
              </label>
              <input
                type="text"
                value={targetCompetencies}
                onChange={e => setTargetCompetencies(e.target.value)}
                placeholder="e.g. Technical Drawing & Quality Standards"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Adding...' : 'Add to Batch'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee IDs / Codes (comma or line separated) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                rows={4}
                placeholder="CE803&#10;CE1885&#10;CE2224&#10;CE4490"
                required
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter multiple employee IDs. Names will be auto-resolved from User Management.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominated By
                </label>
                <input
                  type="text"
                  value={nominatorCode}
                  onChange={e => setNominatorCode(e.target.value)}
                  placeholder="e.g. CE102"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomination Date
                </label>
                <input
                  type="text"
                  value={nominationDatetime}
                  onChange={e => setNominationDatetime(e.target.value)}
                  placeholder="07-Jan-2026 10:00"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Adding...' : 'Add to Batch'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

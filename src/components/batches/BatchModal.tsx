import React, { useState, useEffect } from 'react';
import { X, Layers, Check, RefreshCw, Calendar, MapPin, User, FileText } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { TrainingBatch, BatchStatus } from '../../types/batch';

interface BatchModalProps {
  isOpen: boolean;
  batchToEdit?: TrainingBatch | null;
  onClose: () => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  batchToEdit,
  onClose
}) => {
  const { createBatch, updateBatch, getNextBatchCode } = useBatch();
  const { programs } = useTraining();
  const { users } = useApp();

  const [batchCode, setBatchCode] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [programName, setProgramName] = useState('');
  const [batchCreatedDate, setBatchCreatedDate] = useState('');
  const [programRequestedDate, setProgramRequestedDate] = useState('');
  const [programRequestAcceptedDate, setProgramRequestAcceptedDate] = useState('');
  const [programRequestedStartDate, setProgramRequestedStartDate] = useState('');
  const [programProposedStartDate, setProgramProposedStartDate] = useState('');
  const [scheduleCode, setScheduleCode] = useState('');
  const [batchLocation, setBatchLocation] = useState('Hyderabad');
  const [facilitatorCode, setFacilitatorCode] = useState('');
  const [status, setStatus] = useState<BatchStatus | string>('In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (batchToEdit) {
        setBatchCode(batchToEdit.batchCode);
        setProgramCode(batchToEdit.programCode);
        setProgramName(batchToEdit.programName || '');
        setBatchCreatedDate(batchToEdit.batchCreatedDate || '');
        setProgramRequestedDate(batchToEdit.programRequestedDate || '');
        setProgramRequestAcceptedDate(batchToEdit.programRequestAcceptedDate || '');
        setProgramRequestedStartDate(batchToEdit.programRequestedStartDate || '');
        setProgramProposedStartDate(batchToEdit.programProposedStartDate || '');
        setScheduleCode(batchToEdit.scheduleCode || '');
        setBatchLocation(batchToEdit.batchLocation || 'Hyderabad');
        setFacilitatorCode(batchToEdit.facilitatorCode || '');
        setStatus(batchToEdit.status || 'In Progress');
      } else {
        const generatedCode = getNextBatchCode();
        setBatchCode(generatedCode);
        const defaultProg = programs[0];
        setProgramCode(defaultProg?.programCode || 'PRG0000000001');
        setProgramName(defaultProg?.programName || '');

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const formattedToday = `${day}-${month}-${year}`;

        setBatchCreatedDate(formattedToday);
        setProgramRequestedDate(formattedToday);
        setProgramRequestAcceptedDate(formattedToday);
        setProgramRequestedStartDate(formattedToday);
        setProgramProposedStartDate(formattedToday);
        setScheduleCode(`SCH${generatedCode.replace(/\D/g, '') || '0000000001'}`);
        setBatchLocation('Hyderabad');
        setFacilitatorCode(users[0]?.username || 'CE4490');
        setStatus('In Progress');
      }
    }
  }, [isOpen, batchToEdit, programs, users, getNextBatchCode]);

  // When program selection changes, sync program name
  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setProgramCode(selectedCode);
    const matched = programs.find(p => p.programCode === selectedCode);
    if (matched) {
      setProgramName(matched.programName);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode.trim()) {
      setError('Batch Code is required');
      return;
    }
    if (!programCode.trim()) {
      setError('Program Code is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const matchedProg = programs.find(p => p.programCode === programCode.trim());

    if (batchToEdit) {
      const res = await updateBatch(batchToEdit.id, {
        batchCode: batchCode.trim(),
        programId: matchedProg?.id,
        programCode: programCode.trim(),
        programName: programName.trim() || matchedProg?.programName,
        batchCreatedDate: batchCreatedDate.trim(),
        programRequestedDate: programRequestedDate.trim() || undefined,
        programRequestAcceptedDate: programRequestAcceptedDate.trim() || undefined,
        programRequestedStartDate: programRequestedStartDate.trim() || undefined,
        programProposedStartDate: programProposedStartDate.trim() || undefined,
        scheduleCode: scheduleCode.trim() || undefined,
        batchLocation: batchLocation.trim(),
        facilitatorCode: facilitatorCode.trim(),
        status
      });
      setIsSubmitting(false);
      if (res.success) onClose();
      else setError(res.error || 'Failed to update batch');
    } else {
      const res = await createBatch({
        batchCode: batchCode.trim(),
        programId: matchedProg?.id,
        programCode: programCode.trim(),
        programName: programName.trim() || matchedProg?.programName,
        batchCreatedDate: batchCreatedDate.trim(),
        programRequestedDate: programRequestedDate.trim() || undefined,
        programRequestAcceptedDate: programRequestAcceptedDate.trim() || undefined,
        programRequestedStartDate: programRequestedStartDate.trim() || undefined,
        programProposedStartDate: programProposedStartDate.trim() || undefined,
        scheduleCode: scheduleCode.trim() || undefined,
        batchLocation: batchLocation.trim(),
        facilitatorCode: facilitatorCode.trim(),
        status
      });
      setIsSubmitting(false);
      if (res.success) onClose();
      else setError(res.error || 'Failed to create batch');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {batchToEdit ? 'Edit Training Batch' : 'Create New Training Batch'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup batch schedules, locations, facilitators, and program link
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

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Batch Code & Program */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Batch Code <span className="text-rose-500">*</span>
                </label>
                {!batchToEdit && (
                  <button
                    type="button"
                    onClick={() => setBatchCode(getNextBatchCode())}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
                placeholder="BTCH0000000001"
                required
                className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Training Program <span className="text-rose-500">*</span>
              </label>
              {programs.length > 0 ? (
                <select
                  value={programCode}
                  onChange={handleProgramChange}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.programCode}>
                      {p.programCode} — {p.programName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={programCode}
                  onChange={e => setProgramCode(e.target.value)}
                  placeholder="PRG0000000001"
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* Row 2: Location, Facilitator & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={batchLocation}
                  onChange={e => setBatchLocation(e.target.value)}
                  placeholder="e.g. Hyderabad, Bangalore, Virtual"
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Facilitator / Trainer Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={facilitatorCode}
                  onChange={e => setFacilitatorCode(e.target.value)}
                  placeholder="e.g. CE4490"
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Batch Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Row 3: Schedule Code & Created Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Code
              </label>
              <input
                type="text"
                value={scheduleCode}
                onChange={e => setScheduleCode(e.target.value)}
                placeholder="SCH0000000001"
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Batch Created Date
              </label>
              <input
                type="text"
                value={batchCreatedDate}
                onChange={e => setBatchCreatedDate(e.target.value)}
                placeholder="07-Jan-2026"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Collapsible/Extended Dates */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Program Request & Start Dates</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Program Requested Date
                </label>
                <input
                  type="text"
                  value={programRequestedDate}
                  onChange={e => setProgramRequestedDate(e.target.value)}
                  placeholder="07-Jan-2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Request Accepted Date
                </label>
                <input
                  type="text"
                  value={programRequestAcceptedDate}
                  onChange={e => setProgramRequestAcceptedDate(e.target.value)}
                  placeholder="07-Jan-2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Requested Start Date
                </label>
                <input
                  type="text"
                  value={programRequestedStartDate}
                  onChange={e => setProgramRequestedStartDate(e.target.value)}
                  placeholder="07-Jan-2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Proposed Start Date
                </label>
                <input
                  type="text"
                  value={programProposedStartDate}
                  onChange={e => setProgramProposedStartDate(e.target.value)}
                  placeholder="07-Jan-2026"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (batchToEdit ? 'Save Changes' : 'Create Batch')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

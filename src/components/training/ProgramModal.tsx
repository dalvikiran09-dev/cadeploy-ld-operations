import React, { useState, useEffect } from 'react';
import { TrainingProgram, TrainingStatus } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { getNextProgramCode } from '../../utils/trainingUtils';
import { X, FolderKanban, Check, AlertCircle } from 'lucide-react';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programToEdit?: TrainingProgram | null;
}

export const ProgramModal: React.FC<ProgramModalProps> = ({
  isOpen,
  onClose,
  programToEdit
}) => {
  const { programs, addProgram, updateProgram } = useTraining();

  const [programCode, setProgramCode] = useState('');
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [status, setStatus] = useState<TrainingStatus>('Active');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (programToEdit) {
        setProgramCode(programToEdit.programCode);
        setProgramName(programToEdit.programName);
        setProgramDescription(programToEdit.programDescription || '');
        setStatus(programToEdit.status);
      } else {
        const nextCode = getNextProgramCode(programs);
        setProgramCode(nextCode);
        setProgramName('');
        setProgramDescription('');
        setStatus('Active');
      }
    }
  }, [isOpen, programToEdit, programs]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCode = programCode.trim();
    const trimmedName = programName.trim();

    if (!trimmedCode) {
      setErrorMessage('Program Code is required.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Program Name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (programToEdit) {
        const res = await updateProgram(programToEdit.id, {
          programCode: trimmedCode,
          programName: trimmedName,
          programDescription: programDescription.trim() || undefined,
          status
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update program.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addProgram({
          programCode: trimmedCode,
          programName: trimmedName,
          programDescription: programDescription.trim() || undefined,
          status
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to create program.');
          setIsSubmitting(false);
          return;
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      id="program-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        id="program-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {programToEdit ? 'Edit Training Program' : 'Create Training Program'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {programToEdit ? 'Update curriculum program details' : 'Define a top-level curriculum program'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Program Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Program Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-program-code"
              value={programCode}
              onChange={e => setProgramCode(e.target.value.toUpperCase())}
              placeholder="e.g. PRG0000000001"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Unique identifier (10 digits recommended, e.g. PRG0000000001)
            </p>
          </div>

          {/* Program Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Program Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-program-name"
              value={programName}
              onChange={e => setProgramName(e.target.value)}
              placeholder="e.g. Tekla Structures Core Fundamentals"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Program Description (Optional)
            </label>
            <textarea
              id="input-program-description"
              rows={3}
              value={programDescription}
              onChange={e => setProgramDescription(e.target.value)}
              placeholder="Provide a summary of learning goals, target audience, and scope..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Active', 'Draft', 'Inactive', 'Archived'] as TrainingStatus[]).map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                    status === st
                      ? st === 'Active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : st === 'Draft'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : programToEdit ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

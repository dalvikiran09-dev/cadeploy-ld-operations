import React, { useState, useEffect } from 'react';
import { TrainingModule, TrainingStatus } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { getNextModuleCode, normalizeDurationToTimeStr } from '../../utils/trainingUtils';
import { X, BookOpen, Check, AlertCircle, Clock } from 'lucide-react';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleToEdit?: TrainingModule | null;
}

const DELIVERY_MODES = [
  'Classroom Training (Offline)',
  'Virtual Training (Online)',
  'Self-Paced / E-Learning',
  'On-the-Job Training',
  'Blended Learning'
];

const DURATION_PRESETS = [
  { label: '30 mins', value: '00:30:00' },
  { label: '1 hour', value: '01:00:00' },
  { label: '1.5 hrs', value: '01:30:00' },
  { label: '2 hours', value: '02:00:00' },
  { label: '2.5 hrs', value: '02:30:00' },
  { label: '3 hours', value: '03:00:00' },
  { label: '4 hours', value: '04:00:00' }
];

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  moduleToEdit
}) => {
  const { modules, addModule, updateModule } = useTraining();

  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [duration, setDuration] = useState('01:00:00');
  const [deliveryMode, setDeliveryMode] = useState('Classroom Training (Offline)');
  const [status, setStatus] = useState<TrainingStatus>('Active');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (moduleToEdit) {
        setModuleCode(moduleToEdit.moduleCode);
        setModuleName(moduleToEdit.moduleName);
        setDuration(moduleToEdit.duration);
        setDeliveryMode(moduleToEdit.deliveryMode);
        setStatus(moduleToEdit.status);
      } else {
        const nextCode = getNextModuleCode(modules);
        setModuleCode(nextCode);
        setModuleName('');
        setDuration('01:00:00');
        setDeliveryMode('Classroom Training (Offline)');
        setStatus('Active');
      }
    }
  }, [isOpen, moduleToEdit, modules]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCode = moduleCode.trim();
    const trimmedName = moduleName.trim();

    if (!trimmedCode) {
      setErrorMessage('Module Code is required.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Module Name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedDuration = normalizeDurationToTimeStr(duration);

      if (moduleToEdit) {
        const res = await updateModule(moduleToEdit.id, {
          moduleCode: trimmedCode,
          moduleName: trimmedName,
          duration: normalizedDuration,
          deliveryMode,
          status
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update module.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addModule({
          moduleCode: trimmedCode,
          moduleName: trimmedName,
          duration: normalizedDuration,
          deliveryMode,
          status
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to create module.');
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
      id="module-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        id="module-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {moduleToEdit ? 'Edit Training Module' : 'Create Training Module'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {moduleToEdit ? 'Update instructional unit specifications' : 'Define an instructional unit with duration and mode'}
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

          {/* Module Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Module Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-module-code"
              value={moduleCode}
              onChange={e => setModuleCode(e.target.value.toUpperCase())}
              placeholder="e.g. MDL0000000001"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Unique identifier (10 digits recommended, e.g. MDL0000000001)
            </p>
          </div>

          {/* Module Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Module Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-module-name"
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              placeholder="e.g. Introduction to 3D Modeling & Grid Setup"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duration (HH:MM:SS) <span className="text-rose-500">*</span>
              </span>
            </label>

            <input
              type="text"
              id="input-module-duration"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 01:30:00"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DURATION_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset.value}
                  onClick={() => setDuration(preset.value)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                    duration === preset.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Delivery Mode
            </label>
            <select
              id="select-delivery-mode"
              value={deliveryMode}
              onChange={e => setDeliveryMode(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {DELIVERY_MODES.map(dm => (
                <option key={dm} value={dm}>{dm}</option>
              ))}
            </select>
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
                        : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
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
              {isSubmitting ? 'Saving...' : moduleToEdit ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Clock } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { BatchScheduleActivity } from '../../types/batch';

interface ScheduleModalProps {
  batchId: string;
  isOpen: boolean;
  activityToEdit?: BatchScheduleActivity | null;
  onClose: () => void;
}

const COMMON_ACTIVITIES = [
  'Delivery Session 1',
  'Delivery Session 2',
  'Delivery Session 3',
  'Session 1 Learning Review 1',
  'Session 1 Learning Review 2',
  'Session 1 Learning Review 3',
  '30 Day Manager Review',
  '60 Day Manager Review',
  '90 Day Manager Review',
  'Program Certification',
  'Post Training Assessment'
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  batchId,
  isOpen,
  activityToEdit,
  onClose
}) => {
  const { addScheduleActivity, updateScheduleActivity } = useBatch();
  const { modules } = useTraining();

  const [activityDate, setActivityDate] = useState('');
  const [activity, setActivity] = useState('Delivery Session 1');
  const [customActivity, setCustomActivity] = useState('');
  const [moduleCode, setModuleCode] = useState('-');
  const [status, setStatus] = useState<string>('Completed');
  const [arrangements, setArrangements] = useState<string>('Completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activityToEdit) {
      setActivityDate(activityToEdit.activityDate || '');
      if (COMMON_ACTIVITIES.includes(activityToEdit.activity)) {
        setActivity(activityToEdit.activity);
        setCustomActivity('');
      } else {
        setActivity('Custom');
        setCustomActivity(activityToEdit.activity);
      }
      setModuleCode(activityToEdit.moduleCode || '-');
      setStatus(activityToEdit.status || 'Completed');
      setArrangements(activityToEdit.arrangements || 'Completed');
    } else {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      setActivityDate(`${day}-${month}-${year} 14:30`);
      setActivity('Delivery Session 1');
      setCustomActivity('');
      setModuleCode(modules[0]?.moduleCode || '-');
      setStatus('Completed');
      setArrangements('Completed');
    }
  }, [activityToEdit, isOpen, modules]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDate.trim()) {
      setError('Activity Date is required');
      return;
    }

    const resolvedActivity = activity === 'Custom' ? customActivity.trim() : activity;
    if (!resolvedActivity) {
      setError('Activity name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const matchedModule = modules.find(m => m.moduleCode === moduleCode);

    if (activityToEdit) {
      const res = await updateScheduleActivity(activityToEdit.id, {
        activityDate: activityDate.trim(),
        activity: resolvedActivity,
        moduleId: matchedModule?.id,
        moduleCode: moduleCode.trim() || '-',
        status,
        arrangements
      });
      setIsSubmitting(false);
      if (res.success) onClose();
      else setError(res.error || 'Failed to update schedule');
    } else {
      const res = await addScheduleActivity(batchId, {
        activityDate: activityDate.trim(),
        activity: resolvedActivity,
        moduleId: matchedModule?.id,
        moduleCode: moduleCode.trim() || '-',
        status,
        arrangements
      });
      setIsSubmitting(false);
      if (res.success) onClose();
      else setError(res.error || 'Failed to add schedule activity');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activityToEdit ? 'Edit Schedule Activity' : 'Add Schedule Activity'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure delivery session or review milestone
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Activity Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                placeholder="07-Jan-2026 14:30 or 11-Mar-2026"
                required
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Format: DD-Mon-YYYY HH:MM (e.g. 07-Jan-2026 14:30)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Activity Type / Name <span className="text-rose-500">*</span>
            </label>
            <select
              value={activity}
              onChange={e => setActivity(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {COMMON_ACTIVITIES.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
              <option value="Custom">Custom Activity Name...</option>
            </select>
          </div>

          {activity === 'Custom' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custom Activity Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customActivity}
                onChange={e => setCustomActivity(e.target.value)}
                placeholder="Enter custom activity description"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Associated Module Code
            </label>
            <select
              value={moduleCode}
              onChange={e => setModuleCode(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="-">- (No specific module / Review session)</option>
              {modules.map(m => (
                <option key={m.id} value={m.moduleCode}>
                  {m.moduleCode} — {m.moduleName} ({m.duration})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="To be Scheduled">To be Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Arrangements
              </label>
              <select
                value={arrangements}
                onChange={e => setArrangements(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="To be Scheduled">To be Scheduled</option>
                <option value="Arranged">Arranged</option>
              </select>
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
              <span>{isSubmitting ? 'Saving...' : (activityToEdit ? 'Save Changes' : 'Add Activity')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

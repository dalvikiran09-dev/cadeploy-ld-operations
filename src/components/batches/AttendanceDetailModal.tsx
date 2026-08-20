import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { AttendanceStatus } from '../../types/batch';

interface AttendanceDetailModalProps {
  batchId: string;
  employeeCode: string;
  moduleCode: string;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  batchId,
  employeeCode,
  moduleCode,
  isOpen,
  onClose,
  readOnly = false
}) => {
  const { getBatchAttendance, saveAttendanceRecord } = useBatch();

  const [status, setStatus] = useState<AttendanceStatus>('Attended');
  const [reportedDatetime, setReportedDatetime] = useState('');
  const [intermittentExitTime, setIntermittentExitTime] = useState('');
  const [intermittentEntryTime, setIntermittentEntryTime] = useState('');
  const [completedDatetime, setCompletedDatetime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const records = getBatchAttendance(batchId);
      const existing = records.find(
        a => a.employeeCode.toUpperCase() === employeeCode.toUpperCase() && 
             a.moduleCode.toUpperCase() === moduleCode.toUpperCase()
      );

      if (existing) {
        setStatus(existing.status);
        setReportedDatetime(existing.reportedDatetime || '');
        setIntermittentExitTime(existing.intermittentExitTime || '');
        setIntermittentEntryTime(existing.intermittentEntryTime || '');
        setCompletedDatetime(existing.completedDatetime || '');
        setRemarks(existing.remarks || '');
      } else {
        setStatus('Attended');
        setReportedDatetime('');
        setIntermittentExitTime('');
        setIntermittentEntryTime('');
        setCompletedDatetime('');
        setRemarks('');
      }
    }
  }, [isOpen, batchId, employeeCode, moduleCode, getBatchAttendance]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await saveAttendanceRecord({
      batchId,
      employeeCode,
      moduleCode,
      status,
      reportedDatetime: reportedDatetime.trim() || undefined,
      intermittentExitTime: intermittentExitTime.trim() || undefined,
      intermittentEntryTime: intermittentEntryTime.trim() || undefined,
      completedDatetime: completedDatetime.trim() || undefined,
      remarks: remarks.trim() || undefined
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Attendance Record
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{employeeCode}</span> • Module <span className="font-semibold text-slate-700 dark:text-slate-300">{moduleCode}</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Attendance Status {readOnly ? '' : <span className="text-rose-500">*</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Attended', 'Absent', 'Late', 'Partial', 'Excused', 'Not Marked'] as AttendanceStatus[]).map(st => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                      isSelected
                        ? st === 'Attended'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : st === 'Absent'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : st === 'Late'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    } ${readOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reported Date/Time
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={reportedDatetime}
                onChange={e => setReportedDatetime(e.target.value)}
                placeholder={readOnly ? 'None' : '07-Jan-2026 14:28'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Completed Date/Time
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={completedDatetime}
                onChange={e => setCompletedDatetime(e.target.value)}
                placeholder={readOnly ? 'None' : '07-Jan-2026 15:32'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Intermittent Exit Time
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={intermittentExitTime}
                onChange={e => setIntermittentExitTime(e.target.value)}
                placeholder={readOnly ? 'None' : '15:00'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Intermittent Entry Time
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={intermittentEntryTime}
                onChange={e => setIntermittentEntryTime(e.target.value)}
                placeholder={readOnly ? 'None' : '15:15'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder={readOnly ? 'None' : 'e.g. Active participation, answered all questions'}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-slate-50 dark:disabled:bg-slate-850"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Record'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

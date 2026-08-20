import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  User, 
  BookOpen, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  FileText,
  Save
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useTraining } from '../../../context/TrainingContext';
import { useBatch } from '../../../context/BatchContext';
import { useApp } from '../../../context/AppContext';
import { canManageAssessments } from '../../../utils/permissionUtils';
import { AssessmentType, AssessmentResult, TrainingAssessment } from '../../../types/assessment';
import { calculatePercentage, determineResult } from '../../../utils/assessmentUtils';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeCode?: string;
  assessmentToEdit?: TrainingAssessment | null;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  employeeCode: initialEmpCode,
  assessmentToEdit
}) => {
  const { currentUser } = useApp();
  const { employees, addAssessment, updateAssessment } = useAssessment();
  const { programs, modules } = useTraining();
  const { batches } = useBatch();

  const isAuthorized = canManageAssessments(currentUser.role);

  const [employeeCode, setEmployeeCode] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Pre-Assessment');
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [maximumScore, setMaximumScore] = useState<number>(100);
  const [scoreObtained, setScoreObtained] = useState<number>(75);
  const [evaluator, setEvaluator] = useState(currentUser.name || '');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (assessmentToEdit) {
        setEmployeeCode(assessmentToEdit.employeeCode);
        setProgramCode(assessmentToEdit.programCode);
        setModuleCode(assessmentToEdit.moduleCode || '');
        setBatchCode(assessmentToEdit.batchCode || '');
        setAssessmentType(assessmentToEdit.assessmentType as AssessmentType);
        setAssessmentDate(assessmentToEdit.assessmentDate || new Date().toISOString().slice(0, 10));
        setAttemptNumber(assessmentToEdit.attemptNumber || 1);
        setMaximumScore(assessmentToEdit.maximumScore || 100);
        setScoreObtained(assessmentToEdit.scoreObtained || 0);
        setEvaluator(assessmentToEdit.evaluator || currentUser.name || '');
        setRemarks(assessmentToEdit.remarks || '');
      } else {
        setEmployeeCode(initialEmpCode || (employees[0]?.employeeCode || ''));
        setProgramCode(programs[0]?.programCode || '');
        setModuleCode(modules[0]?.moduleCode || '');
        setBatchCode(batches[0]?.batchCode || '');
        setAssessmentType('Pre-Assessment');
        setAssessmentDate(new Date().toISOString().slice(0, 10));
        setAttemptNumber(1);
        setMaximumScore(100);
        setScoreObtained(75);
        setEvaluator(currentUser.name || '');
        setRemarks('');
      }
      setError(null);
    }
  }, [isOpen, assessmentToEdit, initialEmpCode, employees, programs, modules, batches, currentUser]);

  if (!isOpen) return null;

  const currentPercentage = calculatePercentage(scoreObtained, maximumScore);
  const currentResult = determineResult(scoreObtained, maximumScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setError('You do not have permission to record assessment results.');
      return;
    }

    if (!employeeCode.trim()) {
      setError('Please select or specify an Employee ID.');
      return;
    }
    if (!programCode.trim()) {
      setError('Please select or specify a Program Code.');
      return;
    }
    if (maximumScore <= 0) {
      setError('Maximum score must be greater than zero.');
      return;
    }
    if (scoreObtained < 0 || scoreObtained > maximumScore) {
      setError(`Score obtained must be between 0 and ${maximumScore}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedEmp = employees.find(e => e.employeeCode.toUpperCase() === employeeCode.trim().toUpperCase());
    const selectedProg = programs.find(p => p.programCode.toUpperCase() === programCode.trim().toUpperCase());
    const selectedMod = modules.find(m => m.moduleCode.toUpperCase() === moduleCode.trim().toUpperCase());
    const selectedBatch = batches.find(b => b.batchCode.toUpperCase() === batchCode.trim().toUpperCase());

    const payload: Partial<TrainingAssessment> = {
      employeeCode: employeeCode.trim().toUpperCase(),
      employeeName: selectedEmp?.employeeName,
      department: selectedEmp?.department,
      programCode: programCode.trim().toUpperCase(),
      programName: selectedProg?.programName,
      programId: selectedProg?.id,
      moduleCode: moduleCode ? moduleCode.trim().toUpperCase() : undefined,
      moduleName: selectedMod?.moduleName,
      moduleId: selectedMod?.id,
      batchCode: batchCode ? batchCode.trim().toUpperCase() : undefined,
      batchId: selectedBatch?.id,
      assessmentType,
      assessmentDate,
      attemptNumber: Number(attemptNumber) || 1,
      maximumScore: Number(maximumScore),
      scoreObtained: Number(scoreObtained),
      percentage: currentPercentage,
      result: currentResult,
      evaluator: evaluator.trim() || undefined,
      remarks: remarks.trim() || undefined
    };

    let res;
    if (assessmentToEdit) {
      res = await updateAssessment(assessmentToEdit.id, payload);
    } else {
      res = await addAssessment(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save assessment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {assessmentToEdit ? 'Edit Assessment Result' : 'Record Assessment Result'}
              </h2>
              <p className="text-xs text-slate-500">
                Authorized evaluation entry with automatic score & percentage calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isAuthorized && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You are viewing in Read-Only mode. Only Trainers, L&D Leads, and Admins can record scores.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee / Trainee *
              </label>
              <select
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value)}
                disabled={!isAuthorized || !!assessmentToEdit}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.employeeCode}>
                    {e.employeeCode} - {e.employeeName} ({e.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Type *
              </label>
              <select
                value={assessmentType}
                onChange={e => setAssessmentType(e.target.value as AssessmentType)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pre-Assessment">Pre-Assessment (Initial Baseline)</option>
                <option value="Post-Assessment">Post-Assessment (Outcome Measurement)</option>
                <option value="Module Assessment">Module Assessment</option>
                <option value="Final Assessment">Final Comprehensive Assessment</option>
                <option value="Other Assessment">Other Assessment</option>
              </select>
            </div>

            {/* Program */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Training Program *
              </label>
              <select
                value={programCode}
                onChange={e => setProgramCode(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Program --</option>
                {programs.map(p => (
                  <option key={p.id} value={p.programCode}>
                    {p.programCode} - {p.programName}
                  </option>
                ))}
              </select>
            </div>

            {/* Module (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Module (Optional)
              </label>
              <select
                value={moduleCode}
                onChange={e => setModuleCode(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- All / General Program Level --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.moduleCode}>
                    {m.moduleCode} - {m.moduleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Training Batch (Optional)
              </label>
              <select
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Standalone / Unbatched --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.batchCode}>
                    {b.batchCode} - {b.programName || b.programCode}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Date *
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={e => setAssessmentDate(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Scoring Matrix Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Score & Performance Result</span>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                currentResult === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {currentResult.toUpperCase()} ({currentPercentage}%)
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Max Possible Score *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maximumScore}
                  onChange={e => setMaximumScore(Number(e.target.value))}
                  disabled={!isAuthorized}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Score Obtained *
                </label>
                <input
                  type="number"
                  min="0"
                  max={maximumScore}
                  step="0.5"
                  value={scoreObtained}
                  onChange={e => setScoreObtained(Number(e.target.value))}
                  disabled={!isAuthorized}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-blue-600 dark:text-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Attempt Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={attemptNumber}
                  onChange={e => setAttemptNumber(Number(e.target.value))}
                  disabled={!isAuthorized}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Evaluator & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Evaluator / Trainer Name
              </label>
              <input
                type="text"
                value={evaluator}
                onChange={e => setEvaluator(e.target.value)}
                disabled={!isAuthorized}
                placeholder="e.g. Kiran Dalvi"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Observation
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                disabled={!isAuthorized}
                placeholder="e.g. Excellent drawing comprehension"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {isAuthorized && (
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
                    <span>{assessmentToEdit ? 'Update Assessment' : 'Save Assessment Result'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

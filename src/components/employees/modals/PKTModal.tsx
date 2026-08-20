import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck2, 
  History, 
  Save, 
  RotateCcw
} from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { useTraining } from '../../../context/TrainingContext';
import { useBatch } from '../../../context/BatchContext';
import { useApp } from '../../../context/AppContext';
import { canManagePKT } from '../../../utils/permissionUtils';
import { TrainingPKT, PKTResult } from '../../../types/assessment';
import { calculatePercentage, determineResult } from '../../../utils/assessmentUtils';

interface PKTModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeCode?: string;
  pktToEdit?: TrainingPKT | null;
  targetAttemptNumber?: number;
}

export const PKTModal: React.FC<PKTModalProps> = ({
  isOpen,
  onClose,
  employeeCode: initialEmpCode,
  pktToEdit,
  targetAttemptNumber
}) => {
  const { currentUser } = useApp();
  const { employees, pkts, addPKT, updatePKT } = useAssessment();
  const { programs, modules } = useTraining();
  const { batches } = useBatch();

  const isAuthorized = canManagePKT(currentUser.role);

  const [employeeCode, setEmployeeCode] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [pktType, setPktType] = useState('Standard PKT');
  const [pktDate, setPktDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [maximumScore, setMaximumScore] = useState<number>(100);
  const [scoreObtained, setScoreObtained] = useState<number>(70);
  const [evaluator, setEvaluator] = useState(currentUser.name || '');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (pktToEdit) {
        setEmployeeCode(pktToEdit.employeeCode);
        setProgramCode(pktToEdit.programCode);
        setModuleCode(pktToEdit.moduleCode || '');
        setBatchCode(pktToEdit.batchCode || '');
        setPktType(pktToEdit.pktType || 'Standard PKT');
        setPktDate(pktToEdit.pktDate || new Date().toISOString().slice(0, 10));
        setAttemptNumber(pktToEdit.attemptNumber || 1);
        setMaximumScore(pktToEdit.maximumScore || 100);
        setScoreObtained(pktToEdit.scoreObtained || 0);
        setEvaluator(pktToEdit.evaluator || currentUser.name || '');
        setRemarks(pktToEdit.remarks || '');
      } else {
        const empCode = initialEmpCode || (employees[0]?.employeeCode || '');
        const prgCode = programs[0]?.programCode || '';
        const modCode = modules[0]?.moduleCode || '';
        
        setEmployeeCode(empCode);
        setProgramCode(prgCode);
        setModuleCode(modCode);
        setBatchCode(batches[0]?.batchCode || '');
        setPktType('Standard PKT');
        setPktDate(new Date().toISOString().slice(0, 10));
        
        // Calculate prior attempts
        const priorAttempts = pkts.filter(p => 
          !p.deleted && 
          p.employeeCode.toUpperCase() === empCode.toUpperCase() && 
          p.programCode.toUpperCase() === prgCode.toUpperCase()
        );
        setAttemptNumber(targetAttemptNumber || (priorAttempts.length + 1));
        setMaximumScore(100);
        setScoreObtained(75);
        setEvaluator(currentUser.name || '');
        setRemarks('');
      }
      setError(null);
    }
  }, [isOpen, pktToEdit, initialEmpCode, employees, programs, modules, batches, pkts, targetAttemptNumber, currentUser]);

  if (!isOpen) return null;

  const currentPercentage = calculatePercentage(scoreObtained, maximumScore);
  const currentResult = determineResult(scoreObtained, maximumScore);

  // Check existing attempts for employee + program
  const existingAttempts = pkts
    .filter(p => 
      !p.deleted && 
      p.employeeCode.toUpperCase() === employeeCode.toUpperCase() && 
      p.programCode.toUpperCase() === programCode.toUpperCase()
    )
    .sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setError('You do not have permission to record PKT results.');
      return;
    }

    if (!employeeCode.trim()) {
      setError('Please select an Employee.');
      return;
    }
    if (!programCode.trim()) {
      setError('Please select a Program.');
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

    const payload: Partial<TrainingPKT> = {
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
      pktType,
      pktDate,
      attemptNumber: Number(attemptNumber) || 1,
      maximumScore: Number(maximumScore),
      scoreObtained: Number(scoreObtained),
      percentage: currentPercentage,
      result: currentResult,
      evaluator: evaluator.trim() || undefined,
      remarks: remarks.trim() || undefined
    };

    let res;
    if (pktToEdit) {
      res = await updatePKT(pktToEdit.id, payload);
    } else {
      res = await addPKT(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save PKT test result');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {pktToEdit ? 'Edit PKT Attempt' : 'Record PKT (Practical / Knowledge Test)'}
              </h2>
              <p className="text-xs text-slate-500">
                Multi-attempt test evaluation with historical preservation
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

        {/* Existing Attempts History Alert */}
        {existingAttempts.length > 0 && !pktToEdit && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Prior attempts on this module: <strong>{existingAttempts.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              {existingAttempts.map((att) => (
                <span
                  key={att.id}
                  className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                    att.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  #{att.attemptNumber}: {att.percentage}% ({att.result})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee / Trainee *
              </label>
              <select
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value)}
                disabled={!isAuthorized || !!pktToEdit}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

            {/* PKT Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                PKT Evaluation Type *
              </label>
              <select
                value={pktType}
                onChange={e => setPktType(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Standard PKT">Standard PKT (Knowledge Test)</option>
                <option value="Practical Modeling Test">Practical Modeling & Detailing Test</option>
                <option value="Connection Checking Test">Connection & QA Checking Test</option>
                <option value="Fabrication Drawing Test">Fabrication Drawing Speed Test</option>
                <option value="Re-test / Remedial PKT">Re-test / Remedial PKT</option>
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

            {/* Module */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Module (Optional)
              </label>
              <select
                value={moduleCode}
                onChange={e => setModuleCode(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- All Modules / General --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.moduleCode}>
                    {m.moduleCode} - {m.moduleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Batch (Optional)
              </label>
              <select
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Standalone / Unbatched --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.batchCode}>
                    {b.batchCode} - {b.programName || b.programCode}
                  </option>
                ))}
              </select>
            </div>

            {/* PKT Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Test Date *
              </label>
              <input
                type="date"
                value={pktDate}
                onChange={e => setPktDate(e.target.value)}
                disabled={!isAuthorized}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Test Scores */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>PKT Result & Scores</span>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                currentResult === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {currentResult.toUpperCase()} ({currentPercentage}%)
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Attempt Number *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={attemptNumber}
                    onChange={e => setAttemptNumber(Number(e.target.value))}
                    disabled={!isAuthorized}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-emerald-600 dark:text-emerald-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Evaluator & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Evaluator / Lead Checker
              </label>
              <input
                type="text"
                value={evaluator}
                onChange={e => setEvaluator(e.target.value)}
                disabled={!isAuthorized}
                placeholder="e.g. Lead Tekla Specialist"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observations & Action Items
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                disabled={!isAuthorized}
                placeholder="e.g. Excellent accuracy in stairs & handrails"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              />
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
            {isAuthorized && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{pktToEdit ? 'Update PKT Test' : 'Record PKT Attempt'}</span>
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

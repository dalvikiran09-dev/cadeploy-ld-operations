import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Award,
  FileCheck2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAssessment } from '../../../context/AssessmentContext';
import { useTraining } from '../../../context/TrainingContext';
import { 
  generateAssessmentImportTemplate, 
  generatePKTImportTemplate,
  calculatePercentage,
  determineResult
} from '../../../utils/assessmentUtils';
import { AssessmentImportRow, PKTImportRow, TrainingAssessment, TrainingPKT } from '../../../types/assessment';

interface AssessmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'assessments' | 'pkts';
}

export const AssessmentImportModal: React.FC<AssessmentImportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'assessments'
}) => {
  const { employees, importAssessmentsBulk, importPKTsBulk } = useAssessment();
  const { programs, modules } = useTraining();

  const [activeType, setActiveType] = useState<'assessments' | 'pkts'>(defaultTab);
  const [assessmentRows, setAssessmentRows] = useState<AssessmentImportRow[]>([]);
  const [pktRows, setPktRows] = useState<PKTImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ success: boolean; added: number; errors: string[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setAssessmentRows([]);
    setPktRows([]);
    setFileName(null);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseExcelFile = (file: File) => {
    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          alert('The Excel file is empty or does not contain data rows.');
          return;
        }

        const headers = json[0].map((h: any) => String(h || '').trim().toLowerCase());

        if (activeType === 'assessments') {
          // Parse assessments
          const parsedAssessments: AssessmentImportRow[] = [];
          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const empCode = String(row[0] || '').trim().toUpperCase();
            const progCode = String(row[1] || '').trim().toUpperCase();
            const modCode = row[2] ? String(row[2]).trim().toUpperCase() : undefined;
            const batchCode = row[3] ? String(row[3]).trim().toUpperCase() : undefined;
            const assType = String(row[4] || 'Pre-Assessment').trim();
            const assDate = String(row[5] || new Date().toISOString().slice(0, 10)).trim();
            const attemptNum = Number(row[6] || 1);
            const maxScore = Number(row[7] || 100);
            const scoreObt = Number(row[8] || 0);
            const evaluator = row[9] ? String(row[9]).trim() : undefined;
            const remarks = row[10] ? String(row[10]).trim() : undefined;

            const errors: string[] = [];
            if (!empCode) errors.push('Missing Employee ID');
            if (!progCode) errors.push('Missing Program Code');
            if (maxScore <= 0) errors.push('Invalid Max Score');
            if (scoreObt < 0 || scoreObt > maxScore) errors.push('Score out of range');

            const pct = calculatePercentage(scoreObt, maxScore);
            const result = determineResult(scoreObt, maxScore);

            parsedAssessments.push({
              row: i + 1,
              employeeCode: empCode,
              programCode: progCode,
              moduleCode: modCode,
              batchCode: batchCode,
              assessmentType: assType,
              assessmentDate: assDate,
              attemptNumber: attemptNum,
              maximumScore: maxScore,
              scoreObtained: scoreObt,
              percentage: pct,
              result: result,
              evaluator: evaluator,
              remarks: remarks,
              isValid: errors.length === 0,
              errors: errors
            });
          }
          setAssessmentRows(parsedAssessments);
        } else {
          // Parse PKTs
          const parsedPKTs: PKTImportRow[] = [];
          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const empCode = String(row[0] || '').trim().toUpperCase();
            const progCode = String(row[1] || '').trim().toUpperCase();
            const modCode = row[2] ? String(row[2]).trim().toUpperCase() : undefined;
            const batchCode = row[3] ? String(row[3]).trim().toUpperCase() : undefined;
            const pktType = String(row[4] || 'Standard PKT').trim();
            const pktDate = String(row[5] || new Date().toISOString().slice(0, 10)).trim();
            const attemptNum = Number(row[6] || 1);
            const maxScore = Number(row[7] || 100);
            const scoreObt = Number(row[8] || 0);
            const evaluator = row[9] ? String(row[9]).trim() : undefined;
            const remarks = row[10] ? String(row[10]).trim() : undefined;

            const errors: string[] = [];
            if (!empCode) errors.push('Missing Employee ID');
            if (!progCode) errors.push('Missing Program Code');
            if (maxScore <= 0) errors.push('Invalid Max Score');
            if (scoreObt < 0 || scoreObt > maxScore) errors.push('Score out of range');

            const pct = calculatePercentage(scoreObt, maxScore);
            const result = determineResult(scoreObt, maxScore);

            parsedPKTs.push({
              row: i + 1,
              employeeCode: empCode,
              programCode: progCode,
              moduleCode: modCode,
              batchCode: batchCode,
              pktType: pktType,
              pktDate: pktDate,
              attemptNumber: attemptNum,
              maximumScore: maxScore,
              scoreObtained: scoreObt,
              percentage: pct,
              result: result,
              evaluator: evaluator,
              remarks: remarks,
              isValid: errors.length === 0,
              errors: errors
            });
          }
          setPktRows(parsedPKTs);
        }
      } catch (err: any) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = async () => {
    setIsProcessing(true);
    if (activeType === 'assessments') {
      const validPayload: Partial<TrainingAssessment>[] = assessmentRows
        .filter(r => r.isValid)
        .map(r => ({
          employeeCode: r.employeeCode,
          programCode: r.programCode,
          moduleCode: r.moduleCode,
          batchCode: r.batchCode,
          assessmentType: r.assessmentType,
          assessmentDate: r.assessmentDate,
          attemptNumber: r.attemptNumber,
          maximumScore: r.maximumScore,
          scoreObtained: r.scoreObtained,
          percentage: r.percentage,
          result: r.result,
          evaluator: r.evaluator,
          remarks: r.remarks
        }));

      const res = await importAssessmentsBulk(validPayload);
      setIsProcessing(false);
      setImportSummary({
        success: res.success,
        added: res.added,
        errors: res.errors || []
      });
    } else {
      const validPayload: Partial<TrainingPKT>[] = pktRows
        .filter(r => r.isValid)
        .map(r => ({
          employeeCode: r.employeeCode,
          programCode: r.programCode,
          moduleCode: r.moduleCode,
          batchCode: r.batchCode,
          pktType: r.pktType,
          pktDate: r.pktDate,
          attemptNumber: r.attemptNumber,
          maximumScore: r.maximumScore,
          scoreObtained: r.scoreObtained,
          percentage: r.percentage,
          result: r.result,
          evaluator: r.evaluator,
          remarks: r.remarks
        }));

      const res = await importPKTsBulk(validPayload);
      setIsProcessing(false);
      setImportSummary({
        success: res.success,
        added: res.added,
        errors: res.errors || []
      });
    }
  };

  const currentRowsCount = activeType === 'assessments' ? assessmentRows.length : pktRows.length;
  const currentValidCount = activeType === 'assessments' 
    ? assessmentRows.filter(r => r.isValid).length 
    : pktRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bulk Excel Import Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Import assessment results and PKT test attempts with validation
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

        {/* Tab Switcher & Template Downloads */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => { setActiveType('assessments'); handleReset(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeType === 'assessments'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Assessments (Pre/Post/Module)</span>
            </button>

            <button
              onClick={() => { setActiveType('pkts'); handleReset(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeType === 'pkts'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>PKTs (Practical/Knowledge Tests)</span>
            </button>
          </div>

          <button
            onClick={() => activeType === 'assessments' ? generateAssessmentImportTemplate() : generatePKTImportTemplate()}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download {activeType === 'assessments' ? 'Assessment' : 'PKT'} Template (.xlsx)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {importSummary && (
            <div className={`p-4 rounded-xl border ${
              importSummary.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {importSummary.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span>
                  {importSummary.success ? `Successfully imported ${importSummary.added} record(s) to Supabase database!` : 'Import completed with errors.'}
                </span>
              </div>
              {importSummary.errors.length > 0 && (
                <ul className="mt-2 text-xs list-disc list-inside space-y-0.5 text-red-700 dark:text-red-400">
                  {importSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {currentRowsCount === 0 ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    parseExcelFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Choose Excel file or drag & drop here
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Supported formats: <strong>.xlsx, .xls</strong>. Ensure columns match the downloaded template format.
              </p>
            </div>
          ) : (
            /* Preview Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">File: {fileName}</span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {currentValidCount} / {currentRowsCount} Valid Rows
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose another file</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-[360px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Employee ID</th>
                      <th className="p-2.5">Program Code</th>
                      <th className="p-2.5">Module</th>
                      <th className="p-2.5">{activeType === 'assessments' ? 'Type' : 'PKT Type'}</th>
                      <th className="p-2.5">Attempt #</th>
                      <th className="p-2.5">Score</th>
                      <th className="p-2.5">Result</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeType === 'assessments' ? (
                      assessmentRows.map((r) => (
                        <tr key={r.row} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/40 text-red-700'}>
                          <td className="p-2.5 font-mono text-2xs">{r.row}</td>
                          <td className="p-2.5 font-bold">{r.employeeCode}</td>
                          <td className="p-2.5">{r.programCode}</td>
                          <td className="p-2.5 text-slate-500">{r.moduleCode || '-'}</td>
                          <td className="p-2.5">{r.assessmentType}</td>
                          <td className="p-2.5 font-mono">#{r.attemptNumber}</td>
                          <td className="p-2.5 font-bold">
                            {r.scoreObtained}/{r.maximumScore} ({r.percentage}%)
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                              r.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {r.result}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {r.isValid ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold flex items-center gap-1" title={r.errors.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" /> {r.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      pktRows.map((r) => (
                        <tr key={r.row} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/40 text-red-700'}>
                          <td className="p-2.5 font-mono text-2xs">{r.row}</td>
                          <td className="p-2.5 font-bold">{r.employeeCode}</td>
                          <td className="p-2.5">{r.programCode}</td>
                          <td className="p-2.5 text-slate-500">{r.moduleCode || '-'}</td>
                          <td className="p-2.5">{r.pktType}</td>
                          <td className="p-2.5 font-mono">#{r.attemptNumber}</td>
                          <td className="p-2.5 font-bold">
                            {r.scoreObtained}/{r.maximumScore} ({r.percentage}%)
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                              r.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {r.result}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {r.isValid ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold flex items-center gap-1" title={r.errors.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" /> {r.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {currentRowsCount > 0 && (
            <button
              onClick={handleCommitImport}
              disabled={isProcessing || currentValidCount === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing into Supabase...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Import {currentValidCount} Valid Records</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

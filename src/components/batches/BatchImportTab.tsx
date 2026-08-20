import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download, 
  Layers, 
  Calendar, 
  Users, 
  Check, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { parseBatchExcelWorkbook, generateSampleBatchTemplate } from '../../utils/batchUtils';
import { BatchImportParseResult } from '../../types/batch';

export const BatchImportTab: React.FC = () => {
  const { executeBatchImport, setActiveSubTab, setSelectedBatchId, batches } = useBatch();
  const { programs } = useTraining();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseResult, setParseResult] = useState<BatchImportParseResult | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please upload a valid Excel workbook (.xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseResult(null);
    setImportSuccessMessage(null);

    try {
      const result = await parseBatchExcelWorkbook(file, batches);
      setParseResult(result);
    } catch (err: any) {
      alert(`Error parsing Excel file: ${err.message || 'Invalid format'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult || !selectedFile) return;

    setIsImporting(true);
    const res = await executeBatchImport(parseResult, selectedFile.name, 'Admin');
    setIsImporting(false);

    if (res.success) {
      const log = res.importLog;
      const bCount = log ? (log.newBatches + log.updatedBatches) : parseResult.batches.length;
      const sCount = log ? log.schedulesAdded : parseResult.schedules.length;
      const nCount = log ? log.nomineesAdded : parseResult.nominees.length;
      const aCount = log ? log.attendanceRecordsAdded : parseResult.attendance.length;

      setImportSuccessMessage(`Successfully imported ${bCount} batch(es), ${sCount} schedule activities, ${nCount} nominees, and ${aCount} attendance records!`);
    } else {
      alert(`Import failed: ${res.error}`);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setImportSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Description & Download Template */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel Batch Import Wizard</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Import full training batches, schedule activities, employee nominations, and attendance records from multi-sheet Excel files (matching standard structure: <strong>BatchData</strong>, <strong>BatchSchedule</strong>, <strong>NominationData</strong>, <strong>Attendance</strong>).
          </p>
        </div>

        <button
          onClick={() => generateSampleBatchTemplate(programs)}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-2xs shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Download Excel Template (.xlsx)</span>
        </button>
      </div>

      {/* Success Notification */}
      {importSuccessMessage && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-xs animate-in fade-in zoom-in duration-150">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Import Complete!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                {importSuccessMessage}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setActiveSubTab('list')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>View All Batches</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                >
                  Import Another File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box (When not yet parsed or importing new) */}
      {!parseResult && !importSuccessMessage && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {isParsing ? 'Parsing Excel Workbook...' : 'Click to browse or drag & drop Excel file'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
            Upload your training batch workbook (e.g. <strong>BTCH0000000002.xlsx</strong>). The wizard will validate the 4 sheets before importing.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              .XLSX Format
            </span>
            <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              4 Sheets Required
            </span>
            <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Instant Validation
            </span>
          </div>
        </div>
      )}

      {/* Parse Preview Card & Approval */}
      {parseResult && !importSuccessMessage && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Preview: {selectedFile?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review extracted records before finalizing import to Supabase
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Cancel and choose another file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Preview Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Batches</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{parseResult.batches.length}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {parseResult.batches.map(b => b.batchCode).join(', ')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Schedule Sessions</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{parseResult.schedules.length}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Delivery & Review sessions
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Nominees</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{parseResult.nominees.length}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Nominated employees
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Attendance</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{parseResult.attendance.length}</div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Matrix attendance entries
                </span>
              </div>
            </div>

            {/* Batch Data Preview Table */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Batches to Import ({parseResult.batches.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  One row per batch
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Batch Code</th>
                      <th className="px-3.5 py-2.5">Program Code</th>
                      <th className="px-3.5 py-2.5">Schedule Code</th>
                      <th className="px-3.5 py-2.5">Location</th>
                      <th className="px-3.5 py-2.5">Facilitator</th>
                      <th className="px-3.5 py-2.5 text-center">Head Count</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {parseResult.batches.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3.5 py-2.5 font-bold font-mono text-slate-900 dark:text-white">
                          {b.batchCode}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {b.programCode || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-500">
                          {b.scheduleCode || '-'}
                        </td>
                        <td className="px-3.5 py-2.5">
                          {b.batchLocation || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {b.facilitatorCode || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                          {b.headCount}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {b.status || 'In Progress'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {b.isExisting ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              Will Update
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              New Batch
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings or Errors */}
            {parseResult.warnings && parseResult.warnings.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Validation Warnings ({parseResult.warnings.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {parseResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={isImporting || parseResult.batches.length === 0}
                className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isImporting ? 'Importing to Database...' : 'Confirm & Import to System'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

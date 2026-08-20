import React, { useState, useRef } from 'react';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { ParsedImportData, TrainingImportLog } from '../../types/training';
import { 
  parseTrainingExcelFile, 
  generateTrainingSampleExcel, 
  downloadImportLogFile, 
  formatDurationDisplay 
} from '../../utils/trainingUtils';
import { exportTrainingManagementToExcel } from '../../utils/trainingExportUtils';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  FolderKanban, 
  BookOpen, 
  Layers, 
  Check, 
  Sparkles,
  Eye,
  Info,
  FileDown,
  Loader2
} from 'lucide-react';

interface ExcelImportWizardProps {
  onNavigateToTab?: (tab: 'programs' | 'modules' | 'courses') => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ onNavigateToTab }) => {
  const { programs, modules, courses, importLogs, executeImport } = useTraining();
  const { currentUser } = useApp();

  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip'>('update');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResultLog, setImportResultLog] = useState<TrainingImportLog | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'programs' | 'modules' | 'courses'>('programs');
  const [previewSearch, setPreviewSearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop / select
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Please upload a valid Excel file (.xlsx or .xls).');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);

    try {
      const result = await parseTrainingExcelFile(selectedFile, programs, modules, courses);
      setParsedData(result);
      setIsParsing(false);
      setStep(2); // Move to Preview & Validation step
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setParseError(err.message || 'Failed to read and parse Excel file.');
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const blob = await generateTrainingSampleExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CADEPLOY_Training_Management_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download template:', e);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData || !file) return;

    setIsImporting(true);
    try {
      const res = await executeImport(
        parsedData,
        duplicateStrategy,
        file.name,
        currentUser.name || 'Admin'
      );

      setIsImporting(false);
      if (res.success && res.log) {
        setImportResultLog(res.log);
        setStep(3); // Result summary step
      } else {
        setParseError(res.error || 'Import failed.');
      }
    } catch (err: any) {
      setIsImporting(false);
      setParseError(err.message || 'An error occurred during import execution.');
    }
  };

  const resetWizard = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    setImportResultLog(null);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const errors = parsedData?.issues.filter(i => i.type === 'error') || [];
  const warnings = parsedData?.issues.filter(i => i.type === 'warning') || [];

  const newProgramsCount = parsedData?.programs.filter(p => !p.isExisting).length || 0;
  const updateProgramsCount = parsedData?.programs.filter(p => p.isExisting).length || 0;

  const newModulesCount = parsedData?.modules.filter(m => !m.isExisting).length || 0;
  const updateModulesCount = parsedData?.modules.filter(m => m.isExisting).length || 0;

  const newCoursesCount = parsedData?.courses.filter(c => !c.isExisting).length || 0;
  const updateCoursesCount = parsedData?.courses.filter(c => c.isExisting).length || 0;

  return (
    <div className="space-y-6" id="training-excel-import-wizard">
      {/* Wizard Progress Stepper */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 1
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : step > 1
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Upload</div>
              <div className="text-[10px] text-slate-400">Select .xlsx file</div>
            </div>
          </div>

          <div className={`h-0.5 flex-1 mx-4 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : step > 2
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Validation & Diff</div>
              <div className="text-[10px] text-slate-400">Preview & resolve</div>
            </div>
          </div>

          <div className={`h-0.5 flex-1 mx-4 ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 3
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {step === 3 ? <Sparkles className="w-4 h-4" /> : '3'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Summary</div>
              <div className="text-[10px] text-slate-400">Execution results</div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto text-center space-y-6">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Import Training Curriculum via Excel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload your structured spreadsheet containing Programs, Modules, and Course Delivery mappings.
            </p>
          </div>

          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-center gap-2 text-left max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-10 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mx-auto transition-colors mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & Drop your Excel workbook here, or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Microsoft Excel (.xlsx, .xls) files with multi-entity columns
            </p>

            {isParsing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading and validating worksheets...</span>
              </div>
            )}
          </div>

          {/* Sample Template Download & Full Export helper */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-left">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Need the standard columns structure or current snapshot?</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-wizard-download-sample"
                onClick={handleDownloadSample}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Sample Template (.xlsx)</span>
              </button>

              <button
                id="btn-wizard-export-current"
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    await exportTrainingManagementToExcel(programs, modules, courses, importLogs);
                  } catch (e) {
                    console.error('Export error in wizard:', e);
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>Export Current Data (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & VALIDATION */}
      {step === 2 && parsedData && (
        <div className="space-y-6">
          {/* File Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {file?.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready for database synchronization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={resetWizard}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel / Re-upload
              </button>
            </div>
          </div>

          {/* Counts & Diff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Programs Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-700 dark:text-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                  Programs ({parsedData.programs.length})
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>New to Add:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{newProgramsCount}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Existing / Updates:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{updateProgramsCount}</span>
                </div>
              </div>
            </div>

            {/* Modules Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-700 dark:text-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Modules ({parsedData.modules.length})
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>New to Add:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{newModulesCount}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Existing / Updates:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{updateModulesCount}</span>
                </div>
              </div>
            </div>

            {/* Courses Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-slate-700 dark:text-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Courses ({parsedData.courses.length})
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>New Mappings:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{newCoursesCount}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Existing / Updates:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{updateCoursesCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parsed Records Preview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('programs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewTab === 'programs'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Programs ({parsedData.programs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('modules')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewTab === 'modules'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Modules ({parsedData.modules.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('courses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewTab === 'courses'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Courses ({parsedData.courses.length})</span>
                </button>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder={`Search ${previewTab}...`}
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Programs Table */}
            {previewTab === 'programs' && (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Row</th>
                      <th className="py-2.5 px-3">Program Code</th>
                      <th className="py-2.5 px-3">Program Name</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {parsedData.programs
                      .filter(p => {
                        const q = previewSearch.toLowerCase();
                        if (!q) return true;
                        return p.programCode.toLowerCase().includes(q) || p.programName.toLowerCase().includes(q);
                      })
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{p.row}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.programCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            {p.programName ? (
                              p.programName
                            ) : (
                              <span className="text-amber-500 italic font-normal">Missing Name</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{p.programDescription || '—'}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {p.isExisting ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                Will Update
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                New Program
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modules Table */}
            {previewTab === 'modules' && (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Row</th>
                      <th className="py-2.5 px-3">Module Code</th>
                      <th className="py-2.5 px-3">Module Name</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Delivery Mode</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {parsedData.modules
                      .filter(m => {
                        const q = previewSearch.toLowerCase();
                        if (!q) return true;
                        return m.moduleCode.toLowerCase().includes(q) || m.moduleName.toLowerCase().includes(q);
                      })
                      .map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{m.row}</td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.moduleCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{m.moduleName}</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{formatDurationDisplay(m.duration)}</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{m.deliveryMode}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {m.isExisting ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                Will Update
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                New Module
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Courses Table */}
            {previewTab === 'courses' && (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Row</th>
                      <th className="py-2.5 px-3">Course Code</th>
                      <th className="py-2.5 px-3">Program Code</th>
                      <th className="py-2.5 px-3">Module Code</th>
                      <th className="py-2.5 px-3 text-center">Day</th>
                      <th className="py-2.5 px-3">Delivery Mode</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {parsedData.courses
                      .filter(c => {
                        const q = previewSearch.toLowerCase();
                        if (!q) return true;
                        return c.courseCode.toLowerCase().includes(q) || c.programCode.toLowerCase().includes(q) || c.moduleCode.toLowerCase().includes(q);
                      })
                      .map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{c.row}</td>
                          <td className="py-2 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">{c.courseCode}</td>
                          <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">{c.programCode}</td>
                          <td className="py-2 px-3 font-mono text-indigo-600 dark:text-indigo-400">{c.moduleCode}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Day {c.deliveryDay}</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{c.deliveryMode1}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {c.courseStatus}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {c.isExisting ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                Will Update
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                New Course
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Validation Issues / Warnings List */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Validation Alerts ({errors.length} Errors, {warnings.length} Warnings)</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {errors.map((err, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Row {err.row} ({err.entity}):</strong> {err.message}</span>
                  </div>
                ))}

                {warnings.map((warn, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Row {warn.row} ({warn.entity}):</strong> {warn.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Resolution Strategy */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Duplicate Record Handling Policy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                duplicateStrategy === 'update'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="dupStrategy"
                  checked={duplicateStrategy === 'update'}
                  onChange={() => setDuplicateStrategy('update')}
                  className="mt-0.5 text-blue-600"
                />
                <div className="text-xs">
                  <div className="font-bold">Update Existing Records (Recommended)</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Overwrites matching Program, Module, and Course codes with updated Excel fields.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                duplicateStrategy === 'skip'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="dupStrategy"
                  checked={duplicateStrategy === 'skip'}
                  onChange={() => setDuplicateStrategy('skip')}
                  className="mt-0.5 text-blue-600"
                />
                <div className="text-xs">
                  <div className="font-bold">Skip Existing Records</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Only inserts brand new Program, Module, and Course codes.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={resetWizard}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={isImporting || errors.length > 0}
              className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Import to Supabase...</span>
                </>
              ) : (
                <>
                  <span>Execute Import</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT SUMMARY */}
      {step === 3 && importResultLog && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Import Completed Successfully!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              File: <span className="font-semibold text-slate-800 dark:text-slate-200">{importResultLog.fileName}</span>
            </p>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-slate-400">Programs</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                +{importResultLog.programsAdded}
              </div>
              <div className="text-[10px] text-slate-500">{importResultLog.programsUpdated} updated</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-slate-400">Modules</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                +{importResultLog.modulesAdded}
              </div>
              <div className="text-[10px] text-slate-500">{importResultLog.modulesUpdated} updated</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="text-slate-400">Courses</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                +{importResultLog.coursesAdded}
              </div>
              <div className="text-[10px] text-slate-500">{importResultLog.coursesUpdated} updated</div>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('programs')}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <FolderKanban className="w-4 h-4" />
              <span>View Programs</span>
            </button>

            <button
              onClick={() => onNavigateToTab && onNavigateToTab('modules')}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Modules</span>
            </button>

            <button
              onClick={() => onNavigateToTab && onNavigateToTab('courses')}
              className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>View Courses</span>
            </button>

            <button
              id="btn-wizard-download-import-log"
              onClick={() => downloadImportLogFile(importResultLog)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Import Log</span>
            </button>

            <button
              id="btn-wizard-export-full-excel"
              onClick={async () => {
                setIsExporting(true);
                try {
                  await exportTrainingManagementToExcel(programs, modules, courses, importLogs);
                } catch (e) {
                  console.error('Export error in wizard:', e);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Export Updated Report (.xlsx)</span>
            </button>

            <button
              id="btn-wizard-import-another"
              onClick={resetWizard}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 flex items-center gap-1.5 transition-opacity"
            >
              <span>Import Another File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Info, 
  Check, 
  Filter, 
  Search, 
  ShieldAlert,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAssessment } from '../../../context/AssessmentContext';
import { useApp } from '../../../context/AppContext';
import { 
  detectColumnMapping, 
  parseRawEmployeeRows, 
  downloadSampleHREmployeeMasterTemplate,
  cleanHeaderString
} from '../../../utils/employeeImportUtils';
import { 
  EmployeeColumnMapping, 
  EmployeeImportRow, 
  EmployeeImportResult 
} from '../../../types/assessment';

interface EmployeeMasterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result';

export const EmployeeMasterImportModal: React.FC<EmployeeMasterImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { employees, importEmployeesBulk } = useAssessment();
  const { currentUser } = useApp();

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<EmployeeColumnMapping>({
    employeeCode: '',
    employeeName: '',
    department: '',
    designation: '',
    location: '',
    email: '',
    joiningDate: ''
  });
  const [autoDetectedMapping, setAutoDetectedMapping] = useState<EmployeeColumnMapping | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<EmployeeImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Preview filtering & search
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'insert' | 'update' | 'error'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setStep('upload');
    setFileName(null);
    setRawHeaders([]);
    setRawDataRows([]);
    setColumnMapping({
      employeeCode: '',
      employeeName: '',
      department: '',
      designation: '',
      location: '',
      email: '',
      joiningDate: ''
    });
    setAutoDetectedMapping(null);
    setImportResult(null);
    setPreviewFilter('all');
    setPreviewSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseExcelFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Grab first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to 2D array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rawRows || rawRows.length === 0) {
          alert('The uploaded Excel file appears to be empty.');
          setIsProcessing(false);
          return;
        }

        // Find header row (the first row with at least 2 non-empty string values)
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, rawRows.length); i++) {
          const nonEmpties = (rawRows[i] || []).filter(c => String(c || '').trim() !== '');
          if (nonEmpties.length >= 2) {
            headerRowIdx = i;
            break;
          }
        }

        const headers: string[] = (rawRows[headerRowIdx] || []).map((h, i) => {
          const val = String(h || '').trim();
          return val || `Column_${i + 1}`;
        });

        const dataRows = rawRows.slice(headerRowIdx + 1);

        setRawHeaders(headers);
        setRawDataRows(dataRows);

        // Auto-detect mapping
        const { mapping } = detectColumnMapping(headers);
        setColumnMapping(mapping);
        setAutoDetectedMapping(mapping);

        setIsProcessing(false);
        setStep('mapping');
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseExcelFile(e.target.files[0]);
    }
  };

  // Compute parsed rows based on current columnMapping
  const parsedData = useMemo(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return {
        parsedRows: [] as EmployeeImportRow[],
        totalRead: 0,
        validCount: 0,
        insertCount: 0,
        updateCount: 0,
        errorCount: 0
      };
    }
    return parseRawEmployeeRows(rawHeaders, rawDataRows, columnMapping, employees);
  }, [rawHeaders, rawDataRows, columnMapping, employees]);

  // Unmapped / Extra columns
  const unmappedColumns = useMemo(() => {
    const mappedValues = new Set(Object.values(columnMapping).filter(Boolean));
    return rawHeaders.filter(h => !mappedValues.has(h));
  }, [rawHeaders, columnMapping]);

  // Filtered rows for preview
  const previewRows = useMemo(() => {
    return parsedData.parsedRows.filter(row => {
      if (previewFilter === 'valid' && !row.isValid) return false;
      if (previewFilter === 'insert' && row.action !== 'insert') return false;
      if (previewFilter === 'update' && row.action !== 'update') return false;
      if (previewFilter === 'error' && row.isValid) return false;

      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        const match = 
          row.employeeCode.toLowerCase().includes(q) ||
          row.employeeName.toLowerCase().includes(q) ||
          (row.department && row.department.toLowerCase().includes(q)) ||
          (row.designation && row.designation.toLowerCase().includes(q)) ||
          (row.location && row.location.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [parsedData.parsedRows, previewFilter, previewSearch]);

  const handleProceedToPreview = () => {
    if (!columnMapping.employeeCode) {
      alert('Please map the Employee ID / Code column before continuing.');
      return;
    }
    if (!columnMapping.employeeName) {
      alert('Please map the Employee Name column before continuing.');
      return;
    }
    setStep('preview');
  };

  const handleExecuteImport = async () => {
    const validRows = parsedData.parsedRows.filter(r => r.isValid);
    if (!validRows.length) {
      alert('There are no valid employee records to import.');
      return;
    }

    setIsProcessing(true);

    const payload = validRows.map(r => ({
      employeeCode: r.employeeCode,
      employeeName: r.employeeName,
      department: r.department,
      designation: r.designation,
      location: r.location,
      email: r.email,
      joiningDate: r.joiningDate,
      status: r.status
    }));

    try {
      const result = await importEmployeesBulk(
        payload,
        fileName || 'HR_Employee_Master.xlsx',
        currentUser.name || 'L&D Admin'
      );

      // Merge unmapped headers info
      result.unmappedColumns = unmappedColumns;
      setImportResult(result);
      setStep('result');
    } catch (err: any) {
      console.error('Import execution error:', err);
      alert('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                HR Employee Master Excel Import
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Adaptive Mapping
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Import and sync raw HR employee lists, update existing profiles, and preserve custom columns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 ${step === 'upload' ? 'text-blue-600 dark:text-blue-400 font-bold' : step !== 'upload' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'upload' ? 'bg-blue-600 text-white' : step !== 'upload' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                {step !== 'upload' ? '✓' : '1'}
              </span>
              <span>1. Upload File</span>
            </div>
            <span className="text-slate-300">›</span>

            <div className={`flex items-center gap-1.5 ${step === 'mapping' ? 'text-blue-600 dark:text-blue-400 font-bold' : step === 'preview' || step === 'result' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'mapping' ? 'bg-blue-600 text-white' : step === 'preview' || step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                {step === 'preview' || step === 'result' ? '✓' : '2'}
              </span>
              <span>2. Column Mapping</span>
            </div>
            <span className="text-slate-300">›</span>

            <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-blue-600 dark:text-blue-400 font-bold' : step === 'result' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-blue-600 text-white' : step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                {step === 'result' ? '✓' : '3'}
              </span>
              <span>3. Preview & Validation</span>
            </div>
            <span className="text-slate-300">›</span>

            <div className={`flex items-center gap-1.5 ${step === 'result' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'result' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                4
              </span>
              <span>4. Results</span>
            </div>
          </div>

          {fileName && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate max-w-[200px]">{fileName}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop Zone */}
              <div
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Upload HR Employee Master Excel Sheet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Drag and drop your HR file here or click to browse. Supports Excel (.xlsx, .xls) and CSV.
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Supports arbitrary column names, extra columns, & multi-line text</span>
                </div>
              </div>

              {/* Sample Template & Format Support Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-600" />
                      Sample HR Master Template
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSampleHREmployeeMasterTemplate();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .xlsx
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Includes sample raw HR columns (e.g. <code>EmployeeCode</code>, <code>EmployeeLocation</code>, <code>DepartmentName</code>, <code>RoleName</code>, <code>EmployeeName</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-1.5">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Flexible Import Engine
                  </span>
                  <ul className="text-[11px] text-blue-800/80 dark:text-blue-300/80 space-y-1 list-disc list-inside">
                    <li>Matches existing employees by <strong>Employee Code</strong> to update profiles.</li>
                    <li>Ignores extra HR columns without rejecting rows.</li>
                    <li>Normalizes multi-line and wrapped cell values cleanly.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-blue-950 dark:text-blue-200">
                  <p className="font-bold">Column Auto-Detection Completed</p>
                  <p className="text-blue-800 dark:text-blue-300">
                    We inspected your Excel headers and suggested target matches below. Review and adjust any dropdowns if necessary.
                  </p>
                </div>
              </div>

              {/* Mapping Form Grid */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Target Application Fields & Source Column Selection
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee Code (Required) */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        Employee ID / Code
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {columnMapping.employeeCode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Unique identifier for upserting records</p>
                    <select
                      value={columnMapping.employeeCode}
                      onChange={e => setColumnMapping(prev => ({ ...prev, employeeCode: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Source Column --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Name (Required) */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        Employee Name
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {columnMapping.employeeName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Full name of the employee or trainee</p>
                    <select
                      value={columnMapping.employeeName}
                      onChange={e => setColumnMapping(prev => ({ ...prev, employeeName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Source Column --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Department / Business Unit
                      </label>
                      {columnMapping.department && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">e.g. Tekla, PEMB, QA, Rebar, TA, Sales</p>
                    <select
                      value={columnMapping.department}
                      onChange={e => setColumnMapping(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">(None / Do Not Map)</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Role / Designation */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Role / Designation
                      </label>
                      {columnMapping.designation && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">e.g. Sales Manager, Tekla Modeler, Trainee</p>
                    <select
                      value={columnMapping.designation}
                      onChange={e => setColumnMapping(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">(None / Do Not Map)</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Location */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Employee Location / Office
                      </label>
                      {columnMapping.location && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">e.g. Hyderabad, Chennai, Site</p>
                    <select
                      value={columnMapping.location}
                      onChange={e => setColumnMapping(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">(None / Do Not Map)</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Official Email */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Official Email
                      </label>
                      {columnMapping.email && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Corporate communication email</p>
                    <select
                      value={columnMapping.email || ''}
                      onChange={e => setColumnMapping(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">(None / Do Not Map)</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Unmapped / Extra Columns Informative Box */}
              {unmappedColumns.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Additional Source Columns ({unmappedColumns.length})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    These columns exist in your HR file but are not mapped to core employee fields. They will be safely ignored without rejecting any rows:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unmappedColumns.map(col => (
                      <span key={col} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-mono">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                  onClick={() => setPreviewFilter('all')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'all' 
                      ? 'bg-slate-900 dark:bg-slate-750 text-white border-slate-900' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-medium opacity-80">Total Read</div>
                  <div className="text-xl font-black mt-0.5">{parsedData.totalRead}</div>
                </div>

                <div 
                  onClick={() => setPreviewFilter('insert')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'insert' 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Will Add (New)</div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{parsedData.insertCount}</div>
                </div>

                <div 
                  onClick={() => setPreviewFilter('update')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'update' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 hover:border-blue-300'
                  }`}
                >
                  <div className="text-[11px] font-medium text-blue-800 dark:text-blue-300">Will Update (Existing)</div>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{parsedData.updateCount}</div>
                </div>

                <div 
                  onClick={() => setPreviewFilter('error')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'error' 
                      ? 'bg-rose-600 text-white border-rose-600' 
                      : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 hover:border-rose-300'
                  }`}
                >
                  <div className="text-[11px] font-medium text-rose-800 dark:text-rose-300">Invalid Rows</div>
                  <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{parsedData.errorCount}</div>
                </div>
              </div>

              {/* Error Callout if any */}
              {parsedData.errorCount > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                    <p className="font-bold">
                      {parsedData.errorCount} row(s) have missing required fields and will be skipped.
                    </p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Every imported employee must have a non-empty <strong>Employee Code</strong> and <strong>Employee Name</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Search & Filter Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={e => setPreviewSearch(e.target.value)}
                    placeholder="Search in preview rows..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="text-xs text-slate-500">
                  Showing <strong>{previewRows.length}</strong> of {parsedData.totalRead} rows
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">Row</th>
                        <th className="py-2.5 px-3">Emp Code</th>
                        <th className="py-2.5 px-3">Employee Name</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Role / Designation</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3 text-right">Status / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {previewRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No records found matching current filter.
                          </td>
                        </tr>
                      ) : (
                        previewRows.map((row) => (
                          <tr 
                            key={row.row}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              !row.isValid ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {row.row}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {row.employeeCode || <span className="text-rose-500 italic font-normal">Missing</span>}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {row.employeeName || <span className="text-rose-500 italic font-normal">Missing</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {row.department || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {row.designation || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {row.location || '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.action === 'insert' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                  <Check className="w-2.5 h-2.5" />
                                  Add New
                                </span>
                              )}
                              {row.action === 'update' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  Update
                                </span>
                              )}
                              {row.action === 'error' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" title={row.errors.join(', ')}>
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  {row.errors[0] || 'Invalid'}
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
            </div>
          )}

          {/* STEP 4: RESULT */}
          {step === 'result' && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Employee Master Synchronization Completed
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Employee Master data has been saved to the database and updated in the application state.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-500">Rows Read</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {importResult.rowsRead}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Added New</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {importResult.added}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">Updated</div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {importResult.updated}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-500">Failed / Skipped</div>
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                    {importResult.failed + importResult.skipped}
                  </div>
                </div>
              </div>

              {/* Errors list if any */}
              {importResult.errors.length > 0 && (
                <div className="text-left bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-xl p-4 max-w-2xl mx-auto space-y-2">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Failed Rows Report ({importResult.errors.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                        Row {err.row}: {err.error} {err.reason ? `(${err.reason})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Column Mapping</span>
              </button>
            )}

            {step === 'result' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Import Another File</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {step === 'result' ? 'Close' : 'Cancel'}
            </button>

            {step === 'mapping' && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                disabled={isProcessing || parsedData.validCount === 0}
                onClick={handleExecuteImport}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Import {parsedData.validCount} Employee Records</span>
                  </>
                )}
              </button>
            )}

            {step === 'result' && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                Done & View Directory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

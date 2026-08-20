import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTraining } from '../../context/TrainingContext';
import { useBatch } from '../../context/BatchContext';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';
import { formatDuration } from '../../utils/formatters';
import { TASK_CATEGORIES } from '../../types';
import { 
  getTasksForReportPeriod, 
  calculateReportMetrics, 
  calculateCategoryAnalysis, 
  calculateAssigneeAnalysis, 
  calculateStatusAnalysis, 
  calculateTimeAnalysis, 
  calculateTrainingReportMetrics,
  exportConsolidatedReportToExcel,
  exportConsolidatedReportToPDF,
  ReportPeriodType,
  ReportFilterOptions
} from '../../utils/reportUtils';
import { PdfReportPreview } from './PdfReportPreview';
import { TrainingReportSection } from './TrainingReportSection';
import { 
  FileText, Download, Printer, Filter, Calendar, BarChart2, 
  CheckCircle2, AlertTriangle, Layers, Users, Clock, ShieldCheck, 
  RefreshCw, ChevronRight, FileSpreadsheet, ArrowUpRight, GraduationCap,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const renderCategoryTickLines = (text: string): string[] => {
  if (!text) return [];
  const parenIndex = text.indexOf('(');
  if (parenIndex !== -1) {
    const mainTitle = text.substring(0, parenIndex).trim();
    const subText = text.substring(parenIndex + 1, text.length - (text.endsWith(')') ? 1 : 0)).trim();
    
    const subItems = subText.split(/,\s*/);
    const lines: string[] = [mainTitle];
    if (subItems.length > 0) {
      let currentSub = '(' + subItems[0];
      for (let i = 1; i < subItems.length; i++) {
        if ((currentSub + ', ' + subItems[i]).length <= 22) {
          currentSub += ', ' + subItems[i];
        } else {
          lines.push(currentSub + ',');
          currentSub = subItems[i];
        }
      }
      lines.push(currentSub + ')');
    }
    return lines;
  }

  const words = text.split(/\s+/);
  if (words.length === 1) return [text];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= 18) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const CustomCategoryTick = (props: any) => {
  const { x, y, payload } = props;
  const rawText: string = payload?.value || '';
  const lines = renderCategoryTickLines(rawText);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={8}
        textAnchor="middle"
        className="fill-slate-600 dark:fill-slate-300"
        fontSize={9}
        fontWeight={500}
      >
        {lines.map((line, idx) => (
          <tspan x={0} dy={idx === 0 ? 8 : 10} key={idx}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export const ReportsView: React.FC = () => {
  const { tasks, users, currentUser, settings } = useApp();
  const { programs, modules, courses } = useTraining();
  const { batches, schedules, nominees, attendance } = useBatch();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4

  // Shared Report Period States
  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarter);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
  );

  // Secondary Task Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>('All');

  // Report Generation Trigger State
  const [activeFilterOptions, setActiveFilterOptions] = useState<ReportFilterOptions>({
    periodType: 'monthly',
    year: currentYear,
    month: currentMonth,
    quarter: currentQuarter,
    customStartDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
    customEndDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
    categoryFilter: 'All',
    statusFilter: 'All',
    priorityFilter: 'All',
    assignedUserFilter: 'All'
  });

  const [hasGenerated, setHasGenerated] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [generatedTimestamp, setGeneratedTimestamp] = useState<string>(new Date().toLocaleString());

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportNotification, setExportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGenerateReport = () => {
    try {
      setIsGenerating(true);
      setReportError(null);
      setExportNotification(null);

      console.log("===== CONSOLIDATED REPORT GENERATION =====");
      console.log("Period:", periodType);
      console.log("Selected year:", selectedYear);
      console.log("Selected month:", selectedMonth);
      console.log("Selected quarter:", selectedQuarter);

      const filterOpts: ReportFilterOptions = {
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter,
        customStartDate,
        customEndDate,
        categoryFilter,
        statusFilter,
        priorityFilter,
        assignedUserFilter
      };

      const { filteredTasks: resTasks, periodRange: resRange } = getTasksForReportPeriod(tasks, filterOpts);

      setActiveFilterOptions(filterOpts);
      setHasGenerated(true);
      setGeneratedTimestamp(new Date().toLocaleString());

      console.log("CONSOLIDATED REPORT GENERATION SUCCESS", {
        periodRange: resRange.label,
        tasksCount: resTasks.length
      });
    } catch (error: any) {
      console.error("REPORT GENERATION FAILED", error);
      setReportError("Unable to generate consolidated report. Check the browser console for details.");
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 300);
    }
  };

  // Perform task calculations based on active filters
  const { filteredTasks, periodRange } = useMemo(() => {
    return getTasksForReportPeriod(tasks, activeFilterOptions);
  }, [tasks, activeFilterOptions]);

  const metrics = useMemo(() => {
    return calculateReportMetrics(filteredTasks, currentUser.id, currentUser.name);
  }, [filteredTasks, currentUser]);

  const categoryAnalysis = useMemo(() => {
    return calculateCategoryAnalysis(filteredTasks);
  }, [filteredTasks]);

  const assigneeAnalysis = useMemo(() => {
    return calculateAssigneeAnalysis(filteredTasks, users);
  }, [filteredTasks, users]);

  const statusAnalysis = useMemo(() => {
    return calculateStatusAnalysis(filteredTasks);
  }, [filteredTasks]);

  const timeAnalysis = useMemo(() => {
    return calculateTimeAnalysis(filteredTasks, activeFilterOptions);
  }, [filteredTasks, activeFilterOptions]);

  // Training metrics calculation
  const trainingData = useMemo(() => {
    return calculateTrainingReportMetrics(
      programs,
      modules,
      courses,
      batches,
      schedules,
      nominees,
      attendance,
      users,
      activeFilterOptions
    );
  }, [programs, modules, courses, batches, schedules, nominees, attendance, users, activeFilterOptions]);

  // Chart Data preparation for tasks
  const STATUS_COLORS: Record<string, string> = {
    'Pending': '#94A3B8',
    'Assigned': '#0EA5E9',
    'In Progress': '#2563EB',
    'Waiting': '#8B5CF6',
    'Under Review': '#F59E0B',
    'Completed': '#10B981',
    'Closed': '#14B8A6',
    'Cancelled': '#F43F5E'
  };

  const statusPieData = useMemo(() => {
    return statusAnalysis.map(s => ({
      name: s.status,
      value: s.taskCount,
      color: STATUS_COLORS[s.status] || '#64748B'
    }));
  }, [statusAnalysis]);

  const categoryBarData = useMemo(() => {
    return categoryAnalysis.slice(0, 7).map(c => ({
      name: c.category,
      Tasks: c.taskCount,
      Completed: c.completed
    }));
  }, [categoryAnalysis]);

  const priorityBarData = useMemo(() => {
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    return priorities.map(p => ({
      name: p,
      Count: filteredTasks.filter(t => t.priority === p).length
    }));
  }, [filteredTasks]);

  const assigneeBarData = useMemo(() => {
    return assigneeAnalysis.slice(0, 6).map(a => ({
      name: a.assignee,
      Total: a.totalTasks,
      Completed: a.completed
    }));
  }, [assigneeAnalysis]);

  const hoursSpentByCategoryData = useMemo(() => {
    return categoryAnalysis.slice(0, 6).map(c => ({
      name: c.category.length > 15 ? c.category.substring(0, 15) + '...' : c.category,
      'Hours Spent': c.hoursSpent
    }));
  }, [categoryAnalysis]);

  // Consolidated Export Triggers
  const handleExportExcel = async () => {
    if (!hasGenerated) return;
    try {
      setIsExportingExcel(true);
      setExportNotification(null);
      console.log("===== CONSOLIDATED EXCEL EXPORT (13 SHEETS) =====");

      await exportConsolidatedReportToExcel(
        filteredTasks,
        users,
        periodRange,
        metrics,
        categoryAnalysis,
        assigneeAnalysis,
        statusAnalysis,
        timeAnalysis,
        trainingData
      );

      setExportNotification({
        type: 'success',
        message: `Consolidated 13-sheet Excel report (${periodRange.label}) downloaded successfully.`
      });
    } catch (error: any) {
      console.error("Excel export failed:", error);
      setExportNotification({
        type: 'error',
        message: 'Unable to export consolidated Excel report. Please try again.'
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!hasGenerated) return;
    try {
      setIsExportingPdf(true);
      setExportNotification(null);
      console.log("===== CONSOLIDATED PDF EXPORT (2 PAGES) =====");

      await exportConsolidatedReportToPDF(periodRange);

      setExportNotification({
        type: 'success',
        message: `Consolidated PDF report document (${periodRange.label}) downloaded successfully.`
      });
    } catch (error: any) {
      console.error("PDF export failed:", error);
      setExportNotification({
        type: 'error',
        message: 'Unable to export consolidated PDF report. Please try again.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Consolidated CADEPLOY L&D Reporting
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Reports & Audits Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated operational task analytics and training performance report for executive reviews, ISO 9001 QMS audits, and multi-sheet Excel & PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={!hasGenerated || isExportingExcel}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all ${
              hasGenerated && !isExportingExcel
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title="Exports 13-sheet comprehensive Excel workbook with Task and Training data"
          >
            <Download className={`w-4 h-4 ${isExportingExcel ? 'animate-spin' : ''}`} />
            <span>{isExportingExcel ? 'Exporting...' : 'Export Excel (13 Sheets)'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!hasGenerated || isExportingPdf}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all ${
              hasGenerated && !isExportingPdf
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title="Exports multi-page PDF document containing Operations and Training reports"
          >
            <FileText className={`w-4 h-4 ${isExportingPdf ? 'animate-spin' : ''}`} />
            <span>{isExportingPdf ? 'Generating...' : 'Export PDF Document'}</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Notification */}
      {exportNotification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            exportNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {exportNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{exportNotification.message}</span>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Options Controls Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Shared Reporting Period & Task Scope Parameters
            </h2>
          </div>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Current Scope: {periodRange.label}
          </span>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(['monthly', 'quarterly', 'yearly', 'custom'] as ReportPeriodType[]).map((type) => (
            <button
              key={type}
              onClick={() => setPeriodType(type)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs capitalize transition-all cursor-pointer ${
                periodType === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Period Inputs based on Period Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {periodType === 'monthly' && (
            <>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodType === 'quarterly' && (
            <>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Quarter</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value={1}>Q1 (Jan - Mar)</option>
                  <option value={2}>Q2 (Apr - Jun)</option>
                  <option value={3}>Q3 (Jul - Sep)</option>
                  <option value={4}>Q4 (Oct - Dec)</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodType === 'yearly' && (
            <div>
              <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'custom' && (
            <>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>
              <div>
                <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>
            </>
          )}
        </div>

        {/* Secondary Task Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Task Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="All">All Categories</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 dark:text-slate-400 mb-1">Assignee</label>
            <select
              value={assignedUserFilter}
              onChange={(e) => setAssignedUserFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="All">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Trigger Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Recalculating...' : 'Generate Consolidated Report'}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {reportError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{reportError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: OPERATIONAL TASK REPORT                                       */}
      {/* ========================================================================= */}
      <div id="operational-task-report-section" className="space-y-6">
        {/* Section 1 Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Section 1
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  OPERATIONAL TASK REPORT
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed task execution metrics, team assignments, hours logged, and completion percentages for <span className="font-semibold text-slate-700 dark:text-slate-300">{periodRange.label}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start md:self-auto">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Tasks in Scope: {filteredTasks.length}</span>
          </div>
        </div>

        {/* Task KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.totalTasks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-blue-500 uppercase tracking-wider">Open Tasks</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{metrics.openTasks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-emerald-500 uppercase tracking-wider">Completed</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.completedTasks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.overdueTasks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-purple-500 uppercase tracking-wider">Critical / High</span>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{metrics.criticalHighTasks}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-sky-500 uppercase tracking-wider">Hours Spent</span>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">{metrics.totalHoursSpent}h</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-3xs font-bold text-violet-500 uppercase tracking-wider">Completion %</span>
            <div className="text-xl font-black text-violet-600 dark:text-violet-400 mt-1">{metrics.overallCompletion}%</div>
          </div>
        </div>

        {/* 6 Task Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Chart 1: Status Distribution */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Task Status Distribution</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Status</span>
            </div>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} innerRadius={42} outerRadius={64} paddingAngle={3} dataKey="value">
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Tasks by Category */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Tasks by Category</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">Category</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData}>
                  <XAxis dataKey="name" tick={<CustomCategoryTick />} interval={0} height={40} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="Tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Tasks by Priority */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">3. Tasks by Priority</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Priority</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Tasks by Assignee */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">4. Tasks by Assignee</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Workload</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Hours Spent by Category */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">5. Hours Spent by Category</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">Effort (hrs)</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursSpentByCategoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => [`${val} hrs`, 'Effort']} />
                  <Bar dataKey="Hours Spent" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Completion Trend */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">6. Period Completion Trend</h4>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Progress</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeAnalysis}>
                  <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Completion Rate']} />
                  <Bar dataKey="completionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Task Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Detailed Operational Task Records</h4>
              <p className="text-3xs text-slate-500 dark:text-slate-400">Filtered list of tasks active or completed within {periodRange.label}</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
              {filteredTasks.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-4">Task Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Hours</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                      No operational tasks found for the selected reporting period and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.slice(0, 50).map((t) => {
                    const assignedUser = users.find(u => u.id === t.assignedUserId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{t.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{t.title}</td>
                        <td className="py-2.5 px-4"><CategoryBadge category={t.category} /></td>
                        <td className="py-2.5 px-4"><PriorityBadge priority={t.priority} /></td>
                        <td className="py-2.5 px-4"><StatusBadge status={t.status} /></td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{assignedUser?.name || 'Unassigned'}</td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{t.dueDate}</td>
                        <td className="py-2.5 px-4 text-center font-semibold">{t.hoursSpent}h</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.progress}%</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: TRAINING & L&D REPORT                                         */}
      {/* ========================================================================= */}
      <TrainingReportSection periodOptions={activeFilterOptions} />

      {/* ========================================================================= */}
      {/* HIDDEN OFFSCREEN PDF PREVIEW FOR CONSOLIDATED 2-PAGE EXPORT               */}
      {/* ========================================================================= */}
      <PdfReportPreview
        filteredTasks={filteredTasks}
        users={users}
        periodRange={periodRange}
        metrics={metrics}
        statusPieData={statusPieData}
        categoryBarData={categoryBarData}
        priorityBarData={priorityBarData}
        assigneeBarData={assigneeBarData}
        hoursSpentByCategoryData={hoursSpentByCategoryData}
        timeAnalysis={timeAnalysis}
        generatedTimestamp={generatedTimestamp}
        trainingData={trainingData}
      />
    </div>
  );
};

import React from 'react';
import { 
  Calendar, 
  Filter, 
  RotateCcw, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { TrainingAnalyticsFilters, DatePeriodOption } from '../../../types/trainingAnalytics';
import { TrainingProgram } from '../../../types/training';
import { TrainingBatch } from '../../../types/batch';
import { User } from '../../../types/index';
import { MAIN_DEPARTMENTS } from '../../../constants/departments';

interface Props {
  filters: TrainingAnalyticsFilters;
  onFilterChange: (newFilters: TrainingAnalyticsFilters) => void;
  programs: TrainingProgram[];
  batches: TrainingBatch[];
  users: User[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onReset: () => void;
}

export const TrainingAnalyticsFiltersBar: React.FC<Props> = ({
  filters,
  onFilterChange,
  programs,
  batches,
  users,
  isRefreshing,
  onRefresh,
  onExportExcel,
  onExportPDF,
  onReset
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const handlePeriodClick = (period: DatePeriodOption) => {
    onFilterChange({
      ...filters,
      datePeriod: period
    });
  };

  // Derive unique lists for dropdowns
  const uniqueFacilitators = Array.from(new Set(
    batches.map(b => b.facilitatorCode).filter(Boolean)
  ));

  const uniqueDepartments = Array.from(new Set([
    ...MAIN_DEPARTMENTS,
    ...users.map(u => u.department).filter(Boolean)
  ]));

  const uniqueEmployees = users.filter(u => u.username || u.name);

  return (
    <div id="training-analytics-filters" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 mb-6 space-y-4">
      {/* Top Row: Date Period Selector & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Period Toggle Pill Group */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Period:
          </span>
          
          {(['this_month', 'this_quarter', 'this_year', 'all_time', 'custom'] as DatePeriodOption[]).map((period) => {
            const labels: Record<DatePeriodOption, string> = {
              this_month: 'This Month',
              this_quarter: 'This Quarter',
              this_year: 'This Year',
              all_time: 'All Time',
              custom: 'Custom'
            };
            const isActive = filters.datePeriod === period;
            return (
              <button
                key={period}
                type="button"
                id={`filter-period-${period}`}
                onClick={() => handlePeriodClick(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Refresh, Advanced Toggle, Export Excel, Export PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="analytics-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs disabled:opacity-50"
            title="Refresh Training Database Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            id="analytics-toggle-advanced-filters"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              isAdvancedOpen || filters.programCode !== 'all' || filters.status !== 'all' || filters.facilitatorCode !== 'all'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            id="analytics-export-excel-btn"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-xs"
            title="Export full 10-sheet Excel workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            id="analytics-export-pdf-btn"
            onClick={onExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors shadow-xs"
            title="Generate executive PDF management report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            id="analytics-reset-filters-btn"
            onClick={onReset}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Date Range Row if Custom Period Selected */}
      {filters.datePeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-lg">
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400">Start:</label>
            <input
              type="date"
              id="filter-custom-start-date"
              value={filters.customStartDate || ''}
              onChange={(e) => onFilterChange({ ...filters, customStartDate: e.target.value })}
              className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400">End:</label>
            <input
              type="date"
              id="filter-custom-end-date"
              value={filters.customEndDate || ''}
              onChange={(e) => onFilterChange({ ...filters, customEndDate: e.target.value })}
              className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Advanced Filter Dropdowns Drawer */}
      {isAdvancedOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Program Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Program
            </label>
            <select
              id="filter-select-program"
              value={filters.programCode}
              onChange={(e) => onFilterChange({ ...filters, programCode: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Programs ({programs.length})</option>
              {programs.map(p => (
                <option key={p.id} value={p.programCode}>
                  {p.programCode} - {p.programName}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Mode / Category */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Delivery Mode
            </label>
            <select
              id="filter-select-category"
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Modes</option>
              <option value="Classroom">Classroom / In-Person</option>
              <option value="Virtual">Virtual / Online</option>
              <option value="Hands-on">Hands-on / Workshop</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              id="filter-select-status"
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Planned">Planned / Scheduled</option>
              <option value="In Progress">In Progress / Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled / On Hold</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Batch Code
            </label>
            <select
              id="filter-select-batch"
              value={filters.batchCode}
              onChange={(e) => onFilterChange({ ...filters, batchCode: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Batches ({batches.length})</option>
              {batches.map(b => (
                <option key={b.id} value={b.batchCode}>
                  {b.batchCode} ({b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Facilitator Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Facilitator
            </label>
            <select
              id="filter-select-facilitator"
              value={filters.facilitatorCode}
              onChange={(e) => onFilterChange({ ...filters, facilitatorCode: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Facilitators</option>
              {uniqueFacilitators.map(f => {
                const u = users.find(user => user.username === f || user.id === f || user.name === f);
                return (
                  <option key={f} value={f}>
                    {u ? `${u.name} (${f})` : f}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              id="filter-select-department"
              value={filters.department}
              onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-white focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

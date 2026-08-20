import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  Award, 
  FileCheck2,
  Layers
} from 'lucide-react';
import { EmployeeConsolidatedRecord } from '../../types/assessment';
import { exportConsolidatedTrainingRecordsToExcel } from '../../utils/assessmentUtils';

interface ConsolidatedTrainingMatrixTableProps {
  records: EmployeeConsolidatedRecord[];
  title?: string;
  subtitle?: string;
  showEmployeeColumn?: boolean;
}

export const ConsolidatedTrainingMatrixTable: React.FC<ConsolidatedTrainingMatrixTableProps> = ({
  records = [],
  title = 'Consolidated Training Matrix Record',
  subtitle = 'Integrated view of Program, Batch, Module, Attendance, Assessments, PKTs and Final Status',
  showEmployeeColumn = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');

  const safeRecords = records || [];

  const filteredRecords = safeRecords.filter(r => {
    if (!r) return false;
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (r.programName || '').toLowerCase().includes(query) ||
      (r.programCode || '').toLowerCase().includes(query) ||
      (r.moduleName || '').toLowerCase().includes(query) ||
      (r.batchCode || '').toLowerCase().includes(query) ||
      (showEmployeeColumn && ((r.employeeName || '').toLowerCase().includes(query) || (r.employeeCode || '').toLowerCase().includes(query)));

    const matchesResult = filterResult === 'all' || (r.finalResult || '').toLowerCase() === filterResult.toLowerCase();

    return matchesSearch && matchesResult;
  });

  const handleExport = () => {
    exportConsolidatedTrainingRecordsToExcel(filteredRecords, 'Consolidated_Training_Matrix');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search program, batch, module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-60"
            />
          </div>

          {/* Filter */}
          <select
            value={filterResult}
            onChange={e => setFilterResult(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Outcomes</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="in progress">In Progress</option>
            <option value="not attempted">Not Attempted</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
            <tr>
              {showEmployeeColumn && (
                <th className="p-3.5">Employee</th>
              )}
              <th className="p-3.5">Program Details</th>
              <th className="p-3.5">Batch</th>
              <th className="p-3.5">Module</th>
              <th className="p-3.5 text-center">Attendance</th>
              <th className="p-3.5 text-center">Pre-Assessment</th>
              <th className="p-3.5 text-center">Post-Assessment</th>
              <th className="p-3.5 text-center">Learning &Delta;</th>
              <th className="p-3.5 text-center">PKT Test Result</th>
              <th className="p-3.5 text-center">Final Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={showEmployeeColumn ? 10 : 9} className="p-8 text-center text-slate-500">
                  No consolidated training records found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  {showEmployeeColumn && (
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{rec.employeeName}</div>
                      <div className="text-2xs font-mono text-slate-500">{rec.employeeCode} &bull; {rec.department}</div>
                    </td>
                  )}

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={rec.programName}>
                      {rec.programName}
                    </div>
                    <div className="text-2xs font-mono text-blue-600 dark:text-blue-400">{rec.programCode}</div>
                  </td>

                  <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {rec.batchCode || '-'}
                  </td>

                  <td className="p-3.5">
                    <div className="font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate" title={rec.moduleName}>
                      {rec.moduleName}
                    </div>
                    {rec.moduleCode && rec.moduleCode !== '-' && (
                      <div className="text-2xs font-mono text-slate-400">{rec.moduleCode}</div>
                    )}
                  </td>

                  {/* Attendance */}
                  <td className="p-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                      rec.attendanceStatus === 'Present'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : rec.attendanceStatus === 'Partial'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : rec.attendanceStatus === 'Absent'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {rec.attendanceStatus}
                      {rec.attendanceRate !== undefined && ` (${rec.attendanceRate}%)`}
                    </span>
                  </td>

                  {/* Pre Assessment */}
                  <td className="p-3.5 text-center">
                    {rec.preScore !== undefined ? (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{rec.preScore}%</span>
                        <div className="text-2xs text-slate-500 font-medium">{rec.preResult}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-2xs">-</span>
                    )}
                  </td>

                  {/* Post Assessment */}
                  <td className="p-3.5 text-center">
                    {rec.postScore !== undefined ? (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{rec.postScore}%</span>
                        <div className={`text-2xs font-extrabold ${rec.postResult === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rec.postResult}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-2xs">-</span>
                    )}
                  </td>

                  {/* Improvement Delta */}
                  <td className="p-3.5 text-center">
                    {rec.improvement !== undefined ? (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        rec.improvement > 0 ? 'text-emerald-600' : (rec.improvement < 0 ? 'text-red-600' : 'text-slate-500')
                      }`}>
                        {rec.improvement > 0 ? `+${rec.improvement}%` : `${rec.improvement}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-2xs">-</span>
                    )}
                  </td>

                  {/* PKT */}
                  <td className="p-3.5 text-center">
                    {rec.pktScore !== undefined ? (
                      <div>
                        <span className={`font-black ${rec.pktResult === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rec.pktScore}% ({rec.pktResult})
                        </span>
                        {rec.pktTotalAttempts && (
                          <div className="text-2xs text-slate-500">
                            {rec.pktTotalAttempts} attempt{rec.pktTotalAttempts !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-2xs">-</span>
                    )}
                  </td>

                  {/* Final Result */}
                  <td className="p-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-extrabold tracking-wide uppercase shadow-2xs ${
                      rec.finalResult === 'Pass'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : rec.finalResult === 'Fail'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800'
                        : rec.finalResult === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}>
                      {rec.finalResult === 'Pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      <span>{rec.finalResult}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

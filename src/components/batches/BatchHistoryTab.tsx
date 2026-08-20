import React, { useState } from 'react';
import { History, FileSpreadsheet, CheckCircle2, AlertCircle, Calendar, User, Search } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { formatBatchDateTime } from '../../utils/batchUtils';

export const BatchHistoryTab: React.FC = () => {
  const { importHistory, setSelectedBatchId, setActiveSubTab } = useBatch();
  const [search, setSearch] = useState('');

  const filteredHistory = importHistory.filter(h =>
    h.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (h.batchCode && h.batchCode.toLowerCase().includes(search.toLowerCase())) ||
    (h.programCode && h.programCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Batch Import Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of all Excel batch import operations and batch creation events
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by file or batch code..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {importHistory.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Import History</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            When you import batch workbooks through the Excel Import wizard, detailed execution audit logs will be listed here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Program Code</th>
                  <th className="py-3 px-4 text-center">Nominees</th>
                  <th className="py-3 px-4 text-center">Schedule</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Imported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatBatchDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{item.fileName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.batchCode || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.programCode || '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.nomineeCount}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.scheduleCount}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.attendanceCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.importedBy || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

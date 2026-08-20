import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  FileSpreadsheet,
  MapPin,
  User,
  Users,
  CheckCheck
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { formatBatchDateOnly, exportBatchToExcel } from '../../utils/batchUtils';
import { TrainingBatch, BatchStatus } from '../../types/batch';
import { BatchModal } from './BatchModal';

export const BatchListTab: React.FC = () => {
  const { 
    batches, 
    setSelectedBatchId, 
    setActiveSubTab, 
    setActiveDetailTab,
    deleteBatch, 
    getBatchNominees,
    getBatchSchedules,
    getBatchAttendance
  } = useBatch();

  const { programs } = useTraining();
  const { users, currentUser } = useApp();

  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canEdit = hasPermission(currentUser, 'TRAINING_EDIT');
  const canDelete = hasPermission(currentUser, 'TRAINING_DELETE');
  const canViewAttendance = hasPermission(currentUser, 'ATTENDANCE_VIEW') || hasPermission(currentUser, 'ATTENDANCE_MANAGE');
  const canReports = hasPermission(currentUser, 'TRAINING_REPORTS_VIEW') || hasPermission(currentUser, 'TRAINING_VIEW');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<TrainingBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<TrainingBatch | null>(null);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        b.batchCode.toLowerCase().includes(q) ||
        b.programCode.toLowerCase().includes(q) ||
        (b.programName && b.programName.toLowerCase().includes(q)) ||
        b.batchLocation.toLowerCase().includes(q) ||
        b.facilitatorCode.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || b.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesProgram = programFilter === 'all' || b.programCode === programFilter;

      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [batches, searchQuery, statusFilter, programFilter]);

  // Aggregate Metrics
  const totalBatchesCount = batches.length;
  const inProgressCount = batches.filter(b => b.status === 'In Progress').length;
  const completedCount = batches.filter(b => b.status === 'Completed').length;
  const totalNomineesAcrossBatches = batches.reduce((acc, b) => acc + (b.headCount || 0), 0);

  const handleOpenBatchDetails = (batchId: string, initialTab: 'overview' | 'attendance' = 'overview') => {
    setSelectedBatchId(batchId);
    setActiveDetailTab(initialTab);
    setActiveSubTab('detail');
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Batches</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalBatchesCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">In Progress</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{inProgressCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Nominees</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalNomineesAcrossBatches}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search batches by code, program, facilitator, location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {programs.length > 0 && (
            <select
              value={programFilter}
              onChange={e => setProgramFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.programCode}>
                  {p.programCode} — {p.programName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <>
              <button
                onClick={() => setActiveSubTab('import')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel Import</span>
              </button>
              <button
                onClick={() => {
                  setBatchToEdit(null);
                  setIsNewBatchOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Batch</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Batch Data Table or Empty State */}
      {batches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            No training batches created yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Create your first training batch against an approved Program or import batches from your Excel workbooks to track employee attendance and schedules.
          </p>
          {canCreate && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setBatchToEdit(null);
                  setIsNewBatchOpen(true);
                }}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Batch</span>
              </button>
              <button
                onClick={() => setActiveSubTab('import')}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel Import</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Batches Match Filters</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting the search query or status filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Batch Code</th>
                  <th className="py-3.5 px-4">Program Code</th>
                  <th className="py-3.5 px-4">Program Name</th>
                  <th className="py-3.5 px-4 text-center">Head Count</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Requested Date</th>
                  <th className="py-3.5 px-4">Accepted Date</th>
                  <th className="py-3.5 px-4">Requested Start</th>
                  <th className="py-3.5 px-4">Proposed Start</th>
                  <th className="py-3.5 px-4">Schedule Code</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Facilitator</th>
                  <th className="py-3.5 px-4">Batch Status</th>
                  <th className="py-3.5 px-4 text-right sticky right-0 bg-slate-50 dark:bg-slate-800 z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredBatches.map(batch => {
                  const nominees = getBatchNominees(batch.id);
                  const schedules = getBatchSchedules(batch.id);
                  const attendance = getBatchAttendance(batch.id);

                  return (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Batch Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenBatchDetails(batch.id, 'overview')}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          <span>{batch.batchCode}</span>
                        </button>
                      </td>

                      {/* Program Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {batch.programCode}
                      </td>

                      {/* Program Name */}
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-bold max-w-[200px] truncate">
                        {batch.programName || '—'}
                      </td>

                      {/* Head Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                          {nominees.length || batch.headCount}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {formatBatchDateOnly(batch.batchCreatedDate)}
                      </td>

                      {/* Requested Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatBatchDateOnly(batch.programRequestedDate)}
                      </td>

                      {/* Request Accepted Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatBatchDateOnly(batch.programRequestAcceptedDate)}
                      </td>

                      {/* Requested Start Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatBatchDateOnly(batch.programRequestedStartDate)}
                      </td>

                      {/* Proposed Start Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatBatchDateOnly(batch.programProposedStartDate)}
                      </td>

                      {/* Schedule Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {batch.scheduleCode || '—'}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {batch.batchLocation}
                      </td>

                      {/* Facilitator */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {batch.facilitatorCode}
                      </td>

                      {/* Batch Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          batch.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                            : batch.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
                        }`}>
                          {batch.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10 group-hover:bg-slate-50/70 dark:group-hover:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenBatchDetails(batch.id, 'overview')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="View Batch Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canViewAttendance && (
                            <button
                              onClick={() => handleOpenBatchDetails(batch.id, 'attendance')}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Attendance Matrix"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canReports && (
                            <button
                              onClick={() => exportBatchToExcel(batch, schedules, nominees, attendance, users)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Export Batch (.xlsx)"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setBatchToEdit(batch);
                                setIsNewBatchOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Edit Batch"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setBatchToDelete(batch)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Batch Modal */}
      <BatchModal
        isOpen={isNewBatchOpen}
        batchToEdit={batchToEdit}
        onClose={() => {
          setIsNewBatchOpen(false);
          setBatchToEdit(null);
        }}
      />

      {/* Delete Batch Confirmation Dialog */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Batch {batchToDelete.batchCode}?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-5">
              This will permanently delete the batch along with all nominated employees, schedule activities, and attendance records.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBatchToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteBatch(batchToDelete.id);
                  setBatchToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

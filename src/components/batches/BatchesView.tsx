import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  FileSpreadsheet, 
  History, 
  ListFilter, 
  Download,
  CalendarCheck,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { BatchListTab } from './BatchListTab';
import { BatchDetailView } from './BatchDetailView';
import { BatchImportTab } from './BatchImportTab';
import { BatchHistoryTab } from './BatchHistoryTab';
import { BatchModal } from './BatchModal';
import { generateSampleBatchTemplate } from '../../utils/batchUtils';

export const BatchesView: React.FC = () => {
  const { currentUser } = useApp();
  const { 
    activeSubTab, 
    setActiveSubTab, 
    selectedBatch, 
    setSelectedBatchId,
    batches
  } = useBatch();

  const { programs } = useTraining();
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);

  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canImport = hasPermission(currentUser, 'TRAINING_IMPORT') || hasPermission(currentUser, 'TRAINING_CREATE');
  const canViewHistory = hasPermission(currentUser, 'TRAINING_VIEW') || hasPermission(currentUser, 'TRAINING_IMPORT');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Learning & Development Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Training Batches & Attendance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage training batches against curriculum programs, track delivery session schedules, coordinate employee nominations, and record attendance matrices.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => generateSampleBatchTemplate(programs)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download Template Spreadsheet (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download Template (.xlsx)</span>
          </button>

          {canImport && (
            <button
              onClick={() => setActiveSubTab('import')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                activeSubTab === 'import'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel Import Wizard</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => setIsNewBatchOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveSubTab('list');
              setSelectedBatchId(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'list'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Batches List ({batches.length})</span>
          </button>

          {selectedBatch && (
            <button
              onClick={() => setActiveSubTab('detail')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'detail'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Batch: {selectedBatch.batchCode}</span>
            </button>
          )}

          {canImport && (
            <button
              onClick={() => setActiveSubTab('import')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'import'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Import Wizard</span>
            </button>
          )}

          {canViewHistory && (
            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'history'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Import History</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'list' && <BatchListTab />}
      {activeSubTab === 'detail' && <BatchDetailView />}
      {activeSubTab === 'import' && canImport && <BatchImportTab />}
      {activeSubTab === 'history' && canViewHistory && <BatchHistoryTab />}

      {/* Create Batch Modal */}
      {canCreate && (
        <BatchModal
          isOpen={isNewBatchOpen}
          onClose={() => setIsNewBatchOpen(false)}
        />
      )}
    </div>
  );
};

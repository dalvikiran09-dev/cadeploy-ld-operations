import React, { useState } from 'react';
import { TrainingModule } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { ModuleModal } from './ModuleModal';
import { BulkDeleteModal, BulkDeleteErrorDetails, BulkDeleteItemSummary } from './BulkDeleteModal';
import { formatDurationDisplay } from '../../utils/trainingUtils';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  X, 
  Clock, 
  Laptop, 
  Layers,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';

export const ModulesTab: React.FC = () => {
  const { currentUser } = useApp();
  const { modules, courses, programs, deleteModule, bulkDeleteModules, setActiveSubTab } = useTraining();

  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'admin';
  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canEdit = hasPermission(currentUser, 'TRAINING_EDIT');
  const canDelete = hasPermission(currentUser, 'TRAINING_DELETE');

  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryModeFilter, setDeliveryModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<TrainingModule | null>(null);
  const [moduleToView, setModuleToView] = useState<TrainingModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<TrainingModule | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteErrorResult, setBulkDeleteErrorResult] = useState<BulkDeleteErrorDetails | null>(null);
  const [bulkDependencies, setBulkDependencies] = useState<string[]>([]);

  // Filter modules
  const filteredModules = modules.filter(m => {
    const matchesSearch = 
      m.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.moduleName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = deliveryModeFilter === 'all' || m.deliveryMode === deliveryModeFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesMode && matchesStatus;
  });

  const visibleIds = filteredModules.map(m => m.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedModuleIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some(id => selectedModuleIds.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedModuleIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedModuleIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleToggleModule = (id: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedModuleIds([]);
  };

  const getModuleCourseCount = (moduleCode: string) => {
    const linked = courses.filter(c => c.moduleCode.toUpperCase() === moduleCode.toUpperCase());
    const uniqueCourses = new Set(linked.map(c => c.courseCode.toUpperCase()));
    return {
      courseCount: uniqueCourses.size,
      recordsCount: linked.length
    };
  };

  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteModule(moduleToDelete.id);
    setIsDeleting(false);

    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete module.');
    } else {
      setModuleToDelete(null);
      setSelectedModuleIds(prev => prev.filter(id => id !== moduleToDelete.id));
    }
  };

  const handleOpenBulkDelete = () => {
    if (selectedModuleIds.length === 0) return;

    // Check dependencies for selected modules
    const deps: string[] = [];
    const selectedMods = modules.filter(m => selectedModuleIds.includes(m.id));
    for (const mod of selectedMods) {
      const referencingCourses = courses.filter(c => c.moduleCode.toUpperCase() === mod.moduleCode.toUpperCase());
      if (referencingCourses.length > 0) {
        const uniqueCourses = new Set(referencingCourses.map(c => c.courseCode)).size;
        deps.push(
          `Module "${mod.moduleCode} - ${mod.moduleName}" is included in ${uniqueCourses} Course(s) (${referencingCourses.length} mapping records).`
        );
      }
    }

    setBulkDependencies(deps);
    setBulkDeleteErrorResult(null);
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedModuleIds.length === 0) return;
    setIsDeleting(true);
    setBulkDeleteErrorResult(null);

    const res = await bulkDeleteModules(selectedModuleIds);
    setIsDeleting(false);

    if (!res.success) {
      setBulkDeleteErrorResult({
        requested: res.requested,
        deleted: res.deleted,
        failed: res.failed,
        errorMessage: res.error || 'Failed to delete selected modules from Supabase database.',
        details: res.dependencyErrors
      });
      if (res.dependencyErrors && res.dependencyErrors.length > 0) {
        setBulkDependencies(res.dependencyErrors);
      }
    } else {
      setSelectedModuleIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const selectedItemsSummary: BulkDeleteItemSummary[] = modules
    .filter(m => selectedModuleIds.includes(m.id))
    .map(m => {
      const stats = getModuleCourseCount(m.moduleCode);
      return {
        id: m.id,
        primary: m.moduleCode,
        secondary: m.moduleName,
        badge: `${stats.courseCount} Courses • ${formatDurationDisplay(m.duration)}`
      };
    });

  return (
    <div className="space-y-4" id="training-modules-tab">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-modules-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search modules by code or module name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters and New Module Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="filter-modules-mode"
            value={deliveryModeFilter}
            onChange={e => setDeliveryModeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Delivery Modes</option>
            <option value="Classroom Training (Offline)">Classroom (Offline)</option>
            <option value="Virtual Training (Online)">Virtual (Online)</option>
            <option value="Self-Paced / E-Learning">Self-Paced / E-Learning</option>
            <option value="On-the-Job Training">On-the-Job</option>
            <option value="Blended Learning">Blended</option>
          </select>

          <select
            id="filter-modules-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>

          {canCreate && (
            <button
              id="btn-create-module"
              onClick={() => {
                setModuleToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Module</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar for Administrator */}
      {selectedModuleIds.length > 0 && (
        <div 
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
          id="modules-bulk-action-bar"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span id="selected-modules-count">Selected: {selectedModuleIds.length}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {selectedModuleIds.length === 1 ? '1 module selected' : `${selectedModuleIds.length} modules selected`}
            </span>
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              id="btn-toggle-all-visible-modules"
            >
              {isAllVisibleSelected ? 'Deselect visible' : `Select all visible (${filteredModules.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              id="btn-clear-module-selection"
            >
              Clear Selection
            </button>

            {/* Administrator Only Bulk Delete */}
            {isAdmin && (
              <button
                onClick={handleOpenBulkDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-bulk-delete-modules"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedModuleIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modules Content */}
      {modules.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" id="empty-state-modules">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No training modules created yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Create learning modules or import comprehensive course curriculums via Excel (.xlsx).
          </p>
          <div className="flex items-center justify-center gap-3">
            {canCreate && (
              <button
                id="btn-empty-create-module"
                onClick={() => {
                  setModuleToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Module</span>
              </button>
            )}
            <button
              id="btn-empty-import-modules"
              onClick={() => setActiveSubTab('import')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Excel Import</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {/* Select All Checkbox Header */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      id="select-all-modules-checkbox"
                      checked={isAllVisibleSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeVisibleSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                      title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                    />
                  </th>
                  <th className="py-3 px-4">Module Code</th>
                  <th className="py-3 px-4">Module Name</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4">Delivery Mode</th>
                  <th className="py-3 px-4 text-center">In Courses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-sm">No training modules match filter</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Try adjusting your search query or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredModules.map(m => {
                    const courseStats = getModuleCourseCount(m.moduleCode);
                    const isSelected = selectedModuleIds.includes(m.id);

                    return (
                      <tr 
                        key={m.id}
                        className={`transition-colors group ${
                          isSelected 
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30' 
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            id={`select-module-${m.id}`}
                            checked={isSelected}
                            onChange={() => handleToggleModule(m.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {m.moduleCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                          {m.moduleName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200/60 dark:border-amber-800/40">
                            <Clock className="w-3 h-3" />
                            {formatDurationDisplay(m.duration)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            <Laptop className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[200px]">{m.deliveryMode}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {courseStats.courseCount} {courseStats.courseCount === 1 ? 'course' : 'courses'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            m.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : m.status === 'Draft'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModuleToView(m)}
                              title="View Module Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setModuleToEdit(m);
                                  setIsCreateModalOpen(true);
                                }}
                                title="Edit Module"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setModuleToDelete(m);
                                }}
                                title="Delete Module"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Module Modal */}
      {moduleToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                      {moduleToView.moduleCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {moduleToView.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {moduleToView.moduleName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModuleToView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Duration</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatDurationDisplay(moduleToView.duration)}</span>
                    <span className="text-xs font-normal text-slate-400">({moduleToView.duration})</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Delivery Mode</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                    {moduleToView.deliveryMode}
                  </div>
                </div>
              </div>

              {/* Linked Courses */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Courses Including This Module
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {courses.filter(c => c.moduleCode.toUpperCase() === moduleToView.moduleCode.toUpperCase()).length === 0 ? (
                    <p className="text-slate-400 italic py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      This module has not been linked to any courses yet.
                    </p>
                  ) : (
                    courses
                      .filter(c => c.moduleCode.toUpperCase() === moduleToView.moduleCode.toUpperCase())
                      .map(c => {
                        const prog = programs.find(p => p.programCode.toUpperCase() === c.programCode.toUpperCase());
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.courseCode}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{prog?.programName || c.programCode}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>Day {c.deliveryDay}</span>
                                <span>•</span>
                                <span>{c.ownerRole}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              {c.courseStatus}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setModuleToView(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {moduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Module</h3>
                <p className="text-xs text-slate-500 font-mono">{moduleToDelete.moduleCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete module <span className="font-semibold text-slate-900 dark:text-white">{moduleToDelete.moduleName}</span>?
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModuleToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => {
          setIsBulkDeleteModalOpen(false);
          setBulkDeleteErrorResult(null);
          setBulkDependencies([]);
        }}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${selectedModuleIds.length} selected Module${selectedModuleIds.length === 1 ? '' : 's'}?`}
        entityName="Modules"
        itemCount={selectedModuleIds.length}
        selectedItems={selectedItemsSummary}
        dependencies={bulkDependencies}
        isDeleting={isDeleting}
        errorResult={bulkDeleteErrorResult}
      />

      {/* Module Create/Edit Modal */}
      <ModuleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setModuleToEdit(null);
        }}
        moduleToEdit={moduleToEdit}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { TrainingProgram } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { ProgramModal } from './ProgramModal';
import { BulkDeleteModal, BulkDeleteErrorDetails, BulkDeleteItemSummary } from './BulkDeleteModal';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  X, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MinusSquare
} from 'lucide-react';

export const ProgramsTab: React.FC = () => {
  const { currentUser } = useApp();
  const { programs, modules, courses, deleteProgram, bulkDeletePrograms, setActiveSubTab } = useTraining();

  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'admin';
  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canEdit = hasPermission(currentUser, 'TRAINING_EDIT');
  const canDelete = hasPermission(currentUser, 'TRAINING_DELETE');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Draft' | 'Inactive' | 'Archived'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<TrainingProgram | null>(null);
  const [programToView, setProgramToView] = useState<TrainingProgram | null>(null);
  const [programToDelete, setProgramToDelete] = useState<TrainingProgram | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteErrorResult, setBulkDeleteErrorResult] = useState<BulkDeleteErrorDetails | null>(null);
  const [bulkDependencies, setBulkDependencies] = useState<string[]>([]);

  // Filter programs
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = 
      p.programCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.programDescription && p.programDescription.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const visibleIds = filteredPrograms.map(p => p.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedProgramIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some(id => selectedProgramIds.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      // Deselect all visible
      setSelectedProgramIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedProgramIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleToggleProgram = (id: string) => {
    setSelectedProgramIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedProgramIds([]);
  };

  // Calculate attached courses and modules count for a program
  const getProgramStats = (programCode: string) => {
    const attachedCourses = courses.filter(c => c.programCode.toUpperCase() === programCode.toUpperCase());
    const uniqueCourseCodes = new Set(attachedCourses.map(c => c.courseCode.toUpperCase()));
    const uniqueModuleCodes = new Set(attachedCourses.map(c => c.moduleCode.toUpperCase()));
    return {
      courseCount: uniqueCourseCodes.size,
      courseModuleRows: attachedCourses.length,
      moduleCount: uniqueModuleCodes.size
    };
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteProgram(programToDelete.id);
    setIsDeleting(false);

    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete program.');
    } else {
      setProgramToDelete(null);
      setSelectedProgramIds(prev => prev.filter(id => id !== programToDelete.id));
    }
  };

  const handleOpenBulkDelete = () => {
    if (selectedProgramIds.length === 0) return;

    // Check for dependencies across selected programs
    const deps: string[] = [];
    const selectedProgs = programs.filter(p => selectedProgramIds.includes(p.id));
    for (const prog of selectedProgs) {
      const referencingCourses = courses.filter(c => c.programCode.toUpperCase() === prog.programCode.toUpperCase());
      if (referencingCourses.length > 0) {
        const uniqueModules = new Set(referencingCourses.map(c => c.moduleCode)).size;
        const uniqueCourseCodes = new Set(referencingCourses.map(c => c.courseCode)).size;
        deps.push(
          `Program "${prog.programCode} - ${prog.programName}" is linked to ${uniqueModules} Module(s) across ${uniqueCourseCodes} Course(s) (${referencingCourses.length} mapping records).`
        );
      }
    }

    setBulkDependencies(deps);
    setBulkDeleteErrorResult(null);
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedProgramIds.length === 0) return;
    setIsDeleting(true);
    setBulkDeleteErrorResult(null);

    const res = await bulkDeletePrograms(selectedProgramIds);
    setIsDeleting(false);

    if (!res.success) {
      setBulkDeleteErrorResult({
        requested: res.requested,
        deleted: res.deleted,
        failed: res.failed,
        errorMessage: res.error || 'Failed to delete selected programs from Supabase database.',
        details: res.dependencyErrors
      });
      if (res.dependencyErrors && res.dependencyErrors.length > 0) {
        setBulkDependencies(res.dependencyErrors);
      }
    } else {
      setSelectedProgramIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const selectedItemsSummary: BulkDeleteItemSummary[] = programs
    .filter(p => selectedProgramIds.includes(p.id))
    .map(p => {
      const stats = getProgramStats(p.programCode);
      return {
        id: p.id,
        primary: p.programCode,
        secondary: p.programName,
        badge: `${stats.courseCount} Courses, ${stats.moduleCount} Modules`
      };
    });

  return (
    <div className="space-y-4" id="training-programs-tab">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-programs-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search programs by code, name, or description..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters and New Program Button */}
        <div className="flex items-center gap-2.5">
          <select
            id="filter-programs-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
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
              id="btn-create-program"
              onClick={() => {
                setProgramToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Program</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Floating/Pinned Banner for Administrator */}
      {selectedProgramIds.length > 0 && (
        <div 
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
          id="programs-bulk-action-bar"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span id="selected-programs-count">Selected: {selectedProgramIds.length}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {selectedProgramIds.length === 1 ? '1 program selected' : `${selectedProgramIds.length} programs selected`}
            </span>
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              id="btn-toggle-all-visible-programs"
            >
              {isAllVisibleSelected ? 'Deselect visible' : `Select all visible (${filteredPrograms.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              id="btn-clear-program-selection"
            >
              Clear Selection
            </button>

            {/* Administrator Only Bulk Delete */}
            {isAdmin && (
              <button
                onClick={handleOpenBulkDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-bulk-delete-programs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedProgramIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Programs Content */}
      {programs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" id="empty-state-programs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No training programs created yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Define training programs manually or import your curriculum hierarchy via Excel (.xlsx).
          </p>
          <div className="flex items-center justify-center gap-3">
            {canCreate && (
              <button
                id="btn-empty-create-program"
                onClick={() => {
                  setProgramToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Program</span>
              </button>
            )}
            <button
              id="btn-empty-import-programs"
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
                      id="select-all-programs-checkbox"
                      checked={isAllVisibleSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeVisibleSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                      title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                    />
                  </th>
                  <th className="py-3 px-4">Program Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4 hidden md:table-cell">Description</th>
                  <th className="py-3 px-4 text-center">Structure</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <FolderKanban className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-sm">No training programs match filter</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Try adjusting your search query or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map(p => {
                    const stats = getProgramStats(p.programCode);
                    const isSelected = selectedProgramIds.includes(p.id);

                    return (
                      <tr 
                        key={p.id}
                        className={`transition-colors group ${
                          isSelected 
                            ? 'bg-blue-50/60 dark:bg-blue-950/30' 
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            id={`select-program-${p.id}`}
                            checked={isSelected}
                            onChange={() => handleToggleProgram(p.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {p.programCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                          {p.programName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-sm truncate">
                          {p.programDescription || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                            <span>{stats.courseCount} Courses</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{stats.moduleCount} Modules</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : p.status === 'Draft'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setProgramToView(p)}
                              title="View Program Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setProgramToEdit(p);
                                  setIsCreateModalOpen(true);
                                }}
                                title="Edit Program"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setProgramToDelete(p);
                                }}
                                title="Delete Program"
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

      {/* View Program Drawer/Modal */}
      {programToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {programToView.programCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {programToView.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {programToView.programName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setProgramToView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {programToView.programDescription && (
                <div>
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h4>
                  <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl leading-relaxed">
                    {programToView.programDescription}
                  </p>
                </div>
              )}

              {/* Associated Courses */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Linked Courses & Modules</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {courses.filter(c => c.programCode.toUpperCase() === programToView.programCode.toUpperCase()).length} records
                  </span>
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {courses.filter(c => c.programCode.toUpperCase() === programToView.programCode.toUpperCase()).length === 0 ? (
                    <p className="text-slate-400 italic py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      No courses are linked to this program yet.
                    </p>
                  ) : (
                    courses
                      .filter(c => c.programCode.toUpperCase() === programToView.programCode.toUpperCase())
                      .map(c => {
                        const mod = modules.find(m => m.moduleCode.toUpperCase() === c.moduleCode.toUpperCase());
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.courseCode}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{mod?.moduleName || c.moduleCode}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>Day {c.deliveryDay}</span>
                                <span>•</span>
                                <span>{c.deliveryMode1 || 'Classroom'}</span>
                                <span>•</span>
                                <span>{c.ownerRole}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
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
                onClick={() => setProgramToView(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Program</h3>
                <p className="text-xs text-slate-500 font-mono">{programToDelete.programCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{programToDelete.programName}</span>?
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
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
        title={`Delete ${selectedProgramIds.length} selected Program${selectedProgramIds.length === 1 ? '' : 's'}?`}
        entityName="Programs"
        itemCount={selectedProgramIds.length}
        selectedItems={selectedItemsSummary}
        dependencies={bulkDependencies}
        isDeleting={isDeleting}
        errorResult={bulkDeleteErrorResult}
      />

      {/* Program Create/Edit Modal */}
      <ProgramModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setProgramToEdit(null);
        }}
        programToEdit={programToEdit}
      />
    </div>
  );
};

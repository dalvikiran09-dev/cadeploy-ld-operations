import React, { useState } from 'react';
import { TrainingCourse, CourseGroup } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { CourseModal } from './CourseModal';
import { BulkDeleteModal, BulkDeleteErrorDetails, BulkDeleteItemSummary } from './BulkDeleteModal';
import { formatDurationDisplay } from '../../utils/trainingUtils';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FolderKanban, 
  ChevronDown, 
  ChevronRight, 
  UserCheck, 
  BookOpen,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';

export const CoursesTab: React.FC = () => {
  const { currentUser } = useApp();
  const { 
    programs, 
    modules, 
    courses, 
    groupedCourses, 
    deleteCourseRecord, 
    deleteCourseGroup,
    bulkDeleteCourseGroups,
    setActiveSubTab
  } = useTraining();

  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'admin';
  const canCreate = hasPermission(currentUser, 'TRAINING_CREATE');
  const canEdit = hasPermission(currentUser, 'TRAINING_EDIT');
  const canDelete = hasPermission(currentUser, 'TRAINING_DELETE');

  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<TrainingCourse | null>(null);
  const [defaultProgramCode, setDefaultProgramCode] = useState<string | undefined>(undefined);
  const [defaultCourseCode, setDefaultCourseCode] = useState<string | undefined>(undefined);

  const [courseGroupToDelete, setCourseGroupToDelete] = useState<string | null>(null);
  const [courseRowToDelete, setCourseRowToDelete] = useState<TrainingCourse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State for Course Groups
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteErrorResult, setBulkDeleteErrorResult] = useState<BulkDeleteErrorDetails | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (courseCode: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [courseCode]: !prev[courseCode]
    }));
  };

  // Filter Course Groups
  const filteredGroups = groupedCourses.filter(grp => {
    const matchesSearch = 
      grp.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grp.programCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grp.programName && grp.programName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      grp.modules.some(m => 
        m.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.moduleName && m.moduleName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesProgram = programFilter === 'all' || grp.programCode.toUpperCase() === programFilter.toUpperCase();
    const matchesStatus = statusFilter === 'all' || grp.status === statusFilter;

    return matchesSearch && matchesProgram && matchesStatus;
  });

  const visibleCodes = filteredGroups.map(g => g.courseCode);
  const isAllVisibleSelected = visibleCodes.length > 0 && visibleCodes.every(code => selectedCourseCodes.includes(code));
  const isSomeVisibleSelected = visibleCodes.some(code => selectedCourseCodes.includes(code)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedCourseCodes(prev => prev.filter(code => !visibleCodes.includes(code)));
    } else {
      setSelectedCourseCodes(prev => {
        const union = new Set([...prev, ...visibleCodes]);
        return Array.from(union);
      });
    }
  };

  const handleToggleCourse = (courseCode: string) => {
    setSelectedCourseCodes(prev =>
      prev.includes(courseCode) ? prev.filter(item => item !== courseCode) : [...prev, courseCode]
    );
  };

  const handleClearSelection = () => {
    setSelectedCourseCodes([]);
  };

  const handleDeleteGroup = async () => {
    if (!courseGroupToDelete) return;
    setIsDeleting(true);
    await deleteCourseGroup(courseGroupToDelete);
    setIsDeleting(false);
    setSelectedCourseCodes(prev => prev.filter(c => c !== courseGroupToDelete));
    setCourseGroupToDelete(null);
  };

  const handleDeleteRow = async () => {
    if (!courseRowToDelete) return;
    setIsDeleting(true);
    await deleteCourseRecord(courseRowToDelete.id);
    setIsDeleting(false);
    setCourseRowToDelete(null);
  };

  const handleOpenBulkDelete = () => {
    if (selectedCourseCodes.length === 0) return;
    setBulkDeleteErrorResult(null);
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedCourseCodes.length === 0) return;
    setIsDeleting(true);
    setBulkDeleteErrorResult(null);

    const res = await bulkDeleteCourseGroups(selectedCourseCodes);
    setIsDeleting(false);

    if (!res.success) {
      setBulkDeleteErrorResult({
        requested: res.requested,
        deleted: res.deleted,
        failed: res.failed,
        errorMessage: res.error || 'Failed to delete selected courses from Supabase database.'
      });
    } else {
      setSelectedCourseCodes([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const selectedItemsSummary: BulkDeleteItemSummary[] = groupedCourses
    .filter(g => selectedCourseCodes.includes(g.courseCode))
    .map(g => ({
      id: g.courseCode,
      primary: g.courseCode,
      secondary: g.programName || g.programCode,
      badge: `${g.modulesCount} Modules • ${g.totalDurationFormatted}`
    }));

  return (
    <div className="space-y-4" id="training-courses-tab">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search & Select All Checkbox */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {filteredGroups.length > 0 && (
            <div className="flex items-center gap-1.5 pl-1" title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}>
              <input
                type="checkbox"
                id="select-all-courses-checkbox"
                checked={isAllVisibleSelected}
                ref={input => {
                  if (input) input.indeterminate = isSomeVisibleSelected;
                }}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
                All
              </span>
            </div>
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-courses-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Course Code, Program, or Module..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Filters and Create Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="filter-courses-program"
            value={programFilter}
            onChange={e => setProgramFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 max-w-[180px] truncate"
          >
            <option value="all">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.programCode}>
                {p.programCode} ({p.programName})
              </option>
            ))}
          </select>

          <select
            id="filter-courses-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="In Review">In Review</option>
            <option value="Archived">Archived</option>
          </select>

          {canCreate && (
            <button
              id="btn-create-course"
              onClick={() => {
                setCourseToEdit(null);
                setDefaultCourseCode(undefined);
                setDefaultProgramCode(undefined);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Course</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar for Administrator */}
      {selectedCourseCodes.length > 0 && (
        <div 
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
          id="courses-bulk-action-bar"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span id="selected-courses-count">Selected: {selectedCourseCodes.length}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {selectedCourseCodes.length === 1 ? '1 course selected' : `${selectedCourseCodes.length} courses selected`}
            </span>
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
              id="btn-toggle-all-visible-courses"
            >
              {isAllVisibleSelected ? 'Deselect visible' : `Select all visible (${filteredGroups.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              id="btn-clear-course-selection"
            >
              Clear Selection
            </button>

            {/* Administrator Only Bulk Delete */}
            {isAdmin && (
              <button
                onClick={handleOpenBulkDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-bulk-delete-courses"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedCourseCodes.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Courses List - Grouped by CourseCode */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm" id="empty-state-courses">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No training courses created yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Assemble courses by mapping modules into learning programs, or bulk import via Excel (.xlsx).
            </p>
            <div className="flex items-center justify-center gap-3">
              {canCreate && (
                <button
                  id="btn-empty-create-course"
                  onClick={() => {
                    setCourseToEdit(null);
                    setDefaultCourseCode(undefined);
                    setDefaultProgramCode(undefined);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Course</span>
                </button>
              )}
              <button
                id="btn-empty-import-courses"
                onClick={() => setActiveSubTab('import')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel Import</span>
              </button>
            </div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-sm">No courses match filter</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          filteredGroups.map(grp => {
            const isCollapsed = collapsedGroups[grp.courseCode];
            const prog = programs.find(p => p.programCode.toUpperCase() === grp.programCode.toUpperCase());
            const isSelected = selectedCourseCodes.includes(grp.courseCode);

            return (
              <div 
                key={grp.courseCode}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all overflow-hidden ${
                  isSelected 
                    ? 'border-purple-400 dark:border-purple-700 ring-2 ring-purple-500/20 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
                id={`course-card-${grp.courseCode}`}
              >
                {/* Course Card Header */}
                <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isSelected 
                    ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60' 
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {/* Row Selection Checkbox */}
                    <input
                      type="checkbox"
                      id={`select-course-${grp.courseCode}`}
                      checked={isSelected}
                      onChange={() => handleToggleCourse(grp.courseCode)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                    />

                    <button
                      onClick={() => toggleGroupCollapse(grp.courseCode)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expand Course" : "Collapse Course"}
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {grp.courseCode}
                        </span>

                        <span className="text-slate-300 dark:text-slate-700">•</span>

                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <FolderKanban className="w-3.5 h-3.5" />
                          {grp.programCode}
                        </span>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          grp.status === 'Approved' || grp.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}>
                          {grp.status || 'Approved'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {prog?.programName || grp.programName}
                      </h3>
                    </div>
                  </div>

                  {/* Header Metrics & Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        {grp.modulesCount} {grp.modulesCount === 1 ? 'module' : 'modules'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        {grp.totalDurationFormatted}
                      </span>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setCourseToEdit(null);
                          setDefaultCourseCode(grp.courseCode);
                          setDefaultProgramCode(grp.programCode);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Add Module to this Course"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Module</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => setCourseGroupToDelete(grp.courseCode)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete entire Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-table: Modules by Delivery Day */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                          <th className="py-2.5 px-4 text-center w-20">Day</th>
                          <th className="py-2.5 px-4">Module Code & Name</th>
                          <th className="py-2.5 px-4 text-center">Duration</th>
                          <th className="py-2.5 px-4">Delivery Mode</th>
                          <th className="py-2.5 px-4">Owner Role</th>
                          <th className="py-2.5 px-4 text-center">Assessments</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {grp.modules.map(modRow => (
                          <tr 
                            key={modRow.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                Day {modRow.deliveryDay}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                {modRow.moduleCode}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                                {modRow.moduleName}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                                <Clock className="w-3 h-3" />
                                {formatDurationDisplay(modRow.duration)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              <span className="truncate block max-w-[180px]">{modRow.deliveryMode}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{modRow.ownerRole}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {modRow.preAssessmentCode || modRow.postAssessmentCode ? (
                                <div className="space-y-0.5 text-[10px] font-mono">
                                  {modRow.preAssessmentCode && (
                                    <div className="text-cyan-600 dark:text-cyan-400">Pre: {modRow.preAssessmentCode}</div>
                                  )}
                                  {modRow.postAssessmentCode && (
                                    <div className="text-purple-600 dark:text-purple-400">Post: {modRow.postAssessmentCode}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                {modRow.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setCourseToEdit(modRow.courseRecord);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Module Assignment"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => setCourseRowToDelete(modRow.courseRecord)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Remove Module from Course"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Course Group Confirmation Modal */}
      {courseGroupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Course</h3>
                <p className="text-xs text-slate-500 font-mono">{courseGroupToDelete}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete entire course <span className="font-mono font-bold text-slate-900 dark:text-white">{courseGroupToDelete}</span> and all its linked module mappings?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseGroupToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteGroup}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Row Confirmation */}
      {courseRowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Module Assignment</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {courseRowToDelete.courseCode} / {courseRowToDelete.moduleCode}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Remove module <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{courseRowToDelete.moduleCode}</span> on Day {courseRowToDelete.deliveryDay} from Course {courseRowToDelete.courseCode}?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseRowToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRow}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Remove Assignment'}
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
        }}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${selectedCourseCodes.length} selected Course${selectedCourseCodes.length === 1 ? '' : 's'}?`}
        entityName="Courses"
        itemCount={selectedCourseCodes.length}
        selectedItems={selectedItemsSummary}
        isDeleting={isDeleting}
        errorResult={bulkDeleteErrorResult}
      />

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCourseToEdit(null);
          setDefaultCourseCode(undefined);
          setDefaultProgramCode(undefined);
        }}
        courseToEdit={courseToEdit}
        defaultProgramCode={defaultProgramCode}
        defaultCourseCode={defaultCourseCode}
      />
    </div>
  );
};

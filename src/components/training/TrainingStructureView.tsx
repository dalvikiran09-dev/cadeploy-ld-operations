import React, { useState } from 'react';
import { useTraining } from '../../context/TrainingContext';
import { formatDurationDisplay } from '../../utils/trainingUtils';
import { 
  FolderKanban, 
  Layers, 
  BookOpen, 
  Clock, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  CheckCircle2,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

export const TrainingStructureView: React.FC = () => {
  const { programs, modules, courses, groupedCourses, setActiveSubTab } = useTraining();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    programs.forEach(p => { initial[p.programCode] = true; });
    return initial;
  });

  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groupedCourses.forEach(c => { initial[c.courseCode] = true; });
    return initial;
  });

  const toggleProgram = (code: string) => {
    setExpandedPrograms(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleCourse = (code: string) => {
    setExpandedCourses(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const pMap: Record<string, boolean> = {};
    programs.forEach(p => { pMap[p.programCode] = true; });
    setExpandedPrograms(pMap);

    const cMap: Record<string, boolean> = {};
    groupedCourses.forEach(c => { cMap[c.courseCode] = true; });
    setExpandedCourses(cMap);
  };

  const collapseAll = () => {
    setExpandedPrograms({});
    setExpandedCourses({});
  };

  // Filter programs based on search
  const filteredPrograms = programs.filter(p => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    if (p.programCode.toLowerCase().includes(query) || p.programName.toLowerCase().includes(query)) {
      return true;
    }

    // Check if any child course matches
    const childCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
    return childCourses.some(c => {
      const mod = modules.find(m => m.moduleCode.toUpperCase() === c.moduleCode.toUpperCase());
      return c.courseCode.toLowerCase().includes(query) ||
             c.moduleCode.toLowerCase().includes(query) ||
             (mod && mod.moduleName.toLowerCase().includes(query));
    });
  });

  return (
    <div className="space-y-4" id="training-structure-view">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-structure-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hierarchy (Programs, Courses, Modules)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Hierarchy controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* Tree Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        {programs.length === 0 ? (
          <div className="text-center py-16 px-4" id="empty-state-structure">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No training hierarchy defined yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Create training programs and link courses and modules to view the interactive hierarchical tree structure.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                id="btn-empty-structure-programs"
                onClick={() => setActiveSubTab('programs')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <FolderKanban className="w-4 h-4" />
                <span>Go to Programs</span>
              </button>
              <button
                id="btn-empty-structure-import"
                onClick={() => setActiveSubTab('import')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel Import</span>
              </button>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FolderKanban className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-sm">No training structure matches your search query</p>
          </div>
        ) : (
          filteredPrograms.map(p => {
            const isPExpanded = expandedPrograms[p.programCode] ?? true;
            const programCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
            const uniqueCourseCodes: string[] = Array.from(new Set(programCourses.map(c => c.courseCode.toUpperCase())));

            return (
              <div 
                key={p.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 overflow-hidden"
              >
                {/* Level 1: PROGRAM NODE */}
                <div 
                  onClick={() => toggleProgram(p.programCode)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200/60 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      {isPExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <FolderKanban className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {p.programCode}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {p.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {p.programName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      {uniqueCourseCodes.length} {uniqueCourseCodes.length === 1 ? 'Course' : 'Courses'}
                    </span>
                  </div>
                </div>

                {/* Level 2: COURSES INSIDE PROGRAM */}
                {isPExpanded && (
                  <div className="p-4 pl-8 space-y-3 bg-white/50 dark:bg-slate-900/20">
                    {uniqueCourseCodes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 pl-4">
                        No courses assigned to this program yet.
                      </p>
                    ) : (
                      uniqueCourseCodes.map(courseCode => {
                        const isCExpanded = expandedCourses[courseCode] ?? true;
                        const courseRecords = programCourses.filter(c => c.courseCode.toUpperCase() === courseCode.toUpperCase());
                        courseRecords.sort((a, b) => a.deliveryDay - b.deliveryDay);

                        return (
                          <div
                            key={courseCode}
                            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                          >
                            {/* COURSE NODE HEADER */}
                            <div
                              onClick={() => toggleCourse(courseCode)}
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                            >
                              <div className="flex items-center gap-2.5">
                                <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                  {isCExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>

                                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                  <Layers className="w-4 h-4" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                                      {courseCode}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                      {courseRecords[0]?.courseStatus || 'Approved'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="text-[11px] font-medium">
                                  {courseRecords.length} {courseRecords.length === 1 ? 'module' : 'modules'}
                                </span>
                              </div>
                            </div>

                            {/* Level 3: MODULES INSIDE COURSE BY DELIVERY DAY */}
                            {isCExpanded && (
                              <div className="p-3 pl-8 space-y-2 bg-slate-50/40 dark:bg-slate-900/40">
                                {courseRecords.map(cRec => {
                                  const mod = modules.find(m => m.moduleCode.toUpperCase() === cRec.moduleCode.toUpperCase());
                                  return (
                                    <div
                                      key={cRec.id}
                                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs hover:border-indigo-500/40 transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                                          Day {cRec.deliveryDay}
                                        </span>

                                        <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                          <BookOpen className="w-3.5 h-3.5" />
                                        </div>

                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                              {cRec.moduleCode}
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                              {mod?.moduleName || cRec.moduleCode}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                            <span>Mode: {cRec.deliveryMode1 || mod?.deliveryMode || 'Classroom'}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                              <UserCheck className="w-3 h-3 text-slate-400" />
                                              {cRec.ownerRole}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                                          <Clock className="w-3 h-3" />
                                          {formatDurationDisplay(mod?.duration)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

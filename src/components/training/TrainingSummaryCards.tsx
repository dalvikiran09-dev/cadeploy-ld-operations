import React from 'react';
import { useTraining } from '../../context/TrainingContext';
import { calculateTotalTrainingHours, formatTotalHoursDisplay } from '../../utils/trainingUtils';
import { 
  FolderKanban, 
  BookOpen, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export const TrainingSummaryCards: React.FC = () => {
  const { programs, modules, groupedCourses } = useTraining();

  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'Active').length;

  const totalModules = modules.length;
  const activeModules = modules.filter(m => m.status === 'Active').length;

  const totalCourses = groupedCourses.length;
  const activeCourses = groupedCourses.filter(c => c.status === 'Approved' || c.status === 'Active').length;

  const totalHoursNum = calculateTotalTrainingHours(modules);
  const totalHoursStr = formatTotalHoursDisplay(totalHoursNum);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6" id="training-kpi-summary-grid">
      {/* 1. Total Programs */}
      <div 
        id="kpi-total-programs"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Programs</span>
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {totalPrograms}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="font-medium text-blue-600 dark:text-blue-400">{activePrograms}</span> active
          </div>
        </div>
      </div>

      {/* 2. Active Programs */}
      <div 
        id="kpi-active-programs"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Prg</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {activePrograms}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalPrograms > 0 ? `${Math.round((activePrograms / totalPrograms) * 100)}% of total` : '0%'}
          </div>
        </div>
      </div>

      {/* 3. Total Modules */}
      <div 
        id="kpi-total-modules"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Modules</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {totalModules}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{activeModules}</span> active
          </div>
        </div>
      </div>

      {/* 4. Active Modules */}
      <div 
        id="kpi-active-modules"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-cyan-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Mod</span>
          <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 tracking-tight">
            {activeModules}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalModules > 0 ? `${Math.round((activeModules / totalModules) * 100)}% active` : '0%'}
          </div>
        </div>
      </div>

      {/* 5. Total Courses */}
      <div 
        id="kpi-total-courses"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-purple-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Courses</span>
          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {totalCourses}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="font-medium text-purple-600 dark:text-purple-400">{activeCourses}</span> approved
          </div>
        </div>
      </div>

      {/* 6. Active Courses */}
      <div 
        id="kpi-active-courses"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-violet-500/50 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Approved Crs</span>
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 tracking-tight">
            {activeCourses}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalCourses > 0 ? `${Math.round((activeCourses / totalCourses) * 100)}% approved` : '0%'}
          </div>
        </div>
      </div>

      {/* 7. Total Training Hours */}
      <div 
        id="kpi-total-training-hours"
        className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-all col-span-2 md:col-span-4 lg:col-span-1"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Duration</span>
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {totalHoursStr}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Curriculum content
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriorityBadge, CategoryBadge } from '../common/Badge';
import { formatDuration } from '../../utils/formatters';
import { TASK_CATEGORIES } from '../../types';
import { BarChart3, Filter, RotateCcw, Calendar as CalendarIcon, ZoomIn, ZoomOut } from 'lucide-react';

export const GanttView: React.FC = () => {
  const { tasks, users, categories } = useApp();
  const [zoomLevel, setZoomLevel] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    return true;
  });

  // Calculate timeline scale months (e.g. May to October 2026)
  const timelineMonths = [
    { name: 'May 2026', days: 31 },
    { name: 'Jun 2026', days: 30 },
    { name: 'Jul 2026', days: 31 },
    { name: 'Aug 2026', days: 31 },
    { name: 'Sep 2026', days: 30 },
    { name: 'Oct 2026', days: 31 }
  ];

  // Helper to map task dates to Gantt percentage left and width
  const getGanttPosition = (startStr: string, dueStr: string) => {
    // Reference window: 2026-05-01 to 2026-10-31 (184 days total)
    const baseStart = new Date('2026-05-01').getTime();
    const totalDays = 184;

    const taskStart = new Date(startStr || '2026-07-01').getTime();
    const taskDue = new Date(dueStr || '2026-08-01').getTime();

    const startDiffDays = Math.max(0, (taskStart - baseStart) / (1000 * 60 * 60 * 24));
    const durationDays = Math.max(3, (taskDue - taskStart) / (1000 * 60 * 60 * 24));

    const leftPercent = Math.min(90, Math.max(0, (startDiffDays / totalDays) * 100));
    const widthPercent = Math.min(100 - leftPercent, Math.max(4, (durationDays / totalDays) * 100));

    return { leftPercent, widthPercent };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            L&D Gantt Timeline & Schedule Execution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Interactive timeline view for multi-month training calendars, audit schedules, and operational deliverable progress.
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] as const).map(z => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                zoomLevel === z 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" /> Filters:
          </span>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All L&D Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Task Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedStatus('all');
          }}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Gantt Chart Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline Column Headers */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="w-80 shrink-0 p-3.5 border-r border-slate-200 dark:border-slate-700">
                Task & Category
              </div>
              <div className="flex-1 flex">
                {timelineMonths.map(m => (
                  <div key={m.name} className="flex-1 p-3.5 text-center border-r border-slate-200/60 dark:border-slate-700/60">
                    {m.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Task Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map(t => {
                const assignedUser = users.find(u => u.id === t.assignedUserId);
                const { leftPercent, widthPercent } = getGanttPosition(t.startDate, t.dueDate);

                return (
                  <div key={t.id} className="flex items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors py-3">
                    {/* Left Column Task Info */}
                    <div className="w-80 shrink-0 px-4 border-r border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.code}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{t.title}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{t.startDate} - {t.dueDate}</span>
                        <span>•</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{assignedUser?.name}</span>
                        <span>•</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{formatDuration(t.hoursSpent)}</span>
                      </div>
                    </div>

                    {/* Right Column Visual Bar Track */}
                    <div className="flex-1 relative h-12 flex items-center px-2">
                      {/* Grid Background Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineMonths.map(m => (
                          <div key={m.name} className="flex-1 border-r border-slate-100 dark:border-slate-800/60"></div>
                        ))}
                      </div>

                      {/* Gantt Bar */}
                      <div
                        className="absolute h-7 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center px-2 shadow-sm transition-all overflow-hidden group cursor-pointer"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        title={`${t.title} (${t.code}): ${t.progress}% completed | Time Spent: ${formatDuration(t.hoursSpent)}`}
                      >
                        {/* Progress Overlay */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-blue-400/40"
                          style={{ width: `${t.progress}%` }}
                        />
                        <span className="relative z-10 truncate">{t.title} ({t.progress}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

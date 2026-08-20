import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { TaskModal } from '../tasks/TaskModal';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, 
  GraduationCap, ShieldCheck, Users, Plus, Edit, Trash2, Move, Clock
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, updateTask, deleteTask } = useApp();
  const [calendarView, setCalendarView] = useState<'Month' | 'Week' | 'Day' | 'Agenda'>('Month');
  const [selectedTagFilter, setSelectedTagFilter] = useState<'all' | 'Training' | 'Audits' | 'Meetings'>('all');
  
  // Date state: reference date (defaulting to August 2026 or current year/month)
  const [currentDate, setCurrentDate] = useState(() => {
    // If tasks exist with dates in 2026, start at 2026-08, else current date
    return new Date(2026, 7, 1);
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<string | undefined>(undefined);

  // Quick Move Date Modal
  const [moveTask, setMoveTask] = useState<Task | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState('');

  // Month navigation
  const handlePrev = () => {
    if (calendarView === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (calendarView === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (calendarView === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (calendarView === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate Days in current Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper date formatter
  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = m < 10 ? `0${m}` : `${m}`;
    const dd = d < 10 ? `0${d}` : `${d}`;
    return `${y}-${mm}-${dd}`;
  };

  // Filter tasks for a specific YYYY-MM-DD
  const filterTasksForDateStr = (dateStr: string) => {
    return tasks.filter(t => {
      const isDate = t.dueDate === dateStr || t.startDate === dateStr;
      if (!isDate) return false;

      if (selectedTagFilter === 'Training' && !t.category.includes('Training')) return false;
      if (selectedTagFilter === 'Audits' && !t.category.includes('Audit') && !t.category.includes('QMS')) return false;
      if (selectedTagFilter === 'Meetings' && t.category !== 'Meetings' && t.category !== 'Management Review') return false;

      return true;
    });
  };

  // Quick move date submit
  const handleSaveMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTask || !moveTargetDate) return;
    await updateTask(moveTask.id, {
      dueDate: moveTargetDate,
      startDate: moveTask.startDate > moveTargetDate ? moveTargetDate : moveTask.startDate
    });
    setMoveTask(null);
  };

  // Quick shift task by days (-1 or +1)
  const handleQuickShift = async (task: Task, days: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const curr = new Date(task.dueDate || new Date().toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + days);
    const newDateStr = curr.toISOString().split('T')[0];
    await updateTask(task.id, { dueDate: newDateStr });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this event task?')) {
      await deleteTask(taskId);
    }
  };

  // Open Edit Modal
  const handleEditClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Open Create Modal for specific date
  const handleDayClick = (dateStr: string) => {
    setEditingTask(null);
    setNewTaskInitialDate(dateStr);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            L&D Operational & Training Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department master schedule for upcoming technical training workshops, QMS internal/external audits, and executive reviews.
          </p>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['Month', 'Week', 'Day', 'Agenda'] as const).map(v => (
            <button
              key={v}
              onClick={() => setCalendarView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                calendarView === v 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Pills & Month Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Focus:
          </span>

          <button
            onClick={() => setSelectedTagFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedTagFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            All Events
          </button>

          <button
            onClick={() => setSelectedTagFilter('Training')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              selectedTagFilter === 'Training'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Training
          </button>

          <button
            onClick={() => setSelectedTagFilter('Audits')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              selectedTagFilter === 'Audits'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Audits
          </button>

          <button
            onClick={() => setSelectedTagFilter('Meetings')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              selectedTagFilter === 'Meetings'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Meetings
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3 font-bold text-sm text-slate-800 dark:text-slate-200">
          <button 
            onClick={handlePrev}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="min-w-[140px] text-center">{monthName}</span>
          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {calendarView === 'Month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 border-collapse">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-900/40 border-r border-b border-slate-100 dark:border-slate-800/80" />
            ))}

            {/* Days of month */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDateStr(year, month + 1, dayNum);
              const dayTasks = filterTasksForDateStr(dateStr);

              return (
                <div 
                  key={dateStr} 
                  onClick={() => handleDayClick(dateStr)}
                  className="group min-h-[110px] p-2 border-r border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{dayNum}</span>
                    <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[120px]">
                    {dayTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        className="group/event p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold text-blue-900 dark:text-blue-200 truncate cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors relative flex items-center justify-between"
                        title={`${t.code}: ${t.title}`}
                      >
                        <span className="truncate pr-1">
                          <strong className="text-blue-600 mr-1">{t.code}:</strong>
                          {t.title}
                        </span>

                        {/* Quick Action Icons on Event (Requirement 10: Editable, Movable, Deletable) */}
                        <div className="hidden group-hover/event:flex items-center gap-0.5 shrink-0 bg-blue-100 dark:bg-blue-900 rounded p-0.5">
                          <button
                            onClick={(e) => handleEditClick(t, e)}
                            className="p-0.5 text-slate-600 hover:text-blue-600 dark:text-slate-300"
                            title="Edit Event"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMoveTask(t);
                              setMoveTargetDate(t.dueDate);
                            }}
                            className="p-0.5 text-slate-600 hover:text-amber-600 dark:text-slate-300"
                            title="Move / Reschedule Date"
                          >
                            <Move className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTask(t.id, e)}
                            className="p-0.5 text-slate-600 hover:text-rose-600 dark:text-slate-300"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK & DAY & AGENDA VIEWS */}
      {calendarView !== 'Month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            {calendarView} View Schedule ({monthName})
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map(t => (
              <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-mono text-[11px] font-bold">
                      {t.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Category: <strong>{t.category}</strong></span>
                    <span>Assigned By: <strong>{t.assignedByName || 'Kiran Dalvi'}</strong></span>
                    <span>Due Date: <strong>{t.dueDate}</strong></span>
                    <span>Status: <strong>{t.status}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTaskId(t.id)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => handleEditClick(t, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Task"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setMoveTask(t);
                      setMoveTargetDate(t.dueDate);
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Move Date"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteTask(t.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOVE DATE MODAL (Requirement 10: Event Movable) */}
      {moveTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Move className="w-4 h-4 text-amber-500" /> Reschedule Event Date
            </h3>
            <p className="text-xs text-slate-500">
              Move event <strong>{moveTask.code}: {moveTask.title}</strong> to a new calendar date.
            </p>

            <form onSubmit={handleSaveMove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Due Date
                </label>
                <input
                  type="date"
                  required
                  value={moveTargetDate}
                  onChange={e => setMoveTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveTask(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow hover:bg-blue-700"
                >
                  Save New Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      <TaskDetailModal 
        taskId={selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
        onEditTask={(task) => {
          setSelectedTaskId(null);
          setEditingTask(task);
          setIsTaskModalOpen(true);
        }} 
      />

      {/* EDIT / CREATE TASK MODAL */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setNewTaskInitialDate(undefined);
        }}
        taskToEdit={editingTask}
        initialDate={newTaskInitialDate}
      />
    </div>
  );
};

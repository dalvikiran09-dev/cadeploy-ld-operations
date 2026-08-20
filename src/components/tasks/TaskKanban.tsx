import React from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge, CategoryBadge } from '../common/Badge';
import { Clock, CheckSquare, Plus, MoveRight, MoveLeft } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface TaskKanbanProps {
  tasksList: Task[];
  onSelectTask: (taskId: string) => void;
  onOpenTaskModal: () => void;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({ tasksList, onSelectTask, onOpenTaskModal }) => {
  const { updateTask, users } = useApp();

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'Pending', label: 'Pending', color: 'border-slate-400 text-slate-700' },
    { status: 'Assigned', label: 'Assigned', color: 'border-sky-500 text-sky-700' },
    { status: 'In Progress', label: 'In Progress', color: 'border-blue-600 text-blue-700' },
    { status: 'Waiting', label: 'Waiting', color: 'border-purple-500 text-purple-700' },
    { status: 'Under Review', label: 'Under Review', color: 'border-amber-500 text-amber-700' },
    { status: 'Completed', label: 'Completed', color: 'border-emerald-500 text-emerald-700' },
    { status: 'Closed', label: 'Closed', color: 'border-teal-600 text-teal-700' },
    { status: 'Cancelled', label: 'Cancelled', color: 'border-rose-500 text-rose-700' }
  ];

  const moveStatus = (task: Task, direction: 'prev' | 'next') => {
    const currentIndex = columns.findIndex(c => c.status === task.status);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < columns.length) {
      updateTask(task.id, { status: columns[nextIndex].status });
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {columns.map(col => {
        const colTasks = tasksList.filter(t => t.status === col.status);

        return (
          <div 
            key={col.status} 
            className="w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[75vh]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-2 mb-3 border-b-2 ${col.color}`}>
              <div className="font-bold text-xs flex items-center gap-2">
                <span>{col.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs font-mono font-bold">
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={onOpenTaskModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Add Task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {colTasks.length === 0 ? (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  No tasks in {col.label}
                </div>
              ) : (
                colTasks.map(t => {
                  const assignedUser = users.find(u => u.id === t.assignedUserId);

                  return (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{t.code}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>

                      <div 
                        onClick={() => onSelectTask(t.id)}
                        className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer line-clamp-2"
                      >
                        {t.title}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CategoryBadge category={t.category} />
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                          <span>Progress</span>
                          <span>{t.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t.progress}%` }}></div>
                        </div>
                      </div>

                      {/* Footer Info & Shift Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserAvatar name={assignedUser?.name || 'Unassigned'} size="xs" className="w-5 h-5" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{assignedUser?.name || 'Unassigned'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStatus(t, 'prev')}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700"
                            title="Move to Previous Status"
                          >
                            <MoveLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveStatus(t, 'next')}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700"
                            title="Move to Next Status"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

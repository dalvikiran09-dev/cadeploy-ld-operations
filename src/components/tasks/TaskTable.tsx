import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';
import { Clock, Eye, Edit, Trash2, ArrowUpDown, CheckSquare } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
import { UserAvatar } from '../common/UserAvatar';

interface TaskTableProps {
  tasksList: Task[];
  onSelectTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasksList, onSelectTask, onEditTask }) => {
  console.log("TaskTable receives:", tasksList.length);
  const { updateTask, deleteTask, bulkDeleteTasks, users, taskFilters } = useApp();
  const [sortField, setSortField] = useState<'code' | 'dueDate' | 'priority' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysOverdue = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleSort = (field: 'code' | 'dueDate' | 'priority' | 'progress') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasksList].sort((a, b) => {
    let comp = 0;
    if (sortField === 'code') comp = a.code.localeCompare(b.code);
    else if (sortField === 'dueDate') comp = a.dueDate.localeCompare(b.dueDate);
    else if (sortField === 'progress') comp = a.progress - b.progress;
    return sortOrder === 'asc' ? comp : -comp;
  });

  const allVisibleSelected = sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sortedTasks.map(t => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedTaskIds.length} selected task(s)? Remaining tasks will be resequenced in strict creation date order.`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      await bulkDeleteTasks(selectedTaskIds);
      setSelectedTaskIds([]);
    } catch (e) {
      console.error('Error during bulk task deletion:', e);
      alert('Failed to delete selected tasks.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const statusesList: TaskStatus[] = [
    'Pending', 'Assigned', 'In Progress', 'Waiting', 'Under Review', 'Completed', 'Closed', 'Cancelled'
  ];

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-4 py-2.5 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedTaskIds.length} task(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedTaskIds.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    Task Code <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Title & Scope</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Assigned By</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-1">
                    Due Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Hours Spent</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('progress')}>
                  <div className="flex items-center gap-1">
                    Progress <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-semibold text-sm">
                    No matching tasks found.
                  </td>
                </tr>
              ) : (
                sortedTasks.map(t => {
                  const assignedUser = users.find(u => u.id === t.assignedUserId);
                  const isDueToday = t.dueDate === todayStr && t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled';
                  const isOverdue = t.dueDate < todayStr && t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled';
                  const isSelected = selectedTaskIds.includes(t.id);

                  return (
                    <tr 
                      key={t.id} 
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : isDueToday 
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30' 
                          : isOverdue 
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTask(t.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {t.code}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div 
                          onClick={() => onSelectTask(t.id)} 
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer truncate"
                        >
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {t.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <CategoryBadge category={t.category} />
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={t.status}
                          onChange={e => updateTask(t.id, { status: e.target.value as TaskStatus })}
                          className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5"
                        >
                          {statusesList.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={assignedUser || { name: 'Unassigned' }} size="xs" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{assignedUser?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={{ name: t.assignedByName || 'Kiran Dalvi' }} size="xs" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {t.assignedByName || 'Kiran Dalvi'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex flex-col gap-0.5">
                          <span>{t.dueDate}</span>
                          {isDueToday && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-white w-max">
                              DUE TODAY
                            </span>
                          )}
                          {isOverdue && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white w-max">
                              {getDaysOverdue(t.dueDate)} DAYS OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        {formatDuration(t.hoursSpent)}
                      </td>

                      <td className="py-3.5 px-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{t.progress}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectTask(t.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTask(t)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
                            title="Edit Task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete task? Remaining active tasks will be renumbered in creation order.')) deleteTask(t.id);
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 rounded-lg"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  );
};

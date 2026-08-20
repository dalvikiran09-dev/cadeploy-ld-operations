import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { TaskTable } from './TaskTable';
import { TaskKanban } from './TaskKanban';
import { TaskModal } from './TaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { TASK_CATEGORIES } from '../../types';
import { 
  List, LayoutGrid, Plus, Filter, RotateCcw, CheckSquare, Search 
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { tasks, users, currentUser, taskFilters, setTaskFilters, resetTaskFilters, categories } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  console.log("TasksView receives:", tasks.length);
  console.log("Before filtering:", tasks.length);

  // Filter Tasks with Preset and dropdown support
  const filteredTasks = tasks.filter(t => {
    // Preset Filters
    if (taskFilters.preset) {
      if (taskFilters.preset === 'open') {
        if (t.status === 'Completed' || t.status === 'Closed' || t.status === 'Cancelled') return false;
      } else if (taskFilters.preset === 'completed') {
        if (t.status !== 'Completed' && t.status !== 'Closed') return false;
      } else if (taskFilters.preset === 'overdue') {
        if (t.status === 'Completed' || t.status === 'Closed' || t.status === 'Cancelled') return false;
        if (t.dueDate >= todayStr) return false;
      } else if (taskFilters.preset === 'dueToday') {
        if (t.status === 'Completed' || t.status === 'Closed' || t.status === 'Cancelled') return false;
        if (t.dueDate !== todayStr) return false;
      } else if (taskFilters.preset === 'criticalHigh') {
        if (t.status === 'Completed' || t.status === 'Closed' || t.status === 'Cancelled') return false;
        if (t.priority !== 'Critical' && t.priority !== 'High') return false;
      } else if (taskFilters.preset === 'assignedToMe') {
        if (t.assignedUserId !== currentUser.id) return false;
      } else if (taskFilters.preset === 'assignedByMe') {
        if (t.assignedByUserId !== currentUser.id && t.assignedByName !== currentUser.name) return false;
      }
    }

    // Standard Filters
    if (taskFilters.category !== 'all' && t.category !== taskFilters.category) return false;
    if (taskFilters.priority !== 'all' && t.priority !== taskFilters.priority) return false;
    if (taskFilters.status !== 'all' && t.status !== taskFilters.status) return false;
    
    if (taskFilters.assignedUserId === 'assigned_to_me') {
      if (t.assignedUserId !== currentUser.id) return false;
    } else if (taskFilters.assignedUserId === 'assigned_by_me') {
      if (t.assignedByUserId !== currentUser.id && t.assignedByName !== currentUser.name) return false;
    } else if (taskFilters.assignedUserId !== 'all') {
      if (t.assignedUserId !== taskFilters.assignedUserId) return false;
    }

    // Search Query
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const assignedUser = users.find(u => u.id === t.assignedUserId);
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.assignedByName && t.assignedByName.toLowerCase().includes(q)) ||
        (t.assignedByUsername && t.assignedByUsername.toLowerCase().includes(q)) ||
        (assignedUser && assignedUser.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Apply requirement-specific sorting
  if (taskFilters.preset === 'overdue') {
    // Sort by oldest overdue first
    filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } else if (taskFilters.preset === 'criticalHigh') {
    // Group Critical first, then High
    filteredTasks.sort((a, b) => {
      if (a.priority === 'Critical' && b.priority !== 'Critical') return -1;
      if (a.priority !== 'Critical' && b.priority === 'Critical') return 1;
      return 0;
    });
  }

  console.log("After filtering:", filteredTasks.length);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  console.log('[DEBUG] Total tasks before rendering the task list:', tasks.length);

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            L&D Operational Tasks & Deliverables
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track, assign, filter, and complete operational tasks across all 25 Learning & Development categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" /> List Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban Board
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Active Preset Filter Banner */}
      {taskFilters.preset && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs font-semibold text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>
              Active Preset Filter: <strong className="uppercase font-bold">{taskFilters.preset === 'criticalHigh' ? 'Critical & High Priority' : taskFilters.preset}</strong>
              {' '}(Showing {filteredTasks.length} tasks)
            </span>
          </div>
          <button
            onClick={() => resetTaskFilters()}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-[11px]"
          >
            Show All Tasks
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" /> Filter Tasks
          </span>
          <button
            onClick={() => {
              resetTaskFilters();
              setLocalSearch('');
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search title, code..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={taskFilters.category}
            onChange={e => setTaskFilters(prev => ({ ...prev, category: e.target.value as any, preset: null }))}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={taskFilters.priority}
            onChange={e => setTaskFilters(prev => ({ ...prev, priority: e.target.value as any, preset: null }))}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={taskFilters.status}
            onChange={e => setTaskFilters(prev => ({ ...prev, status: e.target.value as any, preset: null }))}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Assigned User Filter */}
          <select
            value={taskFilters.assignedUserId}
            onChange={e => setTaskFilters(prev => ({ ...prev, assignedUserId: e.target.value, preset: null }))}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Assigned Users</option>
            <option value="assigned_to_me">Tasks Assigned To Me</option>
            <option value="assigned_by_me">Tasks Assigned By Me</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <TaskTable 
          tasksList={filteredTasks} 
          onSelectTask={id => setSelectedTaskId(id)} 
          onEditTask={task => handleOpenEdit(task)} 
        />
      ) : (
        <TaskKanban 
          tasksList={filteredTasks} 
          onSelectTask={id => setSelectedTaskId(id)} 
          onOpenTaskModal={handleOpenCreate} 
        />
      )}

      {/* Task Create / Edit Modal */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskToEdit={editingTask} 
      />

      {/* Task Detail Modal */}
      <TaskDetailModal 
        taskId={selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
        onEditTask={task => {
          setSelectedTaskId(null);
          handleOpenEdit(task);
        }} 
      />
    </div>
  );
};

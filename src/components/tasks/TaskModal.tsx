import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskCategory, TaskStatus, Priority } from '../../types';
import { formatDuration } from '../../utils/formatters';
import { X, Plus, Trash2, Calendar, Clock, Bell, RefreshCw, Tag } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit, initialDate }) => {
  const { addTask, updateTask, users, categories, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Training');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [assignedUserId, setAssignedUserId] = useState(users[0]?.id || '');
  const [assignedByName, setAssignedByName] = useState(currentUser?.name || 'Kiran Dalvi');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [reminder, setReminder] = useState('');
  const [recurring, setRecurring] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'>('None');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setAssignedUserId(taskToEdit.assignedUserId);
      setAssignedByName(taskToEdit.assignedByName || currentUser.name);
      setStartDate(taskToEdit.startDate);
      setDueDate(taskToEdit.dueDate);
      setCompletionDate(taskToEdit.completionDate || '');
      setHoursSpent(taskToEdit.hoursSpent ?? 0);
      setProgress(taskToEdit.progress || 0);
      setReminder(taskToEdit.reminder || '');
      setRecurring(taskToEdit.recurring || 'None');
      setTags(taskToEdit.tags || []);
      setChecklist(taskToEdit.checklist || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Training');
      setPriority('Medium');
      setStatus('Pending');
      setAssignedUserId(users[0]?.id || '');
      setAssignedByName(currentUser.name);
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setStartDate(defaultDate);
      setDueDate(defaultDate);
      setCompletionDate('');
      setHoursSpent(0);
      setProgress(0);
      setReminder('');
      setRecurring('None');
      setTags(['L&D']);
      setChecklist([]);
    }
  }, [taskToEdit, users, currentUser]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setChecklist([...checklist, { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setChecklist(checklist.filter(s => s.id !== id));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      await updateTask(taskToEdit.id, {
        title,
        description,
        category,
        priority,
        status,
        assignedUserId,
        assignedByName: assignedByName.trim() || currentUser.name,
        startDate,
        dueDate,
        completionDate: (status === 'Completed' || status === 'Closed') ? (completionDate || new Date().toISOString().split('T')[0]) : undefined,
        hoursSpent: Number(hoursSpent) || 0,
        progress: (status === 'Completed' || status === 'Closed') ? 100 : progress,
        reminder,
        recurring,
        tags,
        checklist
      });
    } else {
      await addTask({
        title,
        description,
        category,
        priority,
        status,
        assignedUserId,
        assignedByName: assignedByName.trim() || currentUser.name,
        startDate,
        dueDate,
        completionDate: (status === 'Completed' || status === 'Closed') ? (completionDate || new Date().toISOString().split('T')[0]) : undefined,
        hoursSpent: Number(hoursSpent) || 0,
        progress: (status === 'Completed' || status === 'Closed') ? 100 : progress,
        reminder,
        recurring,
        tags,
        checklist
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            {taskToEdit ? `Edit Operational Task: ${taskToEdit.code}` : 'Create New Operational Task'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q3 Training Master Calendar & Room Booking Finalization"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Operational Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide detailed instructions, expected deliverables, or compliance requirements..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row: Category, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category (L&D Taxonomy) *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority *
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting">Waiting</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Row: Assigned To, Assigned By, Assigned On */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned To
              </label>
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned By
              </label>
              <input
                type="text"
                value={assignedByName}
                onChange={e => setAssignedByName(e.target.value)}
                placeholder="Enter assigner name"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned On
              </label>
              <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">
                {taskToEdit?.assignedOn ? taskToEdit.assignedOn : 'Auto-generated on creation'}
              </div>
            </div>
          </div>

          {/* Row: Hours & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hours Spent (Decimal Hours)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={hoursSpent}
                onChange={e => setHoursSpent(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 2.5 or 0.25"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {hoursSpent > 0 && (
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                  Duration: {formatDuration(hoursSpent)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Progress %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Completion Date (If completed)
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={e => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: Recurring & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                Recurring Task Frequency
              </label>
              <select
                value={recurring}
                onChange={e => setRecurring(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="None">None (One-time)</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                Reminder Date / Note
              </label>
              <input
                type="text"
                value={reminder}
                onChange={e => setReminder(e.target.value)}
                placeholder="e.g. 2026-08-04 09:00 AM or Review 2 days before deadline"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg font-medium border border-indigo-200 dark:border-indigo-900">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500 ml-1">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add tag and click Add (e.g. QMS, Audit, ISO9001)"
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold rounded-xl"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Checklist (Subtasks) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Checklist / Milestones ({checklist.filter(c => c.completed).length}/{checklist.length})
            </label>
            
            <div className="space-y-2 mb-3">
              {checklist.map(st => (
                <div key={st.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                  <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                    {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Add checklist item..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
            >
              {taskToEdit ? 'Save Task Updates' : 'Create Operational Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';
import { formatDuration } from '../../utils/formatters';
import { 
  X, Calendar, Clock, User as UserIcon, MessageSquare, Paperclip, 
  CheckSquare, Send, Plus, Bell, RefreshCw, Tag, Edit, Trash2, History, Shield
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onEditTask: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose, onEditTask }) => {
  const { tasks, users, toggleSubtask, addComment, addAttachment, deleteTask } = useApp();
  
  const [commentText, setCommentText] = useState('');

  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const assignedUser = users.find(u => u.id === task.assignedUserId);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleSimulateUpload = () => {
    const name = prompt('Enter document file name (e.g. Audit_Evidence_2026.pdf):', 'L&D_Document.pdf');
    if (name) {
      addAttachment(task.id, {
        name,
        size: '1.5 MB',
        url: '#'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
              {task.code}
            </span>
            <CategoryBadge category={task.category} />
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditTask(task)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this task?')) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-xs font-semibold"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Title & Description */}
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">{task.title}</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
              {task.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Task Ownership & Assignment Panel */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" /> Ownership & Assignment Tracking
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned To:</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                  <UserAvatar name={assignedUser?.name || 'Unassigned'} size="xs" className="w-5 h-5" />
                  <span>{assignedUser?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned By:</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                  <UserAvatar name={task.assignedByName || 'System Administrator'} size="xs" className="w-5 h-5" />
                  <div>
                    <span>{task.assignedByName || 'System Administrator'}</span>
                    {task.assignedByUsername && (
                      <span className="block text-[10px] text-slate-400 font-normal">@{task.assignedByUsername}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned On:</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1 font-mono">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{task.assignedOn || task.createdAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Timeline Dates</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{task.startDate} → {task.dueDate}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium font-semibold">Hours Spent</div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(task.hoursSpent)}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">Recurring & Reminder</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>{task.recurring}</span>
              </div>
            </div>
          </div>

          {/* Assignment History Log */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Assignment History
            </h3>
            {(!task.assignmentHistory || task.assignmentHistory.length === 0) ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-400 italic">
                No assignment history recorded.
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-3 my-1">
                {task.assignmentHistory.map((rec, idx) => (
                  <div key={rec.id || idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900"></div>
                    <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{rec.timestamp}</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{rec.note}</div>
                    {rec.assignedByName && (
                      <div className="text-[10px] text-slate-400">Owner: {rec.assignedByName}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1 font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Completion Progress</span>
              <span className="text-blue-600 dark:text-blue-400">{task.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
            </div>
          </div>

          {/* Progress Bar */}

          {/* Subtasks / Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-600" /> Checklist & Deliverables
            </h3>
            {task.checklist.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No checklist items defined.</p>
            ) : (
              <div className="space-y-1.5">
                {task.checklist.map(st => (
                  <label key={st.id} className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(task.id, st.id)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className={`text-xs ${st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" /> Evidence & Attachments ({task.attachments.length})
              </h3>
              <button
                onClick={handleSimulateUpload}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Attach File
              </button>
            </div>
            {task.attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No attachments uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map(att => (
                  <div key={att.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{att.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Activity Comments & Discussion
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(task.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation below.</p>
              ) : (
                task.comments.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={c.userName} size="xs" className="w-5 h-5" />
                        <span className="font-bold text-slate-900 dark:text-white">{c.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 pl-7">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write an operational comment..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

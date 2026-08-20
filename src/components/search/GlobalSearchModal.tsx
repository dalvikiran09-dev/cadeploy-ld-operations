import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, CheckSquare, User, Tag } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface GlobalSearchModalProps {
  onSelectTask: (taskId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onSelectTask }) => {
  const { isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, tasks, users } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const query = searchQuery.toLowerCase().trim();

  const matchedTasks = query ? tasks.filter(t => 
    t.title.toLowerCase().includes(query) ||
    t.code.toLowerCase().includes(query) ||
    t.category.toLowerCase().includes(query) ||
    t.tags.some(tag => tag.toLowerCase().includes(query))
  ) : tasks;

  const matchedUsers = query ? users.filter(u => 
    u.name.toLowerCase().includes(query) ||
    u.username.toLowerCase().includes(query) ||
    u.designation.toLowerCase().includes(query)
  ) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 pt-20">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search operational tasks, code, L&D categories, or users... (Esc to close)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          {/* Tasks Section */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Tasks ({matchedTasks.length})
            </div>
            {matchedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tasks found matching "{searchQuery}"</p>
            ) : (
              <div className="space-y-1">
                {matchedTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSelectTask(t.id);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="font-mono text-blue-600">{t.code}</span>
                        <span>{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.category} • Due {t.dueDate}</div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users Section */}
          {matchedUsers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Users ({matchedUsers.length})
              </div>
              <div className="space-y-1">
                {matchedUsers.map(u => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3 text-xs"
                  >
                    <UserAvatar name={u.name} size="md" className="w-7 h-7" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.designation} • {u.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { 
  Search, Bell, Sun, Moon, Plus, LogOut, CheckCheck
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface HeaderProps {
  onOpenNewTaskModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTaskModal }) => {
  const { 
    currentUser, logout, toggleTheme, settings, 
    notifications, markAllNotificationsRead, setIsSearchOpen 
  } = useApp();

  const canCreateTask = hasPermission(currentUser, 'TASK_CREATE');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Scope */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{settings.companyName}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-600 dark:text-blue-400">{settings.departmentName} Operations</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Internal Operations, Training Calendar, QMS Audits & Reports
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 rounded-xl text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search tasks, categories, users...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">⌘K</kbd>
        </button>

        {/* Quick New Task Button */}
        {canCreateTask && (
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Toggle Theme"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 text-xs ${n.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-950/20'}`}>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <UserAvatar 
              name={currentUser.name} 
              size="md" 
              className="w-8 h-8 ring-2 ring-slate-200 dark:ring-slate-700" 
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{currentUser.role}</div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-xs text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.designation}</div>
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1">@{currentUser.username}</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

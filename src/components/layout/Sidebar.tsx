import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { 
  LayoutDashboard, CheckSquare, Calendar, BarChart3, 
  FileText, Users, Settings, ChevronLeft, ChevronRight, GraduationCap,
  Layers, TrendingUp, ClipboardCheck, UserCheck, Target
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, currentUser, settings } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Task Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'training-dashboard', label: 'Training Dashboard', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'tasks', label: 'Operations & Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'training', label: 'Training Management', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'batches', label: 'Training Batches', icon: <Layers className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'employees', label: 'Employees / HR Master', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'skill-matrix', label: 'Skill Matrix', icon: <Target className="w-5 h-5" /> },
    { id: 'calendar', label: 'Training Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'gantt', label: 'Gantt Timeline', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports & Audits', icon: <FileText className="w-5 h-5" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" />, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const visibleNavItems = navItems.filter(item => {
    // Management role can view: Task Dashboard, Training Dashboard, Employees / HR Master, Skill Matrix, Reports & Audits
    if (currentUser.role === 'Management') {
      return item.id === 'dashboard' || item.id === 'training-dashboard' || item.id === 'employees' || item.id === 'skill-matrix' || item.id === 'reports';
    }
    // Administrator only items
    if (item.adminOnly && currentUser.role !== 'Administrator') {
      return false;
    }
    return true;
  });

  return (
    <aside 
      className={`relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
                {settings.companyName}
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                L&D Operations
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className={`${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.icon}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Info Footnote */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${collapsed ? 'justify-center' : ''}`}>
          <UserAvatar 
            name={currentUser.name} 
            size="md" 
            className="w-8 h-8 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0" 
          />
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">{currentUser.designation}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

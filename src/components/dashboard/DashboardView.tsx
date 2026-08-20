import React from 'react';
import { useApp, PresetFilter } from '../../context/AppContext';
import { hasPermission } from '../../utils/permissionUtils';
import { AnimatedCount } from '../common/AnimatedCount';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatDuration } from '../../utils/formatters';
import { 
  CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Calendar, 
  BarChart2, Layers, Plus, Activity, Inbox
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';

interface DashboardViewProps {
  onOpenTaskModal: () => void;
  onSelectTask: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenTaskModal, onSelectTask }) => {
  const { tasks, activities, currentUser, setActiveTab, setTaskFilterPreset } = useApp();
  const canCreateTask = hasPermission(currentUser, 'TASK_CREATE');
  const isManagement = currentUser.role === 'Management';

  const handleCardClick = (preset: PresetFilter) => {
    if (isManagement) return;
    setTaskFilterPreset(preset);
    setActiveTab('tasks');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculated KPI Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Closed').length;
  const openTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled').length;
  
  const overdueTasks = tasks.filter(t => 
    t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled' &&
    t.dueDate < todayStr
  ).length;

  const dueToday = tasks.filter(t => 
    t.status !== 'Completed' && t.status !== 'Closed' && t.dueDate === todayStr
  ).length;

  const criticalTasks = tasks.filter(t => 
    t.priority === 'Critical' && t.status !== 'Completed' && t.status !== 'Closed'
  ).length;

  const highPriorityTasks = tasks.filter(t => 
    t.priority === 'High' && t.status !== 'Completed' && t.status !== 'Closed'
  ).length;

  const tasksAssignedToMe = tasks.filter(t => 
    t.assignedUserId === currentUser.id && t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled'
  ).length;

  const tasksAssignedByMe = tasks.filter(t => 
    (t.assignedByUserId === currentUser.id || t.assignedByName === currentUser.name) && 
    t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'Cancelled'
  ).length;

  const totalHoursSpent = tasks.reduce((sum, t) => sum + (t.hoursSpent || 0), 0);
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status Distribution Data for Pie Chart
  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const STATUS_COLORS: Record<string, string> = {
    'Pending': '#94A3B8',
    'Assigned': '#0EA5E9',
    'In Progress': '#2563EB',
    'Waiting': '#8B5CF6',
    'Under Review': '#F59E0B',
    'Completed': '#10B981',
    'Closed': '#14B8A6',
    'Cancelled': '#F43F5E'
  };

  const statusPieData = Object.keys(statusCounts).map(st => ({
    name: st,
    value: statusCounts[st],
    color: STATUS_COLORS[st] || '#64748B'
  }));

  // Category Breakdown Data for Bar Chart
  const categoryCounts: Record<string, number> = {};
  tasks.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categoryBarData = Object.keys(categoryCounts)
    .map(cat => ({ name: cat, count: categoryCounts[cat] }))
    .sort((a, b) => b.count - a.count);

  // Hours Spent by Category
  const categoryHoursData = Object.keys(categoryCounts)
    .map(cat => ({
      name: cat,
      'Hours Spent': tasks
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + (t.hoursSpent || 0), 0)
    }))
    .sort((a, b) => b['Hours Spent'] - a['Hours Spent']);

  // Monthly Productivity Trend Area Chart computed from actual completed tasks
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  const recentMonths = [
    monthsList[(currentMonthIdx + 9) % 12],
    monthsList[(currentMonthIdx + 10) % 12],
    monthsList[(currentMonthIdx + 11) % 12],
    monthsList[currentMonthIdx]
  ];

  const trendData = recentMonths.map(mName => {
    const monthTasks = tasks.filter(t => {
      if ((t.status === 'Completed' || t.status === 'Closed') && t.completionDate) {
        const d = new Date(t.completionDate);
        return monthsList[d.getMonth()] === mName;
      }
      return false;
    }).length;

    const monthHours = tasks.filter(t => {
      if (t.startDate) {
        const d = new Date(t.startDate);
        return monthsList[d.getMonth()] === mName;
      }
      return false;
    }).reduce((sum, t) => sum + (t.hoursSpent || 0), 0);

    return {
      month: mName,
      TasksCompleted: monthTasks,
      HoursLogged: monthHours
    };
  });

  console.log("Dashboard receives:", tasks.length);

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/20 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" /> Operations & Tasks Reporting
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Task Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time executive tracking of operational tasks, productivity metrics, QMS compliance, and work distribution.
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Operational Task</span>
          </button>
        )}
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div 
          onClick={() => handleCardClick('all')}
          title="Click to open Operations & Tasks and view all tasks"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Total Tasks</span>
            <ListTodo className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            <AnimatedCount value={totalTasks} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">L&D total</div>
        </div>

        <div 
          onClick={() => handleCardClick('open')}
          title="Click to open Operations & Tasks and filter active open tasks"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Open Tasks</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-2">
            <AnimatedCount value={openTasks} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">In progress</div>
        </div>

        <div 
          onClick={() => handleCardClick('completed')}
          title="Click to open Operations & Tasks and view completed tasks"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <AnimatedCount value={completedTasks} />
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">{overallCompletion}% Rate</div>
        </div>

        <div 
          onClick={() => handleCardClick('overdue')}
          title="Click to open Operations & Tasks and view overdue tasks sorted by oldest overdue first"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            <AnimatedCount value={overdueTasks} />
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-1">Attention</div>
        </div>

        <div 
          onClick={() => handleCardClick('dueToday')}
          title="Click to open Operations & Tasks and view tasks due today"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Due Today</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            <AnimatedCount value={dueToday} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Target today</div>
        </div>

        <div 
          onClick={() => handleCardClick('criticalHigh')}
          title="Click to open Operations & Tasks and view Critical & High priority tasks"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Critical/High</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            <AnimatedCount value={criticalTasks + highPriorityTasks} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{criticalTasks} Crit | {highPriorityTasks} High</div>
        </div>

        <div 
          onClick={() => handleCardClick('assignedToMe')}
          title="Click to view tasks assigned to me"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Assigned To Me</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            <AnimatedCount value={tasksAssignedToMe} />
          </div>
          <div className="text-[10px] text-indigo-500 font-semibold mt-1">My active tasks</div>
        </div>

        <div 
          onClick={() => handleCardClick('assignedByMe')}
          title="Click to view tasks assigned by me"
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <span>Assigned By Me</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            <AnimatedCount value={tasksAssignedByMe} />
          </div>
          <div className="text-[10px] text-purple-500 font-semibold mt-1">My delegated tasks</div>
        </div>
      </div>

      {/* KPI Cards Row 2 (Hours & Completion Bar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Hours Spent</div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {formatDuration(totalHoursSpent)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total across operational tasks</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('reports')}
          title="Click to view L&D Management Review and QMS Reports"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md hover:border-indigo-400"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overall L&D Operational Progress</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{overallCompletion}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {completedTasks} of {totalTasks} operational tasks completed
          </div>
        </div>
      </div>

      {/* Analytics & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Task Status Distribution
            </h3>
            <span className="text-xs text-slate-400">Live Breakdown</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No tasks available in database</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tasks by Category
            </h3>
            <span className="text-xs text-slate-400">L&D Categories</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {categoryBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No operational task categories recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Hours Spent by Category Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Hours Spent by Category
            </h3>
            <span className="text-xs text-slate-400">Total Hours</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryHoursData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [formatDuration(Number(value)), 'Hours Spent']} />
                <Bar dataKey="Hours Spent" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Productivity Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Monthly Productivity Trend
            </h3>
            <span className="text-xs text-slate-400">Recent Months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="TasksCompleted" stroke="#10B981" fill="#D1FAE5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Dashboard Widgets: Operational Tasks List & Audit Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks Widget (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active L&D Operational Tasks</h3>
            <span className="text-xs text-slate-400">All Tasks ({tasks.length})</span>
          </div>

          {tasks.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {tasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => onSelectTask(t.id)}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">{t.code}</span>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                  </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due: {t.dueDate}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatDuration(t.hoursSpent)}</div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No operational tasks found in database.</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">Get started by creating your first task.</p>
              <button
                onClick={onOpenTaskModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                + Create Operational Task
              </button>
            </div>
          )}
        </div>

        {/* Audit Activity & Log Trail (1 Col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Audit Log & Activity
            </h3>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <UserAvatar name={act.userName} size="md" className="w-7 h-7 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 dark:text-slate-200">
                      <span className="font-semibold">{act.userName}</span> {act.action} <span className="font-medium text-blue-600 dark:text-blue-400">{act.targetName}</span>
                    </div>
                    {act.details && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{act.details}</div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">{act.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No activity log records yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

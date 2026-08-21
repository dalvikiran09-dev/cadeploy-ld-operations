import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TrainingProvider } from './context/TrainingContext';
import { BatchProvider } from './context/BatchContext';
import { AssessmentProvider } from './context/AssessmentContext';
import { CompetencyProvider } from './context/CompetencyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { GanttView } from './components/gantt/GanttView';
import { ReportsView } from './components/reports/ReportsView';
import { TrainingDashboardView } from './components/training/analytics/TrainingDashboardView';
import { TrainingView } from './components/training/TrainingView';
import { BatchesView } from './components/batches/BatchesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { EmployeesView } from './components/employees/EmployeesView';
import { SkillMatrixView } from './components/skillMatrix/SkillMatrixView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { TaskModal } from './components/tasks/TaskModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { ActiveTab } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeTab, setActiveTab, currentUser } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const isAllowedForManagement = (tab: ActiveTab): boolean => {
    return tab === 'dashboard' || tab === 'training-dashboard' || tab === 'reports' || tab === 'employees' || tab === 'skill-matrix';
  };

  // Direct URL / Route Protection for Management and Admin routes
  useEffect(() => {
    if (!isAuthenticated) return;

    if (currentUser.role === 'Management' && !isAllowedForManagement(activeTab)) {
      setActiveTab('dashboard');
    } else if (activeTab === 'users' && currentUser.role !== 'Administrator') {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, currentUser.role, activeTab, setActiveTab]);

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  const isManagement = currentUser.role === 'Management';
  const effectiveTab = (isManagement && !isAllowedForManagement(activeTab)) ||
    (activeTab === 'users' && currentUser.role !== 'Administrator')
      ? 'dashboard'
      : activeTab;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)} />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {effectiveTab === 'dashboard' && (
            <DashboardView 
              onOpenTaskModal={() => setIsNewTaskModalOpen(true)} 
              onSelectTask={id => setSelectedTaskId(id)} 
            />
          )}

          {effectiveTab === 'tasks' && <TasksView />}

          {effectiveTab === 'training-dashboard' && <TrainingDashboardView />}

          {effectiveTab === 'training' && <TrainingView />}

          {effectiveTab === 'batches' && <BatchesView />}

          {effectiveTab === 'attendance' && <AttendanceView />}

          {effectiveTab === 'employees' && <EmployeesView />}

          {effectiveTab === 'skill-matrix' && <SkillMatrixView />}

          {effectiveTab === 'calendar' && <CalendarView />}

          {effectiveTab === 'gantt' && <GanttView />}

          {effectiveTab === 'reports' && <ReportsView />}

          {effectiveTab === 'users' && <UserManagementView />}

          {effectiveTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal onSelectTask={id => setSelectedTaskId(id)} />

      {/* Quick Task Creation Modal */}
      <TaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => setIsNewTaskModalOpen(false)} 
      />

      {/* Task Detail Modal */}
      <TaskDetailModal 
        taskId={selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
        onEditTask={() => setSelectedTaskId(null)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <TrainingProvider>
        <BatchProvider>
          <AssessmentProvider>
            <CompetencyProvider>
              <AppContent />
            </CompetencyProvider>
          </AssessmentProvider>
        </BatchProvider>
      </TrainingProvider>
    </AppProvider>
  );
}

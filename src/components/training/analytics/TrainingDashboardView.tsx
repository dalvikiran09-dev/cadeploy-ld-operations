import React, { useState, useMemo } from 'react';
import { useTraining } from '../../../context/TrainingContext';
import { useBatch } from '../../../context/BatchContext';
import { useApp } from '../../../context/AppContext';
import { 
  TrainingAnalyticsFilters, 
  OngoingProgramItem 
} from '../../../types/trainingAnalytics';
import { 
  computeTrainingAnalytics, 
  exportTrainingAnalyticsToExcel, 
  exportTrainingAnalyticsToPDF 
} from '../../../utils/trainingAnalyticsUtils';
import { TrainingAnalyticsFiltersBar } from './TrainingAnalyticsFiltersBar';
import { TrainingAnalyticsKPICards } from './TrainingAnalyticsKPICards';
import { OngoingProgramsSection } from './OngoingProgramsSection';
import { ProgramStatusChart } from './ProgramStatusChart';
import { TrainingDeliveryTrendChart } from './TrainingDeliveryTrendChart';
import { AttendanceAnalyticsSection } from './AttendanceAnalyticsSection';
import { DepartmentCoverageSection } from './DepartmentCoverageSection';
import { TrainingHoursSection } from './TrainingHoursSection';
import { ProgramCompletionSection } from './ProgramCompletionSection';
import { TrainingImpactSection } from './TrainingImpactSection';
import { TrainingCalendarSummary } from './TrainingCalendarSummary';
import { ProgramPerformanceModal } from './ProgramPerformanceModal';

interface Props {
  onNavigateSubTab?: (subTab: string) => void;
}

export const TrainingDashboardView: React.FC<Props> = ({ onNavigateSubTab }) => {
  const { 
    programs, 
    modules, 
    courses, 
    refreshTrainingData, 
    loading: trainingLoading 
  } = useTraining();

  const { 
    batches, 
    schedules, 
    nominees, 
    attendance, 
    refreshBatchData, 
    loading: batchLoading 
  } = useBatch();

  const { users } = useApp();

  // Filters State
  const [filters, setFilters] = useState<TrainingAnalyticsFilters>({
    datePeriod: 'all_time',
    programCode: 'all',
    category: 'all',
    status: 'all',
    batchCode: 'all',
    facilitatorCode: 'all',
    department: 'all',
    employeeCode: 'all'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProgramItem, setSelectedProgramItem] = useState<OngoingProgramItem | null>(null);

  // Compute analytics dynamically from real Supabase / context data
  const analytics = useMemo(() => {
    return computeTrainingAnalytics(
      programs,
      modules,
      courses,
      batches,
      schedules,
      nominees,
      attendance,
      users,
      filters
    );
  }, [programs, modules, courses, batches, schedules, nominees, attendance, users, filters]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshTrainingData?.(),
        refreshBatchData?.()
      ]);
    } catch (err) {
      console.error('Error refreshing training dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      datePeriod: 'all_time',
      programCode: 'all',
      category: 'all',
      status: 'all',
      batchCode: 'all',
      facilitatorCode: 'all',
      department: 'all',
      employeeCode: 'all'
    });
  };

  // Excel Export
  const handleExportExcel = async () => {
    try {
      await exportTrainingAnalyticsToExcel(analytics, filters, 'CADEPLOY');
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    try {
      await exportTrainingAnalyticsToPDF(analytics, filters, 'CADEPLOY');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  // Handle program click from charts / list
  const handleSelectProgramByCode = (code: string) => {
    const ongoing = analytics.ongoingProgramsList.find(p => p.programCode.toUpperCase() === code.toUpperCase());
    if (ongoing) {
      setSelectedProgramItem(ongoing);
    } else {
      const prog = programs.find(p => p.programCode.toUpperCase() === code.toUpperCase());
      if (prog) {
        setSelectedProgramItem({
          programCode: prog.programCode,
          programName: prog.programName,
          batchCode: '—',
          startDate: '—',
          endDate: '—',
          facilitator: '—',
          location: 'Hyderabad',
          nomineesCount: 0,
          attendedCount: 0,
          absentCount: 0,
          attendanceRate: 0,
          programStatus: prog.status,
          batchStatus: 'Planned',
          totalActivities: 0,
          completedActivities: 0,
          completionRate: 0,
          totalHours: 0,
          modulesCount: 0
        });
      }
    }
  };

  return (
    <div id="training-management-dashboard-root" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Filter Bar */}
      <TrainingAnalyticsFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        programs={programs}
        batches={batches}
        users={users}
        isRefreshing={isRefreshing || trainingLoading || batchLoading}
        onRefresh={handleRefresh}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onReset={handleResetFilters}
      />

      {/* Top 10 KPI Cards */}
      <TrainingAnalyticsKPICards
        kpis={analytics.kpis}
        onCardClick={(key) => {
          if (key === 'ongoingPrograms') {
            setFilters(prev => ({ ...prev, status: 'In Progress' }));
          } else if (key === 'completedPrograms') {
            setFilters(prev => ({ ...prev, status: 'Completed' }));
          } else if (key === 'upcomingPrograms') {
            setFilters(prev => ({ ...prev, status: 'Planned' }));
          }
        }}
      />

      {/* Main Section 1: Ongoing Training Programs Table */}
      <OngoingProgramsSection
        programs={analytics.ongoingProgramsList}
        onSelectProgram={setSelectedProgramItem}
      />

      {/* Row 2: Status Distribution (5 cols) & Delivery Trend (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ProgramStatusChart data={analytics.statusDistribution} />
        </div>
        <div className="lg:col-span-7">
          <TrainingDeliveryTrendChart data={analytics.deliveryTrend} />
        </div>
      </div>

      {/* Row 3: Attendance Analytics & Program Breakdown */}
      <AttendanceAnalyticsSection
        attendanceSummary={analytics.attendanceSummary}
        programAttendance={analytics.programAttendanceList}
        onSelectProgram={handleSelectProgramByCode}
      />

      {/* Row 4: Department Coverage & Program Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DepartmentCoverageSection data={analytics.departmentCoverage} />
        </div>
        <div className="lg:col-span-6">
          <ProgramCompletionSection data={analytics.completionAnalysis} />
        </div>
      </div>

      {/* Row 5: Training Hours & Instructional Volume */}
      <TrainingHoursSection data={analytics.trainingHoursSummary} />

      {/* Row 6: Overall Training Impact */}
      <TrainingImpactSection impact={analytics.impact} />

      {/* Row 7: Training Schedule & Calendar Summary */}
      <TrainingCalendarSummary
        events={analytics.calendarEvents}
        onSelectEvent={(e) => handleSelectProgramByCode(e.programCode)}
      />

      {/* Program Performance Modal */}
      {selectedProgramItem && (
        <ProgramPerformanceModal
          programItem={selectedProgramItem}
          onClose={() => setSelectedProgramItem(null)}
          programs={programs}
          modules={modules}
          courses={courses}
          batches={batches}
          schedules={schedules}
          nominees={nominees}
          attendance={attendance}
          users={users}
        />
      )}
    </div>
  );
};

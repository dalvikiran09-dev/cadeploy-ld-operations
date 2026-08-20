import { TrainingProgram, TrainingModule, TrainingCourse } from './training';
import { TrainingBatch, BatchScheduleActivity, BatchNominee, TrainingAttendanceRecord, BatchStatus } from './batch';
import { User } from './index';

export type DatePeriodOption = 'this_month' | 'this_quarter' | 'this_year' | 'all_time' | 'custom';

export interface TrainingAnalyticsFilters {
  datePeriod: DatePeriodOption;
  customStartDate?: string;
  customEndDate?: string;
  programCode: string; // 'all' or specific program code
  category: string; // 'all' or delivery mode / category
  status: string; // 'all' or BatchStatus / TrainingStatus
  batchCode: string; // 'all' or specific batch code
  facilitatorCode: string; // 'all' or facilitator code
  department: string; // 'all' or department name
  employeeCode: string; // 'all' or employee code
}

export interface TrainingAnalyticsKPIs {
  totalPrograms: number;
  ongoingPrograms: number;
  completedPrograms: number;
  upcomingPrograms: number;
  totalBatches: number;
  totalAttendees: number; // Total nominations/participations
  uniqueEmployeesTrained: number; // Deduplicated employee count
  totalTrainingHours: number; // Sum of module hours × batches/activities
  attendanceRate: number; // Present / Total marked records * 100
  programCompletionRate: number; // Completed programs / Total programs * 100
}

export interface OngoingProgramItem {
  programCode: string;
  programName: string;
  batchCode: string;
  batchId?: string;
  startDate: string;
  endDate: string;
  facilitator: string;
  facilitatorName?: string;
  location: string;
  nomineesCount: number;
  attendedCount: number;
  absentCount: number;
  attendanceRate: number;
  programStatus: string;
  batchStatus: string;
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  totalHours: number;
  modulesCount: number;
}

export interface ProgramStatusDistribution {
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export interface DeliveryTrendItem {
  periodKey: string;
  periodLabel: string;
  programsCount: number;
  batchesCount: number;
  attendeesCount: number;
  trainingHours: number;
}

export interface AttendanceAnalyticsSummary {
  totalNominees: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  partialCount: number;
  excusedCount: number;
  notMarkedCount: number;
  attendanceRate: number;
}

export interface ProgramAttendanceItem {
  programCode: string;
  programName: string;
  nomineesCount: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  batchesCount: number;
  totalHours: number;
}

export interface DepartmentCoverageItem {
  department: string;
  employeesNominated: number;
  employeesAttended: number;
  attendanceRate: number;
  uniqueEmployeesTrained: number;
  totalTrainingHours: number;
}

export interface TrainingHoursSummary {
  totalTrainingHours: number;
  averageHoursPerProgram: number;
  averageHoursPerAttendee: number;
  hoursByProgram: Array<{
    programCode: string;
    programName: string;
    hours: number;
    modulesCount: number;
  }>;
  hoursByPeriod: Array<{
    period: string;
    hours: number;
  }>;
}

export interface ProgramCompletionAnalysis {
  programsPlanned: number;
  programsStarted: number;
  programsCompleted: number;
  programsCancelled: number;
  completionRate: number;
  denominatorDescription: string;
}

export interface OverallTrainingImpact {
  trainingCoverageRate: number; // Unique Employees Trained / Total Active Employees * 100
  totalActiveEmployees: number;
  uniqueEmployeesTrained: number;
  attendanceRate: number;
  programCompletionRate: number;
  totalTrainingHoursDelivered: number;
  averageHoursPerEmployee: number;
  hasAssessmentData: boolean;
  hasFeedbackData: boolean;
  assessmentAverageScore?: number;
  feedbackAverageRating?: number;
  competencyImprovementRate?: number;
}

export interface TrainingCalendarEvent {
  id: string;
  programCode: string;
  programName: string;
  batchCode: string;
  activityTitle: string;
  moduleCode: string;
  date: string;
  time?: string;
  facilitator: string;
  facilitatorName?: string;
  location: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  nomineesCount: number;
}

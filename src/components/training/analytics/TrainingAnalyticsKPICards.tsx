import React from 'react';
import { 
  GraduationCap, 
  PlayCircle, 
  CheckCircle2, 
  CalendarClock, 
  Layers, 
  Users, 
  UserCheck, 
  Clock, 
  Award, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { TrainingAnalyticsKPIs } from '../../../types/trainingAnalytics';

interface Props {
  kpis: TrainingAnalyticsKPIs;
  onCardClick?: (metricKey: string) => void;
}

export const TrainingAnalyticsKPICards: React.FC<Props> = ({ kpis, onCardClick }) => {
  const cards = [
    {
      id: 'kpi-total-programs',
      key: 'totalPrograms',
      label: 'Total Training Programs',
      value: kpis.totalPrograms,
      suffix: '',
      subtext: 'Configured curriculum',
      icon: GraduationCap,
      color: 'blue',
      borderClass: 'border-blue-200/80',
      bgClass: 'bg-blue-50/50',
      textClass: 'text-blue-700',
      iconBg: 'bg-blue-600 text-white'
    },
    {
      id: 'kpi-ongoing-programs',
      key: 'ongoingPrograms',
      label: 'Ongoing Programs',
      value: kpis.ongoingPrograms,
      suffix: '',
      subtext: 'In-progress cohorts',
      icon: PlayCircle,
      color: 'indigo',
      borderClass: 'border-indigo-200/80',
      bgClass: 'bg-indigo-50/50',
      textClass: 'text-indigo-700',
      iconBg: 'bg-indigo-600 text-white'
    },
    {
      id: 'kpi-completed-programs',
      key: 'completedPrograms',
      label: 'Completed Programs',
      value: kpis.completedPrograms,
      suffix: '',
      subtext: 'Successfully concluded',
      icon: CheckCircle2,
      color: 'emerald',
      borderClass: 'border-emerald-200/80',
      bgClass: 'bg-emerald-50/50',
      textClass: 'text-emerald-700',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'kpi-upcoming-programs',
      key: 'upcomingPrograms',
      label: 'Upcoming / Planned',
      value: kpis.upcomingPrograms,
      suffix: '',
      subtext: 'Scheduled for delivery',
      icon: CalendarClock,
      color: 'amber',
      borderClass: 'border-amber-200/80',
      bgClass: 'bg-amber-50/50',
      textClass: 'text-amber-700',
      iconBg: 'bg-amber-500 text-white'
    },
    {
      id: 'kpi-total-batches',
      key: 'totalBatches',
      label: 'Total Training Batches',
      value: kpis.totalBatches,
      suffix: '',
      subtext: 'Cohorts registered',
      icon: Layers,
      color: 'sky',
      borderClass: 'border-sky-200/80',
      bgClass: 'bg-sky-50/50',
      textClass: 'text-sky-700',
      iconBg: 'bg-sky-600 text-white'
    },
    {
      id: 'kpi-total-attendees',
      key: 'totalAttendees',
      label: 'Total Attendees',
      value: kpis.totalAttendees,
      suffix: '',
      subtext: 'Total nominations',
      icon: Users,
      color: 'purple',
      borderClass: 'border-purple-200/80',
      bgClass: 'bg-purple-50/50',
      textClass: 'text-purple-700',
      iconBg: 'bg-purple-600 text-white'
    },
    {
      id: 'kpi-unique-employees',
      key: 'uniqueEmployees',
      label: 'Unique Employees Trained',
      value: kpis.uniqueEmployeesTrained,
      suffix: '',
      subtext: 'Deduplicated headcount',
      icon: UserCheck,
      color: 'teal',
      borderClass: 'border-teal-200/80',
      bgClass: 'bg-teal-50/50',
      textClass: 'text-teal-700',
      iconBg: 'bg-teal-600 text-white'
    },
    {
      id: 'kpi-total-hours',
      key: 'totalHours',
      label: 'Total Training Hours',
      value: kpis.totalTrainingHours,
      suffix: ' hrs',
      subtext: 'Instruction delivered',
      icon: Clock,
      color: 'orange',
      borderClass: 'border-orange-200/80',
      bgClass: 'bg-orange-50/50',
      textClass: 'text-orange-700',
      iconBg: 'bg-orange-600 text-white'
    },
    {
      id: 'kpi-attendance-rate',
      key: 'attendanceRate',
      label: 'Overall Attendance Rate',
      value: kpis.attendanceRate,
      suffix: '%',
      subtext: 'Present / Marked records',
      icon: Percent,
      color: 'emerald',
      borderClass: 'border-emerald-200/80',
      bgClass: 'bg-emerald-50/50',
      textClass: 'text-emerald-700',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'kpi-completion-rate',
      key: 'completionRate',
      label: 'Program Completion Rate',
      value: kpis.programCompletionRate,
      suffix: '%',
      subtext: 'Delivered / Planned',
      icon: Award,
      color: 'blue',
      borderClass: 'border-blue-200/80',
      bgClass: 'bg-blue-50/50',
      textClass: 'text-blue-700',
      iconBg: 'bg-blue-600 text-white'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c) => {
        const IconComponent = c.icon;
        return (
          <div
            key={c.id}
            id={c.id}
            onClick={() => onCardClick?.(c.key)}
            className={`relative overflow-hidden bg-white dark:bg-slate-900 p-3.5 rounded-xl border ${c.borderClass} dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
          >
            {/* Top Row: Icon & Label */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-2 leading-tight">
                {c.label}
              </span>
              <div className={`p-2 rounded-lg ${c.iconBg} shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Value & Suffix */}
            <div className="mt-1">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1">
                <span>{c.value}</span>
                {c.suffix && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.suffix}</span>}
              </div>
              <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

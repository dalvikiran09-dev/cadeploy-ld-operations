import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Filter, 
  Building2, 
  UserCheck, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Layers, 
  Table as TableIcon,
  ChevronDown,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';
import { MAIN_DEPARTMENTS } from '../../constants/departments';
import { 
  calculateTrainingReportMetrics, 
  TrainingReportFilterOptions,
  ReportFilterOptions,
  ProgramSummaryRow,
  BatchSummaryRow,
  AttendanceSummaryRow
} from '../../utils/reportUtils';
import { useTraining } from '../../context/TrainingContext';
import { useBatch } from '../../context/BatchContext';
import { useApp } from '../../context/AppContext';

interface Props {
  periodOptions: ReportFilterOptions;
}

export const TrainingReportSection: React.FC<Props> = ({ periodOptions }) => {
  const { programs, modules, courses } = useTraining();
  const { batches, schedules, nominees, attendance } = useBatch();
  const { users } = useApp();

  // Secondary training filters
  const [trainingFilters, setTrainingFilters] = useState<TrainingReportFilterOptions>({
    programCode: 'all',
    batchCode: 'all',
    department: 'all',
    facilitatorCode: 'all',
    status: 'all',
    attendanceStatus: 'all'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'programs' | 'batches' | 'attendance'>('programs');

  // Calculate training report data
  const trainingData = useMemo(() => {
    return calculateTrainingReportMetrics(
      programs,
      modules,
      courses,
      batches,
      schedules,
      nominees,
      attendance,
      users,
      periodOptions,
      trainingFilters
    );
  }, [programs, modules, courses, batches, schedules, nominees, attendance, users, periodOptions, trainingFilters]);

  const { kpis, programSummaryList, batchSummaryList, attendanceSummaryList, chartsData, periodRange } = trainingData;

  // Filter detail tables based on search
  const filteredProgramRows = useMemo(() => {
    if (!searchQuery.trim()) return programSummaryList;
    const q = searchQuery.toLowerCase();
    return programSummaryList.filter(p => 
      p.programCode.toLowerCase().includes(q) || 
      p.programName.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  }, [programSummaryList, searchQuery]);

  const filteredBatchRows = useMemo(() => {
    if (!searchQuery.trim()) return batchSummaryList;
    const q = searchQuery.toLowerCase();
    return batchSummaryList.filter(b => 
      b.batchCode.toLowerCase().includes(q) || 
      b.programName.toLowerCase().includes(q) ||
      b.facilitator.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  }, [batchSummaryList, searchQuery]);

  const filteredAttendanceRows = useMemo(() => {
    if (!searchQuery.trim()) return attendanceSummaryList;
    const q = searchQuery.toLowerCase();
    return attendanceSummaryList.filter(a => 
      a.employeeCode.toLowerCase().includes(q) || 
      a.employeeName.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.programName.toLowerCase().includes(q) ||
      a.batchCode.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    );
  }, [attendanceSummaryList, searchQuery]);

  // Distinct departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>(MAIN_DEPARTMENTS);
    users.forEach(u => { if (u.department) set.add(u.department); });
    return Array.from(set);
  }, [users]);

  // Distinct facilitators
  const facilitators = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => { if (b.facilitatorCode) set.add(b.facilitatorCode); });
    return Array.from(set).sort();
  }, [batches]);

  const hasActivity = kpis.totalPrograms > 0 || kpis.totalBatches > 0 || kpis.totalAttendees > 0;

  return (
    <div id="training-report-section" className="space-y-6 pt-8 border-t-2 border-slate-200">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  Section 2
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  TRAINING & L&D PERFORMANCE REPORT
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive training analytics, batch delivery, attendance compliance, and curriculum metrics for <span className="font-semibold text-slate-700">{periodRange.label}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Scope Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Period Scope: {periodRange.label}</span>
        </div>
      </div>

      {/* Secondary Training Filters Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Secondary Training Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Program Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Program</label>
            <select
              value={trainingFilters.programCode}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, programCode: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Programs ({programs.length})</option>
              {programs.map(p => (
                <option key={p.id} value={p.programCode}>{p.programCode} - {p.programName}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Batch</label>
            <select
              value={trainingFilters.batchCode}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, batchCode: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Batches ({batches.length})</option>
              {batches.map(b => (
                <option key={b.id} value={b.batchCode}>{b.batchCode}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={trainingFilters.department}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Facilitator Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Facilitator</label>
            <select
              value={trainingFilters.facilitatorCode}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, facilitatorCode: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Facilitators</option>
              {facilitators.map(f => {
                const u = users.find(usr => usr.username === f || usr.id === f);
                return (
                  <option key={f} value={f}>{u?.name || f}</option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Batch Status</label>
            <select
              value={trainingFilters.status}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Attendance</label>
            <select
              value={trainingFilters.attendanceStatus}
              onChange={(e) => setTrainingFilters(prev => ({ ...prev, attendanceStatus: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Attendance</option>
              <option value="Present">Present / Attended</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Partial">Partial / Excused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State Notification */}
      {!hasActivity && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-amber-900">
            No training activity found for the selected reporting period.
          </h4>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            There are no batches, program enrollments, or attendance sessions recorded within {periodRange.label}. Select another period range or adjust secondary filters.
          </p>
        </div>
      )}

      {/* 10 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Total Programs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Programs</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{kpis.totalPrograms}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Active curriculum</p>
          </div>
        </div>

        {/* KPI 2: Ongoing Programs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Ongoing Programs</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-600">{kpis.ongoingPrograms}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Currently in delivery</p>
          </div>
        </div>

        {/* KPI 3: Completed Programs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Completed Programs</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600">{kpis.completedPrograms}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Graduated cohorts</p>
          </div>
        </div>

        {/* KPI 4: Upcoming Programs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Programs</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600">{kpis.upcomingPrograms}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Planned cohorts</p>
          </div>
        </div>

        {/* KPI 5: Total Batches */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Batches</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-600">{kpis.totalBatches}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Scheduled batches</p>
          </div>
        </div>

        {/* KPI 6: Total Attendees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Attendees</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-cyan-600">{kpis.totalAttendees}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Nominated seats</p>
          </div>
        </div>

        {/* KPI 7: Unique Employees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Unique Trained</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-600">{kpis.uniqueEmployeesTrained}</span>
            <p className="text-3xs text-slate-400 mt-0.5">Individual learners</p>
          </div>
        </div>

        {/* KPI 8: Total Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Training Hours</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-sky-600">{kpis.totalTrainingHours} <span className="text-xs font-normal">hrs</span></span>
            <p className="text-3xs text-slate-400 mt-0.5">Delivered hours</p>
          </div>
        </div>

        {/* KPI 9: Attendance Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600">{kpis.attendanceRate}%</span>
            <p className="text-3xs text-slate-400 mt-0.5">Session attendance</p>
          </div>
        </div>

        {/* KPI 10: Program Completion Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-violet-600">{kpis.programCompletionRate}%</span>
            <p className="text-3xs text-slate-400 mt-0.5">Graduation rate</p>
          </div>
        </div>
      </div>

      {/* 10 Training Charts Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">Training Performance Visualizations</h4>
          </div>
          <span className="text-xs text-slate-500">10 Analytical Charts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Chart 1: Programs by Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">1. Training Programs by Status</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Status Ratio</span>
            </div>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.programsByStatusData}
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartsData.programsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Batches by Program */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">2. Batches by Program</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">Cohorts</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.batchesByProgramData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Batches" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Programs & Batches Trend */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">3. Monthly Program / Batch Trend</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Trend</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData.monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="batchesCount" name="Batches" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="programsCount" name="Programs" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Attendance by Program */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">4. Attendance Rate by Program</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">Rate (%)</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.attendanceByProgramData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Attendance Rate']} />
                  <Bar dataKey="Attendance %" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Present vs Absent vs Late */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">5. Attendance Breakdown (Present/Absent/Late)</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">Sessions</span>
            </div>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.attendanceDistributionData}
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartsData.attendanceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Employees Trained by Month */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">6. Employees Trained by Month</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">Learners</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.employeesTrainedByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Employees Trained" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 7: Training Hours Delivered by Month */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">7. Training Hours by Month</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">Hours</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.trainingHoursByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="h" />
                  <Tooltip formatter={(val: any) => [`${val} hrs`, 'Delivered']} />
                  <Bar dataKey="Hours Delivered" fill="#0284C7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 8: Department-wise Participation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">8. Department-wise Participation</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">Coverage</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.departmentCoverageData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nominated" name="Nominated" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attended" name="Attended" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 9: Course-wise Attendance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">9. Course-wise Attendance</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">Curriculum</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.courseAttendanceData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="courseCode" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="attendedCount" name="Attended" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 10: Training Completion Trend */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800">10. Training Completion Trend (Planned vs Completed Batches)</h5>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Milestones</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Planned / Created" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Training Detail Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Tabs and Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDetailTab('programs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDetailTab === 'programs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Program Summary ({programSummaryList.length})
            </button>
            <button
              onClick={() => setActiveDetailTab('batches')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDetailTab === 'batches'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Batch Summary ({batchSummaryList.length})
            </button>
            <button
              onClick={() => setActiveDetailTab('attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDetailTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Attendance Records ({attendanceSummaryList.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tab 1: Program Summary Table */}
        {activeDetailTab === 'programs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-4">Program Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Total Batches</th>
                  <th className="py-3 px-4 text-center">Ongoing</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">Employees Trained</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProgramRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 text-xs">
                      No programs match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProgramRows.map((p) => (
                    <tr key={p.programCode} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{p.programCode}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{p.programName}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                          p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold">{p.totalBatches}</td>
                      <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{p.ongoingBatches}</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600 font-semibold">{p.completedBatches}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">{p.employeesTrained}</td>
                      <td className="py-2.5 px-4 text-center">{p.trainingHours} hrs</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{p.attendanceRate}%</td>
                      <td className="py-2.5 px-4 text-center font-bold text-indigo-600">{p.completionRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Batch Summary Table */}
        {activeDetailTab === 'batches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Facilitator</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Head Count</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBatchRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-400 text-xs">
                      No batches match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBatchRows.map((b) => (
                    <tr key={b.batchCode} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{b.batchCode}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{b.programName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.location}</td>
                      <td className="py-2.5 px-4 text-slate-800">{b.facilitator}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.startDate}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.endDate}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                          b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          b.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold">{b.headCount}</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-emerald-600">{b.present}</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-rose-600">{b.absent}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-600">{b.attendanceRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Attendance Summary Table */}
        {activeDetailTab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttendanceRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 text-xs">
                      No attendance records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredAttendanceRows.slice(0, 100).map((a, idx) => (
                    <tr key={`${a.employeeCode}-${a.batchCode}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{a.employeeCode}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{a.employeeName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{a.department}</td>
                      <td className="py-2.5 px-4 text-slate-800 truncate max-w-[150px]">{a.programName}</td>
                      <td className="py-2.5 px-4 font-mono text-indigo-600">{a.batchCode}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{a.moduleCode}</td>
                      <td className="py-2.5 px-4 text-slate-600">{a.sessionDate}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                          a.status === 'Attended' || a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          a.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          a.status === 'Absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-3xs">{a.reportedDatetime}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-3xs">{a.completedDatetime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

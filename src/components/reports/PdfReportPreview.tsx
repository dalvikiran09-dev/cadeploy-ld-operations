import React from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { Task, User } from '../../types';
import { 
  ReportMetrics, 
  ReportPeriodRange, 
  TimeAnalysisRow,
  calculateTrainingReportMetrics
} from '../../utils/reportUtils';
import { formatDuration } from '../../utils/formatters';

interface PdfReportPreviewProps {
  // Operational Task Data
  filteredTasks: Task[];
  users: User[];
  periodRange: ReportPeriodRange;
  metrics: ReportMetrics;
  statusPieData: Array<{ name: string; value: number; color: string }>;
  categoryBarData: Array<{ name: string; Tasks: number; Completed: number }>;
  priorityBarData: Array<{ name: string; Count: number }>;
  assigneeBarData: Array<{ name: string; Total: number; Completed: number }>;
  hoursSpentByCategoryData: Array<{ name: string; 'Hours Spent': number }>;
  timeAnalysis: TimeAnalysisRow[];
  generatedTimestamp: string;
  // Training Data
  trainingData?: ReturnType<typeof calculateTrainingReportMetrics>;
}

export const PdfReportPreview: React.FC<PdfReportPreviewProps> = ({
  filteredTasks,
  users,
  periodRange,
  metrics,
  statusPieData,
  categoryBarData,
  priorityBarData,
  assigneeBarData,
  hoursSpentByCategoryData,
  timeAnalysis,
  generatedTimestamp,
  trainingData
}) => {
  return (
    <div 
      id="pdf-report-preview-container"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1120px',
        backgroundColor: '#0F172A',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* ========================================================================= */}
      {/* PAGE 1: OPERATIONAL TASK REPORT                                          */}
      {/* ========================================================================= */}
      <div 
        id="pdf-report-page-1"
        style={{
          width: '1120px',
          minHeight: '792px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          padding: '24px',
          boxSizing: 'border-box',
          marginBottom: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: '#2563EB', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
                CADEPLOY
              </div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
                PART 1 — OPERATIONAL TASK REPORT
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8' }}>
              Executive Task Analytics & Operational Progress Oversight
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#94A3B8' }}>
            <div><strong style={{ color: '#F8FAFC' }}>Period Scope:</strong> {periodRange.label}</div>
            <div><strong style={{ color: '#F8FAFC' }}>Generated:</strong> {generatedTimestamp}</div>
            <div style={{ color: '#38BDF8', fontWeight: 'bold' }}>Page 1 of 2</div>
          </div>
        </div>

        {/* Task KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Tasks</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px' }}>{metrics.totalTasks}</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#60A5FA', textTransform: 'uppercase', fontWeight: 'bold' }}>Open Tasks</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60A5FA', marginTop: '2px' }}>{metrics.openTasks}</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#34D399', textTransform: 'uppercase', fontWeight: 'bold' }}>Completed</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34D399', marginTop: '2px' }}>{metrics.completedTasks}</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#F87171', textTransform: 'uppercase', fontWeight: 'bold' }}>Overdue</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F87171', marginTop: '2px' }}>{metrics.overdueTasks}</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#C084FC', textTransform: 'uppercase', fontWeight: 'bold' }}>Critical / High</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#C084FC', marginTop: '2px' }}>{metrics.criticalHighTasks}</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 'bold' }}>Hours Spent</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38BDF8', marginTop: '2px' }}>{metrics.totalHoursSpent}h</div>
          </div>
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#A78BFA', textTransform: 'uppercase', fontWeight: 'bold' }}>Completion %</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#A78BFA', marginTop: '2px' }}>{metrics.overallCompletion}%</div>
          </div>
        </div>

        {/* 6 Task Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
          {/* Chart 1: Status Distribution */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>1. Task Status Distribution</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} innerRadius={28} outerRadius={48} paddingAngle={2} dataKey="value">
                    {statusPieData.map((e, idx) => <Cell key={`cell-${idx}`} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Breakdown */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>2. Tasks by Category</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData.slice(0, 5)}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <Bar dataKey="Tasks" fill="#3B82F6" />
                  <Bar dataKey="Completed" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Priority */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>3. Tasks by Priority</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <Bar dataKey="Count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Assignee */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>4. Tasks by Assignee</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeBarData.slice(0, 5)}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <Bar dataKey="Total" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Hours by Category */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>5. Hours by Category</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursSpentByCategoryData.slice(0, 5)}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <Bar dataKey="Hours Spent" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Trend */}
          <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>6. Completion Trend</div>
            <div style={{ height: '145px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeAnalysis.slice(0, 8)}>
                  <XAxis dataKey="period" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: '#94A3B8' }} />
                  <Line type="monotone" dataKey="completionRate" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Task Record Preview Table */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '6px', border: '1px solid #334155', padding: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '6px' }}>
            Sample Task Operational Deliverables (Showing {Math.min(filteredTasks.length, 5)} of {filteredTasks.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '3px' }}>Code</th>
                <th style={{ padding: '3px' }}>Title</th>
                <th style={{ padding: '3px' }}>Category</th>
                <th style={{ padding: '3px' }}>Priority</th>
                <th style={{ padding: '3px' }}>Status</th>
                <th style={{ padding: '3px' }}>Assignee</th>
                <th style={{ padding: '3px' }}>Due Date</th>
                <th style={{ padding: '3px' }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.slice(0, 5).map(t => {
                const u = users.find(usr => usr.id === t.assignedUserId);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #283548', color: '#E2E8F0' }}>
                    <td style={{ padding: '3px', fontWeight: 'bold', color: '#60A5FA' }}>{t.code}</td>
                    <td style={{ padding: '3px' }}>{t.title}</td>
                    <td style={{ padding: '3px' }}>{t.category}</td>
                    <td style={{ padding: '3px' }}>{t.priority}</td>
                    <td style={{ padding: '3px' }}>{t.status}</td>
                    <td style={{ padding: '3px' }}>{u?.name || 'Unassigned'}</td>
                    <td style={{ padding: '3px' }}>{t.dueDate}</td>
                    <td style={{ padding: '3px' }}>{t.hoursSpent}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: TRAINING & L&D PERFORMANCE REPORT                                */}
      {/* ========================================================================= */}
      <div 
        id="pdf-report-page-2"
        style={{
          width: '1120px',
          minHeight: '792px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: '#4F46E5', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
                CADEPLOY L&D
              </div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
                PART 2 — TRAINING & L&D PERFORMANCE REPORT
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8' }}>
              Curriculum Execution, Cohort Batches, Workforce Attendance, & Skill Development Metrics
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#94A3B8' }}>
            <div><strong style={{ color: '#F8FAFC' }}>Period Scope:</strong> {periodRange.label}</div>
            <div><strong style={{ color: '#F8FAFC' }}>Generated:</strong> {generatedTimestamp}</div>
            <div style={{ color: '#38BDF8', fontWeight: 'bold' }}>Page 2 of 2</div>
          </div>
        </div>

        {/* 10 Training KPI Cards */}
        {trainingData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 'bold' }}>PROGRAMS</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '2px' }}>{trainingData.kpis.totalPrograms}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#818CF8', fontWeight: 'bold' }}>ONGOING</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#818CF8', marginTop: '2px' }}>{trainingData.kpis.ongoingPrograms}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#34D399', fontWeight: 'bold' }}>COMPLETED</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#34D399', marginTop: '2px' }}>{trainingData.kpis.completedPrograms}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#FBBF24', fontWeight: 'bold' }}>UPCOMING</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FBBF24', marginTop: '2px' }}>{trainingData.kpis.upcomingPrograms}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#C084FC', fontWeight: 'bold' }}>BATCHES</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#C084FC', marginTop: '2px' }}>{trainingData.kpis.totalBatches}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#22D3EE', fontWeight: 'bold' }}>ATTENDEES</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22D3EE', marginTop: '2px' }}>{trainingData.kpis.totalAttendees}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#2DD4BF', fontWeight: 'bold' }}>UNIQUE</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2DD4BF', marginTop: '2px' }}>{trainingData.kpis.uniqueEmployeesTrained}</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#38BDF8', fontWeight: 'bold' }}>HOURS</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38BDF8', marginTop: '2px' }}>{trainingData.kpis.totalTrainingHours}h</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#4ADE80', fontWeight: 'bold' }}>ATTEND %</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ADE80', marginTop: '2px' }}>{trainingData.kpis.attendanceRate}%</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '8px 4px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#A78BFA', fontWeight: 'bold' }}>COMPL %</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#A78BFA', marginTop: '2px' }}>{trainingData.kpis.programCompletionRate}%</div>
            </div>
          </div>
        )}

        {/* 6 High-Impact Training Charts for PDF */}
        {trainingData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {/* Chart 1: Programs by Status */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>1. Programs by Status</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trainingData.chartsData.programsByStatusData} innerRadius={24} outerRadius={44} paddingAngle={2} dataKey="value">
                      {trainingData.chartsData.programsByStatusData.map((e, idx) => <Cell key={`cell-${idx}`} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Batches by Program */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>2. Batches by Program</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingData.chartsData.batchesByProgramData.slice(0, 5)}>
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <Bar dataKey="Batches" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Monthly Trend */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>3. Monthly Delivery Trend</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData.chartsData.monthlyTrendData}>
                    <XAxis dataKey="periodLabel" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <Line type="monotone" dataKey="batchesCount" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Attendance by Program */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>4. Attendance % by Program</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingData.chartsData.attendanceByProgramData.slice(0, 5)}>
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <Bar dataKey="Attendance %" fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Department Participation */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>5. Department Coverage</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingData.chartsData.departmentCoverageData.slice(0, 5)}>
                    <XAxis dataKey="department" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <Bar dataKey="attended" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Training Hours by Month */}
            <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px', border: '1px solid #334155', height: '170px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '4px' }}>6. Training Hours by Month</div>
              <div style={{ height: '135px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingData.chartsData.trainingHoursByMonthData.slice(0, 5)}>
                    <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 7, fill: '#94A3B8' }} />
                    <Bar dataKey="Hours Delivered" fill="#0284C7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Program / Batch Summary Mini-Table */}
        {trainingData && (
          <div style={{ backgroundColor: '#1E293B', borderRadius: '6px', border: '1px solid #334155', padding: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#F1F5F9', marginBottom: '6px' }}>
              Curriculum Programs & Cohort Delivery Status
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#94A3B8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '3px' }}>Program Code</th>
                  <th style={{ padding: '3px' }}>Program Name</th>
                  <th style={{ padding: '3px' }}>Status</th>
                  <th style={{ padding: '3px' }}>Batches</th>
                  <th style={{ padding: '3px' }}>Trained</th>
                  <th style={{ padding: '3px' }}>Duration</th>
                  <th style={{ padding: '3px' }}>Attendance %</th>
                  <th style={{ padding: '3px' }}>Completion %</th>
                </tr>
              </thead>
              <tbody>
                {trainingData.programSummaryList.slice(0, 5).map(p => (
                  <tr key={p.programCode} style={{ borderBottom: '1px solid #283548', color: '#E2E8F0' }}>
                    <td style={{ padding: '3px', fontWeight: 'bold', color: '#818CF8' }}>{p.programCode}</td>
                    <td style={{ padding: '3px' }}>{p.programName}</td>
                    <td style={{ padding: '3px' }}>{p.status}</td>
                    <td style={{ padding: '3px' }}>{p.totalBatches}</td>
                    <td style={{ padding: '3px' }}>{p.employeesTrained}</td>
                    <td style={{ padding: '3px' }}>{p.trainingHours} hrs</td>
                    <td style={{ padding: '3px', color: '#34D399', fontWeight: 'bold' }}>{p.attendanceRate}%</td>
                    <td style={{ padding: '3px', color: '#A78BFA', fontWeight: 'bold' }}>{p.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

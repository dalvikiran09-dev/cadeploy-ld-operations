import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Percent, 
  TrendingUp, 
  Layers, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area,
  Cell
} from 'recharts';

interface AttendanceDashboardKPIsProps {
  todaySessionsCount: number;
  expectedCount: number;
  presentCount: number;
  absentCount: number;
  overallRate: number;
  batchBreakdownData: Array<{ name: string; present: number; absent: number; total: number; rate: number }>;
  programBreakdownData: Array<{ name: string; attended: number; absent: number; rate: number }>;
  trendData: Array<{ date: string; rate: number; count: number }>;
}

export const AttendanceDashboardKPIs: React.FC<AttendanceDashboardKPIsProps> = ({
  todaySessionsCount,
  expectedCount,
  presentCount,
  absentCount,
  overallRate,
  batchBreakdownData,
  programBreakdownData,
  trendData
}) => {
  return (
    <div className="space-y-6">
      {/* 5 Top Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Today's Sessions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Sessions</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {todaySessionsCount}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              Active batches
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Employees Expected */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Employees Expected</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {expectedCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Nominated headcount
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Employees Present */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Employees Present</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {presentCount}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              Attended & on time
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Employees Absent */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Employees Absent</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {absentCount}
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">
              Unattended / Leave
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Overall Attendance % */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Attendance</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {overallRate}%
            </div>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full rounded-full ${
                  overallRate >= 80 ? 'bg-emerald-500' : overallRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, overallRate)}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Visualizers (Attendance by Batch, Program & Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Batch */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Attendance by Batch</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Active & Recent</span>
          </div>

          {batchBreakdownData.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No batch attendance data recorded yet
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchBreakdownData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg">
                          <div className="font-bold">{data.name}</div>
                          <div>Present: {data.present}</div>
                          <div>Absent: {data.absent}</div>
                          <div>Rate: {data.rate}%</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="absent" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Attendance by Program */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Attendance by Program</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Curriculum overview</span>
          </div>

          {programBreakdownData.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No program attendance data recorded yet
            </div>
          ) : (
            <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
              {programBreakdownData.slice(0, 4).map((prog, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{prog.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{prog.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full"
                      style={{ width: `${prog.rate}%` }}
                    />
                    <div 
                      className="bg-rose-500 h-full"
                      style={{ width: `${100 - prog.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Trend */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Attendance Trend</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Recent sessions</span>
          </div>

          {trendData.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No trend records available
            </div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg">
                          <div className="font-bold">{data.date}</div>
                          <div>Rate: {data.rate}%</div>
                          <div>Records: {data.count}</div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#attRateGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

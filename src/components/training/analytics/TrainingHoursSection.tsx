import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Clock, BookOpen, User, Flame } from 'lucide-react';
import { TrainingHoursSummary } from '../../../types/trainingAnalytics';

interface Props {
  data: TrainingHoursSummary;
}

export const TrainingHoursSection: React.FC<Props> = ({ data }) => {
  const chartData = data.hoursByProgram.slice(0, 8);

  return (
    <div id="training-hours-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Hours & Instructional Volume</h4>
            <p className="text-2xs text-slate-500">Calculated duration across module sessions and program curricula</p>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-600 text-white shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xs font-semibold text-orange-900 uppercase tracking-wider block">
              Total Hours Delivered
            </span>
            <span className="text-xl font-bold text-orange-900">
              {data.totalTrainingHours} <span className="text-xs font-normal">hrs</span>
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xs font-semibold text-blue-900 uppercase tracking-wider block">
              Avg Hours / Program
            </span>
            <span className="text-xl font-bold text-blue-900">
              {data.averageHoursPerProgram} <span className="text-xs font-normal">hrs</span>
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xs font-semibold text-indigo-900 uppercase tracking-wider block">
              Avg Hours / Trained Employee
            </span>
            <span className="text-xl font-bold text-indigo-900">
              {data.averageHoursPerAttendee} <span className="text-xs font-normal">hrs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart: Hours by Program */}
      <div className="h-56">
        <h5 className="text-2xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Instructional Hours by Program
        </h5>
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No program hours data found.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="programCode" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip
                formatter={(val, name, item) => [
                  `${val} hrs (${item.payload.programName})`,
                  'Duration'
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="hours" name="Program Hours" fill="#EA580C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

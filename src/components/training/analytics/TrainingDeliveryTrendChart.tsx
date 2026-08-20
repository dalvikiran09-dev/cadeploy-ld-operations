import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Layers, Users, Clock } from 'lucide-react';
import { DeliveryTrendItem } from '../../../types/trainingAnalytics';

interface Props {
  data: DeliveryTrendItem[];
}

export const TrainingDeliveryTrendChart: React.FC<Props> = ({ data }) => {
  const [metricView, setMetricView] = useState<'batches' | 'attendees' | 'hours'>('batches');

  if (data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Training Delivery Trend</h4>
        </div>
        <div className="py-12 text-center text-xs text-slate-400">
          No temporal delivery records found for selected period.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Delivery Trend</h4>
            <p className="text-2xs text-slate-500">Cadence of training programs and delivery over time</p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-2xs">
          <button
            type="button"
            onClick={() => setMetricView('batches')}
            className={`px-2.5 py-1 font-medium rounded-md transition-all ${
              metricView === 'batches' ? 'bg-indigo-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batches & Programs
          </button>
          <button
            type="button"
            onClick={() => setMetricView('attendees')}
            className={`px-2.5 py-1 font-medium rounded-md transition-all ${
              metricView === 'attendees' ? 'bg-indigo-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendees
          </button>
          <button
            type="button"
            onClick={() => setMetricView('hours')}
            className={`px-2.5 py-1 font-medium rounded-md transition-all ${
              metricView === 'hours' ? 'bg-indigo-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hours
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'batches' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Bar dataKey="batchesCount" name="Batches Conducted" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="programsCount" name="Programs Active" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : metricView === 'attendees' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="attendeesCount" name="Total Attendees" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => [`${val} hrs`, 'Training Hours']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area type="monotone" dataKey="trainingHours" stroke="#EA580C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" name="Instruction Hours" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

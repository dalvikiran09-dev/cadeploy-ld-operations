import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ProgramStatusDistribution } from '../../../types/trainingAnalytics';

interface Props {
  data: ProgramStatusDistribution;
}

export const ProgramStatusChart: React.FC<Props> = ({ data }) => {
  const total = data.upcoming + data.ongoing + data.completed + data.cancelled;

  const chartData = [
    { name: 'Completed', value: data.completed, color: '#10B981', bg: 'bg-emerald-500' },
    { name: 'In Progress', value: data.ongoing, color: '#3B82F6', bg: 'bg-blue-500' },
    { name: 'Upcoming / Planned', value: data.upcoming, color: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'Cancelled / Hold', value: data.cancelled, color: '#EF4444', bg: 'bg-rose-500' }
  ].filter(d => d.value > 0);

  // If no data, show empty state
  if (total === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Program Status Distribution</h4>
        </div>
        <div className="py-12 text-center text-xs text-slate-400">
          No program status data for selected period.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Program Status Distribution</h4>
            <p className="text-2xs text-slate-500">Breakdown of programs and batch cohorts</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          Total: {total}
        </span>
      </div>

      <div className="h-52 relative my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `${value} programs (${Math.round((Number(value) / total) * 100)}%)`,
                name
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-800">{total}</span>
          <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Programs</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full ${item.bg} shrink-0`} />
              <span className="text-slate-600 truncate text-2xs">{item.name}</span>
            </div>
            <span className="font-bold text-slate-800 text-2xs ml-1">
              {item.value} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

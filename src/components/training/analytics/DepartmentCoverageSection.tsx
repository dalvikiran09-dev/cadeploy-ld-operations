import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Building2, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { DepartmentCoverageItem } from '../../../types/trainingAnalytics';

interface Props {
  data: DepartmentCoverageItem[];
}

export const DepartmentCoverageSection: React.FC<Props> = ({ data }) => {
  const hasData = data && data.length > 0 && data.some(d => d.employeesNominated > 0);

  return (
    <div id="department-coverage-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Coverage by Department</h4>
            <p className="text-2xs text-slate-500">Employee nomination and attendance distribution across company teams</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-10 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Department data unavailable</p>
          <p className="text-2xs text-slate-400 mt-0.5 max-w-sm mx-auto">
            Assign departments to employees in User Management to enable department-wise training analytics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart (6 cols) */}
          <div className="lg:col-span-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="employeesNominated" name="Nominated" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="employeesAttended" name="Attended" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table (6 cols) */}
          <div className="lg:col-span-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-2 text-center">Nominated</th>
                  <th className="py-2 px-2 text-center">Attended</th>
                  <th className="py-2 px-2 text-right">Att %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((dept) => (
                  <tr key={dept.department} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{dept.department}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{dept.employeesNominated}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-teal-700">{dept.employeesAttended}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900">{dept.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  PlayCircle, 
  Search, 
  ChevronRight, 
  Calendar, 
  User, 
  Users, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { OngoingProgramItem } from '../../../types/trainingAnalytics';

interface Props {
  programs: OngoingProgramItem[];
  onSelectProgram: (program: OngoingProgramItem) => void;
}

export const OngoingProgramsSection: React.FC<Props> = ({ programs, onSelectProgram }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'planned'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredPrograms = useMemo(() => {
    return programs.filter(item => {
      // Search term
      const matchesSearch = 
        item.programCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.facilitator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.facilitatorName && item.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Status tab
      if (statusFilter === 'in_progress') {
        return item.batchStatus.toLowerCase().includes('progress') || item.batchStatus.toLowerCase().includes('active');
      }
      if (statusFilter === 'completed') {
        return item.batchStatus.toLowerCase().includes('completed');
      }
      if (statusFilter === 'planned') {
        return item.batchStatus.toLowerCase().includes('planned') || item.batchStatus.toLowerCase().includes('draft');
      }

      return true;
    });
  }, [programs, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (s.includes('progress') || s.includes('active')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          In Progress
        </span>
      );
    }
    if (s.includes('cancel') || s.includes('hold')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          On Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        Planned
      </span>
    );
  };

  return (
    <div id="ongoing-training-programs-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs mb-6 overflow-hidden">
      {/* Section Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                ONGOING TRAINING PROGRAMS & BATCHES
              </h3>
              <p className="text-xs text-slate-500">
                Live delivery cohorts, schedules, attendance rates and completion progress
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter Pills & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({programs.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ongoing programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-48 lg:w-56"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filteredPrograms.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <PlayCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700">No training programs match the criteria</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter period in the top filters bar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Program & Batch</th>
                <th className="py-3 px-3">Timeline</th>
                <th className="py-3 px-3">Facilitator</th>
                <th className="py-3 px-3 text-center">Nominees</th>
                <th className="py-3 px-3 text-center">Attendance</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Completion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPrograms.map((item) => (
                <tr
                  key={`${item.programCode}-${item.batchCode}`}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectProgram(item)}
                >
                  {/* Program & Batch Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        {item.programName}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-2xs text-slate-500 font-mono">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {item.programCode}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100">
                          {item.batchCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1.5 text-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.startDate}</span>
                      {item.endDate && item.endDate !== item.startDate && (
                        <>
                          <span className="text-slate-400">→</span>
                          <span>{item.endDate}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Facilitator */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{item.facilitatorName || item.facilitator}</span>
                    </div>
                  </td>

                  {/* Nominees */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md text-xs">
                      {item.nomineesCount}
                    </span>
                  </td>

                  {/* Attendance Rate */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-2xs font-semibold">
                        <span className={item.attendanceRate >= 80 ? 'text-emerald-700' : item.attendanceRate >= 50 ? 'text-amber-700' : 'text-slate-600'}>
                          {item.attendanceRate}%
                        </span>
                        <span className="text-slate-400 font-normal">
                          ({item.attendedCount} pres / {item.absentCount} abs)
                        </span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.attendanceRate >= 80 ? 'bg-emerald-500' : item.attendanceRate >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, item.attendanceRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(item.batchStatus)}
                  </td>

                  {/* Completion Progress */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="text-slate-500 font-medium">{item.completedActivities}/{item.totalActivities} sessions</span>
                        <span className="font-bold text-slate-700">{item.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, item.completionRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProgram(item);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

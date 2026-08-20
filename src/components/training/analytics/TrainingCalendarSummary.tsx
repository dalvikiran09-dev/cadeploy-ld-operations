import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  PlayCircle,
  CalendarDays
} from 'lucide-react';
import { TrainingCalendarEvent } from '../../../types/trainingAnalytics';

interface Props {
  events: TrainingCalendarEvent[];
  onSelectEvent?: (event: TrainingCalendarEvent) => void;
}

export const TrainingCalendarSummary: React.FC<Props> = ({ events, onSelectEvent }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Upcoming' | 'Ongoing' | 'Completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.programName.toLowerCase().includes(q) ||
        e.programCode.toLowerCase().includes(q) ||
        e.batchCode.toLowerCase().includes(q) ||
        e.activityTitle.toLowerCase().includes(q) ||
        e.facilitator.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (st: string) => {
    if (st === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Completed
        </span>
      );
    }
    if (st === 'Ongoing') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-blue-100 text-blue-800">
          <span className="w-1 h-1 rounded-full bg-blue-600 animate-ping"></span>
          Ongoing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-semibold bg-amber-100 text-amber-800">
        Upcoming
      </span>
    );
  };

  return (
    <div id="training-calendar-summary" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Schedule & Calendar Summary</h4>
            <p className="text-2xs text-slate-500">Upcoming delivery sessions, venue arrangements and activity milestones</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-2xs">
            {(['all', 'Upcoming', 'Ongoing', 'Completed'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  filterStatus === tab ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all' ? `All (${events.length})` : tab}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-36 sm:w-44"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No training calendar events found for selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.slice(0, 9).map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent?.(event)}
              className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-slate-900 text-xs line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {event.activityTitle}
                  </span>
                  {getStatusBadge(event.status)}
                </div>

                <p className="text-2xs text-slate-500 line-clamp-1 mb-2 font-medium">
                  {event.programName}
                </p>

                <div className="space-y-1 text-3xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-400">Batch:</span>
                    <span className="text-slate-700 font-semibold">{event.batchCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-slate-400" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{event.facilitatorName || event.facilitator}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

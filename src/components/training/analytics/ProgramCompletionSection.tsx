import React from 'react';
import { Award, CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';
import { ProgramCompletionAnalysis } from '../../../types/trainingAnalytics';

interface Props {
  data: ProgramCompletionAnalysis;
}

export const ProgramCompletionSection: React.FC<Props> = ({ data }) => {
  return (
    <div id="program-completion-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Training Program Completion</h4>
            <p className="text-2xs text-slate-500">Progression from planning to successful batch delivery</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold text-slate-500">Completion Rate:</span>
          <span className="text-base font-extrabold text-blue-700">{data.completionRate}%</span>
        </div>
      </div>

      {/* Progress Bar & Denominator Description */}
      <div className="mb-4">
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${Math.min(100, data.completionRate)}%` }}
          />
        </div>
        <p className="text-3xs text-slate-400 mt-1 italic text-right">
          Formula: {data.denominatorDescription}
        </p>
      </div>

      {/* 4 Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-900">Planned</span>
          </div>
          <span className="text-base font-bold text-amber-800">{data.programsPlanned}</span>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">In Progress</span>
          </div>
          <span className="text-base font-bold text-blue-800">{data.programsStarted}</span>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-900">Completed</span>
          </div>
          <span className="text-base font-bold text-emerald-800">{data.programsCompleted}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">Cancelled / Hold</span>
          </div>
          <span className="text-base font-bold text-slate-800">{data.programsCancelled}</span>
        </div>
      </div>
    </div>
  );
};

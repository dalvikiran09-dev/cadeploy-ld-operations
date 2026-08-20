import React from 'react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Building2, 
  Layers 
} from 'lucide-react';
import { useBatch } from '../../../context/BatchContext';
import { TrainingEmployee } from '../../../types/assessment';

interface EmployeeHistoryTabProps {
  employee: TrainingEmployee;
}

export const EmployeeHistoryTab: React.FC<EmployeeHistoryTabProps> = ({
  employee
}) => {
  const { batches = [], nominees = [] } = useBatch();

  const empCode = (employee.employeeCode || '').toUpperCase();
  const empNominees = (nominees || []).filter(n => n.employeeCode && n.employeeCode.toUpperCase() === empCode);

  const batchHistory = empNominees.map(nom => {
    const batch = (batches || []).find(b => b.id === nom.batchId || (b.batchCode && nom.batchCode && b.batchCode.toUpperCase() === nom.batchCode.toUpperCase()));
    return {
      nominationId: nom.id,
      batchCode: batch?.batchCode || nom.batchCode || 'BTCH001',
      programCode: batch?.programCode || 'PRG001',
      programName: batch?.programName || 'Training Program',
      trainerName: batch?.trainerName || 'Assigned Trainer',
      startDate: batch?.startDate || '-',
      endDate: batch?.endDate || '-',
      location: batch?.location || 'Main Office',
      status: batch?.status || 'In Progress',
      nominationDate: nom.createdAt ? new Date(nom.createdAt).toISOString().slice(0, 10) : '-'
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Training Batch & Program Enrolment History ({batchHistory.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete record of training batches, schedules, and program participation
          </p>
        </div>

        {batchHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold">No batch nominations found for this employee.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8">
              {batchHistory.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline bullet */}
                  <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-xs" />

                  <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.programName}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-2xs">
                            {item.batchCode}
                          </span>
                        </div>
                        <span className="text-2xs font-mono text-slate-500 block mt-0.5">{item.programCode}</span>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wide self-start ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Schedule: <strong>{item.startDate} &rarr; {item.endDate}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Trainer: <strong>{item.trainerName}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Location: <strong>{item.location}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

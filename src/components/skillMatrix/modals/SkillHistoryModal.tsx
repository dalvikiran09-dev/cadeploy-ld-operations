import React from 'react';
import { X, History, Award, Calendar } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { TrainingEmployee } from '../../../types/assessment';
import { getProficiencyLabel } from '../../../utils/skillMatrixUtils';

interface SkillHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: TrainingEmployee | null;
}

export const SkillHistoryModal: React.FC<SkillHistoryModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const { skillAssessmentHistory = [] } = useAssessment();

  if (!isOpen || !employee) return null;

  const employeeHistory = skillAssessmentHistory
    .filter(h => h.employeeCode.toUpperCase() === employee.employeeCode.toUpperCase())
    .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());

  // Group by assessment date
  const groupedHistory = React.useMemo(() => {
    const groups: { [date: string]: typeof employeeHistory } = {};
    employeeHistory.forEach(item => {
      const key = item.assessmentDate || 'Undated';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [employeeHistory]);

  const dates = Object.keys(groupedHistory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Skill Assessment History</span>
                <span className="text-xs font-mono font-normal text-blue-600 dark:text-blue-400">
                  {employee.employeeCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {employee.employeeName} &bull; {employee.department} {employee.designation ? `(${employee.designation})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No past skill assessments recorded for this employee.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dates.map(date => {
                const items = groupedHistory[date];
                const assessor = items[0]?.assessedBy || 'L&D Admin';
                const remarks = items.find(i => !!i.remarks)?.remarks;

                return (
                  <div 
                    key={date}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {date}
                        </span>
                      </div>

                      <div className="text-2xs text-slate-500">
                        Evaluated by: <span className="font-semibold text-slate-700 dark:text-slate-300">{assessor}</span>
                      </div>
                    </div>

                    {/* Skills evaluated */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="text-3xs text-slate-400 truncate" title={item.skillName}>
                            {item.skillName}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Level {item.level} <span className="text-3xs font-normal text-slate-400">({getProficiencyLabel(item.level)})</span>
                            </span>
                            <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              L{item.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {remarks && (
                      <div className="text-2xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Remarks: </span>
                        {remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

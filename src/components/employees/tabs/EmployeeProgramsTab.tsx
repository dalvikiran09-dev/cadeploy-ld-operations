import React from 'react';
import { 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Award 
} from 'lucide-react';
import { useTraining } from '../../../context/TrainingContext';
import { useBatch } from '../../../context/BatchContext';
import { useAssessment } from '../../../context/AssessmentContext';
import { TrainingEmployee } from '../../../types/assessment';

interface EmployeeProgramsTabProps {
  employee: TrainingEmployee;
}

export const EmployeeProgramsTab: React.FC<EmployeeProgramsTabProps> = ({
  employee
}) => {
  const { programs = [], courses = [] } = useTraining();
  const { batches = [], nominees = [] } = useBatch();
  const { getEmployeeConsolidatedRecords } = useAssessment();

  const empCode = (employee.employeeCode || '').toUpperCase();
  const consolidated = (getEmployeeConsolidatedRecords ? getEmployeeConsolidatedRecords(empCode) : []) || [];

  // Group by program code
  const uniqueProgCodes = Array.from(new Set(consolidated.map(c => c.programCode)));
  const enrolledPrograms = uniqueProgCodes.map(pCode => {
    const prog = programs.find(p => p.programCode.toUpperCase() === pCode.toUpperCase());
    const progRecords = consolidated.filter(c => c.programCode.toUpperCase() === pCode.toUpperCase());
    const progCourses = courses.filter(c => c.programCode.toUpperCase() === pCode.toUpperCase());
    const passedModules = progRecords.filter(r => r.finalResult === 'Pass').length;

    return {
      programCode: pCode,
      programName: prog?.programName || progRecords[0]?.programName || pCode,
      description: prog?.programDescription || '',
      records: progRecords,
      totalModules: progCourses.length || progRecords.length,
      passedModules: passedModules,
      progressPct: progRecords.length > 0 ? Math.round((passedModules / progRecords.length) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Enrolled Training Programs ({enrolledPrograms.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured course curricula, module completions, and qualification progress
          </p>
        </div>

        {enrolledPrograms.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold">No program enrolments found for this employee.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolledPrograms.map((prog, idx) => (
              <div key={idx} className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-2xs">
                        {prog.programCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {prog.programName}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      {prog.records.length} module{prog.records.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Completion Rate</span>
                      <span className="font-bold text-slate-900 dark:text-white">{prog.progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${prog.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Enrolled Modules</span>
                    {prog.records.map((r, mIdx) => (
                      <div key={mIdx} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                            r.finalResult === 'Pass' ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'
                          }`} />
                          <span className="text-slate-800 dark:text-slate-200 truncate">{r.moduleName}</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded-full text-3xs font-extrabold shrink-0 ${
                          r.finalResult === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {r.finalResult}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

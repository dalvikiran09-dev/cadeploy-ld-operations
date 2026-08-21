import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Search, 
  Download, 
  Settings, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  History, 
  TrendingUp, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { EmployeeSkillAssessment, TrainingEmployee } from '../../types/assessment';
import { MAIN_DEPARTMENTS } from '../../constants/departments';
import { 
  getDepartmentSkillsList, 
  calculateSkillGap, 
  isSkillQualified, 
  calculateDepartmentSkillKPIs, 
  exportSkillMatrixToExcel,
  getProficiencyLabel
} from '../../utils/skillMatrixUtils';
import { DeptSkillConfigModal } from './modals/DeptSkillConfigModal';
import { SkillAssessmentModal } from './modals/SkillAssessmentModal';
import { BulkSkillAssessmentModal } from './modals/BulkSkillAssessmentModal';
import { SkillHistoryModal } from './modals/SkillHistoryModal';

export const SkillMatrixView: React.FC = () => {
  const { 
    employees = [], 
    departmentSkills = [], 
    employeeSkillAssessments = []
  } = useAssessment();

  // Selected Department
  const [selectedDept, setSelectedDept] = useState<string>('Tekla');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [gapFilter, setGapFilter] = useState<'all' | 'gap' | 'qualified'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedEmployeeForAssessment, setSelectedEmployeeForAssessment] = useState<TrainingEmployee | null>(null);
  const [selectedAssessmentToEdit, setSelectedAssessmentToEdit] = useState<EmployeeSkillAssessment | null>(null);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<TrainingEmployee | null>(null);

  // List of all departments available across HR Master & Configs
  const availableDepartments = useMemo(() => {
    const set = new Set<string>(MAIN_DEPARTMENTS);
    employees.forEach(e => { if (e.department) set.add(e.department); });
    departmentSkills.forEach(d => { if (d.departmentName) set.add(d.departmentName); });
    return Array.from(set);
  }, [employees, departmentSkills]);

  // Current department skills config
  const currentDeptConfig = useMemo(() => {
    return departmentSkills.find(
      d => d.departmentName.trim().toLowerCase() === selectedDept.trim().toLowerCase()
    ) || null;
  }, [departmentSkills, selectedDept]);

  // Normalized skills list for current department (1 to 5 skills)
  const skillsList = useMemo(() => {
    return getDepartmentSkillsList(currentDeptConfig, selectedDept);
  }, [currentDeptConfig, selectedDept]);

  // Employees in selected department from authoritative HR Master
  const deptEmployees = useMemo(() => {
    return employees.filter(emp => {
      const empDept = (emp.department || '').trim().toLowerCase();
      const selDept = selectedDept.trim().toLowerCase();
      return empDept === selDept || (selDept === 'pemb' && empDept.startsWith('pemb'));
    });
  }, [employees, selectedDept]);

  // Department KPIs
  const kpis = useMemo(() => {
    return calculateDepartmentSkillKPIs(deptEmployees, employeeSkillAssessments, currentDeptConfig, selectedDept);
  }, [deptEmployees, employeeSkillAssessments, currentDeptConfig, selectedDept]);

  // Filtered employees for matrix display
  const matrixRows = useMemo(() => {
    return deptEmployees.filter(emp => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        emp.employeeName.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        (emp.designation && emp.designation.toLowerCase().includes(q));

      // Location
      const matchesLocation = locationFilter === 'all' || emp.location === locationFilter;

      // Check gap status for this employee
      const empAssessments = employeeSkillAssessments.filter(
        a => a.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()
      );

      let hasGap = false;
      if (empAssessments.length === 0) {
        hasGap = true; // Not evaluated yet
      } else {
        skillsList.forEach(s => {
          const match = empAssessments.find(a => a.skillIndex === s.slotNumber || a.skillName.toLowerCase() === s.name.toLowerCase());
          const lvl = match?.currentLevel || 0;
          if (lvl < s.requiredLevel) hasGap = true;
        });
      }

      let matchesGap = true;
      if (gapFilter === 'gap') matchesGap = hasGap;
      if (gapFilter === 'qualified') matchesGap = !hasGap && empAssessments.length > 0;

      return matchesSearch && matchesLocation && matchesGap;
    });
  }, [deptEmployees, searchQuery, locationFilter, gapFilter, employeeSkillAssessments, skillsList]);

  // Unique locations in this department
  const locationsInDept = useMemo(() => {
    const set = new Set<string>();
    deptEmployees.forEach(e => { if (e.location) set.add(e.location); });
    return Array.from(set);
  }, [deptEmployees]);

  // Handlers
  const handleOpenSingleAssessment = (emp: TrainingEmployee) => {
    const existing = employeeSkillAssessments.find(
      a => a.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()
    );
    setSelectedEmployeeForAssessment(emp);
    setSelectedAssessmentToEdit(existing || null);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenHistory = (emp: TrainingEmployee) => {
    setSelectedEmployeeForHistory(emp);
    setIsHistoryModalOpen(true);
  };

  const handleExportExcel = () => {
    exportSkillMatrixToExcel(
      selectedDept,
      deptEmployees,
      employeeSkillAssessments,
      currentDeptConfig,
      `${selectedDept}_Skill_Matrix_Report`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Department Skill Matrix & Gap Analysis
            </h1>
            <p className="text-xs text-slate-500">
              Department-specific proficiency tracking (Levels 1-4) & automated competency training gap detection
            </p>
          </div>
        </div>

        {/* Global Matrix Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export full department skill matrix report to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Matrix</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Customize the 1-5 department skills and target proficiency levels"
          >
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            <span>Configure Skills</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
            title="Evaluate skill levels for all employees in this department in a single spreadsheet"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Bulk Assess</span>
          </button>
        </div>
      </div>

      {/* Department Selector Navigation */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-2xs font-extrabold uppercase text-slate-400 px-3 tracking-wider shrink-0">
          Department:
        </span>
        {availableDepartments.map(dept => {
          const isSelected = selectedDept.toLowerCase() === dept.toLowerCase();
          const deptCount = employees.filter(e => (e.department || '').toLowerCase() === dept.toLowerCase()).length;

          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{dept}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-3xs font-extrabold ${
                isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {deptCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Department Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider">Dept Employees</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.totalEmployees}
          </div>
          <div className="text-3xs text-slate-400 mt-1">
            Authoritative HR Master count
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider">Evaluated</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.evaluatedEmployees}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({kpis.totalEmployees > 0 ? Math.round((kpis.evaluatedEmployees / kpis.totalEmployees) * 100) : 0}%)
            </span>
          </div>
          <div className="text-3xs text-slate-400 mt-1">
            Assessed profiles
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider">Fully Qualified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpis.fullyQualifiedEmployees}
          </div>
          <div className="text-3xs text-emerald-600/80 mt-1">
            Zero skill gaps detected
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider">Training Needed</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpis.gapEmployees}
          </div>
          <div className="text-3xs text-amber-600/80 mt-1">
            Requires skill elevation
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider">Avg Proficiency</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {kpis.avgProficiency} <span className="text-xs text-slate-400 font-normal">/ 4.0</span>
          </div>
          <div className="text-3xs text-slate-400 mt-1">
            Overall competency index
          </div>
        </div>
      </div>

      {/* Department Defined Skills Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Active Skill Standards for {selectedDept} ({skillsList.length} Defined Skills)
            </span>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="text-2xs font-semibold text-blue-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
          >
            Edit Department Targets &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {skillsList.map(skill => (
            <div key={skill.slotNumber} className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-3xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-100">
                  Skill #{skill.slotNumber}
                </span>
                <span className="text-2xs font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-full">
                  Target: L{skill.requiredLevel}
                </span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {skill.name}
              </div>
              <div className="text-3xs text-blue-200 mt-1">
                {getProficiencyLabel(skill.requiredLevel)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, EMP ID or designation..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={gapFilter}
            onChange={e => setGapFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Gap Statuses</option>
            <option value="gap">Training Needed (Gaps Exist)</option>
            <option value="qualified">Fully Qualified (Meets Targets)</option>
          </select>

          {locationsInDept.length > 1 && (
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Locations</option>
              {locationsInDept.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{matrixRows.length}</span> of {deptEmployees.length} {selectedDept} employees
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-2xs uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Location</th>
                {skillsList.map(skill => (
                  <th key={skill.slotNumber} className="py-3 px-3 text-center min-w-[140px]">
                    <div className="text-slate-800 dark:text-slate-200 truncate font-black" title={skill.name}>
                      {skill.name}
                    </div>
                    <div className="text-3xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      Target: Level {skill.requiredLevel} ({getProficiencyLabel(skill.requiredLevel)})
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center">Status & Gap</th>
                <th className="py-3 px-3 text-center">Last Assessed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={5 + skillsList.length} className="py-16 text-center text-slate-500">
                    <Target className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No employees found for this filter</p>
                    <p className="text-2xs text-slate-400 mt-0.5">Adjust your department, search query, or gap filter settings.</p>
                  </td>
                </tr>
              ) : (
                matrixRows.map(emp => {
                  const empAssessments = employeeSkillAssessments.filter(
                    a => a.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()
                  );

                  let overallHasGap = false;
                  let totalGapPoints = 0;

                  skillsList.forEach(s => {
                    const match = empAssessments.find(a => a.skillIndex === s.slotNumber || a.skillName.toLowerCase() === s.name.toLowerCase());
                    const lvl = match?.currentLevel || 0;
                    const gapInfo = calculateSkillGap(s.requiredLevel, lvl);
                    if (gapInfo.gap > 0) {
                      overallHasGap = true;
                      totalGapPoints += gapInfo.gap;
                    }
                  });

                  const isEvaluated = empAssessments.length > 0;
                  const latestDate = empAssessments[0]?.assessmentDate;
                  const latestAssessor = empAssessments[0]?.assessedBy;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee Identification */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-2xs text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {emp.employeeName}
                            </div>
                            <div className="text-3xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{emp.employeeCode}</span>
                              {emp.designation && (
                                <>
                                  <span>&bull;</span>
                                  <span className="truncate max-w-[130px]">{emp.designation}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-2xs text-slate-600 dark:text-slate-400">
                        {emp.location || 'HQ'}
                      </td>

                      {/* Skills Grid for this employee */}
                      {skillsList.map(skill => {
                        const match = empAssessments.find(a => a.skillIndex === skill.slotNumber || a.skillName.toLowerCase() === skill.name.toLowerCase());
                        const lvl = match?.currentLevel || 0;
                        const gapInfo = calculateSkillGap(skill.requiredLevel, lvl);
                        const isQualified = isSkillQualified(skill.requiredLevel, lvl);

                        return (
                          <td key={skill.slotNumber} className="py-3 px-3 text-center">
                            {lvl > 0 ? (
                              <button
                                onClick={() => handleOpenSingleAssessment(emp)}
                                className={`inline-flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer w-full max-w-[120px] ${
                                  isQualified
                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/60'
                                    : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/60'
                                }`}
                                title={`Click to evaluate skill ${skill.name}`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                    L{lvl}
                                  </span>
                                  <span className="text-3xs font-semibold text-slate-400">
                                    / L{skill.requiredLevel}
                                  </span>
                                </div>
                                <span className={`text-3xs font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${
                                  isQualified 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                }`}>
                                  {gapInfo.gap > 0 ? `Gap: -${gapInfo.gap}` : 'Qualified'}
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenSingleAssessment(emp)}
                                className="px-2.5 py-1 text-3xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                              >
                                Not Evaluated
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Overall Gap Status */}
                      <td className="py-3 px-3 text-center">
                        {!isEvaluated ? (
                          <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Pending Initial Assessment
                          </span>
                        ) : !overallHasGap ? (
                          <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Fully Qualified</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1" title={`${totalGapPoints} total points gap across department skills`}>
                            <AlertCircle className="w-3 h-3" />
                            <span>Training Needed (-{totalGapPoints})</span>
                          </span>
                        )}
                      </td>

                      {/* Last Assessed Date & Assessor */}
                      <td className="py-3 px-3 text-center">
                        {latestDate ? (
                          <div>
                            <div className="text-2xs font-bold text-slate-800 dark:text-slate-200">
                              {latestDate}
                            </div>
                            {latestAssessor && (
                              <div className="text-3xs text-slate-400 truncate max-w-[100px] mx-auto">
                                by {latestAssessor}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-3xs text-slate-400">&mdash;</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenSingleAssessment(emp)}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                            title="Record / Update Skill Assessment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenHistory(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Skill Evaluation History Timeline"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Proficiency Legend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
          Skill Matrix Proficiency Scale & Scoring Architecture
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">Level 1</span>
              <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Foundational / Basic</span>
            </div>
            <p className="text-3xs text-slate-500">
              Basic conceptual knowledge. Requires constant guidance and supervision to execute tasks.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">Level 2</span>
              <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Intermediate / Supervised</span>
            </div>
            <p className="text-3xs text-slate-500">
              Performs standard tasks independently. Complex scenarios require senior review and check.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Level 3</span>
              <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">Proficient / Production Ready</span>
            </div>
            <p className="text-3xs text-slate-500">
              High autonomous output. Fully adheres to international codes, standards, and QA guidelines.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">Level 4</span>
              <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Lead / Subject Specialist</span>
            </div>
            <p className="text-3xs text-slate-500">
              Master-level expert. Capable of mentoring trainees, resolving complex clashes, and leading audits.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeptSkillConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        initialDepartment={selectedDept}
      />

      <SkillAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => {
          setIsAssessmentModalOpen(false);
          setSelectedEmployeeForAssessment(null);
          setSelectedAssessmentToEdit(null);
        }}
        employee={selectedEmployeeForAssessment}
        departmentName={selectedDept}
        existingAssessment={selectedAssessmentToEdit}
      />

      <BulkSkillAssessmentModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        department={selectedDept}
        departmentConfig={currentDeptConfig}
        employeesInDept={deptEmployees}
      />

      <SkillHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedEmployeeForHistory(null);
        }}
        employee={selectedEmployeeForHistory}
      />
    </div>
  );
};

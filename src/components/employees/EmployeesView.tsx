import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  UploadCloud, 
  Download, 
  Filter, 
  Building2, 
  Award, 
  FileCheck2, 
  UserCheck, 
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useApp } from '../../context/AppContext';
import { canManageAssessments, canManagePKT } from '../../utils/permissionUtils';
import { EmployeeProfileTab, TrainingEmployee, TrainingAssessment, TrainingPKT } from '../../types/assessment';
import { EmployeeProfileHeader } from './EmployeeProfileHeader';
import { EmployeeOverviewTab } from './tabs/EmployeeOverviewTab';
import { EmployeeHistoryTab } from './tabs/EmployeeHistoryTab';
import { EmployeeAttendanceTab } from './tabs/EmployeeAttendanceTab';
import { EmployeeAssessmentsTab } from './tabs/EmployeeAssessmentsTab';
import { EmployeePKTTab } from './tabs/EmployeePKTTab';
import { EmployeeProgramsTab } from './tabs/EmployeeProgramsTab';
import { EmployeeCompetenciesTab } from './tabs/EmployeeCompetenciesTab';
import { AssessmentModal } from './modals/AssessmentModal';
import { PKTModal } from './modals/PKTModal';
import { AssessmentImportModal } from './modals/AssessmentImportModal';
import { EmployeeMasterImportModal } from './modals/EmployeeMasterImportModal';
import { EmployeeModal } from './modals/EmployeeModal';
import { exportConsolidatedTrainingRecordsToExcel } from '../../utils/assessmentUtils';
import { exportStandardizedEmployeesToExcel } from '../../utils/employeeImportUtils';
import { MAIN_DEPARTMENTS } from '../../constants/departments';

export const EmployeesView: React.FC = () => {
  const { currentUser } = useApp();
  const { 
    employees = [], 
    assessments = [], 
    pkts = [], 
    isLoading, 
    activeEmployeeCode, 
    setActiveEmployeeCode,
    activeProfileTab,
    setActiveProfileTab,
    getAllConsolidatedRecords
  } = useAssessment();

  const isAssManager = canManageAssessments(currentUser.role);
  const isPktManager = canManagePKT(currentUser.role);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentToEdit, setAssessmentToEdit] = useState<TrainingAssessment | null>(null);

  const [isPKTModalOpen, setIsPKTModalOpen] = useState(false);
  const [pktToEdit, setPktToEdit] = useState<TrainingPKT | null>(null);
  const [pktTargetAttempt, setPktTargetAttempt] = useState<number | undefined>(undefined);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDefaultTab, setImportDefaultTab] = useState<'assessments' | 'pkts'>('assessments');

  const [isEmployeeMasterImportOpen, setIsEmployeeMasterImportOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<TrainingEmployee | null>(null);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        emp.employeeName.toLowerCase().includes(query) ||
        emp.employeeCode.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.designation.toLowerCase().includes(query);

      const matchesDept = 
        selectedDept === 'all' || 
        emp.department.toLowerCase() === selectedDept.toLowerCase() ||
        (selectedDept.toLowerCase() === 'pemb' && emp.department.toLowerCase().startsWith('pemb'));
      const matchesStatus = selectedStatus === 'all' || emp.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>(MAIN_DEPARTMENTS);
    employees.forEach(e => { if (e.department) set.add(e.department); });
    return Array.from(set);
  }, [employees]);

  // Currently selected active employee
  const activeEmployee = useMemo(() => {
    if (!activeEmployeeCode && filteredEmployees.length > 0) {
      return filteredEmployees[0];
    }
    return employees.find(e => e.employeeCode.toUpperCase() === (activeEmployeeCode || '').toUpperCase()) || filteredEmployees[0] || null;
  }, [employees, activeEmployeeCode, filteredEmployees]);

  // Handlers
  const handleOpenAssessmentModal = (ass?: TrainingAssessment | null) => {
    setAssessmentToEdit(ass || null);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenPKTModal = (pkt?: TrainingPKT | null, targetAttempt?: number) => {
    setPktToEdit(pkt || null);
    setPktTargetAttempt(targetAttempt);
    setIsPKTModalOpen(true);
  };

  const handleOpenImport = (tab: 'assessments' | 'pkts') => {
    setImportDefaultTab(tab);
    setIsImportModalOpen(true);
  };

  const handleOpenEditEmployee = (emp?: TrainingEmployee | null) => {
    setEmployeeToEdit(emp || null);
    setIsEmployeeModalOpen(true);
  };

  const handleExportAllConsolidated = () => {
    const allRecords = getAllConsolidatedRecords();
    exportConsolidatedTrainingRecordsToExcel(allRecords, 'All_Employees_Consolidated_Training_Matrix');
  };

  const handleExportEmployeeDirectory = () => {
    exportStandardizedEmployeesToExcel(employees, 'CADeploy_Employee_Master_Directory');
  };

  return (
    <div className="space-y-6">
      {/* Page Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Employee Training Master & Profiles
              </h1>
              <p className="text-xs text-slate-500">
                Unified individual records across Master, Batches, Attendance, Assessments, PKTs & Competencies
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportEmployeeDirectory}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export standard Employee Master Excel sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Directory</span>
          </button>

          <button
            onClick={handleExportAllConsolidated}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export full consolidated matrix across all batches and assessments"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export All Records</span>
          </button>

          {isAssManager && (
            <button
              onClick={() => setIsEmployeeMasterImportOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Upload raw HR Excel files with custom column names and preserve extra fields"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Import HR Master</span>
            </button>
          )}

          {isAssManager && (
            <button
              onClick={() => handleOpenImport('assessments')}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Import batch marks for assessments or PKTs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Assessments</span>
            </button>
          )}

          {isAssManager && (
            <button
              onClick={() => handleOpenEditEmployee(null)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: 2-Column (Sidebar List + Profile Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Trainee & Employee Directory */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col max-h-[820px]">
          {/* Directory Header & Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Directory ({filteredEmployees.length})
              </span>
              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {employees.length} Total
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, EMP code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-2.5 py-1 text-2xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="all">All Depts</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full px-2.5 py-1 text-2xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Directory Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1.5">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No employees matching filter.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = activeEmployee?.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase();
                const empAssCount = assessments.filter(a => !a.deleted && a.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()).length;
                const empPktCount = pkts.filter(p => !p.deleted && p.employeeCode.toUpperCase() === emp.employeeCode.toUpperCase()).length;

                return (
                  <button
                    key={emp.id}
                    onClick={() => setActiveEmployeeCode(emp.employeeCode)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {emp.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-900 dark:text-white'
                          }`}>
                            {emp.employeeName}
                          </span>
                        </div>
                        <div className="text-2xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{emp.employeeCode}</span>
                          <span>&bull;</span>
                          <span className="truncate">{emp.department}</span>
                          {emp.location && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate text-slate-400">{emp.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        {empAssCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" title={`${empAssCount} Assessments`}>
                            {empAssCount}A
                          </span>
                        )}
                        {empPktCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" title={`${empPktCount} PKTs`}>
                            {empPktCount}P
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Employee Full Profile */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {activeEmployee ? (
            <>
              {/* Profile Header & Tabs Navigator */}
              <EmployeeProfileHeader
                employee={activeEmployee}
                activeTab={activeProfileTab}
                onSelectTab={setActiveProfileTab}
                onOpenAssessmentModal={() => handleOpenAssessmentModal(null)}
                onOpenPKTModal={() => handleOpenPKTModal(null)}
                onOpenEditProfile={() => handleOpenEditEmployee(activeEmployee)}
              />

              {/* Tab View Switcher */}
              {activeProfileTab === 'overview' && (
                <EmployeeOverviewTab
                  employee={activeEmployee}
                  onOpenAssessmentModal={() => handleOpenAssessmentModal(null)}
                  onOpenPKTModal={() => handleOpenPKTModal(null)}
                  onNavigateTab={setActiveProfileTab}
                />
              )}

              {activeProfileTab === 'history' && (
                <EmployeeHistoryTab employee={activeEmployee} />
              )}

              {activeProfileTab === 'attendance' && (
                <EmployeeAttendanceTab employee={activeEmployee} />
              )}

              {activeProfileTab === 'assessments' && (
                <EmployeeAssessmentsTab
                  employee={activeEmployee}
                  onOpenAssessmentModal={handleOpenAssessmentModal}
                />
              )}

              {activeProfileTab === 'pkts' && (
                <EmployeePKTTab
                  employee={activeEmployee}
                  onOpenPKTModal={handleOpenPKTModal}
                />
              )}

              {activeProfileTab === 'programs' && (
                <EmployeeProgramsTab employee={activeEmployee} />
              )}

              {activeProfileTab === 'competencies' && (
                <EmployeeCompetenciesTab employee={activeEmployee} />
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Employee Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select an employee from the directory or create a new employee profile to view their training records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => { setIsAssessmentModalOpen(false); setAssessmentToEdit(null); }}
        employeeCode={activeEmployee?.employeeCode}
        assessmentToEdit={assessmentToEdit}
      />

      <PKTModal
        isOpen={isPKTModalOpen}
        onClose={() => { setIsPKTModalOpen(false); setPktToEdit(null); setPktTargetAttempt(undefined); }}
        employeeCode={activeEmployee?.employeeCode}
        pktToEdit={pktToEdit}
        targetAttemptNumber={pktTargetAttempt}
      />

      <AssessmentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultTab={importDefaultTab}
      />

      <EmployeeMasterImportModal
        isOpen={isEmployeeMasterImportOpen}
        onClose={() => setIsEmployeeMasterImportOpen(false)}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => { setIsEmployeeModalOpen(false); setEmployeeToEdit(null); }}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
};

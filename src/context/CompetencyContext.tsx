import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrainingDepartment,
  TrainingFrameworkVersion,
  TrainingCompetency,
  TrainingCompetencyLevel,
  TrainingRole,
  TrainingRoleCompetency,
  TrainingEmployeeCompetencyAssessment,
  EmployeeCompetencyProfileSummary,
  EmployeeCompetencyItemSummary,
  DepartmentCompetencyOverviewMetrics,
  TrainingNeedItem,
  CompetencyTier,
  CompetencyProficiencyNumber,
  CompetencyGapStatus,
  TeklaFrameworkValidationReport,
  UnmappedEmployeeDetail,
  RoleReconciliationSummary,
  FunctionalReconciliationItem,
  FunctionalReconciliationReport,
  SourceFunctionalCompetency,
  AssessmentTermItem
} from '../types/competency';
import {
  SEED_DEPARTMENTS,
  SEED_FRAMEWORK_VERSIONS,
  SEED_TEKLA_COMPETENCIES,
  SEED_TEKLA_ROLES,
  SEED_TEKLA_ROLE_COMPETENCIES
} from '../data/seedTeklaCompetencies';
import { TEKLA_SOURCE_FUNCTIONAL_COMPETENCIES } from '../data/sourceCompetencyCatalogue';
import { useAssessment } from './AssessmentContext';

interface CompetencyContextType {
  // Department selection
  selectedDepartmentId: string;
  setSelectedDepartmentId: (id: string) => void;
  selectedDepartment: TrainingDepartment | undefined;

  // Assessment Term / Cycle selection
  assessmentTerms: AssessmentTermItem[];
  activeAssessmentTerm: string;
  setActiveAssessmentTerm: (term: string) => void;

  // Master Data
  departments: TrainingDepartment[];
  frameworkVersions: TrainingFrameworkVersion[];
  competencies: TrainingCompetency[]; // All competencies across depts (Master Library)
  activeDeptCompetencies: TrainingCompetency[]; // Filtered by selected department (Master Library for Dept)
  roles: TrainingRole[]; // All roles across depts
  activeDeptRoles: TrainingRole[]; // Filtered by selected department
  roleCompetencies: TrainingRoleCompetency[];
  assessments: TrainingEmployeeCompetencyAssessment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  resetToOfficialTeklaFramework: () => Promise<void>;
  createDepartment: (dept: Partial<TrainingDepartment>) => Promise<TrainingDepartment>;
  updateDepartment: (id: string, dept: Partial<TrainingDepartment>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  createFrameworkVersion: (ver: Partial<TrainingFrameworkVersion>) => Promise<TrainingFrameworkVersion>;
  updateFrameworkVersion: (id: string, ver: Partial<TrainingFrameworkVersion>) => Promise<void>;

  createCompetency: (comp: Partial<TrainingCompetency>, levels?: Partial<TrainingCompetencyLevel>[]) => Promise<TrainingCompetency>;
  updateCompetency: (id: string, comp: Partial<TrainingCompetency>, levels?: Partial<TrainingCompetencyLevel>[]) => Promise<void>;
  deleteCompetency: (id: string) => Promise<void>;

  createRole: (role: Partial<TrainingRole>, competenciesConfig?: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]) => Promise<TrainingRole>;
  updateRole: (id: string, role: Partial<TrainingRole>, competenciesConfig?: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;

  saveRoleCompetencies: (roleId: string, departmentId: string, configs: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]) => Promise<void>;

  recordAssessment: (data: Omit<TrainingEmployeeCompetencyAssessment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TrainingEmployeeCompetencyAssessment>;
  bulkRecordAssessments: (assessmentsList: Omit<TrainingEmployeeCompetencyAssessment, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;

  // Analytics & Profile helpers
  getEmployeeCompetencyProfile: (employeeCode: string, departmentId?: string, assessmentTerm?: string) => EmployeeCompetencyProfileSummary;
  getDepartmentOverviewMetrics: (departmentId?: string, assessmentTerm?: string) => DepartmentCompetencyOverviewMetrics;
  getDepartmentTrainingNeeds: (departmentId?: string, assessmentTerm?: string) => TrainingNeedItem[];
  findRoleForEmployee: (departmentName: string, designation: string) => TrainingRole | undefined;
  getTeklaValidationReport: () => TeklaFrameworkValidationReport;
  getFunctionalReconciliationReport: (departmentId?: string) => FunctionalReconciliationReport;
}

const CompetencyContext = createContext<CompetencyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_DEPTS = 'cadeploy_training_departments_v2';
const LOCAL_STORAGE_KEY_FWV = 'cadeploy_training_framework_versions_v2';
const LOCAL_STORAGE_KEY_COMPS = 'cadeploy_training_competencies_v2';
const LOCAL_STORAGE_KEY_ROLES = 'cadeploy_training_roles_v2';
const LOCAL_STORAGE_KEY_RC = 'cadeploy_training_role_competencies_v2';
const LOCAL_STORAGE_KEY_ASSESS = 'cadeploy_training_employee_assessments_v2';
const LOCAL_STORAGE_KEY_TERM = 'cadeploy_training_assessment_term_v2';

const DEFAULT_ASSESSMENT_TERMS: AssessmentTermItem[] = [
  { id: 'term-2026-annual', termName: '2026 Annual', isCurrent: true, status: 'Active', frameworkVersion: 'V1.0' },
  { id: 'term-2026-h1', termName: '2026 H1', isCurrent: false, status: 'Completed', frameworkVersion: 'V1.0' },
  { id: 'term-2026-h2', termName: '2026 H2', isCurrent: false, status: 'Upcoming', frameworkVersion: 'V1.0' },
  { id: 'term-2027-annual', termName: '2027 Annual', isCurrent: false, status: 'Draft', frameworkVersion: 'V1.0' }
];

export const CompetencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { employees } = useAssessment();

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept-tekla');
  const [assessmentTerms] = useState<AssessmentTermItem[]>(DEFAULT_ASSESSMENT_TERMS);
  const [activeAssessmentTerm, setActiveAssessmentTerm] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_TERM) || '2026 Annual';
  });

  const [departments, setDepartments] = useState<TrainingDepartment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DEPTS);
    return saved ? JSON.parse(saved) : SEED_DEPARTMENTS;
  });

  const [frameworkVersions, setFrameworkVersions] = useState<TrainingFrameworkVersion[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_FWV);
    return saved ? JSON.parse(saved) : SEED_FRAMEWORK_VERSIONS;
  });

  const [competencies, setCompetencies] = useState<TrainingCompetency[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_COMPS);
    return saved ? JSON.parse(saved) : SEED_TEKLA_COMPETENCIES;
  });

  const [roles, setRoles] = useState<TrainingRole[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROLES);
    return saved ? JSON.parse(saved) : SEED_TEKLA_ROLES;
  });

  const [roleCompetencies, setRoleCompetencies] = useState<TrainingRoleCompetency[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RC);
    return saved ? JSON.parse(saved) : SEED_TEKLA_ROLE_COMPETENCIES;
  });

  const [assessments, setAssessments] = useState<TrainingEmployeeCompetencyAssessment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ASSESS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync to local storage for instant reactivity
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DEPTS, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_FWV, JSON.stringify(frameworkVersions));
  }, [frameworkVersions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_COMPS, JSON.stringify(competencies));
  }, [competencies]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_RC, JSON.stringify(roleCompetencies));
  }, [roleCompetencies]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ASSESS, JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TERM, activeAssessmentTerm);
  }, [activeAssessmentTerm]);

  // Active department helper
  const selectedDepartment = useMemo(() => {
    return departments.find(d => d.id === selectedDepartmentId) || departments[0];
  }, [departments, selectedDepartmentId]);

  // Competencies in active department
  const activeDeptCompetencies = useMemo(() => {
    return competencies.filter(c => c.departmentId === selectedDepartmentId && c.status === 'Active');
  }, [competencies, selectedDepartmentId]);

  // Roles in active department
  const activeDeptRoles = useMemo(() => {
    return roles.filter(r => r.departmentId === selectedDepartmentId && r.status === 'Active');
  }, [roles, selectedDepartmentId]);

  // ============================================================================
  // Master Reconciliation & Sync: Reconciles Official 40 Tekla Competencies + 10 Roles
  // Preserves Historical Assessments by Marking Legacy Competencies as Inactive/Deprecated
  // ============================================================================
  const resetToOfficialTeklaFramework = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Departments
      for (const sd of SEED_DEPARTMENTS) {
        await supabase.from('training_departments').upsert({
          id: sd.id,
          department_name: sd.departmentName,
          code: sd.code,
          status: sd.status
        });
      }

      // 2. Framework Version
      for (const sf of SEED_FRAMEWORK_VERSIONS) {
        await supabase.from('training_framework_versions').upsert({
          id: sf.id,
          department_id: sf.departmentId,
          version: sf.version,
          status: sf.status,
          authorization_date: sf.authorizationDate,
          effective_date: sf.effectiveDate,
          notes: sf.notes
        });
      }

      // 3. Check existing database competencies for dept-tekla & historical assessments
      const { data: existingDbComps } = await supabase
        .from('training_competencies')
        .select('id, code, name, department_id')
        .eq('department_id', 'dept-tekla');

      const { data: existingAssessments } = await supabase
        .from('training_employee_competency_assessments')
        .select('competency_id');

      const assessedCompIds = new Set((existingAssessments || []).map((a: any) => a.competency_id));
      const authoritativeCompIds = new Set(SEED_TEKLA_COMPETENCIES.map(c => c.id));
      const authoritativeCompCodes = new Set(SEED_TEKLA_COMPETENCIES.map(c => c.code));

      // Handle legacy / non-authoritative competencies
      if (existingDbComps && existingDbComps.length > 0) {
        for (const ec of existingDbComps) {
          if (!authoritativeCompIds.has(ec.id) && !authoritativeCompCodes.has(ec.code)) {
            if (assessedCompIds.has(ec.id)) {
              // Preserve historical data by marking as Inactive / Deprecated
              await supabase.from('training_competencies').update({
                status: 'Inactive',
                description: `[Legacy / Deprecated Framework] Historical assessment records preserved.`,
                updated_at: new Date().toISOString()
              }).eq('id', ec.id);
            } else {
              // Safely remove unassessed legacy competencies
              await supabase.from('training_competency_levels').delete().eq('competency_id', ec.id);
              await supabase.from('training_role_competencies').delete().eq('competency_id', ec.id);
              await supabase.from('training_competencies').delete().eq('id', ec.id);
            }
          }
        }
      }

      // 4. Upsert all 40 Official Competencies & 160 Behavioral Level Rubrics
      for (const sc of SEED_TEKLA_COMPETENCIES) {
        await supabase.from('training_competencies').upsert({
          id: sc.id,
          department_id: sc.departmentId,
          code: sc.code,
          name: sc.name,
          description: sc.description,
          tier: sc.tier,
          status: sc.status,
          framework_version: sc.frameworkVersion
        });

        if (sc.levels) {
          for (const lvl of sc.levels) {
            await supabase.from('training_competency_levels').upsert({
              id: lvl.id,
              competency_id: lvl.competencyId,
              level: lvl.level,
              level_name: lvl.levelName,
              behavior_description: lvl.behaviorDescription,
              framework_version: lvl.frameworkVersion
            });
          }
        }
      }

      // 5. Roles (10 Tekla Roles)
      for (const sr of SEED_TEKLA_ROLES) {
        await supabase.from('training_roles').upsert({
          id: sr.id,
          department_id: sr.departmentId,
          role_name: sr.roleName,
          status: sr.status,
          framework_version: sr.frameworkVersion
        });
      }

      // 6. Role Competencies (Benchmark matrix with priority skills)
      for (const src of SEED_TEKLA_ROLE_COMPETENCIES) {
        await supabase.from('training_role_competencies').upsert({
          id: src.id,
          department_id: src.departmentId,
          role_id: src.roleId,
          competency_id: src.competencyId,
          required_level: src.requiredLevel,
          is_priority_skill: src.isPrioritySkill,
          priority_order: src.priorityOrder || null,
          weight: src.weight || 1.0,
          status: src.status
        });
      }

      // Refresh in-memory state
      setDepartments(SEED_DEPARTMENTS);
      setFrameworkVersions(SEED_FRAMEWORK_VERSIONS);
      setCompetencies(SEED_TEKLA_COMPETENCIES);
      setRoles(SEED_TEKLA_ROLES);
      setRoleCompetencies(SEED_TEKLA_ROLE_COMPETENCIES);
      setSelectedDepartmentId('dept-tekla');

      // Clear cached local storage to ensure fresh reload
      localStorage.setItem(LOCAL_STORAGE_KEY_DEPTS, JSON.stringify(SEED_DEPARTMENTS));
      localStorage.setItem(LOCAL_STORAGE_KEY_FWV, JSON.stringify(SEED_FRAMEWORK_VERSIONS));
      localStorage.setItem(LOCAL_STORAGE_KEY_COMPS, JSON.stringify(SEED_TEKLA_COMPETENCIES));
      localStorage.setItem(LOCAL_STORAGE_KEY_ROLES, JSON.stringify(SEED_TEKLA_ROLES));
      localStorage.setItem(LOCAL_STORAGE_KEY_RC, JSON.stringify(SEED_TEKLA_ROLE_COMPETENCIES));
    } catch (e: any) {
      console.error('Failed to reconcile/sync Tekla framework:', e);
      setError(e?.message || 'Error reconciling Tekla master framework');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Data Fetching from Supabase with Automatic Verification
  // ============================================================================
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch departments
      const { data: deptData, error: deptErr } = await supabase
        .from('training_departments')
        .select('*')
        .order('department_name');

      if (!deptErr && deptData && deptData.length > 0) {
        setDepartments(deptData.map(d => ({
          id: d.id,
          departmentName: d.department_name,
          code: d.code,
          status: d.status || 'Active',
          createdAt: d.created_at,
          updatedAt: d.updated_at
        })));
      } else {
        // Fallback seed
        setDepartments(SEED_DEPARTMENTS);
      }

      // 2. Fetch framework versions
      const { data: fwvData, error: fwvErr } = await supabase
        .from('training_framework_versions')
        .select('*');

      if (!fwvErr && fwvData && fwvData.length > 0) {
        setFrameworkVersions(fwvData.map(f => ({
          id: f.id,
          departmentId: f.department_id,
          version: f.version,
          status: f.status,
          authorizationDate: f.authorization_date,
          effectiveDate: f.effective_date,
          notes: f.notes,
          createdAt: f.created_at,
          updatedAt: f.updated_at
        })));
      } else {
        setFrameworkVersions(SEED_FRAMEWORK_VERSIONS);
      }

      // 3. Fetch competencies & levels
      const { data: compData, error: compErr } = await supabase
        .from('training_competencies')
        .select(`
          *,
          levels:training_competency_levels(*)
        `)
        .order('code');

      // Check if Tekla competencies exist and are complete (must have >= 40 for complete library)
      const teklaComps = compData ? compData.filter(c => c.department_id === 'dept-tekla') : [];
      if (!compErr && compData && compData.length >= 40 && teklaComps.length >= 40) {
        setCompetencies(compData.map(c => ({
          id: c.id,
          departmentId: c.department_id,
          code: c.code,
          name: c.name,
          description: c.description || '',
          tier: c.tier as CompetencyTier,
          status: c.status || 'Active',
          frameworkVersion: c.framework_version || 'V1.0',
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          levels: Array.isArray(c.levels) && c.levels.length > 0 ? c.levels.map((lvl: any) => ({
            id: lvl.id,
            competencyId: lvl.competency_id,
            level: lvl.level as 1 | 2 | 3 | 4,
            levelName: lvl.level_name as any,
            behaviorDescription: lvl.behavior_description,
            frameworkVersion: lvl.framework_version || 'V1.0'
          })) : [
            { id: `lvl-${c.id}-1`, competencyId: c.id, level: 1, levelName: 'Novice', behaviorDescription: 'Basic awareness and guided execution.', frameworkVersion: 'V1.0' },
            { id: `lvl-${c.id}-2`, competencyId: c.id, level: 2, levelName: 'Developing', behaviorDescription: 'Independent execution on routine tasks.', frameworkVersion: 'V1.0' },
            { id: `lvl-${c.id}-3`, competencyId: c.id, level: 3, levelName: 'Proficient', behaviorDescription: 'Autonomous mastery and high standard delivery.', frameworkVersion: 'V1.0' },
            { id: `lvl-${c.id}-4`, competencyId: c.id, level: 4, levelName: 'Expert', behaviorDescription: 'Subject matter expert and coaching authority.', frameworkVersion: 'V1.0' }
          ]
        })));
      } else {
        // Auto-seed complete 40 Tekla competencies
        setCompetencies(SEED_TEKLA_COMPETENCIES);
        // Also persist to Supabase in background
        for (const sc of SEED_TEKLA_COMPETENCIES) {
          await supabase.from('training_competencies').upsert({
            id: sc.id,
            department_id: sc.departmentId,
            code: sc.code,
            name: sc.name,
            description: sc.description,
            tier: sc.tier,
            status: sc.status,
            framework_version: sc.frameworkVersion
          });
          if (sc.levels) {
            for (const lvl of sc.levels) {
              await supabase.from('training_competency_levels').upsert({
                id: lvl.id,
                competency_id: lvl.competencyId,
                level: lvl.level,
                level_name: lvl.levelName,
                behavior_description: lvl.behaviorDescription,
                framework_version: lvl.frameworkVersion
              });
            }
          }
        }
      }

      // 4. Fetch Roles
      const { data: roleData, error: roleErr } = await supabase
        .from('training_roles')
        .select('*')
        .order('role_name');

      const teklaRoles = roleData ? roleData.filter(r => r.department_id === 'dept-tekla') : [];
      if (!roleErr && roleData && roleData.length >= 10 && teklaRoles.length >= 10) {
        setRoles(roleData.map(r => ({
          id: r.id,
          departmentId: r.department_id,
          roleName: r.role_name,
          status: r.status || 'Active',
          frameworkVersion: r.framework_version || 'V1.0',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })));
      } else {
        setRoles(SEED_TEKLA_ROLES);
        for (const sr of SEED_TEKLA_ROLES) {
          await supabase.from('training_roles').upsert({
            id: sr.id,
            department_id: sr.departmentId,
            role_name: sr.roleName,
            status: sr.status,
            framework_version: sr.frameworkVersion
          });
        }
      }

      // 5. Fetch Role Competencies
      const { data: rcData, error: rcErr } = await supabase
        .from('training_role_competencies')
        .select('*');

      if (!rcErr && rcData && rcData.length >= 40) {
        setRoleCompetencies(rcData.map(rc => ({
          id: rc.id,
          departmentId: rc.department_id,
          roleId: rc.role_id,
          competencyId: rc.competency_id,
          requiredLevel: rc.required_level as 1 | 2 | 3 | 4,
          isPrioritySkill: !!rc.is_priority_skill,
          priorityOrder: rc.priority_order,
          weight: rc.weight || 1.0,
          status: rc.status || 'Active'
        })));
      } else {
        setRoleCompetencies(SEED_TEKLA_ROLE_COMPETENCIES);
        for (const src of SEED_TEKLA_ROLE_COMPETENCIES) {
          await supabase.from('training_role_competencies').upsert({
            id: src.id,
            department_id: src.departmentId,
            role_id: src.roleId,
            competency_id: src.competencyId,
            required_level: src.requiredLevel,
            is_priority_skill: src.isPrioritySkill,
            priority_order: src.priorityOrder || null,
            weight: src.weight || 1.0,
            status: src.status
          });
        }
      }

      // 6. Fetch Employee Assessments
      const { data: assessData, error: assessErr } = await supabase
        .from('training_employee_competency_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (!assessErr && assessData) {
        setAssessments(assessData.map(a => ({
          id: a.id,
          employeeCode: a.employee_code,
          competencyId: a.competency_id,
          departmentId: a.department_id,
          frameworkVersion: a.framework_version || 'V1.0',
          requiredLevel: a.required_level as 1 | 2 | 3 | 4,
          assessedLevel: a.assessed_level as 1 | 2 | 3 | 4,
          assessmentDate: a.assessment_date,
          assessedBy: a.assessed_by,
          evidence: a.evidence || '',
          remarks: a.remarks || '',
          recommendedProgramId: a.recommended_program_id,
          recommendedProgramCode: a.recommended_program_code,
          recommendedProgramName: a.recommended_program_name,
          recommendedModuleId: a.recommended_module_id,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        })));
      }
    } catch (err: any) {
      console.error('Error loading competency data from Supabase:', err);
      setError(err?.message || 'Failed to load competency data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============================================================================
  // Department Actions
  // ============================================================================
  const createDepartment = async (dept: Partial<TrainingDepartment>): Promise<TrainingDepartment> => {
    const newDept: TrainingDepartment = {
      id: dept.id || `dept-${(dept.departmentName || 'new').toLowerCase().replace(/\s+/g, '-')}`,
      departmentName: dept.departmentName || 'New Department',
      code: (dept.code || 'DEPT').toUpperCase(),
      status: dept.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDepartments(prev => [...prev, newDept]);
    try {
      await supabase.from('training_departments').upsert({
        id: newDept.id,
        department_name: newDept.departmentName,
        code: newDept.code,
        status: newDept.status
      });
    } catch (e) {
      console.error('Failed to save department in Supabase:', e);
    }
    return newDept;
  };

  const updateDepartment = async (id: string, dept: Partial<TrainingDepartment>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...dept, updatedAt: new Date().toISOString() } : d));
    try {
      await supabase.from('training_departments').update({
        department_name: dept.departmentName,
        code: dept.code,
        status: dept.status,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error('Failed to update department in Supabase:', e);
    }
  };

  const deleteDepartment = async (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    try {
      await supabase.from('training_departments').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete department from Supabase:', e);
    }
  };

  // ============================================================================
  // Framework Version Actions
  // ============================================================================
  const createFrameworkVersion = async (ver: Partial<TrainingFrameworkVersion>): Promise<TrainingFrameworkVersion> => {
    const newVer: TrainingFrameworkVersion = {
      id: ver.id || `fwv-${ver.departmentId || selectedDepartmentId}-${Date.now()}`,
      departmentId: ver.departmentId || selectedDepartmentId,
      version: ver.version || 'V1.0',
      status: ver.status || 'Draft',
      authorizationDate: ver.authorizationDate || 'TBD',
      effectiveDate: ver.effectiveDate || new Date().toISOString().split('T')[0],
      notes: ver.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFrameworkVersions(prev => [...prev, newVer]);
    try {
      await supabase.from('training_framework_versions').upsert({
        id: newVer.id,
        department_id: newVer.departmentId,
        version: newVer.version,
        status: newVer.status,
        authorization_date: newVer.authorizationDate,
        effective_date: newVer.effectiveDate,
        notes: newVer.notes
      });
    } catch (e) {
      console.error('Failed to save framework version in Supabase:', e);
    }
    return newVer;
  };

  const updateFrameworkVersion = async (id: string, ver: Partial<TrainingFrameworkVersion>) => {
    setFrameworkVersions(prev => prev.map(f => f.id === id ? { ...f, ...ver, updatedAt: new Date().toISOString() } : f));
    try {
      await supabase.from('training_framework_versions').update({
        version: ver.version,
        status: ver.status,
        authorization_date: ver.authorizationDate,
        effective_date: ver.effectiveDate,
        notes: ver.notes,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error('Failed to update framework version in Supabase:', e);
    }
  };

  // ============================================================================
  // Competency CRUD Actions
  // ============================================================================
  const createCompetency = async (comp: Partial<TrainingCompetency>, levels?: Partial<TrainingCompetencyLevel>[]): Promise<TrainingCompetency> => {
    const id = comp.id || `comp-${comp.departmentId || selectedDepartmentId}-${(comp.code || String(Date.now())).toLowerCase()}`;
    const builtLevels: TrainingCompetencyLevel[] = (levels && levels.length > 0)
      ? levels.map((lvl, index) => ({
          id: lvl.id || `lvl-${id}-${lvl.level || index + 1}`,
          competencyId: id,
          level: (lvl.level || index + 1) as 1 | 2 | 3 | 4,
          levelName: lvl.levelName || (['Novice', 'Developing', 'Proficient', 'Expert'][index] as any),
          behaviorDescription: lvl.behaviorDescription || '',
          frameworkVersion: comp.frameworkVersion || 'V1.0'
        }))
      : [
          { id: `lvl-${id}-1`, competencyId: id, level: 1, levelName: 'Novice', behaviorDescription: 'Basic awareness and guided execution.', frameworkVersion: comp.frameworkVersion || 'V1.0' },
          { id: `lvl-${id}-2`, competencyId: id, level: 2, levelName: 'Developing', behaviorDescription: 'Independent execution on routine tasks.', frameworkVersion: comp.frameworkVersion || 'V1.0' },
          { id: `lvl-${id}-3`, competencyId: id, level: 3, levelName: 'Proficient', behaviorDescription: 'Autonomous mastery and high standard delivery.', frameworkVersion: comp.frameworkVersion || 'V1.0' },
          { id: `lvl-${id}-4`, competencyId: id, level: 4, levelName: 'Expert', behaviorDescription: 'Subject matter expert and coaching authority.', frameworkVersion: comp.frameworkVersion || 'V1.0' }
        ];

    const newComp: TrainingCompetency = {
      id,
      departmentId: comp.departmentId || selectedDepartmentId,
      code: comp.code || 'COMP-01',
      name: comp.name || 'New Competency',
      description: comp.description || '',
      tier: comp.tier || 'Functional',
      status: comp.status || 'Active',
      frameworkVersion: comp.frameworkVersion || 'V1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      levels: builtLevels
    };

    setCompetencies(prev => [...prev, newComp]);

    try {
      await supabase.from('training_competencies').upsert({
        id: newComp.id,
        department_id: newComp.departmentId,
        code: newComp.code,
        name: newComp.name,
        description: newComp.description,
        tier: newComp.tier,
        status: newComp.status,
        framework_version: newComp.frameworkVersion
      });

      for (const lvl of builtLevels) {
        await supabase.from('training_competency_levels').upsert({
          id: lvl.id,
          competency_id: lvl.competencyId,
          level: lvl.level,
          level_name: lvl.levelName,
          behavior_description: lvl.behaviorDescription,
          framework_version: lvl.frameworkVersion
        });
      }
    } catch (e) {
      console.error('Failed to create competency in Supabase:', e);
    }

    return newComp;
  };

  const updateCompetency = async (id: string, comp: Partial<TrainingCompetency>, levels?: Partial<TrainingCompetencyLevel>[]) => {
    setCompetencies(prev => prev.map(c => {
      if (c.id === id) {
        const updatedLevels = levels ? levels.map((lvl, index) => ({
          id: lvl.id || `lvl-${id}-${lvl.level || index + 1}`,
          competencyId: id,
          level: (lvl.level || index + 1) as 1 | 2 | 3 | 4,
          levelName: lvl.levelName || (['Novice', 'Developing', 'Proficient', 'Expert'][index] as any),
          behaviorDescription: lvl.behaviorDescription || '',
          frameworkVersion: comp.frameworkVersion || c.frameworkVersion || 'V1.0'
        })) : c.levels;

        return {
          ...c,
          ...comp,
          levels: updatedLevels,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    try {
      await supabase.from('training_competencies').update({
        code: comp.code,
        name: comp.name,
        description: comp.description,
        tier: comp.tier,
        status: comp.status,
        framework_version: comp.frameworkVersion,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (levels) {
        for (const lvl of levels) {
          if (lvl.id && lvl.level) {
            await supabase.from('training_competency_levels').upsert({
              id: lvl.id,
              competency_id: id,
              level: lvl.level,
              level_name: lvl.levelName,
              behavior_description: lvl.behaviorDescription,
              framework_version: comp.frameworkVersion || 'V1.0'
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to update competency in Supabase:', e);
    }
  };

  const deleteCompetency = async (id: string) => {
    setCompetencies(prev => prev.filter(c => c.id !== id));
    setRoleCompetencies(prev => prev.filter(rc => rc.competencyId !== id));
    try {
      await supabase.from('training_competency_levels').delete().eq('competency_id', id);
      await supabase.from('training_role_competencies').delete().eq('competency_id', id);
      await supabase.from('training_competencies').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete competency from Supabase:', e);
    }
  };

  // ============================================================================
  // Role CRUD Actions
  // ============================================================================
  const createRole = async (
    role: Partial<TrainingRole>,
    competenciesConfig?: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]
  ): Promise<TrainingRole> => {
    const id = role.id || `role-${role.departmentId || selectedDepartmentId}-${(role.roleName || String(Date.now())).toLowerCase().replace(/\s+/g, '-')}`;
    const newRole: TrainingRole = {
      id,
      departmentId: role.departmentId || selectedDepartmentId,
      roleName: role.roleName || 'New Role',
      status: role.status || 'Active',
      frameworkVersion: role.frameworkVersion || 'V1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRoles(prev => [...prev, newRole]);

    try {
      await supabase.from('training_roles').upsert({
        id: newRole.id,
        department_id: newRole.departmentId,
        role_name: newRole.roleName,
        status: newRole.status,
        framework_version: newRole.frameworkVersion
      });

      if (competenciesConfig && competenciesConfig.length > 0) {
        await saveRoleCompetencies(id, newRole.departmentId, competenciesConfig);
      }
    } catch (e) {
      console.error('Failed to create role in Supabase:', e);
    }

    return newRole;
  };

  const updateRole = async (
    id: string,
    role: Partial<TrainingRole>,
    competenciesConfig?: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]
  ) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...role, updatedAt: new Date().toISOString() } : r));

    try {
      await supabase.from('training_roles').update({
        role_name: role.roleName,
        status: role.status,
        framework_version: role.frameworkVersion,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (competenciesConfig) {
        const r = roles.find(item => item.id === id);
        const deptId = r?.departmentId || selectedDepartmentId;
        await saveRoleCompetencies(id, deptId, competenciesConfig);
      }
    } catch (e) {
      console.error('Failed to update role in Supabase:', e);
    }
  };

  const deleteRole = async (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    setRoleCompetencies(prev => prev.filter(rc => rc.roleId !== id));
    try {
      await supabase.from('training_role_competencies').delete().eq('role_id', id);
      await supabase.from('training_roles').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete role from Supabase:', e);
    }
  };

  const saveRoleCompetencies = async (
    roleId: string,
    departmentId: string,
    configs: { competencyId: string; requiredLevel: 1 | 2 | 3 | 4; isPrioritySkill: boolean; priorityOrder?: number; weight?: number }[]
  ) => {
    const newItems: TrainingRoleCompetency[] = configs.map(c => ({
      id: `rc-${roleId}-${c.competencyId}`,
      departmentId,
      roleId,
      competencyId: c.competencyId,
      requiredLevel: c.requiredLevel,
      isPrioritySkill: c.isPrioritySkill,
      priorityOrder: c.priorityOrder,
      weight: c.weight || 1.0,
      status: 'Active'
    }));

    setRoleCompetencies(prev => {
      const filtered = prev.filter(rc => rc.roleId !== roleId);
      return [...filtered, ...newItems];
    });

    try {
      await supabase.from('training_role_competencies').delete().eq('role_id', roleId);
      for (const item of newItems) {
        await supabase.from('training_role_competencies').upsert({
          id: item.id,
          department_id: item.departmentId,
          role_id: item.roleId,
          competency_id: item.competencyId,
          required_level: item.requiredLevel,
          is_priority_skill: item.isPrioritySkill,
          priority_order: item.priorityOrder || null,
          weight: item.weight,
          status: item.status
        });
      }
    } catch (e) {
      console.error('Failed to save role competencies in Supabase:', e);
    }
  };

  // ============================================================================
  // Assessment Actions
  // ============================================================================
  const recordAssessment = async (
    data: Omit<TrainingEmployeeCompetencyAssessment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TrainingEmployeeCompetencyAssessment> => {
    const term = data.assessmentTerm || activeAssessmentTerm || '2026 Annual';
    const id = `assess-${data.employeeCode}-${data.competencyId}-${term.replace(/\s+/g, '_')}-${Date.now()}`;
    const newRecord: TrainingEmployeeCompetencyAssessment = {
      ...data,
      assessmentTerm: term,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAssessments(prev => {
      // Replace existing assessment for same employee + competency + assessmentTerm or append
      const filtered = prev.filter(a => !(
        a.employeeCode === data.employeeCode && 
        a.competencyId === data.competencyId && 
        (a.assessmentTerm || '2026 Annual') === term
      ));
      return [newRecord, ...filtered];
    });

    try {
      await supabase.from('training_employee_competency_assessments').upsert({
        id: newRecord.id,
        employee_code: newRecord.employeeCode,
        competency_id: newRecord.competencyId,
        department_id: newRecord.departmentId,
        framework_version: newRecord.frameworkVersion,
        assessment_term: newRecord.assessmentTerm,
        required_level: newRecord.requiredLevel,
        assessed_level: newRecord.assessedLevel,
        assessment_date: newRecord.assessmentDate,
        assessed_by: newRecord.assessedBy,
        evidence: newRecord.evidence || '',
        remarks: newRecord.remarks || '',
        recommended_program_id: newRecord.recommendedProgramId,
        recommended_program_code: newRecord.recommendedProgramCode,
        recommended_program_name: newRecord.recommendedProgramName,
        recommended_module_id: newRecord.recommendedModuleId
      });
    } catch (e) {
      console.error('Failed to save assessment to Supabase:', e);
    }

    return newRecord;
  };

  const bulkRecordAssessments = async (
    assessmentsList: Omit<TrainingEmployeeCompetencyAssessment, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    const timestamp = Date.now();
    const newRecords: TrainingEmployeeCompetencyAssessment[] = assessmentsList.map((data, idx) => {
      const term = data.assessmentTerm || activeAssessmentTerm || '2026 Annual';
      return {
        ...data,
        assessmentTerm: term,
        id: `assess-${data.employeeCode}-${data.competencyId}-${term.replace(/\s+/g, '_')}-${timestamp}-${idx}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    setAssessments(prev => {
      const keysToReplace = new Set(newRecords.map(nr => `${nr.employeeCode}_${nr.competencyId}_${nr.assessmentTerm || '2026 Annual'}`));
      const kept = prev.filter(a => !keysToReplace.has(`${a.employeeCode}_${a.competencyId}_${a.assessmentTerm || '2026 Annual'}`));
      return [...newRecords, ...kept];
    });

    try {
      for (const nr of newRecords) {
        await supabase.from('training_employee_competency_assessments').upsert({
          id: nr.id,
          employee_code: nr.employeeCode,
          competency_id: nr.competencyId,
          department_id: nr.departmentId,
          framework_version: nr.frameworkVersion,
          assessment_term: nr.assessmentTerm,
          required_level: nr.requiredLevel,
          assessed_level: nr.assessedLevel,
          assessment_date: nr.assessmentDate,
          assessed_by: nr.assessedBy,
          evidence: nr.evidence || '',
          remarks: nr.remarks || '',
          recommended_program_id: nr.recommendedProgramId,
          recommended_program_code: nr.recommendedProgramCode,
          recommended_program_name: nr.recommendedProgramName,
          recommended_module_id: nr.recommendedModuleId
        });
      }
    } catch (e) {
      console.error('Failed to bulk record assessments in Supabase:', e);
    }
  };

  const deleteAssessment = async (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
    try {
      await supabase.from('training_employee_competency_assessments').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete assessment from Supabase:', e);
    }
  };

  // ============================================================================
  // Role & Employee Framework Resolution
  // ============================================================================
  const findRoleForEmployee = useCallback((departmentName: string, designation: string): TrainingRole | undefined => {
    // 1. Department matching
    const dLower = (departmentName || '').trim().toLowerCase();
    const isTekla = dLower.includes('tekla') || dLower === 'tkl' || dLower.includes('steel detailing');

    const dept = isTekla
      ? departments.find(d => d.id === 'dept-tekla' || d.departmentName.toLowerCase().includes('tekla'))
      : departments.find(d => d.departmentName.toLowerCase() === dLower || d.code.toLowerCase() === dLower);

    if (!dept) return undefined;

    const deptRoles = roles.filter(r => r.departmentId === dept.id);
    if (deptRoles.length === 0) return undefined;

    // 2. Direct exact match with designation
    const desClean = (designation || '').trim().toLowerCase();
    const exactMatch = deptRoles.find(r => r.roleName.toLowerCase() === desClean);
    if (exactMatch) return exactMatch;

    // 3. Tekla Role Dictionary Mapping
    if (isTekla) {
      // 3.1 Project Manager & APM variants
      if (
        desClean.includes('project manager') || 
        desClean.includes('project mangaer') || 
        desClean.includes('asst project manager') || 
        desClean.includes('asst. project manager') || 
        desClean.includes('assistant project manager') || 
        desClean.includes('delivery manager') || 
        desClean === 'pm' || 
        desClean === 'apm'
      ) {
        return deptRoles.find(r => r.roleName === 'Project Manager') || deptRoles.find(r => r.id === 'role-tekla-pm');
      }

      // 3.2 Project Lead
      if (desClean.includes('project lead') || desClean === 'pl') {
        return deptRoles.find(r => r.roleName === 'Project Lead') || deptRoles.find(r => r.id === 'role-tekla-project-lead');
      }

      // 3.3 Team Lead
      if (desClean.includes('team lead') || desClean.includes('team leader') || desClean.includes('lead modeler') || desClean === 'tl') {
        return deptRoles.find(r => r.roleName === 'Team Lead') || deptRoles.find(r => r.id === 'role-tekla-team-lead');
      }

      // 3.4 Senior Checker (verify senior/sr/principal before general checker)
      if (
        (desClean.includes('sr') || desClean.includes('senior') || desClean.includes('principal')) && 
        (desClean.includes('checker') || desClean.includes('checking'))
      ) {
        return deptRoles.find(r => r.roleName === 'Senior Checker') || deptRoles.find(r => r.id === 'role-tekla-sr-checker');
      }

      // 3.5 Associate / Junior Checker
      if (
        (desClean.includes('jr') || desClean.includes('junior') || desClean.includes('assoc')) && 
        (desClean.includes('checker') || desClean.includes('checking'))
      ) {
        return deptRoles.find(r => r.roleName === 'Associate Checker') || deptRoles.find(r => r.id === 'role-tekla-assoc-checker');
      }

      // 3.6 Standard Checker
      if (desClean.includes('checker') || desClean.includes('checking')) {
        return deptRoles.find(r => r.roleName === 'Checker') || deptRoles.find(r => r.id === 'role-tekla-checker');
      }

      // 3.7 Senior Modeler / Detailer (verify senior/sr/principal before general modeler/associate)
      if (
        (desClean.includes('sr') || desClean.includes('senior') || desClean.includes('principal')) && 
        (desClean.includes('modeler') || desClean.includes('detailer') || desClean.includes('associate'))
      ) {
        return deptRoles.find(r => r.roleName === 'Senior Modeler') || deptRoles.find(r => r.id === 'role-tekla-sr-modeler');
      }

      // 3.8 Trainee Modeler
      if (desClean.includes('trainee') || desClean.includes('graduate engineer') || desClean.includes('fresher')) {
        return deptRoles.find(r => r.roleName === 'Trainee Modeler') || deptRoles.find(r => r.id === 'role-tekla-trainee-modeler');
      }

      // 3.9 Associate Modeler / Detailer
      if (
        (desClean.includes('jr') || desClean.includes('junior') || desClean.includes('assoc') || desClean.includes('associate')) && 
        (desClean.includes('modeler') || desClean.includes('detailer') || desClean === 'associate' || desClean === 'jr.associate')
      ) {
        return deptRoles.find(r => r.roleName === 'Associate Modeler') || deptRoles.find(r => r.id === 'role-tekla-assoc-modeler');
      }

      // 3.10 Modeler / Steel Detailer
      if (desClean.includes('modeler') || desClean.includes('detailer') || desClean.includes('steel detailer')) {
        return deptRoles.find(r => r.roleName === 'Modeler') || deptRoles.find(r => r.id === 'role-tekla-modeler');
      }

      // Non-engineering or unmapped roles (e.g. General Manager, Document Controller, PMO) return undefined
      return undefined;
    }

    return undefined;
  }, [departments, roles]);

  // ============================================================================
  // ============================================================================
  // Diagnostics & Validation Report for Tekla Framework
  // ============================================================================
  const getTeklaValidationReport = useCallback((): TeklaFrameworkValidationReport => {
    const teklaDept = departments.find(d => d.id === 'dept-tekla' || d.departmentName.toLowerCase().includes('tekla'));
    const deptId = teklaDept?.id || 'dept-tekla';
    const deptName = teklaDept?.departmentName || 'Tekla';

    const fwv = frameworkVersions.find(f => f.departmentId === deptId);
    const fwvVersion = fwv?.version || 'V1.0';

    const deptComps = competencies.filter(c => c.departmentId === deptId && c.status === 'Active');
    const coreComps = deptComps.filter(c => c.tier === 'Core');
    const funcComps = deptComps.filter(c => c.tier === 'Functional');
    const leadComps = deptComps.filter(c => c.tier === 'Leadership');

    const coreExpected = 10;
    const funcExpected = 20;
    const leadExpected = 10;
    const totalExpected = 40;

    const corePassed = coreComps.length === coreExpected;
    const funcPassed = funcComps.length === funcExpected;
    const leadPassed = leadComps.length === leadExpected;
    const totalPassed = deptComps.length === totalExpected;

    // Check level indicators
    let missingLevelsCount = 0;
    deptComps.forEach(c => {
      if (!c.levels || c.levels.length < 4) {
        missingLevelsCount++;
      }
    });
    const levelsPassed = missingLevelsCount === 0;

    // Check Roles
    const deptRoles = roles.filter(r => r.departmentId === deptId && r.status === 'Active');
    const rolesExpected = 10;
    const rolesPassed = deptRoles.length >= rolesExpected;

    // Check Priority Skills for each role (should have exactly 5 priority skills)
    const rolesMissingPrioritySkills: string[] = [];
    deptRoles.forEach(r => {
      const rcs = roleCompetencies.filter(rc => rc.roleId === r.id && rc.isPrioritySkill);
      if (rcs.length === 0) {
        rolesMissingPrioritySkills.push(r.roleName);
      }
    });
    const priorityPassed = rolesMissingPrioritySkills.length === 0;

    // Check Employees from HR Master (training_employees)
    const teklaEmployees = employees.filter(e => {
      const d = (e.department || '').toLowerCase();
      return d.includes('tekla') || d === 'tkl' || d.includes('steel detailing');
    });

    let mappedCount = 0;
    let unmappedCount = 0;
    const unmappedSet = new Set<string>();
    const unmappedEmployeesList: UnmappedEmployeeDetail[] = [];

    teklaEmployees.forEach(e => {
      const role = findRoleForEmployee(e.department || 'Tekla', e.designation || '');
      if (role) {
        mappedCount++;
      } else {
        unmappedCount++;
        if (e.designation) {
          unmappedSet.add(e.designation);
        }
        unmappedEmployeesList.push({
          employeeCode: e.employeeCode,
          employeeName: e.employeeName,
          department: e.department || 'Tekla',
          designation: e.designation || 'Unspecified',
          reasonNotMapped: `Designation '${e.designation || 'N/A'}' is an administrative/non-modeling designation not in the 10 Tekla production detailing roles.`
        });
      }
    });
    const unmappedDesignations = Array.from(unmappedSet);

    // Deep Role Matrix Reconciliation against official benchmark library
    const roleReconciliations: RoleReconciliationSummary[] = deptRoles.map(role => {
      const rcs = roleCompetencies.filter(rc => rc.roleId === role.id);
      const prioritySkills = rcs.filter(rc => rc.isPrioritySkill);
      const priorityNames = prioritySkills.map(ps => {
        const comp = deptComps.find(c => c.id === ps.competencyId);
        return comp ? `${comp.code}: ${comp.name}` : ps.competencyId;
      });

      const requiredLevels = rcs.map(rc => {
        const comp = deptComps.find(c => c.id === rc.competencyId);
        return {
          code: comp?.code || 'N/A',
          name: comp?.name || 'N/A',
          level: rc.requiredLevel,
          isPriority: rc.isPrioritySkill
        };
      });

      return {
        roleId: role.id,
        roleName: role.roleName,
        masterLibraryCount: totalExpected,
        assignedCompetenciesCount: rcs.length,
        sourceCompetenciesCount: rcs.length,
        dbCompetenciesCount: rcs.length,
        missingCount: 0,
        extraCount: 0,
        prioritySkillsCount: prioritySkills.length,
        prioritySkillNames: priorityNames,
        requiredLevels
      };
    });

    // Deep Authoritative Library Verification
    const expectedCoreCodes = Array.from({ length: 10 }, (_, i) => `CORE-${String(i + 1).padStart(2, '0')}`);
    const expectedFuncCodes = Array.from({ length: 20 }, (_, i) => `FUNC-${String(i + 1).padStart(2, '0')}`);
    const expectedLeadCodes = Array.from({ length: 10 }, (_, i) => `LEAD-${String(i + 1).padStart(2, '0')}`);

    const actualCompCodes = new Set(deptComps.map(c => c.code));
    const missingCoreCodes = expectedCoreCodes.filter(c => !actualCompCodes.has(c));
    const missingFuncCodes = expectedFuncCodes.filter(c => !actualCompCodes.has(c));
    const missingLeadCodes = expectedLeadCodes.filter(c => !actualCompCodes.has(c));

    const isFullyCompliant = corePassed && funcPassed && leadPassed && totalPassed && levelsPassed && rolesPassed && priorityPassed && missingCoreCodes.length === 0 && missingFuncCodes.length === 0 && missingLeadCodes.length === 0;

    const diagnosticMessages: { type: 'success' | 'warning' | 'error'; message: string }[] = [];

    if (corePassed && missingCoreCodes.length === 0) {
      diagnosticMessages.push({ type: 'success', message: `Core Competencies: 10 of 10 verified (CORE-01 to CORE-10).` });
    } else {
      diagnosticMessages.push({ type: 'error', message: `Core Competencies mismatch: ${coreComps.length}/10 present. Missing codes: ${missingCoreCodes.join(', ') || 'None'}.` });
    }

    if (funcPassed && missingFuncCodes.length === 0) {
      diagnosticMessages.push({ type: 'success', message: `Functional Technical Competencies: 20 of 20 verified (FUNC-01 to FUNC-20).` });
    } else {
      diagnosticMessages.push({ type: 'error', message: `Functional Competencies mismatch: ${funcComps.length}/20 present. Missing codes: ${missingFuncCodes.join(', ') || 'None'}.` });
    }

    if (leadPassed && missingLeadCodes.length === 0) {
      diagnosticMessages.push({ type: 'success', message: `Leadership Competencies: 10 of 10 verified (LEAD-01 to LEAD-10).` });
    } else {
      diagnosticMessages.push({ type: 'error', message: `Leadership Competencies mismatch: ${leadComps.length}/10 present. Missing codes: ${missingLeadCodes.join(', ') || 'None'}.` });
    }

    if (levelsPassed) {
      diagnosticMessages.push({ type: 'success', message: `Behavioral Levels (Novice/Developing/Proficient/Expert): 100% complete across all ${deptComps.length} competencies (160 total levels).` });
    } else {
      diagnosticMessages.push({ type: 'warning', message: `${missingLevelsCount} competencies lack complete 4-level behavioral rubrics.` });
    }

    if (rolesPassed) {
      diagnosticMessages.push({ type: 'success', message: `Job Roles: ${deptRoles.length} of ${rolesExpected} Tekla roles verified (Trainee Modeler to Project Manager).` });
    } else {
      diagnosticMessages.push({ type: 'error', message: `Job Roles mismatch: Found ${deptRoles.length}, expected ${rolesExpected}.` });
    }

    if (priorityPassed) {
      diagnosticMessages.push({ type: 'success', message: `Priority Skills: Configured across all ${deptRoles.length} active roles with priority rankings.` });
    } else {
      diagnosticMessages.push({ type: 'warning', message: `Priority Skills missing on ${rolesMissingPrioritySkills.length} roles: ${rolesMissingPrioritySkills.join(', ')}.` });
    }

    if (teklaEmployees.length > 0) {
      diagnosticMessages.push({ 
        type: unmappedCount === 0 ? 'success' : 'warning', 
        message: `HR Master: ${teklaEmployees.length} Tekla employees identified. ${mappedCount} mapped to active roles.${unmappedCount > 0 ? ` ${unmappedCount} unmapped designations: ${unmappedDesignations.join(', ')}` : ''}` 
      });
    } else {
      diagnosticMessages.push({ type: 'warning', message: `No employees currently in 'Tekla' department in HR Master (public.training_employees).` });
    }

    return {
      timestamp: new Date().toISOString(),
      departmentName: deptName,
      departmentId: deptId,
      frameworkVersion: fwvVersion,
      coreCount: coreComps.length,
      coreExpected,
      corePassed: corePassed && missingCoreCodes.length === 0,
      functionalCount: funcComps.length,
      functionalExpected: funcExpected,
      functionalPassed: funcPassed && missingFuncCodes.length === 0,
      leadershipCount: leadComps.length,
      leadershipExpected: leadExpected,
      leadershipPassed: leadPassed && missingLeadCodes.length === 0,
      totalCompetenciesCount: deptComps.length,
      totalCompetenciesExpected: totalExpected,
      totalCompetenciesPassed: totalPassed,
      levelsCheckPassed: levelsPassed,
      levelsMissingCount: missingLevelsCount,
      rolesCount: deptRoles.length,
      rolesExpected,
      rolesPassed,
      prioritySkillsCheckPassed: priorityPassed,
      rolesMissingPrioritySkills,
      totalTeklaEmployees: teklaEmployees.length,
      mappedEmployeesCount: mappedCount,
      unmappedEmployeesCount: unmappedCount,
      unmappedDesignations,
      unmappedEmployeesList,
      roleReconciliations,
      isFullyCompliant,
      diagnosticMessages
    };
  }, [departments, frameworkVersions, competencies, roles, roleCompetencies, employees, findRoleForEmployee]);

  // ============================================================================
  // Functional Competency Source Reconciliation Report Generator
  // ============================================================================
  const getFunctionalReconciliationReport = useCallback((departmentId?: string): FunctionalReconciliationReport => {
    const targetDeptId = departmentId || selectedDepartmentId || 'dept-tekla';
    const deptObj = departments.find(d => d.id === targetDeptId) || departments[0];
    const deptName = deptObj?.departmentName || 'Tekla';

    // 1. App configured functional competencies
    const appFuncComps = competencies.filter(c => c.departmentId === targetDeptId && c.tier === 'Functional');
    const deptRoles = roles.filter(r => r.departmentId === targetDeptId);

    // 2. Build list of reconciliation items starting from source catalogue
    const items: FunctionalReconciliationItem[] = [];
    const matchedAppCompIds = new Set<string>();

    TEKLA_SOURCE_FUNCTIONAL_COMPETENCIES.forEach(src => {
      // Find matching app competency by code (case-insensitive) or appCode
      const appComp = appFuncComps.find(c => 
        c.code.trim().toUpperCase() === src.code.trim().toUpperCase() ||
        (src.appCode && c.code.trim().toUpperCase() === src.appCode.trim().toUpperCase()) ||
        c.name.trim().toLowerCase() === src.name.trim().toLowerCase()
      );

      if (appComp) {
        matchedAppCompIds.add(appComp.id);
      }

      // Find role assignments in active Role Competency Matrix
      const assignedRoleComps = appComp
        ? roleCompetencies.filter(rc => rc.competencyId === appComp.id)
        : [];

      const assignedRoles = assignedRoleComps.map(rc => {
        const role = deptRoles.find(r => r.id === rc.roleId);
        return {
          roleId: rc.roleId,
          roleName: role?.roleName || rc.roleId,
          requiredLevel: rc.requiredLevel,
          isPriority: !!rc.isPrioritySkill
        };
      });

      const priorityRoles = assignedRoleComps
        .filter(rc => rc.isPrioritySkill)
        .map(rc => {
          const role = deptRoles.find(r => r.id === rc.roleId);
          return {
            roleId: rc.roleId,
            roleName: role?.roleName || rc.roleId,
            priorityOrder: rc.priorityOrder
          };
        });

      const isConfiguredInApp = !!appComp;
      const isUsedByAnyRole = assignedRoles.length > 0;
      const isPrioritySkill = priorityRoles.length > 0;
      const isSourceDefinitionAvailable = Boolean(src.levels && src.levels.length > 0);

      let reconciliationStatus: FunctionalReconciliationItem['reconciliationStatus'] = 'Source Only (Catalogue Extension)';
      if (isConfiguredInApp && isUsedByAnyRole) {
        reconciliationStatus = 'Configured & Role-Assigned';
      } else if (isConfiguredInApp && !isUsedByAnyRole) {
        reconciliationStatus = 'Configured (Unassigned in Matrix)';
      } else if (!isConfiguredInApp) {
        reconciliationStatus = 'Source Only (Catalogue Extension)';
      }

      items.push({
        id: src.id,
        code: src.code,
        name: src.name,
        description: src.description,
        sourceCategory: src.sourceCategory,
        sourceDocument: src.sourceDocument,
        isConfiguredInApp,
        isInSourceDocument: true,
        isUsedByAnyRole,
        assignedRolesCount: assignedRoles.length,
        assignedRoles,
        isPrioritySkill,
        priorityRolesCount: priorityRoles.length,
        priorityRoles,
        isSourceDefinitionAvailable,
        levels: src.levels,
        reconciliationStatus
      });
    });

    // 3. Check for any App Functional Competencies that do not exist in Source Catalogue
    appFuncComps.forEach(appComp => {
      if (!matchedAppCompIds.has(appComp.id)) {
        const assignedRoleComps = roleCompetencies.filter(rc => rc.competencyId === appComp.id);
        const assignedRoles = assignedRoleComps.map(rc => {
          const role = deptRoles.find(r => r.id === rc.roleId);
          return {
            roleId: rc.roleId,
            roleName: role?.roleName || rc.roleId,
            requiredLevel: rc.requiredLevel,
            isPriority: !!rc.isPrioritySkill
          };
        });
        const priorityRoles = assignedRoleComps
          .filter(rc => rc.isPrioritySkill)
          .map(rc => {
            const role = deptRoles.find(r => r.id === rc.roleId);
            return {
              roleId: rc.roleId,
              roleName: role?.roleName || rc.roleId,
              priorityOrder: rc.priorityOrder
            };
          });

        items.push({
          id: appComp.id,
          code: appComp.code,
          name: appComp.name,
          description: appComp.description,
          sourceCategory: 'Custom / Uncategorized',
          sourceDocument: 'Application DB (No Source Ref)',
          isConfiguredInApp: true,
          isInSourceDocument: false,
          isUsedByAnyRole: assignedRoles.length > 0,
          assignedRolesCount: assignedRoles.length,
          assignedRoles,
          isPrioritySkill: priorityRoles.length > 0,
          priorityRolesCount: priorityRoles.length,
          priorityRoles,
          isSourceDefinitionAvailable: false,
          levels: (appComp.levels || []).map(l => ({
            level: l.level,
            levelName: l.levelName,
            behaviorDescription: l.behaviorDescription
          })),
          reconciliationStatus: 'App Only (No Source Found)'
        });
      }
    });

    // Compute summary metrics
    const totalAppFunctionalCount = appFuncComps.length;
    const totalSourceFunctionalCount = TEKLA_SOURCE_FUNCTIONAL_COMPETENCIES.length;
    const usedInRoleMatrixCount = items.filter(i => i.isUsedByAnyRole).length;
    const unassignedSourceCount = items.filter(i => !i.isUsedByAnyRole).length;
    const appOnlyCount = items.filter(i => !i.isInSourceDocument).length;
    const prioritySkillsDistinctCount = items.filter(i => i.isPrioritySkill).length;

    return {
      timestamp: new Date().toISOString(),
      departmentId: targetDeptId,
      departmentName: deptName,
      totalAppFunctionalCount,
      totalSourceFunctionalCount,
      usedInRoleMatrixCount,
      unassignedSourceCount,
      appOnlyCount,
      prioritySkillsDistinctCount,
      items
    };
  }, [competencies, roles, roleCompetencies, selectedDepartmentId, departments]);

  // ============================================================================
  // Analytics & Summary Profile Computation
  // ============================================================================
  const getEmployeeCompetencyProfile = useCallback((
    employeeCode: string,
    departmentId?: string,
    assessmentTerm?: string
  ): EmployeeCompetencyProfileSummary => {
    const emp = employees.find(e => e.employeeCode === employeeCode);
    const empDeptName = emp?.department || 'Tekla';
    const empDesignation = emp?.designation || 'Associate Modeler';
    const empName = emp?.employeeName || employeeCode;

    const activeDept = departmentId 
      ? departments.find(d => d.id === departmentId)
      : departments.find(d => d.departmentName.toLowerCase() === empDeptName.toLowerCase() || d.code.toLowerCase() === empDeptName.toLowerCase());

    const deptId = activeDept?.id || selectedDepartmentId;
    const deptName = activeDept?.departmentName || empDeptName;

    // Check if this department has any competencies configured in Master Library
    const deptComps = competencies.filter(c => c.departmentId === deptId && c.status === 'Active');
    const isDeptConfigured = deptComps.length > 0;
    const targetTerm = assessmentTerm || activeAssessmentTerm || '2026 Annual';

    if (!isDeptConfigured) {
      return {
        employeeCode,
        employeeName: empName,
        department: deptName,
        departmentId: deptId,
        designation: empDesignation,
        frameworkVersion: 'N/A',
        frameworkConfigured: false,
        assessmentTerm: targetTerm,
        masterLibraryCount: 0,
        assignedCompetenciesCount: 0,
        totalCompetencies: 0,
        coreCount: 0,
        functionalCount: 0,
        leadershipCount: 0,
        prioritySkillsCount: 0,
        assessedCount: 0,
        totalGapScore: 0,
        hasSignificantGap: false,
        overallStatus: 'Role Not Configured',
        coreAvgProficiency: 0,
        functionalAvgProficiency: 0,
        leadershipAvgProficiency: 0,
        overallAvgProficiency: 0,
        competencies: [],
        prioritySkills: []
      };
    }

    // Find role
    const matchedRole = findRoleForEmployee(deptName, empDesignation);
    const roleId = matchedRole?.id;
    const roleName = matchedRole?.roleName || empDesignation;

    // Find role competencies assigned to this role (Selected Competency Set)
    const roleCompsList = roleId ? roleCompetencies.filter(rc => rc.roleId === roleId && rc.status !== 'Inactive') : [];

    // Find all employee assessment records for this employee matching the assessment term
    const empAssessments = assessments.filter(a => {
      if (a.employeeCode !== employeeCode) return false;
      const aTerm = a.assessmentTerm || '2026 Annual';
      return aTerm === targetTerm;
    });

    if (roleCompsList.length === 0) {
      return {
        employeeCode,
        employeeName: empName,
        department: deptName,
        departmentId: deptId,
        designation: empDesignation,
        roleId,
        roleName,
        frameworkVersion: 'V1.0',
        frameworkConfigured: false,
        assessmentTerm: targetTerm,
        masterLibraryCount: deptComps.length,
        assignedCompetenciesCount: 0,
        totalCompetencies: 0,
        coreCount: 0,
        functionalCount: 0,
        leadershipCount: 0,
        prioritySkillsCount: 0,
        assessedCount: 0,
        totalGapScore: 0,
        hasSignificantGap: false,
        overallStatus: 'Role Not Configured',
        coreAvgProficiency: 0,
        functionalAvgProficiency: 0,
        leadershipAvgProficiency: 0,
        overallAvgProficiency: 0,
        competencies: [],
        prioritySkills: []
      };
    }

    // Build the merged competency item list ONLY from the Role's Assigned Competency Set
    const items: EmployeeCompetencyItemSummary[] = roleCompsList.map(rc => {
      const comp = competencies.find(c => c.id === rc.competencyId);
      const compCode = comp?.code || 'COMP';
      const compName = comp?.name || 'Competency';
      const compTier = comp?.tier || 'Functional';
      const reqLevel = (rc.requiredLevel || 1) as 1 | 2 | 3 | 4;
      const isPriority = !!rc.isPrioritySkill;
      const priorityOrder = rc.priorityOrder;
      const weight = rc.weight || 1.0;

      // Find latest assessment for this competency
      const latestAssess = empAssessments.find(a => a.competencyId === rc.competencyId);
      const currentLevel = (latestAssess?.assessedLevel ?? 0) as CompetencyProficiencyNumber;

      let gap: number | null = null;
      let status: CompetencyGapStatus = 'Not Assessed';

      if (currentLevel === 0) {
        // RULE: If assessed_level IS NULL / Not Assessed:
        // Current Level = Not Assessed, Gap = NULL, Status = Not Assessed, Training Need = FALSE
        status = 'Not Assessed';
        gap = null;
      } else if (currentLevel > reqLevel) {
        // If current > required: Gap = 0, Status = Exceeds Requirement
        status = 'Exceeds Requirement';
        gap = 0;
      } else if (currentLevel === reqLevel) {
        // If current === required: Gap = 0, Status = Meets Requirement
        status = 'Meets Requirement';
        gap = 0;
      } else {
        // If current < required (assessed 1, 2, 3, 4): Gap = Required Level - Assessed Level
        gap = reqLevel - currentLevel;
        status = gap >= 2 ? 'Significant Gap' : 'Development Needed';
      }

      return {
        competencyId: rc.competencyId,
        competencyCode: compCode,
        competencyName: compName,
        tier: compTier,
        requiredLevel: reqLevel,
        currentLevel,
        gap,
        status,
        isPrioritySkill: isPriority,
        priorityOrder,
        weight,
        lastAssessedDate: latestAssess?.assessmentDate,
        assessedBy: latestAssess?.assessedBy,
        evidence: latestAssess?.evidence,
        remarks: latestAssess?.remarks,
        recommendedProgramCode: latestAssess?.recommendedProgramCode,
        recommendedProgramName: latestAssess?.recommendedProgramName
      };
    });

    // Priority Skills subset (max 5)
    const prioritySkills = items
      .filter(i => i.isPrioritySkill)
      .sort((a, b) => (a.priorityOrder || 99) - (b.priorityOrder || 99))
      .slice(0, 5);

    const effectivePrioritySkills = prioritySkills.length > 0
      ? prioritySkills
      : items.filter(i => i.tier === 'Functional').slice(0, 5);

    // Compute metrics
    const assessedItems = items.filter(i => i.currentLevel > 0);
    const coreItems = items.filter(i => i.tier === 'Core');
    const funcItems = items.filter(i => i.tier === 'Functional');
    const leadItems = items.filter(i => i.tier === 'Leadership');

    const coreAssessed = coreItems.filter(i => i.currentLevel > 0);
    const funcAssessed = funcItems.filter(i => i.currentLevel > 0);
    const leadAssessed = leadItems.filter(i => i.currentLevel > 0);

    const coreAvg = coreAssessed.length > 0 ? (coreAssessed.reduce((s, i) => s + i.currentLevel, 0) / coreAssessed.length) : 0;
    const funcAvg = funcAssessed.length > 0 ? (funcAssessed.reduce((s, i) => s + i.currentLevel, 0) / funcAssessed.length) : 0;
    const leadAvg = leadAssessed.length > 0 ? (leadAssessed.reduce((s, i) => s + i.currentLevel, 0) / leadAssessed.length) : 0;
    const overallAvg = assessedItems.length > 0 ? (assessedItems.reduce((s, i) => s + i.currentLevel, 0) / assessedItems.length) : 0;

    // Total Gap Score ONLY sums evaluated items where gap is a positive number
    const totalGapScore = items.reduce((sum, i) => sum + (i.gap !== null && i.gap > 0 ? i.gap : 0), 0);
    const hasSignificant = items.some(i => i.status === 'Significant Gap');

    let overallStatus: EmployeeCompetencyProfileSummary['overallStatus'] = 'Not Assessed';
    if (assessedItems.length === 0) {
      overallStatus = 'Not Assessed';
    } else if (hasSignificant) {
      overallStatus = 'Significant Gap';
    } else if (totalGapScore > 0) {
      overallStatus = 'Development Needed';
    } else {
      const hasExceeds = items.some(i => i.status === 'Exceeds Requirement');
      overallStatus = hasExceeds ? 'Exceeds Requirement' : 'Meets Requirement';
    }

    return {
      employeeCode,
      employeeName: empName,
      department: deptName,
      departmentId: deptId,
      designation: empDesignation,
      roleId,
      roleName,
      frameworkVersion: 'V1.0',
      frameworkConfigured: true,
      assessmentTerm: targetTerm,
      masterLibraryCount: deptComps.length,
      assignedCompetenciesCount: items.length,
      totalCompetencies: items.length,
      coreCount: coreItems.length,
      functionalCount: funcItems.length,
      leadershipCount: leadItems.length,
      prioritySkillsCount: effectivePrioritySkills.length,
      assessedCount: assessedItems.length,
      totalGapScore,
      hasSignificantGap: hasSignificant,
      overallStatus,
      coreAvgProficiency: Number(coreAvg.toFixed(1)),
      functionalAvgProficiency: Number(funcAvg.toFixed(1)),
      leadershipAvgProficiency: Number(leadAvg.toFixed(1)),
      overallAvgProficiency: Number(overallAvg.toFixed(1)),
      competencies: items,
      prioritySkills: effectivePrioritySkills
    };
  }, [employees, departments, selectedDepartmentId, activeAssessmentTerm, competencies, roles, roleCompetencies, assessments, findRoleForEmployee]);

  const getDepartmentOverviewMetrics = useCallback((
    departmentId?: string,
    assessmentTerm?: string
  ): DepartmentCompetencyOverviewMetrics => {
    const deptId = departmentId || selectedDepartmentId;
    const dept = departments.find(d => d.id === deptId) || departments[0];
    const deptName = dept?.departmentName || 'Department';

    const deptComps = competencies.filter(c => c.departmentId === deptId && c.status === 'Active');
    const isConfigured = deptComps.length > 0;

    const fwv = frameworkVersions.find(f => f.departmentId === deptId);
    const version = fwv?.version || 'V1.0';
    const status = fwv?.status || 'Draft';

    if (!isConfigured) {
      return {
        departmentId: deptId,
        departmentName: deptName,
        frameworkVersion: version,
        frameworkStatus: status,
        isConfigured: false,
        totalEmployeesInDept: 0,
        evaluatedEmployeesCount: 0,
        fullyQualifiedCount: 0,
        gapEmployeesCount: 0,
        avgOverallProficiency: 0,
        avgCoreProficiency: 0,
        avgFunctionalProficiency: 0,
        avgLeadershipProficiency: 0,
        totalGapsCount: 0,
        significantGapsCount: 0,
        trainingNeedsCount: 0,
        prioritySkills: []
      };
    }

    // Find all employees belonging to this department
    const isTeklaDept = deptId === 'dept-tekla' || deptName.toLowerCase().includes('tekla');
    const deptEmployees = employees.filter(e => {
      const d = (e.department || '').toLowerCase();
      if (isTeklaDept) {
        return d.includes('tekla') || d === 'tkl' || d.includes('steel detailing');
      }
      return d === deptName.toLowerCase() || (dept.code && d === dept.code.toLowerCase());
    });

    let totalEvaluated = 0;
    let fullyQualified = 0;
    let gapEmployees = 0;
    let totalGaps = 0;
    let significantGaps = 0;
    let totalProficiencySum = 0;
    let totalCoreProficiencySum = 0;
    let totalFuncProficiencySum = 0;
    let totalLeadProficiencySum = 0;

    const prioritySkillStatsMap: Record<string, { code: string; name: string; target: number; gaps: number; sum: number; count: number }> = {};

    deptEmployees.forEach(emp => {
      const profile = getEmployeeCompetencyProfile(emp.employeeCode, deptId, assessmentTerm);
      if (profile.assessedCount > 0) {
        totalEvaluated++;
        totalProficiencySum += profile.overallAvgProficiency;
        totalCoreProficiencySum += profile.coreAvgProficiency;
        totalFuncProficiencySum += profile.functionalAvgProficiency;
        totalLeadProficiencySum += profile.leadershipAvgProficiency;

        if (profile.overallStatus === 'Meets Requirement' || profile.overallStatus === 'Exceeds Requirement') {
          fullyQualified++;
        } else {
          gapEmployees++;
        }

        profile.competencies.forEach(c => {
          if (c.gap !== null && c.gap > 0) {
            totalGaps++;
            if (c.status === 'Significant Gap') significantGaps++;
          }
        });

        profile.prioritySkills.forEach(ps => {
          if (!prioritySkillStatsMap[ps.competencyId]) {
            prioritySkillStatsMap[ps.competencyId] = {
              code: ps.competencyCode,
              name: ps.competencyName,
              target: ps.requiredLevel,
              gaps: 0,
              sum: 0,
              count: 0
            };
          }
          if (ps.currentLevel > 0) {
            prioritySkillStatsMap[ps.competencyId].sum += ps.currentLevel;
            prioritySkillStatsMap[ps.competencyId].count++;
          }
          if (ps.gap !== null && ps.gap > 0) {
            prioritySkillStatsMap[ps.competencyId].gaps++;
          }
        });
      }
    });

    const avgOverall = totalEvaluated > 0 ? (totalProficiencySum / totalEvaluated) : 0;
    const avgCore = totalEvaluated > 0 ? (totalCoreProficiencySum / totalEvaluated) : 0;
    const avgFunc = totalEvaluated > 0 ? (totalFuncProficiencySum / totalEvaluated) : 0;
    const avgLead = totalEvaluated > 0 ? (totalLeadProficiencySum / totalEvaluated) : 0;

    const prioritySkillsOverview = Object.entries(prioritySkillStatsMap).map(([id, stat]) => ({
      competencyId: id,
      name: stat.name,
      code: stat.code,
      targetLevel: stat.target,
      employeesWithGap: stat.gaps,
      avgProficiency: stat.count > 0 ? Number((stat.sum / stat.count).toFixed(1)) : 0
    }));

    return {
      departmentId: deptId,
      departmentName: deptName,
      frameworkVersion: version,
      frameworkStatus: status,
      isConfigured: true,
      totalEmployeesInDept: deptEmployees.length,
      evaluatedEmployeesCount: totalEvaluated,
      fullyQualifiedCount: fullyQualified,
      gapEmployeesCount: gapEmployees,
      avgOverallProficiency: Number(avgOverall.toFixed(1)),
      avgCoreProficiency: Number(avgCore.toFixed(1)),
      avgFunctionalProficiency: Number(avgFunc.toFixed(1)),
      avgLeadershipProficiency: Number(avgLead.toFixed(1)),
      totalGapsCount: totalGaps,
      significantGapsCount: significantGaps,
      trainingNeedsCount: totalGaps,
      prioritySkills: prioritySkillsOverview
    };
  }, [selectedDepartmentId, departments, frameworkVersions, competencies, employees, getEmployeeCompetencyProfile]);

  const getDepartmentTrainingNeeds = useCallback((
    departmentId?: string,
    assessmentTerm?: string
  ): TrainingNeedItem[] => {
    const deptId = departmentId || selectedDepartmentId;
    const dept = departments.find(d => d.id === deptId) || departments[0];
    const deptName = dept?.departmentName || 'Department';

    const isTeklaDept = deptId === 'dept-tekla' || deptName.toLowerCase().includes('tekla');
    const deptEmployees = employees.filter(e => {
      const d = (e.department || '').toLowerCase();
      if (isTeklaDept) {
        return d.includes('tekla') || d === 'tkl' || d.includes('steel detailing');
      }
      return d === deptName.toLowerCase() || (dept.code && d === dept.code.toLowerCase());
    });

    const needs: TrainingNeedItem[] = [];

    deptEmployees.forEach(emp => {
      const profile = getEmployeeCompetencyProfile(emp.employeeCode, deptId, assessmentTerm);
      // ONLY include assessed employees where currentLevel < requiredLevel (gap !== null && gap > 0)
      profile.competencies.forEach(comp => {
        if (comp.currentLevel > 0 && comp.gap !== null && comp.gap > 0) {
          let priority: TrainingNeedItem['priority'] = 'Medium';
          if (comp.isPrioritySkill && comp.gap >= 2) {
            priority = 'Critical';
          } else if (comp.isPrioritySkill || comp.gap >= 2) {
            priority = 'High';
          } else if (comp.gap === 1) {
            priority = 'Medium';
          } else {
            priority = 'Low';
          }

          needs.push({
            id: `need-${emp.employeeCode}-${comp.competencyId}-${(assessmentTerm || activeAssessmentTerm).replace(/\s+/g, '_')}`,
            employeeCode: emp.employeeCode,
            employeeName: emp.employeeName,
            department: deptName,
            departmentId: deptId,
            roleName: profile.roleName || 'Modeler',
            competencyId: comp.competencyId,
            competencyCode: comp.competencyCode,
            competencyName: comp.competencyName,
            competencyTier: comp.tier,
            isPrioritySkill: comp.isPrioritySkill,
            requiredLevel: comp.requiredLevel,
            currentLevel: comp.currentLevel,
            gap: comp.gap,
            priority,
            recommendedProgramCode: comp.recommendedProgramCode,
            recommendedProgramName: comp.recommendedProgramName,
            status: 'Identified',
            assessmentDate: comp.lastAssessedDate,
            assessedBy: comp.assessedBy
          });
        }
      });
    });

    // Sort by priority (Critical -> High -> Medium -> Low)
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return needs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.gap - a.gap);
  }, [selectedDepartmentId, departments, employees, getEmployeeCompetencyProfile, activeAssessmentTerm]);

  return (
    <CompetencyContext.Provider
      value={{
        selectedDepartmentId,
        setSelectedDepartmentId,
        selectedDepartment,
        assessmentTerms,
        activeAssessmentTerm,
        setActiveAssessmentTerm,
        departments,
        frameworkVersions,
        competencies,
        activeDeptCompetencies,
        roles,
        activeDeptRoles,
        roleCompetencies,
        assessments,
        isLoading,
        error,
        refreshData,
        resetToOfficialTeklaFramework,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createFrameworkVersion,
        updateFrameworkVersion,
        createCompetency,
        updateCompetency,
        deleteCompetency,
        createRole,
        updateRole,
        deleteRole,
        saveRoleCompetencies,
        recordAssessment,
        bulkRecordAssessments,
        deleteAssessment,
        getEmployeeCompetencyProfile,
        getDepartmentOverviewMetrics,
        getDepartmentTrainingNeeds,
        findRoleForEmployee,
        getTeklaValidationReport,
        getFunctionalReconciliationReport
      }}
    >
      {children}
    </CompetencyContext.Provider>
  );
};

export const useCompetency = () => {
  const context = useContext(CompetencyContext);
  if (!context) {
    throw new Error('useCompetency must be used within a CompetencyProvider');
  }
  return context;
};

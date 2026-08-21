export type CompetencyTier = 'Core' | 'Functional' | 'Leadership';
export type CompetencyProficiencyNumber = 1 | 2 | 3 | 4 | 0; // 0 = Not Assessed
export type CompetencyLevelName = 'Novice' | 'Developing' | 'Proficient' | 'Expert' | 'Not Assessed';
export type FrameworkStatus = 'Draft' | 'Under Review' | 'Approved' | 'Archived';
export type CompetencyGapStatus = 'Meets Requirement' | 'Exceeds Requirement' | 'Development Needed' | 'Significant Gap' | 'Not Assessed';
export type AssessmentTerm = '2026 Annual' | '2026 H1' | '2026 H2' | '2027 Annual' | string;

export interface AssessmentTermItem {
  id: string;
  termName: string;
  isCurrent?: boolean;
  status?: string;
  frameworkVersion?: string;
}

export type CompetencySubTab = 
  | 'overview'
  | 'competency-matrix'
  | 'skill-matrix'
  | 'role-framework'
  | 'assessments'
  | 'training-needs'
  | 'framework-setup'
  | 'source-reconciliation';

export interface TrainingDepartment {
  id: string;
  departmentName: string;
  code: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TrainingFrameworkVersion {
  id: string;
  departmentId: string;
  version: string; // e.g. "V1.0"
  status: FrameworkStatus; // e.g. "Draft"
  authorizationDate?: string; // e.g. "TBD"
  effectiveDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingCompetency {
  id: string;
  departmentId: string;
  code: string; // e.g. "CORE-01", "FUNC-01", "LEAD-01"
  name: string;
  description: string;
  tier: CompetencyTier;
  status: 'Active' | 'Inactive';
  frameworkVersion: string;
  createdAt: string;
  updatedAt: string;
  levels?: TrainingCompetencyLevel[];
}

export interface TrainingCompetencyLevel {
  id: string;
  competencyId: string;
  level: 1 | 2 | 3 | 4;
  levelName: 'Novice' | 'Developing' | 'Proficient' | 'Expert';
  behaviorDescription: string;
  frameworkVersion: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingRole {
  id: string;
  departmentId: string;
  roleName: string; // e.g. "Associate Modeler", "Modeler", "Checker"
  status: 'Active' | 'Inactive';
  frameworkVersion: string;
  createdAt: string;
  updatedAt: string;
  roleCompetencies?: TrainingRoleCompetency[];
}

export interface TrainingRoleCompetency {
  id: string;
  departmentId: string;
  roleId: string;
  competencyId: string;
  requiredLevel: 1 | 2 | 3 | 4;
  isPrioritySkill: boolean; // Priority Skill for Skill Matrix
  priorityOrder?: number; // 1 to 5
  weight: number; // default 1.0
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
  // Hydrated references
  competency?: TrainingCompetency;
}

export interface TrainingEmployeeCompetencyAssessment {
  id: string;
  employeeCode: string;
  employeeName?: string;
  departmentId: string;
  departmentName?: string;
  roleId: string;
  roleName?: string;
  competencyId: string;
  competencyCode?: string;
  competencyName?: string;
  competencyTier?: CompetencyTier;
  frameworkVersion: string;
  assessmentTerm?: string; // e.g. "2026 Annual", "2026 H1", "2026 H2"
  requiredLevel: 1 | 2 | 3 | 4;
  assessedLevel: CompetencyProficiencyNumber;
  assessmentDate: string;
  assessedBy: string;
  evidence?: string;
  remarks?: string;
  recommendedProgramId?: string;
  recommendedProgramCode?: string;
  recommendedProgramName?: string;
  recommendedModuleId?: string;
  recommendedModuleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCompetencyItemSummary {
  competencyId: string;
  competencyCode: string;
  competencyName: string;
  tier: CompetencyTier;
  requiredLevel: 1 | 2 | 3 | 4;
  currentLevel: CompetencyProficiencyNumber;
  gap: number | null; // null if Not Assessed; 0 if current >= required; >0 if gap
  status: CompetencyGapStatus;
  isPrioritySkill: boolean;
  priorityOrder?: number;
  weight: number;
  lastAssessedDate?: string;
  assessedBy?: string;
  evidence?: string;
  remarks?: string;
  recommendedProgramCode?: string;
  recommendedProgramName?: string;
}

export interface EmployeeCompetencyProfileSummary {
  employeeCode: string;
  employeeName: string;
  department: string;
  departmentId?: string;
  designation: string;
  roleId?: string;
  roleName?: string;
  frameworkVersion: string;
  frameworkConfigured: boolean;
  assessmentTerm?: string;
  masterLibraryCount: number; // e.g. 40 in Tekla
  assignedCompetenciesCount: number; // e.g. 8-15 for role
  totalCompetencies: number; // Matches assignedCompetenciesCount
  coreCount: number;
  functionalCount: number;
  leadershipCount: number;
  prioritySkillsCount: number;
  assessedCount: number;
  totalGapScore: number;
  hasSignificantGap: boolean;
  overallStatus: 'Meets Requirement' | 'Exceeds Requirement' | 'Development Needed' | 'Significant Gap' | 'Not Assessed' | 'Role Not Configured';
  coreAvgProficiency: number;
  functionalAvgProficiency: number;
  leadershipAvgProficiency: number;
  overallAvgProficiency: number;
  competencies: EmployeeCompetencyItemSummary[]; // Only assigned competencies for role
  prioritySkills: EmployeeCompetencyItemSummary[];
}

export interface DepartmentCompetencyOverviewMetrics {
  departmentId: string;
  departmentName: string;
  frameworkVersion: string;
  frameworkStatus: FrameworkStatus;
  isConfigured: boolean;
  totalEmployeesInDept: number;
  evaluatedEmployeesCount: number;
  fullyQualifiedCount: number;
  gapEmployeesCount: number;
  avgOverallProficiency: number;
  avgCoreProficiency: number;
  avgFunctionalProficiency: number;
  avgLeadershipProficiency: number;
  totalGapsCount: number;
  significantGapsCount: number;
  trainingNeedsCount: number;
  prioritySkills: {
    competencyId: string;
    name: string;
    code: string;
    targetLevel: number;
    employeesWithGap: number;
    avgProficiency: number;
  }[];
}

export interface TrainingNeedItem {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  departmentId: string;
  roleName: string;
  competencyId: string;
  competencyCode: string;
  competencyName: string;
  competencyTier: CompetencyTier;
  isPrioritySkill: boolean;
  requiredLevel: 1 | 2 | 3 | 4;
  currentLevel: CompetencyProficiencyNumber;
  gap: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendedProgramId?: string;
  recommendedProgramCode?: string;
  recommendedProgramName?: string;
  status: 'Identified' | 'Nominated' | 'In Training' | 'Completed' | 'Pending Assessment';
  assessmentDate?: string;
  assessedBy?: string;
}

export interface UnmappedEmployeeDetail {
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  reasonNotMapped: string;
}

export interface RoleReconciliationSummary {
  roleId: string;
  roleName: string;
  sourceCompetenciesCount: number;
  dbCompetenciesCount: number;
  missingCount: number;
  extraCount: number;
  prioritySkillsCount: number;
  prioritySkillNames: string[];
  requiredLevels: { code: string; name: string; level: number; isPriority: boolean }[];
}

export interface TeklaFrameworkValidationReport {
  timestamp: string;
  departmentName: string;
  departmentId: string;
  frameworkVersion: string;
  coreCount: number;
  coreExpected: number;
  corePassed: boolean;
  functionalCount: number;
  functionalExpected: number;
  functionalPassed: boolean;
  leadershipCount: number;
  leadershipExpected: number;
  leadershipPassed: boolean;
  totalCompetenciesCount: number;
  totalCompetenciesExpected: number;
  totalCompetenciesPassed: boolean;
  levelsCheckPassed: boolean;
  levelsMissingCount: number;
  rolesCount: number;
  rolesExpected: number;
  rolesPassed: boolean;
  prioritySkillsCheckPassed: boolean;
  rolesMissingPrioritySkills: string[];
  totalTeklaEmployees: number;
  mappedEmployeesCount: number;
  unmappedEmployeesCount: number;
  unmappedDesignations: string[];
  unmappedEmployeesList: UnmappedEmployeeDetail[];
  roleReconciliations: RoleReconciliationSummary[];
  isFullyCompliant: boolean;
  diagnosticMessages: {
    type: 'success' | 'warning' | 'error';
    message: string;
  }[];
}

export interface SourceCompetencyLevel {
  level: 1 | 2 | 3 | 4;
  levelName: 'Novice' | 'Developing' | 'Proficient' | 'Expert';
  behaviorDescription: string;
}

export interface SourceFunctionalCompetency {
  id: string;
  code: string;
  name: string;
  description: string;
  sourceDocument: string;
  isConfiguredInApp: boolean;
  appCode?: string;
  sourceCategory: 'Core Modeling' | 'Connections & Framing' | 'Drawings & Quality' | 'Automation & Integration' | 'Specialized & Industrial Detailing' | 'Fabrication & Erection';
  levels: SourceCompetencyLevel[];
}

export interface FunctionalReconciliationItem {
  id: string;
  code: string;
  name: string;
  description: string;
  sourceCategory: string;
  sourceDocument: string;
  isConfiguredInApp: boolean;
  isInSourceDocument: boolean;
  isUsedByAnyRole: boolean;
  assignedRolesCount: number;
  assignedRoles: { roleId: string; roleName: string; requiredLevel: number; isPriority: boolean }[];
  isPrioritySkill: boolean;
  priorityRolesCount: number;
  priorityRoles: { roleId: string; roleName: string; priorityOrder?: number }[];
  isSourceDefinitionAvailable: boolean;
  levels: SourceCompetencyLevel[];
  reconciliationStatus: 'Configured & Role-Assigned' | 'Configured (Unassigned in Matrix)' | 'Source Only (Catalogue Extension)' | 'App Only (No Source Found)';
}

export interface FunctionalReconciliationReport {
  timestamp: string;
  departmentId: string;
  departmentName: string;
  totalAppFunctionalCount: number;
  totalSourceFunctionalCount: number;
  usedInRoleMatrixCount: number;
  unassignedSourceCount: number;
  appOnlyCount: number;
  prioritySkillsDistinctCount: number;
  items: FunctionalReconciliationItem[];
}


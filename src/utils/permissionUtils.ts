import { User, UserRole } from '../types';

export type Permission = 
  | 'TRAINING_VIEW'
  | 'TRAINING_CREATE'
  | 'TRAINING_EDIT'
  | 'TRAINING_DELETE'
  | 'TRAINING_IMPORT'
  | 'TRAINING_REPORTS_VIEW'
  | 'ATTENDANCE_VIEW'
  | 'ATTENDANCE_MANAGE'
  | 'TASK_VIEW'
  | 'TASK_CREATE'
  | 'TASK_EDIT'
  | 'TASK_DELETE'
  | 'USER_MANAGE'
  | 'SETTINGS_MANAGE';

/**
 * Direct role permission helpers for Task & Training Dashboards vs Operational Modules
 */
export function canViewTaskDashboard(_role?: string | null): boolean {
  return true;
}

export function canViewTrainingDashboard(_role?: string | null): boolean {
  return true;
}

export function canViewReports(_role?: string | null): boolean {
  return true;
}

export function canAccessOperationalModules(role?: string | null): boolean {
  if (!role) return false;
  return role !== 'Management';
}

/**
 * Direct role permission helpers for Training System
 */
export function canViewTraining(role?: string | null): boolean {
  if (!role) return false;
  return role !== 'Management';
}

export function canEditTraining(role?: string | null): boolean {
  if (!role) return false;
  return role !== 'Team Member' && role !== 'Trainee' && role !== 'Management';
}

export function canDeleteTraining(role?: string | null): boolean {
  return role === 'Administrator';
}

export function canManageAttendance(role?: string | null): boolean {
  if (!role) return false;
  return (
    role === 'Administrator' || 
    role === 'L&D Lead' || 
    role === 'L&D Specialist' || 
    role === 'Trainer' ||
    role === 'Auditor' ||
    role === 'Executive'
  );
}

export function canViewAttendance(role?: string | null): boolean {
  if (!role) return false;
  return role !== 'Management';
}

export function canManageAssessments(role?: string | null): boolean {
  if (!role) return false;
  return (
    role === 'Administrator' || 
    role === 'L&D Lead' || 
    role === 'L&D Specialist' || 
    role === 'Trainer' ||
    role === 'Auditor' ||
    role === 'Executive'
  );
}

export function canDeleteAssessments(role?: string | null): boolean {
  return role === 'Administrator';
}

export function canManagePKT(role?: string | null): boolean {
  if (!role) return false;
  return (
    role === 'Administrator' || 
    role === 'L&D Lead' || 
    role === 'L&D Specialist' || 
    role === 'Trainer' ||
    role === 'Auditor' ||
    role === 'Executive'
  );
}

export function canDeletePKT(role?: string | null): boolean {
  return role === 'Administrator';
}

export function canViewEmployeeProfile(role?: string | null): boolean {
  if (!role) return false;
  return true; // All authenticated users can view, but UI permissions enforce edit/delete limits
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Administrator': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_DELETE',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_EDIT',
    'TASK_DELETE',
    'USER_MANAGE',
    'SETTINGS_MANAGE'
  ],
  'L&D Lead': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_EDIT',
    'TASK_DELETE',
    'SETTINGS_MANAGE'
  ],
  'L&D Specialist': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_EDIT'
  ],
  'Trainer': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW',
    'TASK_EDIT'
  ],
  'Auditor': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW'
  ],
  'Executive': [
    'TRAINING_VIEW',
    'TRAINING_CREATE',
    'TRAINING_EDIT',
    'TRAINING_IMPORT',
    'TRAINING_REPORTS_VIEW',
    'ATTENDANCE_VIEW',
    'ATTENDANCE_MANAGE',
    'TASK_VIEW'
  ],
  'Management': [
    'TRAINING_REPORTS_VIEW',
    'TASK_VIEW'
  ],
  'Team Member': [
    'TRAINING_VIEW',
    'ATTENDANCE_VIEW',
    'TRAINING_REPORTS_VIEW',
    'TASK_VIEW',
    'TASK_EDIT'
  ],
  'Trainee': [
    'TRAINING_VIEW',
    'ATTENDANCE_VIEW',
    'TRAINING_REPORTS_VIEW',
    'TASK_VIEW'
  ]
};

/**
 * Checks whether a given user has a specific permission.
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  
  // Administrator always has all permissions
  if (user.role === 'Administrator') return true;

  // Management is read-only and restricted to Dashboards and Reports & Audits
  if (user.role === 'Management') {
    if (permission === 'TRAINING_REPORTS_VIEW' || permission === 'TASK_VIEW') {
      return true;
    }
    return false;
  }

  // Training permissions mapped directly to unified helpers
  if (permission === 'TRAINING_DELETE') {
    return canDeleteTraining(user.role);
  }
  if (
    permission === 'TRAINING_CREATE' || 
    permission === 'TRAINING_EDIT' || 
    permission === 'TRAINING_IMPORT' || 
    permission === 'ATTENDANCE_MANAGE'
  ) {
    return canEditTraining(user.role);
  }
  if (
    permission === 'TRAINING_VIEW' || 
    permission === 'ATTENDANCE_VIEW' || 
    permission === 'TRAINING_REPORTS_VIEW'
  ) {
    return canViewTraining(user.role);
  }

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a user has any of the listed permissions.
 */
export function hasAnyPermission(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'Administrator') return true;
  return permissions.some(perm => hasPermission(user, perm));
}

/**
 * Checks if a user has all of the listed permissions.
 */
export function hasAllPermissions(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'Administrator') return true;
  return permissions.every(perm => hasPermission(user, perm));
}

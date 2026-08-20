export interface DepartmentItem {
  name: string;
  code: string;
  description: string;
  subDepartments?: string[];
}

/**
 * Standard Department Structure across CADEPLOY L&D Operations
 */
export const DEPARTMENT_STRUCTURE: DepartmentItem[] = [
  { 
    name: 'L&D', 
    code: 'LND', 
    description: 'Learning & Development' 
  },
  { 
    name: 'Tekla', 
    code: 'TEKLA', 
    description: 'Tekla Structures Detailing' 
  },
  { 
    name: 'SDS/2', 
    code: 'SDS2', 
    description: 'SDS/2 Steel Detailing' 
  },
  { 
    name: 'PEMB', 
    code: 'PEMB', 
    description: 'Pre-Engineered Metal Buildings',
    subDepartments: ['Tekla', 'AutoCAD', 'XDA', 'Design']
  },
  { 
    name: 'Rebar', 
    code: 'REBAR', 
    description: 'Rebar Detailing & Estimation' 
  },
  { 
    name: 'QA', 
    code: 'QA', 
    description: 'Quality Assurance & Quality Control' 
  },
  { 
    name: 'Estimation', 
    code: 'EST', 
    description: 'Quantity Estimation & Tendering' 
  },
  { 
    name: 'IT', 
    code: 'IT', 
    description: 'Information Technology & Systems' 
  },
  { 
    name: 'HR', 
    code: 'HR', 
    description: 'Human Resources' 
  },
  { 
    name: 'TA', 
    code: 'TA', 
    description: 'Talent Acquisition' 
  },
  { 
    name: 'PMO', 
    code: 'PMO', 
    description: 'Project Management Office' 
  },
  { 
    name: 'Admin', 
    code: 'ADMIN', 
    description: 'Administration & Facilities' 
  },
  { 
    name: 'Finance', 
    code: 'FIN', 
    description: 'Finance & Accounts' 
  }
];

export const MAIN_DEPARTMENTS: string[] = [
  'L&D',
  'Tekla',
  'SDS/2',
  'PEMB',
  'Rebar',
  'QA',
  'Estimation',
  'IT',
  'HR',
  'TA',
  'PMO',
  'Admin',
  'Finance'
];

export const PEMB_SUB_DEPARTMENTS: string[] = [
  'Tekla',
  'AutoCAD',
  'XDA',
  'Design'
];

/**
 * Flat list of all selectable department and sub-department values
 */
export const ALL_DEPARTMENT_OPTIONS: string[] = [
  'L&D',
  'Tekla',
  'SDS/2',
  'PEMB',
  'PEMB - Tekla',
  'PEMB - AutoCAD',
  'PEMB - XDA',
  'PEMB - Design',
  'Rebar',
  'QA',
  'Estimation',
  'IT',
  'HR',
  'TA',
  'PMO',
  'Admin',
  'Finance'
];

/**
 * Checks whether a given department is PEMB or a PEMB sub-division
 */
export function isPembDepartment(dept: string): boolean {
  if (!dept) return false;
  const upper = dept.trim().toUpperCase();
  return upper.startsWith('PEMB');
}

/**
 * Extracts the sub-department if the department is a PEMB division
 */
export function getPembSubDepartment(dept: string): string | null {
  if (!dept) return null;
  const match = dept.match(/PEMB\s*[-–(:]\s*([A-Za-z0-9/]+)/i);
  if (match && match[1]) {
    return match[1].replace(/[)]/g, '').trim();
  }
  return null;
}

/**
 * Formats a department and optional sub-department for display/storage
 */
export function formatDepartment(mainDept: string, subDept?: string): string {
  const trimmedMain = mainDept.trim();
  if (trimmedMain.toUpperCase() === 'PEMB' && subDept && subDept.trim() && subDept.trim() !== 'None' && subDept.trim() !== 'All') {
    return `PEMB - ${subDept.trim()}`;
  }
  return trimmedMain;
}

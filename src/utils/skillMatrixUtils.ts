import ExcelJS from 'exceljs';
import { 
  DepartmentSkillConfig, 
  EmployeeSkillAssessment, 
  SkillAssessmentHistoryRecord, 
  SkillGapStatus,
  TrainingEmployee 
} from '../types/assessment';

export const COMPETENCY_LEVEL_NAMES: Record<number, string> = {
  0: 'Not Assessed',
  1: 'Level 1 - Basic Awareness',
  2: 'Level 2 - Developing',
  3: 'Level 3 - Competent',
  4: 'Level 4 - Proficient'
};

export const COMPETENCY_LEVEL_SHORT: Record<number, string> = {
  0: 'N/A',
  1: 'L1 Basic',
  2: 'L2 Developing',
  3: 'L3 Competent',
  4: 'L4 Proficient'
};

export const DEFAULT_DEPARTMENT_SKILLS: DepartmentSkillConfig[] = [
  {
    id: 'dept-skill-detailing',
    departmentName: 'Detailing',
    skill1: 'Tekla Modeling',
    requiredLevel1: 4,
    skill2: 'Drawing Checking',
    requiredLevel2: 3,
    skill3: 'Bolting',
    requiredLevel3: 3,
    skill4: 'Welding',
    requiredLevel4: 2,
    skill5: 'Drawing Presentation',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-qa',
    departmentName: 'QA',
    skill1: 'Drawing Checking',
    requiredLevel1: 4,
    skill2: 'Quality Standards',
    requiredLevel2: 3,
    skill3: 'Technical Review',
    requiredLevel3: 3,
    skill4: 'Tekla QA',
    requiredLevel4: 3,
    skill5: 'Project Standards',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-tekla',
    departmentName: 'Tekla',
    skill1: 'Tekla 3D Modeling',
    requiredLevel1: 4,
    skill2: 'Connection Detailing',
    requiredLevel2: 4,
    skill3: 'Erection Drawings',
    requiredLevel3: 3,
    skill4: 'Clash Resolution',
    requiredLevel4: 3,
    skill5: 'NC & DXF Generation',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-connection-design',
    departmentName: 'Connection Design',
    skill1: 'Joint Configuration & Moment Calculation',
    requiredLevel1: 4,
    skill2: 'AISC Standard Compliance',
    requiredLevel2: 4,
    skill3: 'Weld & Bolt Capacity Analysis',
    requiredLevel3: 3,
    skill4: 'Connection Detailing in Tekla',
    requiredLevel4: 3,
    skill5: 'Design Calculation Reports',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-pemb',
    departmentName: 'PEMB',
    skill1: 'Pre-Engineered Frame Geometry',
    requiredLevel1: 4,
    skill2: 'Cold-Formed Purlin & Girt Layout',
    requiredLevel2: 3,
    skill3: 'MBS / Tekla PEMB Modeling',
    requiredLevel3: 3,
    skill4: 'Sheeting & Flashing Details',
    requiredLevel4: 3,
    skill5: 'PEMB Erection Drawings',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-checking',
    departmentName: 'Checking',
    skill1: 'Model Checking vs Design Drawings',
    requiredLevel1: 4,
    skill2: 'Erection & Assembly Drawing Verification',
    requiredLevel2: 4,
    skill3: 'Bill of Materials (BOM) Audit',
    requiredLevel3: 3,
    skill4: 'Constructability & Clash Review',
    requiredLevel4: 3,
    skill5: 'Client Comment Resolution',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-pm',
    departmentName: 'Project Management',
    skill1: 'Scope & Schedule Control',
    requiredLevel1: 4,
    skill2: 'Client Coordination',
    requiredLevel2: 4,
    skill3: 'Resource Allocation',
    requiredLevel3: 3,
    skill4: 'RFI Management',
    requiredLevel4: 3,
    skill5: 'Budget & Milestone Tracking',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dept-skill-sales',
    departmentName: 'Sales & Business Development',
    skill1: 'Estimation & Bidding',
    requiredLevel1: 4,
    skill2: 'Client Relationship Management',
    requiredLevel2: 4,
    skill3: 'Contract Negotiation',
    requiredLevel3: 3,
    skill4: 'Market Analysis',
    requiredLevel4: 3,
    skill5: 'Proposal Preparation',
    requiredLevel5: 3,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function getProficiencyLabel(level: number): string {
  switch (level) {
    case 4: return 'Proficient';
    case 3: return 'Competent';
    case 2: return 'Developing';
    case 1: return 'Basic Awareness';
    default: return 'Not Assessed';
  }
}

export function getSkillLevelLabel(level: number): string {
  return COMPETENCY_LEVEL_NAMES[level] || 'Not Assessed';
}

export function isSkillQualified(requiredLevel: number, currentLevel: number): boolean {
  return currentLevel >= requiredLevel && currentLevel > 0;
}

export function getProficiencyColor(level: number): string {
  switch (level) {
    case 4: return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800';
    case 3: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
    case 2: return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800';
    case 1: return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  }
}

export function getSkillLevelBadge(level: number): { text: string; bg: string; textCol: string; borderCol: string } {
  switch (level) {
    case 4:
      return { text: 'L4 Proficient', bg: 'bg-emerald-50 dark:bg-emerald-950/60', textCol: 'text-emerald-700 dark:text-emerald-300', borderCol: 'border-emerald-200 dark:border-emerald-800' };
    case 3:
      return { text: 'L3 Competent', bg: 'bg-blue-50 dark:bg-blue-950/60', textCol: 'text-blue-700 dark:text-blue-300', borderCol: 'border-blue-200 dark:border-blue-800' };
    case 2:
      return { text: 'L2 Developing', bg: 'bg-amber-50 dark:bg-amber-950/60', textCol: 'text-amber-700 dark:text-amber-300', borderCol: 'border-amber-200 dark:border-amber-800' };
    case 1:
      return { text: 'L1 Basic Awareness', bg: 'bg-indigo-50 dark:bg-indigo-950/60', textCol: 'text-indigo-700 dark:text-indigo-300', borderCol: 'border-indigo-200 dark:border-indigo-800' };
    default:
      return { text: 'Not Assessed', bg: 'bg-slate-100 dark:bg-slate-800/80', textCol: 'text-slate-600 dark:text-slate-400', borderCol: 'border-slate-200 dark:border-slate-700' };
  }
}

export function calculateSkillGap(
  requiredLevel: number, 
  currentLevel: number
): { 
  gap: number; 
  status: SkillGapStatus; 
  trainingRequired: boolean;
  statusBadge: { text: string; bg: string; textCol: string; borderCol: string };
} {
  const req = Math.max(1, Math.min(4, Number(requiredLevel) || 3));
  const curr = Number(currentLevel) || 0;

  if (curr <= 0) {
    return {
      gap: req,
      status: 'Not Assessed',
      trainingRequired: true,
      statusBadge: { text: 'Not Assessed', bg: 'bg-slate-100 dark:bg-slate-800', textCol: 'text-slate-600 dark:text-slate-400', borderCol: 'border-slate-200 dark:border-slate-700' }
    };
  }

  const rawGap = req - curr;
  if (rawGap <= 0) {
    return {
      gap: 0,
      status: 'Meets Requirement',
      trainingRequired: false,
      statusBadge: { text: 'Meets Requirement', bg: 'bg-emerald-50 dark:bg-emerald-950/60', textCol: 'text-emerald-700 dark:text-emerald-300', borderCol: 'border-emerald-200 dark:border-emerald-800' }
    };
  }

  if (rawGap === 1) {
    return {
      gap: 1,
      status: 'Development Needed',
      trainingRequired: true,
      statusBadge: { text: 'Development Needed', bg: 'bg-amber-50 dark:bg-amber-950/60', textCol: 'text-amber-700 dark:text-amber-300', borderCol: 'border-amber-200 dark:border-amber-800' }
    };
  }

  return {
    gap: rawGap,
    status: 'Significant Gap',
    trainingRequired: true,
    statusBadge: { text: 'Significant Gap', bg: 'bg-rose-50 dark:bg-rose-950/60', textCol: 'text-rose-700 dark:text-rose-300', borderCol: 'border-rose-200 dark:border-rose-800' }
  };
}

/**
 * Extracts list of 1 to 5 active skills from a department configuration with fallback support
 */
export function getDepartmentSkillsList(
  config?: DepartmentSkillConfig | null, 
  fallbackDept?: string
): Array<{ index: number; slotNumber: number; name: string; skillName: string; requiredLevel: number }> {
  let targetConfig = config;
  if (!targetConfig && fallbackDept) {
    targetConfig = DEFAULT_DEPARTMENT_SKILLS.find(
      d => d.departmentName.trim().toLowerCase() === fallbackDept.trim().toLowerCase()
    ) || null;
  }

  if (!targetConfig) {
    // Default fallback for any unspecified department
    return [
      { index: 1, slotNumber: 1, name: 'Core Department Procedures', skillName: 'Core Department Procedures', requiredLevel: 3 },
      { index: 2, slotNumber: 2, name: 'Technical Drafting & Modeling', skillName: 'Technical Drafting & Modeling', requiredLevel: 3 },
      { index: 3, slotNumber: 3, name: 'Quality Standards & Compliance', skillName: 'Quality Standards & Compliance', requiredLevel: 3 }
    ];
  }

  const list: Array<{ index: number; slotNumber: number; name: string; skillName: string; requiredLevel: number }> = [];
  if (targetConfig.skill1?.trim()) {
    list.push({ index: 1, slotNumber: 1, name: targetConfig.skill1.trim(), skillName: targetConfig.skill1.trim(), requiredLevel: targetConfig.requiredLevel1 || 3 });
  }
  if (targetConfig.skill2?.trim()) {
    list.push({ index: 2, slotNumber: 2, name: targetConfig.skill2.trim(), skillName: targetConfig.skill2.trim(), requiredLevel: targetConfig.requiredLevel2 || 3 });
  }
  if (targetConfig.skill3?.trim()) {
    list.push({ index: 3, slotNumber: 3, name: targetConfig.skill3.trim(), skillName: targetConfig.skill3.trim(), requiredLevel: targetConfig.requiredLevel3 || 3 });
  }
  if (targetConfig.skill4?.trim()) {
    list.push({ index: 4, slotNumber: 4, name: targetConfig.skill4.trim(), skillName: targetConfig.skill4.trim(), requiredLevel: targetConfig.requiredLevel4 || 2 });
  }
  if (targetConfig.skill5?.trim()) {
    list.push({ index: 5, slotNumber: 5, name: targetConfig.skill5.trim(), skillName: targetConfig.skill5.trim(), requiredLevel: targetConfig.requiredLevel5 || 2 });
  }

  return list.length > 0 ? list : [
    { index: 1, slotNumber: 1, name: 'General Engineering Fundamentals', skillName: 'General Engineering Fundamentals', requiredLevel: 3 }
  ];
}

/**
 * Resolves current skill level for an employee
 */
export function getEmployeeCurrentSkillLevel(
  employeeCode: string,
  skillName: string,
  assessments: EmployeeSkillAssessment[]
): { currentLevel: number; assessmentDate?: string; assessedBy?: string; remarks?: string } {
  const cleanCode = employeeCode.trim().toUpperCase();
  const cleanSkill = skillName.trim().toLowerCase();

  const match = assessments.find(a => 
    a.employeeCode.toUpperCase() === cleanCode && 
    (a.skillName || '').toLowerCase() === cleanSkill
  );

  if (match) {
    return {
      currentLevel: match.currentLevel,
      assessmentDate: match.assessmentDate,
      assessedBy: match.assessedBy,
      remarks: match.remarks
    };
  }

  return { currentLevel: 0 };
}

/**
 * Calculates department skill summary KPIs
 */
export function calculateDepartmentSkillKPIs(
  employees: TrainingEmployee[],
  assessments: EmployeeSkillAssessment[],
  deptConfig: DepartmentSkillConfig | null,
  departmentName: string
) {
  const skills = getDepartmentSkillsList(deptConfig, departmentName);
  const totalEmployees = employees.length;

  let evaluatedEmployees = 0;
  let fullyQualifiedEmployees = 0;
  let gapEmployees = 0;
  let totalProficiencySum = 0;
  let totalEvaluatedSkillsCount = 0;

  employees.forEach(emp => {
    let empEvaluatedAny = false;
    let empHasAnyGap = false;

    skills.forEach(s => {
      const info = getEmployeeCurrentSkillLevel(emp.employeeCode, s.name, assessments);
      if (info.currentLevel > 0) {
        empEvaluatedAny = true;
        totalProficiencySum += info.currentLevel;
        totalEvaluatedSkillsCount++;

        const gap = calculateSkillGap(s.requiredLevel, info.currentLevel);
        if (gap.gap > 0) {
          empHasAnyGap = true;
        }
      } else {
        empHasAnyGap = true; // unassessed counts as gap
      }
    });

    if (empEvaluatedAny) {
      evaluatedEmployees++;
      if (!empHasAnyGap) {
        fullyQualifiedEmployees++;
      } else {
        gapEmployees++;
      }
    } else {
      gapEmployees++;
    }
  });

  const avgProficiency = totalEvaluatedSkillsCount > 0 
    ? (totalProficiencySum / totalEvaluatedSkillsCount).toFixed(1) 
    : '0.0';

  return {
    totalEmployees,
    evaluatedEmployees,
    fullyQualifiedEmployees,
    gapEmployees,
    avgProficiency
  };
}

/**
 * Export Skill Matrix to Excel
 */
export async function exportSkillMatrixToExcel(
  departmentName: string,
  employees: TrainingEmployee[],
  assessments: EmployeeSkillAssessment[],
  skillConfig: DepartmentSkillConfig | null,
  fileName = 'Skill_Matrix_Export'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY L&D Operations';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Skill Matrix', {
    views: [{ showGridLines: true }]
  });

  const skills = getDepartmentSkillsList(skillConfig, departmentName);

  // Define columns
  const columns: any[] = [
    { header: 'Employee ID', key: 'employeeCode', width: 16 },
    { header: 'Employee Name', key: 'employeeName', width: 24 },
    { header: 'Department', key: 'department', width: 22 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Location', key: 'location', width: 16 }
  ];

  skills.forEach((s) => {
    columns.push({
      header: `${s.name} (Req L${s.requiredLevel})`,
      key: `skill_${s.index}`,
      width: 26
    });
  });

  columns.push(
    { header: 'Avg Level', key: 'avgLevel', width: 14 },
    { header: 'Skill Gaps', key: 'gapsCount', width: 14 },
    { header: 'Training Required', key: 'trainingRequired', width: 18 },
    { header: 'Overall Status', key: 'overallStatus', width: 20 }
  );

  sheet.columns = columns;

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Filter employees for department if specific
  const targetEmployees = departmentName === 'all' 
    ? employees 
    : employees.filter(e => e.department.toLowerCase() === departmentName.toLowerCase());

  targetEmployees.forEach(emp => {
    const rowData: Record<string, any> = {
      employeeCode: emp.employeeCode,
      employeeName: emp.employeeName,
      department: emp.department,
      designation: emp.designation,
      location: emp.location || '—'
    };

    let totalLevels = 0;
    let assessedCount = 0;
    let gapsCount = 0;
    let hasSigGap = false;

    skills.forEach(s => {
      const { currentLevel } = getEmployeeCurrentSkillLevel(emp.employeeCode, s.name, assessments);
      if (currentLevel > 0) {
        totalLevels += currentLevel;
        assessedCount++;
        const gapInfo = calculateSkillGap(s.requiredLevel, currentLevel);
        if (gapInfo.gap > 0) gapsCount++;
        if (gapInfo.gap >= 2) hasSigGap = true;
        rowData[`skill_${s.index}`] = `L${currentLevel} (${COMPETENCY_LEVEL_SHORT[currentLevel]})`;
      } else {
        gapsCount++;
        rowData[`skill_${s.index}`] = 'Not Assessed';
      }
    });

    const avgLevel = assessedCount > 0 ? (totalLevels / assessedCount).toFixed(1) : '—';
    const trainingRequired = gapsCount > 0 ? 'YES' : 'NO';
    let overallStatus = 'Not Assessed';
    if (assessedCount > 0) {
      if (gapsCount === 0) overallStatus = 'Meets Requirement';
      else if (hasSigGap) overallStatus = 'Significant Gap';
      else overallStatus = 'Development Needed';
    }

    rowData.avgLevel = avgLevel;
    rowData.gapsCount = gapsCount;
    rowData.trainingRequired = trainingRequired;
    rowData.overallStatus = overallStatus;

    sheet.addRow(rowData);
  });

  // Format data rows
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    }
  });

  // Export buffer & download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

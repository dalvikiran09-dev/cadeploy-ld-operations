import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { TrainingEmployee, EmployeeColumnMapping, EmployeeImportRow } from '../types/assessment';

/**
 * Extensive synonym dictionary for mapping raw HR Excel headers
 * to application employee attributes.
 */
export const FIELD_SYNONYMS: Record<keyof EmployeeColumnMapping, string[]> = {
  employeeCode: [
    'employeecode',
    'employee code',
    'employee id',
    'employeeid',
    'emp code',
    'empcode',
    'emp id',
    'empid',
    'employee_number',
    'employeenumber',
    'employee_code',
    'employee no',
    'emp no',
    'trainee code',
    'trainee id',
    'traineecode',
    'traineeid',
    'associate id',
    'associateid',
    'associate code',
    'staff id',
    'staff code',
    'staffid',
    'code',
    'id',
    'employee'
  ],
  employeeName: [
    'employeename',
    'employee name',
    'name',
    'full name',
    'fullname',
    'emp name',
    'empname',
    'employee_name',
    'associate name',
    'associatename',
    'trainee name',
    'traineename',
    'staff name',
    'resource name',
    'resourcename',
    'participant name',
    'person name',
    'candidate name'
  ],
  department: [
    'departmentname',
    'department name',
    'department',
    'dept',
    'dept name',
    'deptname',
    'department_name',
    'business unit',
    'businessunit',
    'division',
    'discipline',
    'stream',
    'department / discipline',
    'function',
    'sub department',
    'subdepartment'
  ],
  designation: [
    'rolename',
    'role name',
    'role',
    'role_name',
    'designation',
    'designation name',
    'job title',
    'jobtitle',
    'job_title',
    'title',
    'position',
    'emp designation',
    'current role',
    'cadre',
    'level'
  ],
  location: [
    'employeelocation',
    'employee location',
    'location',
    'employee_location',
    'office location',
    'officelocation',
    'office_location',
    'city',
    'work location',
    'worklocation',
    'branch',
    'base location',
    'site location',
    'facility',
    'base city',
    'work city'
  ],
  email: [
    'email',
    'email id',
    'emailaddress',
    'email address',
    'mail',
    'official email',
    'work email',
    'employee email'
  ],
  joiningDate: [
    'joining date',
    'joiningdate',
    'date of joining',
    'doj',
    'join date',
    'joindate',
    'start date',
    'hire date',
    'joining_date'
  ]
};

/**
 * Normalizes cell content by stripping HTML tags (<br>), carriage returns,
 * newlines, duplicate spaces, and trimming whitespace.
 */
export function normalizeCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // Replace HTML line breaks <br>, <br/>, <p>
  str = str.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?p>/gi, ' ');

  // Replace line breaks \r, \n, \t with space
  str = str.replace(/[\r\n\t]+/g, ' ');

  // Replace multiple contiguous whitespace with single space
  str = str.replace(/\s{2,}/g, ' ');

  return str.trim();
}

/**
 * Sanitizes a header string for reliable matching
 */
export function cleanHeaderString(header: string): string {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Auto-detects column mapping based on Excel headers.
 */
export function detectColumnMapping(headers: string[]): {
  mapping: EmployeeColumnMapping;
  unmappedHeaders: string[];
} {
  const mapping: EmployeeColumnMapping = {
    employeeCode: '',
    employeeName: '',
    department: '',
    designation: '',
    location: '',
    email: '',
    joiningDate: ''
  };

  const usedHeaderIndices = new Set<number>();

  // Check each field in priority order
  const fields: Array<keyof EmployeeColumnMapping> = [
    'employeeCode',
    'employeeName',
    'department',
    'designation',
    'location',
    'email',
    'joiningDate'
  ];

  for (const field of fields) {
    const synonyms = FIELD_SYNONYMS[field];
    
    // Find best match among unused headers
    let bestIndex = -1;
    let highestScore = 0;

    headers.forEach((rawHeader, idx) => {
      if (usedHeaderIndices.has(idx)) return;

      const cleaned = cleanHeaderString(rawHeader);
      const rawLower = String(rawHeader || '').toLowerCase().trim();

      for (const syn of synonyms) {
        const cleanedSyn = cleanHeaderString(syn);
        
        // Exact normalized match
        if (cleaned === cleanedSyn) {
          bestIndex = idx;
          highestScore = 100;
          break;
        }

        // Substring / partial match
        if (cleaned.includes(cleanedSyn) || cleanedSyn.includes(cleaned)) {
          if (highestScore < 80) {
            bestIndex = idx;
            highestScore = 80;
          }
        } else if (rawLower.includes(syn) || syn.includes(rawLower)) {
          if (highestScore < 60) {
            bestIndex = idx;
            highestScore = 60;
          }
        }
      }
    });

    if (bestIndex !== -1 && highestScore >= 60) {
      mapping[field] = headers[bestIndex];
      usedHeaderIndices.add(bestIndex);
    }
  }

  // Find unmapped headers
  const unmappedHeaders = headers.filter((_, idx) => !usedHeaderIndices.has(idx) && headers[idx]?.trim());

  return { mapping, unmappedHeaders };
}

/**
 * Parses raw 2D array or object array from Excel and applies mapping and validation.
 */
export function parseRawEmployeeRows(
  headers: string[],
  rowsData: any[][],
  mapping: EmployeeColumnMapping,
  existingEmployees: TrainingEmployee[] = []
): {
  parsedRows: EmployeeImportRow[];
  totalRead: number;
  validCount: number;
  insertCount: number;
  updateCount: number;
  errorCount: number;
} {
  const existingCodeMap = new Map<string, TrainingEmployee>();
  existingEmployees.forEach(e => {
    if (e.employeeCode) {
      existingCodeMap.set(e.employeeCode.trim().toUpperCase(), e);
    }
  });

  const headerIndexMap = new Map<string, number>();
  headers.forEach((h, idx) => {
    headerIndexMap.set(h, idx);
  });

  const getColValue = (row: any[], headerName?: string): string => {
    if (!headerName || !headerIndexMap.has(headerName)) return '';
    const idx = headerIndexMap.get(headerName)!;
    return normalizeCellValue(row[idx]);
  };

  const parsedRows: EmployeeImportRow[] = [];
  const seenCodesInBatch = new Set<string>();

  let insertCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  rowsData.forEach((row, rowIdx) => {
    // Excel row number: 1-indexed (header is row 1, data starts row 2)
    const excelRowNum = rowIdx + 2;

    // Check if entire row is empty
    const hasAnyValue = row.some(cell => normalizeCellValue(cell) !== '');
    if (!hasAnyValue) return;

    // Build raw record map
    const rawRecord: Record<string, any> = {};
    headers.forEach((h, i) => {
      rawRecord[h] = normalizeCellValue(row[i]);
    });

    const code = getColValue(row, mapping.employeeCode);
    const name = getColValue(row, mapping.employeeName);
    const dept = getColValue(row, mapping.department);
    const desig = getColValue(row, mapping.designation);
    const loc = getColValue(row, mapping.location);
    const email = getColValue(row, mapping.email);
    const doj = getColValue(row, mapping.joiningDate);

    const errors: string[] = [];

    if (!code) {
      errors.push('Employee Code missing');
    }
    if (!name) {
      errors.push('Employee Name missing');
    }

    const cleanCodeUpper = code.toUpperCase();
    const isExistingInDb = existingCodeMap.has(cleanCodeUpper);
    const isDuplicateInBatch = seenCodesInBatch.has(cleanCodeUpper);

    let action: 'insert' | 'update' | 'error' = 'insert';

    if (errors.length > 0) {
      action = 'error';
      errorCount++;
    } else {
      seenCodesInBatch.add(cleanCodeUpper);
      if (isExistingInDb || isDuplicateInBatch) {
        action = 'update';
        updateCount++;
      } else {
        action = 'insert';
        insertCount++;
      }
    }

    parsedRows.push({
      row: excelRowNum,
      rawRecord,
      employeeCode: code,
      employeeName: name,
      department: dept || undefined,
      designation: desig || undefined,
      location: loc || undefined,
      email: email || undefined,
      joiningDate: doj || undefined,
      status: 'Active',
      isExisting: isExistingInDb,
      action,
      isValid: errors.length === 0,
      errors
    });
  });

  return {
    parsedRows,
    totalRead: parsedRows.length,
    validCount: parsedRows.filter(r => r.isValid).length,
    insertCount,
    updateCount,
    errorCount
  };
}

/**
 * Generates and downloads a sample raw HR Employee Master Excel template
 * illustrating non-standard column headers and order.
 */
export async function downloadSampleHREmployeeMasterTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY L&D Operations';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('EmployeeMaster', {
    views: [{ showGridLines: true }]
  });

  // Example source headers matching user prompt requirement
  worksheet.columns = [
    { header: 'EmployeeCode', key: 'EmployeeCode', width: 18 },
    { header: 'EmployeeLocation', key: 'EmployeeLocation', width: 20 },
    { header: 'DepartmentName', key: 'DepartmentName', width: 32 },
    { header: 'RoleName', key: 'RoleName', width: 26 },
    { header: 'EmployeeName', key: 'EmployeeName', width: 24 },
    { header: 'BusinessUnit', key: 'BusinessUnit', width: 18 },
    { header: 'CostCenter', key: 'CostCenter', width: 16 }
  ];

  // Styling header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' } // Deep Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Sample data records
  const sampleData = [
    {
      EmployeeCode: 'C8888E',
      EmployeeLocation: 'Hyderabad',
      DepartmentName: 'Sales & Business Development',
      RoleName: 'Sales Manager',
      EmployeeName: 'Mike Jones',
      BusinessUnit: 'Commercial',
      CostCenter: 'CC-901'
    },
    {
      EmployeeCode: 'C9999E',
      EmployeeLocation: 'Hyderabad',
      DepartmentName: 'Sales & Business Development',
      RoleName: 'Sales Manager',
      EmployeeName: 'Justin Creech',
      BusinessUnit: 'Commercial',
      CostCenter: 'CC-901'
    },
    {
      EmployeeCode: 'T1001E',
      EmployeeLocation: 'Chennai',
      DepartmentName: 'Tekla',
      RoleName: 'Tekla Trainee Modeler',
      EmployeeName: 'Robert Vance',
      BusinessUnit: 'Engineering',
      CostCenter: 'CC-402'
    },
    {
      EmployeeCode: 'T1002E',
      EmployeeLocation: 'Hyderabad',
      DepartmentName: 'PEMB - Tekla',
      RoleName: 'PEMB Engineer',
      EmployeeName: 'Sarah Jenkins\n',
      BusinessUnit: 'PEMB Division',
      CostCenter: 'CC-405'
    }
  ];

  sampleData.forEach(item => {
    worksheet.addRow(item);
  });

  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HR_Employee_Master_Sample_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Exports current Employee Master list to a standardized Excel workbook.
 */
export async function exportStandardizedEmployeesToExcel(
  employees: TrainingEmployee[], 
  customFileName?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY L&D Operations';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Employee Master', {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { header: 'EmployeeCode', key: 'employeeCode', width: 16 },
    { header: 'EmployeeName', key: 'employeeName', width: 24 },
    { header: 'DepartmentName', key: 'department', width: 28 },
    { header: 'RoleName', key: 'designation', width: 24 },
    { header: 'EmployeeLocation', key: 'location', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'JoiningDate', key: 'joiningDate', width: 16 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell(cell => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  employees.forEach(emp => {
    worksheet.addRow({
      employeeCode: emp.employeeCode,
      employeeName: emp.employeeName,
      department: emp.department || '',
      designation: emp.designation || '',
      location: emp.location || '',
      email: emp.email || '',
      joiningDate: emp.joiningDate || '',
      status: emp.status || 'Active'
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.eachCell(cell => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = customFileName 
    ? (customFileName.endsWith('.xlsx') ? customFileName : `${customFileName}.xlsx`)
    : `Employee_Master_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

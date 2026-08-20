import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { 
  TrainingProgram, 
  TrainingModule, 
  TrainingCourse, 
  TrainingImportLog, 
  CourseGroup 
} from '../types/training';
import { 
  parseDurationToMinutes, 
  formatDurationDisplay, 
  formatTotalHoursDisplay, 
  calculateTotalTrainingHours,
  groupCourses
} from './trainingUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Replaces CSS color functions unsupported by html2canvas (e.g. oklch, oklab, color-mix)
 * with standard hex or rgb color strings using a temporary canvas context.
 */
function replaceUnsupportedColors(cssText: string): string {
  if (!cssText) return cssText;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const convertColor = (colorStr: string): string => {
    if (!ctx) return '#3b82f6';
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorStr;
      const res = ctx.fillStyle;
      if (res && res !== '#000000') return res;
      ctx.fillStyle = '#ffffff';
      ctx.fillStyle = colorStr;
      if (ctx.fillStyle === '#ffffff' && colorStr !== 'white' && colorStr !== '#ffffff' && colorStr !== '#fff') {
        return '#3b82f6';
      }
      return ctx.fillStyle || '#3b82f6';
    } catch {
      return '#3b82f6';
    }
  };

  let result = cssText.replace(/oklch\([^)]+\)/gi, (match) => convertColor(match));
  result = result.replace(/oklab\([^)]+\)/gi, (match) => convertColor(match));
  result = result.replace(/color-mix\([^)]+\)/gi, '#3b82f6');
  return result;
}

/**
 * Safely renders a DOM element to an HTML5 Canvas without failing on Tailwind v4 oklch() colors.
 */
async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const styleElements = clonedDoc.querySelectorAll('style');
      styleElements.forEach((styleEl) => {
        if (styleEl.textContent) {
          styleEl.textContent = replaceUnsupportedColors(styleEl.textContent);
        }
      });

      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach((el) => {
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab') || inlineStyle.includes('color-mix'))) {
          el.setAttribute('style', replaceUnsupportedColors(inlineStyle));
        }
        const fill = el.getAttribute('fill');
        if (fill && (fill.includes('oklch') || fill.includes('oklab') || fill.includes('color-mix'))) {
          el.setAttribute('fill', replaceUnsupportedColors(fill));
        }
        const stroke = el.getAttribute('stroke');
        if (stroke && (stroke.includes('oklch') || stroke.includes('oklab') || stroke.includes('color-mix'))) {
          el.setAttribute('stroke', replaceUnsupportedColors(stroke));
        }
      });
    }
  });
}

/**
 * Fetches the latest Training Management data directly from Supabase.
 * Falls back cleanly to local/fallback parameters if offline or query fails.
 */
export async function fetchLatestTrainingDataFromSupabase(
  fallbackPrograms: TrainingProgram[],
  fallbackModules: TrainingModule[],
  fallbackCourses: TrainingCourse[],
  fallbackLogs: TrainingImportLog[]
): Promise<{
  programs: TrainingProgram[];
  modules: TrainingModule[];
  courses: TrainingCourse[];
  importLogs: TrainingImportLog[];
}> {
  if (!isSupabaseConfigured) {
    return {
      programs: fallbackPrograms,
      modules: fallbackModules,
      courses: fallbackCourses,
      importLogs: fallbackLogs
    };
  }

  try {
    const [pRes, mRes, cRes, lRes] = await Promise.allSettled([
      supabase.from('training_programs').select('*').order('program_code', { ascending: true }),
      supabase.from('training_modules').select('*').order('module_code', { ascending: true }),
      supabase.from('training_courses').select('*').order('delivery_day', { ascending: true }),
      supabase.from('training_import_history').select('*').order('created_at', { ascending: false })
    ]);

    let programs = fallbackPrograms;
    if (pRes.status === 'fulfilled' && Array.isArray(pRes.value.data)) {
      programs = pRes.value.data
        .filter((row: any) => !String(row.id || '').includes('seed'))
        .map((row: any) => ({
          id: row.id,
          programCode: row.program_code || row.programCode || '',
          programName: row.program_name || row.programName || '',
          programDescription: row.program_description || row.programDescription || '',
          status: row.status || 'Active',
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
        }));
    }

    let modules = fallbackModules;
    if (mRes.status === 'fulfilled' && Array.isArray(mRes.value.data)) {
      modules = mRes.value.data
        .filter((row: any) => !String(row.id || '').includes('seed'))
        .map((row: any) => ({
          id: row.id,
          moduleCode: row.module_code || row.moduleCode || '',
          moduleName: row.module_name || row.moduleName || '',
          duration: row.duration || '01:00:00',
          deliveryMode: row.delivery_mode || row.deliveryMode || 'Classroom Training (Offline)',
          status: row.status || 'Active',
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
        }));
    }

    let courses = fallbackCourses;
    if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) {
      courses = cRes.value.data
        .filter((row: any) => !String(row.id || '').includes('seed'))
        .map((row: any) => ({
          id: row.id,
          courseCode: row.course_code || row.courseCode || '',
          programCode: row.program_code || row.programCode || '',
          moduleCode: row.module_code || row.moduleCode || '',
          deliveryMode1: row.delivery_mode_1 || row.deliveryMode1 || row.delivery_mode || undefined,
          deliveryMode2: row.delivery_mode_2 || row.deliveryMode2 || undefined,
          deliveryMode3: row.delivery_mode_3 || row.deliveryMode3 || undefined,
          deliveryDay: Number(row.delivery_day ?? row.deliveryDay ?? 1),
          ownerRole: row.owner_role || row.ownerRole || 'Manager - Learning & Development',
          courseStatus: row.course_status || row.courseStatus || 'Approved',
          preAssessmentCode: row.pre_assessment_code || row.preAssessmentCode || undefined,
          postAssessmentCode: row.post_assessment_code || row.postAssessmentCode || undefined,
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
        }));
    }

    let importLogs = fallbackLogs;
    if (lRes.status === 'fulfilled' && Array.isArray(lRes.value.data)) {
      importLogs = lRes.value.data.map((row: any) => ({
        id: row.id,
        fileName: row.file_name || row.fileName || '',
        importedBy: row.imported_by || row.importedBy || 'Admin',
        importedAt: row.created_at || row.importedAt || new Date().toISOString(),
        programsAdded: Number(row.programs_added ?? row.programsAdded ?? 0),
        programsUpdated: Number(row.programs_updated ?? row.programsUpdated ?? 0),
        modulesAdded: Number(row.modules_added ?? row.modulesAdded ?? 0),
        modulesUpdated: Number(row.modules_updated ?? row.modulesUpdated ?? 0),
        coursesAdded: Number(row.courses_added ?? row.coursesAdded ?? 0),
        coursesUpdated: Number(row.courses_updated ?? row.coursesUpdated ?? 0),
        errorsCount: Number(row.errors_count ?? row.errorsCount ?? 0),
        status: row.status || 'Success',
        details: typeof row.log_details === 'string' ? JSON.parse(row.log_details) : (row.log_details || row.details || {})
      }));
    }

    return { programs, modules, courses, importLogs };
  } catch (err) {
    console.warn('Error querying fresh data from Supabase for Excel export, using fallback data:', err);
    return {
      programs: fallbackPrograms,
      modules: fallbackModules,
      courses: fallbackCourses,
      importLogs: fallbackLogs
    };
  }
}

/**
 * Exports complete Training Management data into a styled multi-worksheet .xlsx workbook.
 */
export async function exportTrainingManagementToExcel(
  initialPrograms: TrainingProgram[],
  initialModules: TrainingModule[],
  initialCourses: TrainingCourse[],
  initialImportLogs: TrainingImportLog[]
): Promise<void> {
  console.log('========== TRAINING EXCEL EXPORT START ==========');

  // 1. Fetch live data from Supabase to ensure complete source of truth
  const { programs, modules, courses, importLogs } = await fetchLatestTrainingDataFromSupabase(
    initialPrograms,
    initialModules,
    initialCourses,
    initialImportLogs
  );

  const groupedCoursesList: CourseGroup[] = groupCourses(courses, programs, modules);

  const programMap = new Map(programs.map(p => [p.programCode.toUpperCase(), p]));
  const moduleMap = new Map(modules.map(m => [m.moduleCode.toUpperCase(), m]));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'CADEPLOY L&D Operations';
  wb.lastModifiedBy = 'CADEPLOY System';
  wb.created = new Date();
  wb.modified = new Date();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const generatedDateTime = `${dateStr} ${timeStr}`;

  // Metrics calculation
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'Active').length;
  const totalModules = modules.length;
  const activeModules = modules.filter(m => m.status === 'Active').length;
  const totalCourses = groupedCoursesList.length;
  const approvedCourses = groupedCoursesList.filter(c => c.status === 'Approved' || c.status === 'Active').length;
  const totalHoursNum = calculateTotalTrainingHours(modules);
  const totalHoursFormatted = formatTotalHoursDisplay(totalHoursNum);

  // Common Header Fill & Fonts
  const primaryHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Dark Navy
  };
  const primaryHeaderFont: Partial<ExcelJS.Font> = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const sectionHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate Navy
  };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // =========================================================================
  // 1. WORKSHEET 1: DASHBOARD
  // =========================================================================
  const wsDashboard = wb.addWorksheet('Dashboard', {
    views: [{ showGridLines: true }]
  });

  wsDashboard.columns = [
    { width: 4 },  // A (padding)
    { width: 24 }, // B
    { width: 14 }, // C
    { width: 14 }, // D
    { width: 14 }, // E
    { width: 14 }, // F
    { width: 14 }, // G
    { width: 4 },  // H (gap)
    { width: 24 }, // I
    { width: 14 }, // J
    { width: 14 }, // K
    { width: 14 }, // L
    { width: 14 }, // M
    { width: 14 }, // N
  ];

  // Title Banner
  wsDashboard.mergeCells('A1:N1');
  const titleA1 = wsDashboard.getCell('A1');
  titleA1.value = 'CADEPLOY — LEARNING & DEVELOPMENT OPERATIONS';
  titleA1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleA1.fill = primaryHeaderFill;
  titleA1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDashboard.getRow(1).height = 28;

  wsDashboard.mergeCells('A2:N2');
  const subA2 = wsDashboard.getCell('A2');
  subA2.value = 'TRAINING MANAGEMENT REPORT — EXECUTIVE CURRICULUM DASHBOARD';
  subA2.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF60A5FA' } };
  subA2.fill = sectionHeaderFill;
  subA2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDashboard.getRow(2).height = 22;

  wsDashboard.mergeCells('A3:N3');
  const metaA3 = wsDashboard.getCell('A3');
  metaA3.value = `Generated Date: ${dateStr}   |   Generated Time: ${timeStr}   |   Total Programs: ${totalPrograms}   |   Total Modules: ${totalModules}   |   Total Courses: ${totalCourses}`;
  metaA3.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
  metaA3.fill = sectionHeaderFill;
  metaA3.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDashboard.getRow(3).height = 18;

  // KPI Section Title
  wsDashboard.mergeCells('A5:N5');
  const kpiBanner = wsDashboard.getCell('A5');
  kpiBanner.value = 'KEY PERFORMANCE INDICATORS (CURRICULUM SUMMARY)';
  kpiBanner.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  wsDashboard.getRow(5).height = 20;

  const renderKpiBox = (startCol: string, endCol: string, startRow: number, endRow: number, label: string, val: string | number, colorArgb: string) => {
    const range = `${startCol}${startRow}:${endCol}${endRow}`;
    wsDashboard.mergeCells(range);
    const cell = wsDashboard.getCell(`${startCol}${startRow}`);
    cell.value = `${label}\n\n${val}`;
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: colorArgb } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  };

  // 7 KPI Boxes across columns A-N (Rows 6-8)
  renderKpiBox('A', 'B', 6, 8, 'TOTAL PROGRAMS', totalPrograms, 'FF1E293B');
  renderKpiBox('C', 'D', 6, 8, 'ACTIVE PROGRAMS', activePrograms, 'FF10B981');
  renderKpiBox('E', 'F', 6, 8, 'TOTAL MODULES', totalModules, 'FF2563EB');
  renderKpiBox('G', 'H', 6, 8, 'ACTIVE MODULES', activeModules, 'FF059669');
  renderKpiBox('I', 'J', 6, 8, 'TOTAL COURSES', totalCourses, 'FF9333EA');
  renderKpiBox('K', 'L', 6, 8, 'APPROVED COURSES', approvedCourses, 'FF7C3AED');
  renderKpiBox('M', 'N', 6, 8, 'TOTAL DURATION', totalHoursFormatted, 'FF0284C7');

  wsDashboard.getRow(6).height = 18;
  wsDashboard.getRow(7).height = 20;
  wsDashboard.getRow(8).height = 18;

  // Summary Table in Dashboard (Rows 10 to 18)
  wsDashboard.mergeCells('A10:G10');
  const tblH1 = wsDashboard.getCell('A10');
  tblH1.value = 'CURRICULUM METRIC BREAKDOWN';
  tblH1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  tblH1.fill = primaryHeaderFill;
  tblH1.alignment = { horizontal: 'center', vertical: 'middle' };

  wsDashboard.mergeCells('I10:N10');
  const tblH2 = wsDashboard.getCell('I10');
  tblH2.value = 'PROGRAM DISTRIBUTION OVERVIEW';
  tblH2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  tblH2.fill = primaryHeaderFill;
  tblH2.alignment = { horizontal: 'center', vertical: 'middle' };

  const summaryMetrics = [
    { kpi: 'Total Training Programs', val: totalPrograms, status: `${activePrograms} Active` },
    { kpi: 'Total Instructional Modules', val: totalModules, status: `${activeModules} Active` },
    { kpi: 'Total Course Relationships', val: courses.length, status: `${groupedCoursesList.length} Unique Courses` },
    { kpi: 'Approved Courses', val: approvedCourses, status: `${totalCourses > 0 ? Math.round((approvedCourses / totalCourses) * 100) : 0}% Approved` },
    { kpi: 'Total Curriculum Duration', val: `${totalHoursNum} Hours`, status: totalHoursFormatted },
    { kpi: 'Excel Import Runs', val: importLogs.length, status: `${importLogs.filter(l => l.status === 'Success').length} Succeeded` },
  ];

  summaryMetrics.forEach((m, idx) => {
    const rowNum = 11 + idx;
    wsDashboard.mergeCells(`A${rowNum}:D${rowNum}`);
    const cellA = wsDashboard.getCell(`A${rowNum}`);
    cellA.value = m.kpi;
    cellA.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
    cellA.border = thinBorder;

    wsDashboard.mergeCells(`E${rowNum}:F${rowNum}`);
    const cellE = wsDashboard.getCell(`E${rowNum}`);
    cellE.value = m.val;
    cellE.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
    cellE.alignment = { horizontal: 'center' };
    cellE.border = thinBorder;

    const cellG = wsDashboard.getCell(`G${rowNum}`);
    cellG.value = m.status;
    cellG.font = { name: 'Arial', size: 9, color: { argb: 'FF059669' } };
    cellG.alignment = { horizontal: 'center' };
    cellG.border = thinBorder;
  });

  // Top Programs Distribution Table on Right Side (Rows 11 to 16)
  programs.slice(0, 6).forEach((p, idx) => {
    const rowNum = 11 + idx;
    const pCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
    const uniqueCourseCodes = Array.from(new Set(pCourses.map(c => c.courseCode.toUpperCase()))).length;
    const pModules = Array.from(new Set(pCourses.map(c => c.moduleCode.toUpperCase()))).length;

    wsDashboard.mergeCells(`I${rowNum}:K${rowNum}`);
    const cellI = wsDashboard.getCell(`I${rowNum}`);
    cellI.value = `${p.programCode} - ${p.programName}`;
    cellI.font = { name: 'Arial', size: 8, color: { argb: 'FF1E293B' } };
    cellI.border = thinBorder;

    const cellL = wsDashboard.getCell(`L${rowNum}`);
    cellL.value = `${pModules} Modules`;
    cellL.font = { name: 'Arial', size: 8, color: { argb: 'FF2563EB' } };
    cellL.alignment = { horizontal: 'center' };
    cellL.border = thinBorder;

    const cellM = wsDashboard.getCell(`M${rowNum}`);
    cellM.value = `${uniqueCourseCodes} Courses`;
    cellM.font = { name: 'Arial', size: 8, color: { argb: 'FF7C3AED' } };
    cellM.alignment = { horizontal: 'center' };
    cellM.border = thinBorder;

    const cellN = wsDashboard.getCell(`N${rowNum}`);
    cellN.value = p.status;
    cellN.font = { name: 'Arial', size: 8, bold: true, color: { argb: p.status === 'Active' ? 'FF10B981' : 'FF94A3B8' } };
    cellN.alignment = { horizontal: 'center' };
    cellN.border = thinBorder;
  });

  // Section Header for Visual Charts Block
  wsDashboard.mergeCells('A18:N18');
  const chartHeader = wsDashboard.getCell('A18');
  chartHeader.value = 'CURRICULUM ANALYTICAL CHARTS (EXECUTIVE DASHBOARD DRAWINGS)';
  chartHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  wsDashboard.getRow(18).height = 22;

  // Chart Grid configuration (3 x 2 grid of charts)
  // Row 1: Charts 1, 2, 3 at row 19
  // Row 2: Charts 4, 5, 6 at row 34
  const chartConfigs = [
    { id: 'training-chart-programs-status', col: 0, row: 19, name: '1. Programs by Status' },
    { id: 'training-chart-modules-status', col: 5, row: 19, name: '2. Modules by Status' },
    { id: 'training-chart-courses-status', col: 10, row: 19, name: '3. Courses by Status' },
    { id: 'training-chart-modules-by-program', col: 0, row: 34, name: '4. Modules by Program' },
    { id: 'training-chart-courses-by-program', col: 5, row: 34, name: '5. Courses by Program' },
    { id: 'training-chart-duration-by-program', col: 10, row: 34, name: '6. Training Duration by Program' },
  ];

  for (const c of chartConfigs) {
    const el = document.getElementById(c.id);
    if (el) {
      try {
        const canvas = await captureElementToCanvas(el);
        const imgBase64 = canvas.toDataURL('image/png');
        const imgId = wb.addImage({
          base64: imgBase64,
          extension: 'png'
        });
        wsDashboard.addImage(imgId, {
          tl: { col: c.col, row: c.row },
          ext: { width: 350, height: 230 }
        });
        console.log(`Successfully embedded chart image for ${c.name} into Training Dashboard`);
      } catch (err) {
        console.error(`Failed to capture chart image for ${c.name}:`, err);
      }
    } else {
      console.warn(`Training Chart element #${c.id} not found in DOM for ${c.name}`);
    }
  }

  // =========================================================================
  // 2. WORKSHEET 2: PROGRAMS
  // =========================================================================
  const wsPrograms = wb.addWorksheet('Programs', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsPrograms.columns = [
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 42 },
    { header: 'Description', key: 'description', width: 45 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Number of Modules', key: 'modulesCount', width: 20 },
    { header: 'Number of Courses', key: 'coursesCount', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 22 },
    { header: 'Updated At', key: 'updatedAt', width: 22 }
  ];

  programs.forEach(p => {
    const pCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
    const uniqueCourseCodes = Array.from(new Set(pCourses.map(c => c.courseCode.toUpperCase()))).length;
    const uniqueModuleCodes = Array.from(new Set(pCourses.map(c => c.moduleCode.toUpperCase()))).length;

    wsPrograms.addRow({
      programCode: p.programCode,
      programName: p.programName,
      description: p.programDescription || '—',
      status: p.status,
      modulesCount: uniqueModuleCodes,
      coursesCount: uniqueCourseCodes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  });

  wsPrograms.getRow(1).font = primaryHeaderFont;
  wsPrograms.getRow(1).fill = primaryHeaderFill;
  wsPrograms.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsPrograms.getRow(1).height = 24;
  wsPrograms.autoFilter = { from: 'A1', to: 'H1' };

  // =========================================================================
  // 3. WORKSHEET 3: MODULES
  // =========================================================================
  const wsModules = wb.addWorksheet('Modules', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsModules.columns = [
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Module Name', key: 'moduleName', width: 42 },
    { header: 'Duration', key: 'duration', width: 16 },
    { header: 'Duration in Hours', key: 'durationHours', width: 18 },
    { header: 'Delivery Mode', key: 'deliveryMode', width: 32 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Number of Courses', key: 'coursesCount', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 22 },
    { header: 'Updated At', key: 'updatedAt', width: 22 }
  ];

  modules.forEach(m => {
    const mCourses = courses.filter(c => c.moduleCode.toUpperCase() === m.moduleCode.toUpperCase());
    const uniqueCourses = Array.from(new Set(mCourses.map(c => c.courseCode.toUpperCase()))).length;
    const mins = parseDurationToMinutes(m.duration);
    const durationHours = Number((mins / 60).toFixed(2));
    const readableDuration = formatDurationDisplay(m.duration);

    wsModules.addRow({
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      duration: readableDuration,
      durationHours: durationHours,
      deliveryMode: m.deliveryMode || 'Classroom Training (Offline)',
      status: m.status,
      coursesCount: uniqueCourses,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    });
  });

  wsModules.getRow(1).font = primaryHeaderFont;
  wsModules.getRow(1).fill = primaryHeaderFill;
  wsModules.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsModules.getRow(1).height = 24;
  wsModules.autoFilter = { from: 'A1', to: 'I1' };

  // =========================================================================
  // 4. WORKSHEET 4: COURSES
  // =========================================================================
  const wsCourses = wb.addWorksheet('Courses', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsCourses.columns = [
    { header: 'Course Code', key: 'courseCode', width: 18 },
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 38 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Module Name', key: 'moduleName', width: 38 },
    { header: 'Delivery Day', key: 'deliveryDay', width: 14 },
    { header: 'Delivery Mode', key: 'deliveryMode', width: 30 },
    { header: 'Owner Role', key: 'ownerRole', width: 32 },
    { header: 'Course Status', key: 'courseStatus', width: 16 },
    { header: 'Pre-Assessment Code', key: 'preAssessmentCode', width: 22 },
    { header: 'Post-Assessment Code', key: 'postAssessmentCode', width: 22 },
    { header: 'Created At', key: 'createdAt', width: 22 },
    { header: 'Updated At', key: 'updatedAt', width: 22 }
  ];

  courses.forEach(c => {
    const prog = programMap.get(c.programCode.toUpperCase());
    const mod = moduleMap.get(c.moduleCode.toUpperCase());

    wsCourses.addRow({
      courseCode: c.courseCode,
      programCode: c.programCode,
      programName: prog?.programName || '—',
      moduleCode: c.moduleCode,
      moduleName: mod?.moduleName || '—',
      deliveryDay: Number(c.deliveryDay) || 1,
      deliveryMode: c.deliveryMode1 || mod?.deliveryMode || 'Classroom Training (Offline)',
      ownerRole: c.ownerRole || 'Manager - Learning & Development',
      courseStatus: c.courseStatus || 'Approved',
      preAssessmentCode: c.preAssessmentCode || '—',
      postAssessmentCode: c.postAssessmentCode || '—',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    });
  });

  wsCourses.getRow(1).font = primaryHeaderFont;
  wsCourses.getRow(1).fill = primaryHeaderFill;
  wsCourses.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsCourses.getRow(1).height = 24;
  wsCourses.autoFilter = { from: 'A1', to: 'M1' };

  // =========================================================================
  // 5. WORKSHEET 5: TRAINING STRUCTURE
  // =========================================================================
  const wsStructure = wb.addWorksheet('Training Structure', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsStructure.columns = [
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 38 },
    { header: 'Course Code', key: 'courseCode', width: 18 },
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Module Name', key: 'moduleName', width: 38 },
    { header: 'Delivery Day', key: 'deliveryDay', width: 14 },
    { header: 'Delivery Mode', key: 'deliveryMode', width: 30 },
    { header: 'Owner Role', key: 'ownerRole', width: 32 },
    { header: 'Course Status', key: 'courseStatus', width: 16 }
  ];

  // Sort by Program Code, Course Code, Delivery Day
  const sortedStructureCourses = [...courses].sort((a, b) => {
    const pCmp = a.programCode.localeCompare(b.programCode);
    if (pCmp !== 0) return pCmp;
    const cCmp = a.courseCode.localeCompare(b.courseCode);
    if (cCmp !== 0) return cCmp;
    return (Number(a.deliveryDay) || 0) - (Number(b.deliveryDay) || 0);
  });

  sortedStructureCourses.forEach(c => {
    const prog = programMap.get(c.programCode.toUpperCase());
    const mod = moduleMap.get(c.moduleCode.toUpperCase());

    wsStructure.addRow({
      programCode: c.programCode,
      programName: prog?.programName || '—',
      courseCode: c.courseCode,
      moduleCode: c.moduleCode,
      moduleName: mod?.moduleName || '—',
      deliveryDay: `Day ${c.deliveryDay}`,
      deliveryMode: c.deliveryMode1 || mod?.deliveryMode || 'Classroom Training (Offline)',
      ownerRole: c.ownerRole || 'Manager - Learning & Development',
      courseStatus: c.courseStatus || 'Approved'
    });
  });

  wsStructure.getRow(1).font = primaryHeaderFont;
  wsStructure.getRow(1).fill = primaryHeaderFill;
  wsStructure.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsStructure.getRow(1).height = 24;
  wsStructure.autoFilter = { from: 'A1', to: 'I1' };

  // =========================================================================
  // 6. WORKSHEET 6: PROGRAM ANALYSIS
  // =========================================================================
  const wsProgAnalysis = wb.addWorksheet('Program Analysis', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsProgAnalysis.columns = [
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 42 },
    { header: 'Total Modules', key: 'totalModules', width: 16 },
    { header: 'Total Courses', key: 'totalCourses', width: 16 },
    { header: 'Total Training Duration', key: 'totalDuration', width: 24 },
    { header: 'Duration (Hours)', key: 'durationHours', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Approved Courses', key: 'approvedCourses', width: 18 }
  ];

  programs.forEach(p => {
    const pCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
    const uniqueCourseCodes = Array.from(new Set(pCourses.map(c => c.courseCode.toUpperCase())));
    const uniqueModuleCodes = Array.from(new Set(pCourses.map(c => c.moduleCode.toUpperCase())));

    // Calculate total duration of modules linked to this program
    let progMinutes = 0;
    uniqueModuleCodes.forEach(mCode => {
      const m = moduleMap.get(mCode);
      if (m) {
        progMinutes += parseDurationToMinutes(m.duration);
      }
    });
    const progHours = Number((progMinutes / 60).toFixed(2));
    const progDurationFormatted = formatTotalHoursDisplay(progHours);

    // Count approved courses in this program
    const approvedCount = uniqueCourseCodes.filter(cCode => {
      const crs = pCourses.find(c => c.courseCode.toUpperCase() === cCode);
      return crs?.courseStatus === 'Approved' || crs?.courseStatus === 'Active';
    }).length;

    wsProgAnalysis.addRow({
      programCode: p.programCode,
      programName: p.programName,
      totalModules: uniqueModuleCodes.length,
      totalCourses: uniqueCourseCodes.length,
      totalDuration: progDurationFormatted,
      durationHours: progHours,
      status: p.status,
      approvedCourses: approvedCount
    });
  });

  wsProgAnalysis.getRow(1).font = primaryHeaderFont;
  wsProgAnalysis.getRow(1).fill = primaryHeaderFill;
  wsProgAnalysis.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsProgAnalysis.getRow(1).height = 24;
  wsProgAnalysis.autoFilter = { from: 'A1', to: 'H1' };

  // =========================================================================
  // 7. WORKSHEET 7: MODULE ANALYSIS
  // =========================================================================
  const wsModAnalysis = wb.addWorksheet('Module Analysis', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsModAnalysis.columns = [
    { header: 'Module Code', key: 'moduleCode', width: 18 },
    { header: 'Module Name', key: 'moduleName', width: 42 },
    { header: 'Duration', key: 'duration', width: 16 },
    { header: 'Duration in Hours', key: 'durationHours', width: 18 },
    { header: 'Number of Courses', key: 'coursesCount', width: 18 },
    { header: 'Programs Used In', key: 'programsUsed', width: 45 },
    { header: 'Delivery Mode', key: 'deliveryMode', width: 30 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  modules.forEach(m => {
    const mCourses = courses.filter(c => c.moduleCode.toUpperCase() === m.moduleCode.toUpperCase());
    const uniqueCourseCodes = Array.from(new Set(mCourses.map(c => c.courseCode.toUpperCase())));
    const uniqueProgramCodes = Array.from(new Set(mCourses.map(c => c.programCode.toUpperCase())));
    const programNames = uniqueProgramCodes
      .map(pCode => programMap.get(pCode)?.programName || pCode)
      .join(', ');

    const mins = parseDurationToMinutes(m.duration);
    const durationHours = Number((mins / 60).toFixed(2));
    const readableDuration = formatDurationDisplay(m.duration);

    wsModAnalysis.addRow({
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      duration: readableDuration,
      durationHours: durationHours,
      coursesCount: uniqueCourseCodes.length,
      programsUsed: programNames || 'None',
      deliveryMode: m.deliveryMode || 'Classroom Training (Offline)',
      status: m.status
    });
  });

  wsModAnalysis.getRow(1).font = primaryHeaderFont;
  wsModAnalysis.getRow(1).fill = primaryHeaderFill;
  wsModAnalysis.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsModAnalysis.getRow(1).height = 24;
  wsModAnalysis.autoFilter = { from: 'A1', to: 'H1' };

  // =========================================================================
  // 8. WORKSHEET 8: COURSE ANALYSIS
  // =========================================================================
  const wsCrsAnalysis = wb.addWorksheet('Course Analysis', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsCrsAnalysis.columns = [
    { header: 'Course Code', key: 'courseCode', width: 18 },
    { header: 'Program Code', key: 'programCode', width: 18 },
    { header: 'Program Name', key: 'programName', width: 38 },
    { header: 'Number of Modules', key: 'modulesCount', width: 18 },
    { header: 'Total Duration', key: 'totalDuration', width: 22 },
    { header: 'Duration in Hours', key: 'durationHours', width: 18 },
    { header: 'First Delivery Day', key: 'firstDay', width: 18 },
    { header: 'Last Delivery Day', key: 'lastDay', width: 18 },
    { header: 'Course Status', key: 'courseStatus', width: 16 },
    { header: 'Owner Role', key: 'ownerRole', width: 32 }
  ];

  groupedCoursesList.forEach(grp => {
    const days = grp.modules.map(m => m.deliveryDay).filter(d => typeof d === 'number' && !isNaN(d));
    const firstDay = days.length > 0 ? `Day ${Math.min(...days)}` : 'Day 1';
    const lastDay = days.length > 0 ? `Day ${Math.max(...days)}` : 'Day 1';

    let totalCourseMinutes = 0;
    grp.modules.forEach(m => {
      totalCourseMinutes += parseDurationToMinutes(m.duration);
    });
    const courseHours = Number((totalCourseMinutes / 60).toFixed(2));
    const courseDurationFormatted = formatTotalHoursDisplay(courseHours);
    const ownerRole = grp.modules[0]?.ownerRole || 'Manager - Learning & Development';

    wsCrsAnalysis.addRow({
      courseCode: grp.courseCode,
      programCode: grp.programCode,
      programName: grp.programName,
      modulesCount: grp.modulesCount,
      totalDuration: courseDurationFormatted,
      durationHours: courseHours,
      firstDay: firstDay,
      lastDay: lastDay,
      courseStatus: grp.status,
      ownerRole: ownerRole
    });
  });

  wsCrsAnalysis.getRow(1).font = primaryHeaderFont;
  wsCrsAnalysis.getRow(1).fill = primaryHeaderFill;
  wsCrsAnalysis.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsCrsAnalysis.getRow(1).height = 24;
  wsCrsAnalysis.autoFilter = { from: 'A1', to: 'J1' };

  // =========================================================================
  // 9. WORKSHEET 9: IMPORT HISTORY
  // =========================================================================
  const wsImportHistory = wb.addWorksheet('Import History', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });
  wsImportHistory.columns = [
    { header: 'Import Date', key: 'importDate', width: 22 },
    { header: 'File Name', key: 'fileName', width: 32 },
    { header: 'Imported By', key: 'importedBy', width: 20 },
    { header: 'Programs Added', key: 'programsAdded', width: 16 },
    { header: 'Programs Updated', key: 'programsUpdated', width: 18 },
    { header: 'Modules Added', key: 'modulesAdded', width: 16 },
    { header: 'Modules Updated', key: 'modulesUpdated', width: 18 },
    { header: 'Courses Added', key: 'coursesAdded', width: 16 },
    { header: 'Courses Updated', key: 'coursesUpdated', width: 18 },
    { header: 'Errors', key: 'errors', width: 12 },
    { header: 'Warnings', key: 'warnings', width: 12 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  importLogs.forEach(log => {
    const warningsCount = Array.isArray(log.details?.warnings) ? log.details.warnings.length : 0;

    wsImportHistory.addRow({
      importDate: log.importedAt || new Date().toISOString(),
      fileName: log.fileName,
      importedBy: log.importedBy,
      programsAdded: log.programsAdded,
      programsUpdated: log.programsUpdated,
      modulesAdded: log.modulesAdded,
      modulesUpdated: log.modulesUpdated,
      coursesAdded: log.coursesAdded,
      coursesUpdated: log.coursesUpdated,
      errors: log.errorsCount,
      warnings: warningsCount,
      status: log.status
    });
  });

  wsImportHistory.getRow(1).font = primaryHeaderFont;
  wsImportHistory.getRow(1).fill = primaryHeaderFill;
  wsImportHistory.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  wsImportHistory.getRow(1).height = 24;
  wsImportHistory.autoFilter = { from: 'A1', to: 'L1' };

  // =========================================================================
  // BUFFER GENERATION & BROWSER DOWNLOAD
  // =========================================================================
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = `CADEPLOY_Training_Management_Report_${dateStr}.xlsx`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(downloadUrl);

  console.log(`========== TRAINING EXCEL EXPORT COMPLETED: CADEPLOY_Training_Management_Report_${dateStr}.xlsx ==========`);
}

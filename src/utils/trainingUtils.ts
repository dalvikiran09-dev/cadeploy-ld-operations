import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  TrainingProgram, 
  TrainingModule, 
  TrainingCourse, 
  CourseGroup, 
  ParsedImportData, 
  ImportValidationIssue, 
  TrainingStatus,
  TrainingImportLog
} from '../types/training';

/**
 * Parses duration string (e.g., '01:30:00', '00:45:00', '2 hrs', '90 mins') into total minutes.
 */
export const parseDurationToMinutes = (duration?: string): number => {
  if (!duration) return 0;
  const str = duration.trim();

  // Pattern: HH:MM:SS or HH:MM
  const timeMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10) || 0;
    const minutes = parseInt(timeMatch[2], 10) || 0;
    const seconds = parseInt(timeMatch[3] || '0', 10) || 0;
    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  // Pattern with words like "1 hr 30 mins" or "2 hours" or "45 mins"
  let totalMin = 0;
  const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)s?/i);
  if (hrMatch) {
    totalMin += parseFloat(hrMatch[1]) * 60;
  }
  const minMatch = str.match(/(\d+)\s*(?:min|minute|m)s?/i);
  if (minMatch) {
    totalMin += parseInt(minMatch[1], 10);
  }

  if (totalMin > 0) return Math.round(totalMin);

  // If plain number (assumed hours if <= 24, else minutes)
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return num <= 12 ? Math.round(num * 60) : Math.round(num);
  }

  return 0;
};

/**
 * Formats duration clearly into user-friendly text:
 * Examples: '30 mins', '1 hr', '1 hr 30 mins', '2 hrs', '3 hrs', '4 hrs'
 */
export const formatDurationDisplay = (duration?: string): string => {
  if (!duration) return '0 mins';
  const totalMinutes = parseDurationToMinutes(duration);
  if (totalMinutes === 0) return duration || '0 mins';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} min${minutes > 1 ? 's' : ''}`;
  }
};

/**
 * Standardizes duration to HH:MM:SS format
 */
export const normalizeDurationToTimeStr = (duration?: string): string => {
  if (!duration) return '01:00:00';
  const totalMinutes = parseDurationToMinutes(duration);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

/**
 * Calculates total training hours across all modules (in decimal hours)
 */
export const calculateTotalTrainingHours = (modules: TrainingModule[]): number => {
  const totalMinutes = modules.reduce((acc, m) => {
    if (m.status === 'Inactive') return acc;
    return acc + parseDurationToMinutes(m.duration);
  }, 0);
  return Number((totalMinutes / 60).toFixed(1));
};

/**
 * Formats total hours into display string (e.g. '24.5 hrs')
 */
export const formatTotalHoursDisplay = (totalHours: number): string => {
  if (Number.isInteger(totalHours)) {
    return `${totalHours} hrs`;
  }
  return `${totalHours.toFixed(1)} hrs`;
};

/**
 * Auto-generates next code in the standard 10-digit zero-padded format
 * PRG0000000001, MDL0000000001, CRS0000000001
 */
export const getNextProgramCode = (existingPrograms: TrainingProgram[]): string => {
  let maxNum = 0;
  for (const p of existingPrograms) {
    const match = p.programCode?.match(/^PRG(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `PRG${String(nextNum).padStart(10, '0')}`;
};

export const getNextModuleCode = (existingModules: TrainingModule[]): string => {
  let maxNum = 0;
  for (const m of existingModules) {
    const match = m.moduleCode?.match(/^MDL(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `MDL${String(nextNum).padStart(10, '0')}`;
};

export const getNextCourseCode = (existingCourses: TrainingCourse[]): string => {
  let maxNum = 0;
  for (const c of existingCourses) {
    const match = c.courseCode?.match(/^CRS(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `CRS${String(nextNum).padStart(10, '0')}`;
};

/**
 * Groups Course records by CourseCode since Course Name is not required.
 */
export const groupCourses = (
  courses: TrainingCourse[],
  programs: TrainingProgram[],
  modules: TrainingModule[]
): CourseGroup[] => {
  const programMap = new Map(programs.map(p => [p.programCode.toUpperCase(), p]));
  const moduleMap = new Map(modules.map(m => [m.moduleCode.toUpperCase(), m]));

  const groupMap = new Map<string, CourseGroup>();

  for (const c of courses) {
    const cCode = c.courseCode.trim().toUpperCase();
    const pCode = c.programCode.trim().toUpperCase();
    const mCode = c.moduleCode.trim().toUpperCase();

    const prog = programMap.get(pCode);
    const mod = moduleMap.get(mCode);

    if (!groupMap.has(cCode)) {
      groupMap.set(cCode, {
        courseCode: c.courseCode,
        programCode: c.programCode,
        programName: prog?.programName || 'Unknown Program',
        status: c.courseStatus || 'Approved',
        modulesCount: 0,
        modules: []
      });
    }

    const grp = groupMap.get(cCode)!;
    grp.modules.push({
      id: c.id,
      moduleCode: c.moduleCode,
      moduleName: mod?.moduleName || 'Unknown Module',
      duration: mod?.duration,
      deliveryDay: Number(c.deliveryDay) || 1,
      deliveryMode: c.deliveryMode1 || mod?.deliveryMode || 'Classroom Training (Offline)',
      ownerRole: c.ownerRole || 'Manager - Learning & Development',
      status: c.courseStatus || 'Approved',
      preAssessmentCode: c.preAssessmentCode,
      postAssessmentCode: c.postAssessmentCode,
      courseRecord: c
    });
  }

  // Sort modules inside each group by delivery day, and calculate duration
  const result: CourseGroup[] = [];
  for (const grp of groupMap.values()) {
    grp.modules.sort((a, b) => a.deliveryDay - b.deliveryDay);
    grp.modulesCount = grp.modules.length;

    const totalMinutes = grp.modules.reduce((sum, m) => sum + parseDurationToMinutes(m.duration), 0);
    const totalHours = totalMinutes / 60;
    grp.totalDurationFormatted = formatTotalHoursDisplay(totalHours);
    result.push(grp);
  }

  // Sort groups by courseCode
  return result.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
};

/**
 * Normalizes headers from Excel (strips spaces, punctuation, lowercase)
 */
export const normalizeHeader = (h: string): string => {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

// Aliases for canonical fields
const FIELD_ALIASES: Record<string, string[]> = {
  // Programs
  program_code: [
    'programcode', 'program code', 'program_code', 'programid', 'program id', 'program_id',
    'prgcode', 'prg code', 'prg_code', 'prg', 'tprgcode', 'tprg code', 'tprg_code', 'tprg',
    'program', 'code'
  ],
  program_name: [
    'programname', 'program_name', 'program name', 'programtitle', 'program title', 'program_title',
    'trainingprogram', 'training program', 'training_program', 'trainingprogramname',
    'training program name', 'training_program_name', 'coursetitle', 'course title', 'course_title',
    'prgname', 'prg_name', 'name', 'title', 'program'
  ],
  program_description: [
    'programdescription', 'program description', 'program_description', 'description', 'desc',
    'programdesc', 'program_desc', 'overview', 'summary'
  ],
  program_status: [
    'programstatus', 'program status', 'program_status', 'pstatus', 'status', 'state'
  ],

  // Modules
  module_code: [
    'modulecode', 'module code', 'module_code', 'moduleid', 'module id', 'module_id',
    'mdlcode', 'mdl code', 'mdl_code', 'mdl', 'module'
  ],
  module_name: [
    'modulename', 'module name', 'module_name', 'moduletitle', 'module title', 'module_title',
    'mdlname', 'mdl_name', 'sessionname', 'session title', 'topic', 'name', 'title'
  ],
  module_duration: [
    'duration', 'moduleduration', 'module duration', 'module_duration', 'time', 'hours',
    'traininghours', 'training hours', 'totalhours', 'total hours', 'length'
  ],
  module_delivery_mode: [
    'deliverymode', 'delivery mode', 'delivery_mode', 'moduledeliverymode', 'module delivery mode',
    'mode', 'trainingmode', 'training mode', 'type'
  ],
  module_status: [
    'modulestatus', 'module status', 'module_status', 'mstatus', 'status', 'state'
  ],

  // Courses
  course_code: [
    'coursecode', 'course code', 'course_code', 'courseid', 'course id', 'course_id',
    'crscode', 'crs code', 'crs_code', 'crs', 'course'
  ],
  course_delivery_mode_1: [
    'deliverymode1', 'delivery mode 1', 'delivery_mode_1', 'deliverymode', 'delivery mode', 'delivery_mode'
  ],
  course_delivery_mode_2: [
    'deliverymode2', 'delivery mode 2', 'delivery_mode_2'
  ],
  course_delivery_mode_3: [
    'deliverymode3', 'delivery mode 3', 'delivery_mode_3'
  ],
  delivery_day: [
    'deliveryday', 'delivery day', 'delivery_day', 'day', 'dayno', 'day no', 'day_no',
    'scheduleday', 'sessionday'
  ],
  owner_role: [
    'ownerrole', 'owner role', 'owner_role', 'owner', 'trainer', 'role',
    'trainerrole', 'faculty', 'instructor'
  ],
  course_status: [
    'coursestatus', 'course status', 'course_status', 'status', 'state'
  ],
  pre_assessment_code: [
    'preassessmentcode', 'pre assessment code', 'pre_assessment_code', 'pre-assessmentcode',
    'pre-assessment code', 'preassessment', 'pre assessment', 'pre_assessment', 'pretest', 'pre_test'
  ],
  post_assessment_code: [
    'postassessmentcode', 'post assessment code', 'post_assessment_code', 'post-assessmentcode',
    'post-assessment code', 'postassessment', 'post assessment', 'post_assessment', 'posttest', 'post_test'
  ]
};

interface DetectedColumn {
  colIdx: number;
  rawHeader: string;
  normHeader: string;
}

/**
 * Parses uploaded Excel workbook and extracts Programs, Modules, and Courses
 */
export const parseTrainingExcelFile = async (
  file: File,
  existingPrograms: TrainingProgram[],
  existingModules: TrainingModule[],
  existingCourses: TrainingCourse[]
): Promise<ParsedImportData> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const existingProgramCodeMap = new Map(existingPrograms.map(p => [p.programCode.toUpperCase(), p]));
  const existingModuleCodeMap = new Map(existingModules.map(m => [m.moduleCode.toUpperCase(), m]));
  const existingCourseKeyMap = new Map(
    existingCourses.map(c => [`${c.courseCode.toUpperCase()}_${c.programCode.toUpperCase()}_${c.moduleCode.toUpperCase()}`, c])
  );

  const parsedPrograms: ParsedImportData['programs'] = [];
  const parsedModules: ParsedImportData['modules'] = [];
  const parsedCourses: ParsedImportData['courses'] = [];
  const issues: ImportValidationIssue[] = [];

  const seenProgramCodes = new Set<string>();
  const seenModuleCodes = new Set<string>();
  const seenCourseKeys = new Set<string>();

  // Diagnostic tracking
  let firstDetectedProgramCodeCol: string | null = null;
  let firstDetectedProgramNameCol: string | null = null;

  // Process each worksheet in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to 2D array with defval '' to inspect exact structure
    const rawGrid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
    if (!rawGrid || rawGrid.length === 0) continue;

    // 1. Scan candidate rows (0 to min(25, rawGrid.length - 1)) to detect the best header row
    let bestHeaderRowIdx = -1;
    let bestMatchScore = 0;
    let bestColMap: Record<string, DetectedColumn> = {};

    const maxHeaderScan = Math.min(25, rawGrid.length);
    for (let r = 0; r < maxHeaderScan; r++) {
      const row = rawGrid[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const currentCols: { colIdx: number; rawHeader: string; normHeader: string }[] = [];
      row.forEach((cellVal, cIdx) => {
        const rawStr = String(cellVal ?? '').trim();
        if (rawStr) {
          currentCols.push({
            colIdx: cIdx,
            rawHeader: rawStr,
            normHeader: normalizeHeader(rawStr)
          });
        }
      });

      if (currentCols.length === 0) continue;

      // Match against canonical aliases with specific priority
      const candidateColMap: Record<string, DetectedColumn> = {};
      let score = 0;

      // Pass 1: Specific matches first (e.g. 'programname', 'modulename', 'coursecode')
      for (const [canonicalField, aliases] of Object.entries(FIELD_ALIASES)) {
        // Exclude purely generic aliases in Pass 1 if compound exists
        const specificAliases = aliases.filter(a => a !== 'name' && a !== 'title' && a !== 'code' && a !== 'status' && a !== 'program' && a !== 'module' && a !== 'course');
        for (const col of currentCols) {
          if (specificAliases.some(alias => normalizeHeader(alias) === col.normHeader)) {
            if (!candidateColMap[canonicalField]) {
              candidateColMap[canonicalField] = col;
              score += (canonicalField.includes('code') || canonicalField.includes('name')) ? 5 : 2;
            }
          }
        }
      }

      // Pass 2: Contextual fallback for generic names if specific not matched
      const isProgramsSheet = normalizeHeader(sheetName).includes('program');
      const isModulesSheet = normalizeHeader(sheetName).includes('module');
      const isCoursesSheet = normalizeHeader(sheetName).includes('course');

      for (const col of currentCols) {
        // Program Code fallback
        if (!candidateColMap.program_code && (col.normHeader === 'code' || col.normHeader === 'program' || col.normHeader === 'programid') && !isModulesSheet && !isCoursesSheet) {
          candidateColMap.program_code = col;
          score += 3;
        }
        // Program Name fallback
        if (!candidateColMap.program_name && (col.normHeader === 'name' || col.normHeader === 'title' || col.normHeader === 'program') && (isProgramsSheet || !candidateColMap.module_name)) {
          if (!candidateColMap.module_code || isProgramsSheet) {
            candidateColMap.program_name = col;
            score += 3;
          }
        }
        // Module Code fallback
        if (!candidateColMap.module_code && (col.normHeader === 'code' || col.normHeader === 'module') && isModulesSheet) {
          candidateColMap.module_code = col;
          score += 3;
        }
        // Module Name fallback
        if (!candidateColMap.module_name && (col.normHeader === 'name' || col.normHeader === 'title' || col.normHeader === 'topic') && isModulesSheet) {
          candidateColMap.module_name = col;
          score += 3;
        }
        // Course Code fallback
        if (!candidateColMap.course_code && (col.normHeader === 'code' || col.normHeader === 'course') && isCoursesSheet) {
          candidateColMap.course_code = col;
          score += 3;
        }
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestHeaderRowIdx = r;
        bestColMap = candidateColMap;
      }
    }

    // If no reasonable header row was detected (or sheet is empty), continue to next sheet
    if (bestHeaderRowIdx === -1 || bestMatchScore < 2) {
      continue;
    }

    const headerRowIdx = bestHeaderRowIdx;
    const colMap = bestColMap;

    if (colMap.program_code && !firstDetectedProgramCodeCol) {
      firstDetectedProgramCodeCol = colMap.program_code.rawHeader;
    }
    if (colMap.program_name && !firstDetectedProgramNameCol) {
      firstDetectedProgramNameCol = colMap.program_name.rawHeader;
    }

    // 2. Validate sheet structure for Program Name column presence
    const hasProgramsOnSheet = Boolean(colMap.program_code);
    const hasProgramNameCol = Boolean(colMap.program_name);

    if (hasProgramsOnSheet && !hasProgramNameCol) {
      // Worksheet has program codes but no recognized Program Name column at all
      issues.push({
        type: 'error',
        entity: 'Program',
        row: headerRowIdx + 1,
        message: 'Programs worksheet does not contain a recognized Program Name column.'
      });
    }

    const hasModulesOnSheet = Boolean(colMap.module_code);
    const hasModuleNameCol = Boolean(colMap.module_name);

    if (hasModulesOnSheet && !hasModuleNameCol) {
      issues.push({
        type: 'error',
        entity: 'Module',
        row: headerRowIdx + 1,
        message: 'Modules worksheet does not contain a recognized Module Name column.'
      });
    }

    // 3. Process Data Rows
    for (let rIdx = headerRowIdx + 1; rIdx < rawGrid.length; rIdx++) {
      const row = rawGrid[rIdx];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rowNum = rIdx + 1; // 1-based index matching Excel row numbers

      // PROGRAM ENTITY PROCESSING
      if (hasProgramsOnSheet) {
        const rawProgramCode = String(row[colMap.program_code.colIdx] ?? '').trim();
        if (rawProgramCode) {
          const pCodeUpper = rawProgramCode.toUpperCase();
          if (!seenProgramCodes.has(pCodeUpper)) {
            seenProgramCodes.add(pCodeUpper);

            const rawProgramName = hasProgramNameCol ? String(row[colMap.program_name.colIdx] ?? '').trim() : '';
            const rawProgramDesc = colMap.program_description ? String(row[colMap.program_description.colIdx] ?? '').trim() : '';
            const rawProgramStatus = colMap.program_status ? String(row[colMap.program_status.colIdx] ?? '').trim() : 'Active';

            // If the Program Name column exists but this particular row is blank:
            if (hasProgramNameCol && !rawProgramName) {
              issues.push({
                type: 'warning',
                entity: 'Program',
                row: rowNum,
                code: rawProgramCode,
                field: 'ProgramName',
                message: `Program ${rawProgramCode} on row ${rowNum} is missing a Program Name.`
              });
            }

            const validStatus: TrainingStatus = ['Active', 'Inactive', 'Draft', 'Archived'].includes(rawProgramStatus)
              ? (rawProgramStatus as TrainingStatus)
              : 'Active';

            const existingP = existingProgramCodeMap.get(pCodeUpper);
            // Do NOT use Program Code as fallback name!
            const finalProgramName = rawProgramName || (existingP ? existingP.programName : '');

            parsedPrograms.push({
              row: rowNum,
              programCode: rawProgramCode,
              programName: finalProgramName,
              programDescription: rawProgramDesc || (existingP?.programDescription) || undefined,
              status: validStatus,
              isExisting: existingProgramCodeMap.has(pCodeUpper)
            });
          }
        }
      }

      // MODULE ENTITY PROCESSING
      if (hasModulesOnSheet) {
        const rawModuleCode = String(row[colMap.module_code.colIdx] ?? '').trim();
        if (rawModuleCode) {
          const mCodeUpper = rawModuleCode.toUpperCase();
          if (!seenModuleCodes.has(mCodeUpper)) {
            seenModuleCodes.add(mCodeUpper);

            const rawModuleName = hasModuleNameCol ? String(row[colMap.module_name.colIdx] ?? '').trim() : '';
            const rawDuration = colMap.module_duration ? String(row[colMap.module_duration.colIdx] ?? '').trim() : '';
            const rawDeliveryMode = colMap.module_delivery_mode ? String(row[colMap.module_delivery_mode.colIdx] ?? '').trim() : '';
            const rawModuleStatus = colMap.module_status ? String(row[colMap.module_status.colIdx] ?? '').trim() : 'Active';

            if (hasModuleNameCol && !rawModuleName && !existingModuleCodeMap.has(mCodeUpper)) {
              issues.push({
                type: 'error',
                entity: 'Module',
                row: rowNum,
                code: rawModuleCode,
                field: 'ModuleName',
                message: `Module ${rawModuleCode} on row ${rowNum} is missing required Module Name.`
              });
            }

            const validStatus: TrainingStatus = ['Active', 'Inactive', 'Draft', 'Archived'].includes(rawModuleStatus)
              ? (rawModuleStatus as TrainingStatus)
              : 'Active';

            const existingM = existingModuleCodeMap.get(mCodeUpper);
            parsedModules.push({
              row: rowNum,
              moduleCode: rawModuleCode,
              moduleName: rawModuleName || (existingM ? existingM.moduleName : rawModuleCode),
              duration: rawDuration ? normalizeDurationToTimeStr(rawDuration) : (existingM?.duration || '01:00:00'),
              deliveryMode: rawDeliveryMode || existingM?.deliveryMode || 'Classroom Training (Offline)',
              status: validStatus,
              isExisting: existingModuleCodeMap.has(mCodeUpper)
            });
          }
        }
      }

      // COURSE ENTITY PROCESSING (Links Program & Module)
      if (colMap.course_code) {
        const rawCourseCode = String(row[colMap.course_code.colIdx] ?? '').trim();
        if (rawCourseCode) {
          const rawCourseProgramCode = colMap.program_code ? String(row[colMap.program_code.colIdx] ?? '').trim() : '';
          const rawCourseModuleCode = colMap.module_code ? String(row[colMap.module_code.colIdx] ?? '').trim() : '';

          if (!rawCourseProgramCode) {
            issues.push({
              type: 'error',
              entity: 'Course',
              row: rowNum,
              code: rawCourseCode,
              field: 'ProgramCode',
              message: `Course ${rawCourseCode} on row ${rowNum} is missing ProgramCode reference.`
            });
          }
          if (!rawCourseModuleCode) {
            issues.push({
              type: 'error',
              entity: 'Course',
              row: rowNum,
              code: rawCourseCode,
              field: 'ModuleCode',
              message: `Course ${rawCourseCode} on row ${rowNum} is missing ModuleCode reference.`
            });
          }

          if (rawCourseProgramCode && rawCourseModuleCode) {
            const courseKey = `${rawCourseCode.toUpperCase()}_${rawCourseProgramCode.toUpperCase()}_${rawCourseModuleCode.toUpperCase()}`;
            if (seenCourseKeys.has(courseKey)) {
              issues.push({
                type: 'warning',
                entity: 'Course',
                row: rowNum,
                code: rawCourseCode,
                message: `Duplicate Course + Program + Module combination (${rawCourseCode} - ${rawCourseProgramCode} - ${rawCourseModuleCode}) on row ${rowNum}. Only first occurrence will be processed.`
              });
            } else {
              seenCourseKeys.add(courseKey);

              const rawDeliveryDay = colMap.delivery_day ? String(row[colMap.delivery_day.colIdx] ?? '').trim() : '1';
              let deliveryDay = parseInt(rawDeliveryDay, 10);
              if (isNaN(deliveryDay) || deliveryDay <= 0) {
                deliveryDay = 1;
              }

              const deliveryMode1 = colMap.course_delivery_mode_1 ? String(row[colMap.course_delivery_mode_1.colIdx] ?? '').trim() : '';
              const deliveryMode2 = colMap.course_delivery_mode_2 ? String(row[colMap.course_delivery_mode_2.colIdx] ?? '').trim() : '';
              const deliveryMode3 = colMap.course_delivery_mode_3 ? String(row[colMap.course_delivery_mode_3.colIdx] ?? '').trim() : '';
              const ownerRole = colMap.owner_role ? String(row[colMap.owner_role.colIdx] ?? '').trim() : 'Manager - Learning & Development';
              const courseStatus = colMap.course_status ? String(row[colMap.course_status.colIdx] ?? '').trim() : 'Approved';
              const preAssessment = colMap.pre_assessment_code ? String(row[colMap.pre_assessment_code.colIdx] ?? '').trim() : '';
              const postAssessment = colMap.post_assessment_code ? String(row[colMap.post_assessment_code.colIdx] ?? '').trim() : '';

              parsedCourses.push({
                row: rowNum,
                courseCode: rawCourseCode,
                programCode: rawCourseProgramCode,
                moduleCode: rawCourseModuleCode,
                deliveryMode1: deliveryMode1 || 'Classroom Training (Offline)',
                deliveryMode2: deliveryMode2 || undefined,
                deliveryMode3: deliveryMode3 || undefined,
                deliveryDay: deliveryDay,
                ownerRole: ownerRole || 'Manager - Learning & Development',
                courseStatus: courseStatus || 'Approved',
                preAssessmentCode: preAssessment || undefined,
                postAssessmentCode: postAssessment || undefined,
                isExisting: existingCourseKeyMap.has(courseKey)
              });
            }
          }
        }
      }
    }
  }

  // Cross-reference integrity check:
  // Every course must reference a Program that either exists in DB or is being imported
  const allProgramCodes = new Set([
    ...Array.from(existingProgramCodeMap.keys()),
    ...parsedPrograms.map(p => p.programCode.toUpperCase())
  ]);

  const allModuleCodes = new Set([
    ...Array.from(existingModuleCodeMap.keys()),
    ...parsedModules.map(m => m.moduleCode.toUpperCase())
  ]);

  for (const crs of parsedCourses) {
    if (!allProgramCodes.has(crs.programCode.toUpperCase())) {
      issues.push({
        type: 'error',
        entity: 'Course',
        row: crs.row,
        code: crs.courseCode,
        field: 'ProgramCode',
        message: `Course ${crs.courseCode} cannot be imported. Program ${crs.programCode} was not found in the database or import file.`
      });
    }

    if (!allModuleCodes.has(crs.moduleCode.toUpperCase())) {
      issues.push({
        type: 'error',
        entity: 'Course',
        row: crs.row,
        code: crs.courseCode,
        field: 'ModuleCode',
        message: `Course ${crs.courseCode} cannot be imported. Module ${crs.moduleCode} was not found in the database or import file.`
      });
    }
  }

  // Diagnostic logging per specification
  const programsMissingNameCount = parsedPrograms.filter(p => !p.programName).length;
  console.log('========== PROGRAM IMPORT ==========');
  console.log('Detected Program Code Column:', firstDetectedProgramCodeCol || 'NONE');
  console.log('Detected Program Name Column:', firstDetectedProgramNameCol || 'NONE');
  console.log('\nFirst Program Record:', parsedPrograms.length > 0 ? {
    programCode: parsedPrograms[0].programCode,
    programName: parsedPrograms[0].programName
  } : 'No programs parsed');
  console.log('\nTotal Programs:', parsedPrograms.length);
  console.log('Programs Missing Name:', programsMissingNameCount);
  console.log('====================================');

  return {
    programs: parsedPrograms,
    modules: parsedModules,
    courses: parsedCourses,
    issues: issues
  };
};

/**
 * Generates an Excel workbook template with sample data for Programs, Modules, and Courses
 */
export const generateTrainingSampleExcel = async (): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CADEPLOY L&D System';
  workbook.created = new Date();

  // Primary Unified Template Sheet
  const wsUnified = workbook.addWorksheet('Training Matrix (All in One)');

  wsUnified.columns = [
    { header: 'ProgramCode', key: 'programCode', width: 18 },
    { header: 'ProgramName', key: 'programName', width: 45 },
    { header: 'Program Description', key: 'programDescription', width: 45 },
    { header: 'ModuleCode', key: 'moduleCode', width: 18 },
    { header: 'ModuleName', key: 'moduleName', width: 45 },
    { header: 'Duration', key: 'duration', width: 14 },
    { header: 'CourseCode', key: 'courseCode', width: 18 },
    { header: 'DeliveryDay', key: 'deliveryDay', width: 14 },
    { header: 'DeliveryMode', key: 'deliveryMode', width: 30 },
    { header: 'OwnerRole', key: 'ownerRole', width: 35 },
    { header: 'CourseStatus', key: 'courseStatus', width: 16 },
    { header: 'Pre-AssessmentCode', key: 'preAssessmentCode', width: 22 },
    { header: 'Post-AssessmentCode', key: 'postAssessmentCode', width: 22 }
  ];

  // Style Header
  const headerRow = wsUnified.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample Rows matching source structure
  const sampleRows = [
    {
      programCode: 'PRG0000000038',
      programName: 'Advanced Fabrication & Detailing Workflow',
      programDescription: 'High-level advanced fabrication workflows and connection details',
      moduleCode: 'MDL0000000010',
      moduleName: 'Bolted Moment Connection Modeling',
      duration: '04:00:00',
      courseCode: 'CRS0000000006',
      deliveryDay: 1,
      deliveryMode: 'Classroom Training (Offline)',
      ownerRole: 'Manager - Learning & Development',
      courseStatus: 'Approved',
      preAssessmentCode: 'PRE-FAB-01',
      postAssessmentCode: 'POST-FAB-01'
    },
    {
      programCode: 'PRG0000000038',
      programName: 'Advanced Fabrication & Detailing Workflow',
      programDescription: 'High-level advanced fabrication workflows and connection details',
      moduleCode: 'MDL0000000011',
      moduleName: 'Shear Tab & Standard Clip Angle Details',
      duration: '03:00:00',
      courseCode: 'CRS0000000006',
      deliveryDay: 8,
      deliveryMode: 'Classroom Training (Offline)',
      ownerRole: 'Manager - Learning & Development',
      courseStatus: 'Approved',
      preAssessmentCode: 'PRE-FAB-02',
      postAssessmentCode: 'POST-FAB-02'
    },
    {
      programCode: 'PRG0000000038',
      programName: 'Advanced Fabrication & Detailing Workflow',
      programDescription: 'High-level advanced fabrication workflows and connection details',
      moduleCode: 'MDL0000000012',
      moduleName: 'Quality Inspection Checklist & Clashing Check',
      duration: '02:30:00',
      courseCode: 'CRS0000000006',
      deliveryDay: 15,
      deliveryMode: 'Classroom Training (Offline)',
      ownerRole: 'Manager - Learning & Development',
      courseStatus: 'Approved',
      preAssessmentCode: 'PRE-FAB-03',
      postAssessmentCode: 'POST-FAB-03'
    },
    {
      programCode: 'PRG0000000003',
      programName: 'Tekla/SDS2 - Bolting Standards & Application for Editors',
      programDescription: 'Specialized editor-level training focusing on bolting standards',
      moduleCode: 'MDL0000000005',
      moduleName: 'Structural Steel Shapes & Section Properties',
      duration: '02:00:00',
      courseCode: 'CRS0000000003',
      deliveryDay: 1,
      deliveryMode: 'Classroom Training (Offline)',
      ownerRole: 'Manager - Learning & Development',
      courseStatus: 'Approved',
      preAssessmentCode: 'PRE-BLT-01',
      postAssessmentCode: 'POST-BLT-01'
    }
  ];

  sampleRows.forEach(row => {
    wsUnified.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Downloads import log as a text / JSON file
 */
export const downloadImportLogFile = (log: TrainingImportLog) => {
  const content = JSON.stringify(log, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `training_import_log_${log.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

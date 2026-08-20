import { 
  TrainingAssessment, 
  TrainingPKT, 
  TrainingEmployee, 
  EmployeeConsolidatedRecord, 
  PKTAttemptHistory, 
  PrePostComparison,
  AssessmentImportRow,
  PKTImportRow,
  AssessmentType,
  AssessmentResult,
  PKTResult
} from '../types/assessment';
import { TrainingBatch, TrainingAttendanceRecord, BatchNominee } from '../types/batch';
import { TrainingProgram, TrainingModule } from '../types/training';
import * as XLSX from 'xlsx';

/**
 * Calculate percentage score safely
 */
export function calculatePercentage(scoreObtained: number, maximumScore: number): number {
  if (!maximumScore || maximumScore <= 0) return 0;
  const pct = (Number(scoreObtained) / Number(maximumScore)) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determine pass/fail result based on score threshold
 */
export function determineResult(score: number, maxScore: number, passThresholdPercent = 70): AssessmentResult {
  const pct = calculatePercentage(score, maxScore);
  return pct >= passThresholdPercent ? 'Pass' : 'Fail';
}

/**
 * Calculate pre vs post score improvement
 */
export function calculateScoreImprovement(prePct: number, postPct: number): number {
  return Math.round((Number(postPct) - Number(prePct)) * 10) / 10;
}

/**
 * Group PKTs by unique key (employee + program + module + batch) and track historical attempts
 */
export function groupPKTAttempts(pkts: TrainingPKT[] = []): PKTAttemptHistory[] {
  const groups = new Map<string, TrainingPKT[]>();
  const safePkts = pkts || [];

  for (const pkt of safePkts) {
    if (!pkt || pkt.deleted) continue;
    const key = `${(pkt.employeeCode || '').toUpperCase()}_${(pkt.programCode || '').toUpperCase()}_${(pkt.moduleCode || '').toUpperCase()}_${(pkt.batchCode || '').toUpperCase()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(pkt);
  }

  const result: PKTAttemptHistory[] = [];

  groups.forEach((items) => {
    // Sort by attempt number ascending
    const sorted = [...items].sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));
    const totalAttempts = sorted.length;
    const latestAttempt = sorted[sorted.length - 1];

    // Find best attempt by percentage
    let bestAttempt = sorted[0];
    for (const item of sorted) {
      if ((item.percentage || 0) > (bestAttempt.percentage || 0)) {
        bestAttempt = item;
      }
    }

    const hasPassed = sorted.some(a => a.result === 'Pass');
    const finalStatus: PKTResult = hasPassed ? 'Pass' : (latestAttempt?.result || 'Not Attempted');

    result.push({
      employeeCode: latestAttempt.employeeCode,
      programCode: latestAttempt.programCode,
      moduleCode: latestAttempt.moduleCode,
      batchCode: latestAttempt.batchCode,
      attempts: sorted,
      totalAttempts,
      latestAttempt,
      bestAttempt,
      finalStatus
    });
  });

  return result;
}

/**
 * Build consolidated training matrix row records
 */
export function buildConsolidatedRecords(
  employeeCode: string,
  employees: TrainingEmployee[] = [],
  programs: TrainingProgram[] = [],
  modules: TrainingModule[] = [],
  batches: TrainingBatch[] = [],
  nominees: BatchNominee[] = [],
  attendance: TrainingAttendanceRecord[] = [],
  assessments: TrainingAssessment[] = [],
  pkts: TrainingPKT[] = []
): EmployeeConsolidatedRecord[] {
  const safeEmployees = employees || [];
  const safePrograms = programs || [];
  const safeModules = modules || [];
  const safeBatches = batches || [];
  const safeNominees = nominees || [];
  const safeAttendance = attendance || [];
  const safeAssessments = assessments || [];
  const safePkts = pkts || [];

  const empCode = (employeeCode || '').trim().toUpperCase();
  const emp = safeEmployees.find(e => e.employeeCode && e.employeeCode.toUpperCase() === empCode);
  const empName = emp?.employeeName || empCode;
  const empDept = emp?.department || 'Operations';

  // Find all batch nominations for this employee
  const empNominees = safeNominees.filter(n => n.employeeCode && n.employeeCode.toUpperCase() === empCode);
  const empAssessments = safeAssessments.filter(a => !a.deleted && a.employeeCode && a.employeeCode.toUpperCase() === empCode);
  const empPkts = safePkts.filter(p => !p.deleted && p.employeeCode && p.employeeCode.toUpperCase() === empCode);
  const empAttendance = safeAttendance.filter(a => a.employeeCode && a.employeeCode.toUpperCase() === empCode);

  const records: EmployeeConsolidatedRecord[] = [];

  // Group by (Program + Batch + Module)
  const entryKeys = new Set<string>();

  // 1. Gather keys from nominations & batches
  for (const nom of empNominees) {
    const batch = safeBatches.find(b => b.id === nom.batchId || (b.batchCode && nom.batchCode && b.batchCode.toUpperCase() === nom.batchCode.toUpperCase()));
    const progCode = batch?.programCode || 'PRG001';
    const prog = safePrograms.find(p => p.programCode && p.programCode.toUpperCase() === progCode.toUpperCase());
    const progName = prog?.programName || batch?.programName || progCode;
    const batchCode = batch?.batchCode || nom.batchCode || 'BTCH001';

    // Check attendance modules
    const batchAttendance = empAttendance.filter(a => 
      (batch?.id && a.batchId === batch.id) || 
      (a.batchCode && a.batchCode.toUpperCase() === batchCode.toUpperCase())
    );

    const moduleCodes = new Set<string>();
    batchAttendance.forEach(a => { if (a.moduleCode) moduleCodes.add(a.moduleCode.toUpperCase()); });
    
    // Also add modules from assessments or pkts for this batch
    empAssessments
      .filter(a => (a.batchCode && a.batchCode.toUpperCase() === batchCode.toUpperCase()) || a.batchId === batch?.id)
      .forEach(a => { if (a.moduleCode) moduleCodes.add(a.moduleCode.toUpperCase()); });

    empPkts
      .filter(p => (p.batchCode && p.batchCode.toUpperCase() === batchCode.toUpperCase()) || p.batchId === batch?.id)
      .forEach(p => { if (p.moduleCode) moduleCodes.add(p.moduleCode.toUpperCase()); });

    if (moduleCodes.size === 0) {
      moduleCodes.add('GENERAL');
    }

    moduleCodes.forEach(modCode => {
      const compositeKey = `${progCode}_${batchCode}_${modCode}`;
      if (!entryKeys.has(compositeKey)) {
        entryKeys.add(compositeKey);

        const mod = safeModules.find(m => m.moduleCode && m.moduleCode.toUpperCase() === modCode);
        const modName = mod?.moduleName || (modCode === 'GENERAL' ? 'All Modules' : modCode);

        // Find relevant attendance
        const modAtt = batchAttendance.filter(a => a.moduleCode?.toUpperCase() === modCode || modCode === 'GENERAL');
        const presentCount = modAtt.filter(a => a.status === 'Present').length;
        const totalAttCount = modAtt.length;
        const attRate = totalAttCount > 0 ? Math.round((presentCount / totalAttCount) * 100) : undefined;
        const attStatus = totalAttCount === 0 
          ? 'Not Marked' 
          : (presentCount === totalAttCount ? 'Present' : (presentCount > 0 ? 'Partial' : 'Absent'));

        // Find Pre-Assessment
        const preAss = empAssessments
          .filter(a => 
            a.programCode.toUpperCase() === progCode.toUpperCase() && 
            a.assessmentType.toLowerCase().includes('pre') &&
            (!a.moduleCode || a.moduleCode.toUpperCase() === modCode || modCode === 'GENERAL')
          )
          .sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];

        // Find Post-Assessment
        const postAss = empAssessments
          .filter(a => 
            a.programCode.toUpperCase() === progCode.toUpperCase() && 
            a.assessmentType.toLowerCase().includes('post') &&
            (!a.moduleCode || a.moduleCode.toUpperCase() === modCode || modCode === 'GENERAL')
          )
          .sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];

        // Calculate improvement
        let improvement: number | undefined = undefined;
        if (preAss && postAss) {
          improvement = calculateScoreImprovement(preAss.percentage, postAss.percentage);
        }

        // Find PKT attempts
        const modPkts = empPkts.filter(p => 
          p.programCode.toUpperCase() === progCode.toUpperCase() &&
          (!p.moduleCode || p.moduleCode.toUpperCase() === modCode || modCode === 'GENERAL')
        );

        let bestPkt: TrainingPKT | undefined = undefined;
        if (modPkts.length > 0) {
          bestPkt = [...modPkts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];
        }

        // Final result determination
        let finalResult: 'Pass' | 'Fail' | 'In Progress' | 'Not Attempted' = 'In Progress';
        if (postAss || bestPkt) {
          const postPass = !postAss || postAss.result === 'Pass';
          const pktPass = !bestPkt || bestPkt.result === 'Pass';
          if (postPass && pktPass) {
            finalResult = 'Pass';
          } else {
            finalResult = 'Fail';
          }
        } else if (attStatus === 'Not Marked') {
          finalResult = 'Not Attempted';
        }

        records.push({
          id: `${empCode}_${compositeKey}`,
          employeeCode: empCode,
          employeeName: empName,
          department: empDept,
          programCode: progCode,
          programName: progName,
          batchId: batch?.id,
          batchCode: batchCode,
          moduleId: mod?.id,
          moduleCode: modCode === 'GENERAL' ? '-' : modCode,
          moduleName: modName,
          attendanceStatus: attStatus,
          attendanceRate: attRate,
          preScore: preAss?.percentage,
          preResult: preAss?.result,
          postScore: postAss?.percentage,
          postResult: postAss?.result,
          improvement: improvement,
          pktScore: bestPkt?.percentage,
          pktResult: bestPkt?.result,
          pktAttemptNumber: bestPkt?.attemptNumber,
          pktTotalAttempts: modPkts.length,
          finalResult
        });
      }
    });
  }

  // Also include any standalone assessments or PKTs not tied to a batch nominee
  for (const ass of empAssessments) {
    const progCode = ass.programCode || 'PRG001';
    const batchCode = ass.batchCode || 'DIRECT';
    const modCode = ass.moduleCode || 'GENERAL';
    const compositeKey = `${progCode}_${batchCode}_${modCode}`;

    if (!entryKeys.has(compositeKey)) {
      entryKeys.add(compositeKey);
      const prog = programs.find(p => p.programCode.toUpperCase() === progCode.toUpperCase());
      const mod = modules.find(m => m.moduleCode.toUpperCase() === modCode.toUpperCase());

      records.push({
        id: `${empCode}_${compositeKey}`,
        employeeCode: empCode,
        employeeName: empName,
        department: empDept,
        programCode: progCode,
        programName: prog?.programName || ass.programName || progCode,
        batchCode: batchCode,
        moduleCode: modCode === 'GENERAL' ? '-' : modCode,
        moduleName: mod?.moduleName || ass.moduleName || modCode,
        attendanceStatus: 'Present',
        preScore: ass.assessmentType.toLowerCase().includes('pre') ? ass.percentage : undefined,
        preResult: ass.assessmentType.toLowerCase().includes('pre') ? ass.result : undefined,
        postScore: ass.assessmentType.toLowerCase().includes('post') ? ass.percentage : undefined,
        postResult: ass.assessmentType.toLowerCase().includes('post') ? ass.result : undefined,
        finalResult: ass.result === 'Pass' ? 'Pass' : 'Fail'
      });
    }
  }

  return records;
}

/**
 * Generate Excel Template for Assessment Import
 */
export function generateAssessmentImportTemplate(): void {
  const headers = [
    'Employee ID *',
    'Program Code *',
    'Module Code',
    'Batch Code',
    'Assessment Type *',
    'Assessment Date *',
    'Attempt Number',
    'Maximum Score *',
    'Score Obtained *',
    'Evaluator / Trainer',
    'Remarks'
  ];

  const sampleRows = [
    [
      'EMP001',
      'PRG0000000001',
      'MDL0000000001',
      'BTCH001',
      'Pre-Assessment',
      '15-Feb-2025',
      1,
      100,
      62,
      'Kiran Dalvi',
      'Initial baseline assessment'
    ],
    [
      'EMP001',
      'PRG0000000001',
      'MDL0000000001',
      'BTCH001',
      'Post-Assessment',
      '28-Feb-2025',
      1,
      100,
      86,
      'Kiran Dalvi',
      'Post training mastery achieved'
    ],
    [
      'EMP002',
      'PRG0000000001',
      'MDL0000000002',
      'BTCH001',
      'Final Assessment',
      '28-Feb-2025',
      1,
      50,
      44,
      'Anoz Panduri',
      'Cleared with distinction'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Assessments');
  XLSX.writeFile(wb, `CADEPLOY_Assessment_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Generate Excel Template for PKT Import
 */
export function generatePKTImportTemplate(): void {
  const headers = [
    'Employee ID *',
    'Program Code *',
    'Module Code',
    'Batch Code',
    'PKT Type',
    'PKT Date *',
    'Attempt Number *',
    'Maximum Score *',
    'Score Obtained *',
    'Evaluator',
    'Remarks'
  ];

  const sampleRows = [
    [
      'EMP001',
      'PRG0000000001',
      'MDL0000000001',
      'BTCH001',
      'Standard PKT',
      '18-Feb-2025',
      1,
      100,
      58,
      'Senior Lead Evaluator',
      'Needs revision on connection detailing'
    ],
    [
      'EMP001',
      'PRG0000000001',
      'MDL0000000001',
      'BTCH001',
      'Standard PKT',
      '25-Feb-2025',
      2,
      100,
      81,
      'Senior Lead Evaluator',
      'Attempt 2 Passed with strong performance'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PKTs');
  XLSX.writeFile(wb, `CADEPLOY_PKT_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Consolidated Training Records to Excel
 */
export function exportConsolidatedTrainingRecordsToExcel(
  records: EmployeeConsolidatedRecord[],
  fileName = 'CADEPLOY_Employee_Training_Records'
): void {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Program Code',
    'Program Name',
    'Batch Code',
    'Module Code',
    'Module Name',
    'Attendance Status',
    'Attendance %',
    'Pre-Assessment Score (%)',
    'Pre Result',
    'Post-Assessment Score (%)',
    'Post Result',
    'Learning Improvement (pts)',
    'Best PKT Score (%)',
    'PKT Result',
    'PKT Attempts',
    'Final Result'
  ];

  const rows = records.map(r => [
    r.employeeCode,
    r.employeeName,
    r.department,
    r.programCode,
    r.programName,
    r.batchCode,
    r.moduleCode,
    r.moduleName,
    r.attendanceStatus,
    r.attendanceRate !== undefined ? `${r.attendanceRate}%` : 'N/A',
    r.preScore !== undefined ? `${r.preScore}%` : '-',
    r.preResult || '-',
    r.postScore !== undefined ? `${r.postScore}%` : '-',
    r.postResult || '-',
    r.improvement !== undefined ? `${r.improvement > 0 ? '+' : ''}${r.improvement}%` : '-',
    r.pktScore !== undefined ? `${r.pktScore}%` : '-',
    r.pktResult || '-',
    r.pktTotalAttempts ? `${r.pktTotalAttempts} attempt(s)` : '-',
    r.finalResult
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Training Records');
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Assessments to Excel
 */
export function exportAssessmentsToExcel(
  assessments: TrainingAssessment[],
  fileName = 'CADEPLOY_Assessment_Results'
): void {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Program Code',
    'Program Name',
    'Module Code',
    'Module Name',
    'Batch Code',
    'Assessment Type',
    'Assessment Date',
    'Attempt #',
    'Max Score',
    'Score Obtained',
    'Percentage',
    'Result',
    'Evaluator',
    'Remarks'
  ];

  const rows = assessments
    .filter(a => !a.deleted)
    .map(a => [
      a.employeeCode,
      a.employeeName || '-',
      a.department || '-',
      a.programCode,
      a.programName || '-',
      a.moduleCode || '-',
      a.moduleName || '-',
      a.batchCode || '-',
      a.assessmentType,
      a.assessmentDate,
      a.attemptNumber || 1,
      a.maximumScore,
      a.scoreObtained,
      `${a.percentage}%`,
      a.result,
      a.evaluator || '-',
      a.remarks || '-'
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Assessments');
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export PKTs to Excel
 */
export function exportPKTsToExcel(
  pkts: TrainingPKT[],
  fileName = 'CADEPLOY_PKT_Results'
): void {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Program Code',
    'Program Name',
    'Module Code',
    'Module Name',
    'Batch Code',
    'PKT Type',
    'PKT Date',
    'Attempt #',
    'Max Score',
    'Score Obtained',
    'Percentage',
    'Result',
    'Evaluator',
    'Remarks'
  ];

  const rows = pkts
    .filter(p => !p.deleted)
    .map(p => [
      p.employeeCode,
      p.employeeName || '-',
      p.department || '-',
      p.programCode,
      p.programName || '-',
      p.moduleCode || '-',
      p.moduleName || '-',
      p.batchCode || '-',
      p.pktType,
      p.pktDate,
      p.attemptNumber || 1,
      p.maximumScore,
      p.scoreObtained,
      `${p.percentage}%`,
      p.result,
      p.evaluator || '-',
      p.remarks || '-'
    ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PKTs');
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

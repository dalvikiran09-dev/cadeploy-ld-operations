import React from 'react';
import { useTraining } from '../../context/TrainingContext';
import { parseDurationToMinutes } from '../../utils/trainingUtils';

/**
 * Renders the 6 dedicated executive curriculum charts with strict hex color styling
 * and fixed high-DPI dimensions so that html2canvas captures crisp images for embedding
 * into the Excel Dashboard worksheet.
 */
export const TrainingChartsForExport: React.FC<{ isVisible?: boolean }> = ({ isVisible = false }) => {
  const { programs, modules, courses, groupedCourses } = useTraining();

  // 1. Programs by Status
  const programStatusCounts: Record<string, number> = { Active: 0, Inactive: 0, Draft: 0, Archived: 0 };
  programs.forEach(p => {
    const st = p.status || 'Active';
    programStatusCounts[st] = (programStatusCounts[st] || 0) + 1;
  });
  const totalPrograms = programs.length || 1;

  // 2. Modules by Status
  const moduleStatusCounts: Record<string, number> = { Active: 0, Inactive: 0, Draft: 0, Archived: 0 };
  modules.forEach(m => {
    const st = m.status || 'Active';
    moduleStatusCounts[st] = (moduleStatusCounts[st] || 0) + 1;
  });
  const totalModules = modules.length || 1;

  // 3. Courses by Status
  const courseStatusCounts: Record<string, number> = { Approved: 0, 'In Review': 0, Draft: 0, Archived: 0 };
  groupedCourses.forEach(c => {
    const st = c.status || 'Approved';
    courseStatusCounts[st] = (courseStatusCounts[st] || 0) + 1;
  });
  const totalCourses = groupedCourses.length || 1;

  // 4, 5, 6. Program level breakdowns
  const programMetrics = programs.slice(0, 5).map(p => {
    const pCourses = courses.filter(c => c.programCode.toUpperCase() === p.programCode.toUpperCase());
    const uniqueCourseCodes = Array.from(new Set(pCourses.map(c => c.courseCode.toUpperCase())));
    const uniqueModuleCodes = Array.from(new Set(pCourses.map(c => c.moduleCode.toUpperCase())));

    let progMinutes = 0;
    uniqueModuleCodes.forEach(mCode => {
      const m = modules.find(mod => mod.moduleCode.toUpperCase() === mCode);
      if (m) {
        progMinutes += parseDurationToMinutes(m.duration);
      }
    });
    const progHours = Number((progMinutes / 60).toFixed(1));

    return {
      code: p.programCode,
      name: p.programName.length > 22 ? p.programName.substring(0, 20) + '...' : p.programName,
      modulesCount: uniqueModuleCodes.length,
      coursesCount: uniqueCourseCodes.length,
      durationHours: progHours
    };
  });

  const maxModules = Math.max(...programMetrics.map(p => p.modulesCount), 1);
  const maxCourses = Math.max(...programMetrics.map(p => p.coursesCount), 1);
  const maxDuration = Math.max(...programMetrics.map(p => p.durationHours), 1);

  return (
    <div 
      id="training-export-charts-container"
      style={{
        position: isVisible ? 'relative' : 'absolute',
        left: isVisible ? '0' : '-9999px',
        top: isVisible ? '0' : '-9999px',
        opacity: isVisible ? 1 : 0.01,
        pointerEvents: 'none',
        backgroundColor: '#ffffff',
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 360px)',
        gap: '16px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* 1. Programs by Status Chart */}
      <div 
        id="training-chart-programs-status"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          1. Programs by Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
          {Object.entries(programStatusCounts).map(([status, count]) => {
            const pct = Math.round((count / totalPrograms) * 100);
            const color = status === 'Active' ? '#10b981' : status === 'Inactive' ? '#94a3b8' : status === 'Draft' ? '#f59e0b' : '#64748b';
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155', marginBottom: '2px' }}>
                  <span>{status}</span>
                  <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Total Programs: {programs.length}
        </div>
      </div>

      {/* 2. Modules by Status Chart */}
      <div 
        id="training-chart-modules-status"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          2. Modules by Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
          {Object.entries(moduleStatusCounts).map(([status, count]) => {
            const pct = Math.round((count / totalModules) * 100);
            const color = status === 'Active' ? '#2563eb' : status === 'Inactive' ? '#94a3b8' : status === 'Draft' ? '#f59e0b' : '#64748b';
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155', marginBottom: '2px' }}>
                  <span>{status}</span>
                  <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Total Modules: {modules.length}
        </div>
      </div>

      {/* 3. Courses by Status Chart */}
      <div 
        id="training-chart-courses-status"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          3. Courses by Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
          {Object.entries(courseStatusCounts).map(([status, count]) => {
            const pct = Math.round((count / totalCourses) * 100);
            const color = status === 'Approved' ? '#7c3aed' : status === 'In Review' ? '#f59e0b' : '#94a3b8';
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155', marginBottom: '2px' }}>
                  <span>{status}</span>
                  <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Total Courses: {groupedCourses.length}
        </div>
      </div>

      {/* 4. Modules by Program Chart */}
      <div 
        id="training-chart-modules-by-program"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          4. Modules by Program
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
          {programMetrics.map(p => {
            const pct = Math.round((p.modulesCount / maxModules) * 100);
            return (
              <div key={p.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '500' }}>{p.code}</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{p.modulesCount} modules</span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Curriculum Coverage
        </div>
      </div>

      {/* 5. Courses by Program Chart */}
      <div 
        id="training-chart-courses-by-program"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          5. Courses by Program
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
          {programMetrics.map(p => {
            const pct = Math.round((p.coursesCount / maxCourses) * 100);
            return (
              <div key={p.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '500' }}>{p.code}</span>
                  <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{p.coursesCount} courses</span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#7c3aed', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Course Distribution
        </div>
      </div>

      {/* 6. Training Duration by Program Chart */}
      <div 
        id="training-chart-duration-by-program"
        style={{
          width: '350px',
          height: '230px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          6. Training Duration by Program
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
          {programMetrics.map(p => {
            const pct = Math.round((p.durationHours / maxDuration) * 100);
            return (
              <div key={p.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '500' }}>{p.code}</span>
                  <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{p.durationHours} hrs</span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
          Instructional Hours Allocation
        </div>
      </div>
    </div>
  );
};

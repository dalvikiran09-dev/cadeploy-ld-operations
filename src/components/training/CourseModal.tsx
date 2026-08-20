import React, { useState, useEffect } from 'react';
import { TrainingCourse } from '../../types/training';
import { useTraining } from '../../context/TrainingContext';
import { getNextCourseCode } from '../../utils/trainingUtils';
import { X, Layers, Check, AlertCircle, Calendar } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: TrainingCourse | null;
  defaultProgramCode?: string;
  defaultCourseCode?: string;
}

const OWNER_ROLES = [
  'Manager - Learning & Development',
  'Trainer',
  'Lead Structural Editor',
  'QMS Auditor / Quality Lead',
  'Senior Detailing Specialist',
  'Instructional Designer'
];

const DELIVERY_MODES = [
  'Classroom Training (Offline)',
  'Virtual Training (Online)',
  'Self-Paced / E-Learning',
  'On-the-Job Training',
  'Blended Learning'
];

const COURSE_STATUSES = [
  'Approved',
  'Draft',
  'Active',
  'In Review',
  'Archived'
];

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  courseToEdit,
  defaultProgramCode,
  defaultCourseCode
}) => {
  const { programs, modules, courses, addCourseRecord, updateCourseRecord } = useTraining();

  const [courseCode, setCourseCode] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [deliveryMode1, setDeliveryMode1] = useState('Classroom Training (Offline)');
  const [deliveryMode2, setDeliveryMode2] = useState('');
  const [deliveryMode3, setDeliveryMode3] = useState('');
  const [deliveryDay, setDeliveryDay] = useState(1);
  const [ownerRole, setOwnerRole] = useState('Manager - Learning & Development');
  const [courseStatus, setCourseStatus] = useState('Approved');
  const [preAssessmentCode, setPreAssessmentCode] = useState('');
  const [postAssessmentCode, setPostAssessmentCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (courseToEdit) {
        setCourseCode(courseToEdit.courseCode);
        setProgramCode(courseToEdit.programCode);
        setModuleCode(courseToEdit.moduleCode);
        setDeliveryMode1(courseToEdit.deliveryMode1 || 'Classroom Training (Offline)');
        setDeliveryMode2(courseToEdit.deliveryMode2 || '');
        setDeliveryMode3(courseToEdit.deliveryMode3 || '');
        setDeliveryDay(courseToEdit.deliveryDay || 1);
        setOwnerRole(courseToEdit.ownerRole || 'Manager - Learning & Development');
        setCourseStatus(courseToEdit.courseStatus || 'Approved');
        setPreAssessmentCode(courseToEdit.preAssessmentCode || '');
        setPostAssessmentCode(courseToEdit.postAssessmentCode || '');
      } else {
        const nextCode = defaultCourseCode || getNextCourseCode(courses);
        setCourseCode(nextCode);
        setProgramCode(defaultProgramCode || (programs.length > 0 ? programs[0].programCode : ''));
        setModuleCode(modules.length > 0 ? modules[0].moduleCode : '');
        setDeliveryMode1('Classroom Training (Offline)');
        setDeliveryMode2('');
        setDeliveryMode3('');
        setDeliveryDay(1);
        setOwnerRole('Manager - Learning & Development');
        setCourseStatus('Approved');
        setPreAssessmentCode('');
        setPostAssessmentCode('');
      }
    }
  }, [isOpen, courseToEdit, defaultProgramCode, defaultCourseCode, courses, programs, modules]);

  if (!isOpen) return null;

  const selectedProgram = programs.find(p => p.programCode.toUpperCase() === programCode.toUpperCase());
  const selectedModule = modules.find(m => m.moduleCode.toUpperCase() === moduleCode.toUpperCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCourseCode = courseCode.trim().toUpperCase();
    const trimmedProgramCode = programCode.trim().toUpperCase();
    const trimmedModuleCode = moduleCode.trim().toUpperCase();

    if (!trimmedCourseCode) {
      setErrorMessage('Course Code is required.');
      return;
    }

    if (!trimmedProgramCode) {
      setErrorMessage('Please select a Program.');
      return;
    }

    if (!trimmedModuleCode) {
      setErrorMessage('Please select a Module.');
      return;
    }

    if (deliveryDay < 1) {
      setErrorMessage('Delivery Day must be at least 1.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (courseToEdit) {
        const res = await updateCourseRecord(courseToEdit.id, {
          courseCode: trimmedCourseCode,
          programCode: trimmedProgramCode,
          moduleCode: trimmedModuleCode,
          deliveryMode1,
          deliveryMode2: deliveryMode2.trim() || undefined,
          deliveryMode3: deliveryMode3.trim() || undefined,
          deliveryDay: Number(deliveryDay),
          ownerRole,
          courseStatus,
          preAssessmentCode: preAssessmentCode.trim() || undefined,
          postAssessmentCode: postAssessmentCode.trim() || undefined
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update course record.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addCourseRecord({
          courseCode: trimmedCourseCode,
          programCode: trimmedProgramCode,
          moduleCode: trimmedModuleCode,
          deliveryMode1,
          deliveryMode2: deliveryMode2.trim() || undefined,
          deliveryMode3: deliveryMode3.trim() || undefined,
          deliveryDay: Number(deliveryDay),
          ownerRole,
          courseStatus,
          preAssessmentCode: preAssessmentCode.trim() || undefined,
          postAssessmentCode: postAssessmentCode.trim() || undefined
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to add module to course.');
          setIsSubmitting(false);
          return;
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      id="course-modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        id="course-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {courseToEdit ? 'Edit Course Module Mapping' : 'Assign Module to Course'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link instructional module to curriculum program with delivery specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Course Code & Delivery Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-course-code"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g. CRS0000000001"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Standard identifier (e.g. CRS0000000001)
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Delivery Day <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="input-course-delivery-day"
                min={1}
                max={365}
                value={deliveryDay}
                onChange={e => setDeliveryDay(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Timeline day number (e.g. 1, 5, 8, 15)
              </p>
            </div>
          </div>

          {/* Row 2: Select Program */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Program <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-course-program"
              value={programCode}
              onChange={e => setProgramCode(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="" disabled>-- Select Curriculum Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.programCode}>
                  {p.programCode} — {p.programName}
                </option>
              ))}
            </select>
            {selectedProgram && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Selected: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProgram.programName}</span>
              </p>
            )}
          </div>

          {/* Row 3: Select Module */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Instructional Module <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-course-module"
              value={moduleCode}
              onChange={e => setModuleCode(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="" disabled>-- Select Module --</option>
              {modules.map(m => (
                <option key={m.id} value={m.moduleCode}>
                  {m.moduleCode} — {m.moduleName} ({m.duration})
                </option>
              ))}
            </select>
            {selectedModule && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Duration: <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedModule.duration}</span> • Default Mode: {selectedModule.deliveryMode}
              </p>
            )}
          </div>

          {/* Row 4: Delivery Mode & Owner Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Delivery Mode
              </label>
              <select
                id="select-course-delivery-mode-1"
                value={deliveryMode1}
                onChange={e => setDeliveryMode1(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {DELIVERY_MODES.map(dm => (
                  <option key={dm} value={dm}>{dm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Owner Role
              </label>
              <select
                id="select-course-owner-role"
                value={ownerRole}
                onChange={e => setOwnerRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {OWNER_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Course Status */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Course Status
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {COURSE_STATUSES.map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setCourseStatus(st)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                    courseStatus === st
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Assessment Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pre-Assessment Code (Optional)
              </label>
              <input
                type="text"
                id="input-pre-assessment"
                value={preAssessmentCode}
                onChange={e => setPreAssessmentCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRE-BLT-01"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Post-Assessment Code (Optional)
              </label>
              <input
                type="text"
                id="input-post-assessment"
                value={postAssessmentCode}
                onChange={e => setPostAssessmentCode(e.target.value.toUpperCase())}
                placeholder="e.g. POST-BLT-01"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : courseToEdit ? 'Save Changes' : 'Assign Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

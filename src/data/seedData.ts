import { SystemSettings } from '../types';

export const DEFAULT_CATEGORIES = [
  'Training Calendar',
  'Training Material Development',
  'Competency Development',
  'Skill Matrix',
  'Learning Plan',
  'QMS',
  'Internal Audit',
  'External Audit',
  'Management Review',
  'Corrective Action',
  'Preventive Action',
  'Risk Assessment',
  'Process Improvement',
  'SOP Review'
];

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'CADEPLOY',
  departmentName: 'Learning & Development',
  companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80',
  theme: 'light',
  emailNotifications: true,
  inAppNotifications: true,
  weeklySummary: true,
  compactView: false,
  autoSaveInterval: 30,
  categories: DEFAULT_CATEGORIES
};


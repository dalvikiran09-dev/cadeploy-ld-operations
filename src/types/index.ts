export type UserRole = 
  | 'Administrator' 
  | 'L&D Lead' 
  | 'L&D Specialist' 
  | 'Trainer' 
  | 'Auditor' 
  | 'Executive'
  | 'Management'
  | 'Team Member' 
  | 'Trainee';

export interface User {
  id: string;
  auth_user_id?: string;
  email?: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  department: string;
  designation: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  avatar: string;
}

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 
  | 'Pending' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Waiting' 
  | 'Under Review' 
  | 'Completed' 
  | 'Closed' 
  | 'Cancelled';

export type TaskCategory = 
  | 'Training' 
  | 'Training Calendar' 
  | 'Training Material Development' 
  | 'Competency Development' 
  | 'Skill Matrix' 
  | 'Learning Plan' 
  | 'QMS' 
  | 'Internal Audit' 
  | 'External Audit' 
  | 'Management Review' 
  | 'Corrective Action' 
  | 'Preventive Action' 
  | 'Risk Assessment' 
  | 'Process Improvement' 
  | 'SOP Review' 
  | 'Document Review' 
  | 'Work Instructions' 
  | 'Policy Review' 
  | 'Knowledge Management' 
  | 'Automation' 
  | 'AI Development' 
  | 'Meetings' 
  | 'Administration' 
  | 'Others';

export const TASK_CATEGORIES: TaskCategory[] = [
  'Training',
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
  'SOP Review',
  'Document Review',
  'Work Instructions',
  'Policy Review',
  'Knowledge Management',
  'Automation',
  'AI Development',
  'Meetings',
  'Administration',
  'Others'
];

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface AssignmentHistoryRecord {
  id: string;
  timestamp: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedToUserId: string;
  assignedToName: string;
  note: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  assignedUserId: string;
  assignedByUserId?: string;
  assignedByName?: string;
  assignedByUsername?: string;
  assignedOn?: string;
  assignmentHistory?: AssignmentHistoryRecord[];
  startDate: string;
  dueDate: string;
  completionDate?: string;
  hoursSpent: number;
  progress: number; // 0 - 100
  checklist: SubTask[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  reminder?: string;
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  tags: string[];
  parentTaskId?: string;
  isMilestone?: boolean;
  createdAt: string;
  deleted?: boolean;
}

export interface TaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: 'task' | 'user' | 'time_log' | 'document' | 'system';
  targetName: string;
  timestamp: string;
  details?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'tasks' 
  | 'training-dashboard'
  | 'training'
  | 'batches'
  | 'attendance'
  | 'employees'
  | 'calendar' 
  | 'gantt' 
  | 'reports' 
  | 'users' 
  | 'settings';

export * from './training';
export * from './batch';
export * from './assessment';

export interface SystemSettings {
  companyName: string;
  departmentName: string;
  companyLogo: string;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  inAppNotifications: boolean;
  weeklySummary: boolean;
  compactView: boolean;
  autoSaveInterval: number;
  categories?: string[];
}

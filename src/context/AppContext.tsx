import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, Task, Notification, ActivityLog, 
  TaskDependency, SystemSettings, ActiveTab, TaskCategory, TaskStatus, Priority,
  AssignmentHistoryRecord
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  resequenceTasks, 
  compareTasksByCreation, 
  formatTaskCode, 
  STARTING_TASK_SEQUENCE 
} from '../utils/taskSequenceUtils';

export type PresetFilter = 'all' | 'open' | 'completed' | 'overdue' | 'dueToday' | 'criticalHigh' | 'assignedToMe' | 'assignedByMe' | null;

export const formatDateTimeString = (dateInput: Date | string = new Date()): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
};

export interface TaskFilterState {
  category: TaskCategory | 'all';
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  assignedUserId: string | 'all';
  preset?: PresetFilter;
}

interface AppContextType {
  // Authentication
  isAuthenticated: boolean;
  currentUser: User;
  sessionExpiredMessage: string | null;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string } | boolean>;
  logout: (isExpired?: boolean) => void;
  clearSessionExpiredMessage: () => void;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // User Management
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdDate'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteUsers: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    warnings?: string[];
  }>;
  bulkDeactivateUsers: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    updated: number;
    failed: number;
    error?: string;
  }>;

  // Theme & Settings
  settings: SystemSettings;
  categories: string[];
  addCategory: (categoryName: string) => Promise<void>;
  updateCategory: (oldCategoryName: string, newCategoryName: string) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  toggleTheme: () => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  taskFilters: TaskFilterState;
  setTaskFilters: React.Dispatch<React.SetStateAction<TaskFilterState>>;
  setTaskFilterPreset: (preset: PresetFilter) => void;
  resetTaskFilters: () => void;

  // Data Collections
  tasks: Task[];
  dependencies: TaskDependency[];
  activities: ActivityLog[];
  notifications: Notification[];

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'code' | 'comments' | 'attachments'> & { createdAt?: string }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }>;
  repairTaskNumberingSequence: () => Promise<{
    totalTasks: number;
    resequencedCount: number;
    duplicatesRemoved: number;
    gapsResolved: number;
  }>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  addAttachment: (taskId: string, file: { name: string; size: string; url: string }) => Promise<void>;

  // Notifications Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Backup & System
  backupDatabase: () => string;
  restoreDatabase: (jsonString: string) => boolean;
  resetToDefaults: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ADMIN: User = {
  id: 'u-admin',
  auth_user_id: 'd9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320',
  email: 'kiran.dalvi@cadeploy.com',
  name: 'Kiran Dalvi',
  username: 'admin',
  password: 'Kitzer@123',
  role: 'Administrator',
  department: 'L&D',
  designation: 'System Administrator',
  status: 'Active',
  createdDate: '2026-07-29',
  avatar: ''
};

// Field Mapping Helpers
const mapUserFromDb = (row: any): User => ({
  id: row.id,
  auth_user_id: row.auth_user_id || undefined,
  email: row.email || undefined,
  name: row.name || '',
  username: row.username || '',
  password: row.password || '',
  role: row.role || 'Team Member',
  department: row.department || 'L&D',
  designation: row.designation || '',
  status: row.status || 'Active',
  createdDate: row.createdDate || row.created_date || row.created_at || new Date().toISOString().split('T')[0],
  avatar: row.avatar || ''
});

const mapUserToDb = (user: User) => {
  const payload: any = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    department: user.department,
    designation: user.designation,
    status: user.status,
    avatar: user.avatar,
    createdDate: user.createdDate
  };
  if (user.password !== undefined) payload.password = user.password;
  if (user.email !== undefined) payload.email = user.email;
  if (user.auth_user_id !== undefined) payload.auth_user_id = user.auth_user_id;
  return payload;
};

const mapUserUpdatesToDb = (updates: Partial<User>) => {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.designation !== undefined) payload.designation = updates.designation;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.auth_user_id !== undefined) payload.auth_user_id = updates.auth_user_id;
  return payload;
};

const mapTaskFromDb = (row: any): Task => {
  const createdAtStr = row.created_at || row.createdAt || row.createdDate || new Date().toISOString();
  const assignedByName = row.assigned_by_name || row.assignedByName || row.assigned_by || 'Kiran Dalvi';
  const assignedByUserId = row.assigned_by_user_id || row.assignedByUserId || 'u-admin';
  const assignedByUsername = row.assigned_by_username || row.assignedByUsername || 'admin';
  const assignedOn = row.assigned_on || row.assignedOn || formatDateTimeString(createdAtStr);

  const rawHistory = row.assignment_history || row.assignmentHistory;
  const assignmentHistory: AssignmentHistoryRecord[] = Array.isArray(rawHistory) && rawHistory.length > 0
    ? rawHistory
    : [
        {
          id: `hist-init-${row.id || Date.now()}`,
          timestamp: assignedOn,
          assignedByUserId,
          assignedByName,
          assignedToUserId: row.assigned_user_id || row.assignedUserId || row.assigned_to || row.assignedTo || '',
          assignedToName: row.assignedToName || 'Assigned User',
          note: `Task created by ${assignedByName}`
        }
      ];

  return {
    id: row.id,
    code: row.code || '',
    title: row.title || '',
    description: row.description || '',
    category: row.category || 'General',
    priority: row.priority || 'Medium',
    status: row.status || 'Pending',
    assignedUserId: row.assigned_user_id || row.assignedUserId || row.assigned_to || row.assignedTo || '',
    assignedByUserId,
    assignedByName,
    assignedByUsername,
    assignedOn,
    assignmentHistory,
    startDate: row.start_date || row.startDate || '',
    dueDate: row.due_date || row.dueDate || '',
    completionDate: row.completion_date || row.completionDate || undefined,
    hoursSpent: Number(row.hours_spent ?? row.hoursSpent ?? row.actual_hours ?? row.estimated_hours ?? 0),
    progress: Number(row.progress ?? 0),
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    reminder: row.reminder || undefined,
    recurring: row.recurring || 'None',
    tags: Array.isArray(row.tags) ? row.tags : [],
    parentTaskId: row.parent_task_id || row.parentTaskId || undefined,
    isMilestone: Boolean(row.is_milestone ?? row.isMilestone),
    createdAt: createdAtStr,
    deleted: Boolean(row.deleted)
  };
};

const mapTaskToDb = (task: Task) => ({
  id: task.id,
  code: task.code,
  title: task.title,
  description: task.description,
  category: task.category,
  priority: task.priority,
  status: task.status,
  assigned_user_id: task.assignedUserId || null,
  assigned_by_user_id: task.assignedByUserId || null,
  assigned_by_name: task.assignedByName || null,
  assigned_by_username: task.assignedByUsername || null,
  assigned_on: task.assignedOn || null,
  assignment_history: task.assignmentHistory || [],
  start_date: task.startDate,
  due_date: task.dueDate,
  completion_date: task.completionDate || null,
  hours_spent: task.hoursSpent ?? 0,
  progress: task.progress,
  checklist: task.checklist || [],
  attachments: task.attachments || [],
  comments: task.comments || [],
  reminder: task.reminder || null,
  recurring: task.recurring,
  tags: task.tags || [],
  parent_task_id: task.parentTaskId || null,
  is_milestone: task.isMilestone ?? false,
  created_at: task.createdAt,
  deleted: task.deleted ?? false
});

const mapDependencyFromDb = (row: any): TaskDependency => ({
  id: row.id,
  predecessorTaskId: row.predecessor_task_id || row.predecessorTaskId || '',
  successorTaskId: row.successor_task_id || row.successorTaskId || '',
  type: row.type || 'finish_to_start'
});

const mapDependencyToDb = (dep: TaskDependency) => ({
  id: dep.id,
  predecessor_task_id: dep.predecessorTaskId,
  successor_task_id: dep.successorTaskId,
  type: dep.type
});

const mapActivityFromDb = (row: any): ActivityLog => ({
  id: row.id,
  userId: row.user_id || row.userId || '',
  userName: row.user_name || row.userName || '',
  userAvatar: row.user_avatar || row.userAvatar || '',
  action: row.action || '',
  targetType: row.target_type || row.targetType || 'task',
  targetName: row.target_name || row.targetName || '',
  timestamp: row.created_at || row.timestamp || 'Just now',
  details: row.details || undefined
});

const mapActivityToDb = (act: ActivityLog) => ({
  id: act.id,
  user_id: act.userId,
  user_name: act.userName,
  user_avatar: act.userAvatar,
  action: act.action,
  target_type: act.targetType,
  target_name: act.targetName,
  created_at: act.timestamp,
  details: act.details || null
});

const mapNotificationFromDb = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id || row.userId || '',
  title: row.title || '',
  message: row.message || '',
  type: row.type || 'info',
  read: Boolean(row.read),
  createdAt: row.created_at || row.createdAt || 'Just now',
  link: row.link || undefined
});

const mapNotificationToDb = (notif: Notification) => ({
  id: notif.id,
  user_id: notif.userId,
  title: notif.title,
  message: notif.message,
  type: notif.type,
  read: notif.read,
  created_at: notif.createdAt,
  link: notif.link || null
});

const SETTINGS_STORAGE_KEY = 'cadeploy_settings';
const CATEGORIES_STORAGE_KEY = 'cadeploy_categories';
const TASKS_STORAGE_KEY = 'cadeploy_tasks';
const USERS_STORAGE_KEY = 'cadeploy_users';
const ACTIVITIES_STORAGE_KEY = 'cadeploy_activities';
const NOTIFICATIONS_STORAGE_KEY = 'cadeploy_notifications';

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
};

const getInitialUsers = (): User[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading users from localStorage:', e);
  }
  return [DEFAULT_ADMIN];
};

const getInitialTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem("cadeploy_tasks");
    const parsed = raw ? JSON.parse(raw) : null;
    console.log("Initial tasks from localStorage:", parsed);
    console.log("Initial tasks length:", parsed?.length);
    if (parsed && Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage:', e);
  }
  return [];
};

const getInitialActivities = (): ActivityLog[] => {
  try {
    const saved = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading activities from localStorage:', e);
  }
  return [];
};

const getInitialNotifications = (): Notification[] => {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading notifications from localStorage:', e);
  }
  return [];
};

const getInitialCategories = (): string[] => {
  try {
    const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (savedCategories !== null) {
      const parsed = JSON.parse(savedCategories);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings !== null) {
      const parsed = JSON.parse(savedSettings);
      if (parsed && Array.isArray(parsed.categories)) {
        return parsed.categories;
      }
    }
  } catch (e) {
    console.error('Error loading categories from localStorage:', e);
  }

  // First time application startup with no categories in persistent storage:
  // Create default categories once and persist them immediately.
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  } catch (e) {
    console.error('Error persisting initial default categories:', e);
  }
  return DEFAULT_CATEGORIES;
};

const getInitialSettings = (): SystemSettings => {
  const initialCats = getInitialCategories();
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings !== null) {
      const parsed = JSON.parse(savedSettings);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          categories: initialCats
        };
      }
    }
  } catch (e) {
    console.error('Error loading settings from localStorage:', e);
  }
  return {
    ...DEFAULT_SETTINGS,
    categories: initialCats
  };
};

const mapSettingsFromDb = (row: any): SystemSettings => ({
  companyName: row.company_name || row.companyName || DEFAULT_SETTINGS.companyName,
  departmentName: row.department_name || row.departmentName || DEFAULT_SETTINGS.departmentName,
  companyLogo: row.company_logo || row.companyLogo || DEFAULT_SETTINGS.companyLogo,
  theme: row.theme || DEFAULT_SETTINGS.theme,
  emailNotifications: row.email_notifications ?? row.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
  inAppNotifications: row.in_app_notifications ?? row.inAppNotifications ?? DEFAULT_SETTINGS.inAppNotifications,
  weeklySummary: row.weekly_summary ?? row.weeklySummary ?? DEFAULT_SETTINGS.weeklySummary,
  compactView: row.compact_view ?? row.compactView ?? DEFAULT_SETTINGS.compactView,
  autoSaveInterval: Number(row.auto_save_interval ?? row.autoSaveInterval ?? DEFAULT_SETTINGS.autoSaveInterval),
  categories: Array.isArray(row.categories) ? row.categories : getInitialCategories()
});

const mapSettingsToDb = (settings: SystemSettings) => ({
  id: 'system_settings',
  company_name: settings.companyName,
  department_name: settings.departmentName,
  company_logo: settings.companyLogo,
  theme: settings.theme,
  email_notifications: settings.emailNotifications,
  in_app_notifications: settings.inAppNotifications,
  weekly_summary: settings.weeklySummary,
  compact_view: settings.compactView,
  auto_save_interval: settings.autoSaveInterval,
  categories: settings.categories
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getInitialUsers);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = sessionStorage.getItem("cadeploy_session");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading session from sessionStorage:", e);
    }
    return DEFAULT_ADMIN;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem("cadeploy_session");
      return Boolean(saved);
    } catch (e) {
      return false;
    }
  });

  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(getInitialSettings);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [taskFilters, setTaskFilters] = useState<TaskFilterState>({
    category: 'all',
    priority: 'all',
    status: 'all',
    assignedUserId: 'all'
  });

  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>(getInitialActivities);
  const [notifications, setNotifications] = useState<Notification[]>(getInitialNotifications);

  const isInitialLoadDoneRef = useRef(false);

  // Fetch all data from Supabase + Auto-bootstrap admin if empty
  const fetchAllData = async () => {
    if (!isSupabaseConfigured) return;

    try {
      // 1. Users table
      const { data: usersData, error: usersErr } = await supabase.from('users').select('*');
      
      if (!usersErr) {
        if (!usersData || usersData.length === 0) {
          // Insert default admin if table is empty
          await supabase.from('users').insert([mapUserToDb(DEFAULT_ADMIN)]);
          const { data: reloadedUsers } = await supabase.from('users').select('*');
          if (reloadedUsers) {
            const mapped = reloadedUsers.map(mapUserFromDb);
            setUsers(mapped);
            saveToStorage(USERS_STORAGE_KEY, mapped);
          }
        } else {
          const mapped = usersData.map(mapUserFromDb);
          setUsers(mapped);
          saveToStorage(USERS_STORAGE_KEY, mapped);
          
          // Only update currentUser if the logged in user still exists -> update their latest profile values
          // Never replace the logged-in user with another user!
          setCurrentUser(prevUser => {
            const found = mapped.find(u => u.id === prevUser.id || (u.username && u.username.toLowerCase() === prevUser.username.toLowerCase()));
            if (found) {
              try {
                sessionStorage.setItem("cadeploy_session", JSON.stringify(found));
              } catch (e) {
                console.error("Failed to update session in sessionStorage:", e);
              }
              return found;
            }
            return prevUser;
          });
        }
      }

      // 2. Tasks table (range 0 to 999999 ensures ALL tasks are returned without default pagination limits)
      console.log("STARTUP - SUPABASE TASK COUNT");
      const { data: tasksData, error: tasksErr } = await supabase.from('tasks').select('*').range(0, 999999);
      if (!tasksErr && tasksData) {
        console.log("STARTUP - SUPABASE TASK COUNT", tasksData.length);
        const mapped = tasksData.map(mapTaskFromDb).filter(t => !t.deleted);
        console.log("FETCH - TASK COUNT", mapped.length);

        // Enforce strict created_at ASC sequence starting from LD-TSK-101
        const { resequencedTasks, hasChanges, changedTasks } = resequenceTasks(mapped);

        if (hasChanges) {
          console.log(`[Auto-Repair On Startup] Normalizing ${changedTasks.length} task codes in Supabase to maintain continuous created_at sequence...`);
          try {
            for (const changed of changedTasks) {
              await supabase.from('tasks').update({ code: changed.code }).eq('id', changed.id);
            }
          } catch (repairErr) {
            console.error("Error persisting normalized task codes on startup:", repairErr);
          }
        }

        setTasks(resequencedTasks);
        saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);
      } else if (tasksErr) {
        console.error("FETCH - ERROR FETCHING TASKS FROM SUPABASE:", tasksErr);
      }

      // 3. Dependencies table
      const { data: depData } = await supabase.from('dependencies').select('*');
      if (depData) {
        setDependencies(depData.map(mapDependencyFromDb));
      }

      // 4. Activities table
      const { data: actData } = await supabase.from('activities').select('*').order('id', { ascending: false });
      if (actData) {
        const mapped = actData.map(mapActivityFromDb);
        setActivities(mapped);
        saveToStorage(ACTIVITIES_STORAGE_KEY, mapped);
      }

      // 6. Notifications table
      const { data: notifData } = await supabase.from('notifications').select('*').order('id', { ascending: false });
      if (notifData) {
        const mapped = notifData.map(mapNotificationFromDb);
        setNotifications(mapped);
        saveToStorage(NOTIFICATIONS_STORAGE_KEY, mapped);
      }

      // 7. Settings table
      const { data: settsData } = await supabase.from('settings').select('*').limit(1);
      if (settsData && settsData.length > 0) {
        const dbSettings = mapSettingsFromDb(settsData[0]);
        try {
          const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.theme) {
              dbSettings.theme = parsed.theme;
            }
          }
        } catch (e) {}
        setSettings(dbSettings);
        console.log("Theme loaded:", dbSettings.theme);
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dbSettings));
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(dbSettings.categories));
        } catch (e) {
          console.error('Error writing fetched settings to localStorage:', e);
        }
      } else if (isSupabaseConfigured) {
        const initSetts = getInitialSettings();
        await supabase.from('settings').upsert([mapSettingsToDb(initSetts)]);
      }
    } catch (e) {
      console.error('Error fetching data from Supabase:', e);
    }
  };

  // On Mount: Initial Load, Restore Session & Realtime Subscriptions
  useEffect(() => {
    console.log("Startup:", tasks.length);
    fetchAllData().then(() => {
      isInitialLoadDoneRef.current = true;
    });

    // Restore active session from sessionStorage
    try {
      const savedSession = sessionStorage.getItem("cadeploy_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id && parsed.username) {
          setCurrentUser(parsed);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error('Error restoring session from storage:', err);
    }

    if (isSupabaseConfigured) {
      // Realtime Postgres Changes
      const channel = supabase
        .channel('public-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchAllData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Theme effect
  useEffect(() => {
    console.log("Applying theme:", settings.theme);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Activity logger helper
  const logActivity = async (action: string, targetType: ActivityLog['targetType'], targetName: string, details?: string) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      action,
      targetType,
      targetName,
      timestamp: new Date().toISOString(),
      details
    };

    setActivities(prev => {
      const updated = [newAct, ...prev];
      saveToStorage(ACTIVITIES_STORAGE_KEY, updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('activities').insert([mapActivityToDb(newAct)]);
      } catch (e) {
        console.error('Error logging activity to Supabase:', e);
      }
    }
  };

  // Auth: public.users Username & Password authentication
  const login = async (username: string, password?: string): Promise<{ success: boolean; error?: string } | boolean> => {
    const cleanUsername = username.trim();
    const cleanPassword = password || '';
    
    if (!cleanUsername) {
      return { success: false, error: 'Username is required.' };
    }

    try {
      let matchedProfile: any = null;

      if (isSupabaseConfigured) {
        // 1. Direct lookup from public.users
        const { data: matchedUsers, error: lookupErr } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.${cleanUsername},name.ilike.${cleanUsername},id.ilike.${cleanUsername}`);

        if (lookupErr) {
          console.error('[AUTH ERROR] Error querying public.users:', lookupErr);
        } else if (matchedUsers && matchedUsers.length > 0) {
          matchedProfile = matchedUsers.find((u: any) => 
            (u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            (u.name && u.name.toLowerCase() === cleanUsername.toLowerCase()) ||
            (u.id && u.id.toLowerCase() === cleanUsername.toLowerCase())
          );
        }
      }

      // 2. Fallback to local users list if not found or offline
      if (!matchedProfile) {
        const localMatch = users.find(u => 
          (u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === cleanUsername.toLowerCase()) ||
          (u.id && u.id.toLowerCase() === cleanUsername.toLowerCase())
        );
        if (localMatch) {
          matchedProfile = localMatch;
        }
      }

      if (!matchedProfile) {
        return { success: false, error: 'Invalid username or password.' };
      }

      // 3. Status check: Only Active users may log in
      if (matchedProfile.status && matchedProfile.status === 'Inactive') {
        return { success: false, error: 'Your account is inactive. Please contact an Administrator.' };
      }

      // 4. Password validation (if password exists)
      const expectedPassword = matchedProfile.password || '';
      if (expectedPassword && cleanPassword && expectedPassword !== cleanPassword) {
        return { success: false, error: 'Invalid username or password.' };
      }

      // 5. Populate currentUser and active session
      const mappedUser = mapUserFromDb(matchedProfile);
      setCurrentUser(mappedUser);
      setIsAuthenticated(true);
      setSessionExpiredMessage(null);

      try {
        sessionStorage.setItem("cadeploy_session", JSON.stringify(mappedUser));
      } catch (e) {
        console.error("Failed to write session to sessionStorage:", e);
      }

      logActivity('logged in to', 'system', 'CADEPLOY L&D System');
      return { success: true };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: e?.message || 'Unexpected login error occurred.' };
    }
  };

  const logout = async (isExpired = false) => {
    try {
      sessionStorage.removeItem("cadeploy_session");
    } catch (e) {
      console.error("Failed to remove session from sessionStorage:", e);
    }
    setIsAuthenticated(false);
    if (isExpired) {
      setSessionExpiredMessage('Your session has expired. Please sign in again.');
    } else {
      setSessionExpiredMessage(null);
    }
  };

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage(null);
  };

  // Theme & Settings
  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    console.log("Theme changed to:", newTheme);
    updateSettings({ theme: newTheme });
  };

  const categories = settings.categories || DEFAULT_SETTINGS.categories || [];

  const addCategory = async (catName: string) => {
    const clean = catName.trim();
    if (!clean || categories.includes(clean)) return;
    const updatedCategories = [...categories, clean];
    await updateSettings({ categories: updatedCategories });
  };

  const updateCategory = async (oldName: string, newName: string) => {
    const clean = newName.trim();
    if (!clean || oldName === clean) return;

    const updatedCategories = categories.map(c => c === oldName ? clean : c);
    await updateSettings({ categories: updatedCategories });

    // Update existing tasks with this category
    const affectedTasks = tasks.filter(t => t.category === oldName);
    if (affectedTasks.length > 0) {
      const updatedTasks = tasks.map(t => t.category === oldName ? { ...t, category: clean } : t);
      setTasks(updatedTasks);
      if (isSupabaseConfigured) {
        for (const t of affectedTasks) {
          await supabase.from('tasks').update({ category: clean }).eq('id', t.id);
        }
      }
    }
  };

  const deleteCategory = async (catName: string) => {
    const updatedCategories = categories.filter(c => c !== catName);
    await updateSettings({ categories: updatedCategories });
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    console.log("Applying theme:", updated.theme);
    setSettings(updated);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      if (updated.categories) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated.categories));
      }
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('settings').upsert([mapSettingsToDb(updated)]);
        await logActivity('updated system settings', 'system', 'Settings');
      } catch (e) {
        console.error('Error updating settings in Supabase:', e);
      }
    }
  };

  const setTaskFilterPreset = (preset: PresetFilter) => {
    setTaskFilters({
      category: 'all',
      priority: 'all',
      status: 'all',
      assignedUserId: 'all',
      preset
    });
  };

  const resetTaskFilters = () => {
    setTaskFilters({
      category: 'all',
      priority: 'all',
      status: 'all',
      assignedUserId: 'all',
      preset: null
    });
  };

  // User Management
  const addUser = async (userData: Omit<User, 'id' | 'createdDate'>): Promise<{ success: boolean; error?: string }> => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0]
    };

    const payload = mapUserToDb(newUser);
    console.log("USER CREATE - BEFORE SUPABASE", payload);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').insert([payload]).select();
        console.log("USER CREATE - SUPABASE RESULT", {
          data,
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint
        });

        if (error) {
          console.error("Failed to insert user into Supabase:", error);
          return {
            success: false,
            error: `[${error.code || 'ERR'}] ${error.message}${error.hint ? ` (${error.hint})` : ''}`
          };
        }

        const savedRecord = data && data.length > 0 ? data[0] : null;
        console.log("USER CREATE - VERIFIED", savedRecord);

        const verifiedUser = savedRecord ? mapUserFromDb(savedRecord) : newUser;
        setUsers(prev => {
          const updated = [...prev, verifiedUser];
          saveToStorage(USERS_STORAGE_KEY, updated);
          return updated;
        });

        logActivity('added user', 'user', newUser.name, `Role: ${newUser.role}`);
        return { success: true };
      } catch (e: any) {
        console.error("Exception creating user in Supabase:", e);
        return { success: false, error: e?.message || 'Unexpected database error' };
      }
    } else {
      setUsers(prev => {
        const updated = [...prev, newUser];
        saveToStorage(USERS_STORAGE_KEY, updated);
        return updated;
      });
      logActivity('added user', 'user', newUser.name, `Role: ${newUser.role}`);
      return { success: true };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    const payload = mapUserUpdatesToDb(updates);
    console.log("USER UPDATE - BEFORE SUPABASE", { id, payload });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', id)
          .select();

        console.log("USER UPDATE - SUPABASE RESULT", {
          data,
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint
        });

        if (error) {
          console.error("Failed to update user in Supabase:", error);
          return {
            success: false,
            error: `[${error.code || 'ERR'}] ${error.message}${error.hint ? ` (${error.hint})` : ''}`
          };
        }

        const savedRecord = data && data.length > 0 ? data[0] : null;
        console.log("USER UPDATE - VERIFIED", savedRecord);

        const verifiedUser = savedRecord ? mapUserFromDb(savedRecord) : null;

        // Update React state only after Supabase update succeeds
        setUsers(prev => {
          const updated = prev.map(u => u.id === id ? (verifiedUser || { ...u, ...updates }) : u);
          saveToStorage(USERS_STORAGE_KEY, updated);
          return updated;
        });

        if (currentUser.id === id) {
          const updatedCurrentUser = verifiedUser || { ...currentUser, ...updates };
          setCurrentUser(updatedCurrentUser);
          try {
            sessionStorage.setItem("cadeploy_session", JSON.stringify(updatedCurrentUser));
          } catch (e) {
            console.error("Failed to update session storage:", e);
          }
        }

        logActivity('updated user profile', 'user', updates.name || id, `Designation: ${updates.designation || 'updated'}`);
        return { success: true };
      } catch (e: any) {
        console.error("Exception updating user in Supabase:", e);
        return { success: false, error: e?.message || 'Unexpected database error' };
      }
    } else {
      setUsers(prev => {
        const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
        saveToStorage(USERS_STORAGE_KEY, updated);
        return updated;
      });
      if (currentUser.id === id) {
        const updatedCurrentUser = { ...currentUser, ...updates };
        setCurrentUser(updatedCurrentUser);
      }
      return { success: true };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (id === currentUser.id) {
      return { success: false, error: 'Cannot delete currently logged-in account.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        console.log("USER DELETE - SUPABASE RESULT", { id, error, code: error?.code, message: error?.message });

        if (error) {
          console.error("Failed to delete user from Supabase:", error);
          return {
            success: false,
            error: `[${error.code || 'ERR'}] ${error.message}`
          };
        }
      } catch (e: any) {
        console.error("Exception deleting user in Supabase:", e);
        return { success: false, error: e?.message || 'Unexpected database error' };
      }
    }

    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      saveToStorage(USERS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity('deleted user', 'user', target.name);
    return { success: true };
  };

  const bulkDeleteUsers = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
    warnings?: string[];
  }> => {
    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    // Role check: Administrator only
    if (currentUser.role !== 'Administrator' && currentUser.role !== 'admin') {
      return {
        success: false,
        requested: ids.length,
        deleted: 0,
        failed: ids.length,
        error: 'Permission Denied: Only Administrators are authorized to bulk delete user accounts.'
      };
    }

    // Prevent deleting currently logged-in account
    const containsSelf = ids.includes(currentUser.id);
    const validIds = ids.filter(id => id !== currentUser.id);

    if (validIds.length === 0) {
      return {
        success: false,
        requested: ids.length,
        deleted: 0,
        failed: ids.length,
        error: 'Cannot delete your own currently logged-in Administrator account.'
      };
    }

    const warnings: string[] = [];
    if (containsSelf) {
      warnings.push(`Your account (${currentUser.name}) was skipped to protect the active Administrator session.`);
    }

    // Check references in active tasks
    for (const id of validIds) {
      const assignedTasks = tasks.filter(t => t.assignedUserId === id);
      const createdTasks = tasks.filter(t => t.assignedByUserId === id);
      if (assignedTasks.length > 0 || createdTasks.length > 0) {
        const u = users.find(user => user.id === id);
        warnings.push(
          `User "${u ? u.name : id}" is referenced by ${assignedTasks.length} assigned task(s) and ${createdTasks.length} created task(s). Consider Deactivating instead.`
        );
      }
    }

    console.log('USERS BULK DELETE - BEFORE SUPABASE', { count: validIds.length, validIds });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', validIds);

        console.log('USERS BULK DELETE - SUPABASE RESULT', { error });

        if (error) {
          console.error('Failed to bulk delete users from Supabase:', error);
          return {
            success: false,
            requested: ids.length,
            deleted: 0,
            failed: validIds.length,
            error: `[${error.code || 'ERR'}] ${error.message}${error.hint ? ` (${error.hint})` : ''}`,
            warnings
          };
        }
      } catch (e: any) {
        console.error('Exception bulk deleting users in Supabase:', e);
        return {
          success: false,
          requested: ids.length,
          deleted: 0,
          failed: validIds.length,
          error: e?.message || 'Unexpected database error',
          warnings
        };
      }
    }

    setUsers(prev => {
      const updated = prev.filter(u => !validIds.includes(u.id));
      saveToStorage(USERS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity('bulk deleted users', 'user', `${validIds.length} user accounts removed`);

    return {
      success: true,
      requested: ids.length,
      deleted: validIds.length,
      failed: containsSelf ? 1 : 0,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  };

  const bulkDeactivateUsers = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    updated: number;
    failed: number;
    error?: string;
  }> => {
    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, updated: 0, failed: 0 };
    }

    if (currentUser.role !== 'Administrator' && currentUser.role !== 'admin') {
      return {
        success: false,
        requested: ids.length,
        updated: 0,
        failed: ids.length,
        error: 'Permission Denied: Only Administrators are authorized to update user account statuses.'
      };
    }

    // Do not deactivate current user
    const validIds = ids.filter(id => id !== currentUser.id);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ status: 'Inactive' })
          .in('id', validIds);

        if (error) {
          console.error('Failed to bulk deactivate users in Supabase:', error);
          return {
            success: false,
            requested: ids.length,
            updated: 0,
            failed: validIds.length,
            error: `[${error.code || 'ERR'}] ${error.message}`
          };
        }
      } catch (e: any) {
        return {
          success: false,
          requested: ids.length,
          updated: 0,
          failed: validIds.length,
          error: e?.message || 'Database error'
        };
      }
    }

    setUsers(prev => {
      const updated = prev.map(u => validIds.includes(u.id) ? { ...u, status: 'Inactive' as const } : u);
      saveToStorage(USERS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity('bulk deactivated users', 'user', `${validIds.length} user accounts set to Inactive`);

    return {
      success: true,
      requested: ids.length,
      updated: validIds.length,
      failed: ids.length - validIds.length
    };
  };

  // Task Management
  const addTask = async (tData: Omit<Task, 'id' | 'code' | 'comments' | 'attachments'> & { createdAt?: string }) => {
    const taskCreatedAt = tData.createdAt || new Date().toISOString();
    const nowFormatted = formatDateTimeString(new Date());
    const assignedUser = users.find(u => u.id === tData.assignedUserId);
    const assignedToName = assignedUser ? assignedUser.name : 'Unassigned';

    const creationHistory: AssignmentHistoryRecord = {
      id: `hist-${Date.now()}-1`,
      timestamp: nowFormatted,
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.name,
      assignedToUserId: tData.assignedUserId,
      assignedToName,
      note: `Task created by ${currentUser.name}`
    };

    const assignmentHistory: AssignmentHistoryRecord[] = [creationHistory];
    if (tData.assignedUserId && assignedUser && assignedUser.name !== currentUser.name) {
      assignmentHistory.push({
        id: `hist-${Date.now()}-2`,
        timestamp: nowFormatted,
        assignedByUserId: currentUser.id,
        assignedByName: currentUser.name,
        assignedToUserId: tData.assignedUserId,
        assignedToName: assignedUser.name,
        note: `Assigned to ${assignedUser.name}`
      });
    }

    const tempId = `tsk-${Date.now()}`;
    const newTask: Task = {
      ...tData,
      id: tempId,
      code: `LD-TSK-TEMP`,
      assignedByUserId: currentUser.id,
      assignedByName: tData.assignedByName || currentUser.name,
      assignedByUsername: currentUser.username,
      assignedOn: nowFormatted,
      assignmentHistory,
      hoursSpent: tData.hoursSpent ?? 0,
      comments: [],
      attachments: [],
      createdAt: taskCreatedAt
    };

    // Calculate full resequenced list with new task included strictly by created_at ASC, id ASC
    const allActiveTasks = [...tasks.filter(t => t.id !== newTask.id && !t.deleted), newTask];
    const { resequencedTasks, changedTasks } = resequenceTasks(allActiveTasks);

    // Find the finalized code for newTask
    const finalizedNewTask = resequencedTasks.find(t => t.id === newTask.id) || newTask;

    console.log("CREATE TASK - BEFORE SUPABASE INSERT");
    console.log("========== CREATE TASK ==========");
    console.log("NEW TASK:", finalizedNewTask);

    const payload = mapTaskToDb(finalizedNewTask);
    console.log("SUPABASE TASK PAYLOAD:", payload);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([payload])
          .select()
          .single();

        console.log("========== SUPABASE INSERT RESULT ==========");
        console.log("INSERTED DATA:", data);
        console.log("INSERT ERROR:", error);

        if (error) {
          console.error("CREATE TASK - SUPABASE INSERT FAILED", error);
          alert(`Failed to save task to database: ${error.message}`);
          return;
        }

        // Persist any other existing tasks whose sequence was shifted (e.g. if backdated task was added)
        for (const changed of changedTasks) {
          if (changed.id !== finalizedNewTask.id) {
            await supabase.from('tasks').update({ code: changed.code }).eq('id', changed.id);
          }
        }

        console.log("CREATE TASK - SUPABASE INSERT SUCCESS");
      } catch (e: any) {
        console.error("CREATE TASK - SUPABASE INSERT FAILED", e);
        alert(`Error inserting task: ${e.message || e}`);
        return;
      }
    }

    setTasks(resequencedTasks);
    saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);
    console.log("CREATE TASK - REACT STATE UPDATED");

    logActivity('created operational task', 'task', finalizedNewTask.title, `Category: ${finalizedNewTask.category}`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    let updatedHistory = target.assignmentHistory ? [...target.assignmentHistory] : [];
    let activityLogDetails: string | undefined = updates.status ? `Status: ${updates.status}` : undefined;

    // Check if reassigned
    if (updates.assignedUserId && updates.assignedUserId !== target.assignedUserId) {
      const oldAssignedUser = users.find(u => u.id === target.assignedUserId);
      const newAssignedUser = users.find(u => u.id === updates.assignedUserId);
      const newAssignedName = newAssignedUser ? newAssignedUser.name : 'Unassigned';
      const nowFormatted = formatDateTimeString(new Date());

      const reassignHistoryRecord: AssignmentHistoryRecord = {
        id: `hist-${Date.now()}`,
        timestamp: nowFormatted,
        assignedByUserId: currentUser.id,
        assignedByName: currentUser.name,
        assignedToUserId: updates.assignedUserId,
        assignedToName: newAssignedName,
        note: `Reassigned to ${newAssignedName}`
      };
      updatedHistory.push(reassignHistoryRecord);

      activityLogDetails = `Reassigned from ${oldAssignedUser ? oldAssignedUser.name : 'Unassigned'} to ${newAssignedName}`;
    }

    const updatedTask: Task = {
      ...target,
      ...updates,
      // PRESERVE Assigned By fields permanently unless explicitly updated
      assignedByUserId: target.assignedByUserId || currentUser.id,
      assignedByName: updates.assignedByName !== undefined ? updates.assignedByName : (target.assignedByName || currentUser.name),
      assignedByUsername: target.assignedByUsername || currentUser.username,
      assignedOn: target.assignedOn || formatDateTimeString(new Date()),
      assignmentHistory: updatedHistory
    };

    if (updates.status === 'Completed' || updates.status === 'Closed') {
      updatedTask.progress = 100;
      if (!updatedTask.completionDate) {
        updatedTask.completionDate = new Date().toISOString().split('T')[0];
      }
    }

    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? updatedTask : t);
      saveToStorage(TASKS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity(
      updates.assignedUserId && updates.assignedUserId !== target.assignedUserId 
        ? 'reassigned task' 
        : 'updated task', 
      'task', 
      updatedTask.title, 
      activityLogDetails
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update(mapTaskToDb(updatedTask)).eq('id', id);
      } catch (e) {
        console.error('Error updating task in Supabase:', e);
      }
    }
  };

  const deleteTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({ deleted: true }).eq('id', id);
      } catch (e) {
        console.error('Error deleting task in Supabase:', e);
      }
    }

    // Filter remaining active tasks and resequence strictly by created_at ASC, id ASC
    const remaining = tasks.filter(t => t.id !== id && !t.deleted);
    const { resequencedTasks, hasChanges, changedTasks } = resequenceTasks(remaining);

    if (isSupabaseConfigured && hasChanges) {
      try {
        for (const changed of changedTasks) {
          await supabase.from('tasks').update({ code: changed.code }).eq('id', changed.id);
        }
      } catch (e) {
        console.error('Error updating task codes after deletion:', e);
      }
    }

    setTasks(resequencedTasks);
    saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);
    logActivity('deleted task', 'task', target.title);
  };

  const bulkDeleteTasks = async (ids: string[]): Promise<{
    success: boolean;
    requested: number;
    deleted: number;
    failed: number;
    error?: string;
  }> => {
    if (!ids || ids.length === 0) {
      return { success: true, requested: 0, deleted: 0, failed: 0 };
    }

    const idsSet = new Set(ids);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('tasks').update({ deleted: true }).in('id', ids);
        if (error) {
          console.error('Error bulk deleting tasks in Supabase:', error);
          return {
            success: false,
            requested: ids.length,
            deleted: 0,
            failed: ids.length,
            error: error.message
          };
        }
      } catch (e: any) {
        console.error('Error during bulk task deletion in Supabase:', e);
        return {
          success: false,
          requested: ids.length,
          deleted: 0,
          failed: ids.length,
          error: e.message || String(e)
        };
      }
    }

    // Filter remaining active tasks and resequence strictly by created_at ASC, id ASC
    const remaining = tasks.filter(t => !idsSet.has(t.id) && !t.deleted);
    const { resequencedTasks, hasChanges, changedTasks } = resequenceTasks(remaining);

    if (isSupabaseConfigured && hasChanges) {
      try {
        for (const changed of changedTasks) {
          await supabase.from('tasks').update({ code: changed.code }).eq('id', changed.id);
        }
      } catch (e) {
        console.error('Error updating task codes after bulk deletion:', e);
      }
    }

    setTasks(resequencedTasks);
    saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);
    logActivity('bulk deleted operational tasks', 'task', `${ids.length} tasks removed`);

    return {
      success: true,
      requested: ids.length,
      deleted: ids.length,
      failed: 0
    };
  };

  const repairTaskNumberingSequence = async (): Promise<{
    totalTasks: number;
    resequencedCount: number;
    duplicatesRemoved: number;
    gapsResolved: number;
  }> => {
    let sourceTasks = tasks;
    if (isSupabaseConfigured) {
      try {
        const { data: tasksData, error: tasksErr } = await supabase.from('tasks').select('*').range(0, 999999);
        if (!tasksErr && tasksData) {
          sourceTasks = tasksData.map(mapTaskFromDb).filter(t => !t.deleted);
        }
      } catch (e) {
        console.error('Error fetching tasks for repair:', e);
      }
    }

    const { resequencedTasks, hasChanges, changedTasks, duplicatesCount, gapsCount } = resequenceTasks(sourceTasks);

    if (isSupabaseConfigured && hasChanges) {
      try {
        for (const changed of changedTasks) {
          await supabase.from('tasks').update({ code: changed.code }).eq('id', changed.id);
        }
      } catch (e) {
        console.error('Error persisting repaired task codes:', e);
      }
    }

    setTasks(resequencedTasks);
    saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);

    return {
      totalTasks: resequencedTasks.length,
      resequencedCount: changedTasks.length,
      duplicatesRemoved: duplicatesCount,
      gapsResolved: gapsCount
    };
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updatedChecklist = target.checklist.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const completedCount = updatedChecklist.filter(s => s.completed).length;
    const progress = updatedChecklist.length > 0 ? Math.round((completedCount / updatedChecklist.length) * 100) : target.progress;
    const status = progress === 100 ? 'Completed' : target.status;

    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? {
        ...t,
        checklist: updatedChecklist,
        progress,
        status,
        completionDate: progress === 100 ? new Date().toISOString().split('T')[0] : t.completionDate
      } : t);
      saveToStorage(TASKS_STORAGE_KEY, updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({
          checklist: updatedChecklist,
          progress,
          status,
          completion_date: progress === 100 ? new Date().toISOString().split('T')[0] : target.completionDate
        }).eq('id', taskId);
      } catch (e) {
        console.error('Error toggling subtask in Supabase:', e);
      }
    }
  };

  const addComment = async (taskId: string, content: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const newComm = {
      id: `c-${Date.now()}`,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedComments = [...(target.comments || []), newComm];

    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, comments: updatedComments } : t);
      saveToStorage(TASKS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity('commented on task', 'task', target.title, content);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({ comments: updatedComments }).eq('id', taskId);
      } catch (e) {
        console.error('Error adding comment in Supabase:', e);
      }
    }
  };

  const addAttachment = async (taskId: string, file: { name: string; size: string; url: string }) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const newAtt = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      url: file.url,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    const updatedAttachments = [...(target.attachments || []), newAtt];

    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, attachments: updatedAttachments } : t);
      saveToStorage(TASKS_STORAGE_KEY, updated);
      return updated;
    });

    logActivity('attached document to', 'task', target.title, file.name);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').update({ attachments: updatedAttachments }).eq('id', taskId);
      } catch (e) {
        console.error('Error adding attachment in Supabase:', e);
      }
    }
  };

  // Notifications Management
  const markNotificationRead = async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage(NOTIFICATIONS_STORAGE_KEY, updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (e) {
        console.error('Error updating notification in Supabase:', e);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveToStorage(NOTIFICATIONS_STORAGE_KEY, updated);
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ read: true }).neq('id', '');
      } catch (e) {
        console.error('Error updating all notifications in Supabase:', e);
      }
    }
  };

  // Backup & Restore & Reset
  const backupDatabase = () => {
    const data = {
      users,
      tasks,
      dependencies,
      activities,
      notifications,
      settings,
      backupTimestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const restoreDatabase = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        if (parsed.settings && typeof parsed.settings === 'object') {
          updateSettings(parsed.settings);
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          setUsers(parsed.users);
          saveToStorage(USERS_STORAGE_KEY, parsed.users);
        }
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          const { resequencedTasks } = resequenceTasks(parsed.tasks.filter((t: any) => !t.deleted));
          setTasks(resequencedTasks);
          saveToStorage(TASKS_STORAGE_KEY, resequencedTasks);
          if (isSupabaseConfigured) {
            supabase.from('tasks').upsert(resequencedTasks.map(mapTaskToDb));
          }
        }
        if (parsed.activities && Array.isArray(parsed.activities)) {
          setActivities(parsed.activities);
          saveToStorage(ACTIVITIES_STORAGE_KEY, parsed.activities);
        }
        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications);
          saveToStorage(NOTIFICATIONS_STORAGE_KEY, parsed.notifications);
        }

        if (isSupabaseConfigured) {
          if (parsed.users && Array.isArray(parsed.users)) {
            supabase.from('users').upsert(parsed.users.map(mapUserToDb));
          }
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to restore database backup', e);
    }
    return false;
  };

  const resetToDefaults = async () => {
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
      localStorage.removeItem(USERS_STORAGE_KEY);
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Error resetting localStorage defaults:', e);
    }
    setSettings(DEFAULT_SETTINGS);
    setTasks([]);
    setUsers([DEFAULT_ADMIN]);
    setActivities([]);
    setNotifications([]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').delete().neq('id', '');
        await supabase.from('tasks').delete().neq('id', '');
        await supabase.from('dependencies').delete().neq('id', '');
        await supabase.from('notifications').delete().neq('id', '');
        await supabase.from('activities').delete().neq('id', '');
        await supabase.from('settings').upsert([mapSettingsToDb(DEFAULT_SETTINGS)]);
      } catch (e) {
        console.error('Error resetting database in Supabase:', e);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      currentUser,
      sessionExpiredMessage,
      login,
      logout,
      clearSessionExpiredMessage,
      activeTab,
      setActiveTab,
      users,
      addUser,
      updateUser,
      deleteUser,
      bulkDeleteUsers,
      bulkDeactivateUsers,
      settings,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      toggleTheme,
      searchQuery,
      setSearchQuery,
      isSearchOpen,
      setIsSearchOpen,
      taskFilters,
      setTaskFilters,
      setTaskFilterPreset,
      resetTaskFilters,
      tasks: tasks.filter(t => !t.deleted),
      dependencies,
      activities,
      notifications,
      addTask,
      updateTask,
      deleteTask,
      bulkDeleteTasks,
      repairTaskNumberingSequence,
      toggleSubtask,
      addComment,
      addAttachment,
      markNotificationRead,
      markAllNotificationsRead,
      backupDatabase,
      restoreDatabase,
      resetToDefaults
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

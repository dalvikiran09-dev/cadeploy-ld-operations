-- ==========================================
-- CADEPLOY L&D Operations - Supabase Schema
-- ==========================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'Team Member',
  department TEXT DEFAULT 'L&D',
  designation TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  "createdDate" TEXT DEFAULT CURRENT_DATE,
  avatar TEXT DEFAULT ''
);

-- DEFAULT ADMINISTRATOR ACCOUNT
INSERT INTO public.users (id, name, username, password, role, department, designation, status, "createdDate", avatar)
VALUES (
  'u-admin',
  'Administrator',
  'admin',
  'admin123',
  'Administrator',
  'Learning & Development',
  'System Administrator',
  'Active',
  CURRENT_DATE::text,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  "assignedUserId" TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  "startDate" TEXT DEFAULT '',
  "dueDate" TEXT DEFAULT '',
  "completionDate" TEXT,
  "estimatedHours" NUMERIC DEFAULT 0,
  "actualHours" NUMERIC DEFAULT 0,
  progress NUMERIC DEFAULT 0,
  checklist JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  reminder TEXT,
  recurring TEXT DEFAULT 'None',
  tags JSONB DEFAULT '[]'::jsonb,
  "parentTaskId" TEXT,
  "isMilestone" BOOLEAN DEFAULT false,
  "createdAt" TEXT DEFAULT CURRENT_DATE,
  deleted BOOLEAN DEFAULT false
);

-- 3. DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS public.dependencies (
  id TEXT PRIMARY KEY,
  "predecessorTaskId" TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  "successorTaskId" TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'finish_to_start'
);

-- 4. TIME LOGS TABLE
CREATE TABLE IF NOT EXISTS public.time_logs (
  id TEXT PRIMARY KEY,
  "taskId" TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  hours NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  date TEXT DEFAULT CURRENT_DATE,
  "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
  link TEXT
);

-- 6. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  "userName" TEXT NOT NULL,
  "userAvatar" TEXT DEFAULT '',
  action TEXT NOT NULL,
  "targetType" TEXT DEFAULT 'task',
  "targetName" TEXT NOT NULL,
  timestamp TEXT DEFAULT 'Just now',
  details TEXT
);

-- 7. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'system_settings',
  "companyName" TEXT DEFAULT 'CADEPLOY',
  "departmentName" TEXT DEFAULT 'Learning & Development',
  "companyLogo" TEXT DEFAULT '',
  theme TEXT DEFAULT 'light',
  "emailNotifications" BOOLEAN DEFAULT true,
  "inAppNotifications" BOOLEAN DEFAULT true,
  "weeklySummary" BOOLEAN DEFAULT true,
  "compactView" BOOLEAN DEFAULT false,
  "autoSaveInterval" NUMERIC DEFAULT 5
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON public.tasks("assignedUserId");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_dependencies_predecessor ON public.dependencies("predecessorTaskId");
CREATE INDEX IF NOT EXISTS idx_dependencies_successor ON public.dependencies("successorTaskId");
CREATE INDEX IF NOT EXISTS idx_time_logs_task ON public.time_logs("taskId");
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON public.time_logs("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications("userId");
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities("userId");

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR FULL CRUD ACCESS (Anon & Authenticated)
CREATE POLICY "Allow select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow delete on users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow select on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow delete on tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow select on dependencies" ON public.dependencies FOR SELECT USING (true);
CREATE POLICY "Allow insert on dependencies" ON public.dependencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on dependencies" ON public.dependencies FOR UPDATE USING (true);
CREATE POLICY "Allow delete on dependencies" ON public.dependencies FOR DELETE USING (true);

CREATE POLICY "Allow select on time_logs" ON public.time_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on time_logs" ON public.time_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on time_logs" ON public.time_logs FOR UPDATE USING (true);
CREATE POLICY "Allow delete on time_logs" ON public.time_logs FOR DELETE USING (true);

CREATE POLICY "Allow select on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow delete on notifications" ON public.notifications FOR DELETE USING (true);

CREATE POLICY "Allow select on activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow insert on activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on activities" ON public.activities FOR UPDATE USING (true);
CREATE POLICY "Allow delete on activities" ON public.activities FOR DELETE USING (true);

CREATE POLICY "Allow select on settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow insert on settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow delete on settings" ON public.settings FOR DELETE USING (true);

-- ENABLE REALTIME REPLICATION FOR INSTANT MULTI-BROWSER SYNCHRONIZATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- ==============================================================================
-- 8. TRAINING MANAGEMENT SCHEMA
-- ==============================================================================

-- 8.1 TRAINING PROGRAMS
CREATE TABLE IF NOT EXISTS public.training_programs (
  id TEXT PRIMARY KEY,
  program_code TEXT NOT NULL UNIQUE,
  program_name TEXT NOT NULL,
  program_description TEXT,
  description TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8.2 TRAINING MODULES
CREATE TABLE IF NOT EXISTS public.training_modules (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.training_programs(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  duration TEXT DEFAULT '01:00:00',
  delivery_mode TEXT DEFAULT 'Classroom Training (Offline)',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8.3 TRAINING COURSES
CREATE TABLE IF NOT EXISTS public.training_courses (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL,
  program_code TEXT,
  module_code TEXT,
  program_id TEXT REFERENCES public.training_programs(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.training_modules(id) ON DELETE CASCADE,
  delivery_mode_1 TEXT,
  delivery_mode_2 TEXT,
  delivery_mode_3 TEXT,
  delivery_day NUMERIC DEFAULT 1,
  owner_role TEXT DEFAULT 'Manager - Learning & Development',
  course_status TEXT DEFAULT 'Approved',
  status TEXT DEFAULT 'Approved',
  pre_assessment_code TEXT,
  post_assessment_code TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8.4 TRAINING IMPORT LOGS
CREATE TABLE IF NOT EXISTS public.training_import_logs (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  imported_by TEXT NOT NULL,
  programs_added NUMERIC DEFAULT 0,
  programs_updated NUMERIC DEFAULT 0,
  modules_added NUMERIC DEFAULT 0,
  modules_updated NUMERIC DEFAULT 0,
  courses_added NUMERIC DEFAULT 0,
  courses_updated NUMERIC DEFAULT 0,
  errors_count NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Success',
  log_details JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_programs_code ON public.training_programs (program_code);
CREATE INDEX IF NOT EXISTS idx_training_modules_code ON public.training_modules (module_code);
CREATE INDEX IF NOT EXISTS idx_training_modules_prog_id ON public.training_modules (program_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_code ON public.training_courses (course_code);
CREATE INDEX IF NOT EXISTS idx_training_courses_prog_code ON public.training_courses (program_code);
CREATE INDEX IF NOT EXISTS idx_training_courses_mod_code ON public.training_courses (module_code);
CREATE INDEX IF NOT EXISTS idx_training_courses_prog_id ON public.training_courses (program_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_mod_id ON public.training_courses (module_id);

-- 1. Enable RLS on all training tables
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_import_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop all legacy/conflicting policies to prevent duplicate conflicts
DO $$ 
BEGIN
  -- training_programs
  DROP POLICY IF EXISTS "Allow all access on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow select on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow insert on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow update on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow delete on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Authenticated users can select training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Authenticated users can insert training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Authenticated users can update training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Authenticated users can delete training_programs" ON public.training_programs;

  -- training_modules
  DROP POLICY IF EXISTS "Allow all access on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow select on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow insert on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow update on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow delete on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Authenticated users can select training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Authenticated users can insert training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Authenticated users can update training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Authenticated users can delete training_modules" ON public.training_modules;

  -- training_courses
  DROP POLICY IF EXISTS "Allow all access on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow select on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow insert on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow update on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow delete on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Authenticated users can select training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Authenticated users can insert training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Authenticated users can update training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Authenticated users can delete training_courses" ON public.training_courses;

  -- training_import_logs
  DROP POLICY IF EXISTS "Allow all access on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow select on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow insert on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow update on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow delete on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Authenticated users can select training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Authenticated users can insert training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Authenticated users can update training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Authenticated users can delete training_import_logs" ON public.training_import_logs;
END $$;

-- 3. Create explicit CRUD policies for Training Programs
CREATE POLICY "Allow select on training_programs" ON public.training_programs FOR SELECT USING (true);
CREATE POLICY "Allow insert on training_programs" ON public.training_programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on training_programs" ON public.training_programs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on training_programs" ON public.training_programs FOR DELETE USING (true);

-- 4. Create explicit CRUD policies for Training Modules
CREATE POLICY "Allow select on training_modules" ON public.training_modules FOR SELECT USING (true);
CREATE POLICY "Allow insert on training_modules" ON public.training_modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on training_modules" ON public.training_modules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on training_modules" ON public.training_modules FOR DELETE USING (true);

-- 5. Create explicit CRUD policies for Training Courses
CREATE POLICY "Allow select on training_courses" ON public.training_courses FOR SELECT USING (true);
CREATE POLICY "Allow insert on training_courses" ON public.training_courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on training_courses" ON public.training_courses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on training_courses" ON public.training_courses FOR DELETE USING (true);

-- 6. Create explicit CRUD policies for Training Import Logs
CREATE POLICY "Allow select on training_import_logs" ON public.training_import_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on training_import_logs" ON public.training_import_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on training_import_logs" ON public.training_import_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on training_import_logs" ON public.training_import_logs FOR DELETE USING (true);

-- Enable Realtime for Training Management tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_programs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_modules;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_courses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_import_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';


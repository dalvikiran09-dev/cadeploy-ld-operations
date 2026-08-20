-- ==========================================
-- CADEPLOY L&D Operations - Supabase Schema
-- Standardized snake_case database model
-- ==========================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  email TEXT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'Team Member',
  department TEXT DEFAULT 'L&D',
  designation TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  created_date TEXT DEFAULT CURRENT_DATE,
  avatar TEXT DEFAULT ''
);

-- Ensure auth_user_id and email columns exist on existing public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users (LOWER(email)) WHERE email IS NOT NULL;

-- DEFAULT ADMINISTRATOR ACCOUNT
INSERT INTO public.users (id, auth_user_id, email, name, username, password, role, department, designation, status, created_date, avatar)
VALUES (
  'u-admin',
  'd9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320',
  'kiran.dalvi@cadeploy.com',
  'Kiran Dalvi',
  'admin',
  'Kitzer@123',
  'Administrator',
  'L&D',
  'System Administrator',
  'Active',
  CURRENT_DATE::text,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET
  auth_user_id = 'd9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320',
  email = 'kiran.dalvi@cadeploy.com',
  name = 'Kiran Dalvi',
  role = 'Administrator',
  status = 'Active';

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  assigned_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to TEXT,
  assigned_by TEXT,
  assigned_by_user_id TEXT,
  assigned_by_name TEXT,
  assigned_by_username TEXT,
  assigned_on TEXT,
  assignment_history JSONB DEFAULT '[]'::jsonb,
  start_date TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  completion_date TEXT,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  progress NUMERIC DEFAULT 0,
  checklist JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  reminder TEXT,
  recurring TEXT DEFAULT 'None',
  tags JSONB DEFAULT '[]'::jsonb,
  parent_task_id TEXT,
  is_milestone BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT CURRENT_DATE,
  deleted BOOLEAN DEFAULT false
);

-- 3. DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS public.dependencies (
  id TEXT PRIMARY KEY,
  predecessor_task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  successor_task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'finish_to_start'
);

-- 4. TIME LOGS TABLE
CREATE TABLE IF NOT EXISTS public.time_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  hours NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  date TEXT DEFAULT CURRENT_DATE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  link TEXT
);

-- 6. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT '',
  action TEXT NOT NULL,
  target_type TEXT DEFAULT 'task',
  target_name TEXT NOT NULL,
  timestamp TEXT DEFAULT 'Just now',
  details TEXT
);

-- 7. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'system_settings',
  company_name TEXT DEFAULT 'CADEPLOY',
  department_name TEXT DEFAULT 'Learning & Development',
  company_logo TEXT DEFAULT '',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  compact_view BOOLEAN DEFAULT false,
  auto_save_interval NUMERIC DEFAULT 5,
  categories JSONB DEFAULT '[]'::jsonb
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON public.tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_dependencies_predecessor ON public.dependencies(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_successor ON public.dependencies(successor_task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR FULL CRUD ACCESS (Anon & Authenticated)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on users') THEN
    CREATE POLICY "Allow select on users" ON public.users FOR SELECT USING (true);
    CREATE POLICY "Allow insert on users" ON public.users FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on users" ON public.users FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on users" ON public.users FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on tasks') THEN
    CREATE POLICY "Allow select on tasks" ON public.tasks FOR SELECT USING (true);
    CREATE POLICY "Allow insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on tasks" ON public.tasks FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on tasks" ON public.tasks FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on dependencies') THEN
    CREATE POLICY "Allow select on dependencies" ON public.dependencies FOR SELECT USING (true);
    CREATE POLICY "Allow insert on dependencies" ON public.dependencies FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on dependencies" ON public.dependencies FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on dependencies" ON public.dependencies FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on time_logs') THEN
    CREATE POLICY "Allow select on time_logs" ON public.time_logs FOR SELECT USING (true);
    CREATE POLICY "Allow insert on time_logs" ON public.time_logs FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on time_logs" ON public.time_logs FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on time_logs" ON public.time_logs FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on notifications') THEN
    CREATE POLICY "Allow select on notifications" ON public.notifications FOR SELECT USING (true);
    CREATE POLICY "Allow insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on notifications" ON public.notifications FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on notifications" ON public.notifications FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on activities') THEN
    CREATE POLICY "Allow select on activities" ON public.activities FOR SELECT USING (true);
    CREATE POLICY "Allow insert on activities" ON public.activities FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on activities" ON public.activities FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on activities" ON public.activities FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select on settings') THEN
    CREATE POLICY "Allow select on settings" ON public.settings FOR SELECT USING (true);
    CREATE POLICY "Allow insert on settings" ON public.settings FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow update on settings" ON public.settings FOR UPDATE USING (true);
    CREATE POLICY "Allow delete on settings" ON public.settings FOR DELETE USING (true);
  END IF;
END $$;

-- REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- ====================================================
-- SCHEMA MIGRATION: ADD ALL MISSING SNAKE_CASE COLUMNS
-- Execute this block to migrate existing databases safely
-- ====================================================

-- 1. USERS MIGRATION
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_date TEXT DEFAULT CURRENT_DATE;

-- 2. TASKS MIGRATION
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by_user_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by_name TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by_username TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_on TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignment_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completion_date TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring TEXT DEFAULT 'None';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- 3. DEPENDENCIES MIGRATION
ALTER TABLE public.dependencies ADD COLUMN IF NOT EXISTS predecessor_task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.dependencies ADD COLUMN IF NOT EXISTS successor_task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE;

-- 4. TIME LOGS MIGRATION
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 5. NOTIFICATIONS MIGRATION
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 6. ACTIVITIES MIGRATION
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'task';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS target_name TEXT NOT NULL DEFAULT '';

-- 7. SETTINGS MIGRATION
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'CADEPLOY';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS department_name TEXT DEFAULT 'Learning & Development';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS company_logo TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS auto_save_interval NUMERIC DEFAULT 5;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_import_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8.5 ROW LEVEL SECURITY (RLS) POLICIES FOR TRAINING MANAGEMENT
-- 1. Identity verified via auth.uid() / JWT claims mapped to public.users (role & active status)
-- 2. READ ACCESS: Any active authenticated user can SELECT
-- 3. WRITE ACCESS: Administrator, L&D Lead, and L&D Specialist can INSERT/UPDATE
-- 4. DELETE ACCESS: Administrator and L&D Lead only
-- ==============================================================================

-- 1. Auto-confirm any Supabase Auth users on creation (bypasses email confirmation requirement)
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_auth_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auto_confirm_auth_user();

UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 2. Enable RLS on all training tables
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_import_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop all legacy/conflicting policies and functions
DROP FUNCTION IF EXISTS public.is_admin_or_ld_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_ld_specialist() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_ld_lead() CASCADE;
DROP FUNCTION IF EXISTS public.is_active_app_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_app_user_id() CASCADE;

DO $$ 
BEGIN
  -- training_programs
  DROP POLICY IF EXISTS "Allow all access on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow select on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow insert on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow update on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow delete on training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "Allow read training_programs" ON public.training_programs;
  DROP POLICY IF EXISTS "training_programs_select" ON public.training_programs;
  DROP POLICY IF EXISTS "training_programs_insert" ON public.training_programs;
  DROP POLICY IF EXISTS "training_programs_update" ON public.training_programs;
  DROP POLICY IF EXISTS "training_programs_delete" ON public.training_programs;

  -- training_modules
  DROP POLICY IF EXISTS "Allow all access on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow select on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow insert on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow update on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow delete on training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "Allow read training_modules" ON public.training_modules;
  DROP POLICY IF EXISTS "training_modules_select" ON public.training_modules;
  DROP POLICY IF EXISTS "training_modules_insert" ON public.training_modules;
  DROP POLICY IF EXISTS "training_modules_update" ON public.training_modules;
  DROP POLICY IF EXISTS "training_modules_delete" ON public.training_modules;

  -- training_courses
  DROP POLICY IF EXISTS "Allow all access on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow select on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow insert on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow update on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow delete on training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "Allow read training_courses" ON public.training_courses;
  DROP POLICY IF EXISTS "training_courses_select" ON public.training_courses;
  DROP POLICY IF EXISTS "training_courses_insert" ON public.training_courses;
  DROP POLICY IF EXISTS "training_courses_update" ON public.training_courses;
  DROP POLICY IF EXISTS "training_courses_delete" ON public.training_courses;

  -- training_import_logs
  DROP POLICY IF EXISTS "Allow all access on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow select on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow insert on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow update on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow delete on training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "Allow read training_import_logs" ON public.training_import_logs;
  DROP POLICY IF EXISTS "training_import_logs_select" ON public.training_import_logs;
  DROP POLICY IF EXISTS "training_import_logs_insert" ON public.training_import_logs;
  DROP POLICY IF EXISTS "training_import_logs_update" ON public.training_import_logs;
  DROP POLICY IF EXISTS "training_import_logs_delete" ON public.training_import_logs;
END $$;

-- 4. Schema Adjustment: Ensure training_courses does not have legacy status column
ALTER TABLE public.training_courses DROP COLUMN IF EXISTS status;

-- 5. Helper Functions: Join auth.uid() directly against public.users.auth_user_id (or public.users.id fallback)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users
  WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text)
    AND status = 'Active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_active_app_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text)
      AND status = 'Active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_ld_specialist()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text)
      AND status = 'Active'
      AND role IN ('Administrator', 'L&D Lead', 'L&D Specialist', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_ld_lead()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE (auth_user_id = auth.uid() OR id = auth.uid()::text)
      AND status = 'Active'
      AND role IN ('Administrator', 'L&D Lead', 'admin')
  );
$$;

-- 6. READ ACCESS: Any active user in public.users or authenticated application user
CREATE POLICY "training_programs_select"
  ON public.training_programs FOR SELECT
  TO public
  USING (public.is_active_app_user());

CREATE POLICY "training_modules_select"
  ON public.training_modules FOR SELECT
  TO public
  USING (public.is_active_app_user());

CREATE POLICY "training_courses_select"
  ON public.training_courses FOR SELECT
  TO public
  USING (public.is_active_app_user());

CREATE POLICY "training_import_logs_select"
  ON public.training_import_logs FOR SELECT
  TO public
  USING (public.is_active_app_user());

-- 7. WRITE ACCESS (INSERT/UPDATE): Administrator, L&D Lead, L&D Specialist
CREATE POLICY "training_programs_insert"
  ON public.training_programs FOR INSERT
  TO public
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_programs_update"
  ON public.training_programs FOR UPDATE
  TO public
  USING (public.is_admin_or_ld_specialist())
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_modules_insert"
  ON public.training_modules FOR INSERT
  TO public
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_modules_update"
  ON public.training_modules FOR UPDATE
  TO public
  USING (public.is_admin_or_ld_specialist())
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_courses_insert"
  ON public.training_courses FOR INSERT
  TO public
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_courses_update"
  ON public.training_courses FOR UPDATE
  TO public
  USING (public.is_admin_or_ld_specialist())
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_import_logs_insert"
  ON public.training_import_logs FOR INSERT
  TO public
  WITH CHECK (public.is_admin_or_ld_specialist());

CREATE POLICY "training_import_logs_update"
  ON public.training_import_logs FOR UPDATE
  TO public
  USING (public.is_admin_or_ld_specialist())
  WITH CHECK (public.is_admin_or_ld_specialist());

-- 8. DELETE ACCESS: Administrator and L&D Lead only
CREATE POLICY "training_programs_delete"
  ON public.training_programs FOR DELETE
  TO public
  USING (public.is_admin_or_ld_lead());

CREATE POLICY "training_modules_delete"
  ON public.training_modules FOR DELETE
  TO public
  USING (public.is_admin_or_ld_lead());

CREATE POLICY "training_courses_delete"
  ON public.training_courses FOR DELETE
  TO public
  USING (public.is_admin_or_ld_lead());

CREATE POLICY "training_import_logs_delete"
  ON public.training_import_logs FOR DELETE
  TO public
  USING (public.is_admin_or_ld_lead());

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

-- ==============================================================================
-- 9. PROVISION / SYNCHRONIZE SUPABASE AUTH USERS & LINK TO public.users.auth_user_id
-- Ensures Kiran Dalvi ('u-admin', auth_user_id = 'd9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320')
-- and Anoz Panduri ('u-1785330774966') are confirmed and linked to public.users.
-- ==============================================================================
DO $$
DECLARE
  v_admin_auth_id UUID := 'd9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320';
  v_anoz_auth_id UUID;
BEGIN
  -- 1. Synchronize existing admin auth user (d9f4a6dd-cc87-48a2-a66e-6d4c0c3cd320)
  -- Confirm email and update to kiran.dalvi@cadeploy.com if needed
  UPDATE auth.users
  SET email = 'kiran.dalvi@cadeploy.com',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = '{"name": "Kiran Dalvi", "username": "admin", "role": "Administrator"}'::jsonb,
      updated_at = now()
  WHERE id = v_admin_auth_id OR email IN ('admin@cadeploy.com', 'kiran.dalvi@cadeploy.com', 'dalvikiran09@gmail.com');

  -- Ensure public.users for Kiran Dalvi is completely up to date
  UPDATE public.users 
  SET auth_user_id = v_admin_auth_id,
      email = 'kiran.dalvi@cadeploy.com',
      name = 'Kiran Dalvi',
      username = 'admin',
      status = 'Active',
      role = 'Administrator',
      password = 'Kitzer@123'
  WHERE id = 'u-admin' OR username = 'admin';

  -- 2. Provision / Retrieve Anoz (anoz.panduri@cadeploy.com / Anoz)
  SELECT id INTO v_anoz_auth_id FROM auth.users WHERE email = 'anoz.panduri@cadeploy.com' LIMIT 1;
  IF v_anoz_auth_id IS NULL THEN
    v_anoz_auth_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_anoz_auth_id,
      'authenticated',
      'authenticated',
      'anoz.panduri@cadeploy.com',
      crypt('User@123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Anoz Panduri", "username": "Anoz", "role": "L&D Lead"}'::jsonb,
      now(),
      now(),
      '',
      false
    );
  ELSE
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = v_anoz_auth_id;
  END IF;

  -- Link auth_user_id to u-1785330774966
  UPDATE public.users 
  SET auth_user_id = v_anoz_auth_id,
      email = 'anoz.panduri@cadeploy.com',
      status = 'Active',
      role = 'L&D Lead',
      password = 'User@123'
  WHERE id = 'u-1785330774966' OR username ILIKE 'anoz%';

END $$;

-- ==============================================================================
-- 10. TRAINING BATCHES & ATTENDANCE MANAGEMENT SCHEMA & MIGRATION
-- ==============================================================================

-- 1. Training Batches Table
CREATE TABLE IF NOT EXISTS public.training_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT NOT NULL UNIQUE,
  program_id TEXT,
  program_code TEXT NOT NULL,
  program_name TEXT,
  batch_type TEXT DEFAULT 'Regular',
  batch_location TEXT DEFAULT 'Hyderabad',
  facilitator_code TEXT,
  facilitator_name TEXT,
  facilitator_email TEXT,
  batch_created_date TEXT,
  head_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Planned',
  program_requested_date TEXT,
  program_request_accepted_date TEXT,
  program_requested_start_date TEXT,
  program_proposed_start_date TEXT,
  schedule_code TEXT,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_id TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_code TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS batch_type TEXT DEFAULT 'Regular';
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS batch_location TEXT DEFAULT 'Hyderabad';
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS facilitator_code TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS facilitator_name TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS facilitator_email TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS batch_created_date TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS head_count INTEGER DEFAULT 0;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Planned';
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_requested_date TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_request_accepted_date TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_requested_start_date TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS program_proposed_start_date TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS schedule_code TEXT;
ALTER TABLE public.training_batches ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- 2. Training Batch Schedules Table
CREATE TABLE IF NOT EXISTS public.training_batch_schedules (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  day_number INTEGER DEFAULT 1,
  activity_date TEXT,
  activity TEXT,
  module_id TEXT,
  module_code TEXT,
  module_name TEXT,
  duration_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Completed',
  arrangements TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS batch_code TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS activity_date TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS activity TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS module_code TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS module_name TEXT;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS duration_hours NUMERIC DEFAULT 0;
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Completed';
ALTER TABLE public.training_batch_schedules ADD COLUMN IF NOT EXISTS arrangements TEXT DEFAULT 'Completed';

-- 3. Training Batch Nominees Table
CREATE TABLE IF NOT EXISTS public.training_batch_nominees (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  employee_name TEXT,
  department TEXT,
  designation TEXT,
  email TEXT,
  nominator_employee_code TEXT,
  nomination_datetime TEXT,
  target_competencies TEXT,
  current_levels TEXT,
  status TEXT DEFAULT 'Nominated',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT training_batch_nominees_batch_emp_unique UNIQUE (batch_id, employee_code)
);

ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS batch_code TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS nominator_employee_code TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS nomination_datetime TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS target_competencies TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS current_levels TEXT;
ALTER TABLE public.training_batch_nominees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Nominated';

-- 4. Training Attendance Table
CREATE TABLE IF NOT EXISTS public.training_attendance (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES public.training_batches(id) ON DELETE CASCADE,
  batch_code TEXT,
  employee_code TEXT NOT NULL,
  module_id TEXT,
  module_code TEXT NOT NULL,
  session_date TEXT,
  reported_datetime TEXT,
  intermittent_exit_time TEXT,
  intermittent_entry_time TEXT,
  completed_datetime TEXT,
  status TEXT NOT NULL DEFAULT 'Present',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safe Composite Unique Migration for public.training_attendance
-- Resolves duplicates before applying the composite constraint: (batch_id, employee_code, module_code, session_date)
DO $$
BEGIN
  -- 1. Ensure columns exist
  ALTER TABLE public.training_attendance ADD COLUMN IF NOT EXISTS batch_code TEXT;
  ALTER TABLE public.training_attendance ADD COLUMN IF NOT EXISTS session_date TEXT;
  ALTER TABLE public.training_attendance ADD COLUMN IF NOT EXISTS intermittent_exit_time TEXT;
  ALTER TABLE public.training_attendance ADD COLUMN IF NOT EXISTS intermittent_entry_time TEXT;

  -- 2. Populate session_date from reported_datetime or created_at if null
  UPDATE public.training_attendance 
  SET session_date = COALESCE(
    session_date, 
    SUBSTRING(reported_datetime FROM 1 FOR 11), 
    TO_CHAR(created_at, 'DD-Mon-YYYY')
  )
  WHERE session_date IS NULL OR session_date = '';

  -- 3. Remove duplicates keeping the latest record
  DELETE FROM public.training_attendance a
  USING public.training_attendance b
  WHERE a.id < b.id
    AND a.batch_id = b.batch_id
    AND UPPER(a.employee_code) = UPPER(b.employee_code)
    AND UPPER(a.module_code) = UPPER(b.module_code)
    AND COALESCE(a.session_date, '') = COALESCE(b.session_date, '');

  -- 4. Drop legacy single-session constraint if exists and apply new composite unique constraint
  ALTER TABLE public.training_attendance DROP CONSTRAINT IF EXISTS training_attendance_batch_emp_mod_unique;
  ALTER TABLE public.training_attendance DROP CONSTRAINT IF EXISTS training_attendance_batch_emp_mod_date_unique;

  ALTER TABLE public.training_attendance
  ADD CONSTRAINT training_attendance_batch_emp_mod_date_unique 
  UNIQUE (batch_id, employee_code, module_code, session_date);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration note: %', SQLERRM;
END $$;

-- 5. Batch Import History Table
CREATE TABLE IF NOT EXISTS public.training_batch_import_history (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT now(),
  imported_by TEXT,
  batches_count INTEGER DEFAULT 0,
  schedules_count INTEGER DEFAULT 0,
  nominees_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Success',
  error_message TEXT,
  raw_summary JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS & Realtime on Batch & Attendance Tables
ALTER TABLE public.training_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_batch_import_history ENABLE ROW LEVEL SECURITY;

-- Allow policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_batches_all_access') THEN
    CREATE POLICY "training_batches_all_access" ON public.training_batches FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_schedules_all_access') THEN
    CREATE POLICY "training_schedules_all_access" ON public.training_batch_schedules FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_nominees_all_access') THEN
    CREATE POLICY "training_nominees_all_access" ON public.training_batch_nominees FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_attendance_all_access') THEN
    CREATE POLICY "training_attendance_all_access" ON public.training_attendance FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_import_history_all_access') THEN
    CREATE POLICY "training_import_history_all_access" ON public.training_batch_import_history FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime
DO $
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_batches; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_batch_schedules; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_batch_nominees; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_attendance; EXCEPTION WHEN OTHERS THEN NULL; END;
END $;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 11. EMPLOYEE TRAINING MASTER, ASSESSMENTS & PKTS (PRACTICAL / KNOWLEDGE TESTS)
-- ==============================================================================

-- 1. Training Employees Master Table
CREATE TABLE IF NOT EXISTS public.training_employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  department TEXT DEFAULT 'Engineering',
  designation TEXT DEFAULT 'Trainee',
  email TEXT,
  joining_date TEXT,
  status TEXT DEFAULT 'Active',
  target_competencies TEXT,
  current_levels TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Trainee';
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS joining_date TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS target_competencies TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS current_levels TEXT;
ALTER TABLE public.training_employees ADD COLUMN IF NOT EXISTS avatar TEXT;

CREATE INDEX IF NOT EXISTS idx_training_employees_code ON public.training_employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_training_employees_dept ON public.training_employees(department);

-- 2. Training Assessments Table
CREATE TABLE IF NOT EXISTS public.training_assessments (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_code TEXT NOT NULL,
  employee_name TEXT,
  department TEXT,
  program_id TEXT,
  program_code TEXT NOT NULL,
  program_name TEXT,
  module_id TEXT,
  module_code TEXT,
  module_name TEXT,
  batch_id TEXT,
  batch_code TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'Pre-Assessment',
  assessment_date TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  maximum_score NUMERIC DEFAULT 100,
  score_obtained NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  result TEXT DEFAULT 'Pass',
  evaluator TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted BOOLEAN DEFAULT false
);

ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS program_id TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS program_code TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS module_code TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS module_name TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS batch_code TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'Pre-Assessment';
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS assessment_date TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS maximum_score NUMERIC DEFAULT 100;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS score_obtained NUMERIC DEFAULT 0;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'Pass';
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS evaluator TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.training_assessments ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_training_assessments_emp ON public.training_assessments(employee_code);
CREATE INDEX IF NOT EXISTS idx_training_assessments_prog ON public.training_assessments(program_code);
CREATE INDEX IF NOT EXISTS idx_training_assessments_batch ON public.training_assessments(batch_id);
CREATE INDEX IF NOT EXISTS idx_training_assessments_type ON public.training_assessments(assessment_type);

-- 3. Training PKTs (Practical / Knowledge Tests) Table
CREATE TABLE IF NOT EXISTS public.training_pkts (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_code TEXT NOT NULL,
  employee_name TEXT,
  department TEXT,
  program_id TEXT,
  program_code TEXT NOT NULL,
  program_name TEXT,
  module_id TEXT,
  module_code TEXT,
  module_name TEXT,
  batch_id TEXT,
  batch_code TEXT,
  pkt_type TEXT DEFAULT 'Standard PKT',
  pkt_date TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  maximum_score NUMERIC DEFAULT 100,
  score_obtained NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  result TEXT DEFAULT 'Pass',
  evaluator TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted BOOLEAN DEFAULT false
);

ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS program_id TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS program_code TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS module_code TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS module_name TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS batch_code TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS pkt_type TEXT DEFAULT 'Standard PKT';
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS pkt_date TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS maximum_score NUMERIC DEFAULT 100;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS score_obtained NUMERIC DEFAULT 0;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'Pass';
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS evaluator TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.training_pkts ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_training_pkts_emp ON public.training_pkts(employee_code);
CREATE INDEX IF NOT EXISTS idx_training_pkts_prog ON public.training_pkts(program_code);
CREATE INDEX IF NOT EXISTS idx_training_pkts_batch ON public.training_pkts(batch_id);

-- Enable RLS
ALTER TABLE public.training_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_pkts ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_employees_all_access') THEN
    CREATE POLICY "training_employees_all_access" ON public.training_employees FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_assessments_all_access') THEN
    CREATE POLICY "training_assessments_all_access" ON public.training_assessments FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'training_pkts_all_access') THEN
    CREATE POLICY "training_pkts_all_access" ON public.training_pkts FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $;

-- Enable Realtime
DO $
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_employees; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_assessments; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_pkts; EXCEPTION WHEN OTHERS THEN NULL; END;
END $;

NOTIFY pgrst, 'reload schema';





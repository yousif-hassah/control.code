-- ============================================================
-- Control Enterprise — Database Schema (Fixed Type Casts)
-- شغّل هذا الملف في Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. WORKSPACES — مساحات العمل
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  plan        TEXT DEFAULT 'free',  -- free | pro | enterprise
  owner_id    TEXT NOT NULL,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  email        TEXT,
  role         TEXT DEFAULT 'member', -- owner | admin | manager | member | guest
  status       TEXT DEFAULT 'active', -- active | invited | suspended
  invited_by   TEXT,
  joined_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. WIKI PAGES — المستندات
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wiki_pages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  group_id     TEXT,
  parent_id    UUID REFERENCES wiki_pages(id),
  title        TEXT NOT NULL DEFAULT 'Untitled Page',
  content      JSONB DEFAULT '{"blocks":[]}',
  icon         TEXT DEFAULT '📄',
  cover_url    TEXT,
  created_by   TEXT NOT NULL,
  updated_by   TEXT,
  is_public    BOOLEAN DEFAULT FALSE,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. KANBAN BOARDS — لوحات المشاريع
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_boards (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  name         TEXT NOT NULL,
  description  TEXT,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id   UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id     UUID REFERENCES kanban_columns(id) ON DELETE CASCADE,
  board_id      UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  priority      TEXT DEFAULT 'medium', -- low | medium | high | urgent
  status        TEXT DEFAULT 'todo',
  assigned_to   TEXT,
  assigned_name TEXT,
  due_date      DATE,
  tags          TEXT[] DEFAULT '{}',
  attachments   JSONB DEFAULT '[]',
  sort_order    INT DEFAULT 0,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  user_name  TEXT,
  user_image TEXT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. FILE SHARING — مشاركة الملفات
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      TEXT,
  workspace_id  UUID REFERENCES workspaces(id),
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  file_size     BIGINT DEFAULT 0,
  uploaded_by   TEXT NOT NULL,
  uploader_name TEXT,
  folder        TEXT DEFAULT 'General',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. TIME TRACKING — تتبع الوقت
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  user_name  TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at   TIMESTAMPTZ,
  duration   INT,  -- seconds
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. TEAM CALENDAR — تقويم الفريق
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  title        TEXT NOT NULL,
  description  TEXT,
  event_type   TEXT DEFAULT 'meeting', -- meeting | deadline | milestone | reminder
  start_date   DATE NOT NULL,
  end_date     DATE,
  start_time   TIME,
  end_time     TIME,
  all_day      BOOLEAN DEFAULT TRUE,
  color        TEXT DEFAULT '#4F46E5',
  created_by   TEXT NOT NULL,
  attendees    JSONB DEFAULT '[]',
  task_id      UUID REFERENCES kanban_tasks(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. OFFLINE SYNC QUEUE — طابور المزامنة
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_queue (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  operation   TEXT NOT NULL, -- insert | update | delete
  record_id   UUID,
  payload     JSONB NOT NULL,
  synced      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY — الحماية (Casting Fix)
-- ─────────────────────────────────────────────

-- Wiki Pages
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view group pages" ON wiki_pages;
CREATE POLICY "Members can view group pages" ON wiki_pages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id::text FROM group_members WHERE user_id::text = auth.uid()::text
    ) OR is_public = TRUE
  );

DROP POLICY IF EXISTS "Members can create pages" ON wiki_pages;
CREATE POLICY "Members can create pages" ON wiki_pages
  FOR INSERT WITH CHECK (
    created_by::text = auth.uid()::text AND
    group_id IN (
      SELECT group_id::text FROM group_members WHERE user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Creator can update pages" ON wiki_pages;
CREATE POLICY "Creator can update pages" ON wiki_pages
  FOR UPDATE USING (created_by::text = auth.uid()::text);

-- Kanban Tasks
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Board members can view tasks" ON kanban_tasks;
CREATE POLICY "Board members can view tasks" ON kanban_tasks
  FOR SELECT USING (
    board_id IN (
      SELECT kb.id FROM kanban_boards kb
      JOIN group_members gm ON gm.group_id::text = kb.group_id::text
      WHERE gm.user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Board members can manage tasks" ON kanban_tasks;
CREATE POLICY "Board members can manage tasks" ON kanban_tasks
  FOR ALL USING (
    board_id IN (
      SELECT kb.id FROM kanban_boards kb
      JOIN group_members gm ON gm.group_id::text = kb.group_id::text
      WHERE gm.user_id::text = auth.uid()::text
    )
  );

-- Files
ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can view files" ON workspace_files;
CREATE POLICY "Group members can view files" ON workspace_files
  FOR SELECT USING (
    group_id IN (
      SELECT group_id::text FROM group_members WHERE user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members can upload files" ON workspace_files;
CREATE POLICY "Members can upload files" ON workspace_files
  FOR INSERT WITH CHECK (uploaded_by::text = auth.uid()::text);

-- Team Events
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view events" ON team_events;
CREATE POLICY "Members can view events" ON team_events
  FOR SELECT USING (
    group_id IN (
      SELECT group_id::text FROM group_members WHERE user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members can create events" ON team_events;
CREATE POLICY "Members can create events" ON team_events
  FOR ALL USING (
    group_id IN (
      SELECT group_id::text FROM group_members WHERE user_id::text = auth.uid()::text
    )
  );

-- Time Logs
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own time logs" ON time_logs;
CREATE POLICY "Users see own time logs" ON time_logs
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own time logs" ON time_logs;
CREATE POLICY "Users manage own time logs" ON time_logs
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ─────────────────────────────────────────────
-- 9. REALTIME — تفعيل الوقت الفعلي
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kanban_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kanban_tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wiki_pages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wiki_pages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'team_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'workspace_files') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workspace_files;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- ✅ تم إصلاح كافة أنواع البيانات والـ RLS Casts!
-- ─────────────────────────────────────────────

-- ============================================
-- Complete Groups System with Tasks & Collaboration
-- ============================================

-- 1. إضافة جدول group_tasks (المهام الجماعية)
CREATE TABLE IF NOT EXISTS public.group_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID, -- user_id of assigned member (NULL = anyone can do it)
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER DEFAULT 0,
  depends_on UUID REFERENCES public.group_tasks(id) ON DELETE SET NULL, -- Task dependency
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID
);

-- 2. إضافة جدول group_updates (التحديثات والإعلانات)
CREATE TABLE IF NOT EXISTS public.group_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'update' CHECK (type IN ('update', 'announcement', 'achievement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إضافة جدول group_files (الملفات والصور المشتركة)
CREATE TABLE IF NOT EXISTS public.group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'document', 'audio', 'video'
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. تحديث جدول group_messages لدعم الملفات
ALTER TABLE public.group_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 5. إضافة Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_group_tasks_group_id ON public.group_tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_tasks_assigned_to ON public.group_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_group_tasks_status ON public.group_tasks(status);
CREATE INDEX IF NOT EXISTS idx_group_updates_group_id ON public.group_updates(group_id);
CREATE INDEX IF NOT EXISTS idx_group_files_group_id ON public.group_files(group_id);

-- 6. تعطيل RLS للاختبار
ALTER TABLE public.group_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_files DISABLE ROW LEVEL SECURITY;

-- 7. تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_updates;

-- ============================================
-- Done! الآن لديك نظام مجموعات كامل
-- ============================================

-- للتحقق من الجداول:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'group%';

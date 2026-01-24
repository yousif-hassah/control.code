-- ============================================
-- 1. Setup Storage for Groups
-- ============================================
-- اذهب إلى Storage في Supabase وأنشئ Bucket باسم: group-files
-- اجعله Public لتسهيل عرض الصور.

-- ============================================
-- 2. Fix Database Schema for Tasks & Assignments
-- ============================================

-- تأكد من وجود الجداول وتحديث العلاقات
DROP TABLE IF EXISTS public.group_tasks CASCADE;

CREATE TABLE public.group_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- الربط مع ملفات المستخدمين
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id)
);

-- ============================================
-- 3. تفعيل الـ Realtime للرسائل والمهام
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_files;

-- ============================================
-- 4. سياسات الوصول (RLS) - تعطيل للأمان البسيط حالياً
-- ============================================
ALTER TABLE public.group_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_files DISABLE ROW LEVEL SECURITY;

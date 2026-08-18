-- ============================================
-- Zen Garden System (الحديقة الرقمية المشتركة)
-- ============================================

-- 1. إضافة جدول group_gardens
CREATE TABLE IF NOT EXISTS public.group_gardens (
  group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 NOT NULL,
  experience INTEGER DEFAULT 0 NOT NULL,
  water_drops INTEGER DEFAULT 0 NOT NULL,
  last_watered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_watered_by TEXT, -- معرف المستخدم من Clerk أو Supabase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. إضافة Index للأداء
CREATE INDEX IF NOT EXISTS idx_group_gardens_group_id ON public.group_gardens(group_id);

-- 3. تعطيل RLS للاختبار والتطوير
ALTER TABLE public.group_gardens DISABLE ROW LEVEL SECURITY;

-- 4. تفعيل Realtime للبث الفوري للتحديثات
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_gardens;

-- ============================================
-- Done! سكريبت إعداد حديقة الزن الرقمية جاهز
-- ============================================

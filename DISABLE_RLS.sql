-- ============================================
-- Quick Fix: Disable RLS for Testing
-- ============================================
-- هذا السكريبت يعطل RLS مؤقتاً للاختبار
-- بعد التأكد من عمل كل شيء، يمكنك تفعيله مرة أخرى

-- تعطيل RLS على جميع الجداول
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Done! الآن جرب التطبيق
-- ============================================

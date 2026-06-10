-- =============================================
-- إصلاح صلاحيات التخزين (Supabase Storage)
-- =============================================

-- 1. التأكد من وجود المجلد (Bucket) وجعله عاماً (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-files', 'group-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. السماح للجميع (حتى غير المسجلين) برؤية الملفات
-- هذا يحل مشكلة "الشاشة السوداء" عند فتح الرابط
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'group-files' );

-- 3. السماح للمستخدمين برفع الملفات
CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'group-files' );

-- 4. السماح للمستخدمين بحذف ملفاتهم (اختياري)
CREATE POLICY "Allow Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'group-files' );

-- =============================================
-- تم الإصلاح ✅
-- =============================================

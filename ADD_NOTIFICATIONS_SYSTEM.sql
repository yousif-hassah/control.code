-- ========================================
-- نظام الإشعارات للمجموعات
-- ========================================

-- 1. إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS group_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- المستخدم الذي سيستلم الإشعار
  type TEXT NOT NULL,  -- نوع الإشعار: 'task_completed', 'task_assigned', 'new_message', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,  -- معرف المهمة أو الرسالة المرتبطة
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT NOT NULL  -- من قام بالإجراء
);

-- 2. إضافة عمود 'completed' و 'completed_by' و 'completed_at' لجدول المهام
ALTER TABLE group_tasks 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_by TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 3. إنشاء Index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_notifications_user ON group_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_group ON group_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON group_tasks(completed);

-- 4. تعطيل RLS مؤقتاً للتطوير (تذكر تفعيله في الإنتاج!)
ALTER TABLE group_notifications DISABLE ROW LEVEL SECURITY;

-- 5. إنشاء Function لإرسال إشعار تلقائي عند إكمال مهمة
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم إكمال المهمة
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    -- إرسال إشعار لجميع أعضاء المجموعة (ماعدا من أكمل المهمة)
    INSERT INTO group_notifications (group_id, user_id, type, title, message, related_id, created_by)
    SELECT 
      NEW.group_id,
      gm.user_id,
      'task_completed',
      'Task Completed',
      'Task "' || NEW.title || '" has been completed',
      NEW.id,
      NEW.completed_by
    FROM group_members gm
    WHERE gm.group_id = NEW.group_id 
    AND gm.user_id != NEW.completed_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. إنشاء Trigger لتشغيل الـ Function
DROP TRIGGER IF EXISTS task_completion_notification ON group_tasks;
CREATE TRIGGER task_completion_notification
AFTER UPDATE ON group_tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_completion();

-- ========================================
-- تعليمات الاستخدام:
-- ========================================
-- 1. نفذ هذا الـ SQL في Supabase SQL Editor
-- 2. سيتم إنشاء جدول الإشعارات تلقائياً
-- 3. عند إكمال أي مهمة، سيتم إرسال إشعار لجميع الأعضاء
-- 4. يمكنك عرض الإشعارات في التطبيق باستخدام:
--    SELECT * FROM group_notifications WHERE user_id = 'USER_ID' AND is_read = FALSE;

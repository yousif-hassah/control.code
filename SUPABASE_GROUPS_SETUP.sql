-- =============================================
-- SQL Script لإنشاء جداول المجموعات في Supabase
-- =============================================

-- 1. جدول المجموعات (Groups)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول أعضاء المجموعات (Group Members)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. جدول رسائل المجموعات (Group Messages)
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. إنشاء Indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);

-- 5. تفعيل Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- 6. سياسات الأمان (Policies)

-- Groups: الجميع يمكنهم القراءة، فقط المنشئ يمكنه الحذف
CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Only creator can delete groups" ON groups FOR DELETE USING (created_by = auth.uid());

-- Group Members: الأعضاء يمكنهم رؤية أعضاء مجموعاتهم فقط
CREATE POLICY "Members can view group members" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can join groups" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can leave groups" ON group_members FOR DELETE USING (user_id = auth.uid());

-- Group Messages: الأعضاء فقط يمكنهم رؤية وإرسال الرسائل
CREATE POLICY "Members can view messages" ON group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Members can send messages" ON group_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- 7. تفعيل Realtime للرسائل
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- =============================================
-- انتهى السكريبت
-- =============================================

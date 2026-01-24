# 🎯 دليل تحديث نظام المجموعات

## الميزات الجديدة المطلوبة:

### 1️⃣ نظام الإشعارات ✅

- إشعار داخل التطبيق عند إكمال المهام
- إشعار لجميع أعضاء المجموعة
- عرض الإشعارات في شريط علوي

### 2️⃣ الرسائل الصوتية 🎤

- تسجيل رسائل صوتية في الدردشة
- تشغيل الرسائل الصوتية
- حفظ الملفات الصوتية في Supabase Storage

---

## 📋 الخطوات المطلوبة:

### الخطوة 1: تنفيذ SQL في Supabase

1. افتح Supabase Dashboard → SQL Editor
2. نفذ محتوى ملف `ADD_NOTIFICATIONS_SYSTEM.sql`
3. تأكد من نجاح التنفيذ

### الخطوة 2: تحديث الكود

سأقوم بتحديث `GroupDetailScreen.jsx` لإضافة:

#### أ) نظام الإشعارات:

```javascript
// عند إكمال مهمة
const createNotification = async (type, title, message, relatedId) => {
  // جلب جميع أعضاء المجموعة
  const { data: groupMembers } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id);

  // إنشاء إشعار لكل عضو (ماعدا الشخص الذي أكمل المهمة)
  const notifications = groupMembers
    .filter((m) => m.user_id !== user.uid)
    .map((m) => ({
      group_id: group.id,
      user_id: m.user_id,
      type: type,
      title: title,
      message: message,
      related_id: relatedId,
      created_by: user.uid,
    }));

  await supabase.from("group_notifications").insert(notifications);
};
```

#### ب) الرسائل الصوتية:

```javascript
// تسجيل صوت
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState(null);
const mediaRecorderRef = useRef(null);

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorderRef.current = mediaRecorder;

  const chunks = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    setAudioBlob(blob);
  };

  mediaRecorder.start();
  setIsRecording(true);
};

const stopRecording = () => {
  mediaRecorderRef.current?.stop();
  setIsRecording(false);
};

const sendVoiceMessage = async () => {
  if (!audioBlob) return;

  // رفع الملف الصوتي إلى Supabase Storage
  const fileName = `voice_${Date.now()}.webm`;
  const { data, error } = await supabase.storage
    .from("group-files")
    .upload(`${group.id}/voice/${fileName}`, audioBlob);

  if (error) {
    console.error("Upload error:", error);
    return;
  }

  // الحصول على الرابط العام
  const {
    data: { publicUrl },
  } = supabase.storage.from("group-files").getPublicUrl(data.path);

  // إرسال الرسالة
  await supabase.from("group_messages").insert({
    group_id: group.id,
    user_id: user.uid,
    content: "[Voice Message]",
    file_url: publicUrl,
    file_type: "audio",
    sender_name: user.name,
    sender_image: user.image,
  });

  setAudioBlob(null);
};
```

---

## 🎨 تصميم الإشعارات:

```javascript
// شريط الإشعارات في الأعلى
{
  notifications.length > 0 && (
    <div className="notification-bar">
      <Bell size={20} />
      <span>{notifications.length} إشعارات جديدة</span>
      <button onClick={() => setShowNotifications(true)}>عرض</button>
    </div>
  );
}

// قائمة الإشعارات
{
  showNotifications && (
    <div className="notifications-panel">
      {notifications.map((notif) => (
        <div key={notif.id} className="notification-item">
          <div className="notification-icon">
            {notif.type === "task_completed" && <CheckCircle2 />}
          </div>
          <div className="notification-content">
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            <span className="notification-time">
              {new Date(notif.created_at).toLocaleString("ar")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎤 تصميم الرسائل الصوتية:

```javascript
// زر التسجيل في الدردشة
<div className="voice-recorder">
  {!isRecording ? (
    <button onClick={startRecording} className="record-btn">
      <Mic size={20} />
      تسجيل صوتي
    </button>
  ) : (
    <div className="recording-controls">
      <div className="recording-indicator">
        <div className="pulse"></div>
        جاري التسجيل...
      </div>
      <button onClick={stopRecording} className="stop-btn">
        <Square size={20} />
        إيقاف
      </button>
    </div>
  )}

  {audioBlob && (
    <div className="audio-preview">
      <audio controls src={URL.createObjectURL(audioBlob)} />
      <button onClick={sendVoiceMessage} className="send-voice-btn">
        <Send size={16} />
        إرسال
      </button>
    </div>
  )}
</div>;

// عرض الرسائل الصوتية
{
  message.file_type === "audio" && (
    <div className="voice-message">
      <Play size={16} />
      <audio controls src={message.file_url} />
    </div>
  );
}
```

---

## 📱 CSS للإشعارات والرسائل الصوتية:

```css
.notification-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.voice-recorder {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.record-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ff4444;
}

.pulse {
  width: 12px;
  height: 12px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.voice-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.voice-message audio {
  flex: 1;
  height: 40px;
}
```

---

## ✅ الميزات الموجودة بالفعل:

1. ✅ **تعيين المهام لأشخاص محددين**
   - في `handleAddTask`، يمكنك اختيار عضو من القائمة المنسدلة
   - المهمة تُحفظ مع `assigned_to` = معرف العضو

2. ✅ **صلاحيات إكمال المهام**
   - فقط الشخص المعين، أو منشئ المهمة، أو المشرف يمكنه إكمالها
   - الكود موجود في `handleToggleTask`

---

## 🚀 الخطوات التالية:

1. **نفذ SQL** في Supabase (ملف `ADD_NOTIFICATIONS_SYSTEM.sql`)
2. **أخبرني** عندما تنتهي
3. **سأقوم بتحديث** `GroupDetailScreen.jsx` بالكود الكامل

---

**هل تريد مني البدء في تحديث الكود الآن؟** 🎨✨

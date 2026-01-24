# 🎯 التحديثات المتبقية - نظام المجموعات

## ✅ ما تم إنجازه حتى الآن:

1. ✅ إضافة state variables للإشعارات والرسائل الصوتية
2. ✅ إضافة دوال الإشعارات (`fetchNotifications`, `createNotification`, `markNotificationAsRead`)
3. ✅ إضافة دوال الرسائل الصوتية (`startRecording`, `stopRecording`, `sendVoiceMessage`)
4. ✅ تحديث `createTask` لإرسال إشعار عند تعيين مهمة
5. ✅ إضافة دالة `toggleTask` لإكمال المهام مع إرسال إشعار

---

## 📝 التحديثات المتبقية على JSX:

### 1️⃣ تحديث عرض المهام (Tasks Tab)

**الموقع:** السطر 505-532

**التغيير المطلوب:**

```jsx
{
  activeTab === "tasks" &&
    tasks.map((t) => (
      <div
        key={t.id}
        style={{
          padding: "14px",
          background: "white",
          borderRadius: "15px",
          marginBottom: "10px",
          border: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* زر الإكمال */}
        <button
          onClick={() => toggleTask(t)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {t.is_completed ? (
            <CheckCircle2 size={22} color="#4CAF50" />
          ) : (
            <Circle size={22} color="#ddd" />
          )}
        </button>

        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: t.is_completed ? "#999" : "#333",
              textDecoration: t.is_completed ? "line-through" : "none",
            }}
          >
            {t.title}
          </p>
          {t.assigned_to && (
            <span style={{ fontSize: "10px", color: "#888" }}>
              👤 @{t.assigned_to.substring(0, 8)}
            </span>
          )}
        </div>
      </div>
    ));
}
```

---

### 2️⃣ إضافة شريط الإشعارات (Notification Bar)

**الموقع:** بعد السطر 460 (قبل header المجموعة)

**الكود المطلوب:**

```jsx
{
  /* Notification Bar */
}
{
  notifications.length > 0 && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <Bell size={20} />
      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>
        {notifications.length}{" "}
        {lang === "en" ? "new notifications" : "إشعارات جديدة"}
      </span>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "white",
          padding: "6px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        {lang === "en" ? "View" : "عرض"}
      </button>
    </div>
  );
}

{
  /* Notifications Panel */
}
{
  showNotifications && (
    <div
      style={{
        position: "fixed",
        top: "50px",
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={() => setShowNotifications(false)}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "20px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
          {lang === "en" ? "Notifications" : "الإشعارات"}
        </h3>

        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: "12px",
              background: "#f8f9fa",
              borderRadius: "12px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
            onClick={() => markNotificationAsRead(notif.id)}
          >
            <div style={{ display: "flex", alignItems: "start", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {notif.type === "task_completed" && (
                  <CheckCircle2 size={20} color="white" />
                )}
                {notif.type === "task_assigned" && (
                  <ListTodo size={20} color="white" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    margin: "0 0 5px 0",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {notif.title}
                </h4>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  {notif.message}
                </p>
                <span style={{ fontSize: "10px", color: "#999" }}>
                  {new Date(notif.created_at).toLocaleString(
                    lang === "en" ? "en" : "ar",
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3️⃣ إضافة الرسائل الصوتية في Chat Tab

**الموقع:** بعد السطر 730 (بعد input الرسائل)

**الكود المطلوب:**

```jsx
{
  /* Voice Message Recorder */
}
<div
  style={{
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    marginTop: "10px",
  }}
>
  {!isRecording && !audioBlob && (
    <button
      onClick={startRecording}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        width: "100%",
        justifyContent: "center",
      }}
    >
      <Mic size={18} />
      {lang === "en" ? "Record Voice Message" : "تسجيل رسالة صوتية"}
    </button>
  )}

  {isRecording && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flex: 1,
          color: "#ff4444",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            background: "#ff4444",
            borderRadius: "50%",
            animation: "pulse 1.5s infinite",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          {lang === "en" ? "Recording" : "جاري التسجيل"}{" "}
          {Math.floor(recordingTime / 60)}:
          {(recordingTime % 60).toString().padStart(2, "0")}
        </span>
      </div>
      <button
        onClick={stopRecording}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          background: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "15px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        <Square size={14} />
        {lang === "en" ? "Stop" : "إيقاف"}
      </button>
    </div>
  )}

  {audioBlob && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <audio
        controls
        src={URL.createObjectURL(audioBlob)}
        style={{
          width: "100%",
          height: "40px",
          borderRadius: "8px",
        }}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={sendVoiceMessage}
          disabled={uploading}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Send size={16} />
          {uploading
            ? lang === "en"
              ? "Sending..."
              : "جاري الإرسال..."
            : lang === "en"
              ? "Send"
              : "إرسال"}
        </button>
        <button
          onClick={cancelRecording}
          style={{
            padding: "10px 16px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {lang === "en" ? "Cancel" : "إلغاء"}
        </button>
      </div>
    </div>
  )}
</div>;
```

---

### 4️⃣ تحديث عرض الرسائل لدعم الصوت

**الموقع:** داخل `messages.map` (حوالي السطر 550)

**التغيير المطلوب:**

```jsx
{
  /* Message Content */
}
<div
  style={{
    background:
      m.user_id === user.uid
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : "white",
    color: m.user_id === user.uid ? "white" : "#333",
    padding: "12px 16px",
    borderRadius: "18px",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }}
>
  {/* Voice Message */}
  {m.file_type === "audio" ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <Play size={16} />
      <audio
        controls
        src={m.file_url}
        style={{
          flex: 1,
          height: "35px",
          filter: m.user_id === user.uid ? "invert(1)" : "none",
        }}
      />
    </div>
  ) : m.file_url ? (
    /* Image/File Message */
    <div
      onClick={() => window.open(m.file_url, "_blank")}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Paperclip size={16} />
      <span>{m.content}</span>
    </div>
  ) : (
    /* Text Message */
    m.content
  )}
</div>;
```

---

## 🎨 CSS المطلوب

أضف هذا في نهاية الملف (داخل `<style>` tag):

```css
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
```

---

## 📋 الخطوات التالية:

1. **نفذ SQL** في Supabase:
   - افتح `ADD_NOTIFICATIONS_SYSTEM.sql`
   - نفذه في Supabase SQL Editor

2. **سأقوم بتطبيق التحديثات المتبقية على JSX**

3. **اختبر الميزات الجديدة!**

---

**هل تريد مني تطبيق هذه التحديثات على JSX الآن؟** 🚀

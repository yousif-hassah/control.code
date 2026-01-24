import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  MessageSquare,
  ListTodo,
  Upload,
  Send,
  Plus,
  Circle,
  CheckCircle2,
  Paperclip,
  FileText,
  Activity,
  User,
  Bell,
  Mic,
  Square,
  Play,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

export function GroupDetailScreen({ group, user, lang, onClose }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Voice Messages
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    const channel = supabase
      .channel(`group_${group.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_tasks" },
        () => fetchTasks(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages" },
        (p) => {
          setMessages((prev) => [...prev, p.new]);
          scrollToBottom();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_activities" },
        () => fetchActivities(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  const fetchInitialData = async () => {
    fetchTasks();
    fetchMessages();
    fetchFiles();
    fetchMembers();
    fetchActivities();
    fetchNotifications();
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("group_tasks")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setTasks(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("group_files")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false });
    setFiles(data || []);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("group_members")
      .select(`user_id, role, profiles(name)`)
      .eq("group_id", group.id);
    setMembers(data || []);
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("group_activities")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setActivities(data || []);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("group_notifications")
      .select("*")
      .eq("user_id", user.uid)
      .eq("group_id", group.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    setNotifications(data || []);
  };

  const createNotification = async (type, title, message, relatedId = null) => {
    try {
      // جلب جميع أعضاء المجموعة
      const { data: groupMembers } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id);

      // إنشاء إشعار لكل عضو (ماعدا الشخص الذي قام بالإجراء)
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

      if (notifications.length > 0) {
        await supabase.from("group_notifications").insert(notifications);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const markNotificationAsRead = async (notifId) => {
    await supabase
      .from("group_notifications")
      .update({ is_read: true })
      .eq("id", notifId);
    fetchNotifications();
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        lang === "en" ? "Microphone access denied" : "تم رفض الوصول للميكروفون",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      // رفع الملف الصوتي إلى Supabase Storage
      const fileName = `voice_${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from("group-files")
        .upload(`${group.id}/voice/${fileName}`, audioBlob);

      if (error) throw error;

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

      // إضافة نشاط
      await supabase.from("group_activities").insert({
        group_id: group.id,
        user_id: user.uid,
        action: "sent a voice message",
        user_name: user.name,
      });

      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error("Error sending voice message:", error);
      alert(
        lang === "en"
          ? "Failed to send voice message"
          : "فشل إرسال الرسالة الصوتية",
      );
    } finally {
      setUploading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const logActivity = async (type, content) => {
    await supabase.from("group_activities").insert([
      {
        group_id: group.id,
        user_id: user.uid,
        action_type: type,
        content: content,
      },
    ]);
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_tasks")
        .insert([
          {
            group_id: group.id,
            title: newTaskTitle.trim(),
            assigned_to: selectedMember || null,
            created_by: user.uid,
          },
        ])
        .select();

      if (error) throw error;

      await logActivity("task_created", newTaskTitle);

      // إرسال إشعار إذا تم تعيين المهمة لشخص محدد
      if (selectedMember && data && data[0]) {
        const assignedMemberData = members.find(
          (m) => m.user_id === selectedMember,
        );
        const memberName = assignedMemberData?.profiles?.name || "Member";

        await createNotification(
          "task_assigned",
          lang === "en" ? "New Task Assigned" : "مهمة جديدة",
          lang === "en"
            ? `${user.name} assigned you a task: ${newTaskTitle}`
            : `${user.name} عيّن لك مهمة: ${newTaskTitle}`,
          data[0].id,
        );
      }

      setNewTaskTitle("");
      setSelectedMember("");
      fetchTasks();
    } catch (e) {
      alert("Error saving task");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    // التحقق من الصلاحيات: فقط الشخص المعين، أو منشئ المهمة، أو المشرف
    const currentMember = members.find((m) => m.user_id === user.uid);
    const isAdmin = currentMember?.role === "admin";
    const isAssigned = task.assigned_to === user.uid;
    const isCreator = task.created_by === user.uid;

    if (!isAdmin && !isAssigned && !isCreator) {
      alert(
        lang === "en"
          ? "Only the assigned member, task creator, or admin can complete this task"
          : "فقط العضو المعين، أو منشئ المهمة، أو المشرف يمكنه إكمال هذه المهمة",
      );
      return;
    }

    try {
      const newStatus = !task.is_completed;

      await supabase
        .from("group_tasks")
        .update({ is_completed: newStatus })
        .eq("id", task.id);

      if (newStatus) {
        // إرسال إشعار لجميع الأعضاء عند إكمال المهمة
        await createNotification(
          "task_completed",
          lang === "en" ? "Task Completed" : "تم إكمال مهمة",
          lang === "en"
            ? `${user.name} completed: ${task.title}`
            : `${user.name} أكمل: ${task.title}`,
          task.id,
        );

        await logActivity("task_completed", task.title);
      }

      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
      alert("Error updating task");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase
      .from("group_messages")
      .insert([
        { group_id: group.id, user_id: user.uid, message: newMessage.trim() },
      ]);
    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `groups/${group.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("group-files").upload(path, file);
      const {
        data: { publicUrl },
      } = supabase.storage.from("group-files").getPublicUrl(path);
      await supabase.from("group_files").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type.startsWith("image/") ? "image" : "document",
        },
      ]);
      await logActivity("file_uploaded", file.name);
      await supabase.from("group_messages").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          message: `Shared file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
        },
      ]);
      fetchInitialData();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    screen: {
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      background: "white",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "12px 16px",
      borderBottom: "1px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: "white",
    },
    tabs: {
      display: "flex",
      background: "#f8f9fa",
      padding: "4px",
      gap: "4px",
    },
    tabBtn: (active) => ({
      flex: 1,
      padding: "10px 4px",
      border: "none",
      borderRadius: "10px",
      background: active ? "white" : "transparent",
      color: active ? "#629FAD" : "#777",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      boxShadow: active ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
    }),
    content: {
      flex: 1,
      overflowY: "auto",
      padding: "16px",
      background: "#fdfdfd",
    },
    footer: {
      padding: "12px 16px",
      borderTop: "1px solid #f0f0f0",
      background: "white",
    },
    inputGroup: { display: "flex", gap: "10px", alignItems: "center" },
    input: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "24px",
      border: "1px solid #eee",
      background: "#f9f9f9",
      fontSize: "15px",
      outline: "none",
    },
  };

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", padding: "4px" }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
            {group.name}
          </h2>
          <span
            style={{ fontSize: "10px", color: "#629FAD", fontWeight: "600" }}
          >
            {group.code}
          </span>
        </div>
      </header>

      <div style={styles.tabs}>
        {["tasks", "chat", "files", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={styles.tabBtn(activeTab === tab)}
          >
            {tab === "tasks" && <ListTodo size={18} />}
            {tab === "chat" && <MessageSquare size={18} />}
            {tab === "files" && <Upload size={18} />}
            {tab === "activity" && <Activity size={18} />}
            <span style={{ fontSize: "10px" }}>
              {lang === "ar"
                ? tab === "tasks"
                  ? "المهام"
                  : tab === "chat"
                    ? "الدردشة"
                    : tab === "files"
                      ? "الملفات"
                      : "النشاط"
                : tab}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === "tasks" &&
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
              <Circle size={22} color="#ddd" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
                  {t.title}
                </p>
                {t.assigned_to && (
                  <span style={{ fontSize: "10px", color: "#888" }}>
                    @{t.assigned_to.substring(0, 8)}
                  </span>
                )}
              </div>
            </div>
          ))}

        {activeTab === "chat" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.user_id === user.uid ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius:
                      m.user_id === user.uid
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background: m.user_id === user.uid ? "#629FAD" : "#f1f1f1",
                    color: m.user_id === user.uid ? "white" : "#333",
                    fontSize: "14px",
                  }}
                >
                  {m.file_url ? (
                    <div
                      onClick={() => window.open(m.file_url, "_blank")}
                      style={{ cursor: "pointer" }}
                    >
                      {m.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={m.file_url}
                          style={{ maxWidth: "100%", borderRadius: "8px" }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <FileText size={18} />{" "}
                          <span style={{ fontSize: "12px" }}>
                            {m.file_name}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>{m.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {activeTab === "files" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => window.open(f.file_url, "_blank")}
                style={{
                  padding: "12px",
                  background: "white",
                  border: "1px solid #eee",
                  borderRadius: "14px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#f0f7f8",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <FileText size={20} color="#629FAD" />
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: "600",
                  }}
                >
                  {f.file_name}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {activities.map((a) => (
              <div
                key={a.id}
                style={{ display: "flex", gap: "10px", alignItems: "start" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#629FAD",
                    marginTop: "4px",
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#444" }}>
                    <strong style={{ color: "#333" }}>
                      {a.action_type === "task_created"
                        ? "Task Added"
                        : "Activity"}
                      :
                    </strong>{" "}
                    {a.content}
                  </p>
                  <span style={{ fontSize: "10px", color: "#aaa" }}>
                    {new Date(a.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {activeTab === "tasks" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={lang === "ar" ? "أضف مهمة..." : "Add task..."}
              style={styles.input}
            />
            <button
              onClick={createTask}
              style={{
                background: "#629FAD",
                color: "white",
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                border: "none",
              }}
            >
              <Plus />
            </button>
          </div>
        )}
        {activeTab === "chat" && (
          <div style={styles.inputGroup}>
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                background: "#f0f0f0",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: "#629FAD",
              }}
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="..."
              style={styles.input}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#629FAD",
                color: "white",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
        {activeTab === "files" && (
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#629FAD",
              color: "white",
              border: "none",
              borderRadius: "16px",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            {uploading ? "..." : lang === "ar" ? "رفع ملف" : "Upload File"}
          </button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </div>
  );
}

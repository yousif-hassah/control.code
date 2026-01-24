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

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

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

  const scrollToBottom = () => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const logActivity = async (type, content) => {
    await supabase
      .from("group_activities")
      .insert([
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
      const { error } = await supabase
        .from("group_tasks")
        .insert([
          {
            group_id: group.id,
            title: newTaskTitle.trim(),
            assigned_to: selectedMember || null,
            created_by: user.uid,
          },
        ]);
      if (error) throw error;
      await logActivity("task_created", newTaskTitle);
      setNewTaskTitle("");
      setSelectedMember("");
      fetchTasks();
    } catch (e) {
      alert("Error saving task");
    } finally {
      setLoading(false);
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
      await supabase
        .from("group_files")
        .insert([
          {
            group_id: group.id,
            user_id: user.uid,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type.startsWith("image/") ? "image" : "document",
          },
        ]);
      await logActivity("file_uploaded", file.name);
      await supabase
        .from("group_messages")
        .insert([
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

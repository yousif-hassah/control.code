import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  MessageSquare,
  ListTodo,
  Upload,
  Send,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  UserPlus,
  Image as ImageIcon,
  Paperclip,
  FileText,
  User,
  X,
  MoreVertical,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

export function GroupDetailScreen({ group, user, lang, onClose }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState(""); // ID of assigned user
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchMessages();
    fetchFiles();
    fetchMembers();

    const tasksSubscription = supabase
      .channel(`group_tasks_${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_tasks",
          filter: `group_id=eq.${group.id}`,
        },
        () => fetchTasks(),
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel(`group_messages_${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          fetchMessages(); // Fetch to get user profiles names
        },
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [group.id]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("group_tasks")
        .select(
          `
          *,
          assigned_member:profiles!group_tasks_assigned_to_fkey(name, image_url)
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select(
          `
          *,
          profiles(name, image_url)
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("group_files")
        .select(
          `
          *,
          profiles(name)
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(
          `
          user_id,
          role,
          profiles(name, image_url)
        `,
        )
        .eq("group_id", group.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("group_tasks").insert([
        {
          group_id: group.id,
          title: newTaskTitle,
          assigned_to: selectedMember || null,
          created_by: user.uid,
          status: "pending",
        },
      ]);

      if (error) throw error;
      setNewTaskTitle("");
      setSelectedMember("");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      alert(lang === "ar" ? "فشل إنشاء المهمة" : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
    // Permission check: Only assigned person, creator, or admin can complete
    const isAdmin =
      members.find((m) => m.user_id === user.uid)?.role === "admin";
    const isAssigned = task.assigned_to === user.uid;
    const isCreator = task.created_by === user.uid;
    const isPublic = !task.assigned_to;

    if (!isAdmin && !isAssigned && !isCreator && !isPublic) {
      alert(
        lang === "ar"
          ? "هذه المهمة مخصصة لشخص آخر"
          : "This task is assigned to someone else",
      );
      return;
    }

    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("group_tasks")
        .update({
          status: newStatus,
          completed_at:
            newStatus === "completed" ? new Date().toISOString() : null,
          completed_by: newStatus === "completed" ? user.uid : null,
        })
        .eq("id", task.id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `groups/${group.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("group-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("group-files").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("group_files").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type.startsWith("image/") ? "image" : "document",
          file_size: file.size,
        },
      ]);

      if (dbError) throw dbError;

      // Also send a message in chat about the file
      await supabase.from("group_messages").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          message:
            lang === "ar"
              ? `أرسل ملفاً: ${file.name}`
              : `Sent a file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
        },
      ]);

      fetchFiles();
      fetchMessages();
    } catch (error) {
      console.error("Upload error:", error);
      alert(lang === "ar" ? "فشل رفع الملف" : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("group_messages").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          message: newMessage.trim(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "white",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>{group.name}</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
            {members.length} {lang === "en" ? "members" : "أعضاء"} •{" "}
            {group.code}
          </p>
        </div>
      </header>

      {/* Tabs Menu */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #eee",
          background: "#f9f9f9",
        }}
      >
        {["tasks", "chat", "files"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === tab ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #629FAD" : "none",
              color: activeTab === tab ? "#629FAD" : "#666",
              fontWeight: activeTab === tab ? "bold" : "normal",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {tab === "tasks" && <ListTodo size={20} />}
            {tab === "chat" && <MessageSquare size={20} />}
            {tab === "files" && <Upload size={20} />}
            {lang === "en"
              ? tab.charAt(0).toUpperCase() + tab.slice(1)
              : tab === "tasks"
                ? "المهام"
                : tab === "chat"
                  ? "الدردشة"
                  : "الملفات"}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          background: "#fdfdfd",
        }}
      >
        {activeTab === "tasks" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={48} />}
                text={lang === "en" ? "No tasks yet" : "لا توجد مهام بعد"}
              />
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task)}
                  lang={lang}
                  user={user}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {messages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={48} />}
                text={lang === "en" ? "Start messaging..." : "ابدأ المراسلة..."}
              />
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.user_id === user.uid}
                />
              ))
            )}
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
            {files.length === 0 ? (
              <div style={{ gridColumn: "1/3" }}>
                <EmptyState
                  icon={<Upload size={48} />}
                  text={
                    lang === "en"
                      ? "No files shared yet"
                      : "لم يتم مشاركة ملفات بعد"
                  }
                />
              </div>
            ) : (
              files.map((file) => <FileCard key={file.id} file={file} />)
            )}
          </div>
        )}
      </div>

      {/* Conditional Inputs */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #eee",
          background: "white",
        }}
      >
        {activeTab === "tasks" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#f5f5f5",
                  fontSize: "13px",
                }}
              >
                <option value="">{lang === "ar" ? "للجميع" : "Anyone"}</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={
                  lang === "en" ? "Add group task..." : "أضف مهمة للمجموعة..."
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                }}
                onKeyPress={(e) => e.key === "Enter" && createTask()}
              />
              <button
                onClick={createTask}
                disabled={loading || !newTaskTitle.trim()}
                style={{
                  background: "#629FAD",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  width: "45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                background: "none",
                border: "none",
                color: "#629FAD",
                cursor: "pointer",
              }}
            >
              <Paperclip size={22} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                lang === "en" ? "Type something..." : "اكتب شيئاً..."
              }
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "24px",
                background: "#f9f9f9",
              }}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim()}
              style={{
                background: "#629FAD",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={20} />
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
              borderRadius: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            {uploading ? (
              "..."
            ) : (
              <>
                <Upload size={20} />{" "}
                {lang === "ar" ? "رفع ملف أو صورة" : "Upload File/Image"}
              </>
            )}
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

// Sub-components
function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
      <div style={{ marginBottom: "15px", opacity: 0.3 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: "16px" }}>{text}</p>
    </div>
  );
}

function TaskCard({ task, onToggle, lang, user }) {
  const isCompleted = task.status === "completed";
  return (
    <div
      style={{
        padding: "15px",
        background: "white",
        borderRadius: "15px",
        border: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
      >
        {isCompleted ? (
          <CheckCircle2 size={24} color="#4CAF50" />
        ) : (
          <Circle size={24} color="#ddd" />
        )}
      </button>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            textDecoration: isCompleted ? "line-through" : "none",
            color: isCompleted ? "#aaa" : "#333",
          }}
        >
          {task.title}
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
          <span
            style={{
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#888",
              background: "#f5f5f5",
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            <User size={10} />
            {task.assigned_member?.name ||
              (lang === "ar" ? "للجميع" : "Anyone")}
          </span>
          {isCompleted && task.completed_at && (
            <span style={{ fontSize: "10px", color: "#4CAF50" }}>
              ✓{" "}
              {new Date(task.completed_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageItem({ msg, isOwn }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignSelf: isOwn ? "flex-end" : "flex-start",
        maxWidth: "80%",
      }}
    >
      {!isOwn && (
        <span
          style={{
            fontSize: "11px",
            color: "#888",
            marginBottom: "4px",
            marginLeft: "12px",
          }}
        >
          {msg.profiles?.name}
        </span>
      )}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: isOwn ? "20px 20px 2px 20px" : "20px 20px 20px 2px",
          background: isOwn ? "#629FAD" : "#f1f1f1",
          color: isOwn ? "white" : "#333",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        {msg.file_url ? (
          <div
            onClick={() => window.open(msg.file_url, "_blank")}
            style={{ cursor: "pointer" }}
          >
            {msg.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={msg.file_url}
                alt="Shared"
                style={{
                  maxWidth: "100%",
                  borderRadius: "10px",
                  marginBottom: "8px",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(0,0,0,0.05)",
                  padding: "10px",
                  borderRadius: "10px",
                }}
              >
                <FileText size={20} />
                <span
                  style={{
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {msg.file_name}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
            {msg.message}
          </p>
        )}
        <span
          style={{
            fontSize: "9px",
            opacity: 0.6,
            marginTop: "6px",
            display: "block",
            textAlign: isOwn ? "right" : "left",
          }}
        >
          {new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function FileCard({ file }) {
  const isImage = file.file_type === "image";
  return (
    <div
      onClick={() => window.open(file.file_url, "_blank")}
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #f0f0f0",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
    >
      {isImage ? (
        <img
          src={file.file_url}
          style={{ width: "100%", height: "100px", objectFit: "cover" }}
          alt="Thumbnail"
        />
      ) : (
        <div
          style={{
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9f9f9",
          }}
        >
          <FileText size={32} color="#629FAD" />
        </div>
      )}
      <div style={{ padding: "8px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: "bold",
          }}
        >
          {file.file_name}
        </p>
        <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#999" }}>
          {file.profiles?.name}
        </p>
      </div>
    </div>
  );
}

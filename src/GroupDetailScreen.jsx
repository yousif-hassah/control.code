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
  History,
  Activity,
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
    fetchAllData();
    setupSubscriptions();
  }, [group.id]);

  const fetchAllData = () => {
    fetchTasks();
    fetchMessages();
    fetchFiles();
    fetchMembers();
    fetchActivities();
  };

  const setupSubscriptions = () => {
    const channel = supabase
      .channel(`group_realtime_${group.id}`)
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${group.id}`,
        },
        () => fetchMessages(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_activities",
          filter: `group_id=eq.${group.id}`,
        },
        () => fetchActivities(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const logActivity = async (type, content) => {
    try {
      await supabase.from("group_activities").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          action_type: type,
          content: content,
        },
      ]);
    } catch (e) {
      console.error("Activity Log Error:", e);
    }
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("group_tasks")
      .select(
        `*, assigned_member:profiles!group_tasks_assigned_to_fkey(name, image_url)`,
      )
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setTasks(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select(`*, profiles(name, image_url)`)
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("group_files")
      .select(`*, profiles(name)`)
      .eq("group_id", group.id)
      .order("created_at", { ascending: false });
    setFiles(data || []);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("group_members")
      .select(`user_id, role, profiles(name, image_url)`)
      .eq("group_id", group.id);
    setMembers(data || []);
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("group_activities")
      .select(`*, profiles(name, image_url)`)
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

  const toggleTask = async (task) => {
    const isAdmin =
      members.find((m) => m.user_id === user.uid)?.role === "admin";
    const isAssigned = task.assigned_to === user.uid;
    if (!isAdmin && !isAssigned && task.assigned_to) {
      alert(
        lang === "ar"
          ? "هذه المهمة مخصصة لشخص آخر"
          : "Assigned to someone else",
      );
      return;
    }
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await supabase
      .from("group_tasks")
      .update({
        status: newStatus,
        completed_at:
          newStatus === "completed" ? new Date().toISOString() : null,
        completed_by: newStatus === "completed" ? user.uid : null,
      })
      .eq("id", task.id);
    await logActivity(
      newStatus === "completed" ? "task_completed" : "task_reopened",
      task.title,
    );
    fetchTasks();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
      const filePath = `groups/${group.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("group-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("group-files").getPublicUrl(filePath);
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
            message: `أرسل ملفاً: ${file.name}`,
            file_url: publicUrl,
            file_name: file.name,
          },
        ]);
      fetchAllData();
    } catch (e) {
      alert("Upload failed");
    } finally {
      setUploading(false);
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
          style={{ background: "none", border: "none" }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "17px" }}>{group.name}</h2>
          <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>
            {members.length} {lang === "en" ? "members" : "أعضاء"} •{" "}
            {group.code}
          </p>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #eee",
          background: "#f9f9f9",
          overflowX: "auto",
        }}
      >
        {["tasks", "chat", "files", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px 5px",
              background: activeTab === tab ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #629FAD" : "none",
              color: activeTab === tab ? "#629FAD" : "#666",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            {tab === "tasks" && <ListTodo size={16} />}
            {tab === "chat" && <MessageSquare size={16} />}
            {tab === "files" && <Upload size={16} />}
            {tab === "activity" && <Activity size={16} />}
            {lang === "en"
              ? tab.charAt(0).toUpperCase() + tab.slice(1)
              : tab === "tasks"
                ? "المهام"
                : tab === "chat"
                  ? "الدردشة"
                  : tab === "files"
                    ? "الملفات"
                    : "النشاط"}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px",
          background: "#fcfcfc",
        }}
      >
        {activeTab === "tasks" &&
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t)}
              lang={lang}
            />
          ))}
        {activeTab === "chat" && (
          <>
            {messages.map((m) => (
              <MessageItem key={m.id} msg={m} isOwn={m.user_id === user.uid} />
            ))}
            <div ref={chatEndRef} />
          </>
        )}
        {activeTab === "files" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {files.map((f) => (
              <FileCard key={f.id} file={f} />
            ))}
          </div>
        )}
        {activeTab === "activity" &&
          activities.map((a) => (
            <ActivityItem key={a.id} act={a} lang={lang} />
          ))}
      </div>

      <div
        style={{
          padding: "15px",
          borderTop: "1px solid #eee",
          background: "white",
        }}
      >
        {activeTab === "tasks" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #eee",
                fontSize: "12px",
                background: "#f5f5f5",
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
              placeholder="..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #eee",
                borderRadius: "10px",
              }}
            />
            <button
              onClick={createTask}
              style={{
                background: "#629FAD",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "10px",
              }}
            >
              <Plus />
            </button>
          </div>
        )}
        {activeTab === "chat" && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => fileInputRef.current.click()}
              style={{ background: "none", border: "none", color: "#629FAD" }}
            >
              <Paperclip />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="..."
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #eee",
                borderRadius: "20px",
                background: "#f9f9f9",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#629FAD",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
        {activeTab === "files" && (
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              width: "100%",
              padding: "12px",
              background: "#629FAD",
              color: "white",
              border: "none",
              borderRadius: "12px",
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

function TaskCard({ task, onToggle, lang }) {
  const isDone = task.status === "completed";
  return (
    <div
      style={{
        padding: "14px",
        background: "white",
        borderRadius: "12px",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        border: "1px solid #f0f0f0",
      }}
    >
      <button onClick={onToggle} style={{ background: "none", border: "none" }}>
        {isDone ? (
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
            textDecoration: isDone ? "line-through" : "none",
            color: isDone ? "#aaa" : "#333",
          }}
        >
          {task.title}
        </p>
        <span
          style={{
            fontSize: "10px",
            color: "#999",
            background: "#f5f5f5",
            padding: "2px 6px",
            borderRadius: "8px",
          }}
        >
          {task.assigned_member?.name || (lang === "ar" ? "للجميع" : "Anyone")}
        </span>
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
        marginBottom: "12px",
      }}
    >
      {!isOwn && (
        <span
          style={{
            fontSize: "10px",
            color: "#999",
            marginLeft: "10px",
            marginBottom: "2px",
          }}
        >
          {msg.profiles?.name}
        </span>
      )}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "15px",
          background: isOwn ? "#629FAD" : "#eee",
          color: isOwn ? "white" : "#333",
        }}
      >
        {msg.file_url ? (
          msg.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img
              src={msg.file_url}
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          ) : (
            <div style={{ display: "flex", gap: "5px" }}>
              <FileText size={16} />{" "}
              <span style={{ fontSize: "12px" }}>{msg.file_name}</span>
            </div>
          )
        ) : (
          <p style={{ margin: 0, fontSize: "14px" }}>{msg.message}</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ act, lang }) {
  const getLabel = () => {
    if (act.action_type === "task_created")
      return lang === "ar" ? "أنشأ مهمة:" : "Created task:";
    if (act.action_type === "task_completed")
      return lang === "ar" ? "أكمل المهمة:" : "Completed task:";
    if (act.action_type === "file_uploaded")
      return lang === "ar" ? "رفع ملفاً:" : "Uploaded file:";
    return act.action_type;
  };
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid #f9f9f9",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
        }}
      >
        {act.profiles?.name?.charAt(0)}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "13px" }}>
          <span style={{ fontWeight: "bold" }}>{act.profiles?.name}</span>{" "}
          {getLabel()} <span style={{ color: "#629FAD" }}>{act.content}</span>
        </p>
        <span style={{ fontSize: "10px", color: "#bbb" }}>
          {new Date(act.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function FileCard({ file }) {
  return (
    <div
      onClick={() => window.open(file.file_url, "_blank")}
      style={{
        background: "white",
        borderRadius: "10px",
        border: "1px solid #eee",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {file.file_type === "image" ? (
        <img
          src={file.file_url}
          style={{ width: "100%", height: "80px", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            height: "80px",
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText color="#629FAD" />
        </div>
      )}
      <div style={{ padding: "5px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "10px",
            fontWeight: "bold",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.file_name}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px", color: "#ccc" }}>
      {icon}
      <p>{text}</p>
    </div>
  );
}

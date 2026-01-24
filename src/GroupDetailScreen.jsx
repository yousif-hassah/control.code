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
  Paperclip,
  FileText,
  Activity,
  AlertCircle,
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

  // Debug check
  useEffect(() => {
    console.log("Groups Feature Debug:", {
      groupId: group.id,
      userUid: user?.uid,
    });
    if (!user?.uid) {
      alert("Error: User ID not found. Please log out and in again.");
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    // Simple realtime setup
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
    const { data, error } = await supabase
      .from("group_tasks")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    if (error) console.error("Tasks Fetch Error:", error);
    setTasks(data || []);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    if (error) console.error("Messages Fetch Error:", error);
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
      const { error } = await supabase.from("group_tasks").insert([
        {
          group_id: group.id,
          title: newTaskTitle.trim(),
          assigned_to: selectedMember || null,
          created_by: user.uid,
          status: "pending",
        },
      ]);

      if (error) throw error;
      await logActivity("task_created", newTaskTitle);
      setNewTaskTitle("");
      setSelectedMember("");
      fetchTasks();
    } catch (e) {
      console.error("Task Create Error:", e);
      alert("Failed to save task. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
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
      fetchMessages();
    } catch (e) {
      console.error("Message Error:", e);
      alert("Message not sent.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `groups/${group.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("group-files")
        .upload(path, file);
      if (upErr) throw upErr;

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
          message: `Shared a file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
        },
      ]);

      fetchFiles();
      fetchMessages();
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        background: "white",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "15px",
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
          <ChevronLeft />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "16px" }}>{group.name}</h2>
          <p style={{ margin: 0, fontSize: "10px", color: "#888" }}>
            {group.code}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "#f9f9f9",
          borderBottom: "1px solid #eee",
        }}
      >
        {["tasks", "chat", "files", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #629FAD" : "none",
              background: "transparent",
              color: activeTab === tab ? "#629FAD" : "#666",
              fontSize: "12px",
            }}
          >
            {tab === "tasks" && <ListTodo size={16} />}
            {tab === "chat" && <MessageSquare size={16} />}
            {tab === "files" && <Upload size={16} />}
            {tab === "activity" && <Activity size={16} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
        {activeTab === "tasks" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "12px",
                  background: "#f5f5f5",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Circle size={20} color="#ccc" />
                <span style={{ fontSize: "14px" }}>{t.title}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "chat" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.user_id === user.uid ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: m.user_id === user.uid ? "#629FAD" : "#eee",
                    color: m.user_id === user.uid ? "white" : "black",
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
                          style={{ maxWidth: "100%", borderRadius: "5px" }}
                        />
                      ) : (
                        <span>📄 {m.file_name}</span>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: "14px" }}>{m.message}</p>
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
              gap: "10px",
            }}
          >
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => window.open(f.file_url, "_blank")}
                style={{
                  padding: "10px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <FileText size={24} color="#629FAD" />
                <p
                  style={{
                    fontSize: "10px",
                    margin: "5px 0 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
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
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {activities.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: "12px",
                  color: "#555",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "8px",
                }}
              >
                <strong>{a.action_type}:</strong> {a.content}
                <div style={{ fontSize: "10px", color: "#999" }}>
                  {new Date(a.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Inputs */}
      <div style={{ padding: "15px", borderTop: "1px solid #eee" }}>
        {activeTab === "tasks" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #eee",
                borderRadius: "8px",
              }}
            />
            <button
              onClick={createTask}
              style={{
                background: "#629FAD",
                color: "white",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
              }}
            >
              <Plus />
            </button>
          </div>
        )}
        {activeTab === "chat" && (
          <div style={{ display: "flex", gap: "8px" }}>
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
                padding: "10px",
                border: "1px solid #eee",
                borderRadius: "20px",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: "#629FAD",
                color: "white",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: "none",
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
              padding: "12px",
              background: "#629FAD",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            {uploading ? "Uploading..." : "Upload File"}
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

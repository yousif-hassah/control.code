import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

export function GroupDetailScreen({ group, user, lang, onClose }) {
  const [activeTab, setActiveTab] = useState("tasks"); // 'tasks', 'chat', 'files'
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchMessages();
    fetchFiles();
    fetchMembers();

    // Subscribe to real-time updates
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
          setMessages((prev) => [...prev, payload.new]);
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
        .select("*")
        .eq("group_id", group.id)
        .order("order_index", { ascending: true });

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
        .select("*")
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
        .select("*")
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
        .select("user_id, role")
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
          assigned_to: selectedMember,
          created_by: user.uid,
          order_index: tasks.length,
        },
      ]);

      if (error) throw error;
      setNewTaskTitle("");
      setSelectedMember(null);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task) => {
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

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from("group_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
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
            {members.length} {lang === "en" ? "members" : "أعضاء"}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #eee",
          background: "#f9f9f9",
        }}
      >
        <button
          onClick={() => setActiveTab("tasks")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "tasks" ? "white" : "transparent",
            border: "none",
            borderBottom: activeTab === "tasks" ? "2px solid #629FAD" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <ListTodo size={20} />
          {lang === "en" ? "Tasks" : "المهام"}
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "chat" ? "white" : "transparent",
            border: "none",
            borderBottom: activeTab === "chat" ? "2px solid #629FAD" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <MessageSquare size={20} />
          {lang === "en" ? "Chat" : "الدردشة"}
        </button>
        <button
          onClick={() => setActiveTab("files")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "files" ? "white" : "transparent",
            border: "none",
            borderBottom: activeTab === "files" ? "2px solid #629FAD" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Upload size={20} />
          {lang === "en" ? "Files" : "الملفات"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {activeTab === "tasks" && (
          <TasksTab
            tasks={tasks}
            members={members}
            user={user}
            lang={lang}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        {activeTab === "chat" && (
          <ChatTab messages={messages} user={user} lang={lang} />
        )}
        {activeTab === "files" && <FilesTab files={files} lang={lang} />}
      </div>

      {/* Input Area */}
      {activeTab === "tasks" && (
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={lang === "en" ? "New task..." : "مهمة جديدة..."}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              fontSize: "16px",
            }}
          />
          <button
            onClick={createTask}
            disabled={loading || !newTaskTitle.trim()}
            style={{
              padding: "12px 20px",
              background: "#629FAD",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !newTaskTitle.trim() ? 0.5 : 1,
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {activeTab === "chat" && (
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder={lang === "en" ? "Type a message..." : "اكتب رسالة..."}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "24px",
              fontSize: "16px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            style={{
              padding: "12px 20px",
              background: "#629FAD",
              color: "white",
              border: "none",
              borderRadius: "24px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !newMessage.trim() ? 0.5 : 1,
            }}
          >
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function TasksTab({ tasks, user, lang, onToggle, onDelete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {tasks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
          {lang === "en" ? "No tasks yet" : "لا توجد مهام بعد"}
        </p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => onToggle(task)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {task.status === "completed" ? (
                <CheckCircle2 size={24} color="#4CAF50" />
              ) : (
                <Circle size={24} color="#999" />
              )}
            </button>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  textDecoration:
                    task.status === "completed" ? "line-through" : "none",
                  color: task.status === "completed" ? "#999" : "#000",
                }}
              >
                {task.title}
              </p>
              {task.assigned_to && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  {lang === "en" ? "Assigned to:" : "مخصص لـ:"}{" "}
                  {task.assigned_to}
                </p>
              )}
            </div>
            <button
              onClick={() => onDelete(task.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <Trash2 size={18} color="#ff4444" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function ChatTab({ messages, user, lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
          {lang === "en" ? "No messages yet" : "لا توجد رسائل بعد"}
        </p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.user_id === user.uid ? "flex-end" : "flex-start",
              maxWidth: "70%",
            }}
          >
            <div
              style={{
                padding: "12px",
                background: msg.user_id === user.uid ? "#629FAD" : "#f5f5f5",
                color: msg.user_id === user.uid ? "white" : "black",
                borderRadius: "16px",
                wordBreak: "break-word",
              }}
            >
              {msg.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FilesTab({ files, lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {files.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
          {lang === "en" ? "No files yet" : "لا توجد ملفات بعد"}
        </p>
      ) : (
        files.map((file) => (
          <div
            key={file.id}
            style={{
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <FileText size={24} color="#629FAD" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0 }}>{file.file_name}</p>
              <p
                style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}
              >
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

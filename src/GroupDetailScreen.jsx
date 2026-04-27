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
  Users,
  Check,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export function GroupDetailScreen({ group, user, lang, onClose }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [memberStats, setMemberStats] = useState([]); // NEW: Track member performance
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [isAdmin, setIsAdmin] = useState(group.role === "admin");
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
        async (p) => {
          // Fetch the profile for the new message to get the name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, image_url")
            .eq("id", p.new.user_id)
            .single();

          const enrichedMessage = {
            ...p.new,
            profiles: profile,
          };

          setMessages((prev) => [...prev, enrichedMessage]);
          scrollToBottom();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => fetchMembers(),
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
    fetchMemberStats(); // NEW: Fetch member statistics
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
    // Step 1: Get messages
    const { data: msgs } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    if (!msgs || msgs.length === 0) { setMessages([]); return; }

    // Step 2: Get profiles for senders
    const userIds = [...new Set(msgs.map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, image_url")
      .in("id", userIds);

    // Step 3: Merge
    const enriched = msgs.map((m) => ({
      ...m,
      profiles: profiles?.find((p) => p.id === m.user_id) || null,
    }));
    setMessages(enriched);
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
    // Step 1: Get members
    const { data: mems } = await supabase
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", group.id);
    if (!mems || mems.length === 0) { setMembers([]); return; }

    // Step 2: Get profiles
    const userIds = mems.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, image_url")
      .in("id", userIds);

    // Step 3: Merge
    const enriched = mems.map((m) => ({
      ...m,
      profiles: profiles?.find((p) => p.id === m.user_id) || null,
    }));
    setMembers(enriched);
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

  const fetchMemberStats = async () => {
    try {
      // Get all members with their profiles
      const { data: membersData } = await supabase
        .from("group_members")
        .select(`user_id, role, profiles(name, image_url)`)
        .eq("group_id", group.id);

      if (!membersData) return;

      // Calculate stats for each member
      const statsPromises = membersData.map(async (member) => {
        // Count tasks completed by this member
        const { data: completedTasks } = await supabase
          .from("group_tasks")
          .select("id")
          .eq("group_id", group.id)
          .eq("completed_by", member.user_id)
          .eq("status", "completed");

        // Count tasks assigned to this member
        const { data: assignedTasks } = await supabase
          .from("group_tasks")
          .select("id")
          .eq("group_id", group.id)
          .eq("assigned_to", member.user_id);

        // Count total actions by this member
        const { data: memberActivities } = await supabase
          .from("group_activities")
          .select("id, created_at")
          .eq("group_id", group.id)
          .eq("user_id", member.user_id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastActive = memberActivities?.[0]?.created_at || null;
        const isActive = lastActive
          ? new Date() - new Date(lastActive) < 24 * 60 * 60 * 1000 // Active in last 24h
          : false;

        return {
          user_id: member.user_id,
          name: member.profiles?.name || "Unknown",
          image_url: member.profiles?.image_url || "",
          role: member.role,
          tasks_completed: completedTasks?.length || 0,
          tasks_assigned: assignedTasks?.length || 0,
          total_actions: memberActivities?.length || 0,
          last_active: lastActive,
          is_active: isActive,
        };
      });

      const stats = await Promise.all(statsPromises);
      // Sort by tasks completed (descending)
      stats.sort((a, b) => b.tasks_completed - a.tasks_completed);
      setMemberStats(stats);
    } catch (error) {
      console.error("Error fetching member stats:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  };

  const logActivity = async (type, content) => {
    try {
      const { error } = await supabase.from("group_activities").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          action_type: type,
          content: content,
        },
      ]);
      if (error) console.error("Activity logging error:", error);
    } catch (e) {
      console.error("Log Activity Failed:", e);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    if (!isAdmin) {
      alert(
        lang === "ar"
          ? "فقط المشرف يمكنه إضافة مهام"
          : "Only admin can add tasks",
      );
      return;
    }
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
      alert("Error saving task");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    const isAssignee = task.assigned_to === user.uid;
    const isCreator = task.created_by === user.uid;
    const isUnassigned = !task.assigned_to;

    if (!isUnassigned && !isAssignee && !isAdmin) {
      alert(
        lang === "ar"
          ? "هذه المهمة موكلة لشخص معين"
          : "This task is assigned to a specific person",
      );
      return;
    }

    const newStatus = task.status === "completed" ? "pending" : "completed";

    // OPTIMISTIC UPDATE: Update UI immediately for better UX
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus,
              completed_at:
                newStatus === "completed" ? new Date().toISOString() : null,
              completed_by: newStatus === "completed" ? user.uid : null,
            }
          : t,
      ),
    );

    // Play sound immediately
    if (newStatus === "completed") {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
      );
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    try {
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

      // Log activity in background (don't wait for it)
      logActivity(
        newStatus === "completed" ? "task_completed" : "task_reopened",
        task.title,
      );
    } catch (e) {
      console.error("Update Task Error:", e);
      // REVERT optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: task.status,
                completed_at: task.completed_at,
                completed_by: task.completed_by,
              }
            : t,
        ),
      );
      alert(
        lang === "ar"
          ? "فشل تحديث المهمة. تأكد من إعدادات قاعدة البيانات."
          : "Error updating task. Check DB settings.",
      );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // ── OPTIMISTIC UPDATE: show message instantly ─────────────────────────
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: group.id,
      user_id: user.uid,
      message: messageText,
      created_at: new Date().toISOString(),
      profiles: { name: user.name, image_url: user.image },
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const { data, error } = await supabase
        .from("group_messages")
        .insert([{
          group_id: group.id,
          user_id: user.uid,
          message: messageText,
        }])
        .select("*")
        .single();

      if (error) {
        console.error("Message Send Error:", error);
        // Remove optimistic message & restore input on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(messageText);
        alert(
          lang === "ar"
            ? "فشل إرسال الرسالة. حاول مرة أخرى."
            : "Failed to send message. Please try again."
        );
        return;
      }

      // Replace optimistic message with confirmed server message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data : m))
      );

      // Log activity in background
      logActivity("message_sent", messageText.substring(0, 50));
      scrollToBottom();
    } catch (e) {
      console.error("Unexpected message error:", e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      alert(
        lang === "ar"
          ? "خطأ غير متوقع. تحقق من الاتصال بالإنترنت."
          : "Unexpected error. Check your internet connection."
      );
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
      background: "#f8f9fa",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,0,0,0.03)",
      sticky: "top",
    },
    tabs: {
      display: "flex",
      background: "rgba(255, 255, 255, 0.5)",
      backdropFilter: "blur(10px)",
      padding: "6px",
      margin: "0 16px 12px",
      borderRadius: "20px",
      border: "1px solid rgba(0,0,0,0.03)",
    },
    tabBtn: (active) => ({
      flex: 1,
      padding: "10px 4px",
      border: "none",
      borderRadius: "16px",
      background: active ? "white" : "transparent",
      color: active ? "#629FAD" : "#7b8a91",
      fontSize: "11px",
      fontWeight: "800",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      position: "relative",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: active ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
    }),
    content: {
      flex: 1,
      overflowY: "auto",
      padding: "8px 20px",
      paddingBottom: "140px",
    },
    footer: {
      position: "absolute",
      bottom: "24px",
      left: "16px",
      right: "16px",
      padding: "14px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(15px)",
      borderRadius: "26px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
    },
    input: {
      flex: 1,
      padding: "14px 18px",
      borderRadius: "18px",
      border: "1px solid rgba(0,0,0,0.05)",
      background: "#f9fbff",
      fontSize: "14px",
      fontWeight: "500",
      outline: "none",
      transition: "all 0.3s ease",
    },
    inputGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      width: "100%",
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
            <span style={{ fontSize: "10px", marginTop: "4px" }}>
              {lang === "ar"
                ? tab === "tasks"
                  ? "المهام"
                  : tab === "chat"
                    ? "الدردشة"
                    : tab === "files"
                      ? "الملفات"
                      : "النشاط"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  width: "20px",
                  height: "3px",
                  background: "#629FAD",
                  borderRadius: "10px",
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === "tasks" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {tasks.length > 0 && (
              <div
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "28px",
                  marginBottom: "20px",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#629FAD",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {lang === "ar" ? "أداء المجموعة الكلي" : "Team Performance"}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "900",
                      color: "#333",
                    }}
                  >
                    {Math.round(
                      (tasks.filter((t) => t.status === "completed").length /
                        tasks.length) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "#f0f2f5",
                    borderRadius: "10px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(tasks.filter((t) => t.status === "completed").length / tasks.length) * 100}%`,
                    }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #629FAD, #8DBBC5)",
                      borderRadius: "10px",
                      boxShadow: "2px 0 10px rgba(98, 159, 173, 0.4)",
                    }}
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#aaa",
                  }}
                >
                  <ListTodo
                    size={48}
                    style={{ marginBottom: "16px", opacity: 0.1 }}
                  />
                  <p style={{ fontSize: "14px" }}>
                    {lang === "ar"
                      ? "ابدأ بإضافة أول مهمة للمجموعة"
                      : "Start by adding the first task"}
                  </p>
                </motion.div>
              ) : (
                tasks.map((t, index) => {
                  const assignedUser = members.find(
                    (m) => m.user_id === t.assigned_to,
                  );
                  const completedByUser = members.find(
                    (m) => m.user_id === t.completed_by,
                  );
                  const isCompleted = t.status === "completed";
                  const isMyTask = t.assigned_to === user.uid;
                  const isCreator = t.created_by === user.uid;
                  const isUnassigned = !t.assigned_to;

                  // Can I complete it?
                  const canComplete = isUnassigned || isMyTask || isAdmin;

                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTaskStatus(t)}
                      style={{
                        padding: "18px 22px",
                        background: isCompleted
                          ? "rgba(255,255,255,0.6)"
                          : "white",
                        borderRadius: "26px",
                        border:
                          isMyTask && !isCompleted
                            ? "1.5px solid #629FAD"
                            : "1px solid rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        boxShadow: isCompleted
                          ? "0 4px 12px rgba(0,0,0,0.01)"
                          : isMyTask
                            ? "0 12px 30px rgba(98, 159, 173, 0.12)"
                            : "0 8px 20px rgba(0,0,0,0.03)",
                        cursor: canComplete ? "pointer" : "default",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
                      }}
                    >
                      {isCompleted && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: "4px",
                            background: "#629FAD",
                            opacity: 0.5,
                          }}
                        />
                      )}

                      <div
                        style={{
                          color: isCompleted ? "#629FAD" : "#ddd",
                          transition: "color 0.3s",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle size={26} />
                        ) : (
                          <Circle size={26} />
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: "600",
                            color: isCompleted ? "#aaa" : "#333",
                            textDecoration: isCompleted
                              ? "line-through"
                              : "none",
                            transition: "all 0.3s",
                          }}
                        >
                          {t.title}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "6px",
                          }}
                        >
                          {t.assigned_to && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                background: isMyTask ? "#629FAD15" : "#f5f5f5",
                                borderRadius: "8px",
                                color: isMyTask ? "#629FAD" : "#777",
                              }}
                            >
                              <User size={10} />
                              <span
                                style={{ fontSize: "10px", fontWeight: "700" }}
                              >
                                {isMyTask
                                  ? lang === "ar"
                                    ? "أنا"
                                    : "Me"
                                  : assignedUser?.profiles?.name ||
                                    (lang === "ar" ? "عضو" : "Member")}
                              </span>
                            </div>
                          )}
                          {!t.assigned_to && !isCompleted && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#629FAD",
                                fontWeight: "800",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(98, 159, 173, 0.1)",
                                padding: "2px 8px",
                                borderRadius: "8px",
                              }}
                            >
                              <Users size={12} />
                              {lang === "ar"
                                ? "متاحة للجميع"
                                : "Open for anyone"}
                            </div>
                          )}
                          {isCompleted && completedByUser && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                background: "#E8F5E9",
                                borderRadius: "8px",
                                color: "#2E7D32",
                              }}
                            >
                              <Check size={10} />
                              <span
                                style={{ fontSize: "10px", fontWeight: "700" }}
                              >
                                {lang === "ar" ? "أنجزها: " : "Done by: "}
                                {t.completed_by === user.uid
                                  ? lang === "ar"
                                    ? "أنا"
                                    : "Me"
                                  : completedByUser?.profiles?.name ||
                                    (lang === "ar" ? "عضو" : "Member")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {canComplete && !isCompleted && (
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "2px solid #629FAD",
                            opacity: 0.3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={12} color="#629FAD" />
                        </div>
                      )}
                      {!canComplete && !isCompleted && (
                        <div style={{ opacity: 0.2 }}>
                          <User size={18} />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "chat" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {messages.map((m, idx) => {
              const isMe = m.user_id === user.uid;
              const senderName = m.profiles?.name || "Member";
              const showName =
                !isMe && (idx === 0 || messages[idx - 1].user_id !== m.user_id);

              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {showName && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        color: "#629FAD",
                        marginBottom: "4px",
                        [lang === "ar" ? "marginRight" : "marginLeft"]: "12px",
                      }}
                    >
                      {senderName}
                    </span>
                  )}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isMe
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      background: isMe ? "#629FAD" : "#fff",
                      color: isMe ? "white" : "#333",
                      fontSize: "14px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      border: isMe ? "none" : "1px solid #f0f0f0",
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
                            style={{
                              maxWidth: "100%",
                              borderRadius: "8px",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <FileText size={18} />
                            <span
                              style={{
                                fontSize: "12px",
                                textDecoration: "underline",
                              }}
                            >
                              {m.file_name}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, lineHeight: "1.5" }}>
                        {m.message}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#bbb",
                      marginTop: "4px",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      fontWeight: "600",
                    }}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "10px 4px",
              position: "relative",
            }}
          >
            {/* LEADERBOARD SECTION */}
            {memberStats.length > 0 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#333",
                    }}
                  >
                    {lang === "ar" ? "🏆 لوحة المتصدرين" : "🏆 Leaderboard"}
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#629FAD",
                      fontWeight: "700",
                    }}
                  >
                    {lang === "ar"
                      ? `${memberStats.length} أعضاء`
                      : `${memberStats.length} members`}
                  </span>
                </div>

                {memberStats.map((stat, index) => {
                  const isTopPerformer =
                    index === 0 && stat.tasks_completed > 0;
                  const isMe = stat.user_id === user.uid;

                  return (
                    <motion.div
                      key={stat.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: isMe
                          ? "rgba(98, 159, 173, 0.08)"
                          : isTopPerformer
                            ? "rgba(255, 215, 0, 0.1)"
                            : "#f9f9f9",
                        borderRadius: "16px",
                        marginBottom: "8px",
                        border: isMe
                          ? "2px solid #629FAD"
                          : isTopPerformer
                            ? "2px solid #FFD700"
                            : "1px solid #f0f0f0",
                        position: "relative",
                      }}
                    >
                      {/* Rank Badge */}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background:
                            index === 0
                              ? "linear-gradient(135deg, #FFD700, #FFA500)"
                              : index === 1
                                ? "linear-gradient(135deg, #C0C0C0, #A8A8A8)"
                                : index === 2
                                  ? "linear-gradient(135deg, #CD7F32, #B87333)"
                                  : "#e0e0e0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "900",
                          fontSize: "12px",
                          color: index < 3 ? "white" : "#666",
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Profile Image */}
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: stat.image_url
                            ? `url(${stat.image_url})`
                            : "#629FAD",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "700",
                          fontSize: "14px",
                          flexShrink: 0,
                          position: "relative",
                        }}
                      >
                        {!stat.image_url && stat.name.charAt(0).toUpperCase()}
                        {/* Active Indicator */}
                        {stat.is_active && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: "#4CAF50",
                              border: "2px solid white",
                            }}
                          />
                        )}
                      </div>

                      {/* Member Info */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#333",
                            }}
                          >
                            {stat.name}
                            {isMe && ` (${lang === "ar" ? "أنا" : "Me"})`}
                          </span>
                          {stat.role === "admin" && (
                            <span
                              style={{
                                fontSize: "9px",
                                padding: "2px 6px",
                                background: "#E8F5E9",
                                color: "#2E7D32",
                                borderRadius: "6px",
                                fontWeight: "700",
                              }}
                            >
                              {lang === "ar" ? "مشرف" : "Admin"}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            marginTop: "2px",
                          }}
                        >
                          {lang === "ar"
                            ? `${stat.tasks_completed} مهام مكتملة`
                            : `${stat.tasks_completed} tasks completed`}
                          {stat.last_active && (
                            <span style={{ marginLeft: "8px", color: "#bbb" }}>
                              •{" "}
                              {stat.is_active
                                ? lang === "ar"
                                  ? "نشط"
                                  : "Active"
                                : lang === "ar"
                                  ? "غير نشط"
                                  : "Inactive"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Badge */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "6px 10px",
                          background: "white",
                          borderRadius: "12px",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "900",
                            color: "#629FAD",
                          }}
                        >
                          {stat.tasks_completed}
                        </span>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#999",
                            fontWeight: "600",
                          }}
                        >
                          {lang === "ar" ? "مهام" : "tasks"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ACTIVITY TIMELINE SECTION */}
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#333",
                }}
              >
                {lang === "ar" ? "📋 سجل النشاط" : "📋 Activity Log"}
              </h3>

              {/* Timeline Vertical Line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  [lang === "ar" ? "right" : "left"]: "19px",
                  width: "2px",
                  background: "rgba(98, 159, 173, 0.1)",
                  borderRadius: "10px",
                }}
              />

              {activities.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#aaa",
                  }}
                >
                  <Activity
                    size={40}
                    style={{ opacity: 0.2, marginBottom: "12px" }}
                  />
                  <p style={{ fontSize: "14px" }}>
                    {lang === "ar" ? "لا يوجد نشاط بعد" : "No activity yet"}
                  </p>
                </div>
              )}
            </div>

            {activities.map((a, index) => {
              const Icon =
                a.action_type === "task_created"
                  ? ListTodo
                  : a.action_type === "task_completed"
                    ? CheckCircle
                    : a.action_type === "file_uploaded"
                      ? FileText
                      : Activity;

              const title =
                lang === "ar"
                  ? a.action_type === "task_created"
                    ? "إضافة مهمة"
                    : a.action_type === "task_completed"
                      ? "إكمال مهمة"
                      : a.action_type === "file_uploaded"
                        ? "رفع ملف"
                        : "نشاط"
                  : a.action_type === "task_created"
                    ? "Task Created"
                    : a.action_type === "task_completed"
                      ? "Task Completed"
                      : a.action_type === "file_uploaded"
                        ? "File Uploaded"
                        : "Activity";

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "start",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {/* Icon Circle */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "14px",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#629FAD",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      border: "1px solid rgba(0,0,0,0.02)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div
                    style={{
                      flex: 1,
                      paddingTop: "2px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#629FAD",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {title}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#bbb",
                          fontWeight: "600",
                        }}
                      >
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#333",
                        fontWeight: "500",
                        lineHeight: "1.4",
                      }}
                    >
                      {a.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {activeTab === "tasks" && isAdmin && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={
                  lang === "ar"
                    ? "ما هي المهمة الجديدة؟"
                    : "Enter task title..."
                }
                style={styles.input}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={createTask}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #629FAD, #4A8999)",
                  color: "white",
                  width: "48px",
                  height: "48px",
                  borderRadius: "18px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(98, 159, 173, 0.3)",
                }}
              >
                {loading ? "..." : <Plus size={24} />}
              </motion.button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 4px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "#7b8a91",
                  fontWeight: "700",
                }}
              >
                {lang === "ar" ? "تعيين لـ:" : "Assign to:"}
              </span>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  fontWeight: "600",
                  background: "#fff",
                  color: "#444",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">
                  {lang === "ar"
                    ? "✨ مفتوحة للجميع (Open to All)"
                    : "✨ Open to All"}
                </option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === user.uid
                      ? lang === "ar"
                        ? "👤 أنا (المشرف)"
                        : "👤 Me (Admin)"
                      : "👤 " +
                        (m.profiles?.name ||
                          (lang === "ar" ? "عضو" : "Member"))}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {activeTab === "tasks" && !isAdmin && (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              background: "#f8f9fa",
              borderRadius: "15px",
              fontSize: "12px",
              color: "#888",
            }}
          >
            {lang === "ar"
              ? "فقط المشرف يمكنه إضافة وتعيين المهام"
              : "Only admins can create and assign tasks"}
          </div>
        )}
        {activeTab === "chat" && (
          <div style={styles.inputGroup}>
            {/* Attachment Button on the Right side (Start of RTL) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current.click()}
              style={{
                background: "#f0f4f7",
                border: "none",
                borderRadius: "15px",
                width: "42px",
                height: "42px",
                color: "#629FAD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <Paperclip size={20} />
            </motion.button>

            {/* Main Input field in the middle */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={lang === "ar" ? "اكتب هنا..." : "Type here..."}
              style={{
                ...styles.input,
                background: "white",
                boxShadow: "none",
                fontSize: "13px",
              }}
            />

            {/* Send Button on the Left side (End of RTL) */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: lang === "ar" ? 10 : -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              style={{
                background: "linear-gradient(135deg, #629FAD, #4A8999)",
                color: "white",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(98, 159, 173, 0.3)",
              }}
            >
              <Send
                size={18}
                style={{
                  transform: lang === "ar" ? "rotate(180deg)" : "none",
                  marginLeft: lang === "ar" ? "0" : "2px",
                }}
              />
            </motion.button>
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

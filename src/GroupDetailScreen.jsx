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
  Award,
  Sprout,
  Droplet,
  Sparkles,
  Bell,
  Camera,
  Star,
  KanbanSquare,
  Folder,
  Calendar as CalendarIcon,
  BarChart2,
  Clock as ClockIcon,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { WikiScreen } from "./WikiScreen";
import { KanbanScreen } from "./KanbanScreen";
import { TeamCalendar } from "./TeamCalendar";
import { TeamAnalytics } from "./TeamAnalytics";
import { FileSharing } from "./FileSharing";
import { TimeTracker } from "./TimeTracker";
import { chatService } from "./chat/chatService";
import { syncEngine } from "./chat/syncEngine";

export function GroupDetailScreen({ group, user, lang, onClose }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [garden, setGarden] = useState(null);
  const [isWatering, setIsWatering] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
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
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInstruction, setIsInstruction] = useState(false);

  // ── Real Plant Care & Alarm States ─────────────────────────
  const [realPlantAlarm, setRealPlantAlarm] = useState(
    localStorage.getItem(`real_plant_alarm_${group.id}_${user.uid}`) || ""
  );
  const [isAlarmActive, setIsAlarmActive] = useState(
    localStorage.getItem(`real_plant_alarm_active_${group.id}_${user.uid}`) === "true"
  );
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  const [showStarsCelebration, setShowStarsCelebration] = useState(false);
  const [isUploadingRealPlant, setIsUploadingRealPlant] = useState(false);
  const [lastAlarmTriggeredDate, setLastAlarmTriggeredDate] = useState("");
  const realPlantFileInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [connStatus, setConnStatus] = useState(chatService.getConnectionStatus());

  useEffect(() => {
    const unsubStatus = syncEngine.onStatusChange((st) => setConnStatus(st));
    const handleNet = () => setConnStatus(chatService.getConnectionStatus());
    window.addEventListener("online", handleNet);
    window.addEventListener("offline", handleNet);
    return () => {
      unsubStatus();
      window.removeEventListener("online", handleNet);
      window.removeEventListener("offline", handleNet);
    };
  }, []);

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
        { 
          event: "INSERT", 
          schema: "public", 
          table: "group_messages",
          filter: `group_id=eq.${group.id}` 
        },
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

          setMessages((prev) => {
            // Check if the message is already present by id
            const alreadyExists = prev.some((m) => m.id === p.new.id);
            if (alreadyExists) return prev;

            // Check if there is an optimistic temp message matching this text and user
            const tempMsgIdx = prev.findIndex(
              (m) =>
                m.id &&
                m.id.toString().startsWith("temp-") &&
                m.message === p.new.message &&
                m.user_id === p.new.user_id
            );

            if (tempMsgIdx !== -1) {
              // Replace the temp message inline to keep order and prevent double render
              return prev.map((m, idx) =>
                idx === tempMsgIdx ? enrichedMessage : m
              );
            }

            return [...prev, enrichedMessage];
          });
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_gardens",
        },
        (payload) => {
          if (payload.new && payload.new.group_id === group.id) {
            console.log("🪴 Garden realtime update received:", payload.new);
            setGarden(payload.new);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  useEffect(() => {
    if (activeTab === "garden") {
      fetchGarden();
    }
  }, [activeTab]);

  useEffect(() => {
    let intervalId;
    if (isAlarmActive && realPlantAlarm) {
      intervalId = setInterval(() => {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, "0");
        const currentMinutes = String(now.getMinutes()).padStart(2, "0");
        const currentTimeString = `${currentHours}:${currentMinutes}`;
        const todayStr = now.toDateString();

        if (currentTimeString === realPlantAlarm && lastAlarmTriggeredDate !== todayStr) {
          setLastAlarmTriggeredDate(todayStr);
          setShowAlarmDialog(true);
          try {
            const alarmAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/1018/1018-preview.mp3");
            alarmAudio.volume = 0.5;
            alarmAudio.play().catch(() => {});
          } catch (e) {}
        }
      }, 15000); // Check every 15 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAlarmActive, realPlantAlarm, lastAlarmTriggeredDate]);

  const fetchInitialData = async () => {
    fetchTasks();
    fetchMessages();
    fetchFiles();
    fetchMembers();
    fetchActivities();
    fetchMemberStats(); // NEW: Fetch member statistics
    fetchGarden(); // NEW: Fetch garden details
  };

  const fetchGarden = async () => {
    try {
      const { data, error } = await supabase
        .from("group_gardens")
        .select("*")
        .eq("group_id", group.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGarden(data);
      } else {
        // Create default garden row if it doesn't exist yet
        const defaultGarden = {
          group_id: group.id,
          level: 1,
          experience: 0,
          water_drops: 0,
          last_watered_by: null,
        };
        const { data: inserted, error: insertError } = await supabase
          .from("group_gardens")
          .insert([defaultGarden])
          .select("*")
          .single();

        if (!insertError && inserted) {
          setGarden(inserted);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching garden:", err.message);
    }
  };

  const handleWatering = async () => {
    if (!garden || garden.water_drops <= 0 || isWatering) return;
    setIsWatering(true);

    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (soundErr) {}

    const currentExp = garden.experience + 10;
    const currentLevel = garden.level;
    const expNeeded = currentLevel * 100;
    
    let newLevel = currentLevel;
    let newExp = currentExp;
    let didLevelUp = false;

    if (currentExp >= expNeeded) {
      newLevel = currentLevel + 1;
      newExp = currentExp - expNeeded;
      didLevelUp = true;
    }

    const newWaterDrops = garden.water_drops - 1;

    setGarden(prev => ({
      ...prev,
      water_drops: newWaterDrops,
      experience: newExp,
      level: newLevel
    }));

    setTimeout(async () => {
      setIsWatering(false);
      
      try {
        const { error } = await supabase
          .from("group_gardens")
          .update({
            level: newLevel,
            experience: newExp,
            water_drops: newWaterDrops,
            last_watered_at: new Date().toISOString(),
            last_watered_by: user.uid
          })
          .eq("group_id", group.id);

        if (error) throw error;

        logActivity("garden_watered", didLevelUp ? `Watered & Leveled up to Level ${newLevel}! 🪴` : `Watered the garden (+10 EXP) 💧`);

        if (didLevelUp) {
          try {
            const chime = new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3");
            chime.volume = 0.5;
            chime.play().catch(() => {});
          } catch (soundErr) {}
          setShowLevelUp(true);

          const notifTitle = lang === "ar" ? `🎉 ارتقت حديقة المجموعة!` : `🎉 Group Garden Leveled Up!`;
          const notifBody = lang === "ar"
            ? `مبروك! ارتقت الحديقة إلى المستوى ${newLevel} بفضل سقي ${user.name || "عضو"}!`
            : `Congratulations! The garden leveled up to Level ${newLevel} thanks to ${user.name || "a member"}!`;

          await sendRealtimeNotification(notifTitle, notifBody, "garden_levelup", null);
          await sendPushNotification(notifTitle, notifBody, null);
        }
      } catch (err) {
        console.error("Error updating garden database:", err);
        fetchGarden();
      }
    }, 1500);
  };

  const handleRealPlantUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingRealPlant(true);
    try {
      // 1. Upload to Supabase Storage in group-files bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `real_plant_${Date.now()}.${fileExt}`;
      const path = `groups/${group.id}/real_plants/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("group-files")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("group-files")
        .getPublicUrl(path);

      // 2. Fetch profile points, update by adding 3 points (stars)
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.uid)
        .single();

      if (profileErr) throw profileErr;

      const currentPoints = profileData?.points || 0;
      const newPoints = currentPoints + 3;

      const { error: updatePointsErr } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", user.uid);

      if (updatePointsErr) throw updatePointsErr;

      // Update local user object (if mutable) for instant UI feedback
      if (user) {
        user.points = newPoints;
      }

      // 3. Post picture & message to the group chat
      const chatMessage = lang === "ar" 
        ? "📸 لقد سقيت نبتتي الحقيقية في الواقع! ما رأيكم بها؟ (+3 ⭐)" 
        : "📸 I just watered my real-life plant! What do you think? (+3 ⭐)";
      
      const { error: msgErr } = await supabase.from("group_messages").insert([{
        group_id: group.id,
        user_id: user.uid,
        message: chatMessage,
        file_url: publicUrl,
        file_name: file.name,
        file_type: "image"
      }]);

      if (msgErr) throw msgErr;

      // 4. Log activity
      logActivity("real_plant_watered", `Watered real plant (+3 ⭐)`);

      // 5. Send Realtime & Push Notifications to group
      const notifTitle = lang === "ar" ? "🌿 نبتة حقيقية سُقيت!" : "🌿 Real Plant Watered!";
      const notifBody = lang === "ar"
        ? `قام ${user.name || "عضو"} بسقي نبتته الحقيقية ورفع صورتها (+3 ⭐)`
        : `${user.name || "A member"} watered their real plant and uploaded a photo (+3 ⭐)`;
      
      await sendRealtimeNotification(notifTitle, notifBody, "real_plant_photo", publicUrl);
      await sendPushNotification(notifTitle, notifBody, null);

      // 6. Play success sounds and show Star Celebration overlay
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (soundErr) {}

      setShowStarsCelebration(true);
      setTimeout(() => {
        setShowStarsCelebration(false);
      }, 4000);

    } catch (err) {
      console.error("❌ Error uploading real plant photo:", err);
      alert(lang === "ar" ? "فشل رفع الصورة ونيل النجوم. حاول مرة أخرى." : "Failed to upload photo and earn stars. Try again.");
    } finally {
      setIsUploadingRealPlant(false);
      if (realPlantFileInputRef.current) {
        realPlantFileInputRef.current.value = "";
      }
    }
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
    // 1. Load local messages from IndexedDB for instant offline-first display
    let localEnvelopes = [];
    try {
      localEnvelopes = await chatService.loadConversationMessages(group.id);
    } catch (err) {
      console.warn("⚠️ Error loading local IndexedDB messages:", err);
    }

    const formatLocalEnvelope = (env) => ({
      id: env.id,
      group_id: env.conversationId,
      user_id: env.senderId,
      message: env.metadata?.decryptedMessage || env.ciphertext || "",
      created_at: new Date(env.createdAt || Date.now()).toISOString(),
      status: env.status || "synced",
      file_url: env.metadata?.fileUrl || null,
      file_name: env.metadata?.fileName || null,
      file_type: env.metadata?.fileType || null,
      profiles: { name: user.uid === env.senderId ? (user.name || "Me") : "Member", image_url: "" },
    });

    if (!navigator.onLine) {
      if (localEnvelopes.length > 0) {
        setMessages(localEnvelopes.map(formatLocalEnvelope));
        scrollToBottom();
      } else {
        setMessages([]);
      }
      return;
    }

    // 2. If online, fetch messages from Supabase
    try {
      const { data: msgs, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      if (error || !msgs || msgs.length === 0) {
        if (localEnvelopes.length > 0) {
          setMessages(localEnvelopes.map(formatLocalEnvelope));
        } else {
          setMessages([]);
        }
        return;
      }

      // Step 3: Get profiles for senders
      const userIds = [...new Set(msgs.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, image_url")
        .in("id", userIds);

      // Step 4: Merge profiles
      const enriched = msgs.map((m) => ({
        ...m,
        profiles: profiles?.find((p) => p.id === m.user_id) || null,
      }));

      // Cache remote messages into local IndexedDB for future offline reading
      await chatService.cacheRemoteMessages(enriched);

      setMessages(enriched);
      scrollToBottom();
    } catch (err) {
      console.warn("⚠️ Online message fetch failed, displaying local messages:", err);
      if (localEnvelopes.length > 0) {
        setMessages(localEnvelopes.map(formatLocalEnvelope));
        scrollToBottom();
      }
    }
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
      .select("id, name, image_url, fcm_token")
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
      // Step 1: Get members (no FK join)
      const { data: membersData } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", group.id);

      if (!membersData || membersData.length === 0) return;

      // Step 2: Get profiles separately
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, image_url")
        .in("id", userIds);

      // Step 3: Merge profiles into members
      const membersWithProfiles = membersData.map((m) => ({
        ...m,
        profiles: profilesData?.find((p) => p.id === m.user_id) || null,
      }));

      // Calculate stats for each member
      const statsPromises = membersWithProfiles.map(async (member) => {
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

  // ── Realtime Notification Bus ─────────────────────────────────────────
  // Inserts a row into group_notifications — Supabase Realtime broadcasts
  // it instantly to all connected clients who are listening (app open).
  const sendRealtimeNotification = async (title, body, type = "system", recipientId = null) => {
    try {
      const { error } = await supabase.from("group_notifications").insert([{
        group_id: group.id,
        sender_id: user.uid,
        recipient_id: recipientId,
        title,
        body,
        type,
      }]);
      if (error) {
        console.error("❌ Realtime notification insert error:", error.message);
      } else {
        console.log("✅ Realtime notification sent:", title);
      }
    } catch (err) {
      console.error("❌ Realtime notification failed:", err.message);
    }
  };

  // ── FCM Push Notification (works even when app is CLOSED/BACKGROUND) ──
  // Sends recipientUserIds to the Vercel function which uses service_role key
  // to look up FCM tokens — this bypasses Supabase RLS which blocks reading
  // other users' fcm_token from the client side.
  const sendPushNotification = async (title, body, recipientId = null) => {
    try {
      // Build list of target user IDs (exclude the sender)
      let targetUserIds = members
        .filter((m) => m.user_id !== user.uid)
        .map((m) => m.user_id);

      if (recipientId) {
        targetUserIds = targetUserIds.filter((id) => id === recipientId);
      }

      if (targetUserIds.length === 0) {
        console.log("ℹ️ No recipients found — skipping push");
        return;
      }

      console.log(`📡 Sending FCM push to ${targetUserIds.length} user(s): "${title}"`);

      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/send-notification"
        : "/api/send-notification";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserIds: targetUserIds, title, body }),
      });

      const result = await res.json();
      if (result.success) {
        console.log(`✅ FCM push sent. Success: ${result.successCount ?? "?"}, Skipped: ${result.skipped ?? false}`);
      } else {
        console.warn("⚠️ FCM push response:", result);
      }
    } catch (err) {
      console.warn("⚠️ FCM push failed (non-critical):", err.message);
    }
  };

  const createTask = async () => {
    const taskTitle = newTaskTitle.trim();
    const targetMember = selectedMember;

    if (!taskTitle) return;
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
          title: taskTitle,
          assigned_to: targetMember || null,
          created_by: user.uid,
          status: "pending",
        },
      ]);
      if (error) throw error;
      await logActivity("task_created", taskTitle);
      
      // Send notifications to assigned member or all members
      const taskNotifTitle = lang === "ar" ? `📋 مهمة جديدة في ${group.name}` : `📋 New Task in ${group.name}`;
      const taskNotifBody = targetMember
        ? (lang === "ar" ? `تم تكليفك بمهمة جديدة: "${taskTitle}"` : `You've been assigned: "${taskTitle}"`)
        : (lang === "ar" ? `مهمة جديدة للجميع: "${taskTitle}"` : `New task for everyone: "${taskTitle}"`);
      const taskRecipient = targetMember || null;

      // 1. Realtime (works when app is OPEN)
      await sendRealtimeNotification(taskNotifTitle, taskNotifBody, "task", taskRecipient);
      // 2. FCM Push (works when app is CLOSED/BACKGROUND)
      await sendPushNotification(taskNotifTitle, taskNotifBody, taskRecipient);

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
      const updatePayload = {
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        completed_by: newStatus === "completed" ? user.uid : null,
      };

      const { error } = await supabase
        .from("group_tasks")
        .update(updatePayload)
        .eq("id", task.id);

      if (error) {
        console.error("Task update DB error:", JSON.stringify(error));
        throw error;
      }

      // Log activity in background (don't wait for it)
      logActivity(
        newStatus === "completed" ? "task_completed" : "task_reopened",
        task.title,
      );

      // Send notifications when task is completed
      if (newStatus === "completed") {
        // Award 5 water drops to the garden
        try {
          const { data: currentGarden } = await supabase
            .from("group_gardens")
            .select("*")
            .eq("group_id", group.id)
            .maybeSingle();

          if (currentGarden) {
            await supabase
              .from("group_gardens")
              .update({ water_drops: currentGarden.water_drops + 5 })
              .eq("group_id", group.id);
          } else {
            await supabase
              .from("group_gardens")
              .insert([{ group_id: group.id, water_drops: 5, level: 1, experience: 0 }]);
          }
        } catch (gardenErr) {
          console.error("Error updating garden water drops:", gardenErr);
        }

        const completeTitle = lang === "ar" ? `✅ مهمة مكتملة في ${group.name}` : `✅ Task Completed in ${group.name}`;
        const completeBody = lang === "ar"
          ? `قام ${user.name} بإكمال المهمة: "${task.title}" (+5 💧)`
          : `${user.name} completed: "${task.title}" (+5 💧)`;
        // 1. Realtime (app open)
        await sendRealtimeNotification(completeTitle, completeBody, "task_complete", null);
        // 2. FCM Push (app closed)
        await sendPushNotification(completeTitle, completeBody, null);
      }
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
      // Use bitchat ChatService for encryption, persistence, and transport routing
      const { envelope } = await chatService.sendMessage({
        conversationId: group.id,
        senderId: user.uid,
        text: messageText,
      });

      setIsInstruction(false);

      // Log activity & send notifications
      logActivity("message_sent", messageText.substring(0, 50));
      const msgTitle = `💬 ${group.name}`;
      const msgBody = `${user.name}: ${messageText.substring(0, 100)}`;
      await sendRealtimeNotification(msgTitle, msgBody, "message", null);
      await sendPushNotification(msgTitle, msgBody, null);

      scrollToBottom();
    } catch (e) {
      console.error("Unexpected message error:", e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        uploadFile(file, "voice");
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) { alert("Mic error"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadFile = async (file, type = "document") => {
    setUploading(true);
    try {
      const path = `groups/${group.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("group-files").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("group-files").getPublicUrl(path);
      
      await chatService.sendMessage({
        conversationId: group.id,
        senderId: user.uid,
        text: type === "voice" ? "Voice message" : `Shared ${type}: ${file.name}`,
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: type,
      });
      
      fetchInitialData();
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); setShowUploadMenu(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file, file.type.startsWith("image/") ? "image" : "document");
  };

  const styles = {
    screen: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      background: "var(--bg-app)",
      position: "relative",
    },
    header: {
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justify: "space-between",
      background: "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      marginBottom: "12px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      direction: lang === "ar" ? "rtl" : "ltr",
    },
    tabs: {
      display: "flex",
      background: "var(--bg-subtle)",
      padding: "4px",
      marginBottom: "16px",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow)",
      gap: "4px",
      overflowX: "auto",
      scrollbarWidth: "none",
      direction: lang === "ar" ? "rtl" : "ltr",
      backdropFilter: "var(--apple-blur)",
    },
    tabBtn: (active) => ({
      flex: "0 0 auto",
      padding: "8px 14px",
      border: active ? "1px solid var(--border)" : "1px solid transparent",
      borderRadius: "var(--radius-md)",
      background: active ? "var(--bg-card)" : "transparent",
      color: active ? "var(--text-main)" : "var(--text-dim)",
      fontSize: "13px",
      fontWeight: active ? "700" : "500",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      whiteSpace: "nowrap",
      boxShadow: active ? "var(--shadow-md), var(--inner-highlight)" : "none",
    }),
    content: {
      flex: 1,
      paddingBottom: "140px",
    },
    footer: {
      position: "fixed",
      bottom: "12px",
      left: "16px",
      right: "16px",
      maxWidth: "calc(860px - 32px)",
      margin: "0 auto",
      padding: "12px",
      background: "var(--bg-card)",
      backdropFilter: "blur(15px)",
      WebkitBackdropFilter: "blur(15px)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--border)",
      zIndex: 1000,
    },
    input: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      background: "var(--bg-app)",
      fontSize: "14px",
      color: "var(--text-main)",
      outline: "none",
    },
    inputGroup: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      maxWidth: "900px",
      margin: "0 auto",
    },
  };

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            className="nav-icon-btn"
            style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {lang === "ar" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
              {group.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "600" }}>
                  {members.length} {lang === "ar" ? "أعضاء" : "members"}
                </span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "700",
                background: connStatus === "online" ? "rgba(16, 185, 129, 0.15)" : connStatus === "mesh" ? "rgba(59, 130, 246, 0.15)" : connStatus === "syncing" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: connStatus === "online" ? "#10b981" : connStatus === "mesh" ? "#3b82f6" : connStatus === "syncing" ? "#f59e0b" : "#ef4444",
                border: `1px solid ${connStatus === "online" ? "#10b981" : connStatus === "mesh" ? "#3b82f6" : connStatus === "syncing" ? "#f59e0b" : "#ef4444"}`
              }}>
                <span style={{ fontSize: "10px" }}>
                  {connStatus === "online" ? "🟢 Online" : connStatus === "mesh" ? "🔵 Mesh" : connStatus === "syncing" ? "🟡 Syncing" : "🔴 Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={styles.tabs} className="mobile-tabs-container">
        {[
          { id: "kanban", name: lang === "ar" ? "كانبان" : "Kanban", icon: KanbanSquare },
          { id: "wiki", name: lang === "ar" ? "المستندات" : "Wiki", icon: FileText },
          { id: "calendar", name: lang === "ar" ? "التقويم" : "Calendar", icon: CalendarIcon },
          { id: "analytics", name: lang === "ar" ? "التحليلات" : "Analytics", icon: BarChart2 },
          { id: "files", name: lang === "ar" ? "الملفات" : "Files", icon: Folder },
          { id: "timetracker", name: lang === "ar" ? "التتبع" : "Tracker", icon: ClockIcon },
          { id: "tasks", name: lang === "ar" ? "المهام" : "Tasks", icon: ListTodo },
          { id: "chat", name: lang === "ar" ? "الدردشة" : "Chat", icon: MessageSquare },
          { id: "garden", name: lang === "ar" ? "الحديقة" : "Garden", icon: Sprout },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={styles.tabBtn(active)}
            >
              <Icon size={15} color={active ? "#ffffff" : "var(--text-dim)"} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {activeTab === "kanban" && (
          <KanbanScreen group={group} user={user} lang={lang} onClose={onClose} />
        )}

        {activeTab === "wiki" && (
          <WikiScreen group={group} user={user} lang={lang} onClose={onClose} />
        )}

        {activeTab === "calendar" && (
          <TeamCalendar groups={[group]} user={user} lang={lang} />
        )}

        {activeTab === "analytics" && (
          <TeamAnalytics groups={[group]} user={user} lang={lang} />
        )}

        {activeTab === "files" && (
          <FileSharing group={group} user={user} lang={lang} />
        )}

        {activeTab === "timetracker" && (
          <TimeTracker groups={[group]} user={user} lang={lang} />
        )}

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
                      color: "var(--primary-light)",
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
                      background: "linear-gradient(90deg, var(--primary-light), #8DBBC5)",
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
                            ? "1.5px solid var(--primary-light)"
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
                            background: "var(--primary-light)",
                            opacity: 0.5,
                          }}
                        />
                      )}

                      <div
                        style={{
                          color: isCompleted ? "var(--primary-light)" : "#ddd",
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
                                background: isMyTask ? "var(--primary-light)15" : "#f5f5f5",
                                borderRadius: "8px",
                                color: isMyTask ? "var(--primary-light)" : "#777",
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
                                color: "var(--primary-light)",
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
                            border: "2px solid var(--primary-light)",
                            opacity: 0.3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={12} color="var(--primary-light)" />
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
                        color: "var(--primary-light)",
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
                      background: m.is_instruction 
                        ? "rgba(255, 215, 0, 0.15)" 
                        : (isMe ? "var(--primary)" : "var(--bg-card)"),
                      color: isMe ? "white" : "var(--text-main)",
                      fontSize: "14px",
                      boxShadow: "var(--shadow)",
                      border: m.is_instruction 
                        ? "1.5px solid #FFD700" 
                        : "1px solid var(--border)",
                    }}
                  >
                    {m.file_url ? (
                      <div
                        onClick={() => !m.file_type?.includes("voice") && window.open(m.file_url, "_blank")}
                        style={{ cursor: "pointer" }}
                      >
                        {m.file_type === "voice" || m.file_name?.endsWith(".webm") || m.file_name?.endsWith(".mp3") ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", opacity: 0.9 }}>🎙️ Voice Message</span>
                            <audio controls src={m.file_url} style={{ maxWidth: "220px", height: "36px" }} />
                          </div>
                        ) : m.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || m.file_type === "image" ? (
                          <img
                            src={m.file_url}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "240px",
                              borderRadius: "8px",
                              display: "block",
                              objectFit: "cover",
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
                              {m.file_name || "Attachment"}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#bbb",
                        fontWeight: "600",
                      }}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span style={{ fontSize: "10px", fontWeight: "700" }}>
                        {m.status === "offline" || m.status === "pending" || m.status === "sending" ? (
                          <span title="Queued Offline (Pending Sync)" style={{ color: "#f59e0b" }}>🟡</span>
                        ) : m.status === "relayed" ? (
                          <span title="Relayed via BLE Mesh" style={{ color: "#3b82f6" }}>🔵</span>
                        ) : (
                          <span title="Synced to Cloud" style={{ color: "#10b981" }}>🟢</span>
                        )}
                      </span>
                    )}
                  </div>
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
                  <FileText size={20} color="var(--primary-light)" />
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
                      color: "var(--primary-light)",
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
                          ? "2px solid var(--primary-light)"
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
                            : "var(--primary-light)",
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
                            color: "var(--primary-light)",
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
                      color: "var(--primary-light)",
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
                          color: "var(--primary-light)",
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

        {activeTab === "garden" && (
          <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              padding: "20px",
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              position: "relative",
              overflow: "hidden",
              margin: "10px 4px",
            }}
          >
            <AnimatePresence>
              {showLevelUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(255, 255, 255, 0.95)",
                    zIndex: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: [0.5, 1.2, 1], rotate: 0 }}
                    transition={{ type: "spring", damping: 10 }}
                  >
                    <Award size={80} color="#FFD700" style={{ marginBottom: "16px", filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))" }} />
                  </motion.div>
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ fontSize: "28px", fontWeight: "900", color: "var(--primary)", margin: "0 0 8px 0" }}
                  >
                    {lang === "ar" ? "🏆 ارتقاء المستوى!" : "🏆 Level Up!"}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontSize: "16px", color: "var(--text-dim)", margin: "0 0 24px 0", fontWeight: "600" }}
                  >
                    {lang === "ar"
                      ? `حديقتكم ارتقت إلى المستوى ${garden?.level || 1}!`
                      : `Your garden reached Level ${garden?.level || 1}!`}
                  </motion.p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLevelUp(false)}
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                      color: "white",
                      border: "none",
                      padding: "12px 30px",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {lang === "ar" ? "رائع! ✨" : "Awesome! ✨"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                position: "absolute",
                top: "-50px",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(98, 159, 173, 0.12) 0%, rgba(255,255,255,0) 70%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 1, gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", background: "#f8fafc", padding: "10px 16px", borderRadius: "16px", border: "1px solid #f1f5f9", flex: 1, alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  {lang === "ar" ? "المستوى" : "Level"}
                </span>
                <span style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>
                  {garden?.level || 1}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", background: "#f8fafc", padding: "10px 16px", borderRadius: "16px", border: "1px solid #f1f5f9", flex: 1, alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  {lang === "ar" ? "قطرات الماء" : "Water Drops"}
                </span>
                <span style={{ fontSize: "20px", fontWeight: "900", color: "#3a86c8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Droplet size={18} fill="#3a86c8" /> {garden?.water_drops || 0}
                </span>
              </div>
            </div>

            <div style={{ width: "100%", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontWeight: "700", marginBottom: "6px" }}>
                <span>{lang === "ar" ? "خبرة النمو" : "Growth Experience"}</span>
                <span>{(garden?.experience || 0)} / {((garden?.level || 1) * 100)} EXP</span>
              </div>
              <div style={{ width: "100%", height: "12px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((garden?.experience || 0) / ((garden?.level || 1) * 100)) * 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary-light), #4ade80)",
                    borderRadius: "10px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: "280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(98, 159, 173, 0.04) 100%)",
                borderRadius: "20px",
                border: "1px solid rgba(0,0,0,0.02)",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [-20, -180],
                    x: [0, Math.sin(i) * 30],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 4 + i % 3,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: "absolute",
                    bottom: "40px",
                    left: `${30 + (i * 8)}%`,
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: garden?.level >= 5 ? "#ffb7b2" : "#fef08a",
                    boxShadow: "0 0 8px currentColor",
                    pointerEvents: "none",
                  }}
                />
              ))}

              <motion.svg
                viewBox="0 0 200 200"
                style={{ width: "200px", height: "200px", overflow: "visible" }}
                animate={{ rotate: [0, 1, -1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ellipse cx="100" cy="180" rx="70" ry="12" fill="#d7ccc8" />
                <ellipse cx="100" cy="178" rx="55" ry="8" fill="#8d6e63" />

                {(!garden || garden.level === 1) && (
                  <g>
                    <path d="M 100 178 Q 97 160 102 145" fill="none" stroke="#4caf50" strokeWidth="4" strokeLinecap="round" />
                    <motion.path
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      d="M 100 155 Q 85 145 92 135 Q 100 145 100 155"
                      fill="#81c784"
                    />
                    <motion.path
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      d="M 101 148 Q 115 140 108 130 Q 101 140 101 148"
                      fill="#81c784"
                    />
                  </g>
                )}

                {garden?.level === 2 && (
                  <g>
                    <path d="M 100 178 Q 96 150 100 120" fill="none" stroke="#8d6e63" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 98 145 Q 88 135 84 130" fill="none" stroke="#8d6e63" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 99 135 Q 110 125 116 122" fill="none" stroke="#8d6e63" strokeWidth="4" strokeLinecap="round" />
                    
                    <path d="M 84 130 Q 72 125 78 116 Q 86 125 84 130" fill="#4caf50" />
                    <path d="M 116 122 Q 128 115 124 105 Q 116 115 116 122" fill="#4caf50" />
                    <path d="M 100 120 Q 90 105 100 95 Q 110 105 100 120" fill="#81c784" />
                  </g>
                )}

                {garden?.level === 3 && (
                  <g>
                    <path d="M 100 178 Q 97 140 100 105" fill="none" stroke="#5d4037" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 98 140 Q 80 125 72 120" fill="none" stroke="#5d4037" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 100 130 Q 118 115 125 110" fill="none" stroke="#5d4037" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 99 115 Q 92 95 85 90" fill="none" stroke="#5d4037" strokeWidth="4" strokeLinecap="round" />

                    <circle cx="70" cy="115" r="15" fill="#388e3c" />
                    <circle cx="125" cy="105" r="16" fill="#388e3c" />
                    <circle cx="85" cy="88" r="14" fill="#4caf50" />
                    <circle cx="102" cy="95" r="18" fill="#4caf50" />
                  </g>
                )}

                {garden?.level === 4 && (
                  <g>
                    <path d="M 100 178 L 98 130 C 98 110 90 95 85 90" fill="none" stroke="#4e342e" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 99 130 C 102 110 112 95 120 85" fill="none" stroke="#4e342e" strokeWidth="10" strokeLinecap="round" />
                    <circle cx="75" cy="90" r="28" fill="#2e7d32" />
                    <circle cx="120" cy="85" r="26" fill="#2e7d32" />
                    <circle cx="100" cy="70" r="32" fill="#4caf50" />
                    <circle cx="82" cy="65" r="22" fill="#81c784" />
                    
                    <path d="M 100 50 L 102 55 L 107 55 L 103 58 L 105 63 L 100 60 L 95 63 L 97 58 L 93 55 L 98 55 Z" fill="#fff9c4" />
                    <path d="M 70 80 L 71 83 L 74 83 L 72 85 L 73 88 L 70 86 L 67 88 L 68 85 L 66 83 L 69 83 Z" fill="#fff9c4" />
                  </g>
                )}

                {garden?.level >= 5 && (
                  <g>
                    <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255, 182, 193, 0.2)" strokeWidth="6" strokeDasharray="5, 3" />
                    
                    <path d="M 100 178 L 98 120 C 98 100 85 85 75 75" fill="none" stroke="#3e2723" strokeWidth="15" strokeLinecap="round" />
                    <path d="M 99 120 C 102 100 115 85 130 75" fill="none" stroke="#3e2723" strokeWidth="12" strokeLinecap="round" />
                    
                    <circle cx="70" cy="75" r="32" fill="#ffb7b2" />
                    <circle cx="130" cy="70" r="30" fill="#ffb7b2" />
                    <circle cx="100" cy="55" r="35" fill="#ffc6ff" />
                    <circle cx="80" cy="45" r="24" fill="#ffd1dc" />
                    <circle cx="120" cy="48" r="24" fill="#ffd1dc" />
                    
                    <line x1="70" y1="88" x2="70" y2="105" stroke="#3e2723" strokeWidth="2" />
                    <rect x="65" y="105" width="10" height="15" rx="3" fill="#ffb703" stroke="#e07a5f" strokeWidth="1.5" />
                    <circle cx="70" cy="112" r="3" fill="#fff" />
                  </g>
                )}
              </motion.svg>

              <AnimatePresence>
                {isWatering && (
                  <div
                    style={{
                      position: "absolute",
                      top: "60px",
                      right: "40px",
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                      animate={{ opacity: 1, scale: 1, rotate: -35 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.5 }}
                      style={{ color: "#3a86c8" }}
                    >
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                        <path d="M7 10h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z" fill="#3a86c8" stroke="#1d4ed8" />
                        <path d="M21 14h2M12 10V6a2 2 0 0 0-2-2H8" stroke="#1d4ed8" />
                        <path d="M3 14H1l-1 2" stroke="#1d4ed8" />
                      </svg>
                    </motion.div>

                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, x: -30 }}
                        animate={{ opacity: [0, 1, 0], y: [10, 80], x: [-30 - (i * 5), -30 - (i * 8)] }}
                        transition={{ delay: i * 0.1, duration: 0.6, repeat: 1 }}
                        style={{
                          position: "absolute",
                          width: "4px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#3a86c8",
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ width: "100%", zIndex: 1, display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
              <motion.button
                whileHover={{ scale: (garden?.water_drops > 0 && !isWatering) ? 1.05 : 1 }}
                whileTap={{ scale: (garden?.water_drops > 0 && !isWatering) ? 0.95 : 1 }}
                onClick={handleWatering}
                disabled={!garden || garden.water_drops <= 0 || isWatering}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: (garden?.water_drops > 0 && !isWatering)
                    ? "linear-gradient(135deg, #3a86c8, #60a5fa)"
                    : "#cbd5e1",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: "900",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  cursor: (garden?.water_drops > 0 && !isWatering) ? "pointer" : "not-allowed",
                  boxShadow: (garden?.water_drops > 0 && !isWatering)
                    ? "0 8px 20px rgba(58, 134, 200, 0.25)"
                    : "none",
                  transition: "0.2s",
                }}
              >
                <Droplet size={20} fill={garden?.water_drops > 0 ? "white" : "transparent"} />
                {lang === "ar" ? "سقي الحديقة (استهلاك 1 قطرة) 💧" : "Water Garden (Spend 1 Drop) 💧"}
              </motion.button>
              
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textAlign: "center" }}>
                {lang === "ar" 
                  ? "💡 أكمل مهام المجموعة (+5 💧) أو تأمل شخصياً (+10 💧) لشحن مخزون الماء!" 
                  : "💡 Complete group tasks (+5 💧) or meditate individually (+10 💧) to earn water!"}
              </span>
            </div>
          </div>

          {/* Real-World Plant Care Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              padding: "24px",
              background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
              borderRadius: "24px",
              boxShadow: "0 8px 24px rgba(22, 163, 74, 0.05)",
              border: "1px solid #dcfce7",
              margin: "16px 4px 10px 4px",
              direction: lang === "ar" ? "rtl" : "ltr",
              textAlign: lang === "ar" ? "right" : "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: "#dcfce7",
                  color: "#16a34a",
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sprout size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#14532d" }}>
                  {lang === "ar" ? "🌿 رعاية نبتتك الحقيقية" : "🌿 Real-Life Plant Care"}
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#166534", fontWeight: "500" }}>
                  {lang === "ar" 
                    ? "اربط عاداتك الرقمية بالواقع! اسقِ نبتتك والتقط صورة لتكسب 3 نجوم لحسابك." 
                    : "Bridge digital & physical! Water your real plant, take a photo & earn 3 stars."}
                </p>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e8f5e9", margin: "4px 0" }} />

            {/* Alarm Configurator */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#14532d", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={16} />
                  {lang === "ar" ? "منبه السقي اليومي:" : "Daily Watering Alarm:"}
                </span>
                
                {/* Alarm Active Toggle */}
                <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={isAlarmActive}
                    onChange={(e) => {
                      const active = e.target.checked;
                      setIsAlarmActive(active);
                      localStorage.setItem(`real_plant_alarm_active_${group.id}_${user.uid}`, active ? "true" : "false");
                    }}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: "44px",
                      height: "24px",
                      borderRadius: "12px",
                      background: isAlarmActive ? "#22c55e" : "#cbd5e1",
                      position: "relative",
                      transition: "all 0.3s ease",
                      padding: "2px"
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        left: isAlarmActive ? "22px" : "2px",
                        top: "2px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </div>
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="time"
                  value={realPlantAlarm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRealPlantAlarm(val);
                    localStorage.setItem(`real_plant_alarm_${group.id}_${user.uid}`, val);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "14px",
                    border: "1px solid #bbf7d0",
                    background: "white",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#14532d",
                    outline: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}
                />
              </div>
              
              {isAlarmActive && realPlantAlarm && (
                <span style={{ fontSize: "11px", color: "#166534", fontWeight: "600" }}>
                  {lang === "ar" 
                    ? `⏰ سيقوم التطبيق بتنبيهك يومياً عند الساعة ${realPlantAlarm}` 
                    : `⏰ App will alert you daily at ${realPlantAlarm}`}
                </span>
              )}
            </div>

            {/* Photo Verification Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <input
                type="file"
                ref={realPlantFileInputRef}
                onChange={handleRealPlantUpload}
                accept="image/*"
                style={{ display: "none" }}
              />
              
              <motion.button
                whileHover={{ scale: !isUploadingRealPlant ? 1.02 : 1 }}
                whileTap={{ scale: !isUploadingRealPlant ? 0.98 : 1 }}
                onClick={() => realPlantFileInputRef.current.click()}
                disabled={isUploadingRealPlant}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  border: "none",
                  borderRadius: "18px",
                  fontWeight: "900",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isUploadingRealPlant ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 16px rgba(22, 163, 74, 0.2)",
                }}
              >
                {isUploadingRealPlant ? (
                  <span>...</span>
                ) : (
                  <>
                    <Camera size={18} />
                    {lang === "ar" ? "📸 إثبات سقي نبتتك الحقيقية (+3 ⭐)" : "📸 Prove Real Plant Watering (+3 ⭐)"}
                  </>
                )}
              </motion.button>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Star size={14} fill="#eab308" stroke="#eab308" />
                <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700" }}>
                  {lang === "ar" 
                    ? `رصيد النقاط الحالي: ${user?.points || 0} نقطة` 
                    : `Your current Points: ${user?.points || 0} points`}
                </span>
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {["tasks", "chat", "files"].includes(activeTab) && (
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
                  background: "linear-gradient(135deg, var(--primary-light), #4A8999)",
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
          <div style={{ position: "relative" }}>
            <AnimatePresence>
              {showUploadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  style={{
                    position: "absolute",
                    bottom: "60px",
                    left: lang === "ar" ? "auto" : "0",
                    right: lang === "ar" ? "0" : "auto",
                    background: "var(--bg-card)",
                    borderRadius: "16px",
                    padding: "8px",
                    boxShadow: "var(--shadow-md)",
                    display: "flex",
                    gap: "12px",
                    border: "1px solid var(--border)",
                    zIndex: 1001,
                  }}
                >
                  <button onClick={() => fileInputRef.current.click()} style={{ background: "var(--primary-pale)", border: "none", borderRadius: "12px", padding: "10px", color: "var(--primary)", cursor: "pointer" }}>
                    <ImageIcon size={20} />
                  </button>
                  <button onClick={() => fileInputRef.current.click()} style={{ background: "var(--primary-pale)", border: "none", borderRadius: "12px", padding: "10px", color: "var(--primary)", cursor: "pointer" }}>
                    <Paperclip size={20} />
                  </button>
                  <button 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    style={{ background: isRecording ? "#ff4757" : "var(--primary-pale)", border: "none", borderRadius: "12px", padding: "10px", color: isRecording ? "white" : "var(--primary)", cursor: "pointer" }}
                  >
                    <Mic size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={styles.inputGroup}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                style={{
                  background: showUploadMenu ? "var(--primary)" : "var(--primary-pale)",
                  border: "none",
                  borderRadius: "15px",
                  width: "42px",
                  height: "42px",
                  color: showUploadMenu ? "white" : "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={22} style={{ transform: showUploadMenu ? "rotate(45deg)" : "none", transition: "0.2s" }} />
              </motion.button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isInstruction ? (lang === "ar" ? "أرسل تعليمات..." : "Send instruction...") : (lang === "ar" ? "اكتب هنا..." : "Type here...")}
                style={{
                  ...styles.input,
                  background: isInstruction ? "rgba(255, 215, 0, 0.1)" : "var(--bg-app)",
                  border: isInstruction ? "1px solid #FFD700" : "1px solid var(--border)",
                }}
              />

              {isAdmin && !newMessage && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsInstruction(!isInstruction)}
                  style={{
                    background: isInstruction ? "#FFD700" : "var(--primary-pale)",
                    border: "none",
                    borderRadius: "15px",
                    width: "42px",
                    height: "42px",
                    color: isInstruction ? "white" : "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Award size={20} />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--accent))",
                  color: "white",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 15px rgba(255,255,255,0.1)",
                }}
              >
                <Send size={18} style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }} />
              </motion.button>
            </div>
          </div>
        )}
        {activeTab === "files" && (
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--primary-light)",
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
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* Alarm Trigger Dialog */}
      <AnimatePresence>
        {showAlarmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "white",
                padding: "30px 24px",
                borderRadius: "32px",
                width: "100%",
                maxWidth: "360px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                direction: lang === "ar" ? "rtl" : "ltr"
              }}
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -12, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                }}
              >
                <Bell size={36} fill="#ef4444" stroke="#ffffff" />
              </motion.div>

              <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#1e293b", margin: "0 0 10px 0" }}>
                {lang === "ar" ? "⏰ حان وقت سقي نبتتك!" : "⏰ Plant Watering Time!"}
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5", fontWeight: "500" }}>
                {lang === "ar" 
                  ? "قم بسقي نبتتك الحقيقية في الواقع الآن 🪴 ثم التقط صورة لها لتحصل على 3 نجوم لحسابك!"
                  : "Water your real plant now 🪴 then snap a photo to earn 3 stars for your account!"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => {
                    setShowAlarmDialog(false);
                    realPlantFileInputRef.current.click();
                  }}
                  style={{
                    padding: "14px",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white",
                    border: "none",
                    borderRadius: "16px",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
                  }}
                >
                  {lang === "ar" ? "📸 التقط صورة النبتة" : "📸 Take Photo"}
                </button>
                <button
                  onClick={() => setShowAlarmDialog(false)}
                  style={{
                    padding: "12px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    borderRadius: "16px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {lang === "ar" ? "تذكير لاحقاً" : "Remind Later"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stars Celebration Overlay */}
      <AnimatePresence>
        {showStarsCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(22, 163, 74, 0.15)",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", gap: "24px", position: "relative", marginBottom: "16px" }}>
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.2, y: 60 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.2, 1.4, 1.2, 0.5],
                    y: [-40, -180],
                    rotate: [0, idx === 1 ? 360 : idx === 0 ? -180 : 180]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: idx * 0.2,
                    ease: "easeOut",
                  }}
                  style={{
                    color: "#eab308",
                    filter: "drop-shadow(0 0 15px rgba(234, 179, 8, 0.8))"
                  }}
                >
                  <Star size={idx === 1 ? 80 : 55} fill="#eab308" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: "white",
                padding: "16px 28px",
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                border: "2px solid #bbf7d0",
                textAlign: "center"
              }}
            >
              <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#16a34a" }}>
                {lang === "ar" ? "🌟 حصلت على +3 نجوم! 🌟" : "🌟 Earned +3 Stars! 🌟"}
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#15803d", fontWeight: "700" }}>
                {lang === "ar" ? "أحسنت في العناية بنبتتك الحقيقية!" : "Great job caring for your real plant!"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

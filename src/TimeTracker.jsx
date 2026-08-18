import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Clock, BarChart2, Loader2, Calendar, Sun, ListTodo } from "lucide-react";

const formatDuration = (seconds) => {
  if (!seconds) return "0:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export function TimeTracker({ groups, user, lang }) {
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // { taskName, startedAt, elapsed }
  const [elapsed, setElapsed] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || "");
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const isRTL = lang === "ar";

  useEffect(() => {
    loadTimeLogs();
    // Check if there's an active timer stored
    const stored = localStorage.getItem("active_timer");
    if (stored) {
      const parsed = JSON.parse(stored);
      setActiveTimer(parsed);
      setTaskName(parsed.taskName);
      setElapsed(Math.floor((Date.now() - new Date(parsed.startedAt).getTime()) / 1000));
    }
  }, []);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  const loadTimeLogs = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { data } = await supabase
          .from("time_logs")
          .select("*")
          .eq("user_id", user.uid)
          .order("created_at", { ascending: false })
          .limit(50);
        if (data) {
          setTimeLogs(data);
          localStorage.setItem("time_logs_cache", JSON.stringify(data));
        }
      } else {
        const cached = localStorage.getItem("time_logs_cache");
        if (cached) setTimeLogs(JSON.parse(cached));
      }
    } catch (err) {
      const cached = localStorage.getItem("time_logs_cache");
      if (cached) setTimeLogs(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (!taskName.trim()) return;
    const timer = { taskName: taskName.trim(), startedAt: new Date().toISOString(), groupId: selectedGroup };
    setActiveTimer(timer);
    setElapsed(0);
    localStorage.setItem("active_timer", JSON.stringify(timer));
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const duration = elapsed;
    const endedAt = new Date().toISOString();
    clearInterval(timerRef.current);

    const log = {
      user_id: user.uid,
      user_name: user.name,
      task_id: null,
      started_at: activeTimer.startedAt,
      ended_at: endedAt,
      duration,
      note: activeTimer.taskName,
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    try {
      if (navigator.onLine) {
        const { data } = await supabase.from("time_logs").insert([log]).select().single();
        if (data) setTimeLogs((prev) => [data, ...prev]);
      } else {
        // Offline: save locally
        const localLog = { ...log, id: `local_${Date.now()}`, _offline: true };
        const cached = JSON.parse(localStorage.getItem("time_logs_cache") || "[]");
        cached.unshift(localLog);
        localStorage.setItem("time_logs_cache", JSON.stringify(cached));
        setTimeLogs((prev) => [localLog, ...prev]);
      }
    } catch (err) {
      console.warn("⚠️ Time log save error:", err.message);
    }

    setActiveTimer(null);
    setElapsed(0);
    setTaskName("");
    localStorage.removeItem("active_timer");
  };

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = timeLogs.filter((l) => l.created_at?.startsWith(today));
  const todaySeconds = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);

  const thisWeekLogs = timeLogs.filter((l) => {
    const d = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const weekSeconds = thisWeekLogs.reduce((sum, l) => sum + (l.duration || 0), 0);

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--enterprise-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={20} color="var(--enterprise-primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>
            {isRTL ? "تتبع الوقت" : "Time Tracker"}
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
            {isRTL ? "تتبع وقتك على المهام والمشاريع" : "Track your time on tasks and projects"}
          </p>
        </div>
      </div>

      {/* Timer Widget */}
      <div style={{
        background: activeTimer
          ? "linear-gradient(135deg, var(--enterprise-primary), var(--enterprise-secondary))"
          : "var(--bg-card)",
        borderRadius: 20,
        padding: "28px 24px",
        marginBottom: 20,
        border: activeTimer ? "none" : "1px solid var(--border)",
        boxShadow: activeTimer ? "0 8px 32px rgba(79,70,229,0.3)" : "var(--shadow)",
        transition: "all 0.4s ease",
      }}>
        {/* Timer display */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 48,
            fontWeight: 900,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 2,
            color: activeTimer ? "white" : "var(--text-main)",
            fontFamily: "monospace",
          }}>
            {formatDuration(elapsed)}
          </div>
          {activeTimer && (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
              {activeTimer.taskName}
            </p>
          )}
        </div>

        {/* Task input */}
        {!activeTimer && (
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder={isRTL ? "اسم المهمة أو المشروع..." : "Task or project name..."}
            onKeyDown={(e) => e.key === "Enter" && startTimer()}
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 12,
            }}
          />
        )}

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {activeTimer ? (
            <button
              onClick={stopTimer}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: 50, padding: "14px 36px",
                color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer",
              }}
            >
              <Square size={18} style={{ fill: "white" }} />
              {isRTL ? "إيقاف وحفظ" : "Stop & Save"}
            </button>
          ) : (
            <button
              onClick={startTimer}
              disabled={!taskName.trim()}
              className="btn-enterprise"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 40px", fontSize: 15, borderRadius: 50, opacity: taskName.trim() ? 1 : 0.5 }}
            >
              <Play size={18} style={{ fill: "white" }} />
              {isRTL ? "ابدأ التتبع" : "Start Timer"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: isRTL ? "اليوم" : "Today", value: formatDuration(todaySeconds), icon: <Sun size={20} color="var(--enterprise-primary)" /> },
          { label: isRTL ? "هذا الأسبوع" : "This Week", value: formatDuration(weekSeconds), icon: <Calendar size={20} color="var(--enterprise-primary)" /> },
          { label: isRTL ? "إجمالي السجلات" : "Total Logs", value: timeLogs.length, icon: <ListTodo size={20} color="var(--enterprise-primary)" /> },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "16px 14px", border: "1px solid var(--border)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--enterprise-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log History */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ListTodo size={16} color="var(--text-main)" />
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            {isRTL ? "سجل الوقت" : "Time Log"}
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-dim)" }}>
            <Loader2 size={28} className="spinner" />
          </div>
        ) : timeLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-dim)", background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)" }}>
            <Clock size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>{isRTL ? "لا توجد سجلات بعد" : "No time logs yet"}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {timeLogs.slice(0, 20).map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "var(--bg-card)", borderRadius: 12, padding: "12px 16px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--enterprise-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={16} color="var(--enterprise-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.note || (isRTL ? "مهمة غير مسماة" : "Unnamed task")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-dim)" }}>
                      {new Date(log.created_at).toLocaleDateString()} {log._offline ? "• 📴 offline" : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--enterprise-primary)", fontFamily: "monospace", flexShrink: 0 }}>
                    {formatDuration(log.duration)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeTracker;

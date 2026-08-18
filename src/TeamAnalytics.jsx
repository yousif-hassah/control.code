import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Users, CheckCircle2, Clock, Award, Loader2 } from "lucide-react";

function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        padding: "20px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -10, right: -10,
        width: 80, height: 80, borderRadius: "50%",
        background: color + "12",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { size: 20, color })}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginTop: 4 }}>{label}</div>
      {subtitle && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{subtitle}</div>}
    </motion.div>
  );
}

function BarChartCss({ data, maxVal, color, lang }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, padding: "0 4px" }}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)" }}>{item.value}</div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(pct, 4)}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              style={{ width: "100%", background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: "4px 4px 0 0", minHeight: 4 }}
            />
            <div style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function TeamAnalytics({ groups, user, lang }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRTL = lang === "ar";

  useEffect(() => { loadStats(); }, [groups]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const groupIds = groups.map((g) => g.id).filter(Boolean);

      if (!navigator.onLine || groupIds.length === 0) {
        const cached = localStorage.getItem("team_analytics_cache");
        if (cached) setStats(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // Fetch kanban tasks
      let allTasks = [];
      let allBoards = [];
      for (const gid of groupIds) {
        const { data: boards } = await supabase.from("kanban_boards").select("id").eq("group_id", gid);
        if (boards && boards.length > 0) {
          allBoards.push(...boards);
          const boardIds = boards.map((b) => b.id);
          const { data: tasks } = await supabase.from("kanban_tasks").select("*").in("board_id", boardIds);
          if (tasks) allTasks.push(...tasks);
        }
      }

      // Fetch group members count
      let memberCount = 0;
      if (groupIds.length > 0) {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .in("group_id", groupIds);
        memberCount = count || 0;
      }

      // Fetch wiki pages count
      let wikiCount = 0;
      if (groupIds.length > 0) {
        const { count } = await supabase
          .from("wiki_pages")
          .select("*", { count: "exact", head: true })
          .in("group_id", groupIds);
        wikiCount = count || 0;
      }

      // Calculate stats
      const totalTasks = allTasks.length;
      const doneTasks = allTasks.filter((t) => t.status === "done").length;
      const inProgressTasks = allTasks.filter((t) => t.status === "inprogress").length;
      const successRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Tasks by assignee
      const assigneeMap = {};
      allTasks.forEach((t) => {
        if (t.assigned_name) {
          assigneeMap[t.assigned_name] = (assigneeMap[t.assigned_name] || 0) + 1;
        }
      });
      const topAssignees = Object.entries(assigneeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ label: name.split(" ")[0], value: count }));

      // Tasks by priority
      const priorityCounts = {
        urgent: allTasks.filter((t) => t.priority === "urgent").length,
        high:   allTasks.filter((t) => t.priority === "high").length,
        medium: allTasks.filter((t) => t.priority === "medium").length,
        low:    allTasks.filter((t) => t.priority === "low").length,
      };

      // Tasks created in last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const tasksPerDay = last7Days.map((date) => ({
        label: new Date(date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short" }),
        value: allTasks.filter((t) => t.created_at?.startsWith(date)).length,
      }));

      const result = {
        totalTasks, doneTasks, inProgressTasks, successRate,
        memberCount, wikiCount, topAssignees, priorityCounts, tasksPerDay,
        groupCount: groups.length,
      };

      setStats(result);
      localStorage.setItem("team_analytics_cache", JSON.stringify(result));
    } catch (err) {
      console.warn("⚠️ Analytics error:", err.message);
      const cached = localStorage.getItem("team_analytics_cache");
      if (cached) setStats(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>
        <Loader2 size={40} className="spinner" style={{ marginBottom: 16 }} />
        <p>{isRTL ? "جاري تحليل البيانات..." : "Analyzing data..."}</p>
      </div>
    );
  }

  if (!stats) return null;

  const maxTasksPerDay = Math.max(...(stats.tasksPerDay?.map((d) => d.value) || [1]), 1);

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--enterprise-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart2 size={20} color="var(--enterprise-primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>
            {isRTL ? "تحليلات الفريق" : "Team Analytics"}
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
            {isRTL ? "نظرة شاملة على أداء الفريق" : "A complete overview of team performance"}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon={<CheckCircle2 />} label={isRTL ? "مهام منتهية" : "Done Tasks"}
          value={stats.doneTasks} color="#10b981" subtitle={`/ ${stats.totalTasks} total`} />
        <StatCard icon={<TrendingUp />} label={isRTL ? "معدل الإنجاز" : "Success Rate"}
          value={`${stats.successRate}%`} color="#4F46E5" />
        <StatCard icon={<Clock />} label={isRTL ? "قيد التنفيذ" : "In Progress"}
          value={stats.inProgressTasks} color="#f59e0b" />
        <StatCard icon={<Users />} label={isRTL ? "أعضاء الفريق" : "Team Members"}
          value={stats.memberCount} color="#8b5cf6" />
        <StatCard icon={<BarChart2 />} label={isRTL ? "صفحات الويكي" : "Wiki Pages"}
          value={stats.wikiCount} color="#06b6d4" />
        <StatCard icon={<Award />} label={isRTL ? "مجموعات" : "Groups"}
          value={stats.groupCount} color="#ec4899" />
      </div>

      {/* Charts Row */}
      <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Activity Chart */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color="var(--enterprise-primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
              {isRTL ? "نشاط آخر 7 أيام" : "Last 7 Days Activity"}
            </h3>
          </div>
          <BarChartCss data={stats.tasksPerDay} maxVal={maxTasksPerDay} color="#4F46E5" lang={lang} />
        </div>

        {/* Priority breakdown */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CheckCircle2 size={16} color="var(--enterprise-primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
              {isRTL ? "توزيع الأولويات" : "Priority Breakdown"}
            </h3>
          </div>
          {[
            { key: "urgent", label: isRTL ? "عاجل" : "Urgent", color: "#ef4444" },
            { key: "high",   label: isRTL ? "عالية" : "High",   color: "#f97316" },
            { key: "medium", label: isRTL ? "متوسطة" : "Medium", color: "#eab308" },
            { key: "low",    label: isRTL ? "منخفضة" : "Low",   color: "#22c55e" },
          ].map(({ key, label, color }) => {
            const count = stats.priorityCounts[key] || 0;
            const pct = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>{label}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 10, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ height: "100%", background: color, borderRadius: 10 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Assignees */}
      {stats.topAssignees?.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Award size={16} color="var(--enterprise-primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
              {isRTL ? "أكثر الأعضاء نشاطاً" : "Most Active Members"}
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.topAssignees.map((a, i) => {
              const pct = stats.topAssignees[0].value > 0 ? (a.value / stats.topAssignees[0].value) * 100 : 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "var(--enterprise-primary)" : "var(--bg-subtle)", color: i === 0 ? "#fff" : "var(--text-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{a.label}</span>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>{a.value} {isRTL ? "مهمة" : "tasks"}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 10, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.5 }}
                        style={{ height: "100%", background: "linear-gradient(90deg, var(--enterprise-primary), var(--enterprise-secondary))", borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamAnalytics;

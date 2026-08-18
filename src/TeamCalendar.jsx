import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, Clock, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { dbGetAll, dbPut, STORES, offlineCreate, offlineDelete } from "./lib/offlineDB";

const EVENT_TYPES = {
  meeting:   { label: { en: "Meeting",   ar: "اجتماع"    }, color: "#4F46E5" },
  deadline:  { label: { en: "Deadline",  ar: "موعد نهائي" }, color: "#ef4444" },
  milestone: { label: { en: "Milestone", ar: "إنجاز"      }, color: "#10b981" },
  reminder:  { label: { en: "Reminder",  ar: "تذكير"      }, color: "#f59e0b" },
};

const DAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["أحد", "اثن", "ثلا", "أرب", "خمس", "جمع", "سبت"],
};

const MONTHS = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  ar: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
};

function EventModal({ event, lang, groups, onSave, onClose }) {
  const isRTL = lang === "ar";
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "meeting",
    start_date: event?.start_date || new Date().toISOString().split("T")[0],
    end_date: event?.end_date || "",
    start_time: event?.start_time || "",
    color: event?.color || "#4F46E5",
    group_id: event?.group_id || groups[0]?.id || "",
  });

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal-card"
        style={{ maxWidth: 440, direction: isRTL ? "rtl" : "ltr" }}
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>{isRTL ? "إضافة حدث" : "Add Event"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isRTL ? "عنوان الحدث *" : "Event title *"} style={{ padding: "12px 14px", fontWeight: 600 }} autoFocus />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontFamily: "inherit", fontSize: 13 }}>
              {Object.entries(EVENT_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label[lang]}</option>
              ))}
            </select>
            {groups.length > 1 && (
              <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontFamily: "inherit", fontSize: 13 }}>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                {isRTL ? "تاريخ البدء" : "Start Date"}
              </label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                style={{ padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                {isRTL ? "الوقت" : "Time"}
              </label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                style={{ padding: "10px 12px" }} />
            </div>
          </div>

          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={isRTL ? "وصف اختياري..." : "Optional description..."} rows={2}
            style={{ padding: "10px 12px", resize: "none" }} />

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button className="btn-enterprise" style={{ flex: 2 }} onClick={() => form.title.trim() && onSave(form)}>
              {isRTL ? "إضافة الحدث" : "Add Event"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TeamCalendar({ groups, user, lang }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isRTL = lang === "ar";

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const groupIds = groups.map((g) => g.id).filter(Boolean);
      if (groupIds.length === 0) { setLoading(false); return; }

      if (navigator.onLine) {
        const { data } = await supabase
          .from("team_events")
          .select("*")
          .in("group_id", groupIds)
          .order("start_date", { ascending: true });
        if (data) {
          setEvents(data);
          for (const e of data) await dbPut(STORES.teamEvents, e);
        }
      } else {
        const cached = [];
        for (const gid of groupIds) {
          const evs = await dbGetAll(STORES.teamEvents, "group_id", gid);
          cached.push(...evs);
        }
        setEvents(cached);
      }
    } catch (err) {
      console.warn("⚠️ Events load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (formData) => {
    const event = await offlineCreate(supabase, "team_events", STORES.teamEvents, {
      ...formData,
      created_by: user.uid,
    }, user.uid);
    setEvents((prev) => [...prev, event]);
    setShowModal(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.start_date === dateStr);
  };

  const upcomingEvents = events
    .filter((e) => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5);

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--enterprise-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={20} color="var(--enterprise-primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>
              {isRTL ? "تقويم الفريق" : "Team Calendar"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
              {events.length} {isRTL ? "حدث" : "events"}
            </p>
          </div>
        </div>
        <button className="btn-enterprise" onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13 }}>
          <Plus size={16} /> {isRTL ? "حدث جديد" : "New Event"}
        </button>
      </div>

      <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Calendar Grid */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))}
              style={{ background: "var(--bg-subtle)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-main)" }}>
              {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
              {MONTHS[lang][month]} {year}
            </h3>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))}
              style={{ background: "var(--bg-subtle)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-main)" }}>
              {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS[lang].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === today;
              const isSelected = selectedDate === dateStr;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 52,
                    padding: "4px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected ? "var(--enterprise-primary-pale)" : "transparent",
                    border: isSelected ? "1px solid var(--enterprise-primary)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: isToday ? "var(--enterprise-primary)" : "transparent",
                    color: isToday ? "white" : "var(--text-main)",
                    fontSize: 12, fontWeight: isToday ? 800 : 500,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 4px auto",
                  }}>
                    {day}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dayEvents.slice(0, 2).map((ev) => {
                      const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.meeting;
                      return (
                        <div key={ev.id} style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 4px", borderRadius: 4,
                          background: cfg.color + "20", color: cfg.color,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 700, textAlign: "center" }}>
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} color="var(--enterprise-primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
              {isRTL ? "الأحداث القادمة" : "Upcoming Events"}
            </h3>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-dim)" }}>
              <Loader2 size={24} className="spinner" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-dim)", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <Calendar size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 12 }}>{isRTL ? "لا توجد أحداث قادمة" : "No upcoming events"}</p>
            </div>
          ) : upcomingEvents.map((ev) => {
            const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.meeting;
            return (
              <motion.div key={ev.id} whileHover={{ x: 2 }} style={{
                background: "var(--bg-card)", borderRadius: 12, padding: "12px 14px",
                border: "1px solid var(--border)", borderLeft: isRTL ? undefined : `3px solid ${cfg.color}`,
                borderRight: isRTL ? `3px solid ${cfg.color}` : undefined,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{ev.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-dim)" }}>
                      {ev.start_date} {ev.start_time && `• ${ev.start_time}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Legend */}
          <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", marginTop: 4 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
              {isRTL ? "أنواع الأحداث" : "Event Types"}
            </p>
            {Object.entries(EVENT_TYPES).map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: val.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 600 }}>{val.label[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <EventModal lang={lang} groups={groups} onSave={handleSaveEvent} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeamCalendar;

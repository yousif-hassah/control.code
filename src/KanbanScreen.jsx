import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, X, Clock, AlertCircle,
  CheckCircle2, User, Calendar, Tag, MoreHorizontal,
  ChevronDown, Flag, Loader2, KanbanSquare
} from "lucide-react";
import { dbGetAll, dbPut, dbDelete, STORES, offlineCreate, offlineUpdate, offlineDelete } from "./lib/offlineDB";

const PRIORITY_CONFIG = {
  urgent: { label: { en: "Urgent", ar: "عاجل" }, color: "#ef4444" },
  high:   { label: { en: "High", ar: "عالية" }, color: "#f97316" },
  medium: { label: { en: "Medium", ar: "متوسطة" }, color: "#eab308" },
  low:    { label: { en: "Low", ar: "منخفضة" }, color: "#22c55e" },
};

const DEFAULT_COLUMNS = [
  { id: "todo",       name: { en: "To Do",       ar: "قيد الانتظار" }, color: "#6366f1" },
  { id: "inprogress", name: { en: "In Progress",  ar: "جاري العمل"  }, color: "#f59e0b" },
  { id: "review",     name: { en: "Review",       ar: "للمراجعة"    }, color: "#8b5cf6" },
  { id: "done",       name: { en: "Done",         ar: "منتهي"       }, color: "#10b981" },
];

function TaskCard({ task, lang, onEdit, onDelete, onMove, columns }) {
  const [showMenu, setShowMenu] = useState(false);
  const isRTL = lang === "ar";
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        border: `1px solid var(--border)`,
        boxShadow: "var(--shadow)",
        cursor: "pointer",
        position: "relative",
        borderLeft: isRTL ? undefined : `3px solid ${priority.color}`,
        borderRight: isRTL ? `3px solid ${priority.color}` : undefined,
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-main)", flex: 1, lineHeight: 1.4 }}>
          {task.title}
        </p>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 2, borderRadius: 4 }}
          >
            <MoreHorizontal size={14} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  position: "absolute",
                  top: 24,
                  right: isRTL ? undefined : 0,
                  left: isRTL ? 0 : undefined,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  boxShadow: "var(--shadow-md)",
                  zIndex: 100,
                  minWidth: 140,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", padding: "4px 8px", textTransform: "uppercase" }}>
                    {isRTL ? "نقل إلى" : "Move to"}
                  </div>
                  {columns.filter(c => c.id !== task.status).map(col => (
                    <button
                      key={col.id}
                      onClick={() => { onMove(task.id, col.id); setShowMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        background: "none", border: "none", cursor: "pointer",
                        padding: "8px 10px", fontSize: 12, fontWeight: 600,
                        color: "var(--text-main)", borderRadius: 6, textAlign: "left",
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                      {col.name[lang] || col.name.en}
                    </button>
                  ))}
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" }} />
                  <button
                    onClick={() => { onEdit(task); setShowMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "8px 10px", fontSize: 12, color: "var(--text-main)", borderRadius: 6 }}
                  >
                    <Edit2 size={12} /> {isRTL ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "8px 10px", fontSize: 12, color: "#ef4444", borderRadius: 6 }}
                  >
                    <Trash2 size={12} /> {isRTL ? "حذف" : "Delete"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: priority.color + "20", color: priority.color }}>
          {priority.icon} {priority.label[lang]}
        </span>
        {task.assigned_name && (
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--enterprise-primary-pale)", color: "var(--enterprise-primary)", fontWeight: 600 }}>
            <User size={9} style={{ display: "inline", marginRight: 3 }} />
            {task.assigned_name}
          </span>
        )}
        {task.due_date && (
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: isOverdue ? "#ef444420" : "var(--bg-subtle)", color: isOverdue ? "#ef4444" : "var(--text-dim)", fontWeight: 600 }}>
            <Calendar size={9} style={{ display: "inline", marginRight: 3 }} />
            {task.due_date}
          </span>
        )}
      </div>

      {showMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
      )}
    </motion.div>
  );
}

function KanbanColumn({ column, tasks, lang, onAddTask, onEditTask, onDeleteTask, onMoveTask, allColumns }) {
  const isRTL = lang === "ar";
  return (
    <div
      className="kanban-column"
      style={{
        minWidth: 260,
        maxWidth: 280,
        background: "var(--bg-subtle)",
        borderRadius: 14,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        maxHeight: "calc(100vh - 220px)",
        flexShrink: 0,
      }}
    >
      {/* Column Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 10px", borderBottom: `2px solid ${column.color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: column.color, display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
            {column.name[lang] || column.name.en}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: column.color + "25", color: column.color }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          style={{ background: "none", border: "none", cursor: "pointer", color: column.color, padding: 4, borderRadius: 6 }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tasks */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              lang={lang}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
              columns={allColumns}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(column.id)}
            style={{
              border: `2px dashed ${column.color}40`,
              borderRadius: 10,
              padding: "20px 12px",
              textAlign: "center",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontSize: 12,
              transition: "all 0.2s",
            }}
          >
            <Plus size={20} style={{ color: column.color, marginBottom: 4 }} />
            <p style={{ margin: 0 }}>{isRTL ? "أضف مهمة" : "Add a task"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, columns, lang, groupMembers, onSave, onClose }) {
  const isRTL = lang === "ar";
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || columns[0]?.id || "todo",
    due_date: task?.due_date || "",
    assigned_name: task?.assigned_name || "",
  });

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-card"
        style={{ maxWidth: 480, direction: isRTL ? "rtl" : "ltr" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>
            {task ? (isRTL ? "تعديل المهمة" : "Edit Task") : (isRTL ? "مهمة جديدة" : "New Task")}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={isRTL ? "عنوان المهمة *" : "Task title *"}
            style={{ padding: "12px 14px", fontWeight: 600 }}
            autoFocus
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={isRTL ? "وصف (اختياري)" : "Description (optional)"}
            rows={3}
            style={{ padding: "12px 14px", resize: "vertical" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontFamily: "inherit", fontSize: 13 }}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label[lang]}</option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)", fontFamily: "inherit", fontSize: 13 }}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>{col.name[lang] || col.name.en}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              style={{ padding: "10px 12px" }}
            />
            <input
              value={form.assigned_name}
              onChange={(e) => setForm({ ...form, assigned_name: e.target.value })}
              placeholder={isRTL ? "اسم المكلف" : "Assignee name"}
              style={{ padding: "10px 12px" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              className="btn-enterprise"
              style={{ flex: 2 }}
              onClick={() => form.title.trim() && onSave(form)}
            >
              {isRTL ? "حفظ المهمة" : "Save Task"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function KanbanScreen({ group, user, lang, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState("todo");
  const isRTL = lang === "ar";

  const columns = DEFAULT_COLUMNS;

  useEffect(() => {
    loadTasks();
  }, [group?.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // First try to load cached board
      let boardId = localStorage.getItem(`kanban_board_${group.id}`);

      if (navigator.onLine) {
        // Get or create board
        let { data: board } = await supabase
          .from("kanban_boards")
          .select("id")
          .eq("group_id", group.id)
          .maybeSingle();

        if (!board) {
          const { data: newBoard } = await supabase
            .from("kanban_boards")
            .insert([{ group_id: group.id, name: group.name, created_by: user.uid }])
            .select()
            .single();
          board = newBoard;
        }

        if (board) {
          boardId = board.id;
          localStorage.setItem(`kanban_board_${group.id}`, boardId);

          const { data: taskData } = await supabase
            .from("kanban_tasks")
            .select("*")
            .eq("board_id", boardId)
            .order("sort_order", { ascending: true });

          if (taskData) {
            setTasks(taskData);
            for (const t of taskData) await dbPut(STORES.kanbanTasks, t);
          }
        }
      } else {
        // Load from IndexedDB
        if (boardId) {
          const cached = await dbGetAll(STORES.kanbanTasks, "board_id", boardId);
          setTasks(cached);
        }
      }
    } catch (err) {
      console.warn("⚠️ Kanban load error:", err.message);
      const boardId = localStorage.getItem(`kanban_board_${group.id}`);
      if (boardId) {
        const cached = await dbGetAll(STORES.kanbanTasks, "board_id", boardId);
        setTasks(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (formData) => {
    const boardId = localStorage.getItem(`kanban_board_${group.id}`);
    if (!boardId) return;

    if (editingTask) {
      const updated = await offlineUpdate(supabase, "kanban_tasks", STORES.kanbanTasks, editingTask.id, { ...formData, updated_at: new Date().toISOString() }, user.uid);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...formData } : t)));
    } else {
      const newTask = await offlineCreate(supabase, "kanban_tasks", STORES.kanbanTasks, {
        ...formData,
        board_id: boardId,
        created_by: user.uid,
        sort_order: tasks.filter((t) => t.status === formData.status).length,
      }, user.uid);
      setTasks((prev) => [...prev, newTask]);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm(isRTL ? "حذف هذه المهمة؟" : "Delete this task?")) return;
    await offlineDelete(supabase, "kanban_tasks", STORES.kanbanTasks, id, user.uid);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMoveTask = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await offlineUpdate(supabase, "kanban_tasks", STORES.kanbanTasks, taskId, { status: newStatus }, user.uid);
  };

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "var(--enterprise-primary-pale)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <KanbanSquare size={20} color="var(--enterprise-primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "var(--text-main)" }}>
              {isRTL ? "لوحة المشروع" : "Project Board"}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-dim)" }}>
              {group.name} • {tasks.length} {isRTL ? "مهمة" : "tasks"}
            </p>
          </div>
        </div>
        <button
          className="btn-enterprise"
          onClick={() => { setEditingTask(null); setDefaultColumn("todo"); setShowModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13 }}
        >
          <Plus size={16} />
          {isRTL ? "مهمة جديدة" : "New Task"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {columns.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length;
          return (
            <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: col.color + "15", border: `1px solid ${col.color}30` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: col.color }}>{col.name[lang] || col.name.en}: {count}</span>
            </div>
          );
        })}
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
          <Loader2 size={32} className="spinner" style={{ marginBottom: 8 }} />
          <p>{isRTL ? "جاري التحميل..." : "Loading board..."}</p>
        </div>
      ) : (
        <div className="kanban-board-container" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks.filter((t) => t.status === col.id)}
              lang={lang}
              onAddTask={(colId) => { setEditingTask(null); setDefaultColumn(colId); setShowModal(true); }}
              onEditTask={(task) => { setEditingTask(task); setShowModal(true); }}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              allColumns={columns}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <TaskModal
            task={editingTask ? editingTask : { status: defaultColumn }}
            columns={columns}
            lang={lang}
            onSave={handleSaveTask}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default KanbanScreen;

import React, { useState, useEffect } from "react";
import { Users, Plus, LogIn, ChevronLeft, Copy, Check, Hash, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { GroupDetailScreen } from "./GroupDetailScreen";
import { motion, AnimatePresence } from "framer-motion";

export function GroupsScreen({ t, lang, setScreen, user }) {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (user?.uid) fetchUserGroups();
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user.uid);

      if (memberError || !memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberData.map((m) => m.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, code, created_at")
        .in("id", groupIds);

      if (groupsError) return;

      const mapped = (groupsData || []).map((g) => ({
        ...g,
        role: memberData.find((m) => m.group_id === g.id)?.role || "member",
      }));

      setGroups(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert([{ name: newGroupName, code: groupCode, created_by: user.uid }])
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase
        .from("group_members")
        .insert([{ group_id: newGroup.id, user_id: user.uid, role: "admin" }]);

      setNewGroupName("");
      setShowCreateModal(false);
      fetchUserGroups();
    } catch (error) {
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("code", joinCode.trim().toUpperCase())
        .maybeSingle();

      if (!group) {
        alert(lang === "ar" ? "رمز غير صحيح" : "Invalid code");
        return;
      }

      const { data: existingMember } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id)
        .eq("user_id", user.uid)
        .maybeSingle();

      if (existingMember) {
        alert(lang === "ar" ? "أنت عضو بالفعل" : "Already a member");
        setShowJoinModal(false);
        return;
      }

      await supabase
        .from("group_members")
        .insert([{ group_id: group.id, user_id: user.uid, role: "member" }]);

      setJoinCode("");
      setShowJoinModal(false);
      fetchUserGroups();
    } catch (error) {
      alert("Error joining group");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isRTL = lang === "ar";

  return (
    <div className={`groups-container ${isRTL ? "rtl" : ""}`} style={{ minHeight: "100%" }}>
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="nav-icon-btn" onClick={() => setScreen("home")}>
            <ChevronLeft size={20} style={{ transform: isRTL ? "rotate(180deg)" : "none" }} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>
            {isRTL ? "المجموعات" : "Groups"}
          </h1>
        </div>
        <button className="icon-btn" onClick={() => setShowCreateModal(true)} style={{ background: "var(--primary)", color: "white", border: "none" }}>
          <Plus size={20} />
        </button>
      </div>

      <p style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "24px" }}>
        {isRTL ? "تعاون مع فريقك في مكان واحد" : "Collaborate with your team in one place"}
      </p>

      {/* Join Box */}
      <div 
        className="card" 
        onClick={() => setShowJoinModal(true)}
        style={{ 
          background: "linear-gradient(135deg, var(--primary-pale), white)",
          border: "2px dashed var(--primary-light)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px"
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
          <LogIn size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>{isRTL ? "انضم لمجموعة" : "Join Group"}</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-dim)" }}>{isRTL ? "أدخل الكود الخاص بفريقك" : "Enter your team's unique code"}</p>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: "32px" }}>
        <h2>{isRTL ? "مجموعاتك" : "Your Groups"}</h2>
        <span className="badge">{groups.length}</span>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)" }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
          <p>{isRTL ? "لا توجد مجموعات بعد" : "No groups yet"}</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              layoutId={group.id}
              onClick={() => setSelectedGroup(group)}
              className="card"
              style={{ position: "relative", overflow: "hidden" }}
              whileHover={{ y: -4 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: group.role === "admin" ? "var(--primary)" : "var(--primary-pale)", color: group.role === "admin" ? "white" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} />
                </div>
                <span style={{ 
                  fontSize: "10px", 
                  fontWeight: "800", 
                  padding: "4px 8px", 
                  borderRadius: "20px",
                  background: group.role === "admin" ? "rgba(46, 125, 50, 0.1)" : "rgba(21, 101, 192, 0.1)",
                  color: group.role === "admin" ? "#2e7d32" : "#1565c0"
                }}>
                  {group.role === "admin" ? (isRTL ? "مشرف" : "Admin") : (isRTL ? "عضو" : "Member")}
                </span>
              </div>
              
              <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{group.name}</h3>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
                <div 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(group.code, group.id); }}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    background: "var(--bg-app)", 
                    padding: "6px 10px", 
                    borderRadius: "10px",
                    cursor: "copy"
                  }}
                >
                  <Hash size={12} color="var(--primary-light)" />
                  <span style={{ fontSize: "12px", fontWeight: "700", fontFamily: "monospace" }}>{group.code}</span>
                  {copiedId === group.id ? <Check size={12} color="#4ade80" /> : <Copy size={12} color="var(--text-dim)" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={14} color="var(--accent)" />
                  <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "600" }}>{isRTL ? "نشط" : "Active"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || showJoinModal) && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }}
          >
            <motion.div 
              className="modal-card"
              onClick={e => e.stopPropagation()}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
            >
              <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 10, margin: "0 auto 20px" }} />
              <h2 style={{ marginBottom: "8px" }}>
                {showCreateModal ? (isRTL ? "إنشاء مجموعة جديدة" : "Create New Group") : (isRTL ? "انضم لفريق" : "Join a Team")}
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "24px" }}>
                {showCreateModal ? (isRTL ? "ابدأ مساحة تعاون خاصة بك" : "Start your own collaboration space") : (isRTL ? "أدخل الكود المكون من 6 أرقام" : "Enter the 6-digit invitation code")}
              </p>

              <input
                type="text"
                autoFocus
                value={showCreateModal ? newGroupName : joinCode}
                onChange={(e) => showCreateModal ? setNewGroupName(e.target.value) : setJoinCode(e.target.value.toUpperCase())}
                placeholder={showCreateModal ? (isRTL ? "اسم المجموعة..." : "Group Name...") : "ABCDEF"}
                style={{ marginBottom: "24px", fontSize: "16px", padding: "16px", textAlign: showJoinModal ? "center" : (isRTL ? "right" : "left"), letterSpacing: showJoinModal ? "4px" : "normal", fontWeight: showJoinModal ? "800" : "500" }}
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button className="btn-primary" style={{ flex: 1.5 }} onClick={showCreateModal ? createGroup : joinGroup} disabled={loading}>
                  {loading ? "..." : (isRTL ? "تأكيد" : "Confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedGroup && (
        <div className="group-detail-overlay" style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 2000, 
          background: "var(--bg-app)",
          overflowY: "auto",
          padding: "20px 16px 80px",
        }}>
          <GroupDetailScreen
            group={selectedGroup}
            user={user}
            lang={lang}
            onClose={() => setSelectedGroup(null)}
          />
        </div>
      )}
    </div>
  );
}

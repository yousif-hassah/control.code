import React, { useState, useEffect } from "react";
import { Users, Plus, LogIn, ChevronLeft, Copy, Check } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { GroupDetailScreen } from "./GroupDetailScreen";

export function GroupsScreen({ t, lang, setScreen, user }) {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.uid) fetchUserGroups();
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`role, groups (id, name, code, created_at)`)
        .eq("user_id", user.uid);
      if (error) throw error;
      setGroups(
        data?.map((item) => ({ ...item.groups, role: item.role })) || [],
      );
    } catch (error) {
      console.error("Error fetching groups:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const groupCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
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
      console.error("Error creating group:", error);
      const errorMsg =
        lang === "en"
          ? "Failed to create group. Check console for details."
          : "فشل إنشاء المجموعة. تحقق من Console للتفاصيل.";
      alert(errorMsg);
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
        .eq("code", joinCode.toUpperCase())
        .single();
      if (groupError || !group) {
        alert("Invalid code");
        return;
      }
      await supabase
        .from("group_members")
        .insert([{ group_id: group.id, user_id: user.uid, role: "member" }]);
      setJoinCode("");
      setShowJoinModal(false);
      fetchUserGroups();
    } catch (error) {
      console.error("Join Group Error:", error);
      alert(
        lang === "en"
          ? `Error joining group: ${error.message || "Unknown error"}`
          : `خطأ أثناء الانضمام: ${error.message || "خطأ غير معروف"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="groups-screen-container"
      style={{
        padding: "16px",
        paddingBottom: "100px",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setScreen("home")}
          style={{
            background: "#f0f0f0",
            border: "none",
            borderRadius: "12px",
            padding: "10px",
          }}
        >
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          {lang === "en" ? "Groups" : "المجموعات"}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "#629FAD",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "10px",
          }}
        >
          <Plus size={24} />
        </button>
      </header>

      <button
        onClick={() => setShowJoinModal(true)}
        style={{
          width: "100%",
          padding: "14px",
          background: "white",
          border: "1px dashed #629FAD",
          color: "#629FAD",
          borderRadius: "15px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        <LogIn size={20} /> {lang === "en" ? "Join Group" : "انضم لمجموعة"}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
        {groups.map((group) => (
          <div
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            style={{
              padding: "16px",
              background: "white",
              borderRadius: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #f0f0f0",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "17px", color: "#333" }}>
                {group.name}
              </h3>
              <span
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  background: group.role === "admin" ? "#E8F5E9" : "#E3F2FD",
                  color: group.role === "admin" ? "#2E7D32" : "#1565C0",
                  borderRadius: "8px",
                  fontWeight: "600",
                }}
              >
                {group.role === "admin"
                  ? lang === "en"
                    ? "Admin"
                    : "مشرف"
                  : lang === "en"
                    ? "Member"
                    : "عضو"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#888",
                fontSize: "12px",
              }}
            >
              <span>
                {lang === "en" ? "Code:" : "الكود:"} {group.code}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Modals */}
      {(showCreateModal || showJoinModal) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>
              {showCreateModal
                ? lang === "en"
                  ? "Create Group"
                  : "إنشاء مجموعة"
                : lang === "en"
                  ? "Join Group"
                  : "انضمام"}
            </h2>
            <input
              type="text"
              value={showCreateModal ? newGroupName : joinCode}
              onChange={(e) =>
                showCreateModal
                  ? setNewGroupName(e.target.value)
                  : setJoinCode(e.target.value.toUpperCase())
              }
              placeholder="..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #eee",
                background: "#f9f9f9",
                marginBottom: "20px",
                fontSize: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowJoinModal(false);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#f0f0f0",
                  color: "#666",
                }}
              >
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
              <button
                onClick={showCreateModal ? createGroup : joinGroup}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#629FAD",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {loading ? "..." : lang === "en" ? "Submit" : "تم"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGroup && (
        <GroupDetailScreen
          group={selectedGroup}
          user={user}
          lang={lang}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}

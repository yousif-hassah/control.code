import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  LogIn,
  Send,
  ChevronLeft,
  Copy,
  Check,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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
    if (user?.uid) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(
          `
          role,
          groups (
            id,
            name,
            code,
            created_at
          )
        `,
        )
        .eq("user_id", user.uid);

      if (error) throw error;
      setGroups(
        data?.map((item) => ({ ...item.groups, role: item.role })) || [],
      );
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setLoading(true);
    try {
      const groupCode = generateGroupCode();

      // Create group
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert([
          {
            name: newGroupName,
            code: groupCode,
            created_by: user.uid,
          },
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("group_members")
        .insert([
          {
            group_id: newGroup.id,
            user_id: user.uid,
            role: "admin",
          },
        ]);

      if (memberError) throw memberError;

      setNewGroupName("");
      setShowCreateModal(false);
      fetchUserGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      alert(lang === "en" ? "Failed to create group" : "فشل إنشاء المجموعة");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("code", joinCode.toUpperCase())
        .single();

      if (groupError || !group) {
        alert(lang === "en" ? "Invalid group code" : "كود المجموعة غير صحيح");
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", user.uid)
        .single();

      if (existing) {
        alert(lang === "en" ? "Already a member" : "أنت عضو بالفعل");
        return;
      }

      // Join group
      const { error: joinError } = await supabase.from("group_members").insert([
        {
          group_id: group.id,
          user_id: user.uid,
          role: "member",
        },
      ]);

      if (joinError) throw joinError;

      setJoinCode("");
      setShowJoinModal(false);
      fetchUserGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      alert(lang === "en" ? "Failed to join group" : "فشل الانضمام للمجموعة");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="groups-screen"
      style={{ padding: "20px", paddingBottom: "100px" }}
    >
      <header className="header" style={{ marginBottom: "25px" }}>
        <button className="nav-icon-btn" onClick={() => setScreen("home")}>
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h1 style={{ flex: 1, margin: 0 }}>
          {lang === "en" ? "Groups" : "المجموعات"}
        </h1>
        <button
          className="nav-icon-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={24} />
        </button>
      </header>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            flex: 1,
            padding: "12px",
            background: "#629FAD",
            color: "white",
            border: "none",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <LogIn size={20} />
          {lang === "en" ? "Join Group" : "انضم لمجموعة"}
        </button>
      </div>

      {groups.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}
        >
          <Users size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <p>{lang === "en" ? "No groups yet" : "لا توجد مجموعات بعد"}</p>
          <p style={{ fontSize: "14px" }}>
            {lang === "en"
              ? "Create or join a group to get started"
              : "أنشئ أو انضم لمجموعة للبدء"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              style={{
                padding: "16px",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                    {group.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {lang === "en" ? "Code:" : "الكود:"} {group.code}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(group.code);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      {copied ? (
                        <Check size={16} color="#4CAF50" />
                      ) : (
                        <Copy size={16} color="#666" />
                      )}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 12px",
                    background: group.role === "admin" ? "#4CAF50" : "#629FAD",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                >
                  {group.role === "admin"
                    ? lang === "en"
                      ? "Admin"
                      : "مشرف"
                    : lang === "en"
                      ? "Member"
                      : "عضو"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "20px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0" }}>
              {lang === "en" ? "Create New Group" : "إنشاء مجموعة جديدة"}
            </h2>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={lang === "en" ? "Group name" : "اسم المجموعة"}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                marginBottom: "16px",
                fontSize: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
              <button
                onClick={createGroup}
                disabled={loading || !newGroupName.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#629FAD",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading || !newGroupName.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "..." : lang === "en" ? "Create" : "إنشاء"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "20px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0" }}>
              {lang === "en" ? "Join Group" : "الانضمام لمجموعة"}
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={
                lang === "en" ? "Enter group code" : "أدخل كود المجموعة"
              }
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                marginBottom: "16px",
                fontSize: "16px",
                textTransform: "uppercase",
              }}
              maxLength={6}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                {lang === "en" ? "Cancel" : "إلغاء"}
              </button>
              <button
                onClick={joinGroup}
                disabled={loading || joinCode.length !== 6}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#629FAD",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading || joinCode.length !== 6 ? 0.5 : 1,
                }}
              >
                {loading ? "..." : lang === "en" ? "Join" : "انضم"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Screen */}
      {selectedGroup && (
        <GroupChatScreen
          group={selectedGroup}
          user={user}
          lang={lang}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}

function GroupChatScreen({ group, user, lang, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`group_${group.id}`)
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
      subscription.unsubscribe();
    };
  }, [group.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select(
          `
          *,
          profiles (name, image_url)
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
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
        <div>
          <h2 style={{ margin: 0, fontSize: "18px" }}>{group.name}</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
            {lang === "en" ? "Code:" : "الكود:"} {group.code}
          </p>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.user_id === user.uid ? "flex-end" : "flex-start",
              maxWidth: "70%",
            }}
          >
            {msg.user_id !== user.uid && (
              <p
                style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}
              >
                {msg.profiles?.name || "User"}
              </p>
            )}
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
        ))}
      </div>

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
    </div>
  );
}

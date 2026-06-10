import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain, Sparkles, Send, RefreshCw, Moon, Sun, Bookmark, Check, Plus, X } from "lucide-react";

/**
 * IAI — Intelligent AI Assistant screen
 * Integrated AI chat powered by a simple prompt system.
 */
export function IAIScreen({ lang, t, theme, toggleTheme, addPinnedNote, pinnedNotes, updatePinnedNote }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        lang === "ar"
          ? "مرحباً! أنا مساعدك الذكي IAI. كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في التخطيط، الأفكار، الكتابة، وأي شيء آخر. 🤖"
          : "Hello! I'm IAI, your intelligent assistant. How can I help you today? I can assist with planning, ideas, writing, and much more. 🤖",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const saved = localStorage.getItem("iai_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("iai_chat_history", JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const SYSTEM_PROMPT =
    lang === "ar"
      ? "أنت مساعد ذكي اسمه IAI. تساعد المستخدمين في التخطيط والأفكار والكتابة والمشاريع. كن ودوداً ومختصراً وعملياً في ردودك. رد دائماً بالعربية."
      : "You are an intelligent assistant named IAI. You help users with planning, ideas, writing, and projects. Be friendly, concise, and practical in your responses.";

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      // Build conversation history for context properly
      const historyContents = messages
        .filter(m => m.role !== "system" && m.id !== 1) // skip initial greeting if needed, or keep it
        .slice(-6)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      // Add the new user message
      historyContents.push({
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userMsg.content }],
      });

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      
      if (!apiKey || apiKey.startsWith("AIzaSyAkHNb")) {
        throw new Error(lang === "ar" ? "مفتاح Gemini API غير صالح أو غير موجود. يرجى إضافة مفتاح حقيقي في ملف .env" : "Invalid or missing Gemini API Key. Please add a real key to .env");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: historyContents,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "API Error");
      }

      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        (lang === "ar" ? "عذراً، لا يوجد رد." : "Sorry, no response.");

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: aiText },
      ]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      // Show the actual error so the user knows what to fix
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: `⚠️ خطأ: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingContent, setPendingContent] = useState("");
  const [pendingMsgId, setPendingMsgId] = useState(null);

  const handleSaveToNote = (content, msgId) => {
    if (!addPinnedNote) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const finalContent = (selectedText && content.includes(selectedText)) 
      ? selectedText 
      : content;

    setPendingContent(finalContent);
    setPendingMsgId(msgId);
    setShowSaveModal(true);
  };

  const confirmSaveToNew = async () => {
    const title = lang === "ar" ? "من IAI" : "From IAI";
    const success = await addPinnedNote(title, pendingContent);
    finishSaving(success);
  };

  const confirmSaveToExisting = async (note) => {
    const updatedContent = note.content + "\n\n---\n" + pendingContent;
    const success = await updatePinnedNote(note.id, { content: updatedContent });
    finishSaving(success);
  };

  const finishSaving = (success) => {
    if (success) {
      setSavedMessageIds(prev => new Set(prev).add(pendingMsgId));
      setTimeout(() => {
        setSavedMessageIds(prev => {
          const next = new Set(prev);
          next.delete(pendingMsgId);
          return next;
        });
      }, 2000);
    }
    setShowSaveModal(false);
    setPendingContent("");
    setPendingMsgId(null);
  };

  const clearChat = () => {
    const initialMsg = [
      {
        id: Date.now(),
        role: "assistant",
        content:
          lang === "ar"
            ? "تم مسح المحادثة. كيف يمكنني مساعدتك؟ 🤖"
            : "Chat cleared. How can I help you? 🤖",
      },
    ];
    setMessages(initialMsg);
    localStorage.removeItem("iai_chat_history");
  };

  const suggestions =
    lang === "ar"
      ? ["ساعدني في التخطيط لأسبوعي", "أعطني أفكاراً للتطوير", "كيف أحسن تركيزي؟"]
      : ["Help me plan my week", "Give me productivity ideas", "How to improve focus?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", minHeight: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0 16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            }}
          >
            <img src="/app2.ai.png" alt="IAI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>IAI</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-dim)" }}>
              {lang === "ar" ? "مساعدك الذكي" : "Intelligent AI Assistant"}
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: "var(--primary-pale)",
            border: "none",
            borderRadius: 12,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="iai-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                      flexShrink: 0,
                      alignSelf: "flex-end",
                    }}
                >
                  <img src="/app2.ai.png" alt="AI" style={{ width: 14, height: 14 }} />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 4,
                  maxWidth: "80%",
                }}
              >
                <div
                  className={msg.role === "user" ? "iai-bubble-user" : "iai-bubble-ai"}
                  style={{ whiteSpace: "pre-wrap", position: "relative" }}
                >
                  {msg.content}
                </div>
                
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleSaveToNote(msg.content, msg.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: savedMessageIds.has(msg.id) ? "var(--accent)" : "var(--text-dim)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "2px 4px",
                      borderRadius: 4,
                      transition: "all 0.2s",
                      marginTop: -2,
                      marginLeft: 4,
                    }}
                  >
                    {savedMessageIds.has(msg.id) ? (
                      <>
                        <Check size={12} />
                        {lang === "ar" ? "تم الحفظ" : "Saved"}
                      </>
                    ) : (
                      <>
                        <Bookmark size={12} />
                        {lang === "ar" ? "حفظ في الملاحظات" : "Save to Notes"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
            >
              <img src="/app2.ai.png" alt="AI" style={{ width: 14, height: 14 }} />
            </div>
            <div
              className="iai-bubble-ai"
              style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    animation: `bounce 1s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              style={{
                background: "var(--primary-pale)",
                border: "1px solid rgba(29,84,109,0.15)",
                borderRadius: 50,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          background: "var(--bg-card)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          padding: "8px 8px 8px 16px",
          boxShadow: "var(--shadow)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={lang === "ar" ? "اسأل IAI شيئاً..." : "Ask IAI anything..."}
          rows={1}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            resize: "none",
            fontSize: 14,
            color: "var(--text-main)",
            fontFamily: "Outfit, sans-serif",
            lineHeight: 1.5,
            maxHeight: 100,
            overflowY: "auto",
            padding: "6px 0",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background:
              input.trim() && !loading
                ? "var(--primary)"
                : "var(--border)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          <Send size={16} color="white" />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>

      {/* Save Selection Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 2000
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: "var(--bg-card)",
                width: "100%",
                maxWidth: "400px",
                borderRadius: "28px",
                padding: "24px",
                boxShadow: "var(--shadow-md)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
                  {lang === "ar" ? "حفظ في الملاحظات" : "Save to Notes"}
                </h3>
                <button 
                  onClick={() => setShowSaveModal(false)}
                  style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", padding: "4px" }}>
                <button
                  onClick={confirmSaveToNew}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    background: "var(--primary-pale)",
                    border: "1px dashed var(--primary)",
                    borderRadius: "16px",
                    color: "var(--primary)",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "right"
                  }}
                >
                  <Plus size={18} />
                  {lang === "ar" ? "ملاحظة جديدة" : "New Note"}
                </button>

                {pinnedNotes && pinnedNotes.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>
                      {lang === "ar" ? "أو أضف لملاحظة موجودة:" : "Or add to existing:"}
                    </p>
                    {pinnedNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => confirmSaveToExisting(note)}
                        style={{
                          width: "100%",
                          display: "block",
                          padding: "14px",
                          background: "var(--bg-app)",
                          border: "1px solid var(--border)",
                          borderRadius: "16px",
                          marginBottom: "8px",
                          textAlign: lang === "ar" ? "right" : "left",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>{note.title}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {note.content}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * GoogleAuthScreen — Clean login with Google OAuth via Supabase
 */
export function GoogleAuthScreen({ lang, theme, toggleTheme, toggleLang }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(lang === "ar" ? `خطأ: ${err.message}` : `Error: ${err.message}`);
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`auth-screen ${isDark ? "theme-dark" : ""} ${lang === "ar" ? "rtl" : ""}`}>
      {/* Controls */}
      <div style={{ position: "absolute", top: 16, right: lang === "ar" ? "auto" : 16, left: lang === "ar" ? 16 : "auto", display: "flex", gap: 8 }}>
        <button
          onClick={toggleTheme}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: isDark ? "rgba(255,255,255,0.08)" : "white",
            border: "1px solid var(--border)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-main)",
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={toggleLang}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: isDark ? "rgba(255,255,255,0.08)" : "white",
            border: "1px solid var(--border)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-main)", fontWeight: 700, fontSize: 13,
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {lang === "ar" ? "EN" : "ع"}
        </button>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/controll.app.png" alt="Logo" style={{ width: "240px", height: "auto", margin: "0 auto 10px", display: "block" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: "var(--text-main)" }}>
            {lang === "ar" ? "مرحباً بك في Control" : "Welcome to Control"}
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 15 }}>
            {lang === "ar"
              ? "منصة التعاون الجماعي والمهام والذكاء الاصطناعي"
              : "Group collaboration, tasks & AI assistant"}
          </p>
        </div>

        {/* Google Sign-in button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: isDark ? "rgba(255,255,255,0.06)" : "white",
            color: "var(--text-main)",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: "var(--shadow)",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          {loading ? (
            <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {lang === "ar"
            ? loading ? "جاري التسجيل..." : "تسجيل الدخول بـ Google"
            : loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <div
            style={{
              background: "rgba(255,71,87,0.1)",
              border: "1px solid rgba(255,71,87,0.2)",
              borderRadius: 12,
              padding: "10px 14px",
              color: "#ff4757",
              fontSize: 13,
              fontWeight: 500,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Features */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 8 }}>
          {[
            { icon: "👥", text: lang === "ar" ? "مجموعات تعاونية" : "Group collaboration" },
            { icon: "💬", text: lang === "ar" ? "رسائل فورية" : "Real-time messaging" },
            { icon: "🤖", text: lang === "ar" ? "مساعد ذكاء اصطناعي" : "AI assistant (IAI)" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

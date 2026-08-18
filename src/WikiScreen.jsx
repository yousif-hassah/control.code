import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, ChevronLeft, ChevronRight, Folder, Search,
  Trash2, Edit2, Save, X, MoreHorizontal, Star, Clock,
  Bold, Italic, List, Code, Heading1, Heading2, Link as LinkIcon,
  AlignLeft, Image as ImageIcon, Table, CheckSquare, Quote
} from "lucide-react";
import { dbGetAll, dbPut, dbDelete, STORES, offlineCreate, offlineUpdate, offlineDelete } from "./lib/offlineDB";

// ── Simple Block-based Editor ──────────────────────────────

const BLOCK_TYPES = {
  PARAGRAPH: "paragraph",
  HEADING1: "heading1",
  HEADING2: "heading2",
  HEADING3: "heading3",
  BULLET: "bullet",
  NUMBERED: "numbered",
  CODE: "code",
  QUOTE: "quote",
  DIVIDER: "divider",
  CHECKLIST: "checklist",
};

const emptyBlock = (type = BLOCK_TYPES.PARAGRAPH) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `block_${Date.now()}`,
  type,
  content: "",
  checked: false,
});

function BlockEditor({ blocks, onChange, readOnly = false, lang }) {
  const [focusedId, setFocusedId] = useState(null);
  const refs = useRef({});

  const updateBlock = useCallback((id, updates) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [blocks, onChange]);

  const addBlock = useCallback((afterId, type = BLOCK_TYPES.PARAGRAPH) => {
    const newBlock = emptyBlock(type);
    const idx = blocks.findIndex((b) => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    onChange(newBlocks);
    setTimeout(() => {
      if (refs.current[newBlock.id]) refs.current[newBlock.id].focus();
    }, 50);
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const newBlocks = blocks.filter((b) => b.id !== id);
    onChange(newBlocks);
    const prevBlock = newBlocks[Math.max(0, idx - 1)];
    if (prevBlock) {
      setTimeout(() => {
        if (refs.current[prevBlock.id]) refs.current[prevBlock.id].focus();
      }, 50);
    }
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e, block) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
    }
    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      deleteBlock(block.id);
    }
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      // cycle through block types
      const types = Object.values(BLOCK_TYPES);
      const currentIdx = types.indexOf(block.type);
      const nextType = types[(currentIdx + 1) % types.length];
      updateBlock(block.id, { type: nextType });
    }
  }, [addBlock, deleteBlock, updateBlock]);

  const renderBlock = (block) => {
    const isHeading1 = block.type === BLOCK_TYPES.HEADING1;
    const isHeading2 = block.type === BLOCK_TYPES.HEADING2;
    const isHeading3 = block.type === BLOCK_TYPES.HEADING3;
    const isCode = block.type === BLOCK_TYPES.CODE;
    const isQuote = block.type === BLOCK_TYPES.QUOTE;
    const isDivider = block.type === BLOCK_TYPES.DIVIDER;
    const isChecklist = block.type === BLOCK_TYPES.CHECKLIST;
    const isBullet = block.type === BLOCK_TYPES.BULLET;
    const isNumbered = block.type === BLOCK_TYPES.NUMBERED;

    if (isDivider) {
      return (
        <div key={block.id} style={{ padding: "8px 0" }}>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
        </div>
      );
    }

    const commonStyle = {
      width: "100%",
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-main)",
      color: "var(--text-main)",
      resize: "none",
      lineHeight: 1.7,
      caretColor: "var(--enterprise-primary)",
      ...(isHeading1 && { fontSize: "2rem", fontWeight: 800, lineHeight: 1.2 }),
      ...(isHeading2 && { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 }),
      ...(isHeading3 && { fontSize: "1.2rem", fontWeight: 700 }),
      ...(isCode && {
        fontFamily: "monospace",
        background: "var(--bg-subtle)",
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: "0.9rem",
        color: "var(--enterprise-accent)",
        display: "block",
      }),
      ...(isQuote && {
        borderLeft: "4px solid var(--enterprise-primary)",
        paddingLeft: 16,
        color: "var(--text-sub)",
        fontStyle: "italic",
      }),
    };

    return (
      <div
        key={block.id}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "2px 0",
          position: "relative",
        }}
        onClick={() => setFocusedId(block.id)}
      >
        {isBullet && (
          <span style={{ color: "var(--enterprise-primary)", fontWeight: 700, flexShrink: 0, marginTop: 6 }}>•</span>
        )}
        {isNumbered && (
          <span style={{ color: "var(--enterprise-primary)", fontWeight: 700, flexShrink: 0, marginTop: 4, minWidth: 20 }}>
            {blocks.filter(b => b.type === BLOCK_TYPES.NUMBERED).indexOf(block) + 1}.
          </span>
        )}
        {isChecklist && (
          <input
            type="checkbox"
            checked={block.checked || false}
            onChange={(e) => !readOnly && updateBlock(block.id, { checked: e.target.checked })}
            style={{ marginTop: 6, flexShrink: 0, accentColor: "var(--enterprise-primary)" }}
          />
        )}
        <textarea
          ref={(el) => (refs.current[block.id] = el)}
          value={block.content}
          onChange={(e) => !readOnly && updateBlock(block.id, { content: e.target.value })}
          onKeyDown={(e) => !readOnly && handleKeyDown(e, block)}
          onFocus={() => setFocusedId(block.id)}
          readOnly={readOnly}
          placeholder={
            block.type === BLOCK_TYPES.PARAGRAPH ? (lang === "ar" ? "اكتب هنا... (اضغط / لتغيير النوع)" : "Write here... (press / to change type)") :
            block.type === BLOCK_TYPES.HEADING1 ? (lang === "ar" ? "عنوان رئيسي" : "Heading 1") :
            block.type === BLOCK_TYPES.HEADING2 ? (lang === "ar" ? "عنوان ثانوي" : "Heading 2") :
            ""
          }
          rows={1}
          style={{
            ...commonStyle,
            flex: 1,
            minHeight: 28,
            overflow: "hidden",
            padding: isCode ? "12px 16px" : "2px 0",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
        {!readOnly && focusedId === block.id && (
          <button
            onClick={() => addBlock(block.id)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              padding: "2px 6px",
              borderRadius: 6,
              fontSize: 18,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            +
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: 200 }}>
      {blocks.map((block) => renderBlock(block))}
    </div>
  );
}

// ── Page Tree Item ─────────────────────────────────────────

function PageTreeItem({ page, pages, depth = 0, selectedId, onSelect, onDelete, lang }) {
  const [expanded, setExpanded] = useState(true);
  const children = pages.filter((p) => p.parent_id === page.id);

  return (
    <div>
      <div
        onClick={() => onSelect(page)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: `7px 10px 7px ${10 + depth * 16}px`,
          borderRadius: 8,
          cursor: "pointer",
          background: selectedId === page.id ? "var(--enterprise-primary-pale)" : "transparent",
          color: selectedId === page.id ? "var(--enterprise-primary)" : "var(--text-sub)",
          fontSize: 13,
          fontWeight: selectedId === page.id ? 700 : 500,
          transition: "all 0.15s",
        }}
        className="wiki-tree-item"
      >
        {children.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
          >
            <ChevronRight size={12} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        )}
        <span style={{ fontSize: 14 }}>{page.icon || "📄"}</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {page.title || (lang === "ar" ? "بدون عنوان" : "Untitled")}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", opacity: 0, padding: 2, borderRadius: 4 }}
          className="wiki-delete-btn"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {expanded && children.map((child) => (
        <PageTreeItem
          key={child.id}
          page={child}
          pages={pages}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          lang={lang}
        />
      ))}
    </div>
  );
}

// ── Main Wiki Screen ───────────────────────────────────────

export function WikiScreen({ group, user, lang, onClose }) {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const saveTimer = useRef(null);
  const isRTL = lang === "ar";

  useEffect(() => {
    loadPages();
  }, [group?.id]);

  const loadPages = async () => {
    setLoading(true);
    try {
      let data = [];
      if (navigator.onLine) {
        const { data: online } = await supabase
          .from("wiki_pages")
          .select("*")
          .eq("group_id", group.id)
          .order("sort_order", { ascending: true });
        if (online) {
          data = online;
          // Cache offline
          for (const page of online) await dbPut(STORES.wikiPages, page);
        }
      } else {
        data = await dbGetAll(STORES.wikiPages, "group_id", group.id);
      }
      setPages(data);
      if (data.length > 0 && !selectedPage) setSelectedPage(data[0]);
    } catch (err) {
      console.warn("⚠️ Wiki load error:", err.message);
      const cached = await dbGetAll(STORES.wikiPages, "group_id", group.id);
      setPages(cached);
      if (cached.length > 0) setSelectedPage(cached[0]);
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (parentId = null) => {
    const page = await offlineCreate(supabase, "wiki_pages", STORES.wikiPages, {
      group_id: group.id,
      parent_id: parentId,
      title: lang === "ar" ? "صفحة جديدة" : "New Page",
      content: { blocks: [emptyBlock()] },
      icon: "📄",
      created_by: user.uid,
      sort_order: pages.length,
    }, user.uid);
    setPages((prev) => [...prev, page]);
    setSelectedPage(page);
  };

  const deletePage = async (id) => {
    if (!window.confirm(lang === "ar" ? "هل تريد حذف هذه الصفحة؟" : "Delete this page?")) return;
    await offlineDelete(supabase, "wiki_pages", STORES.wikiPages, id, user.uid);
    const newPages = pages.filter((p) => p.id !== id);
    setPages(newPages);
    if (selectedPage?.id === id) setSelectedPage(newPages[0] || null);
  };

  const autoSave = useCallback(async (page) => {
    if (!page) return;
    setSaving(true);
    try {
      await offlineUpdate(supabase, "wiki_pages", STORES.wikiPages, page.id, {
        title: page.title,
        content: page.content,
        icon: page.icon,
        updated_by: user.uid,
        updated_at: new Date().toISOString(),
      }, user.uid);
      setPages((prev) => prev.map((p) => (p.id === page.id ? page : p)));
    } catch (err) {
      console.warn("Auto-save failed:", err.message);
    }
    setSaving(false);
  }, [user.uid]);

  const updateSelectedPage = useCallback((updates) => {
    if (!selectedPage) return;
    const updated = { ...selectedPage, ...updates };
    setSelectedPage(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(updated), 1000);
  }, [selectedPage, autoSave]);

  const rootPages = pages.filter((p) => !p.parent_id);
  const filteredPages = searchQuery
    ? pages.filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div
      className="wiki-container"
      style={{
        display: "flex",
        height: "100%",
        minHeight: "80vh",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className="wiki-sidebar"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              borderRight: isRTL ? "none" : "1px solid var(--border)",
              borderLeft: isRTL ? "1px solid var(--border)" : "none",
              overflowY: "auto",
              overflowX: "hidden",
              background: "var(--bg-subtle)",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Sidebar header */}
            <div style={{ padding: "16px 12px 8px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={16} color="var(--enterprise-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
                    {isRTL ? "المستندات" : "Wiki"}
                  </span>
                </div>
                <button
                  onClick={() => createPage()}
                  style={{
                    background: "var(--enterprise-primary)",
                    border: "none",
                    borderRadius: 6,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRTL ? "بحث..." : "Search..."}
                  style={{ paddingLeft: 28, paddingRight: 8, padding: "7px 8px 7px 28px", fontSize: 12, borderRadius: 8, height: 32 }}
                />
              </div>
            </div>

            {/* Page tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              {loading ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
                  {isRTL ? "جاري التحميل..." : "Loading..."}
                </div>
              ) : (filteredPages || rootPages).length === 0 ? (
                <div style={{ padding: "20px 12px", textAlign: "center" }}>
                  <FileText size={32} style={{ color: "var(--text-dim)", opacity: 0.4, marginBottom: 8 }} />
                  <p style={{ color: "var(--text-dim)", fontSize: 12, margin: 0 }}>
                    {isRTL ? "لا توجد صفحات بعد" : "No pages yet"}
                  </p>
                  <button
                    onClick={() => createPage()}
                    style={{
                      marginTop: 12,
                      background: "var(--enterprise-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isRTL ? "+ إنشاء صفحة" : "+ Create Page"}
                  </button>
                </div>
              ) : filteredPages ? (
                filteredPages.map((p) => (
                  <PageTreeItem
                    key={p.id}
                    page={p}
                    pages={pages}
                    depth={0}
                    selectedId={selectedPage?.id}
                    onSelect={(page) => {
                      setSelectedPage(page);
                      if (window.innerWidth < 768) setShowSidebar(false);
                    }}
                    onDelete={deletePage}
                    lang={lang}
                  />
                ))
              ) : (
                rootPages.map((p) => (
                  <PageTreeItem
                    key={p.id}
                    page={p}
                    pages={pages}
                    depth={0}
                    selectedId={selectedPage?.id}
                    onSelect={(page) => {
                      setSelectedPage(page);
                      if (window.innerWidth < 768) setShowSidebar(false);
                    }}
                    onDelete={deletePage}
                    lang={lang}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 4, borderRadius: 6 }}
          >
            <AlignLeft size={18} />
          </button>

          {selectedPage && (
            <>
              <input
                value={selectedPage.title || ""}
                onChange={(e) => updateSelectedPage({ title: e.target.value })}
                placeholder={isRTL ? "عنوان الصفحة..." : "Page title..."}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                {saving ? (
                  <>
                    <Clock size={12} className="spinner" />
                    <span>{isRTL ? "حفظ..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Save size={12} color="#10b981" />
                    <span style={{ color: "#10b981" }}>{isRTL ? "محفوظ" : "Saved"}</span>
                  </>
                )}
              </span>
            </>
          )}

          <button
            onClick={() => createPage(selectedPage?.id)}
            style={{
              background: "var(--enterprise-primary-pale)",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--enterprise-primary)",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={14} />
            <span className="hide-mobile">{isRTL ? "صفحة فرعية" : "Page"}</span>
          </button>
        </div>

        {/* Content */}
        <div className="wiki-editor-content" style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
          {!selectedPage ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "var(--text-dim)" }}>
              <FileText size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h2 style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
                {isRTL ? "اختر صفحة أو أنشئ واحدة" : "Select a page or create one"}
              </h2>
              <button
                onClick={() => createPage()}
                className="btn-enterprise"
              >
                {isRTL ? "إنشاء صفحة جديدة" : "Create New Page"}
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <BlockEditor
                blocks={selectedPage.content?.blocks || [emptyBlock()]}
                onChange={(blocks) => updateSelectedPage({ content: { blocks } })}
                lang={lang}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .wiki-tree-item:hover .wiki-delete-btn { opacity: 1 !important; }
        .wiki-tree-item:hover { background: var(--enterprise-primary-pale) !important; }
      `}</style>
    </div>
  );
}

export default WikiScreen;

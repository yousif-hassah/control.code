import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  Download,
  Trash2,
  Folder,
  Image as ImageIcon,
  FileText,
  Archive,
  Loader2,
  Plus,
  X,
  Search,
  Code2,
  Film,
  Music,
  Eye,
  Copy,
  Check,
  Package,
  FileCode
} from "lucide-react";

// File type and icon matching helper
const getFileTypeInfo = (filename = "", mimeType = "") => {
  const ext = filename.split(".").pop().toLowerCase();
  
  // Code / Programming extensions
  const codeExts = [
    "js", "jsx", "ts", "tsx", "html", "css", "json", "py", "sql", "java",
    "cpp", "c", "cs", "php", "sh", "rs", "go", "rb", "vue", "svelte", "md",
    "yml", "yaml", "xml", "env", "gitattributes", "gitignore"
  ];
  // Archive extensions
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
  // Video extensions
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "flv", "m4v"];
  // Image extensions
  const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp"];
  // Audio extensions
  const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
  // Document extensions
  const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

  if (codeExts.includes(ext) || mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("text/x-")) {
    return { category: "code", icon: Code2, color: "#6366f1", label: ext.toUpperCase() + " Code" };
  }
  if (archiveExts.includes(ext) || mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("tar")) {
    return { category: "archive", icon: Package, color: "#f59e0b", label: ext.toUpperCase() + " Archive" };
  }
  if (videoExts.includes(ext) || mimeType.startsWith("video/")) {
    return { category: "video", icon: Film, color: "#f43f5e", label: "Video" };
  }
  if (imageExts.includes(ext) || mimeType.startsWith("image/")) {
    return { category: "image", icon: ImageIcon, color: "#10b981", label: "Image" };
  }
  if (audioExts.includes(ext) || mimeType.startsWith("audio/")) {
    return { category: "audio", icon: Music, color: "#a855f7", label: "Audio" };
  }
  if (ext === "pdf" || mimeType.includes("pdf")) {
    return { category: "pdf", icon: FileText, color: "#ef4444", label: "PDF Document" };
  }
  if (docExts.includes(ext) || mimeType.includes("document") || mimeType.includes("sheet")) {
    return { category: "document", icon: FileText, color: "#3b82f6", label: ext.toUpperCase() + " Doc" };
  }

  return { category: "general", icon: File, color: "#8b5cf6", label: ext ? ext.toUpperCase() : "File" };
};

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Convert File to Data URL as fallback if Supabase Storage is unconfigured
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Read text content of code file for preview
const fileToText = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("// Failed to read text content");
    reader.readAsText(file);
  });
};

export function FileSharing({ group, user, lang }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef(null);
  const isRTL = lang === "ar";

  useEffect(() => {
    if (group?.id) loadFiles();
  }, [group?.id]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("workspace_files")
          .select("*")
          .eq("group_id", group.id)
          .order("created_at", { ascending: false });

        if (data && !error) {
          setFiles(data);
          localStorage.setItem(`files_cache_${group.id}`, JSON.stringify(data));
        } else {
          // Fallback to cache
          const cached = localStorage.getItem(`files_cache_${group.id}`);
          if (cached) setFiles(JSON.parse(cached));
        }
      } else {
        const cached = localStorage.getItem(`files_cache_${group.id}`);
        if (cached) setFiles(JSON.parse(cached));
      }
    } catch (err) {
      console.warn("⚠️ Files load error:", err.message);
      const cached = localStorage.getItem(`files_cache_${group.id}`);
      if (cached) setFiles(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const processUploadFiles = async (fileList) => {
    const selectedFiles = Array.from(fileList);
    if (!selectedFiles.length) return;

    setUploading(true);
    for (const file of selectedFiles) {
      try {
        let publicUrl = "";
        const filePath = `${group.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        // Attempt 1: Try Supabase Storage buckets
        let uploadSuccess = false;
        const bucketCandidates = ["workspace-files", "files", "public"];

        for (const bucket of bucketCandidates) {
          try {
            const { error: uploadErr } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, { cacheControl: "3600", upsert: true });

            if (!uploadErr) {
              const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
              publicUrl = urlData?.publicUrl || "";
              uploadSuccess = true;
              break;
            }
          } catch (e) {
            // continue to next bucket candidate or fallback
          }
        }

        // Attempt 2: If Supabase Storage is not set up or bucket missing, convert to Data URL
        if (!uploadSuccess || !publicUrl) {
          console.log("ℹ️ Using DataURL storage fallback for:", file.name);
          publicUrl = await fileToDataUrl(file);
        }

        // Create Database Record
        const newRecord = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          group_id: group.id,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type || getFileTypeInfo(file.name).category,
          file_size: file.size,
          folder: getFileTypeInfo(file.name).category === "code" ? "Code & Scripts" : (getFileTypeInfo(file.name).category === "video" ? "Videos" : "General"),
          uploaded_by: user?.uid || "user",
          uploader_name: user?.name || user?.email || (isRTL ? "عضو" : "Member"),
          created_at: new Date().toISOString(),
        };

        if (navigator.onLine) {
          try {
            const { data: dbData, error: dbErr } = await supabase
              .from("workspace_files")
              .insert([newRecord])
              .select()
              .single();

            if (dbData && !dbErr) {
              setFiles((prev) => [dbData, ...prev]);
            } else {
              setFiles((prev) => [newRecord, ...prev]);
            }
          } catch (err) {
            setFiles((prev) => [newRecord, ...prev]);
          }
        } else {
          setFiles((prev) => [newRecord, ...prev]);
        }

        // Update local cache
        setTimeout(() => {
          setFiles((currentFiles) => {
            localStorage.setItem(`files_cache_${group.id}`, JSON.stringify(currentFiles));
            return currentFiles;
          });
        }, 100);

      } catch (err) {
        console.error("❌ File processing error:", err);
      }
    }
    setUploading(false);
  };

  const handleUploadChange = (e) => {
    processUploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(isRTL ? "هل أنت تأكد من حذف هذا الملف؟" : "Are you sure you want to delete this file?")) return;
    try {
      if (navigator.onLine) {
        await supabase.from("workspace_files").delete().eq("id", file.id);
      }
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== file.id);
        localStorage.setItem(`files_cache_${group.id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("❌ Delete error:", err.message);
    }
  };

  const openPreview = async (file) => {
    setSelectedPreview(file);
    setPreviewTextContent("");
    setCopiedCode(false);

    const typeInfo = getFileTypeInfo(file.name, file.file_type);
    if (typeInfo.category === "code" || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
      if (file.file_url.startsWith("data:")) {
        try {
          const base64Content = file.file_url.split(",")[1];
          const decoded = atob(base64Content);
          setPreviewTextContent(decoded);
        } catch (e) {
          setPreviewTextContent("// Unable to preview file content");
        }
      } else {
        try {
          const res = await fetch(file.file_url);
          const txt = await res.text();
          setPreviewTextContent(txt);
        } catch (e) {
          setPreviewTextContent("// Unable to fetch code content");
        }
      }
    }
  };

  const copyCodeToClipboard = () => {
    if (previewTextContent) {
      navigator.clipboard.writeText(previewTextContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group files by category folder
  const grouped = filteredFiles.reduce((acc, f) => {
    const typeInfo = getFileTypeInfo(f.name, f.file_type);
    const folderName = f.folder || typeInfo.label;
    if (!acc[folderName]) acc[folderName] = [];
    acc[folderName].push(f);
    return acc;
  }, {});

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>
            📁 {isRTL ? "مشاركة واستكشاف الملفات" : "File Sharing & Code Assets"}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
            {files.length} {isRTL ? "ملف متاح" : "files uploaded"} • {formatBytes(files.reduce((s, f) => s + (f.file_size || 0), 0))}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", fontSize: 14, width: "auto" }}
        >
          {uploading ? <Loader2 size={16} className="spinner" /> : <Upload size={16} />}
          {uploading ? (isRTL ? "جاري الرفع..." : "Uploading...") : (isRTL ? "رفع ملف جديد" : "Upload Any File")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleUploadChange}
        />
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: isRTL ? undefined : 14,
            right: isRTL ? 14 : undefined,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-dim)"
          }}
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRTL ? "ابحث عن الأكواد، الفيديوهات، الصور، الملفات المضغوطة..." : "Search code, videos, images, ZIPs, documents..."}
          style={{
            paddingLeft: isRTL ? 16 : 42,
            paddingRight: isRTL ? 42 : 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: "var(--radius-pill)",
            fontSize: 14
          }}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragActive ? "2px dashed var(--text-main)" : "2px dashed var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "26px 20px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 24,
          background: dragActive ? "var(--bg-subtle)" : "var(--bg-card)",
          transition: "var(--transition)",
          boxShadow: dragActive ? "var(--shadow-md)" : "none"
        }}
      >
        <Upload size={32} style={{ color: "var(--text-main)", marginBottom: 10, opacity: 0.85 }} />
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-main)", fontWeight: 700 }}>
          {isRTL ? "اضغط لاختيار أية ملفات أو اسحبها هنا مباشرة" : "Click to choose files or drop them directly here"}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-dim)" }}>
          {isRTL
            ? "يدعم جميع الصيغ بلا استثناء: ملفات برمجية (JS, PY, SQL, ZIP)، فيديوهات (MP4)، صور، وقواعد بيانات"
            : "Supports all formats: Code files (JS, PY, SQL, ZIP), Videos (MP4), Images, PDFs & Datasets"}
        </p>
      </div>

      {/* Files List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50, color: "var(--text-dim)" }}>
          <Loader2 size={36} className="spinner" style={{ marginBottom: 10 }} />
          <p>{isRTL ? "جاري تحميل الملفات..." : "Loading workspace files..."}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--text-dim)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)"
          }}
        >
          <Folder size={52} style={{ opacity: 0.2, marginBottom: 14 }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
            {isRTL ? "لا توجد ملفات مرفوعة بعد" : "No files uploaded yet"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            {isRTL ? "قم برفع ملفات مشروعك أو الأكواد ليتشاركها فريق العمل" : "Upload project source code, media, or archives to collaborate"}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([folderName, folderFiles]) => (
          <div key={folderName} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Folder size={16} style={{ color: "var(--text-main)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                {folderName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 9px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--bg-subtle)",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  border: "1px solid var(--border)"
                }}
              >
                {folderFiles.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AnimatePresence>
                {folderFiles.map((file) => {
                  const typeInfo = getFileTypeInfo(file.name, file.file_type);
                  const FileIcon = typeInfo.icon;
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 18px",
                        boxShadow: "var(--shadow-sm)",
                        transition: "var(--transition)"
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--radius-md)",
                          background: typeInfo.color + "18",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: `1px solid ${typeInfo.color}30`
                        }}
                      >
                        <FileIcon size={22} color={typeInfo.color} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p
                            onClick={() => openPreview(file)}
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--text-main)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer"
                            }}
                          >
                            {file.name}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: typeInfo.color + "18",
                              color: typeInfo.color,
                              fontWeight: 700,
                              textTransform: "uppercase"
                            }}
                          >
                            {typeInfo.label}
                          </span>
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-dim)" }}>
                          {formatBytes(file.file_size)} • {file.uploader_name || (isRTL ? "عضو" : "Member")} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => openPreview(file)}
                          title={isRTL ? "معاينة الملف" : "Preview file"}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-pill)",
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--text-main)"
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        <a
                          href={file.file_url}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={isRTL ? "تحميل الملف" : "Download file"}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-pill)",
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--text-main)",
                            textDecoration: "none"
                          }}
                        >
                          <Download size={15} />
                        </a>
                        {(file.uploaded_by === user?.uid || true) && (
                          <button
                            onClick={() => handleDelete(file)}
                            title={isRTL ? "حذف الملف" : "Delete file"}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "var(--radius-pill)",
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "#ef4444"
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))
      )}

      {/* Interactive Preview Modal */}
      {selectedPreview && (
        <div className="modal-overlay" onClick={() => setSelectedPreview(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: "90%" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)" }}>
                  {selectedPreview.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="icon-btn"
                style={{ width: 34, height: 34 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Preview based on File Category */}
            <div style={{ minHeight: 180, maxHeight: 420, overflowY: "auto", marginBottom: 16 }}>
              {getFileTypeInfo(selectedPreview.name, selectedPreview.file_type).category === "image" ? (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={selectedPreview.file_url}
                    alt={selectedPreview.name}
                    style={{ maxWidth: "100%", maxHeight: 350, borderRadius: "var(--radius-md)", objectFit: "contain" }}
                  />
                </div>
              ) : getFileTypeInfo(selectedPreview.name, selectedPreview.file_type).category === "video" ? (
                <div style={{ textAlign: "center" }}>
                  <video
                    controls
                    src={selectedPreview.file_url}
                    style={{ width: "100%", maxHeight: 350, borderRadius: "var(--radius-md)" }}
                  />
                </div>
              ) : getFileTypeInfo(selectedPreview.name, selectedPreview.file_type).category === "audio" ? (
                <div style={{ padding: "30px 20px", textAlign: "center" }}>
                  <Music size={48} style={{ color: "var(--text-main)", marginBottom: 16 }} />
                  <audio controls src={selectedPreview.file_url} style={{ width: "100%" }} />
                </div>
              ) : getFileTypeInfo(selectedPreview.name, selectedPreview.file_type).category === "code" || previewTextContent ? (
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Source Code / Plain Text</span>
                    <button
                      onClick={copyCodeToClipboard}
                      className="btn-secondary"
                      style={{ padding: "4px 12px", fontSize: 12, borderRadius: "var(--radius-pill)" }}
                    >
                      {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {copiedCode ? (isRTL ? "تم النسخ" : "Copied!") : (isRTL ? "نسخ الكود" : "Copy Code")}
                    </button>
                  </div>
                  <pre
                    style={{
                      background: "#0d1117",
                      color: "#e6edf3",
                      padding: 16,
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                      fontFamily: "monospace",
                      overflowX: "auto",
                      maxHeight: 320,
                      margin: 0,
                      border: "1px solid var(--border)"
                    }}
                  >
                    <code>{previewTextContent || "// Loading content..."}</code>
                  </pre>
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)" }}>
                  <Package size={48} style={{ opacity: 0.4, marginBottom: 12 }} />
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>
                    {isRTL ? "معاينة الماكيت المباشرة غير متاحة لهذا النوع" : "Direct live preview unavailable for this binary format"}
                  </p>
                  <p style={{ fontSize: 12, margin: "6px 0 0" }}>
                    {isRTL ? "يمكنك استخدام زر التحميل أدناه لتنزيله وحفظه على جهازك." : "Use the download button below to save and open it on your device."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <a
                href={selectedPreview.file_url}
                download={selectedPreview.name}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: "none", width: "auto", padding: "10px 20px", fontSize: 13 }}
              >
                <Download size={15} />
                {isRTL ? "تحميل الملف" : "Download File"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileSharing;

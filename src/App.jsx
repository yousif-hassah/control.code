import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { GoogleAuthScreen, IAIScreen } from "./IAIScreen";
import {
  Home,
  Compass,
  Plus,
  ClipboardList,
  User,
  ChevronLeft,
  MoreHorizontal,
  Lock,
  CheckCircle2,
  Users,
  Search,
  BookOpen,
  Award,
  Settings,
  Bell,
  Heart,
  MessageCircle,
  Pin,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  X,
  PlusCircle,
  Link as LinkIcon,
  LogOut,
  Moon,
  Sun,
  Loader2,
  TrendingUp,
  Activity,
  BarChart2,
  Brain,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GroupsScreen } from "./GroupsScreen";
import { requestForToken } from "./lib/firebase";
import { messaging } from "./lib/firebase";
import { onMessage } from "firebase/messaging";

const PALETTE = {
  NAVY: "#000000",
  DEEP_NAVY: "#111111",
  GRAY: "#888888",
  ICE: "#F5F5F5",
  TEAL: "#000000",
  GREEN: "#333333",
  BEIGE: "#FFFFFF",
  BLUE: "#666666",
};

const TRANSLATIONS = {
  en: {
    hi: "Hi",
    myJournal: "My Journal",
    startDay: "Let's start your day",
    startDayDesc: "Begin with a mindful morning reflections.",
    continueReflection: "Continue your reflection",
    journal: "Journal",
    quickJournal: "Quick Journal",
    sharedTasks: "Shared Tasks",
    viewGroup: "View Group",
    membersActive: "members active",
    tripPrep: "Family Trip Prep",
    tasksCompleted: "tasks completed",
    home: "Home",
    explore: "Explore",
    journey: "Journey",
    profile: "Profile",
    backToToday: "Back to Today",
    saveJournal: "Save Journal Entry",
    placeholder: "What's on your mind today?",
    insights: "Insights",
    writingHelp: "Writing helps clarify your thoughts.",
    wordsWritten: "You've written {count} words for today.",
    step: "Step",
    workTogether: "Work together, one step at a time",
    createNewTask: "Create New Shared Task",
    assignedTo: "Assigned to",
    pauseReflect: "Pause & reflect 🌿",
    gratitudePrompt: "What are you grateful for today?",
    setIntentions: "Set Intentions 😊",
    feelingPrompt: "How do you want to feel?",
    today: "Today",
    personal: "Personal",
    family: "Family",
    featured: "Featured",
    meditation: "Meditation",
    mindfulness: "Mindfulness",
    community: "Community",
    points: "Points",
    level: "Level",
    stats: "Stats",
    streak: "Day Streak",
    settings: "Settings",
    notifications: "Notifications",
    language: "Language",
    searchPlaceholder: "Search meditations & techniques...",
    popularTopics: "Popular Topics",
    dailyQuote: "Quote of the Day",
    addSocial: "Add Social Account",
    save: "Save",
    cancel: "Cancel",
    editProfile: "Edit Profile",
    changePhoto: "Change Photo",
    email: "Email",
    socialMedia: "Social Media",
    groups: "Groups",
    myGroups: "My Groups",
    joinGroup: "Join Group",
    createGroup: "Create Group",
    enterGroupCode: "Enter Group Code",
    groupName: "Group Name",
    roleManager: "Manager",
    roleMember: "Member",
    sendUpdate: "Send Update",
    groupFeed: "Group Feed",
    noGroups: "You haven't joined any groups yet.",
    achievements: "Achievements",
    analytics: "Analytics",
    meditating: "Meditating",
    notificationsCenter: "Notifications",
    darkMode: "Dark Mode",
    play: "Play",
    pause: "Pause",
    completed: "Completed",
    totalFocus: "Total Focus Hours",
    journalStreak: "Journal Streak",
    tasksRatio: "Task Success Rate",
    dailyTasks: "Daily Tasks",
    addTask: "Add Task",
    todoPlaceholder: "Add a task for today...",
    dailyNotes: "Daily Notes",
    addNote: "Add Note",
    notePlaceholder: "Write a new note...",
    sleep: "Sleep",
    focus: "Focus",
    happiness: "Happiness",
    anxiety: "Anxiety",
    stress: "Stress",
    calm: "Calm",
    morning: "Morning",
    evening: "Evening",
    all: "All",
    recommendation: "Daily Recommendation",
    loginTitle: "Welcome to Control",
    loginDesc: "Enter your details to start your journey",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    sendCode: "Send Verification Code",
    verifyCode: "Verify & Start",
    enterCode: "Enter 6-digit code",
    codeSentEmail: "A verification code has been sent to your email.",
    invalidCode: "Invalid code. Please try again.",
    getStarted: "Get Started",
    logout: "Log Out",
  },
  ar: {
    hi: "مرحباً",
    myJournal: "مذكراتي",
    startDay: "لنبدأ يومك",
    startDayDesc: "ابدأ بتأملات صباحية واعية.",
    continueReflection: "أكمل تأملك",
    journal: "مذكرات",
    quickJournal: "مذكرات سريعة",
    sharedTasks: "المهام المشتركة",
    viewGroup: "عرض المجموعة",
    membersActive: "أعضاء نشطون",
    tripPrep: "تجهيز رحلة العائلة",
    tasksCompleted: "مهام مكتملة",
    home: "الرئيسية",
    explore: "استكشف",
    journey: "رحلتي",
    profile: "الملف الشخصي",
    backToToday: "العودة لليوم",
    saveJournal: "حفظ المذكرة",
    placeholder: "ماذا يدور في ذهنك اليوم؟",
    insights: "أفكار",
    writingHelp: "الكتابة تساعد في توضيح أفكارك.",
    wordsWritten: "لقد كتبت {count} كلمات اليوم.",
    step: "خطوة",
    workTogether: "نعمل معاً، خطوة بخطوة",
    createNewTask: "إنشاء مهمة مشتركة جديدة",
    assignedTo: "مكلف بـ",
    pauseReflect: "توقف وتأمل 🌿",
    gratitudePrompt: "ما الذي تشعر بالامتنان له اليوم؟",
    setIntentions: "ضع نواياك 😊",
    feelingPrompt: "كيف تريد أن تشعر؟",
    today: "اليوم",
    personal: "شخصي",
    family: "عائلي",
    featured: "مميز",
    meditation: "تأمل",
    mindfulness: "اليقظة",
    community: "المجتمع",
    points: "نقاط",
    level: "المستوى",
    stats: "إحصائيات",
    streak: "سلسلة الأيام",
    settings: "الإعدادات",
    notifications: "التنبيهات",
    language: "اللغة",
    searchPlaceholder: "بحث عن تأملات وتقنيات...",
    popularTopics: "مواضيع شائعة",
    dailyQuote: "حكمة اليوم",
    email: "البريد الإلكتروني",
    socialMedia: "وسائل التواصل",
    save: "حفظ",
    cancel: "إلغاء",
    editProfile: "تعديل الملف",
    changePhoto: "تغيير الصورة",
    addSocial: "إضافة حساب",
    groups: "المجموعات",
    myGroups: "مجموعاتي",
    joinGroup: "انضم لمجموعة",
    createGroup: "إنشاء مجموعة",
    enterGroupCode: "أدخل رمز المجموعة",
    groupName: "اسم المجموعة",
    roleManager: "مدير",
    roleMember: "عضو",
    groupFeed: "تغريدات المجموعة",
    noGroups: "لم تنضم لأي مجموعة بعد.",
    dailyTasks: "مهام اليوم",
    addTask: "إضافة مهمة",
    todoPlaceholder: "أضف مهمة لليوم...",
    dailyNotes: "ملاحظات اليوم",
    addNote: "إضافة ملاحظة",
    notePlaceholder: "اكتب ملاحظة جديدة...",
    achievements: "الإنجازات",
    analytics: "الإحصائيات",
    meditating: "جاري التأمل",
    notificationsCenter: "التنبيهات",
    darkMode: "الوضع الداكن",
    play: "تشغيل",
    pause: "إيقاف",
    completed: "مكتمل",
    totalFocus: "ساعات التركيز",
    journalStreak: "سلسلة التدوين",
    tasksRatio: "معدل النجاح",
    sleep: "النوم",
    focus: "التركيز",
    happiness: "السعادة",
    anxiety: "القلق",
    stress: "الضغط",
    calm: "الهدوء",
    morning: "الصباح",
    evening: "المساء",
    all: "الكل",
    recommendation: "توصية اليوم",
    loginTitle: "مرحباً بك في Control",
    loginDesc: "أدخل بياناتك لتبدأ رحلتك معنا",
    nameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "رقم الهاتف",
    sendCode: "إرسال كود التحقق",
    verifyCode: "تحقق وابدأ",
    enterCode: "أدخل الكود المكون من 6 أرقام",
    codeSentEmail: "تم إرسال كود التحقق لجهازك.",
    invalidCode: "الكود غير صحيح. حاول مرة أخرى.",
    getStarted: "ابدأ الآن",
    logout: "تسجيل الخروج",
  },
};

const INITIAL_TASKS = [
  {
    id: 1,
    title: { en: "Morning Gratitude", ar: "الامتنان الصباحي" },
    desc: {
      en: "Write down 3 things you are grateful for.",
      ar: "اكتب 3 أشياء تشعر بالامتنان لها.",
    },
    assigned: "JM",
    status: "completed",
  },
  {
    id: 2,
    title: { en: "Breathe Deeply", ar: "تنفس بعمق" },
    desc: {
      en: "Complete a 5-minute breathing exercise.",
      ar: "أكمل تمرين تنفس لمدة 5 دقائق.",
    },
    assigned: "AK",
    status: "active",
  },
  {
    id: 3,
    title: { en: "Evening Reflection", ar: "تأمل المساء" },
    desc: {
      en: "Reflect on the highlights of your day.",
      ar: "تأمل في أبرز لحظات يومك.",
    },
    assigned: "JM",
    status: "locked",
  },
];

const EXPLORE_ITEMS = [
  {
    id: 1,
    title: { en: "Inner Peace", ar: "السلام الداخلي" },
    type: { en: "Meditation", ar: "تأمل" },
    duration: "12 min",
    color: "#E0E0E0",
    category: "calm",
    icon: "🧘",
    featured: true,
  },
  {
    id: 2,
    title: { en: "Night Rain", ar: "مطر الليل" },
    type: { en: "Soundscape", ar: "طبيعة" },
    duration: "45 min",
    color: "#F5F5F5",
    category: "sleep",
    icon: "🌧️",
  },
  {
    id: 3,
    title: { en: "Ocean Waves", ar: "أمواج المحيط" },
    type: { en: "Sound", ar: "صوت" },
    duration: "30 min",
    color: "#EEEEEE",
    category: "relax",
    icon: "🌊",
  },
  {
    id: 4,
    title: { en: "Zen Focus", ar: "تركيز زين" },
    type: { en: "Music", ar: "موسيقى" },
    duration: "60 min",
    color: "#F0F0F0",
    category: "focus",
    icon: "🎹",
  },
  {
    id: 5,
    title: { en: "Mindful Breath", ar: "تنفس واعٍ" },
    type: { en: "Meditation", ar: "تأمل" },
    duration: "5 min",
    color: "#FAFAFA",
    category: "morning",
    icon: "🌬️",
  },
  {
    id: 6,
    title: { en: "Forest Walk", ar: "مشي في الغابة" },
    type: { en: "Guided", ar: "إرشاد" },
    duration: "20 min",
    color: "#E8E8E8",
    category: "anxiety",
    icon: "🌲",
  },
  {
    id: 7,
    title: { en: "Deep Sleep", ar: "نوم عميق" },
    type: { en: "Meditation", ar: "تأمل اليوم" },
    duration: "15 min",
    color: "#F2F2F2",
    category: "sleep",
    icon: "😴",
  },
  {
    id: 8,
    title: { en: "Mountain Air", ar: "هواء الجبل" },
    type: { en: "Breathing", ar: "تنفس" },
    duration: "10 min",
    color: "#F8F8F8",
    category: "morning",
    icon: "🏔️",
  },
  {
    id: 9,
    title: { en: "Summer Meadow", ar: "مرج الصيف" },
    type: { en: "Soundscape", ar: "موسيقى طبيعية" },
    duration: "30 min",
    color: "#EBEBEB",
    category: "relax",
    icon: "🌺",
  },
];

const formatDate = (date) => date.toISOString().split("T")[0];

const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  // Generate 14 days before and 14 days after today
  for (let i = -14; i <= 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate(),
      fullDate: formatDate(d),
      isToday: i === 0,
    });
  }
  return days;
};

const CALENDAR_DAYS = generateCalendarDays();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState("home");
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("lang");
    return saved || "en";
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [user, setUser] = useState(null);
  const [groupStats, setGroupStats] = useState({ completed: 0, total: 0 });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineBadge, setShowOnlineBadge] = useState(false);
  const [pwaInstallable, setPwaInstallable] = useState(false);

  // Listen for PWA install readiness from main.jsx
  useEffect(() => {
    const handler = () => setPwaInstallable(true);
    window.addEventListener('pwa-installable', handler);
    window.addEventListener('appinstalled', () => setPwaInstallable(false));
    // Check if prompt is already stored (page already loaded before React mounted)
    if (window.__pwaInstallPrompt) setPwaInstallable(true);
    return () => window.removeEventListener('pwa-installable', handler);
  }, []);


  const fetchProfile = async (userId, userEmail, metadataName, metadataImage) => {
    try {
      console.log("🔄 Fetching profile for:", userEmail);

      // Check if Supabase is properly configured
      if (!supabase) {
        console.error("❌ Supabase client not initialized");
        throw new Error("Supabase client not initialized");
      }

      // 1. Try to fetch profile from Supabase
      let existingProfile = null;
      let fetchError = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", userEmail)
          .maybeSingle();

        existingProfile = data;
        fetchError = error;

        if (fetchError) {
          console.error("⚠️ Supabase Profile Fetch Error:", fetchError);
          // Don't throw - we'll use local fallback
        } else {
          console.log("✅ Profile fetched from Supabase:", existingProfile);
        }
      } catch (networkError) {
        console.error("⚠️ Network error fetching profile:", networkError);
        // Continue with local fallback
      }

      // 2. Determine final user data (cloud or local fallback)
      const finalId = existingProfile?.id || userId;
      const finalName =
        existingProfile?.name || metadataName || userEmail.split("@")[0];
      const finalImage =
        existingProfile?.image_url ||
        metadataImage ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;

      const userData = {
        uid: finalId,
        email: userEmail,
        name: finalName,
        image: finalImage,
        level: existingProfile?.level || 1,
        points: existingProfile?.points || 0,
        streak: existingProfile?.streak || 0,
        socials: existingProfile?.socials || {
          instagram: "",
          twitter: "",
          facebook: "",
        },
        achievements: existingProfile?.achievements || [],
      };

      // 3. Set user state FIRST (so app works even if cloud sync fails)
      setUser(userData);
      setIsLoggedIn(true);
      console.log("✅ User state set:", userData);

      // 4. Store in local storage for offline access
      try {
        localStorage.setItem("userId", finalId);
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userName", finalName);
        localStorage.setItem("isLoggedIn", "true");
        console.log("✅ User data saved to localStorage");
      } catch (storageError) {
        console.warn("⚠️ localStorage error:", storageError);
      }

      // 5. Try to sync to cloud (non-blocking)
      try {
        const { error: upsertError } = await supabase.from("profiles").upsert(
          {
            id: finalId,
            email: userEmail,
            name: finalName,
            image_url: finalImage,
            level: userData.level,
            points: userData.points,
            streak: userData.streak,
            socials: userData.socials,
            achievements: userData.achievements,
          },
          { onConflict: "email" },
        );

        if (upsertError) {
          console.error("⚠️ Cloud Upsert Error:", upsertError);
          // Don't show alert - app still works with local data
        } else {
          console.log("✅ Profile synced to cloud");
        }
      } catch (syncError) {
        console.error("⚠️ Cloud sync failed:", syncError);
        // App continues to work with local data
      }
    } catch (err) {
      console.error("❌ Critical Profile Fetch Error:", err);

      // FALLBACK: Try to load from localStorage
      const savedUserId = localStorage.getItem("userId");
      const savedEmail = localStorage.getItem("userEmail");
      const savedName = localStorage.getItem("userName");

      if (savedUserId && savedEmail) {
        console.log("🔄 Loading from localStorage fallback");
        const fallbackUser = {
          uid: savedUserId,
          email: savedEmail,
          name: savedName || savedEmail.split("@")[0],
          image:
            "https://api.dicebear.com/7.x/initials/svg?seed=" +
            (savedName || savedEmail.split("@")[0]),
          level: 1,
          points: 0,
          streak: 0,
          socials: { instagram: "", twitter: "", facebook: "" },
          achievements: [],
        };

        setUser(fallbackUser);
        setIsLoggedIn(true);
        console.log("✅ Loaded from localStorage fallback");
      } else {
        // Only show error if we have no fallback data
        alert(
          lang === "en"
            ? "Error loading profile. Please try logging in again."
            : "خطأ في تحميل الملف الشخصي. الرجاء تسجيل الدخول مرة أخرى.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const [supabaseSession, setSupabaseSession] = useState(null);

  // ── Supabase Auth (Google OAuth) ──────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      if (session?.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User";
        const image = u.user_metadata?.avatar_url || u.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        fetchProfile(u.id, u.email, name, image);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (after OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      if (session?.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User";
        const image = u.user_metadata?.avatar_url || u.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        if (!user) fetchProfile(u.id, u.email, name, image);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [todoLists, setTodoLists] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_todos");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  // Store MY own FCM token so the journal alarm can trigger a push even when minimized
  const [myFcmToken, setMyFcmToken] = useState(null);

  // Helper to call the FCM API with any tokens (used by alarm + group notifications)
  const callFcmApi = async (tokens, title, body) => {
    if (!tokens || tokens.length === 0) return;
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/send-notification"
        : "/api/send-notification";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens, title, body }),
      });
      const result = await res.json();
      console.log("📡 FCM push result:", result);
    } catch (err) {
      console.warn("⚠️ FCM push failed (non-critical):", err.message);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchTodos();
      fetchJournals();
      fetchPinnedNotes();
      fetchGroupStats();
      fetchNotifications();
      
      // Delay requesting FCM token to ensure PWA Service Worker is fully active/ready
      setTimeout(() => {
        requestForToken().then(async (token) => {
          if (token) {
            setMyFcmToken(token);
            localStorage.setItem("my_fcm_token", token);

            // Save FCM token directly using primary key (user.uid)
            const { error } = await supabase
              .from("profiles")
              .update({ fcm_token: token })
              .eq("id", user.uid);

            if (!error) {
              console.log("✅ FCM Token saved to Supabase profiles successfully");
            } else {
              console.error("❌ Error saving FCM token:", error.message);
            }
          }
        });
      }, 1500);
    }
  }, [user?.uid]);

  // ── Local Notification Helper (browser Notification API) ─────────────────
  const sendLocalNotification = (title, body, icon = "/controll.app.png") => {
    // Play sound
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e) {}

    // Show browser notification safely
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") new Notification(title, { body, icon });
        });
      }
    }

    // Also add to in-app notifications list
    setNotifications(prev => [{
      id: Date.now(),
      type: "system",
      text: `${title}: ${body}`,
      time: lang === "en" ? "Just now" : "الآن",
      read: false,
    }, ...prev]);
  };

  // Handle incoming messages while the app is open - persistent listener (FCM fallback)
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔔 FCM Notification received in foreground:", payload);
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (audioErr) {}
      const newNotif = {
        id: Date.now(),
        type: "system",
        text: (payload.notification?.title || "") + ": " + (payload.notification?.body || ""),
        time: lang === "en" ? "Just now" : "الآن",
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    });
    return () => unsubscribe();
  }, [messaging]);

  // ── Supabase Realtime Notification Listener ─────────────────────────
  // This is the PRIMARY notification system (works on localhost & HTTPS).
  // It listens for new rows in group_notifications and shows browser alerts.
  useEffect(() => {
    if (!user?.uid) return;

    const channel = supabase
      .channel(`user_notifications_${user.uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_notifications" },
        (payload) => {
          const notif = payload.new;

          // Skip: notification sent by THIS user (they don't notify themselves)
          if (notif.sender_id === user.uid) return;

          // Skip: notification targeted at a SPECIFIC other user (not us)
          if (notif.recipient_id && notif.recipient_id !== user.uid) return;

          console.log("🔔 Realtime notification received:", notif.title, notif.body);

          // 1. Play sound
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
            audio.volume = 0.7;
            audio.play().catch(() => {});
          } catch (e) {}

          // 2. Show browser notification safely (if permission granted)
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(notif.title, {
              body: notif.body,
              icon: "/controll.app.png",
              badge: "/controll.app.png",
              tag: notif.id,  // prevent duplicate popups
            });
          }

          // 3. Add to in-app notification list
          setNotifications(prev => [{
            id: notif.id || Date.now(),
            type: notif.type || "system",
            text: `${notif.title}: ${notif.body}`,
            time: lang === "en" ? "Just now" : "الآن",
            read: false,
          }, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime notification channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const fetchNotifications = async () => {
    if (!user?.uid) return;
    try {
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.uid);

      const groupIds = memberGroups ? memberGroups.map(g => g.group_id) : [];

      let query = supabase
        .from("group_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (groupIds.length > 0) {
        query = query.or(`recipient_id.eq.${user.uid},group_id.in.(${groupIds.map(id => `"${id}"`).join(",")})`);
      } else {
        query = query.eq("recipient_id", user.uid);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const filtered = data.filter(n => {
          if (n.sender_id === user.uid) return false;
          if (n.recipient_id && n.recipient_id !== user.uid) return false;
          return true;
        });

        const formatted = filtered.map(n => {
          let timeStr = lang === "en" ? "Just now" : "الآن";
          if (n.created_at) {
            try {
              timeStr = new Date(n.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ar-EG", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
            } catch (e) {}
          }
          return {
            id: n.id || Date.now(),
            type: n.type || "system",
            text: `${n.title}: ${n.body}`,
            time: timeStr,
            read: true,
          };
        });

        setNotifications(formatted);
        localStorage.setItem("cached_notifications", JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn("⚠️ Fetch notifications failed (non-critical):", err.message);
      const saved = localStorage.getItem("cached_notifications");
      if (saved) setNotifications(JSON.parse(saved));
    }
  };

  const fetchTodos = async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.uid);

      if (error) {
        console.error("Fetch Todos Error:", error);
        throw error;
      }

      if (data) {
        const formatted = {};
        data.forEach((t) => {
          const todoDate = t.date || "no-date";
          if (!formatted[todoDate]) formatted[todoDate] = [];
          formatted[todoDate].push({
            ...t,
            text: t.text || t.title || "", // Support both column names
          });
        });
        setTodoLists(formatted);
        localStorage.setItem("cached_todos", JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn("Offline fallback for fetchTodos:", err);
      const saved = localStorage.getItem("cached_todos");
      if (saved) setTodoLists(JSON.parse(saved));
    }
  };

  const fetchJournals = async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", user.uid);

      if (error) {
        console.error("Fetch Journals Error:", error);
        throw error;
      }

      if (data) {
        const formatted = {};
        data.forEach((j) => {
          try {
            formatted[j.date] =
              typeof j.content === "string" ? JSON.parse(j.content) : j.content;
          } catch (e) {
            console.error("Journal parse error for date:", j.date, e);
            formatted[j.date] = { entries: [] };
          }
        });
        setJournals(formatted);
        localStorage.setItem("cached_journals", JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn("Offline fallback for fetchJournals:", err);
      const saved = localStorage.getItem("cached_journals");
      if (saved) setJournals(JSON.parse(saved));
    }
  };

  const fetchPinnedNotes = async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await supabase
        .from("pinned_notes")
        .select("*")
        .eq("user_id", user.uid);

      if (error) {
        console.error("Fetch PinnedNotes Error:", error);
        throw error;
      }

      if (data) {
        const formatted = {};
        data.forEach((n) => {
          const noteDate = n.date || selectedDate; // Fallback if date is missing
          if (!formatted[noteDate]) formatted[noteDate] = [];
          formatted[noteDate].push(n);
        });
        setAllPinnedNotes(formatted);
        localStorage.setItem("cached_pinned_notes", JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn("Offline fallback for fetchPinnedNotes:", err);
      const saved = localStorage.getItem("cached_pinned_notes");
      if (saved) setAllPinnedNotes(JSON.parse(saved));
    }
  };

  const fetchGroupStats = async () => {
    try {
      // Get all tasks completed by this user in any group
      const { data: completedData } = await supabase
        .from("group_tasks")
        .select("id")
        .eq("completed_by", user.uid)
        .eq("status", "completed");

      // Get all tasks assigned to this user (for success rate)
      const { data: totalData } = await supabase
        .from("group_tasks")
        .select("id")
        .eq("assigned_to", user.uid);

      setGroupStats({
        completed: completedData?.length || 0,
        total: totalData?.length || 0,
      });
    } catch (e) {
      console.error("Error fetching group stats:", e);
    }
  };
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeMeditation, setActiveMeditation] = useState(null);
  const [meditationHistory, setMeditationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("meditationHistory");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing meditationHistory:", e);
      return [];
    }
  });

  const recordMeditationCompletion = async (item) => {
    const newEntry = {
      id: Date.now(),
      title: item.title,
      date: formatDate(new Date()),
      duration: parseInt(item.duration) || 0,
    };
    const updated = [newEntry, ...meditationHistory];
    setMeditationHistory(updated);
    localStorage.setItem("meditationHistory", JSON.stringify(updated));

    // Award 10 water drops to the gardens of all groups the user is in
    if (user?.uid && groups && groups.length > 0) {
      for (const g of groups) {
        if (!g.id) continue;
        try {
          // Check if garden exists
          const { data: garden } = await supabase
            .from("group_gardens")
            .select("*")
            .eq("group_id", g.id)
            .maybeSingle();

          if (garden) {
            await supabase
              .from("group_gardens")
              .update({ water_drops: garden.water_drops + 10 })
              .eq("group_id", g.id);
          } else {
            await supabase
              .from("group_gardens")
              .insert([{ group_id: g.id, water_drops: 10, level: 1, experience: 0 }]);
          }

          // Format notifications
          const titleAr = `💧 تم شحن الحديقة الرقمية!`;
          const bodyAr = `أكمل ${user.name || "عضو"} جلسة تأمل وشحن الحديقة بـ 10 قطرات ماء!`;
          const titleEn = `💧 Garden charged!`;
          const bodyEn = `${user.name || "A member"} completed a meditation and earned 10 water drops for the garden!`;

          // Log in activities
          await supabase.from("group_activities").insert([
            {
              group_id: g.id,
              user_id: user.uid,
              action_type: "meditation_completed",
              content: typeof item.title === "string" ? item.title : (item.title[lang] || item.title.en || "Meditation Session"),
            },
          ]);

          // Send realtime notification (broadcasting to others in app)
          await supabase.from("group_notifications").insert([
            {
              group_id: g.id,
              sender_id: user.uid,
              title: lang === "ar" ? titleAr : titleEn,
              body: lang === "ar" ? bodyAr : bodyEn,
              type: "garden_water",
            },
          ]);
        } catch (e) {
          console.error("❌ Error updating garden for group:", g.id, e);
        }
      }
    }
  };
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    if (user?.uid) {
      fetchGroups();
    }
  }, [user?.uid]);

  const fetchGroups = async () => {
    if (!user?.uid) return;
    const { data, error } = await supabase
      .from("group_members")
      .select("*")
      .eq("user_id", user.uid);

    if (data) {
      const formatted = data.map((item) => ({
        ...item.groups,
        role: item.role,
        updates: [], // These could be fetched separately
        tasks: [], // These could be fetched separately
      }));
      setGroups(formatted);
      if (formatted.length > 0 && !activeGroupId) {
        setActiveGroupId(formatted[0].id);
      }
    }
  };
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [journals, setJournals] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_journals");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [allPinnedNotes, setAllPinnedNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("cached_pinned_notes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const pinnedNotes = allPinnedNotes[selectedDate] || [];

  const setPinnedNotes = async (newNotes) => {
    const updated = { ...allPinnedNotes, [selectedDate]: newNotes };
    setAllPinnedNotes(updated);

    if (!user?.uid) return;

    // For pinned notes, it's easier to manage via individual rows in Supabase
    // But for this legacy-to-supabase transition, we'll sync the whole date if needed or handle separately.
    // Let's try individual for better performance.
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const toggleLang = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const updateProfile = async (newData) => {
    if (!user?.uid) return;
    try {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);

      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (lsError) {
        console.warn(
          "Storage Error: Profile image might be too large for localStorage.",
        );
      }

      // Sync to Supabase using Email as conflict key to prevent duplicates
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.uid,
          email: user.email,
          name: updatedUser.name,
          image_url: updatedUser.image,
          socials: updatedUser.socials,
        },
        { onConflict: "email" },
      );

      if (error) {
        console.error("Supabase Profile Sync Error:", error);
        alert(
          lang === "en"
            ? `Cloud Sync Failed: ${error.message}`
            : `فشل المزامنة السحابية: ${error.message}`,
        );
      }
    } catch (err) {
      console.error("Update Profile Error:", err);
      alert(
        lang === "en"
          ? "Unexpected Error during sync"
          : "خطأ غير متوقع أثناء المزامنة",
      );
    }
  };

  const addUpdateToGroup = (groupId, text, image = null) => {
    const newGroups = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          updates: [
            {
              id: Date.now(),
              user: user.name,
              text,
              image,
              time: "Just now",
            },
            ...g.updates,
          ],
        };
      }
      return g;
    });
    setGroups(newGroups);
    localStorage.setItem("groups", JSON.stringify(newGroups));
  };

  const createGroup = (name) => {
    const newGroup = {
      id: "g" + Date.now(),
      name,
      role: "manager",
      code: Math.random().toString(36).substring(7).toUpperCase(),
      updates: [],
      tasks: [],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    localStorage.setItem("groups", JSON.stringify(updated));
    setActiveGroupId(newGroup.id);
  };

  const joinGroup = (code) => {
    const existing = groups.find(
      (g) => g.code.toUpperCase() === code.toUpperCase(),
    );
    if (existing) {
      setActiveGroupId(existing.id);
      alert(
        lang === "en"
          ? `Switched to group: ${existing.name}`
          : `تم الانتقال إلى المجموعة: ${existing.name}`,
      );
      return;
    }
    // For demo purposes, we create a new entry if code not found
    const newGroup = {
      id: "g" + Date.now(),
      name: lang === "en" ? "New Community" : "مجتمع جديد",
      role: "member",
      code: code.toUpperCase(),
      members: [
        { id: "u1", name: user.name, initials: "YO" },
        { id: "u4", name: "System", initials: "SY" },
      ],
      updates: [],
      tasks: [],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    localStorage.setItem("groups", JSON.stringify(updated));
    setActiveGroupId(newGroup.id);
    alert(
      lang === "en"
        ? "Successfully joined a new group!"
        : "تم الانضمام لمجموعة جديدة بنجاح!",
    );
  };

  const updateGroupTask = async (groupId, taskId, status) => {
    // Legacy logic for state
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        const newTasks = g.tasks.map((t) => {
          if (t.id === taskId) {
            if (status === "completed" && t.assignedId !== user.uid) {
              alert(
                lang === "en"
                  ? "Only the assigned member can complete this task!"
                  : "يمكن للعضو المكلف فقط إكمال هذه المهمة!",
              );
              return t;
            }
            return { ...t, status };
          }
          return t;
        });
        return { ...g, tasks: newTasks };
      }
      return g;
    });
    setGroups(updated);

    // Supabase update
    await supabase
      .from("todos")
      .update({ completed: status === "completed" })
      .eq("id", taskId);
  };

  const addGroupTask = (groupId, taskData) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        const newTask = { id: Date.now(), status: "active", ...taskData };
        return { ...g, tasks: [...g.tasks, newTask] };
      }
      return g;
    });
    setGroups(updated);
    localStorage.setItem("groups", JSON.stringify(updated));
  };

  // ── UUID generator for offline created notes ─────────────────────────
  const generateUUID = () => {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // ── Offline Queue Manager ──────────────────────────────────────────
  const queueOfflineAction = (action) => {
    try {
      const queueStr = localStorage.getItem("offline_sync_queue");
      const queue = queueStr ? JSON.parse(queueStr) : [];
      queue.push(action);
      localStorage.setItem("offline_sync_queue", JSON.stringify(queue));
      console.log("📥 Action queued offline:", action.type);
    } catch (e) {
      console.error("Failed to queue offline action:", e);
    }
  };

  const processOfflineQueue = async () => {
    if (!navigator.onLine || !user?.uid) return;
    const queueStr = localStorage.getItem("offline_sync_queue");
    if (!queueStr) return;
    
    let queue = [];
    try {
      queue = JSON.parse(queueStr);
    } catch (e) {
      console.error("Error parsing offline sync queue:", e);
      return;
    }
    
    if (queue.length === 0) return;
    
    console.log(`🔄 Processing ${queue.length} offline actions...`);
    
    for (const action of queue) {
      try {
        if (action.type === "save_journal") {
          await supabase.from("journals").upsert(
            {
              user_id: user.uid,
              date: action.date,
              content: JSON.stringify(action.entries),
            },
            { onConflict: "user_id,date" }
          );
        } else if (action.type === "save_todos") {
          await supabase
            .from("todos")
            .delete()
            .eq("user_id", user.uid)
            .eq("date", action.date);
            
          if (action.todos.length > 0) {
            const toInsert = action.todos.map((t) => ({
              user_id: user.uid,
              date: action.date,
              text: t.text,
              completed: t.completed,
            }));
            await supabase.from("todos").insert(toInsert);
          }
        } else if (action.type === "add_note") {
          await supabase.from("pinned_notes").insert([action.note]);
        } else if (action.type === "update_note") {
          await supabase
            .from("pinned_notes")
            .update(action.fields)
            .eq("id", action.id)
            .eq("user_id", user.uid);
        } else if (action.type === "delete_note") {
          await supabase
            .from("pinned_notes")
            .delete()
            .eq("id", action.id);
        }
      } catch (err) {
        console.error("Error processing queue action:", action, err);
        if (!navigator.onLine) break; 
      }
    }
    
    localStorage.removeItem("offline_sync_queue");
    console.log("✅ Offline sync queue processed successfully");
  };

  const [dailyHabits, setDailyHabits] = useState(() => {
    try {
      const saved = localStorage.getItem("dailyHabits");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error parsing dailyHabits:", e);
      return {};
    }
  });

  const saveDailyHabit = async (date, habit) => {
    const updated = { ...dailyHabits, [date]: habit };
    setDailyHabits(updated);
    localStorage.setItem("dailyHabits", JSON.stringify(updated));
  };

  const saveJournal = async (date, entries) => {
    const updatedJournals = { ...journals, [date]: entries };
    setJournals(updatedJournals);
    localStorage.setItem("cached_journals", JSON.stringify(updatedJournals));
    
    if (!user?.uid) return;

    if (!navigator.onLine) {
      queueOfflineAction({ type: "save_journal", date, entries });
      return;
    }

    try {
      const { error } = await supabase.from("journals").upsert(
        {
          user_id: user.uid,
          date,
          content: JSON.stringify(entries),
        },
        { onConflict: "user_id,date" },
      );
      if (error) {
        console.error("Journal Save Error, queuing:", error);
        queueOfflineAction({ type: "save_journal", date, entries });
      }
    } catch (err) {
      console.error("Unexpected saveJournal error, queuing:", err);
      queueOfflineAction({ type: "save_journal", date, entries });
    }
  };

  const saveTodos = async (date, todos) => {
    const updatedTodos = { ...todoLists, [date]: todos };
    setTodoLists(updatedTodos);
    localStorage.setItem("cached_todos", JSON.stringify(updatedTodos));
    
    if (!user?.uid) return;

    if (!navigator.onLine) {
      queueOfflineAction({ type: "save_todos", date, todos });
      return;
    }

    try {
      const { error: delError } = await supabase
        .from("todos")
        .delete()
        .eq("user_id", user.uid)
        .eq("date", date);

      if (delError) throw delError;

      if (todos.length > 0) {
        const toInsert = todos.map((t) => ({
          user_id: user.uid,
          date,
          text: t.text,
          completed: t.completed,
        }));
        const { error: insError } = await supabase
          .from("todos")
          .insert(toInsert);
        if (insError) throw insError;
      }
    } catch (err) {
      console.error("Unexpected saveTodos error, queuing:", err);
      queueOfflineAction({ type: "save_todos", date, todos });
    }
  };

  const addPinnedNote = async (title, content) => {
    if (!user?.uid) return null;
    
    const noteId = generateUUID();
    const newNote = {
      id: noteId,
      date: selectedDate,
      user_id: user.uid,
      title: title || "",
      content: content || "",
      color: "#394867",
      pinned: true,
    };

    const updatedForDate = [newNote, ...pinnedNotes];
    const updatedAllNotes = {
      ...allPinnedNotes,
      [selectedDate]: updatedForDate,
    };
    setAllPinnedNotes(updatedAllNotes);
    localStorage.setItem("cached_pinned_notes", JSON.stringify(updatedAllNotes));

    if (!navigator.onLine) {
      queueOfflineAction({ type: "add_note", note: newNote });
      return noteId;
    }

    try {
      const { error } = await supabase
        .from("pinned_notes")
        .insert([newNote]);

      if (error) {
        console.error("Add PinnedNote Error, queuing:", error);
        queueOfflineAction({ type: "add_note", note: newNote });
      }
    } catch (err) {
      console.error("Unexpected addPinnedNote error, queuing:", err);
      queueOfflineAction({ type: "add_note", note: newNote });
    }
    return noteId;
  };

  const updatePinnedNote = async (id, fields) => {
    if (!user?.uid) return false;

    const updatedForDate = pinnedNotes.map((n) => 
      n.id === id ? { ...n, ...fields } : n
    );
    const updatedAllNotes = {
      ...allPinnedNotes,
      [selectedDate]: updatedForDate,
    };
    setAllPinnedNotes(updatedAllNotes);
    localStorage.setItem("cached_pinned_notes", JSON.stringify(updatedAllNotes));

    if (!navigator.onLine) {
      queueOfflineAction({ type: "update_note", id, fields });
      return true;
    }

    try {
      const { error } = await supabase
        .from("pinned_notes")
        .update(fields)
        .eq("id", id)
        .eq("user_id", user.uid);
      
      if (error) {
        console.error("Update PinnedNote Error, queuing:", error);
        queueOfflineAction({ type: "update_note", id, fields });
      }
    } catch (err) {
      console.error("Unexpected updatePinnedNote error, queuing:", err);
      queueOfflineAction({ type: "update_note", id, fields });
    }
    return true;
  };

  const deletePinnedNote = async (id) => {
    if (!user?.uid) return;

    const updatedForDate = pinnedNotes.filter((n) => n.id !== id);
    const updatedAllNotes = {
      ...allPinnedNotes,
      [selectedDate]: updatedForDate,
    };
    setAllPinnedNotes(updatedAllNotes);
    localStorage.setItem("cached_pinned_notes", JSON.stringify(updatedAllNotes));

    if (!navigator.onLine) {
      queueOfflineAction({ type: "delete_note", id });
      return;
    }

    try {
      const { error } = await supabase
        .from("pinned_notes")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Delete PinnedNote Error, queuing:", error);
        queueOfflineAction({ type: "delete_note", id });
      }
    } catch (err) {
      console.error("Unexpected deletePinnedNote error, queuing:", err);
      queueOfflineAction({ type: "delete_note", id });
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineBadge(true);
      setTimeout(() => setShowOnlineBadge(false), 3000);
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Run once on load to sync any leftover queue
    if (navigator.onLine) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user?.uid]);

  const renderScreen = () => {
    const commonProps = {
      setScreen,
      lang,
      toggleLang,
      t,
      user,
      updateProfile,
      selectedDate,
    };
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            {...commonProps}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            journals={journals}
            saveJournal={saveJournal}
            notifications={notifications}
            pinnedNotes={pinnedNotes}
            setPinnedNotes={setPinnedNotes}
            addPinnedNote={addPinnedNote}
            deletePinnedNote={deletePinnedNote}
            updatePinnedNote={updatePinnedNote}
            setActiveMeditation={setActiveMeditation}
            dailyHabit={dailyHabits[selectedDate]}
            saveDailyHabit={saveDailyHabit}
          />
        );
      case "details":
        return (
          <JournalDetailsScreen
            {...commonProps}
            selectedDate={selectedDate}
            journals={journals}
            saveJournal={saveJournal}
            todoLists={todoLists}
            saveTodos={saveTodos}
            addPinnedNote={addPinnedNote}
          />
        );
      case "notifications":
        return (
          <NotificationScreen
            {...commonProps}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        );
      case "analytics":
        return (
          <AnalyticsScreen
            {...commonProps}
            journals={journals}
            todoLists={todoLists}
            meditationHistory={meditationHistory}
            groupStats={groupStats}
            setScreen={setScreen}
          />
        );
      case "explore":
        return (
          <ExploreScreen
            {...commonProps}
            activeMeditation={activeMeditation}
            setActiveMeditation={setActiveMeditation}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            {...commonProps}
            theme={theme}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            journals={journals}
          />
        );
      case "groups":
        return (
          <GroupsScreen t={t} lang={lang} setScreen={setScreen} user={user} />
        );
      case "all-journals":
        return <AllJournalsScreen {...commonProps} journals={journals} />;
      default:
        return (
          <HomeScreen
            {...commonProps}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            journals={journals}
          />
        );
    }
  };

  const handleLogin = async (userData) => {
    setLoading(true);
    try {
      // 1. Strict Email Check: Find existing user id
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("email", userData.email)
        .maybeSingle();

      const userId =
        existingProfile?.id ||
        (function () {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            },
          );
        })();

      // 2. Prep storage
      localStorage.clear();
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userId", userId);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("lang", lang);
      localStorage.setItem("theme", theme);

      // 3. Fetch (and lock name if exists)
      await fetchProfile(userId, userData.email, userData.name);
    } catch (err) {
      console.error("Login Error:", err);
      alert("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setSession(null);
    setSupabaseSession(null);
    setUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    setScreen("home");
  };

  if (loading) {
    return (
      <div
        className={`app-shell theme-${theme}`}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2 className="spinner" size={48} style={{ color: "var(--primary-light)" }} />
          <p style={{ marginTop: 12, color: "var(--text-dim)", fontSize: 14 }}>Loading Control…</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <GoogleAuthScreen
        lang={lang}
        theme={theme}
        toggleTheme={toggleTheme}
        toggleLang={toggleLang}
      />
    );
  }

  // ── Main authenticated app ─────────────────────────────────────────────────
  return (
    <div className={`app-shell ${lang === "ar" ? "rtl" : ""} theme-${theme}`}>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              background: "rgba(231, 76, 60, 0.95)",
              color: "white",
              textAlign: "center",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: "500",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
              direction: lang === "ar" ? "rtl" : "ltr"
            }}
          >
            <WifiOff size={16} />
            <span>
              {lang === "ar" 
                ? "أنت تعمل بدون اتصال بالإنترنت حالياً. تم حفظ تعديلاتك محلياً وسيتم مزامنتها تلقائياً عند عودة الاتصال."
                : "You are working offline. Changes saved locally and will sync when connection is restored."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnlineBadge && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              background: "rgba(46, 204, 113, 0.95)",
              color: "white",
              textAlign: "center",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: "500",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
              direction: lang === "ar" ? "rtl" : "ltr"
            }}
          >
            <Wifi size={16} />
            <span>
              {lang === "ar" 
                ? "تم استعادة الاتصال بالإنترنت! جاري مزامنة التعديلات مع السحابة..."
                : "Connection restored! Synchronizing local changes with the cloud..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar (tablet + desktop only, hidden on mobile via CSS) ── */}
      <nav className="sidebar-nav">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: "transparent" }}>
            <img src="/controll.app.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span>Control</span>
        </div>
        <button className={`sidebar-btn ${screen === "home" ? "active" : ""}`} onClick={() => setScreen("home")}>
          <Home size={18} />{t.home}
        </button>
        <button className={`sidebar-btn ${screen === "explore" ? "active" : ""}`} onClick={() => setScreen("explore")}>
          <Compass size={18} />{t.explore}
        </button>
        <button className={`sidebar-btn ${screen === "iai" ? "active" : ""}`} onClick={() => setScreen("iai")}>
          <img src="/app2.ai.png" alt="IAI" style={{ width: 18, height: 18, marginRight: 12 }} />IAI
        </button>
        <button className={`sidebar-center-btn ${screen === "groups" ? "active" : ""}`} onClick={() => setScreen("groups")}>
          <Users size={18} />{lang === "ar" ? "المجموعات" : "Groups"}
        </button>
        <div className="sidebar-spacer" />

        {/* ── PWA Install Button ── */}
        {pwaInstallable && (
          <button
            className="sidebar-btn"
            onClick={async () => {
              const prompt = window.__pwaInstallPrompt;
              if (prompt) {
                prompt.prompt();
                const { outcome } = await prompt.userChoice;
                if (outcome === 'accepted') {
                  window.__pwaInstallPrompt = null;
                  setPwaInstallable(false);
                }
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #1D546D, #2980b9)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              margin: '4px 8px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(29,84,109,0.4)',
              animation: 'pulse 2s infinite',
            }}
            title={lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          >
            <Wifi size={16} />
            {lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        )}

        <button className={`sidebar-btn ${screen === "profile" ? "active" : ""}`} onClick={() => setScreen("profile")}>
          <User size={18} />{t.profile}
        </button>
      </nav>

      {/* ── Main content ── */}
      <AnimatePresence mode="wait">
        {screen !== "iai" && (
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="page-content"
          >
            {renderScreen()}
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="page-content" 
        style={{ 
          display: screen === "iai" ? "block" : "none",
          animation: screen === "iai" ? "fadeIn 0.2s ease-out forwards" : "none" 
        }}
      >
        <IAIScreen 
          lang={lang} 
          t={t} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          addPinnedNote={addPinnedNote} 
          pinnedNotes={pinnedNotes}
          updatePinnedNote={updatePinnedNote}
        />
      </div>

      {activeMeditation && (
        <MiniPlayer
          key={activeMeditation.id}
          t={t}
          lang={lang}
          item={activeMeditation}
          onClose={() => setActiveMeditation(null)}
          onComplete={() => {
            recordMeditationCompletion(activeMeditation);
            sendLocalNotification(
              lang === "en" ? "🧘 Session Complete!" : "🧘 انتهت الجلسة!",
              lang === "en"
                ? `"${activeMeditation.title[lang] || activeMeditation.title.en}" has finished. Great work!`
                : `انتهت جلسة "${activeMeditation.title[lang] || activeMeditation.title.ar}". عمل رائع!`
            );
          }}
        />
      )}

      {/* ── Bottom nav (mobile only, hidden ≥768px via CSS) ── */}
      <nav className="bottom-nav">
        <button onClick={() => setScreen("home")} className={screen === "home" ? "active" : ""}>
          <Home size={22} /><span>{t.home}</span>
        </button>
        <button onClick={() => setScreen("explore")} className={screen === "explore" ? "active" : ""}>
          <Compass size={22} /><span>{t.explore}</span>
        </button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <button className="add-btn" onClick={() => setScreen("groups")}><Users size={28} /></button>
        </div>
        <button onClick={() => setScreen("iai")} className={screen === "iai" ? "active" : ""}>
          <img src="/app2.ai.png" alt="IAI" style={{ width: 22, height: 22 }} /><span>IAI</span>
        </button>
        <button onClick={() => setScreen("profile")} className={screen === "profile" ? "active" : ""}>
          <User size={22} /><span>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}



function AuthScreen({ t, lang, onLogin, theme, toggleTheme }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [code, setCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // IMPORTANT: Check if email already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("email", formData.email)
        .maybeSingle();

      // If email exists, inform user they're logging into existing account
      if (existingUser) {
        console.log("Existing user found:", existingUser.name);
        // Continue with OTP - they're logging into their existing account
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Use localhost:3001 for development, /api/send-otp for production
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/send-otp"
        : "/api/send-otp";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep(2);
        // Show message if logging into existing account
        if (existingUser) {
          setError(
            lang === "en"
              ? `Welcome back, ${existingUser.name}! Logging into your existing account.`
              : `مرحباً بعودتك، ${existingUser.name}! تسجيل الدخول إلى حسابك الحالي.`,
          );
        }
      } else {
        throw new Error(data.error || "Failed to send code");
      }
    } catch (err) {
      console.error("Send Error:", err);
      setError(
        lang === "en"
          ? "Server Error: Make sure Email settings are configured in Vercel."
          : "خطأ في السيرفر: تأكد من إعدادات الإيميل في Vercel.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code === generatedOtp) {
      onLogin(formData);
    } else {
      setError(t.invalidCode);
    }
  };

  return (
    <div
      className="auth-screen fade-in"
      style={{
        padding: "20px 24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        paddingTop: "20px",
        position: "relative",
      }}
    >
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0,0,0,0.05)",
          border: "none",
          borderRadius: "12px",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: theme === "dark" ? "white" : "black",
          zIndex: 10,
        }}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div style={{ textAlign: "center", marginBottom: "0px" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto -60px",
          }}
        >
          <img
            src="/controll.app.png"
            alt="Control Logo"
            style={{
              width: "380px",
              height: "auto",
              filter:
                theme === "dark"
                  ? "none"
                  : "drop-shadow(0 10px 25px rgba(0,0,0,0.08))",
            }}
          />
        </motion.div>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            color: "var(--text-main)",
            marginBottom: "4px",
            letterSpacing: "-1px",
          }}
        >
          {t.loginTitle}
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: "1rem",
            lineHeight: "1.5",
          }}
        >
          {t.loginDesc}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSendCode}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div className="input-group">
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  marginBottom: "8px",
                  paddingLeft: "5px",
                }}
              >
                {t.nameLabel}
              </label>
              <input
                required
                type="text"
                placeholder="Yousif Hassan"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  ...editInputStyle(lang),
                  backgroundColor: "var(--card-bg, white)",
                  boxShadow: "var(--shadow-soft)",
                }}
              />
            </div>
            <div className="input-group">
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  marginBottom: "8px",
                  paddingLeft: "5px",
                }}
              >
                {t.emailLabel}
              </label>
              <input
                required
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                style={{
                  ...editInputStyle(lang),
                  backgroundColor: "var(--card-bg, white)",
                  boxShadow: "var(--shadow-soft)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn"
              style={{
                padding: "18px",
                borderRadius: "20px",
                border: "none",
                background: "var(--primary-light)",
                color: "white",
                fontWeight: 700,
                fontSize: "1.1rem",
                marginTop: "10px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(98, 159, 173, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {loading ? (
                <div
                  className="spinner"
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "auth-spin 0.8s linear infinite",
                  }}
                />
              ) : (
                t.sendCode
              )}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleVerify}
            style={{ display: "flex", flexDirection: "column", gap: "25px" }}
          >
            <div
              style={{
                textAlign: "center",
                backgroundColor: "rgba(211, 84, 0, 0.08)",
                padding: "20px",
                borderRadius: "24px",
                color: "#D35400",
                fontSize: "0.95rem",
                fontWeight: 600,
                border: "1px dashed rgba(211, 84, 0, 0.2)",
              }}
            >
              {t.codeSentEmail}
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  marginBottom: "12px",
                  textAlign: "center",
                }}
              >
                {t.enterCode}
              </label>
              <input
                required
                maxLength={6}
                autoFocus
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  ...editInputStyle(lang),
                  backgroundColor: "var(--card-bg, white)",
                  letterSpacing: "12px",
                  textAlign: "center",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  height: "70px",
                  color: "#D35400",
                }}
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: "#E63946",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  fontWeight: 600,
                  marginTop: "-15px",
                }}
              >
                {error}
              </motion.div>
            )}
            <button
              type="submit"
              className="primary-btn"
              style={{
                padding: "18px",
                borderRadius: "20px",
                border: "none",
                background: "#D35400",
                color: "white",
                fontWeight: 700,
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(211, 84, 0, 0.25)",
              }}
            >
              {t.verifyCode}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  textDecoration: "underline",
                }}
              >
                {lang === "en" ? "Edit Details" : "تعديل البيانات"}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-light)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {lang === "en" ? "Resend Code" : "إعادة إرسال"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
        .primary-btn:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}

function HomeScreen({
  setScreen,
  selectedDate,
  setSelectedDate,
  journals,
  lang,
  toggleLang,
  t,
  user,
  notifications,
  pinnedNotes,
  setPinnedNotes,
  addPinnedNote,
  deletePinnedNote,
  updatePinnedNote,
  setActiveMeditation,
  saveJournal,
  dailyHabit,
  saveDailyHabit,
}) {
  const dayData = journals[selectedDate] || {};
  const currentJournalEntries = Array.isArray(dayData)
    ? dayData
    : dayData.entries || [];
  const journalTitle = dayData.title || "";
  const journalImage = dayData.image || "";
  const journalReminder = dayData.reminder || "";

  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const [tempJournalData, setTempJournalData] = useState({
    title: "",
    image: "",
    reminder: "",
    text: "",
  });
  const [tempHabit, setTempHabit] = useState(null);

  const lastEntry = currentJournalEntries[currentJournalEntries.length - 1];
  const lastEntryText = lastEntry ? lastEntry.text : "";
  const scrollRef = useRef(null);

  const activeHabit =
    dailyHabit ||
    EXPLORE_ITEMS[new Date(selectedDate).getDate() % EXPLORE_ITEMS.length];
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingNoteId, setRecordingNoteId] = useState(null);
  const [showAlarmNotification, setShowAlarmNotification] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const updateNoteTitle = (id, newTitle) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, title: newTitle } : n,
    );
    setPinnedNotes(updated);
    updatePinnedNote(id, { title: newTitle });
  };

  const updateNoteContent = (id, newContent) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, content: newContent } : n,
    );
    setPinnedNotes(updated);
    updatePinnedNote(id, { content: newContent });
  };

  const updateNoteImage = (id, imageUrl) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, image: imageUrl, hasImage: !!imageUrl } : n,
    );
    setPinnedNotes(updated);
    updatePinnedNote(id, { image: imageUrl, hasImage: !!imageUrl });
  };

  const updateNoteColor = (id, color) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, color: color } : n,
    );
    setPinnedNotes(updated);
    updatePinnedNote(id, { color });
  };

  const updateNoteLink = (id, link) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, link: link } : n,
    );
    setPinnedNotes(updated);
    updatePinnedNote(id, { link });
  };

  const handleAddNote = async () => {
    const newId = await addPinnedNote();
    if (newId) setExpandedNoteId(newId);
  };

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNoteImage(id, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async (noteId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        const updated = pinnedNotes.map((n) =>
          n.id === noteId ? { ...n, audioUrl: audioUrl, hasVoice: true } : n,
        );
        setPinnedNotes(updated);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingNoteId(noteId);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        lang === "en"
          ? "Could not access microphone"
          : "لا يمكن الوصول للميكروفون",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingNoteId(null);
    }
  };

  const deleteAudio = (noteId) => {
    const updated = pinnedNotes.map((n) =>
      n.id === noteId ? { ...n, audioUrl: null, hasVoice: false } : n,
    );
    setPinnedNotes(updated);
  };

  const expandedNote = pinnedNotes.find((n) => n.id === expandedNoteId);

  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector(".calendar-day.active");
      if (todayEl) {
        todayEl.scrollIntoView({
          behavior: "auto",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, []);

  // Alarm functionality
  useEffect(() => {
    if (!journalReminder) return;

    // Only run alarm for today's date
    const today = formatDate(new Date());
    if (selectedDate !== today) return;

    let hasTriggered = false;

    const checkReminder = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (currentTime === journalReminder && !hasTriggered) {
        hasTriggered = true;

        const alarmTitle = lang === "en" ? "Journal Reminder 📝" : "تذكير بالمذكرات 📝";
        const alarmBody = journalTitle ||
          (lang === "en" ? "Time to write in your journal!" : "حان وقت الكتابة في مذكراتك!");

        // 1. Play notification sound
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKzn77RgGwU7k9n0yXkpBSh+zPLaizsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvf",
        );
        audio.play().catch((e) => console.log("Audio play failed:", e));

        // 2. Show custom notification modal in-app
        setShowAlarmNotification(true);

        // 3. Show browser local notification (if app is visible/foreground)
        sendLocalNotification(alarmTitle, alarmBody);

        // 4. Send FCM push via the server → works even when app is MINIMIZED on phone
        //    Read the token from localStorage (avoids cross-component scope issues)
        const myToken = localStorage.getItem("my_fcm_token");
        if (myToken) {
          try {
            const apiUrl = "/api/send-notification";
            fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tokens: [myToken], title: alarmTitle, body: alarmBody }),
            }).then(r => r.json()).then(result => {
              console.log("📡 Journal alarm FCM push result:", result);
            }).catch(err => {
              console.warn("⚠️ FCM alarm push failed (non-critical):", err.message);
            });
          } catch (err) {
            console.warn("⚠️ FCM alarm push error:", err.message);
          }
        }
      }
    };

    // Check immediately
    checkReminder();

    // Check every minute (accurate to the minute)
    const interval = setInterval(checkReminder, 60000);

    return () => clearInterval(interval);
  }, [journalReminder, journalTitle, lang, selectedDate]);

  return (
    <div className="home-screen">
      <header className="header">
        <div style={{ padding: "5px 0" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 900,
              color: "var(--text-main)",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            {user.name && user.name.trim().split(/\s+/)[0]}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-dim)",
              margin: "2px 0 0 0",
              fontWeight: 500,
            }}
          >
            {t.startDayDesc}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="profile-img" onClick={() => setScreen("profile")}>
            <img src={user.image} alt="Profile" />
          </div>
          <button
            className="nav-icon-btn"
            onClick={() => setScreen("analytics")}
          >
            <Award size={20} />
          </button>
          <button
            className="nav-icon-btn"
            onClick={() => setScreen("notifications")}
          >
            <Bell size={20} />
            {notifications.some((n) => !n.read) && (
              <div className="unread-dot" />
            )}
          </button>
        </div>
      </header>

      <div className="calendar-section">
        <div className="calendar-strip" ref={scrollRef}>
          {CALENDAR_DAYS.map((d, i) => (
            <div
              key={i}
              className={`calendar-day ${selectedDate === d.fullDate ? "active" : ""}`}
              onClick={() => setSelectedDate(d.fullDate)}
            >
              <span className="day-name">{d.day}</span>
              <div className="date-circle">
                {d.date}
                {journals[d.fullDate]?.length > 0 && (
                  <div className="has-note-dot" />
                )}
              </div>
            </div>
          ))}
        </div>
        {selectedDate !== formatDate(new Date()) && (
          <button
            className="today-btn"
            onClick={() => setSelectedDate(formatDate(new Date()))}
          >
            {t.backToToday}
          </button>
        )}
      </div>

      <div className="section-header">
        <h2>{t.myJournal}</h2>
        <span style={{ fontSize: "0.85rem", color: PALETTE.GRAY }}>
          {new Date(selectedDate).toLocaleDateString(
            lang === "en" ? "en-US" : "ar-EG",
            { month: "long", day: "numeric" },
          )}
        </span>
      </div>

      <div
        className="main-journal-card glass-style"
        onClick={() => {
          setTempJournalData({
            title: journalTitle,
            image: journalImage,
            reminder: journalReminder,
            text: lastEntryText,
          });
          setIsEditingJournal(true);
        }}
      >
        <div className="journal-content">
          <div
            style={{
              position: "absolute",
              top: "15px",
              right: lang === "ar" ? "auto" : "15px",
              left: lang === "ar" ? "15px" : "auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {journalReminder && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background:
                    "linear-gradient(135deg, rgba(98, 159, 173, 0.2), rgba(98, 159, 173, 0.1))",
                  padding: "8px 14px",
                  borderRadius: "15px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--primary-light)",
                  border: "1.5px solid rgba(98, 159, 173, 0.3)",
                  boxShadow: "0 4px 12px rgba(98, 159, 173, 0.15)",
                }}
              >
                <Bell
                  size={16}
                  style={{ animation: "bell-ring 2s ease-in-out infinite" }}
                />
                {journalReminder}
              </div>
            )}
            <Settings size={18} style={{ opacity: 0.5 }} />
          </div>

          <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)" }}>
            {journalTitle ||
              (currentJournalEntries.length > 0
                ? t.continueReflection
                : t.startDay)}
          </h3>
          <p style={{ color: "var(--text-dim)" }}>
            {lastEntryText
              ? lastEntryText.substring(0, 40) + "..."
              : t.startDayDesc}
          </p>

          {journalImage && (
            <div
              style={{
                marginTop: "15px",
                borderRadius: "20px",
                overflow: "hidden",
                height: "100px",
              }}
            >
              <img
                src={journalImage}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="Journal"
              />
            </div>
          )}

          {!journalImage && (
            <div className="illustration" style={{ marginTop: "20px" }}>
              <svg width="100%" height="80" viewBox="0 0 200 80">
                <circle cx="100" cy="30" r="22" fill={PALETTE.BEIGE} />
                <path
                  d="M0 60 Q 50 40, 100 60 T 200 60"
                  fill={PALETTE.GREEN}
                  opacity="0.6"
                />
                <path d="M0 70 Q 50 50, 100 70 T 200 70" fill={PALETTE.GREEN} />
              </svg>
            </div>
          )}
        </div>

        <div className="journal-side-tab">
          <span>{t.journal}</span>
        </div>
      </div>

      {/* Daily Technique Recommendation */}
      <div className="section-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {t.recommendation || "Daily Recommendation"}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingHabit(true);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: PALETTE.GRAY,
              cursor: "pointer",
            }}
          >
            <Settings size={16} />
          </button>
        </h2>
      </div>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="card"
        onClick={() => {
          setActiveMeditation(activeHabit);
        }}
        style={{
          background: "linear-gradient(135deg, #2c3e50, #000000)",
          color: "white",
          padding: "20px",
          borderRadius: "32px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "15px",
            background: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          {activeHabit.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
            {activeHabit.title[lang]}
          </h3>
          <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
            {activeHabit.type[lang]} • {activeHabit.duration}
          </p>
        </div>
        <ChevronLeft
          size={20}
          style={{
            transform: lang === "ar" ? "none" : "rotate(180deg)",
            opacity: 0.5,
          }}
        />
      </motion.div>

      <div className="section-header">
        <h2>{t.quickJournal}</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={handleAddNote}
            style={{
              background: "var(--color-7)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-2)",
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
          </button>
          <span className="see-all">{t.today}</span>
        </div>
      </div>

      <div className="quick-journal-scroll">
        {pinnedNotes.map((note) => (
          <motion.div
            layoutId={note.id}
            key={note.id}
            className="glass-widget"
            style={{ "--widget-color": note.color }}
            onClick={() => setExpandedNoteId(note.id)}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="pinned-badge">
              <Pin size={12} fill={note.color} />
            </div>

            {note.image && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setFullScreenImage(note.image);
                }}
                style={{
                  height: "70px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "8px",
                  cursor: "zoom-in",
                }}
              >
                <img
                  src={note.image}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            <div className="widget-info">
              <h3>{note.title}</h3>
              <p>{note.content}</p>

              <div className="rich-content-indicators">
                {note.hasVoice && (
                  <div className="indicator-item active">
                    <Mic size={12} />
                  </div>
                )}
                {note.hasImage && (
                  <div className="indicator-item active">
                    <ImageIcon size={12} />
                  </div>
                )}
                {note.hasFile && (
                  <div className="indicator-item active">
                    <Paperclip size={12} />
                  </div>
                )}
                {note.link && (
                  <a
                    href={
                      note.link.startsWith("http")
                        ? note.link
                        : `https://${note.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.7rem",
                      color: "inherit",
                      textDecoration: "underline",
                      marginTop: "5px",
                      background: "rgba(255,255,255,0.25)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      width: "fit-content",
                    }}
                  >
                    <LinkIcon size={10} /> {lang === "en" ? "Link" : "رابط"}
                  </a>
                )}
              </div>
            </div>
            <div className="glass-widget-footer">
              <div
                className="attachment-dot"
                style={{ backgroundColor: note.color }}
              />
              <span>{note.timestamp || "Just now"}</span>
            </div>
          </motion.div>
        ))}

        {/* New Note Ghost Card */}
        <motion.div
          className="glass-widget ghost"
          onClick={handleAddNote}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            border: "2px dashed rgba(0,0,0,0.1)",
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "160px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(0,0,0,0.3)",
            }}
          >
            <Plus size={20} />
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              color: "rgba(0,0,0,0.4)",
              fontWeight: "600",
            }}
          >
            {lang === "en" ? "Add Note" : "إضافة ملاحظة"}
          </span>
        </motion.div>
      </div>

      <AnimatePresence>
        {isEditingJournal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="note-overlay"
            onClick={() => setIsEditingJournal(false)}
          >
            <motion.div
              className="expanded-note-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
            >
              <h2 style={{ marginBottom: "20px" }}>
                {lang === "en" ? "Daily Highlights" : "أبرز أحداث اليوم"}
              </h2>

              <input
                type="text"
                placeholder={
                  lang === "en" ? "Dream/Title..." : "عنوان الحلم / القصة..."
                }
                value={tempJournalData.title}
                onChange={(e) =>
                  setTempJournalData({
                    ...tempJournalData,
                    title: e.target.value,
                  })
                }
                style={editInputStyle(lang)}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <label
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(0,0,0,0.05)",
                    padding: "12px",
                    borderRadius: "15px",
                    fontSize: "0.85rem",
                  }}
                >
                  <ImageIcon size={18} />{" "}
                  {lang === "en" ? "Cover Image" : "صورة الغلاف"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setTempJournalData({
                            ...tempJournalData,
                            image: reader.result,
                          });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="time"
                    value={tempJournalData.reminder}
                    onChange={(e) =>
                      setTempJournalData({
                        ...tempJournalData,
                        reminder: e.target.value,
                      })
                    }
                    style={{ ...editInputStyle(lang), paddingRight: "35px" }}
                  />
                  <Bell
                    size={14}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />
                </div>
              </div>

              {tempJournalData.image && (
                <div
                  style={{
                    position: "relative",
                    height: "120px",
                    borderRadius: "15px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={tempJournalData.image}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    onClick={() =>
                      setTempJournalData({ ...tempJournalData, image: "" })
                    }
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "5px",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <textarea
                placeholder={t.placeholder}
                value={tempJournalData.text}
                onChange={(e) =>
                  setTempJournalData({
                    ...tempJournalData,
                    text: e.target.value,
                  })
                }
                style={{
                  ...editInputStyle(lang),
                  minHeight: "120px",
                  resize: "none",
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    saveJournal(selectedDate, {
                      title: tempJournalData.title,
                      image: tempJournalData.image,
                      reminder: tempJournalData.reminder,
                      entries: tempJournalData.text
                        ? [
                            {
                              id: Date.now(),
                              text: tempJournalData.text,
                              time: new Date().toLocaleTimeString(),
                            },
                          ]
                        : currentJournalEntries,
                    });
                    setIsEditingJournal(false);
                  }}
                >
                  {t.save}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsEditingJournal(false)}
                  style={{ borderRadius: "50px", padding: "16px" }}
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isEditingHabit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="note-overlay"
            onClick={() => setIsEditingHabit(false)}
          >
            <motion.div
              className="expanded-note-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{lang === "en" ? "Choose Habit" : "اختر عادة"}</h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: PALETTE.GRAY,
                  marginBottom: "15px",
                }}
              >
                {lang === "en"
                  ? "Select a habit for today"
                  : "اختر عادة تود القيام بها اليوم"}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "5px",
                }}
              >
                {EXPLORE_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      saveDailyHabit(selectedDate, item);
                      setIsEditingHabit(false);
                    }}
                    style={{
                      padding: "15px",
                      borderRadius: "20px",
                      background:
                        activeHabit.id === item.id
                          ? PALETTE.ICE
                          : "rgba(0,0,0,0.03)",
                      border:
                        activeHabit.id === item.id
                          ? `2px solid ${PALETTE.TEAL}`
                          : "2px solid transparent",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>
                      {item.icon}
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                      {item.title[lang]}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-secondary"
                onClick={() => setIsEditingHabit(false)}
                style={{ marginTop: "20px", borderRadius: "50px" }}
              >
                {t.cancel}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedNoteId && expandedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="note-overlay"
            onClick={() => setExpandedNoteId(null)}
          >
            <motion.div
              layoutId={expandedNoteId}
              className="expanded-note-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <input
                  className="note-edit-title"
                  value={expandedNote.title}
                  onChange={(e) =>
                    updateNoteTitle(expandedNote.id, e.target.value)
                  }
                  autoFocus
                />
                <button
                  className="icon-btn"
                  onClick={() => setExpandedNoteId(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-dim)",
                  marginBottom: "5px",
                }}
              >
                {expandedNote.timestamp || "Just now"} •{" "}
                {expandedNote.content.length}{" "}
                {lang === "en" ? "characters" : "حرف"}
              </div>

              {expandedNote.image && (
                <div
                  className="note-image-container"
                  onClick={() => setFullScreenImage(expandedNote.image)}
                  style={{ cursor: "zoom-in" }}
                >
                  <img
                    src={expandedNote.image}
                    className="note-image-preview"
                    alt="note"
                  />
                  <button
                    className="remove-img-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNoteImage(expandedNote.id, null);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {expandedNote.audioUrl && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    borderRadius: "15px",
                    padding: "12px",
                    marginBottom: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <audio
                    controls
                    src={expandedNote.audioUrl}
                    style={{ flex: 1, height: "35px" }}
                  />
                  <button
                    className="icon-btn"
                    style={{ color: "#ff4757" }}
                    onClick={() => deleteAudio(expandedNote.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <textarea
                className="note-edit-text"
                value={expandedNote.content}
                onChange={(e) =>
                  updateNoteContent(expandedNote.id, e.target.value)
                }
                placeholder={
                  lang === "en" ? "Note content..." : "محتوى الملاحظة..."
                }
              />

              <div style={{ position: "relative", marginBottom: "15px" }}>
                <LinkIcon
                  size={14}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.5,
                  }}
                />
                <input
                  type="text"
                  placeholder={
                    lang === "en" ? "Add Link (URL)..." : "إضافة رابط (URL)..."
                  }
                  value={expandedNote.link || ""}
                  onChange={(e) =>
                    updateNoteLink(expandedNote.id, e.target.value)
                  }
                  style={{
                    ...editInputStyle(lang),
                    paddingLeft: "35px",
                    fontSize: "0.85rem",
                    height: "40px",
                    background: "rgba(0,0,0,0.03)",
                  }}
                />
              </div>

              <div
                className="color-presets"
                style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
              >
                {[
                  "#394867",
                  "#FF6B6B",
                  "#51cf66",
                  "#fcc419",
                  "#845ef7",
                  "#ff922b",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateNoteColor(expandedNote.id, c)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: c,
                      border:
                        expandedNote.color === c ? "2px solid white" : "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </div>

              <div className="note-actions">
                <div style={{ display: "flex", gap: "10px" }}>
                  <label className="icon-btn">
                    <ImageIcon size={20} />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(expandedNote.id, e)}
                    />
                  </label>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (isRecording && recordingNoteId === expandedNote.id) {
                        stopRecording();
                      } else {
                        startRecording(expandedNote.id);
                      }
                    }}
                    style={{
                      background:
                        isRecording && recordingNoteId === expandedNote.id
                          ? "#ff4757"
                          : "",
                      color:
                        isRecording && recordingNoteId === expandedNote.id
                          ? "white"
                          : "",
                    }}
                  >
                    <Mic size={20} />
                  </button>
                  <button
                    className="icon-btn"
                    style={{ color: "#ff4757" }}
                    onClick={() => {
                      deletePinnedNote(expandedNote.id);
                      setExpandedNoteId(null);
                    }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <button
                  className="close-expanded-btn"
                  onClick={() => setExpandedNoteId(null)}
                >
                  {lang === "en" ? "Done" : "تم"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="full-screen-image-overlay"
            onClick={() => setFullScreenImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={fullScreenImage}
              className="full-screen-image"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="close-full-img"
              onClick={() => setFullScreenImage(null)}
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAlarmNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="note-overlay"
            style={{
              backdropFilter: "blur(10px)",
              background: "rgba(0,0,0,0.6)",
            }}
            onClick={() => setShowAlarmNotification(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, var(--primary-light) 0%, var(--accent) 100%)",
                borderRadius: "30px",
                padding: "40px 30px",
                maxWidth: "400px",
                width: "90%",
                textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 15, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                style={{ fontSize: "4rem", marginBottom: "20px" }}
              >
                ⏰
              </motion.div>
              <h2
                style={{
                  color: "white",
                  fontSize: "1.8rem",
                  marginBottom: "10px",
                  fontWeight: 800,
                }}
              >
                {lang === "en" ? "Journal Reminder!" : "تذكير بالمذكرات!"}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "1.1rem",
                  marginBottom: "30px",
                }}
              >
                {journalTitle ||
                  (lang === "en"
                    ? "Time to write in your journal!"
                    : "حان وقت الكتابة في مذكراتك!")}
              </p>
              <button
                onClick={() => {
                  setShowAlarmNotification(false);
                  setIsEditingJournal(true);
                }}
                style={{
                  background: "white",
                  color: "var(--primary-light)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "15px 40px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  marginRight: lang === "ar" ? "0" : "10px",
                  marginLeft: lang === "ar" ? "10px" : "0",
                }}
              >
                {lang === "en" ? "Write Now" : "اكتب الآن"}
              </button>
              <button
                onClick={() => setShowAlarmNotification(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "2px solid white",
                  borderRadius: "20px",
                  padding: "15px 40px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {lang === "en" ? "Later" : "لاحقاً"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-10deg); }
          20%, 40% { transform: rotate(10deg); }
        }
      `}</style>

      {/* ── Floating Quick Note FAB ─────────────────────────────────────── */}
      <motion.button
        className="quick-note-fab"
        onClick={handleAddNote}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
        title={lang === "ar" ? "ملاحظة سريعة" : "Quick Note"}
      >
        <PlusCircle size={26} />
      </motion.button>
    </div>
  );
}

function JournalDetailsScreen({
  setScreen,
  selectedDate,
  journals,
  saveJournal,
  todoLists,
  saveTodos,
  lang,
  t,
  user,
  addPinnedNote,
}) {
  const dayData = journals[selectedDate] || {};
  const [entries, setEntries] = useState(
    Array.isArray(dayData) ? dayData : dayData.entries || [],
  );
  const [journalTitle, setJournalTitle] = useState(
    !Array.isArray(dayData) ? dayData.title || "" : "",
  );
  const [journalImage, setJournalImage] = useState(
    !Array.isArray(dayData) ? dayData.image || "" : "",
  );
  const [reminder, setReminder] = useState(
    !Array.isArray(dayData) ? dayData.reminder || "" : "",
  );

  const [newEntry, setNewEntry] = useState("");
  const [todos, setTodos] = useState(todoLists[selectedDate] || []);
  const [newTodo, setNewTodo] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const celebrationSound = new Audio(
    "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
  );

  const handleSave = () => {
    saveJournal(selectedDate, {
      entries,
      title: journalTitle,
      image: journalImage,
      reminder: reminder,
    });
    saveTodos(selectedDate, todos);
    setScreen("home");
  };

  const addNote = () => {
    if (newEntry.trim()) {
      setEntries([
        ...entries,
        {
          id: Date.now(),
          text: newEntry,
          time: new Date().toLocaleTimeString(
            lang === "en" ? "en-US" : "ar-EG",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ),
        },
      ]);
      setNewEntry("");
    }
  };

  const deleteNote = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: newTodo,
          completed: false,
          category: t.personal,
        },
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id) => {
    const updated = todos.map((todo) => {
      if (todo.id === id) {
        if (!todo.completed) {
          celebrationSound.play().catch((e) => console.log("Sound error:", e));
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    setTodos(updated);
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div
      className="details-screen"
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showConfetti && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                top: "50%",
                left: "50%",
                opacity: 1,
                scale: 0,
              }}
              animate={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0,
                scale: 1.5,
                rotate: 360,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: "10px",
                height: "10px",
                backgroundColor: ["#FFD700", "#FF69B4", "#00CED1", "#ADFF2F"][
                  Math.floor(Math.random() * 4)
                ],
                borderRadius: "2px",
              }}
            />
          ))}
        </div>
      )}

      <div
        className="top-nav-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#D35400",
          margin: "-24px -20px 20px -20px",
          padding: "24px 20px",
          color: "white",
        }}
      >
        <button
          onClick={() => setScreen("home")}
          className="nav-icon-btn"
          style={{ color: "white" }}
        >
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0 }}>
          {new Date(selectedDate).toLocaleDateString(
            lang === "en" ? "en-US" : "ar-EG",
            { day: "numeric", month: "long" },
          )}
        </h2>
        <div style={{ display: "flex", gap: "15px" }}>
          <Search size={22} />
          <MoreHorizontal size={22} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}>
        {/* Todos Section */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-main)",
              }}
            >
              {t.dailyTasks}{" "}
              <span
                style={{
                  color: PALETTE.GRAY,
                  fontWeight: 400,
                  marginLeft: "5px",
                }}
              >
                {todos.length}
              </span>
            </h3>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder={t.todoPlaceholder}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
              style={{
                ...editInputStyle(lang),
                flex: 1,
                backgroundColor: "white",
                boxShadow: "var(--shadow-soft)",
              }}
            />
            <button
              onClick={addTodo}
              className="btn-accent"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "15px",
                backgroundColor: "#D35400",
                color: "white",
                border: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={24} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {todos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  padding: "12px 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: `2px solid ${todo.completed ? PALETTE.GREEN : "#bdc3c7"}`,
                    backgroundColor: "transparent",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    marginTop: "2px",
                  }}
                >
                  {todo.completed && (
                    <CheckCircle2 size={16} color={PALETTE.GREEN} />
                  )}
                </button>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: todo.completed ? PALETTE.GRAY : "var(--text-main)",
                      textDecoration: todo.completed ? "line-through" : "none",
                    }}
                  >
                    {todo.text}
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{ opacity: 0.3, border: "none", background: "none" }}
                >
                  <Plus size={16} style={{ transform: "rotate(45deg)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ marginBottom: "25px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              marginBottom: "15px",
              color: "var(--text-main)",
            }}
          >
            {t.dailyNotes}
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {entries.map((note) => (
              <div
                key={note.id}
                className="card"
                style={{
                  padding: "15px",
                  position: "relative",
                  borderLeft: `4px solid ${PALETTE.BEIGE}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: PALETTE.GRAY,
                    marginBottom: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{note.time}</span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="note-action-btn"
                      onClick={() => {
                        addPinnedNote(
                          lang === "en" ? "Pinned Entry" : "ملاحظة مثبتة",
                          note.text,
                        );
                      }}
                      style={{
                        border: "none",
                        background: "none",
                        opacity: 0.5,
                      }}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      className="note-action-btn"
                      onClick={() => deleteNote(note.id)}
                      style={{
                        border: "none",
                        background: "none",
                        opacity: 0.5,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    color: "var(--text-main)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {note.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="bottom-action-bar"
        style={{
          padding: "20px 0",
          borderTop: "1px solid #eee",
        }}
      >
        <textarea
          placeholder={t.notePlaceholder}
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          style={{
            width: "100%",
            height: "100px",
            border: "1px solid #eee",
            borderRadius: "16px",
            padding: "15px",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            backgroundColor: "#f9f9f9",
            resize: "none",
            outline: "none",
            marginBottom: "15px",
            direction: lang === "ar" ? "rtl" : "ltr",
          }}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={addNote}
            className="btn-primary"
            style={{
              flex: 1,
              borderRadius: "12px",
              height: "48px",
              backgroundColor: "#D35400",
              color: "white",
              border: "none",
              fontWeight: 700,
            }}
          >
            {t.addNote}
          </button>
        </div>
      </div>
    </div>
  );
}

function SharedTasksScreen({
  t,
  lang,
  setScreen,
  group,
  updateGroupTask,
  addGroupTask,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    desc: "",
    assigned: "",
    assignedId: "",
  });

  if (!group) return null;

  const completedTasks = group.tasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalTasks = group.tasks.length;
  const progressPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = () => {
    if (newTask.title && newTask.assignedId) {
      const assignedMember = group.members.find(
        (m) => m.id === newTask.assignedId,
      );
      addGroupTask(group.id, {
        title: { en: newTask.title, ar: newTask.title },
        desc: { en: newTask.desc || "", ar: newTask.desc || "" },
        assigned: assignedMember.name,
        assignedId: newTask.assignedId,
      });
      setNewTask({ title: "", desc: "", assigned: "", assignedId: "" });
      setShowAdd(false);
    }
  };

  return (
    <div
      className="tasks-screen fade-in"
      style={{
        padding: "24px",
        paddingBottom: "100px",
        height: "100%",
        overflowY: "auto",
        backgroundColor: "var(--bg-main)",
      }}
    >
      <div
        className="top-nav-bar"
        style={{ marginBottom: "25px", display: "flex", alignItems: "center" }}
      >
        <button
          className="nav-icon-btn"
          onClick={() => setScreen("groups")}
          style={{
            background: "rgba(0,0,0,0.05)",
            borderRadius: "15px",
            width: "45px",
            height: "45px",
          }}
        >
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--text-main)",
            }}
          >
            {group.name}
          </h2>
          <span
            style={{
              fontSize: "0.8rem",
              color: PALETTE.GRAY,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {t.sharedTasks}
          </span>
        </div>
        <button
          className="nav-icon-btn"
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: "var(--primary-light)",
            color: "white",
            borderRadius: "15px",
            width: "45px",
            height: "45px",
            boxShadow: "0 5px 15px rgba(98, 159, 173, 0.3)",
          }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Project Progress Overview */}
      <div
        className="card"
        style={{
          padding: "24px",
          borderRadius: "32px",
          background: "linear-gradient(135deg, #2c3e50, #000000)",
          color: "white",
          marginBottom: "30px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            fontSize: "100px",
            opacity: 0.1,
          }}
        >
          🚀
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem" }}>
            {lang === "en" ? "Project Goal" : "هدف المشروع"}
          </h3>
          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div
          style={{
            height: "10px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "15px",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--primary-light), var(--accent))",
              borderRadius: "10px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            fontSize: "0.85rem",
            opacity: 0.8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>
            {completedTasks} / {totalTasks}{" "}
            {lang === "en" ? "tasks completed" : "مهام مكتملة"}
          </span>
        </div>
      </div>

      {showAdd && group.role === "manager" && (
        <div
          className="card slide-up"
          style={{
            padding: "24px",
            marginBottom: "25px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            borderRadius: "28px",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
            {t.createNewTask}
          </h3>
          <input
            type="text"
            placeholder={lang === "en" ? "Task Title..." : "عنوان المهمة..."}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            style={editInputStyle(lang)}
          />
          <select
            value={newTask.assignedId}
            onChange={(e) => {
              const member = group.members.find((m) => m.id === e.target.value);
              setNewTask({
                ...newTask,
                assignedId: e.target.value,
                assigned: member?.name || "",
              });
            }}
            style={{ ...editInputStyle(lang), appearance: "none" }}
          >
            <option value="">
              {lang === "en" ? "Select Member" : "اختر عضواً"}
            </option>
            {group.members?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddTask}
              className="btn-primary"
              style={{ flex: 1, height: "50px", borderRadius: "15px" }}
            >
              {t.addTask}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="btn-secondary"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "15px",
                padding: 0,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div
        className="section-header"
        style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, flex: 1 }}>
          {lang === "en" ? "Active Tasks" : "المهام الحالية"}
        </h2>
        <div
          style={{
            background: "rgba(98, 159, 173, 0.1)",
            color: "var(--primary-light)",
            padding: "4px 12px",
            borderRadius: "10px",
            fontSize: "0.75rem",
            fontWeight: 800,
          }}
        >
          {totalTasks} {lang === "en" ? "TOTAL" : "الكل"}
        </div>
      </div>

      <div
        className="tasks-list"
        style={{ display: "flex", flexDirection: "column", gap: "18px" }}
      >
        {group.tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`task-item ${task.status}`}
            onClick={() =>
              task.status !== "locked" &&
              updateGroupTask(
                group.id,
                task.id,
                task.status === "completed" ? "active" : "completed",
              )
            }
            style={{
              padding: "16px",
              borderRadius: "24px",
              backgroundColor: "var(--card-bg, white)",
              boxShadow: "var(--shadow-soft)",
              border:
                task.status === "completed"
                  ? "2px solid rgba(95, 149, 152, 0.2)"
                  : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              opacity: task.status === "locked" ? 0.6 : 1,
              flexWrap: "wrap",
            }}
          >
            <div
              className="task-avatar"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background:
                  task.status === "completed"
                    ? "rgba(95, 149, 152, 0.1)"
                    : "rgba(98, 159, 173, 0.1)",
                color: task.status === "completed" ? "var(--accent)" : "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              {task.assigned.substring(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "4px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 700,
                    textDecoration:
                      task.status === "completed" ? "line-through" : "none",
                    color:
                      task.status === "completed"
                        ? PALETTE.GRAY
                        : "var(--text-main)",
                  }}
                >
                  {task.title[lang]}
                </h3>
                {task.status === "active" && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-light)",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: PALETTE.GRAY,
                    fontWeight: 600,
                  }}
                >
                  {lang === "en" ? "Assigned to:" : "مكلف بـ:"}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#D35400",
                    background: "rgba(211, 84, 0, 0.08)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {task.assigned}
                </span>
              </div>
            </div>

            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  task.status === "completed" ? "var(--accent)" : "rgba(0,0,0,0.03)",
                color: "white",
                transition: "all 0.3s ease",
              }}
            >
              {task.status === "completed" ? (
                <CheckCircle2 size={18} />
              ) : (
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ExploreScreen({
  t,
  lang,
  activeMeditation,
  setActiveMeditation,
  selectedDate,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: t.all, icon: "✨" },
    { id: "calm", label: t.calm, icon: "🧘" },
    { id: "focus", label: t.focus, icon: "🎯" },
    { id: "sleep", label: t.sleep, icon: "🌙" },
    { id: "morning", label: t.morning, icon: "☀️" },
    { id: "anxiety", label: t.anxiety, icon: "🌿" },
    { id: "relax", label: lang === "en" ? "Relax" : "استرخاء", icon: "🌊" },
  ];

  const filteredItems = EXPLORE_ITEMS.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.title[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type[lang].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dayOfMonth = new Date(selectedDate).getDate() || 1;
  const featuredItem =
    EXPLORE_ITEMS[dayOfMonth % EXPLORE_ITEMS.length] || EXPLORE_ITEMS[0];

  return (
    <div
      className="explore-screen fade-in"
      style={{ height: "100%", overflowY: "auto", paddingBottom: "100px" }}
    >
      <header
        className="header"
        style={{
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, flex: 1, margin: 0 }}>
          {t.explore}
        </h1>
        <div style={{ position: "relative", flex: 2 }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder || "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...editInputStyle(lang),
              paddingLeft: lang === "ar" ? "12px" : "40px",
              paddingRight: lang === "ar" ? "40px" : "12px",
              backgroundColor: "var(--bg-card)",
            }}
          />
          <Search
            size={18}
            style={{
              position: "absolute",
              left: lang === "ar" ? "auto" : "12px",
              right: lang === "ar" ? "12px" : "auto",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.5,
            }}
          />
        </div>
      </header>

      {/* Featured Recommendation */}
      {!searchQuery && featuredItem && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hero-card"
          onClick={() => setActiveMeditation(featuredItem)}
          style={{
            position: "relative",
            height: "190px",
            borderRadius: "32px",
            background: "linear-gradient(135deg, #FF6B6B, #D35400)",
            padding: "24px",
            color: "white",
            marginBottom: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            cursor: "pointer",
            overflow: "hidden",
            boxShadow: "0 15px 35px rgba(211, 84, 0, 0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: lang === "ar" ? "auto" : "-10px",
              left: lang === "ar" ? "-10px" : "auto",
              fontSize: "140px",
              opacity: 0.15,
            }}
          >
            {featuredItem.icon}
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              opacity: 0.9,
              fontWeight: 700,
            }}
          >
            {t.recommendation}
          </span>
          <h2 style={{ fontSize: "1.8rem", margin: "5px 0", fontWeight: 800 }}>
            {featuredItem.title[lang]}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                padding: "4px 12px",
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: "12px",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {featuredItem.type[lang]}
            </div>
            <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
              • {featuredItem.duration}
            </span>
          </div>
        </motion.div>
      )}

      {/* Categories Horizontal Scroll */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          marginBottom: "30px",
          paddingBottom: "5px",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: "12px 20px",
              borderRadius: "20px",
              border: "none",
              whiteSpace: "nowrap",
              backgroundColor:
                selectedCategory === cat.id
                  ? "#D35400"
                  : "var(--bg-card)",
              color: selectedCategory === cat.id ? "white" : "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--shadow-soft)",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="section-header" style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{t.featured}</h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveMeditation(item)}
            className="card"
            style={{
              padding: "20px",
              borderRadius: "28px",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              border:
                activeMeditation?.id === item.id
                  ? "2px solid #D35400"
                  : "2px solid transparent",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                backgroundColor: item.color,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "1.4rem",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
            >
              {item.icon}
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  margin: "0 0 4px 0",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  lineHeight: "1.3",
                }}
              >
                {item.title[lang]}
              </h3>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                }}
              >
                <ClipboardList size={14} /> {item.duration}
              </div>
            </div>
            {/* Subtle background icon decoration */}
            <div
              style={{
                position: "absolute",
                bottom: "-15px",
                right: lang === "ar" ? "auto" : "-15px",
                left: lang === "ar" ? "-15px" : "auto",
                fontSize: "60px",
                opacity: 0.05,
                transform: "rotate(-15deg)",
              }}
            >
              {item.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}
        >
          <Search size={48} style={{ marginBottom: "15px" }} />
          <p>{lang === "en" ? "No results found" : "لا توجد نتائج"}</p>
        </div>
      )}
      {/* Community Pulse Component */}
      <div style={{ marginTop: "40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
            Community Pulse
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#FFEBEB",
              padding: "4px 10px",
              borderRadius: "8px",
              color: "#FF5252",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#FF5252",
              }}
            />{" "}
            LIVE
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "32px",
            padding: "24px",
            boxShadow: "var(--shadow-soft)",
            border: "1px solid rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "-10px",
              marginBottom: "15px",
              paddingLeft: "5px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: PALETTE.ICE,
                  border: "2px solid white",
                  marginLeft: i > 1 ? "-10px" : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                }}
              >
                {["SJ", "MK", "AY", "RL"][i - 1]}
              </div>
            ))}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "var(--bg-app)",
                border: "2px solid white",
                marginLeft: "-10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: PALETTE.GRAY,
              }}
            >
              +1.2k
            </div>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "var(--primary)",
              fontWeight: 600,
            }}
          >
            {lang === "en"
              ? "Currently Zenning with 1,248 others around the world."
              : "تمارس التأمل حالياً مع 1,248 شخصاً حول العالم."}
          </p>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {["#GratitudeFlow", "#Nightbreeze", "#FocusMode"].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "6px 12px",
                  background: "rgba(98, 159, 173, 0.08)",
                  color: "var(--primary-light)",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationScreen({
  t,
  lang,
  notifications,
  setNotifications,
  setScreen,
}) {
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div
      className="notification-screen fade-in"
      style={{ height: "100%", overflowY: "auto", paddingBottom: "100px" }}
    >
      <header
        className="header"
        style={{
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button onClick={() => setScreen("home")} className="nav-icon-btn">
            <ChevronLeft
              size={24}
              style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
            />
          </button>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
            {t.notifications}
          </h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary-light)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {lang === "en" ? "Mark all read" : "تحديد الكل كمقروء"}
          </button>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 20px", opacity: 0.5 }}
          >
            <Bell size={60} style={{ marginBottom: "20px", opacity: 0.2 }} />
            <p>
              {lang === "en" ? "No new notifications" : "لا توجد تنبيهات جديدة"}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`card ${n.read ? "" : "unread"}`}
              style={{
                padding: "20px",
                borderRadius: "24px",
                backgroundColor: n.read ? "var(--bg-card)" : "var(--primary-pale)",
                border: n.read
                  ? "1px solid var(--border)"
                  : "1px solid var(--primary-light)",
                position: "relative",
                display: "flex",
                gap: "15px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "15px",
                  backgroundColor:
                    n.type === "system"
                      ? "#E3F2FD"
                      : n.type === "social"
                        ? "#F3E5FF"
                        : "#E8F5E9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {n.type === "system" ? (
                  <Settings size={20} color="#1565C0" />
                ) : n.type === "social" ? (
                  <Users size={20} color="#7B1FA2" />
                ) : (
                  <Award size={20} color="#2E7D32" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "0.95rem",
                    fontWeight: n.read ? 500 : 700,
                    color: "var(--text-main)",
                  }}
                >
                  {n.text}
                </p>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                    fontWeight: 600,
                  }}
                >
                  {n.time}
                </span>
              </div>
              <button
                onClick={() => deleteNotification(n.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  opacity: 0.3,
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
              {!n.read && (
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: lang === "ar" ? "auto" : "15px",
                    left: lang === "ar" ? "15px" : "auto",
                    width: "8px",
                    height: "8px",
                    background: "var(--primary-light)",
                    borderRadius: "50%",
                  }}
                />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyticsScreen({
  t,
  lang,
  journals,
  todoLists,
  meditationHistory,
  groupStats,
  setScreen,
}) {
  const totalJournals = Object.keys(journals).length;
  const meditationMinutes = meditationHistory.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0,
  );
  const totalTasks = Object.values(todoLists).flat().length + groupStats.total;
  const completedTasks =
    Object.values(todoLists)
      .flat()
      .filter((t) => t.completed).length + groupStats.completed;
  const tasksSuccesRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="analytics-screen fade-in"
      style={{ height: "100%", overflowY: "auto", paddingBottom: "100px" }}
    >
      <header
        className="header"
        style={{
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <button onClick={() => setScreen("home")} className="nav-icon-btn">
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
          {t.analytics || "Analytics"}
        </h1>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "20px",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--primary) 0%, #000000 100%)",
            color: "white",
          }}
        >
          <Activity size={24} style={{ marginBottom: "10px", opacity: 0.8 }} />
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
            {meditationMinutes}
          </div>
          <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>
            {lang === "en" ? "Focus Minutes" : "دقائق التركيز"}
          </p>
        </div>
        <div
          className="card"
          style={{
            padding: "20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #FF6B6B 0%, #D35400 100%)",
            color: "white",
          }}
        >
          <TrendingUp
            size={24}
            style={{ marginBottom: "10px", opacity: 0.8 }}
          />
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
            {tasksSuccesRate}%
          </div>
          <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>
            {t.tasksRatio || "Success Rate"}
          </p>
        </div>
      </div>

      <div className="section-header">
        <h2>{lang === "en" ? "Activities" : "الأنشطة"}</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "15px",
              background: "#E3F2FD",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <BookOpen size={24} color="#1565C0" />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {totalJournals}
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-dim)",
                margin: 0,
              }}
            >
              {t.journal}s Written
            </p>
          </div>
        </div>
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "15px",
              background: "#E8F5E9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CheckCircle2 size={24} color="#2E7D32" />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {completedTasks}
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-dim)",
                margin: 0,
              }}
            >
              {t.completed} Tasks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniPlayer({ item, t, lang, onClose, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete();
            return 100;
          }
          return prev + 0.5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress, onComplete]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      style={{
        position: "fixed",
        bottom: "100px",
        left: "20px",
        right: "20px",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        zIndex: 100,
        border: "1px solid rgba(255,255,255,0.4)",
      }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "15px",
          background: item.color || "var(--primary-light)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.5rem",
        }}
      >
        {item.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: 0,
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--text-main)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title[lang]}
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "4px",
              background: "rgba(0,0,0,0.05)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "var(--primary-light)",
                width: `${progress}%`,
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--text-dim)",
              fontWeight: 600,
            }}
          >
            {Math.floor(progress)}%
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            background: "var(--primary-light)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {isPlaying ? (
            <span style={{ fontSize: "10px" }}>II</span>
          ) : (
            <Plus size={20} style={{ transform: "rotate(45deg)" }} />
          )}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.05)",
            color: "var(--text-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function ProfileScreen({
  t,
  lang,
  toggleLang,
  user,
  updateProfile,
  theme,
  toggleTheme,
  setScreen,
  handleLogout,
  journals,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  // Calculate total number of journal entries
  const totalJournals = Object.values(journals).reduce((total, dayData) => {
    if (Array.isArray(dayData)) {
      return total + dayData.length;
    }
    return total + (dayData.entries?.length || 0);
  }, 0);

  // Sync formData when user changes or entering edit mode
  React.useEffect(() => {
    setFormData({ ...user });
  }, [user, isEditing]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a canvas to resize the image
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Get the compressed data URL
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData({ ...formData, image: compressedDataUrl });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-screen">
      <header className="header" style={{ marginBottom: "20px" }}>
        <h1>{t.profile}</h1>
        <button
          className="nav-icon-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings size={20} />
        </button>
      </header>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            margin: "0 auto 15px",
            position: "relative",
            border: "4px solid white",
            boxShadow: "var(--shadow-soft)",
            overflow: "hidden",
          }}
        >
          <img
            src={formData.image}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {isEditing && (
            <label
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={24} color="white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>

        {isEditing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "0 20px",
            }}
          >
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={editInputStyle(lang)}
            />
            <input
              type="text"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              style={editInputStyle(lang)}
            />
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textAlign: lang === "ar" ? "right" : "left",
                }}
              >
                {t.socialMedia}
              </p>
              <input
                type="text"
                placeholder="Instagram"
                value={formData.socials.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socials: { ...formData.socials, instagram: e.target.value },
                  })
                }
                style={editInputStyle(lang)}
              />
              <input
                type="text"
                placeholder="Twitter"
                value={formData.socials.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socials: { ...formData.socials, twitter: e.target.value },
                  })
                }
                style={editInputStyle(lang)}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  background: PALETTE.TEAL,
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.save}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  background: PALETTE.ICE,
                  color: PALETTE.NAVY,
                  border: "none",
                  padding: "12px",
                  borderRadius: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: "2px" }}>{user.name}</h2>
            <p
              style={{
                color: PALETTE.GRAY,
                fontSize: "0.85rem",
                marginBottom: "10px",
              }}
            >
              {user.email}
            </p>
            <p
              style={{
                color: PALETTE.TEAL,
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Zen Master Level {user.level}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              {user.socials.instagram && (
                <InstagramIcon color={PALETTE.GRAY} size={20} />
              )}
              {user.socials.twitter && (
                <TwitterIcon color={PALETTE.GRAY} size={20} />
              )}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
          marginBottom: "30px",
        }}
      >
        <div style={statCardStyle}>
          <Award
            size={22}
            color={PALETTE.TEAL}
            style={{ margin: "0 auto 6px" }}
          />
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{user.points}</div>
          <div style={{ fontSize: "0.65rem", color: PALETTE.GRAY }}>
            {t.points}
          </div>
        </div>
        <div style={statCardStyle}>
          <Heart size={22} color="#E63946" style={{ margin: "0 auto 6px" }} />
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{user.streak}</div>
          <div style={{ fontSize: "0.65rem", color: PALETTE.GRAY }}>
            {t.streak}
          </div>
        </div>
        <button
          style={{
            ...statCardStyle,
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            border: "1px solid rgba(0,0,0,0.02)",
          }}
          onClick={() => setScreen("all-journals")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-soft)";
          }}
        >
          <MessageCircle
            size={22}
            color={PALETTE.GREEN}
            style={{ margin: "0 auto 6px" }}
          />
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
            {totalJournals}
          </div>
          <div style={{ fontSize: "0.65rem", color: PALETTE.GRAY }}>
            {t.journal}s
          </div>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ProfileMenuItem
          icon={<Bell size={20} color={PALETTE.NAVY} />}
          label={t.notifications}
          onClick={() => setScreen("notifications")}
        >
          <div
            style={{
              width: "40px",
              height: "20px",
              backgroundColor: PALETTE.GREEN,
              borderRadius: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                right: lang === "en" ? "2px" : "auto",
                left: lang === "ar" ? "2px" : "auto",
                top: "2px",
              }}
            />
          </div>
        </ProfileMenuItem>

        <ProfileMenuItem
          icon={<Heart size={20} color={PALETTE.NAVY} />}
          label={t.darkMode}
          onClick={toggleTheme}
        >
          <div
            style={{
              width: "40px",
              height: "20px",
              backgroundColor: theme === "dark" ? PALETTE.TEAL : PALETTE.GRAY,
              borderRadius: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                right: theme === "dark" ? "2px" : "auto",
                left: theme === "light" ? "2px" : "auto",
                top: "2px",
              }}
            />
          </div>
        </ProfileMenuItem>

        <ProfileMenuItem
          icon={<BookOpen size={20} color={PALETTE.NAVY} />}
          label={t.language}
          onClick={toggleLang}
        >
          <div
            style={{ fontWeight: 700, color: PALETTE.TEAL, fontSize: "0.9rem" }}
          >
            {lang === "en" ? "English" : "العربية"}
          </div>
        </ProfileMenuItem>

        <ProfileMenuItem
          icon={<LogOut size={20} color="#E63946" />}
          label={t.logout}
          onClick={handleLogout}
        >
          <div />
        </ProfileMenuItem>
      </div>
    </div>
  );
}

function AllJournalsScreen({ t, lang, setScreen, journals }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntry, setExpandedEntry] = useState(null);

  // Convert journals object to array with dates
  const allJournalEntries = Object.entries(journals)
    .map(([date, dayData]) => {
      const entries = Array.isArray(dayData) ? dayData : dayData.entries || [];
      return entries.map((entry) => ({
        ...entry,
        date,
        dateObj: new Date(date),
      }));
    })
    .flat()
    .sort((a, b) => b.dateObj - a.dateObj); // Sort by date, newest first

  // Filter journals based on search query
  const filteredJournals = searchQuery
    ? allJournalEntries.filter((entry) =>
        entry.text?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allJournalEntries;

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "en" ? "en-US" : "ar-EG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="all-journals-screen fade-in"
      style={{
        padding: "24px",
        height: "100%",
        overflowY: "auto",
        paddingBottom: "100px",
        backgroundColor: "var(--bg-main)",
      }}
    >
      <header
        className="header"
        style={{
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          className="nav-icon-btn"
          onClick={() => setScreen("profile")}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "15px",
            background: "white",
          }}
        >
          <ChevronLeft
            size={24}
            style={{
              transform: lang === "en" ? "none" : "rotate(180deg)",
              color: "var(--primary)",
            }}
          />
        </button>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 900,
            margin: 0,
            color: "var(--primary)",
          }}
        >
          {lang === "en" ? "Archive" : "الأرشيف"}
        </h1>
        <div style={{ width: "48px" }} />
      </header>

      {/* Summary Stat */}
      <div
        style={{
          padding: "25px",
          backgroundColor: "var(--primary)",
          borderRadius: "32px",
          marginBottom: "30px",
          boxShadow: "0 10px 30px rgba(29, 84, 109, 0.2)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1 }}>
          {allJournalEntries.length}
        </div>
        <div
          style={{
            fontSize: "0.85rem",
            opacity: 0.8,
            fontWeight: 700,
            marginTop: "5px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {lang === "en" ? "Total Reflections" : "إجمالي المذكرات"}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            backgroundColor: "white",
            borderRadius: "20px",
            boxShadow: "var(--shadow-soft)",
            border: "1px solid rgba(0,0,0,0.03)",
          }}
        >
          <Search size={20} color={PALETTE.GRAY} />
          <input
            type="text"
            placeholder={
              lang === "en" ? "Search your thoughts..." : "ابحث في أفكارك..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "1rem",
              fontWeight: 500,
              backgroundColor: "transparent",
              color: "var(--text-main)",
            }}
          />
        </div>
      </div>

      {/* Journals Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {filteredJournals.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: PALETTE.GRAY,
            }}
          >
            <BookOpen
              size={60}
              color={PALETTE.GRAY}
              style={{ margin: "0 auto 20px", opacity: 0.2 }}
            />
            <p style={{ fontWeight: 600 }}>
              {lang === "en" ? "No matches found" : "لا توجد نتائج"}
            </p>
          </div>
        ) : (
          filteredJournals.map((entry, index) => (
            <motion.div
              key={entry.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setExpandedEntry(entry)}
              style={{
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "24px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                cursor: "pointer",
                border: "1px solid rgba(0,0,0,0.02)",
                position: "relative",
              }}
              whileHover={{
                scale: 1.01,
                boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
              }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--primary-light)",
                    fontWeight: 800,
                  }}
                >
                  {formatDisplayDate(entry.date)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: PALETTE.GRAY,
                    fontWeight: 700,
                    backgroundColor: "var(--bg-app)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                  }}
                >
                  {entry.time}
                </div>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  lineHeight: "1.7",
                  color: "#2C3E50",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {entry.text}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Expanded Entry Modal */}
      <AnimatePresence>
        {expandedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedEntry(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(29, 84, 109, 0.4)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                borderRadius: "32px",
                padding: "32px",
                maxWidth: "500px",
                width: "100%",
                maxHeight: "85vh",
                overflow: "auto",
                boxShadow: "0 30px 60px rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "var(--primary-light)",
                      fontWeight: 800,
                      marginBottom: "4px",
                    }}
                  >
                    {formatDisplayDate(expandedEntry.date)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: PALETTE.GRAY,
                      fontWeight: 600,
                    }}
                  >
                    {expandedEntry.time}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedEntry(null)}
                  style={{
                    background: "var(--bg-app)",
                    border: "none",
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.9",
                  color: "#2C3E50",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontWeight: 450,
                }}
              >
                {expandedEntry.text}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components & Styles for Profile
const ProfileMenuItem = ({ icon, label, children, onClick }) => (
  <div
    onClick={onClick}
    className="profile-menu-item"
    style={{
      padding: "18px 20px",
      backgroundColor: "white",
      borderRadius: "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "var(--shadow-soft)",
      cursor: onClick ? "pointer" : "default",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      {icon}
      <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{label}</span>
    </div>
    {children}
  </div>
);

const editInputStyle = (lang) => ({
  fontSize: "0.9rem",
  fontWeight: 500,
  textAlign: lang === "ar" ? "right" : "left",
  border: "1px solid rgba(0,0,0,0.05)",
  background: "#F8FBFD",
  padding: "12px 16px",
  borderRadius: "15px",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
});

const statCardStyle = {
  padding: "15px",
  backgroundColor: "white",
  borderRadius: "24px",
  textAlign: "center",
  boxShadow: "var(--shadow-soft)",
  border: "1px solid rgba(0,0,0,0.02)",
};

const InstagramIcon = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

import React, { useState, useRef, useEffect } from "react";
import emailjs from "@emailjs/browser";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PALETTE = {
  NAVY: "#394867",
  DEEP_NAVY: "#212A3E",
  GRAY: "#9BA4B5",
  ICE: "#F1F6F9",
  TEAL: "#1D546D",
  GREEN: "#5F9598",
  BEIGE: "#EAE0CF",
  BLUE: "#94B4C1",
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
    color: "#E5EAFF",
    category: "calm",
    icon: "🧘",
    featured: true,
  },
  {
    id: 2,
    title: { en: "Night Rain", ar: "مطر الليل" },
    type: { en: "Soundscape", ar: "طبيعة" },
    duration: "45 min",
    color: "#FFE5E5",
    category: "sleep",
    icon: "🌧️",
  },
  {
    id: 3,
    title: { en: "Ocean Waves", ar: "أمواج المحيط" },
    type: { en: "Sound", ar: "صوت" },
    duration: "30 min",
    color: "#E5FFEB",
    category: "relax",
    icon: "🌊",
  },
  {
    id: 4,
    title: { en: "Zen Focus", ar: "تركيز زين" },
    type: { en: "Music", ar: "موسيقى" },
    duration: "60 min",
    color: "#FFF4E5",
    category: "focus",
    icon: "🎹",
  },
  {
    id: 5,
    title: { en: "Mindful Breath", ar: "تنفس واعٍ" },
    type: { en: "Meditation", ar: "تأمل" },
    duration: "5 min",
    color: "#F3E5FF",
    category: "morning",
    icon: "🌬️",
  },
  {
    id: 6,
    title: { en: "Forest Walk", ar: "مشي في الغابة" },
    type: { en: "Guided", ar: "إرشاد" },
    duration: "20 min",
    color: "#E5F9FF",
    category: "anxiety",
    icon: "🌲",
  },
  {
    id: 7,
    title: { en: "Deep Sleep", ar: "نوم عميق" },
    type: { en: "Meditation", ar: "تأمل اليوم" },
    duration: "15 min",
    color: "#EBF5FB",
    category: "sleep",
    icon: "😴",
  },
  {
    id: 8,
    title: { en: "Mountain Air", ar: "هواء الجبل" },
    type: { en: "Breathing", ar: "تنفس" },
    duration: "10 min",
    color: "#FEF9E7",
    category: "morning",
    icon: "🏔️",
  },
  {
    id: 9,
    title: { en: "Summer Meadow", ar: "مرج الصيف" },
    type: { en: "Soundscape", ar: "موسيقى طبيعية" },
    duration: "30 min",
    color: "#D5F5E3",
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [screen, setScreen] = useState("home");
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("lang");
    return saved || "en";
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [user, setUser] = useState(() => {
    const defaultUser = {
      name: "Jose Maria",
      email: "jose@example.com",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      level: 12,
      points: 1250,
      streak: 14,
      socials: { instagram: "", twitter: "", facebook: "" },
      achievements: [
        { id: 1, title: "Early Bird", icon: "☀️", date: "2024-01-10" },
        { id: 2, title: "7 Day Streak", icon: "🔥", date: "2024-01-15" },
      ],
    };
    try {
      const saved = localStorage.getItem("user");
      if (!saved) return defaultUser;
      const parsed = JSON.parse(saved);
      return {
        ...defaultUser,
        ...parsed,
        socials: { ...defaultUser.socials, ...(parsed.socials || {}) },
        achievements: parsed.achievements || defaultUser.achievements,
      };
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return defaultUser;
    }
  });

  const [todoLists, setTodoLists] = useState(() => {
    try {
      const saved = localStorage.getItem("todoLists");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error parsing todoLists:", e);
      return {};
    }
  });
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "system",
      text:
        lang === "en" ? "Welcome to Control! 🧘" : "مرحباً بك في Control! 🧘",
      time: lang === "en" ? "1h ago" : "منذ ساعة",
      read: false,
    },
    {
      id: 2,
      type: "social",
      text:
        lang === "en"
          ? "Group 'Family Trip' has a new update"
          : "هناك تحديث جديد في مجموعة 'رحلة العائلة'",
      time: lang === "en" ? "3h ago" : "منذ 3 ساعات",
      read: true,
    },
    {
      id: 3,
      type: "milestone",
      text:
        lang === "en"
          ? "You've reached a 7-day streak! 🔥"
          : "لقد وصلت إلى سلسلة من 7 أيام! 🔥",
      time: lang === "en" ? "5h ago" : "منذ 5 ساعات",
      read: false,
    },
  ]);
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

  const recordMeditationCompletion = (item) => {
    const newEntry = {
      id: Date.now(),
      title: item.title,
      date: formatDate(new Date()),
      duration: parseInt(item.duration) || 0,
    };
    const updated = [newEntry, ...meditationHistory];
    setMeditationHistory(updated);
    localStorage.setItem("meditationHistory", JSON.stringify(updated));
  };
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem("groups");
    const defaultTasks = [
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
    ];
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "g1",
            name: "Family Trip Prep",
            role: "manager",
            code: "TRIP2024",
            updates: [],
            tasks: defaultTasks,
          },
        ];
  });
  const [activeGroupId, setActiveGroupId] = useState("g1");
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [journals, setJournals] = useState(() => {
    try {
      const saved = localStorage.getItem("journals");
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      const migrated = {};
      Object.keys(parsed).forEach((date) => {
        if (typeof parsed[date] === "string") {
          migrated[date] = [
            { id: Date.now(), text: parsed[date], time: "Legacy" },
          ];
        } else {
          migrated[date] = parsed[date];
        }
      });
      return migrated;
    } catch (e) {
      console.error("Error parsing journals:", e);
      return {};
    }
  });

  const [allPinnedNotes, setAllPinnedNotes] = useState(() => {
    const saved = localStorage.getItem("pinnedNotes");
    if (!saved) return {};
    try {
      const parsed = JSON.parse(saved);
      // Migration: If it's the old array format, pick today as the key
      if (Array.isArray(parsed)) {
        const today = formatDate(new Date());
        return { [today]: parsed };
      }
      return parsed;
    } catch (e) {
      return {};
    }
  });

  const pinnedNotes = allPinnedNotes[selectedDate] || [];

  const setPinnedNotes = (newNotes) => {
    const updated = { ...allPinnedNotes, [selectedDate]: newNotes };
    setAllPinnedNotes(updated);
    localStorage.setItem("pinnedNotes", JSON.stringify(updated));
  };

  const t = TRANSLATIONS[lang];

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

  const updateProfile = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const addUpdateToGroup = (groupId, text) => {
    const newGroups = groups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          updates: [
            {
              id: Date.now(),
              user: user.name,
              text,
              time: new Date().toLocaleTimeString(),
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
    if (groups.find((g) => g.code === code)) return;
    const newGroup = {
      id: "g" + Date.now(),
      name: "New Joined Group",
      role: "member",
      code,
      updates: [],
      tasks: [],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    localStorage.setItem("groups", JSON.stringify(updated));
    setActiveGroupId(newGroup.id);
  };

  const updateGroupTask = (groupId, taskId, status) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        const newTasks = g.tasks.map((t) => {
          if (t.id === taskId) return { ...t, status };
          return t;
        });
        return { ...g, tasks: newTasks };
      }
      return g;
    });
    setGroups(updated);
    localStorage.setItem("groups", JSON.stringify(updated));
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

  const saveJournal = (date, entries) => {
    const updated = { ...journals, [date]: entries };
    setJournals(updated);
    localStorage.setItem("journals", JSON.stringify(updated));
  };

  const saveTodos = (date, todos) => {
    const updated = { ...todoLists, [date]: todos };
    setTodoLists(updated);
    localStorage.setItem("todoLists", JSON.stringify(updated));
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

  const saveDailyHabit = (date, habit) => {
    const updated = { ...dailyHabits, [date]: habit };
    setDailyHabits(updated);
    localStorage.setItem("dailyHabits", JSON.stringify(updated));
  };

  const addPinnedNote = (title, content) => {
    const id = "p" + Date.now();
    const newNote = {
      id,
      title: title || (lang === "en" ? "New Note" : "ملاحظة جديدة"),
      content:
        content || (lang === "en" ? "Note content..." : "محتوى الملاحظة..."),
      color: "#394867",
      hasVoice: false,
      hasImage: false,
      hasFile: false,
      pinned: true,
      timestamp: new Date().toLocaleDateString(
        lang === "en" ? "en-US" : "ar-EG",
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
    };
    const updatedForDate = [newNote, ...pinnedNotes];
    setPinnedNotes(updatedForDate);
    return id;
  };

  const deletePinnedNote = (id) => {
    const updatedForDate = pinnedNotes.filter((n) => n.id !== id);
    setPinnedNotes(updatedForDate);
  };

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
      case "tasks":
        const activeGroupForTasks =
          groups.find((g) => g.id === activeGroupId) || groups[0];
        return (
          <SharedTasksScreen
            {...commonProps}
            group={activeGroupForTasks}
            updateGroupTask={updateGroupTask}
            addGroupTask={addGroupTask}
          />
        );
      case "groups":
        return (
          <GroupsScreen
            {...commonProps}
            groups={groups}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            createGroup={createGroup}
            joinGroup={joinGroup}
            addUpdateToGroup={addUpdateToGroup}
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
          />
        );
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

  const handleLogin = (userData) => {
    const newUser = {
      ...user,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
    };
    setUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    setScreen("home");
  };

  if (!isLoggedIn) {
    return (
      <div
        className={`iphone-frame ${lang === "ar" ? "rtl" : ""} theme-${theme}`}
      >
        <AuthScreen t={t} lang={lang} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div
      className={`iphone-frame ${lang === "ar" ? "rtl" : ""} theme-${theme}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25 }}
          className="page-content"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {activeMeditation && (
        <MiniPlayer
          key={activeMeditation.id}
          t={t}
          lang={lang}
          item={activeMeditation}
          onClose={() => setActiveMeditation(null)}
          onComplete={() => recordMeditationCompletion(activeMeditation)}
        />
      )}

      <nav className="bottom-nav">
        <button
          onClick={() => setScreen("home")}
          className={screen === "home" ? "active" : ""}
        >
          <Home size={24} />
          <span>{t.home}</span>
        </button>
        <button
          onClick={() => setScreen("explore")}
          className={screen === "explore" ? "active" : ""}
        >
          <Compass size={24} />
          <span>{t.explore}</span>
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            marginTop: "-40px",
          }}
        >
          <button className="add-btn" onClick={() => setScreen("groups")}>
            <Users size={32} />
          </button>
        </div>
        <button
          onClick={() => setScreen("details")}
          className={screen === "details" ? "active" : ""}
        >
          <ClipboardList size={24} />
          <span>{t.journey}</span>
        </button>
        <button
          onClick={() => setScreen("profile")}
          className={screen === "profile" ? "active" : ""}
        >
          <User size={24} />
          <span>{t.profile}</span>
        </button>
      </nav>
    </div>
  );
}

function AuthScreen({ t, lang, onLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [code, setCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    const SERVICE_ID = "yousifhassan";
    const TEMPLATE_ID = "template_w8msif4";
    const PUBLIC_KEY = "WLsGw6u5xkDBazIXW";
    const RESEND_API_KEY = "re_hHbrebM4_PMy2KmQD7RXsLZRvoMtLprAN";

    setLoading(true);
    setError("");

    // 1. Generate real 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    try {
      console.log("Attempting Professional Send (Resend)...");

      // Note: Transactional services like Resend often require a backend.
      // We will try sending via EmailJS with your new Template ID first as it's the safest 'bridge'
      // to avoid CORS errors in a pure React app.

      emailjs.init(PUBLIC_KEY);
      const templateParams = {
        name: formData.name,
        user_email: formData.email,
        message: otp,
        reply_to: "no-reply@zenflow.com",
      };

      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
      );

      if (result.status === 200 || result.text === "OK") {
        console.log("✓ Professional Delivery Successful");
        setStep(2);
      } else {
        throw new Error(`Delivery status: ${result.status}`);
      }
    } catch (err) {
      console.error("Delivery Error:", err);
      const errorDetail = err.text || err.message || "";

      if (errorDetail.includes("Gmail_API") || errorDetail.includes("grant")) {
        alert(
          lang === "en"
            ? "Your Gmail connection is broken. Please use the SMTP method or Resend Bridge in EmailJS."
            : "اتصال Gmail مقطوع. يرجى استخدام طريقة SMTP أو ربط Resend في لوحة تحكم EmailJS.",
        );
      } else {
        setError(lang === "en" ? "Delivery failed." : "فشل الإرسال.");
      }

      // Error feedback is already handled above via alert or setError
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (code === generatedOtp) {
      onLogin(formData);
    } else {
      setError(t.invalidCode);
      // Subtle shake or bounce could be added here
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
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "0px" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto -30px",
          }}
        >
          <img
            src="/logo.png"
            alt="Control Logo"
            style={{
              width: "380px",
              height: "auto",
              filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.08))",
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
                {t.phoneLabel}
              </label>
              <input
                required
                type="tel"
                placeholder="+964 7XX XXX XXXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
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
                background: "#D35400",
                color: "white",
                fontWeight: 700,
                fontSize: "1.1rem",
                marginTop: "10px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(211, 84, 0, 0.25)",
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
                  color: "#D35400",
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const updateNoteTitle = (id, newTitle) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, title: newTitle } : n,
    );
    setPinnedNotes(updated);
  };

  const updateNoteContent = (id, newContent) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, content: newContent } : n,
    );
    setPinnedNotes(updated);
  };

  const updateNoteImage = (id, imageUrl) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, image: imageUrl, hasImage: !!imageUrl } : n,
    );
    setPinnedNotes(updated);
  };

  const updateNoteColor = (id, color) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, color: color } : n,
    );
    setPinnedNotes(updated);
  };

  const updateNoteLink = (id, link) => {
    const updated = pinnedNotes.map((n) =>
      n.id === id ? { ...n, link: link } : n,
    );
    setPinnedNotes(updated);
  };

  const handleAddNote = () => {
    const newId = addPinnedNote();
    setExpandedNoteId(newId);
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
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === "en" ? "AR" : "EN"}
          </button>
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
              opacity: 0.5,
            }}
          >
            <Settings size={18} />
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
                      color: note.color,
                      textDecoration: "underline",
                      marginTop: "5px",
                      background: "rgba(255,255,255,0.2)",
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
  const [newTask, setNewTask] = useState({ title: "", desc: "", assigned: "" });

  if (!group) return null;

  const handleAddTask = () => {
    if (newTask.title && newTask.assigned) {
      addGroupTask(group.id, {
        title: { en: newTask.title, ar: newTask.title },
        desc: { en: newTask.desc, ar: newTask.desc },
        assigned: newTask.assigned,
      });
      setNewTask({ title: "", desc: "", assigned: "" });
      setShowAdd(false);
    }
  };

  return (
    <div className="tasks-screen">
      <div className="top-nav-bar">
        <button className="nav-icon-btn" onClick={() => setScreen("groups")}>
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <h2 style={{ margin: 0 }}>{group.name}</h2>
          <span style={{ fontSize: "0.75rem", color: PALETTE.GRAY }}>
            {t.sharedTasks}
          </span>
        </div>
        <button className="nav-icon-btn" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={24} />
        </button>
      </div>

      {showAdd && group.role === "manager" && (
        <div
          className="card slide-up"
          style={{
            padding: "20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder={t.groupName}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            style={editInputStyle(lang)}
          />
          <input
            type="text"
            placeholder={t.assignedTo}
            value={newTask.assigned}
            onChange={(e) =>
              setNewTask({ ...newTask, assigned: e.target.value })
            }
            style={editInputStyle(lang)}
          />
          <button
            onClick={handleAddTask}
            className="btn-primary"
            style={{ height: "45px" }}
          >
            {t.save}
          </button>
        </div>
      )}

      <div
        className="tasks-list"
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {group.tasks.map((task) => (
          <div
            key={task.id}
            className={`task-item ${task.status}`}
            onClick={() =>
              task.status !== "locked" &&
              updateGroupTask(
                group.id,
                task.id,
                task.status === "completed" ? "active" : "completed",
              )
            }
          >
            <div
              className="task-number"
              style={{
                background:
                  task.status === "completed" ? PALETTE.GREEN : PALETTE.TEAL,
              }}
            >
              {task.assigned.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div className="task-header-row">
                <h3 style={{ margin: 0, fontSize: "1rem" }}>
                  {task.title[lang]}
                </h3>
                {task.status === "active" && (
                  <div className="active-indicator" />
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: PALETTE.GRAY }}>
                {task.desc[lang]}
              </p>
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <User size={12} color={PALETTE.GRAY} />
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: PALETTE.TEAL,
                  }}
                >
                  {task.assigned}
                </span>
              </div>
            </div>
            <div className="task-status-icon">
              {task.status === "completed" ? (
                <CheckCircle2 color={PALETTE.GREEN} size={24} />
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `2px solid ${PALETTE.ICE}`,
                  }}
                />
              )}
            </div>
          </div>
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
              backgroundColor: "var(--card-bg, rgba(255,255,255,0.05))",
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
                  : "var(--card-bg, white)",
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
              backgroundColor: "var(--card-bg, white)",
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
    </div>
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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  // Sync formData when user changes or entering edit mode
  React.useEffect(() => {
    setFormData({ ...user });
  }, [user, isEditing]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
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
        <div style={statCardStyle}>
          <MessageCircle
            size={22}
            color={PALETTE.GREEN}
            style={{ margin: "0 auto 6px" }}
          />
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>42</div>
          <div style={{ fontSize: "0.65rem", color: PALETTE.GRAY }}>
            {t.journal}s
          </div>
        </div>
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
          icon={<Settings size={20} color={PALETTE.NAVY} />}
          label={t.settings}
        >
          <ChevronLeft
            size={20}
            style={{
              transform: lang === "en" ? "rotate(180deg)" : "none",
              color: PALETTE.GRAY,
            }}
          />
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

function GroupsScreen({
  t,
  lang,
  groups,
  activeGroupId,
  setActiveGroupId,
  createGroup,
  joinGroup,
  addUpdateToGroup,
  setScreen,
}) {
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [newUpdate, setNewUpdate] = useState("");

  const handleCreate = () => {
    if (groupName) {
      createGroup(groupName);
      setGroupName("");
      setIsPanelOpen(false);
    }
  };
  const handleJoin = () => {
    if (groupCode) {
      joinGroup(groupCode);
      setGroupCode("");
      setIsPanelOpen(false);
    }
  };
  const handleSend = () => {
    if (newUpdate && activeGroup) {
      addUpdateToGroup(activeGroup.id, newUpdate);
      setNewUpdate("");
    }
  };

  return (
    <div className="groups-screen">
      <header className="header">
        <h1 style={{ fontSize: "28px", color: PALETTE.DEEP_NAVY }}>
          {t.groups}
        </h1>
        <button
          className="nav-icon-btn"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <Plus size={20} />
        </button>
      </header>

      {isPanelOpen && (
        <div
          className="card slide-up"
          style={{
            padding: "20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ fontSize: "0.9rem" }}>{t.createGroup}</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder={t.groupName}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={editInputStyle(lang)}
              />
              <button
                onClick={handleCreate}
                style={{
                  background: PALETTE.TEAL,
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ fontSize: "0.9rem" }}>{t.joinGroup}</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder={t.enterGroupCode}
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                style={editInputStyle(lang)}
              />
              <button
                onClick={handleJoin}
                style={{
                  background: PALETTE.NAVY,
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "40px", color: PALETTE.GRAY }}
        >
          {t.noGroups}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "15px",
              scrollbarWidth: "none",
            }}
          >
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "20px",
                  border: "none",
                  background: activeGroupId === g.id ? PALETTE.TEAL : "white",
                  color: activeGroupId === g.id ? "white" : PALETTE.NAVY,
                  boxShadow: "var(--shadow-soft)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                {g.name}
              </button>
            ))}
          </div>

          {activeGroup && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={activeGroup.id}
            >
              <div
                className="card"
                style={{
                  padding: "24px",
                  marginBottom: "24px",
                  borderRadius: "32px",
                  border: `2px solid ${PALETTE.ICE}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.4rem",
                        margin: "0 0 5px 0",
                        color: PALETTE.DEEP_NAVY,
                      }}
                    >
                      {activeGroup.name}
                    </h2>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background:
                          activeGroup.role === "manager"
                            ? PALETTE.BEIGE
                            : PALETTE.ICE,
                        padding: "4px 12px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        color: PALETTE.DEEP_NAVY,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {activeGroup.role === "manager"
                        ? t.roleManager
                        : t.roleMember}
                    </span>
                  </div>
                  <div style={{ textAlign: lang === "ar" ? "left" : "right" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: PALETTE.GRAY,
                        fontWeight: 600,
                      }}
                    >
                      CODE
                    </span>
                    <div
                      style={{
                        fontWeight: 800,
                        color: PALETTE.TEAL,
                        fontSize: "1.1rem",
                      }}
                    >
                      {activeGroup.code}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setScreen("tasks")}
                  className="btn-primary"
                  style={{
                    height: "52px",
                    fontSize: "0.95rem",
                    background: PALETTE.ICE,
                    color: PALETTE.NAVY,
                    borderRadius: "16px",
                    fontWeight: 600,
                  }}
                >
                  {t.viewGroup}
                </button>
              </div>

              <h3 style={{ marginBottom: "15px", paddingLeft: "5px" }}>
                {t.groupFeed}
              </h3>
              <div
                className="feed-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginBottom: "100px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    background: "white",
                    padding: "10px",
                    borderRadius: "20px",
                    boxShadow: "var(--shadow-soft)",
                  }}
                >
                  <input
                    type="text"
                    placeholder={t.sendUpdate}
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    style={{
                      ...editInputStyle(lang),
                      background: PALETTE.ICE,
                      border: "none",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    style={{
                      background: PALETTE.TEAL,
                      color: "white",
                      border: "none",
                      minWidth: "48px",
                      height: "48px",
                      borderRadius: "15px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <MessageCircle size={22} />
                  </button>
                </div>

                {activeGroup.updates.map((update) => (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={update.id}
                    className="card"
                    style={{
                      padding: "18px",
                      marginBottom: 0,
                      borderRadius: "24px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: PALETTE.TEAL,
                        }}
                      >
                        {update.user}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: PALETTE.GRAY }}>
                        {update.time}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        color: PALETTE.DEEP_NAVY,
                        lineHeight: "1.5",
                      }}
                    >
                      {update.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function NotificationScreen({
  t,
  lang,
  setScreen,
  notifications,
  setNotifications,
}) {
  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "system":
        return {
          icon: <Settings size={20} />,
          bg: "#E3EEFF",
          color: "#4A90E2",
        };
      case "social":
        return { icon: <Users size={20} />, bg: "#E8F5E9", color: "#4CAF50" };
      case "milestone":
        return { icon: <Award size={20} />, bg: "#FFF9C4", color: "#FBC02D" };
      case "reminder":
        return { icon: <Bell size={20} />, bg: "#FFEBEE", color: "#EF5350" };
      default:
        return { icon: <Bell size={20} />, bg: "#F5F5F5", color: "#9E9E9E" };
    }
  };

  return (
    <div className="notifications-screen fade-in">
      <header
        className="header"
        style={{
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <button className="nav-icon-btn" onClick={() => setScreen("home")}>
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontSize: "1.5rem" }}>
          {t.notificationsCenter}
        </h1>
        {notifications.length > 0 && (
          <button className="nav-icon-btn" onClick={markAllRead}>
            <CheckCircle2 size={22} color={PALETTE.TEAL} />
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} style={{ opacity: 0.2, marginBottom: "15px" }} />
          <p>
            {lang === "en" ? "No new notifications" : "لا توجد تنبيهات جديدة"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {notifications.map((n) => {
            const style = getNotificationIcon(n.type);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={n.id}
                className="notification-card"
                style={{
                  opacity: n.read ? 0.8 : 1,
                  cursor: "pointer",
                }}
                onClick={() => {
                  const updated = notifications.map((notif) =>
                    notif.id === n.id ? { ...notif, read: true } : notif,
                  );
                  setNotifications(updated);
                }}
              >
                {!n.read && <div className="unread-indicator" />}

                <div
                  className="notification-icon-wrapper"
                  style={{
                    backgroundColor: style.bg,
                    color: style.color,
                  }}
                >
                  {style.icon}
                </div>

                <div className="notification-content">
                  <p
                    style={{
                      margin: 0,
                      fontWeight: n.read ? 500 : 700,
                      fontSize: "0.95rem",
                      lineHeight: "1.4",
                      color: "var(--text-main)",
                    }}
                  >
                    {n.text}
                  </p>
                  <div className="notification-time">{n.time}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnalyticsScreen({
  t,
  lang,
  setScreen,
  user,
  journals,
  todoLists,
  meditationHistory,
}) {
  // 1. Total Focus Calculation
  const totalMinutes = meditationHistory.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0,
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  // 2. Journal Streak Calculation
  let journalStreak = 0;
  let checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const dayData = journals[dateStr];
    const hasEntry =
      dayData &&
      ((Array.isArray(dayData) && dayData.length > 0) ||
        (dayData.entries && dayData.entries.length > 0) ||
        dayData.title ||
        dayData.image);

    if (hasEntry) {
      journalStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If it's today and empty, check yesterday to see if we can still count the streak
      if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  // 3. Task Success Rate
  let totalTasks = 0;
  let completedTasks = 0;
  Object.values(todoLists).forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((task) => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    }
  });
  const taskRatio =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: t.totalFocus,
      value: totalHours + "h",
      color: PALETTE.TEAL,
      icon: <Compass size={24} />,
    },
    {
      label: t.journalStreak,
      value: journalStreak.toString(),
      color: PALETTE.GREEN,
      icon: <BookOpen size={24} />,
    },
    {
      label: t.tasksRatio,
      value: taskRatio + "%",
      color: "#E63946",
      icon: <Award size={24} />,
    },
  ];

  return (
    <div className="analytics-screen fade-in">
      <header className="header" style={{ marginBottom: "30px" }}>
        <button className="nav-icon-btn" onClick={() => setScreen("home")}>
          <ChevronLeft
            size={24}
            style={{ transform: lang === "ar" ? "rotate(180deg)" : "none" }}
          />
        </button>
        <h1 style={{ flex: 1, textAlign: "center", margin: 0 }}>
          {t.analytics}
        </h1>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              borderRadius: "32px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: PALETTE.ICE,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: s.color,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: PALETTE.GRAY,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: PALETTE.DEEP_NAVY,
                }}
              >
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: "20px" }}>{t.achievements}</h3>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
      >
        {user.achievements.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{
              padding: "20px",
              textAlign: "center",
              borderRadius: "28px",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
              {a.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{a.title}</div>
            <div style={{ fontSize: "0.7rem", color: PALETTE.GRAY }}>
              {a.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPlayer({ t, lang, item, onClose, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const totalSeconds = parseInt(item.duration) * 60 || 600;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isFinished, setIsFinished] = useState(false);
  const soundRef = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    ),
  );

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      setIsPlaying(false);
      setIsFinished(true);
      if (onComplete) onComplete();
      if (soundRef.current) {
        soundRef.current.play().catch((e) => console.log("Audio error:", e));
      }
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, isFinished, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <motion.div
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 200, opacity: 0 }}
      className="mini-player"
      style={{
        position: "fixed",
        bottom: "85px",
        left: "15px",
        right: "15px",
        padding: "24px",
        borderRadius: "32px",
        zIndex: 1100,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Circular Progress Container */}
        <div style={{ position: "relative", width: "65px", height: "65px" }}>
          <svg
            style={{
              transform: "rotate(-90deg)",
              width: "65px",
              height: "65px",
            }}
          >
            <circle
              cx="32.5"
              cy="32.5"
              r="28"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="32.5"
              cy="32.5"
              r="28"
              stroke="#D35400"
              strokeWidth="4"
              fill="none"
              strokeDasharray="176"
              animate={{ strokeDashoffset: 176 - (176 * progress) / 100 }}
              transition={{ duration: 1 }}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1.8rem",
            }}
          >
            {item.icon || "🧘"}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              marginBottom: "2px",
              color: "white",
            }}
          >
            {item.title[lang]}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: isFinished ? "#27ae60" : "rgba(255,255,255,0.6)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isFinished ? (
              <>
                <CheckCircle2 size={14} /> {t.completed}
              </>
            ) : (
              <span>{isPlaying ? t.meditating : t.play}</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "5px",
          }}
        >
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              color: "#D35400",
              textShadow: "0 0 10px rgba(211, 84, 0, 0.3)",
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                if (isFinished) {
                  setTimeLeft(totalSeconds);
                  setIsFinished(false);
                }
                setIsPlaying(!isPlaying);
              }}
              style={{
                background: isPlaying ? "rgba(255,255,255,0.15)" : "#D35400",
                color: "white",
                border: "none",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {isPlaying ? (
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderLeft: "3px solid white",
                    borderRight: "3px solid white",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    borderLeft: "12px solid white",
                    marginLeft: "2px",
                  }}
                />
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                color: "rgba(255,255,255,0.4)",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "2px",
              }}
            >
              <Plus size={24} style={{ transform: "rotate(45deg)" }} />
            </button>
          </div>
        </div>
      </div>
      {/* Modern Slim progress line */}
      <div
        style={{
          height: "2px",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "1px",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          style={{
            height: "100%",
            backgroundColor: "#D35400",
          }}
        />
      </div>{" "}
    </motion.div>
  );
}

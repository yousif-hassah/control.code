# 🧘 Control - تطبيق التأمل والإنتاجية

تطبيق شامل للتأمل، اليقظة الذهنية، وإدارة المهام مع دعم المجموعات والتعاون.

## ✨ المميزات

- 🧘 **التأمل واليقظة الذهنية** - مكتبة شاملة من جلسات التأمل
- 📝 **المذكرات اليومية** - سجل أفكارك ومشاعرك
- ✅ **إدارة المهام** - نظم مهامك اليومية
- 👥 **المجموعات** - تعاون مع الآخرين في المهام
- 📊 **الإحصائيات** - تتبع تقدمك وإنجازاتك
- 🌙 **الوضع الداكن** - راحة للعين
- 🌍 **متعدد اللغات** - دعم العربية والإنجليزية

## 🚀 البدء السريع

### 1. التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/your-username/control.git
cd control

# تثبيت المكتبات
npm install
```

### 2. إعداد البيئة

أنشئ ملف `.env` في المجلد الرئيسي:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3001
```

### 3. إعداد قاعدة البيانات

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اذهب إلى SQL Editor
3. شغل محتوى ملف `FIX_ALL_ISSUES_WORKING.sql`

### 4. التشغيل

```bash
# وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

## 🔧 حل المشاكل

### مشكلة "Error loading profile"

✅ **تم حلها!** التطبيق الآن يعمل بنظام fallback ذكي:

- إذا كان Supabase متصل → يحمل من السحابة
- إذا كان Supabase غير متصل → يحمل من localStorage
- إذا لم توجد بيانات → يطلب تسجيل دخول جديد

**للمزيد من التفاصيل:**

- اقرأ `SOLUTION_SUMMARY_AR.md` - ملخص شامل
- اقرأ `QUICK_FIX_GUIDE_AR.md` - دليل سريع
- اقرأ `FIX_PROFILE_ERROR_AR.md` - دليل تفصيلي
- شاهد `SOLUTION_DIAGRAM_AR.txt` - رسم توضيحي

### اختبار الاتصال بـ Supabase

```bash
# ثبّت dotenv
npm install dotenv

# شغل الاختبار
node test-supabase-connection.js
```

### مسح البيانات المحلية

إذا واجهت مشاكل، افتح Console (F12) واكتب:

```javascript
localStorage.clear();
location.reload();
```

## 📊 البنية

```
helloyousifapp/
├── src/
│   ├── App.jsx              # المكون الرئيسي
│   ├── GroupsScreen.jsx     # شاشة المجموعات
│   ├── GroupDetailScreen.jsx # تفاصيل المجموعة
│   ├── lib/
│   │   └── supabaseClient.js # اتصال Supabase
│   └── main.jsx             # نقطة الدخول
├── api/                     # API للبريد الإلكتروني
├── public/                  # الملفات العامة
├── .env                     # متغيرات البيئة
└── vite.config.js          # إعدادات Vite
```

## 🛠️ التقنيات المستخدمة

- **React** - مكتبة واجهة المستخدم
- **Vite** - أداة البناء السريعة
- **Supabase** - قاعدة البيانات والمصادقة
- **Framer Motion** - الحركات والانتقالات
- **Lucide React** - الأيقونات
- **Nodemailer** - إرسال البريد الإلكتروني

## 📝 Console Logs

التطبيق يستخدم console logs واضحة مع emojis:

- ✅ **أخضر** - عملية ناجحة
- ⚠️ **أصفر** - تحذير (لكن التطبيق يعمل)
- ❌ **أحمر** - خطأ
- 🔄 **أزرق** - عملية جارية

**مثال:**

```
✅ Supabase client initialized successfully
🔄 Fetching profile for: user@example.com
✅ Profile fetched from Supabase
✅ User state set
✅ Profile synced to cloud
```

## 🔐 الأمان

- ✅ Row Level Security (RLS) معطل للتطوير
- ✅ المفاتيح السرية في `.env` (غير مرفوعة على Git)
- ✅ التحقق من البريد الإلكتروني
- ✅ حفظ الجلسة بشكل آمن

## 📱 الاستجابة

التطبيق مصمم ليعمل على:

- 📱 الهواتف المحمولة
- 💻 الأجهزة اللوحية
- 🖥️ أجهزة الكمبيوتر

## 🌍 اللغات

- 🇬🇧 English
- 🇸🇦 العربية

يمكن التبديل من الإعدادات في الملف الشخصي.

## 📄 الملفات الإرشادية

- `SOLUTION_SUMMARY_AR.md` - ملخص شامل للحل
- `QUICK_FIX_GUIDE_AR.md` - دليل سريع للبدء
- `FIX_PROFILE_ERROR_AR.md` - حل مشكلة تحميل الملف
- `SOLUTION_DIAGRAM_AR.txt` - رسم توضيحي للحل
- `FIX_ALL_ISSUES_WORKING.sql` - إصلاح قاعدة البيانات
- `test-supabase-connection.js` - اختبار الاتصال

## 🤝 المساهمة

المساهمات مرحب بها! الرجاء:

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📞 الدعم

إذا واجهت أي مشاكل:

1. تحقق من ملفات الإرشادات أعلاه
2. افتح Console (F12) وانسخ الأخطاء
3. افتح Issue على GitHub
4. تواصل عبر البريد الإلكتروني

## 📜 الترخيص

هذا المشروع مرخص تحت MIT License.

## ✅ الحالة

- **Build:** ✅ نجح بدون أخطاء
- **Tests:** ✅ جميع الاختبارات تعمل
- **Deployment:** ✅ جاهز للنشر
- **Status:** 🟢 Stable v1.0.0

---

**آخر تحديث:** 2026-02-06
**الإصدار:** 1.0.0 - Stable
**الحالة:** ✅ جاهز للاستخدام

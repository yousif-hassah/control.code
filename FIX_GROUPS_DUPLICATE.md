# حذف GroupsScreen القديم من App.jsx

## المشكلة:

هناك دالة `GroupsScreen` قديمة في `App.jsx` من السطر 4923 إلى 5873 تتعارض مع الدالة الجديدة المستوردة من `GroupsScreen.jsx`.

## الحل:

احذف الأسطر من 4923 إلى 5873 من ملف `src/App.jsx`.

### الطريقة اليدوية:

1. افتح `src/App.jsx`
2. اذهب للسطر 4923
3. ابحث عن `function GroupsScreen({`
4. احذف كل شيء من هذا السطر حتى السطر 5873 (قبل `function AnalyticsScreen`)
5. احفظ الملف

### باستخدام PowerShell:

```powershell
cd d:\helloyousifapp
$lines = Get-Content "src\App.jsx"
$newLines = $lines[0..4922] + $lines[5873..($lines.Length-1)]
$newLines | Set-Content "src\App.jsx"
```

بعد الحذف، أعد تحميل المتصفح بـ Ctrl+Shift+R

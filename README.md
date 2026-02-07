# DesignSociety.website (Demo Gym/Admin) — Static (GitHub Pages)

## What's inside
- **Public page:** `index.html` (عرض الأعضاء + فلاتر + مجموعات)
- **Admin panel:** `admin.html` (Login + إدارة المجموعات + إدارة اللاعبين + دفعات + Backup/Export)
- **Data file in repo:** `club-data.json`

> ⚠️ مهم: ده مشروع **تجربة فقط**. مفيش Backend، وبالتالي:
> - تسجيل الدخول **مش حماية حقيقية** (البيانات موجودة في كود JS).
> - الأدمن بيحفظ البيانات محليًا (LocalStorage) ثم يعمل **Export** ويرفع `club-data.json` للريبو علشان الصفحة العامة تشوف آخر بيانات.

## Admin login
- user: `adminahmed`
- pass: `adminroot`

## How to publish changes (update the public data)
1) افتح: `admin.html`
2) عدّل البيانات (مجموعات/لاعبين/دفعات...)
3) من تبويب **Backup / Export**:
   - اضغط **Download club-data.json**
4) ارفع الملف `club-data.json` إلى الريبو (استبدل القديم) ثم Commit.
5) افتح `index.html` واضغط "تحديث البيانات" لو لسه في كاش.

## GitHub Pages + Custom Domain (quick)
- Settings → Pages → Deploy from `main / root`
- Custom domain: `designsociety.website`
- DNS: اربط الدومين مع GitHub Pages (A records) حسب توثيق GitHub.


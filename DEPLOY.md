# نشر نظام فنادق السعفة على Render (تجريبي مجاني)

النظام مُهيّأ ليعمل كـ**خدمة واحدة**: Django يخدم لوحة الإدارة + موقع النزلاء + الـAPI + الصور من نفس الدومين. لا حاجة لإعداد فرونت منفصل.

الريبو: https://github.com/MohamedBeheri/assaafa-hotels (خاص)

## خطوات النشر (٥ دقائق)

1. **أنشئ حساب** على https://render.com (مجاني — سجّل بحساب GitHub `MohamedBeheri`).
2. من الـDashboard اضغط **New +** ← **Blueprint**.
3. اختر ريبو **`assaafa-hotels`** (Render يقرأ `render.yaml` تلقائياً).
4. اضغط **Apply** — Render سيُنشئ:
   - خدمة ويب `assaafa-hotels` (Django + Gunicorn)
   - قاعدة بيانات PostgreSQL مجانية `assaafa-db`
   - يربطهما ويولّد `SECRET_KEY` تلقائياً
5. انتظر أول بناء (~3-5 دقائق). أول نشر يعبّئ البيانات والصور تلقائياً.
6. الرابط النهائي: `https://assaafa-hotels.onrender.com`

## الروابط بعد النشر

| الصفحة | الرابط |
|--------|--------|
| موقع النزلاء (الرئيسية) | `https://assaafa-hotels.onrender.com/site` |
| الحجز | `https://assaafa-hotels.onrender.com/book` |
| لوحة الإدارة | `https://assaafa-hotels.onrender.com/` |
| إدارة Django | `https://assaafa-hotels.onrender.com/admin/` |

## الدخول

- **المدير العام:** `admin` / `admin123`
- **استقبال السعفة:** `reception_sf` / `123456`

## ملاحظات النسخة التجريبية (الباقة المجانية)

- الخدمة **تنام بعد ١٥ دقيقة خمول** وتستيقظ خلال ~٣٠ ثانية عند أول زيارة (طبيعي في الباقة المجانية).
- **البيانات محفوظة في PostgreSQL** (تبقى بين إعادات التشغيل).
- **الصور المرفوعة أثناء التجربة** (صور الإثبات) مؤقتة وقد تُحذف عند إعادة النشر — أما صور الغرف والموقع فمحفوظة دائماً في الريبو.
- قاعدة PostgreSQL المجانية على Render صالحة ٩٠ يوماً.

## تحديث لاحق

أي تعديل: ادفع للـ`main` على GitHub، وRender يُعيد النشر تلقائياً.
```bash
# بعد تعديل الفرونت:
cd frontend && npm run build && rm -rf ../backend/frontend_dist && cp -r dist ../backend/frontend_dist
cd .. && git add -A && git commit -m "update" && git push
```

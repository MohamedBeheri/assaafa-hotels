/* إعادة تحميل الصور التي تفشل تلقائياً — تعالج بياض الصور عند إقلاع الخادم البارد (Render free) */
const attempts = new WeakMap<HTMLImageElement, number>();
const MAX = 4;

function onError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (!img || img.tagName !== "IMG" || !img.src) return;
  // تجاهل روابط data:/blob:
  if (img.src.startsWith("data:") || img.src.startsWith("blob:")) return;
  const n = attempts.get(img) || 0;
  if (n >= MAX) return;
  attempts.set(img, n + 1);
  const base = img.src.split("#retry")[0];
  // إعادة المحاولة بتأخير متصاعد مع كسر الكاش لإجبار طلب جديد
  setTimeout(() => { img.src = `${base}#retry${Date.now()}`; }, 800 * (n + 1));
}

export function installImageRetry() {
  // مرحلة الالتقاط لأن أحداث خطأ الصور لا تنتشر (لا تصعد)
  document.addEventListener("error", onError, true);
}

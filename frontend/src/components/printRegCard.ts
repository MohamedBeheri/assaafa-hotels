// بطاقة تسجيل النزيل (Registration Card) — مستند قانوني قابل للطباعة بهوية السعفة
export function printRegCard(r: any) {
  const rooms = (r.rooms || []).map((x: any) => `${x.type} (${x.number || "—"})`).join(" · ");
  const today = new Date().toISOString().slice(0, 10);
  const idTypes: Record<string, string> = {
    national_id: "هوية وطنية", iqama: "إقامة", passport: "جواز سفر",
    passport_diplomatic: "جواز دبلوماسي", passport_mission: "جواز مهام",
  };
  const g = r.guest_detail || {};
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>بطاقة تسجيل - ${r.code}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { font-family: 'Cairo','Tajawal',sans-serif; box-sizing: border-box; }
    body { color: #2B291F; }
    .head { display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid #6FA23C; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 800; color: #1F3320; }
    .brand small { display: block; font-size: 11px; color: #B8985A; letter-spacing: 2px; font-weight: 600; }
    .doc h1 { font-size: 20px; color: #96793F; margin: 0; text-align: left; }
    .doc span { font-size: 12px; color: #8d8775; }
    .code { display: inline-block; background: #FAF7F0; border-radius: 8px; padding: 6px 16px;
      font-weight: 800; color: #96793F; font-size: 16px; letter-spacing: 1px; }
    .sec { margin: 16px 0; }
    .sec h3 { font-size: 14px; color: #1F3320; border-inline-start: 3px solid #6FA23C; padding-inline-start: 8px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f0ede4; }
    td.k { color: #8d8775; width: 32%; }
    td.v { font-weight: 700; color: #2B291F; }
    .terms { font-size: 11px; color: #8d8775; line-height: 1.9; background: #FBF9F3; border-radius: 8px; padding: 12px 14px; margin-top: 8px; }
    .sign { display: flex; justify-content: space-between; margin-top: 34px; }
    .sign div { width: 45%; text-align: center; font-size: 12px; color: #6d6753; }
    .sign .line { border-top: 1.5px solid #999; margin-top: 40px; padding-top: 6px; }
    .foot { margin-top: 26px; text-align: center; font-size: 11px; color: #a49d89; }
  </style></head><body>
    <div class="head">
      <div class="brand">فنادق السعفة<small>AS'SAAFA HOTELS</small></div>
      <div class="doc"><h1>بطاقة تسجيل</h1><span>Registration Card · ${today}</span></div>
    </div>
    <div style="text-align:center;margin-bottom:16px"><span class="code">${r.code}</span></div>

    <div class="sec">
      <h3>بيانات النزيل</h3>
      <table><tbody>
        <tr><td class="k">الاسم</td><td class="v">${g.full_name || "—"}</td>
            <td class="k">الجنسية</td><td class="v">${g.nationality || "—"}</td></tr>
        <tr><td class="k">نوع الإثبات</td><td class="v">${idTypes[g.id_type] || g.id_type || "—"}</td>
            <td class="k">رقم الإثبات</td><td class="v">${g.id_number || "—"}</td></tr>
        <tr><td class="k">الجوال</td><td class="v" dir="ltr">${g.phone || "—"}</td>
            <td class="k">البريد</td><td class="v" dir="ltr">${g.email || "—"}</td></tr>
      </tbody></table>
    </div>

    <div class="sec">
      <h3>تفاصيل الإقامة</h3>
      <table><tbody>
        <tr><td class="k">الفندق</td><td class="v">${r.hotel_name || "—"}</td>
            <td class="k">الغرفة/النوع</td><td class="v">${rooms || "—"}</td></tr>
        <tr><td class="k">تاريخ الوصول</td><td class="v" dir="ltr">${r.check_in}</td>
            <td class="k">تاريخ المغادرة</td><td class="v" dir="ltr">${r.check_out}</td></tr>
        <tr><td class="k">عدد الليالي</td><td class="v">${r.nights}</td>
            <td class="k">النزلاء</td><td class="v">${r.adults} بالغ · ${r.children} طفل</td></tr>
        <tr><td class="k">إجمالي الإقامة</td><td class="v">${Number(r.rooms_total || 0).toLocaleString()} ر.س</td>
            <td class="k">المصدر</td><td class="v">${r.source_display || "—"}</td></tr>
      </tbody></table>
    </div>

    <div class="sec">
      <h3>الشروط والأحكام</h3>
      <div class="terms">
        بتوقيعي أقرّ بصحة البيانات أعلاه، وألتزم بأنظمة الفندق وسياسات الإقامة، وأتحمّل مسؤولية أي أضرار أو مستحقات مالية خلال فترة إقامتي.
        موعد تسجيل الخروج الساعة 12:00 ظهراً. الفندق غير مسؤول عن المقتنيات الثمينة غير المودعة في الخزنة.
      </div>
    </div>

    <div class="sign">
      <div><div class="line">توقيع النزيل</div></div>
      <div><div class="line">موظف الاستقبال</div></div>
    </div>
    <div class="foot">فنادق السعفة — المدينة المنورة · info@assaafahotels.com · نظام كفو لإدارة الفنادق</div>
  </body></html>`;
  const w = window.open("", "_blank", "width=900,height=800");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

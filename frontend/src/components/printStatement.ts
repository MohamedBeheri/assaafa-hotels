// كشف حساب شركة قابل للطباعة — يفتح نافذة طباعة بهوية فنادق السعفة
export function printStatement(s: any) {
  const c = s.company;
  const rows = s.rows
    .map(
      (r: any) => `<tr>
        <td>${r.number}</td><td>${r.guest}</td><td>${r.issued_at}</td>
        <td>${r.total.toLocaleString()}</td><td>${r.paid.toLocaleString()}</td>
        <td class="bal">${r.balance.toLocaleString()}</td><td>${r.status}</td>
      </tr>`
    )
    .join("");
  const today = new Date().toISOString().slice(0, 10);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>كشف حساب - ${c.name}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { font-family: 'Cairo','Tajawal',sans-serif; box-sizing: border-box; }
    body { color: #2B291F; }
    .head { display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid #6FA23C; padding-bottom: 14px; margin-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 800; color: #1F3320; }
    .brand small { display: block; font-size: 11px; color: #B8985A; letter-spacing: 2px; font-weight: 600; }
    .doc-title { text-align: left; }
    .doc-title h1 { font-size: 20px; color: #96793F; margin: 0; }
    .doc-title span { font-size: 12px; color: #8d8775; }
    .info { display: flex; gap: 30px; background: #FAF7F0; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px; font-size: 13px; }
    .info b { color: #1F3320; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1F3320; color: #fff; padding: 9px 8px; text-align: right; font-weight: 700; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .bal { color: #C0392B; font-weight: 700; }
    tfoot td { background: #F1EBDD; font-weight: 800; border-top: 2px solid #B8985A; }
    .foot { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #8d8775; }
    .stamp { margin-top: 40px; border: 1px dashed #B8985A; border-radius: 10px; padding: 14px; width: 220px; text-align: center; color: #96793F; font-size: 12px; }
  </style></head><body>
    <div class="head">
      <div class="brand">فنادق السعفة<small>AS'SAAFA HOTELS</small></div>
      <div class="doc-title"><h1>كشف حساب</h1><span>تاريخ الإصدار: ${today}</span></div>
    </div>
    <div class="info">
      <div>الحساب: <b>${c.name}</b> (${c.kind})</div>
      ${c.tax_number ? `<div>الرقم الضريبي: <b>${c.tax_number}</b></div>` : ""}
      ${c.phone ? `<div>الهاتف: <b>${c.phone}</b></div>` : ""}
      <div>حد الائتمان: <b>${c.credit_limit.toLocaleString()} ر.س</b></div>
    </div>
    <table>
      <thead><tr>
        <th>رقم الفاتورة</th><th>النزيل</th><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#999">لا توجد فواتير</td></tr>'}</tbody>
      <tfoot><tr>
        <td colspan="3">الإجمالي</td>
        <td>${s.totals.total.toLocaleString()}</td>
        <td>${s.totals.paid.toLocaleString()}</td>
        <td class="bal">${s.totals.balance.toLocaleString()}</td>
        <td></td>
      </tr></tfoot>
    </table>
    <div class="stamp">التوقيع والختم<br/><br/>_______________</div>
    <div class="foot">
      <span>فنادق السعفة — المدينة المنورة · info@assaafahotels.com</span>
      <span>نظام كفو لإدارة الفنادق</span>
    </div>
  </body></html>`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

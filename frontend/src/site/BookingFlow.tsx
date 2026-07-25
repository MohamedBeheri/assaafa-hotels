import React from "react";
import { API, ROOM_FALLBACK, SVC_ICONS, todayStr, plusDays, Palm, Gallery, ShareRow, useSite } from "./shared";

export default function BookingFlow() {
  const { t, lang, site, hotels } = useSite();
  const hotelName = (h: any) => (lang === "ar" ? h?.name_ar : h?.name_en) || "";
  const qp = React.useMemo(() => new URLSearchParams(window.location.search), []);

  const [step, setStep] = React.useState(1);
  const [mode, setMode] = React.useState<"single" | "group">("single");
  const [hotelId, setHotelId] = React.useState<number | null>(qp.get("hotel") ? Number(qp.get("hotel")) : null);
  const [checkIn, setCheckIn] = React.useState(qp.get("check_in") || todayStr());
  const [checkOut, setCheckOut] = React.useState(qp.get("check_out") || plusDays(todayStr(), 1));
  const [adults, setAdults] = React.useState(qp.get("adults") ? Number(qp.get("adults")) : 2);
  const [children, setChildren] = React.useState(qp.get("children") ? Number(qp.get("children")) : 0);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<any | null>(null);
  const [err, setErr] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [groupQty, setGroupQty] = React.useState<Record<number, number>>({});
  const [detail, setDetail] = React.useState<any | null>(null);
  const [detailImg, setDetailImg] = React.useState(0);
  const [svcQty, setSvcQty] = React.useState<Record<number, number>>({});
  const [form, setForm] = React.useState({ first_name: "", last_name: "", phone: "", email: "",
    nationality: "السعودية", id_type: "national_id", id_number: "", notes: "" });
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [done, setDone] = React.useState<any | null>(null);
  const autoRan = React.useRef(false);

  React.useEffect(() => {
    if (hotels.length && !hotelId) setHotelId(hotels[0].id);
  }, [hotels]);

  const hotelObj = hotels.find((h) => h.id === hotelId);
  const vatRate = hotelObj?.vat_rate ?? 15;

  const doSearch = React.useCallback(async (hid?: number) => {
    const useHotel = hid ?? hotelId;
    setErr("");
    if (!checkIn || !checkOut || checkIn >= checkOut) { setErr(t("errDates")); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/availability/?hotel=${useHotel}&check_in=${checkIn}&check_out=${checkOut}&adults=1`);
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "خطأ"); return; }
      setResults(d); setStep(2); setDone(null); setSvcQty({}); setGroupQty({});
      window.history.replaceState({}, "",
        `/book?hotel=${useHotel}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}`);
      setTimeout(() => document.getElementById("gs-results")?.scrollIntoView({ behavior: "smooth" }), 60);
    } finally { setLoading(false); }
  }, [hotelId, checkIn, checkOut, adults, children, lang]);

  React.useEffect(() => {
    if (!autoRan.current && hotels.length && qp.get("hotel") && qp.get("check_in")) {
      autoRan.current = true;
      doSearch(Number(qp.get("hotel")));
    }
  }, [hotels]);

  const svcList = hotelObj?.services || [];
  const svcTotal = svcList.reduce((sum: number, s: any, i: number) => sum + (svcQty[i] || 0) * s.price, 0);
  const groupRows = (results?.room_types || []).filter((rt: any) => (groupQty[rt.room_type] || 0) > 0);
  const roomSub = mode === "group"
    ? groupRows.reduce((s: number, rt: any) => s + rt.subtotal * (groupQty[rt.room_type] || 0), 0)
    : (selected?.subtotal || 0);
  const roomsCount = mode === "group"
    ? groupRows.reduce((s: number, rt: any) => s + (groupQty[rt.room_type] || 0), 0) : 1;
  const grandSub = roomSub + svcTotal;
  const grandVat = Math.round(grandSub * vatRate) / 100;
  const grandTotal = grandSub + grandVat;

  const doBook = async () => {
    setErr("");
    if (!form.first_name.trim() || !form.phone.trim()) { setErr(t("errReq")); return; }
    if (!form.nationality.trim() || !form.id_type || !form.id_number.trim()) { setErr(t("errId")); return; }
    setLoading(true);
    try {
      const services = svcList
        .map((s: any, i: number) => ({ id: s.id, qty: svcQty[i] || 0 }))
        .filter((s: any) => s.qty > 0);
      const rooms = mode === "group"
        ? groupRows.map((rt: any) => ({ room_type: rt.room_type, qty: groupQty[rt.room_type] }))
        : [{ room_type: selected.room_type, qty: 1 }];
      const fd = new FormData();
      fd.append("hotel", String(hotelId));
      fd.append("rooms", JSON.stringify(rooms));
      fd.append("check_in", checkIn);
      fd.append("check_out", checkOut);
      fd.append("adults", String(adults));
      fd.append("children", String(children));
      fd.append("services", JSON.stringify(services));
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (idFile) fd.append("id_document", idFile);
      const r = await fetch(`${API}/book/`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setErr(d.detail || "خطأ"); return; }
      setDone(d); setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setLoading(false); }
  };

  const steps = [t("s1"), t("s2"), t("s3"), t("s4")];
  const shareBookingTxt = done
    ? `${t("shareBookingTxt")} ${done.hotel} 🕌\n${t("shareCode")}: ${done.code}\n${done.check_in} → ${done.check_out} · ${done.total.toLocaleString()} SAR`
    : "";

  return (
    <div className="gs-book-page">
      {/* شريط علوي مصغّر */}
      <div className="gs-book-hero">
        <div className="gs-container">
          <span className="gs-loc-badge">{t("locBadge")}</span>
          <h1>{t("navBook")}</h1>
        </div>
      </div>

      {/* البحث */}
      <div className="gs-search gs-container" id="gs-search-card" style={{ marginTop: -46 }}>
        <div className="gs-search-card">
          <div className="gs-mode">
            <button className={mode === "single" ? "on" : ""} onClick={() => setMode("single")}>{t("modeSingle")}</button>
            <button className={mode === "group" ? "on" : ""} onClick={() => setMode("group")}>{t("modeGroup")}</button>
          </div>
          <div className="gs-field">
            <label>{t("hotel")}</label>
            <select value={hotelId ?? ""} onChange={(e) => setHotelId(Number(e.target.value))}>
              {hotels.map((h) => <option key={h.id} value={h.id}>{hotelName(h)} {"★".repeat(h.star_rating)}</option>)}
            </select>
          </div>
          <div className="gs-field">
            <label>{t("checkin")}</label>
            <input type="date" min={todayStr()} value={checkIn}
              onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(plusDays(e.target.value, 1)); }} />
          </div>
          <div className="gs-field">
            <label>{t("checkout")}</label>
            <input type="date" min={plusDays(checkIn, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div className="gs-field" style={{ flex: "0 1 100px" }}>
            <label>{t("adultsL")}</label>
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {Array.from({ length: mode === "group" ? 30 : 6 }, (_, n) => n + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="gs-field" style={{ flex: "0 1 100px" }}>
            <label>{t("childrenL")}</label>
            <select value={children} onChange={(e) => setChildren(Number(e.target.value))}>
              {Array.from({ length: mode === "group" ? 21 : 5 }, (_, n) => n).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="gs-search-btn" onClick={() => doSearch()} disabled={loading}>
            {loading ? t("searching") : t("search")}
          </button>
        </div>
        {err && step < 3 && <div className="gs-err" style={{ textAlign: "center" }}>{err}</div>}
      </div>

      {/* الخطوات */}
      <div className="gs-steps">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="bar" />}
            <span className={`gs-step ${step >= i + 1 ? "on" : ""}`}>
              <span className="dot">{step > i + 1 ? "✓" : i + 1}</span>{s}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* النتائج — فردي */}
      {step === 2 && results && mode === "single" && (
        <section className="gs-section gs-container" id="gs-results">
          <h2 className="gs-section-title">{t("roomsTitle")}<span className="gs-title-tick" /></h2>
          <p className="gs-section-sub">{t("roomsSub")} · {results.nights} {t("nights")}</p>
          <div className="gs-rooms">
            {results.room_types.filter((rt: any) => rt.max_adults >= Math.min(adults, 4)).map((rt: any) => (
              <div className="gs-room" key={rt.room_type}>
                <div className="gs-room-img" style={{ background: ROOM_FALLBACK, padding: 0 }}>
                  {rt.photos?.length
                    ? <Gallery photos={rt.photos} alt={rt.name_ar} onOpen={() => { setDetail(rt); setDetailImg(0); }} />
                    : <Palm size={86} />}
                  <span className="gs-room-badge">{rt.available > 0 ? `${rt.available} ${t("left")}` : t("soldout")}</span>
                </div>
                <div className="gs-room-body">
                  <h3 className="gs-room-name">{lang === "ar" ? rt.name_ar : (rt.name_en || rt.name_ar)}</h3>
                  <div className="gs-room-cap">
                    👤 {rt.max_adults} {t("adults")} · {rt.max_children} {t("children")}
                    <button onClick={() => { setDetail(rt); setDetailImg(0); }}
                      style={{ background: "none", border: "none", color: "#96793F", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, marginInlineStart: 6 }}>
                      {t("details")} ›
                    </button>
                  </div>
                  <div className="gs-chips">
                    {rt.amenities.slice(0, 4).map((a: any, j: number) => (
                      <span className="gs-chip" key={j}>{lang === "ar" ? a.name_ar : (a.name_en || a.name_ar)}</span>
                    ))}
                  </div>
                  <div className="gs-room-foot">
                    <div className="gs-price">
                      <b>{rt.avg_rate.toLocaleString()}</b> <span>{t("night")}</span>
                      <small>{t("totalFor")}: {rt.total.toLocaleString()} ر.س</small>
                    </div>
                    {rt.available > 0 ? (
                      <button className="gs-book-btn" onClick={() => { setSelected(rt); setStep(3); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("book")}</button>
                    ) : <span className="gs-soldout">{t("soldout")}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ShareRow text={`${t("brand")} — ${hotelName(hotelObj)} · ${checkIn} → ${checkOut}`} url={window.location.href} t={t} />
        </section>
      )}

      {/* النتائج — مجموعات */}
      {step === 2 && results && mode === "group" && (
        <section className="gs-section gs-container" id="gs-results">
          <h2 className="gs-section-title">{t("groupTitle")}<span className="gs-title-tick" /></h2>
          <p className="gs-section-sub">{t("groupSub")} · {results.nights} {t("nights")} · 👤 {adults} {t("adults")} + {children} {t("children")}</p>
          <div className="gs-group-rows">
            {results.room_types.map((rt: any) => {
              const q = groupQty[rt.room_type] || 0;
              return (
                <div className="gs-group-row" key={rt.room_type}>
                  {rt.photos?.[0]
                    ? <img src={rt.photos[0]} alt={rt.name_ar} onClick={() => { setDetail(rt); setDetailImg(0); }} style={{ cursor: "pointer" }} />
                    : <div style={{ width: 92, height: 64, borderRadius: 10, background: ROOM_FALLBACK }} />}
                  <div className="gs-group-info">
                    <b>{lang === "ar" ? rt.name_ar : (rt.name_en || rt.name_ar)}</b>
                    <small>👤 {rt.max_adults} {t("adults")} · {rt.max_children} {t("children")} — {rt.available} {t("left")}</small>
                  </div>
                  <div className="gs-group-price">{rt.avg_rate.toLocaleString()} {t("night")}</div>
                  <div className="gs-qty">
                    <button onClick={() => setGroupQty({ ...groupQty, [rt.room_type]: Math.max(q - 1, 0) })}>−</button>
                    <b>{q}</b>
                    <button disabled={q >= rt.available} onClick={() => setGroupQty({ ...groupQty, [rt.room_type]: Math.min(q + 1, rt.available) })}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
          {roomsCount > 0 && (
            <div className="gs-group-bar">
              <span>🛏 {roomsCount} {t("roomsSel")} · <b>{(roomSub * (1 + vatRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س</b> {t("totalFor")}</span>
              <button className="gs-search-btn" onClick={() => { setStep(3); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("continueBtn")}</button>
            </div>
          )}
        </section>
      )}

      {/* النموذج */}
      {step === 3 && (mode === "group" ? roomsCount > 0 : selected) && (
        <section className="gs-section gs-container">
          <div className="gs-form-wrap">
            <h2 className="gs-section-title">{t("formTitle")}<span className="gs-title-tick" /></h2>
            <p className="gs-section-sub" />
            <div className="gs-panel">
              <div className="gs-summary">
                <span>🏨 <b>{hotelName(hotelObj)}</b></span>
                {mode === "single"
                  ? <span>🛏 <b>{lang === "ar" ? selected.name_ar : (selected.name_en || selected.name_ar)}</b></span>
                  : <span>🛏 <b>{groupRows.map((rt: any) => `${lang === "ar" ? rt.name_ar : rt.name_en} ×${groupQty[rt.room_type]}`).join(" · ")}</b></span>}
                <span>📅 <b dir="ltr">{checkIn} → {checkOut}</b> ({results?.nights} {t("nights")})</span>
                <span>👤 <b>{adults} {t("adults")} + {children} {t("children")}</b></span>
              </div>
              <div className="gs-grid2">
                <div className="gs-field"><label>{t("firstName")} *</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
                <div className="gs-field"><label>{t("lastName")}</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
                <div className="gs-field"><label>{t("phone")} *</label>
                  <input type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="gs-field"><label>{t("email")}</label>
                  <input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="gs-field"><label>{t("nationality")} *</label>
                  <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
                <div className="gs-field"><label>{t("idType")} *</label>
                  <select value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })}>
                    {["national_id", "iqama", "passport", "passport_diplomatic", "passport_mission"].map((k) => (
                      <option key={k} value={k}>{t("idTypes_" + k)}</option>
                    ))}
                  </select></div>
                <div className="gs-field"><label>{t("idNumber")} *</label>
                  <input dir="ltr" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
                <div className="gs-field"><label>{t("notes")}</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="gs-field" style={{ gridColumn: "1 / -1" }}>
                  <label>{t("idDoc")}</label>
                  <label className="gs-upload">
                    <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                    <span className="gs-upload-btn">📎 {idFile ? idFile.name : t("chooseFile")}</span>
                  </label>
                  <div className="gs-hint">{t("idDocHint")}</div>
                </div>
              </div>

              {svcList.length > 0 && (
                <>
                  <h3 style={{ margin: "22px 0 0", fontSize: 16.5, color: "#2C4A2B" }}>✨ {t("extrasTitle")}</h3>
                  <div className="gs-services">
                    {svcList.map((s: any, i: number) => {
                      const q = svcQty[i] || 0;
                      return (
                        <div className={`gs-svc ${q > 0 ? "on" : ""}`} key={s.id} onClick={() => { if (!q) setSvcQty({ ...svcQty, [i]: 1 }); }}>
                          <div className="gs-svc-top">
                            <span>{SVC_ICONS[s.icon] || "✨"} {lang === "ar" ? s.name_ar : (s.name_en || s.name_ar)}</span>
                            <span className={`gs-svc-price ${!s.price ? "gs-free" : ""}`}>{s.price ? `${s.price.toLocaleString()} ر.س` : t("free")}</span>
                          </div>
                          {q > 0 && (
                            <div className="gs-qty" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSvcQty({ ...svcQty, [i]: q - 1 })}>−</button>
                              <b>{q}</b>
                              <button onClick={() => setSvcQty({ ...svcQty, [i]: q + 1 })}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="gs-breakdown">
                <div><span>{t("roomPrice")} ({roomsCount} × {results?.nights} {t("nights")})</span><b>{roomSub.toLocaleString()} ر.س</b></div>
                {svcTotal > 0 && <div><span>{t("svcPrice")}</span><b>{svcTotal.toLocaleString()} ر.س</b></div>}
                <div><span>{t("vat")}</span><b>{grandVat.toLocaleString()} ر.س</b></div>
              </div>
              <div className="gs-total-row">
                <span style={{ fontWeight: 800, color: "#6d6753" }}>{t("total")}</span>
                <b>{grandTotal.toLocaleString()} ر.س</b>
              </div>
              {err && <div className="gs-err">{err}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="gs-search-btn" style={{ flex: 1 }} onClick={doBook} disabled={loading}>
                  {loading ? t("booking") : t("confirm")}
                </button>
                <button className="gs-nav-ghost" style={{ borderColor: "#CFC8B4", color: "#6d6753" }} onClick={() => { setStep(2); setErr(""); }}>{t("back")}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* التأكيد */}
      {step === 4 && done && (
        <section className="gs-section gs-container">
          <div className="gs-ticket">
            <div className="check">✓</div>
            <h3>{t("doneTitle")}</h3>
            <p style={{ color: "#8d8775", margin: 0 }}>{t("doneP")}</p>
            <div className="gs-code">{done.code}</div>
            <table><tbody>
              <tr><td>{t("dHotel")}</td><td>{done.hotel}</td></tr>
              <tr><td>{t("dRooms")}</td><td>{(done.rooms || []).map((r: any) => `${r.type} (${r.number})`).join(" · ")}</td></tr>
              <tr><td>{t("dGuests")}</td><td>{done.adults} {t("adults")} + {done.children} {t("children")}</td></tr>
              <tr><td>{t("dDates")}</td><td dir="ltr">{done.check_in} → {done.check_out}</td></tr>
              {done.services?.length > 0 && (
                <tr><td>{t("dServices")}</td><td>{done.services.map((s: any) => `${s.name} ×${s.qty}`).join(" · ")}</td></tr>
              )}
              <tr><td>{t("dTotal")}</td><td>{done.total.toLocaleString()} ر.س</td></tr>
            </tbody></table>
            <ShareRow text={shareBookingTxt} t={t} />
            <button className="gs-search-btn" style={{ marginTop: 18 }}
              onClick={() => { setStep(1); setResults(null); setDone(null); setSelected(null); setSvcQty({}); setGroupQty({}); window.scrollTo({ top: 0 }); }}>
              {t("newSearch")}
            </button>
          </div>
        </section>
      )}

      {/* مودال تفاصيل الغرفة */}
      {detail && (
        <div className="gs-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="gs-modal gs-detail">
            <div className="gs-detail-hero">
              {detail.photos?.length
                ? <img src={detail.photos[detailImg]} alt={detail.name_ar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ height: "100%", background: ROOM_FALLBACK, display: "grid", placeItems: "center" }}><Palm size={110} /></div>}
              <button className="gs-detail-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            {detail.photos?.length > 1 && (
              <div className="gs-thumbs">
                {detail.photos.map((p: string, j: number) => (
                  <img key={j} src={p} className={j === detailImg ? "on" : ""} onClick={() => setDetailImg(j)} alt="" />
                ))}
              </div>
            )}
            <div className="gs-detail-body">
              <div className="gs-detail-head">
                <h3>{lang === "ar" ? detail.name_ar : (detail.name_en || detail.name_ar)}</h3>
                <div className="gs-price" style={{ textAlign: "end" }}>
                  <b>{detail.avg_rate?.toLocaleString?.() ?? detail.base_price}</b> <span>{t("night")}</span>
                  {detail.total && <small>{t("totalFor")}: {detail.total.toLocaleString()} ر.س</small>}
                </div>
              </div>
              {detail.description && <p className="gs-detail-desc">{detail.description}</p>}
              <div className="gs-info-grid">
                <div className="gs-info-cell">{t("capacity")}<b>{detail.max_adults} {t("adults")} · {detail.max_children} {t("children")}</b></div>
                <div className="gs-info-cell">{t("checkinTime")}<b dir="ltr">{hotelObj?.check_in_time}</b></div>
                <div className="gs-info-cell">{t("checkoutTime")}<b dir="ltr">{hotelObj?.check_out_time}</b></div>
                <div className="gs-info-cell">{t("phoneL")}<b dir="ltr">{hotelObj?.phone}</b></div>
              </div>
              {detail.amenities?.length > 0 && (
                <>
                  <b style={{ fontSize: 13.5, color: "#6d6753" }}>{t("amenitiesL")}</b>
                  <div className="gs-chips" style={{ marginTop: 8 }}>
                    {detail.amenities.map((a: any, j: number) => (
                      <span className="gs-chip" key={j}>{lang === "ar" ? a.name_ar : (a.name_en || a.name_ar)}</span>
                    ))}
                  </div>
                </>
              )}
              <div className="gs-detail-foot">
                <ShareRow text={`${t("brand")} — ${lang === "ar" ? detail.name_ar : detail.name_en}`} url={window.location.href} t={t} />
                {detail.available > 0 && mode === "single" && (
                  <button className="gs-book-btn" onClick={() => { setSelected(detail); setDetail(null); setStep(3); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("book")}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

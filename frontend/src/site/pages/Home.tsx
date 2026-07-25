import React from "react";
import { useSite, SVC_ICONS } from "../shared";

export default function Home() {
  const { t, lang, site, hotels, navigate } = useSite();
  const [banner, setBanner] = React.useState(0);
  const hotelName = (h: any) => (lang === "ar" ? h?.name_ar : h?.name_en) || "";

  React.useEffect(() => {
    if (!site?.banners?.length) return;
    const iv = setInterval(() => setBanner((b) => (b + 1) % site.banners.length), 6000);
    return () => clearInterval(iv);
  }, [site]);

  return (
    <>
      {/* الهيرو بالبانر المتحرك */}
      <section className="gs-hero gs-hero-tall">
        <div className="gs-hero-slides" aria-hidden>
          {(site?.banners || []).map((b: string, i: number) => (
            <div key={i} className={`gs-slide ${i === banner ? "on" : ""}`} style={{ backgroundImage: `url(${b})` }} />
          ))}
          <div className="gs-hero-overlay" />
        </div>
        <div className="gs-container" style={{ position: "relative", zIndex: 2 }}>
          <span className="gs-loc-badge">{t("locBadge")}</span>
          <h1>{t("heroA")} <em>{t("heroB")}</em></h1>
          <p>{t("heroP")}</p>
          <div className="gs-hero-cta">
            <button className="gs-btn-gold" onClick={() => navigate("/book")}>{t("bookNowCta")}</button>
            <button className="gs-btn-outline" onClick={() => navigate("/site/hotels")}>{t("exploreCta")}</button>
          </div>
        </div>
        {(site?.banners?.length || 0) > 1 && (
          <div className="gs-hero-dots">
            {site.banners.map((_: string, i: number) => (
              <button key={i} className={i === banner ? "on" : ""} onClick={() => setBanner(i)} aria-label={`slide ${i + 1}`} />
            ))}
          </div>
        )}
      </section>

      {/* اختيار الفندق */}
      <section className="gs-section gs-container">
        <h2 className="gs-section-title">{t("hotelsTitle")}<span className="gs-title-tick" /></h2>
        <p className="gs-section-sub">{t("hotelsSub")}</p>
        <div className="gs-hotels">
          {hotels.map((h) => (
            <div key={h.id} className="gs-hotel-card" onClick={() => navigate(`/site/hotel/${h.code.toLowerCase()}`)}>
              <img src={site?.hotel_cards?.[h.code]} alt={hotelName(h)} loading="lazy" />
              <div className="ov">
                <span className="stars">{"★".repeat(h.star_rating)}</span>
                <h3>{hotelName(h)}</h3>
                <p>{h.code === "SF" ? t("sfTag") : t("sfgTag")}</p>
                <button className="cta">{t("viewHotel")} ›</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* عن الفندق — تشويقي */}
      <section className="gs-about-band">
        <div className="gs-container gs-about">
          <div className="gs-about-imgs">
            {(site?.about_photos || []).map((p: string, i: number) => (
              <img key={i} src={p} alt="" loading="lazy" />
            ))}
          </div>
          <div className="gs-about-txt">
            <span className="gs-kicker">{t("aboutKicker")}</span>
            <h2>{t("aboutTitle")}</h2>
            <p>{t("aboutP1")}</p>
            <p style={{ marginTop: 12 }}>{t("aboutP2")}</p>
            <div className="gs-stats">
              <div className="gs-stat"><b>{site?.stats?.rooms ?? 135}</b><span>{t("stRooms")}</span></div>
              <div className="gs-stat"><b>{site?.stats?.distance_m ?? 500}</b><span>{t("stDistance")}</span></div>
              <div className="gs-stat"><b>{site?.stats?.dining ?? "24/7"}</b><span>{t("stDining")}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* الخدمات — مقتطف */}
      <section className="gs-section gs-container">
        <h2 className="gs-section-title">{t("svcTitle")}<span className="gs-title-tick" /></h2>
        <p className="gs-section-sub">{t("svcSub")}</p>
        <div className="gs-svc-grid">
          {(hotels?.[0]?.services || []).slice(0, 6).map((s: any) => (
            <div className="gs-svc-card" key={s.id}>
              <div className="ic">{SVC_ICONS[s.icon] || "✨"}</div>
              <div>
                <b>{lang === "ar" ? s.name_ar : (s.name_en || s.name_ar)}</b>
                <small className={!s.price ? "gs-free" : ""}>{s.price ? `${s.price.toLocaleString()} ر.س` : t("free")}</small>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button className="gs-btn-outline dark" onClick={() => navigate("/site/services")}>{t("navServices")} ›</button>
        </div>
      </section>

      {/* المعرض — مقتطف */}
      <section className="gs-section gs-container">
        <h2 className="gs-section-title">{t("galTitle")}<span className="gs-title-tick" /></h2>
        <p className="gs-section-sub">{t("galSub")}</p>
        <div className="gs-gallery-grid">
          {(site?.gallery || []).slice(0, 8).map((g: string, i: number) => (
            <img key={i} src={g} alt={`gallery ${i + 1}`} loading="lazy" onClick={() => navigate("/site/gallery")} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button className="gs-btn-outline dark" onClick={() => navigate("/site/gallery")}>{t("navGallery")} ›</button>
        </div>
      </section>

      {/* المزايا */}
      <section className="gs-perks-band">
        <div className="gs-container">
          <h2 className="gs-section-title" style={{ color: "#fff" }}>{t("perksTitle")}</h2>
          <div className="gs-perks">
            {[["🏆", t("perk1"), t("perk1d")], ["⚡", t("perk2"), t("perk2d")],
              ["💳", t("perk3"), t("perk3d")], ["🔄", t("perk4"), t("perk4d")]].map(([ico, ttl, desc], i) => (
              <div className="gs-perk-lg" key={i}>
                <div className="ico">{ico}</div>
                <b>{ttl}</b>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* دعوة نهائية للحجز */}
      <section className="gs-cta-band">
        <div className="gs-container">
          <h2>{t("bookNowCta")}</h2>
          <p>{t("heroP")}</p>
          <button className="gs-btn-gold lg" onClick={() => navigate("/book")}>{t("bookCta")} ›</button>
        </div>
      </section>
    </>
  );
}

import React from "react";
import { useSite, Gallery, ROOM_FALLBACK, SVC_ICONS } from "../shared";

export default function HotelDetail({ code }: { code: string }) {
  const { t, lang, site, hotels, navigate } = useSite();
  const hotel = hotels.find((h) => h.code.toLowerCase() === code.toLowerCase());
  const [lightbox, setLightbox] = React.useState<{ photos: string[]; i: number } | null>(null);

  React.useEffect(() => { window.scrollTo({ top: 0 }); }, [code]);
  if (!hotel) return <div className="gs-section gs-container" style={{ minHeight: 300 }} />;

  const hotelName = (h: any) => (lang === "ar" ? h?.name_ar : h?.name_en) || "";
  const cover = site?.hotel_cards?.[hotel.code] || site?.banners?.[0];

  return (
    <>
      <section className="gs-pagehead tall" style={{ backgroundImage: `linear-gradient(rgba(23,38,24,.55),rgba(23,38,24,.8)), url(${cover})` }}>
        <div className="gs-container">
          <span className="gs-loc-badge">{"★".repeat(hotel.star_rating)}</span>
          <h1>{hotelName(hotel)}</h1>
          <p>{hotel.code === "SF" ? t("sfTag") : t("sfgTag")}</p>
          <p style={{ opacity: .85 }}>📍 {hotel.address}</p>
          <button className="gs-btn-gold" style={{ marginTop: 16 }} onClick={() => navigate(`/book?hotel=${hotel.id}`)}>
            {t("bookHotel")} ›
          </button>
        </div>
      </section>

      {/* الغرف */}
      <section className="gs-section gs-container">
        <h2 className="gs-section-title">{t("ourRooms")}<span className="gs-title-tick" /></h2>
        <p className="gs-section-sub">{t("roomsTitleH")}</p>
        <div className="gs-rooms">
          {(hotel.room_types || []).map((rt: any) => (
            <div className="gs-room" key={rt.id}>
              <div className="gs-room-img" style={{ background: ROOM_FALLBACK, padding: 0 }}>
                {rt.photos?.length
                  ? <Gallery photos={rt.photos} alt={rt.name_ar} onOpen={() => setLightbox({ photos: rt.photos, i: 0 })} />
                  : null}
              </div>
              <div className="gs-room-body">
                <h3 className="gs-room-name">{lang === "ar" ? rt.name_ar : (rt.name_en || rt.name_ar)}</h3>
                <div className="gs-room-cap">👤 {rt.max_adults} {t("adults")} · {rt.max_children} {t("children")}</div>
                {rt.description && <p className="gs-room-desc">{rt.description}</p>}
                <div className="gs-chips">
                  {(rt.amenities || []).slice(0, 4).map((a: any, j: number) => (
                    <span className="gs-chip" key={j}>{lang === "ar" ? a.name_ar : (a.name_en || a.name_ar)}</span>
                  ))}
                </div>
                <div className="gs-room-foot">
                  <div className="gs-price">
                    <small>{t("startingFrom")}</small>
                    <b>{rt.base_price.toLocaleString()}</b> <span>{t("night")}</span>
                  </div>
                  <button className="gs-book-btn" onClick={() => navigate(`/book?hotel=${hotel.id}`)}>{t("book")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* خدمات الفندق */}
      <section className="gs-about-band">
        <div className="gs-container">
          <h2 className="gs-section-title">{t("svcTitle")}<span className="gs-title-tick" /></h2>
          <div className="gs-svc-grid" style={{ marginTop: 24 }}>
            {(hotel.services || []).map((s: any) => (
              <div className="gs-svc-card" key={s.id}>
                <div className="ic">{SVC_ICONS[s.icon] || "✨"}</div>
                <div>
                  <b>{lang === "ar" ? s.name_ar : (s.name_en || s.name_ar)}</b>
                  <small className={!s.price ? "gs-free" : ""}>{s.price ? `${s.price.toLocaleString()} ر.س` : t("free")}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div className="gs-lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <img src={lightbox.photos[lightbox.i]} alt="" />
          <button className="nav close" onClick={() => setLightbox(null)}>✕</button>
          <button className="nav" style={{ insetInlineStart: 18 }}
            onClick={() => setLightbox({ ...lightbox, i: (lightbox.i - 1 + lightbox.photos.length) % lightbox.photos.length })}>‹</button>
          <button className="nav" style={{ insetInlineEnd: 18 }}
            onClick={() => setLightbox({ ...lightbox, i: (lightbox.i + 1) % lightbox.photos.length })}>›</button>
        </div>
      )}
    </>
  );
}

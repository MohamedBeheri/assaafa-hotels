import { useSite, PageHead } from "../shared";

export default function Hotels() {
  const { t, lang, site, hotels, navigate } = useSite();
  const hotelName = (h: any) => (lang === "ar" ? h?.name_ar : h?.name_en) || "";
  const minPrice = (h: any) => Math.min(...(h.room_types || []).map((r: any) => r.base_price));

  return (
    <>
      <PageHead title={t("hotelsTitle")} sub={t("hotelsSub")} bg={site?.banners?.[3] || site?.banners?.[0]} />
      <section className="gs-section gs-container">
        <div className="gs-hotels-list">
          {hotels.map((h, i) => (
            <div className={`gs-hotel-row ${i % 2 ? "rev" : ""}`} key={h.id}>
              <div className="gs-hotel-row-img">
                <img src={site?.hotel_cards?.[h.code]} alt={hotelName(h)} loading="lazy" />
                <span className="stars">{"★".repeat(h.star_rating)}</span>
              </div>
              <div className="gs-hotel-row-body">
                <h2>{hotelName(h)}</h2>
                <p className="tag">{h.code === "SF" ? t("sfTag") : t("sfgTag")}</p>
                <p className="addr">📍 {h.address}</p>
                <div className="gs-hotel-rooms-mini">
                  {(h.room_types || []).map((rt: any) => (
                    <span key={rt.id} className="gs-chip">{lang === "ar" ? rt.name_ar : (rt.name_en || rt.name_ar)}</span>
                  ))}
                </div>
                <div className="gs-hotel-row-foot">
                  <div className="gs-price">
                    <small>{t("fromPrice")}</small>
                    <b>{minPrice(h).toLocaleString()}</b> <span>{t("night")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="gs-btn-outline dark" onClick={() => navigate(`/site/hotel/${h.code.toLowerCase()}`)}>{t("viewHotel")}</button>
                    <button className="gs-btn-gold" onClick={() => navigate(`/book?hotel=${h.id}`)}>{t("bookHotel")}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

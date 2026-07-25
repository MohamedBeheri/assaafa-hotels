import React from "react";
import { useSite, Palm, SVC_ICONS } from "./shared";

export default function SiteFooter() {
  const { t, lang, site, hotels, navigate } = useSite();
  const contact = site?.contact;
  const services = hotels?.[0]?.services || [];

  return (
    <footer className="gs-site-footer">
      <div className="gs-container gs-footer-grid">
        <div>
          <div className="gs-brand" style={{ color: "#fff", marginBottom: 14 }}>
            <Palm size={30} color="#8CC152" />
            <div>{t("brand")}<small style={{ color: "#B5D98E" }}>{t("tagline")}</small></div>
          </div>
          <p className="gs-footer-about">{t("footAbout")}</p>
        </div>

        <div>
          <h4>{t("footLinks")}</h4>
          <button onClick={() => navigate("/site/hotels")}>{t("navHotels")}</button>
          <button onClick={() => navigate("/site/gallery")}>{t("navGallery")}</button>
          <button onClick={() => navigate("/book")}>{t("navBook")}</button>
        </div>

        <div>
          <h4>{t("footServices")}</h4>
          {services.slice(0, 5).map((s: any) => (
            <button key={s.id} onClick={() => navigate("/site/services")}>
              {SVC_ICONS[s.icon] || "✨"} {lang === "ar" ? s.name_ar : (s.name_en || s.name_ar)}
            </button>
          ))}
        </div>

        <div>
          <h4>{t("footContact")}</h4>
          {(contact?.phones || []).map((p: string) => (
            <a key={p} href={`tel:${p}`} dir="ltr" className="gs-footer-contact">☎ {p}</a>
          ))}
          <a href={`mailto:${contact?.email}`} dir="ltr" className="gs-footer-contact">✉ {contact?.email}</a>
          <div className="gs-footer-contact">📍 {lang === "ar" ? contact?.location_ar : contact?.location_en}</div>
        </div>
      </div>
      <div className="gs-footer-bottom">
        <div className="gs-container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span>{t("footRights")}</span>
          <span style={{ opacity: .7 }}>{t("footRefund")} · {t("footTerms")} · {t("footCareers")}</span>
        </div>
      </div>
    </footer>
  );
}

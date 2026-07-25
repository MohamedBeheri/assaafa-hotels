import React from "react";
import { useSite, PageHead } from "../shared";

export default function Contact() {
  const { t, lang, site } = useSite();
  const c = site?.contact;
  const [sent, setSent] = React.useState(false);

  const cards = [
    { icon: "📞", label: t("cPhone"), lines: (c?.phones || []), href: (p: string) => `tel:${p}` },
    { icon: "🗓️", label: t("cReserve"), lines: ["reservation@assaafahotels.com"], href: (p: string) => `mailto:${p}` },
    { icon: "✉️", label: t("cGeneral"), lines: ["info@assaafahotels.com"], href: (p: string) => `mailto:${p}` },
    { icon: "💼", label: t("cHr"), lines: ["hr@assaafahotels.com"], href: (p: string) => `mailto:${p}` },
  ];

  return (
    <>
      <PageHead title={t("contactTitle")} sub={t("contactSub")} bg={site?.banners?.[1] || site?.banners?.[0]} />
      <section className="gs-section gs-container">
        <div className="gs-contact-cards">
          {cards.map((card, i) => (
            <div className="gs-contact-card" key={i}>
              <div className="ic">{card.icon}</div>
              <b>{card.label}</b>
              {card.lines.map((l: string) => (
                <a key={l} href={card.href(l)} dir="ltr">{l}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="gs-contact-grid">
          <div className="gs-panel">
            <h3 style={{ marginTop: 0, color: "#1F3320" }}>{t("cFindUs")}</h3>
            <p style={{ color: "#6d6753", lineHeight: 1.9 }}>{t("cFindP")}</p>
            <div className="gs-address">
              <span>📍</span>
              <div>{t("cAddressVal")}</div>
            </div>
            <div className="gs-map">
              <iframe title="map" loading="lazy" style={{ border: 0, width: "100%", height: 240, borderRadius: 12 }}
                src="https://www.google.com/maps?q=Assaafa+Hotel+Madinah&output=embed" />
            </div>
          </div>

          <div className="gs-panel">
            <h3 style={{ marginTop: 0, color: "#1F3320" }}>{t("contactTitle")}</h3>
            {sent ? (
              <div className="gs-contact-sent">✓ {lang === "ar" ? "تم إرسال رسالتك، سنعاود التواصل قريباً." : "Message sent, we'll get back to you soon."}</div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div className="gs-field" style={{ marginBottom: 12 }}>
                  <label>{t("cFormName")}</label><input required />
                </div>
                <div className="gs-field" style={{ marginBottom: 12 }}>
                  <label>{t("cFormEmail")}</label><input type="email" dir="ltr" required />
                </div>
                <div className="gs-field" style={{ marginBottom: 12 }}>
                  <label>{t("cFormMsg")}</label>
                  <textarea rows={4} required style={{ width: "100%", border: "1.5px solid #E5DFD0", borderRadius: 11, padding: 12, fontFamily: "inherit", resize: "vertical" }} />
                </div>
                <button className="gs-btn-gold" style={{ width: "100%" }} type="submit">{t("cFormSend")}</button>
                <p style={{ fontSize: 12, color: "#a49d89", marginTop: 10, textAlign: "center" }}>{t("cFormNote")}</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

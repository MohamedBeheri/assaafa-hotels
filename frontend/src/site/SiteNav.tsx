import React from "react";
import { useSite, Palm } from "./shared";

export default function SiteNav() {
  const { t, lang, setLang, path, navigate, openLookup } = useSite();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { key: "/site", label: t("navHome") },
    { key: "/site/hotels", label: t("navHotels") },
    { key: "/site/services", label: t("navServices") },
    { key: "/site/gallery", label: t("navGallery") },
    { key: "/site/contact", label: t("navContact") },
  ];
  const isActive = (k: string) => (k === "/site" ? path === "/site" || path === "/site/" : path.startsWith(k));
  const go = (k: string) => { navigate(k); setOpen(false); };

  return (
    <header className={`gs-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="gs-container gs-nav-inner">
        <div className="gs-brand" onClick={() => go("/site")} style={{ cursor: "pointer" }}>
          <Palm size={28} color="#8CC152" />
          <div>{t("brand")}<small>{t("tagline")}</small></div>
        </div>

        <nav className="gs-nav-links">
          {links.map((l) => (
            <button key={l.key} className={isActive(l.key) ? "on" : ""} onClick={() => go(l.key)}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="gs-nav-actions">
          <button className="gs-nav-ghost" onClick={openLookup}>{t("lookup")}</button>
          <button className="gs-nav-ghost" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t("lang")}</button>
          <button className="gs-nav-cta" onClick={() => go("/book")}>{t("navBook")}</button>
          <button className="gs-nav-burger" onClick={() => setOpen(!open)} aria-label="menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && (
        <div className="gs-nav-mobile">
          {links.map((l) => (
            <button key={l.key} className={isActive(l.key) ? "on" : ""} onClick={() => go(l.key)}>{l.label}</button>
          ))}
          <button className="gs-nav-cta full" onClick={() => go("/book")}>{t("navBook")}</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="gs-nav-ghost" style={{ flex: 1 }} onClick={() => { openLookup(); setOpen(false); }}>{t("lookup")}</button>
            <button className="gs-nav-ghost" style={{ flex: 1 }} onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t("lang")}</button>
          </div>
        </div>
      )}
    </header>
  );
}

import React from "react";
import "./site.css";
import { API, T, SiteContext } from "./shared";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import BookingFlow from "./BookingFlow";

export default function PublicSite() {
  const [lang, setLangState] = React.useState<"ar" | "en">(
    (localStorage.getItem("site-lang") as "ar" | "en") || "ar");
  const [site, setSite] = React.useState<any>(null);
  const [hotels, setHotels] = React.useState<any[]>([]);
  const [path, setPath] = React.useState(window.location.pathname);
  const [lookupOpen, setLookupOpen] = React.useState(false);
  const [lk, setLk] = React.useState({ code: "", phone: "" });
  const [lkResult, setLkResult] = React.useState<any | null>(null);
  const [lkErr, setLkErr] = React.useState("");

  const t = (k: string) => T[lang][k] || k;
  const setLang = (l: "ar" | "en") => { setLangState(l); localStorage.setItem("site-lang", l); };

  React.useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  React.useEffect(() => {
    fetch(`${API}/hotels/`).then((r) => r.json()).then(setHotels);
    fetch(`${API}/site/`).then((r) => r.json()).then(setSite);
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === path) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0 });
  };

  const doLookup = async () => {
    setLkErr(""); setLkResult(null);
    const r = await fetch(`${API}/lookup/?code=${encodeURIComponent(lk.code)}&phone=${encodeURIComponent(lk.phone)}`);
    const d = await r.json();
    if (!r.ok) { setLkErr(d.detail || "خطأ"); return; }
    setLkResult(d);
  };

  const ctx = { lang, setLang, t, site, hotels, path, navigate,
    openLookup: () => { setLookupOpen(true); setLkResult(null); setLkErr(""); } };

  const renderPage = () => {
    if (path.startsWith("/book")) return <BookingFlow />;
    if (path.startsWith("/site/hotel/")) return <HotelDetail code={path.split("/site/hotel/")[1]} />;
    if (path.startsWith("/site/hotels")) return <Hotels />;
    if (path.startsWith("/site/services")) return <Services />;
    if (path.startsWith("/site/gallery")) return <Gallery />;
    if (path.startsWith("/site/contact")) return <Contact />;
    return <Home />;
  };

  return (
    <SiteContext.Provider value={ctx}>
      <div className="gs">
        <SiteNav />
        <main key={path}>{renderPage()}</main>
        <SiteFooter />

        {lookupOpen && (
          <div className="gs-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLookupOpen(false); }}>
            <div className="gs-modal">
              <h3>{t("lkTitle")}</h3>
              <div className="gs-field" style={{ marginBottom: 10 }}>
                <label>{t("lkCode")}</label>
                <input dir="ltr" value={lk.code} onChange={(e) => setLk({ ...lk, code: e.target.value })} />
              </div>
              <div className="gs-field" style={{ marginBottom: 14 }}>
                <label>{t("lkPhone")}</label>
                <input dir="ltr" type="tel" value={lk.phone} onChange={(e) => setLk({ ...lk, phone: e.target.value })} />
              </div>
              {lkErr && <div className="gs-err" style={{ marginBottom: 8 }}>{lkErr}</div>}
              {lkResult && (
                <div className="gs-summary" style={{ display: "block" }}>
                  <div><b>{lkResult.hotel}</b> — {lkResult.guest}</div>
                  <div>{t("lkStatus")}: <b>{lkResult.status_display}</b></div>
                  <div dir="ltr">{lkResult.check_in} → {lkResult.check_out}</div>
                  {lkResult.services?.length > 0 &&
                    <div>{t("dServices")}: {lkResult.services.map((s: any) => `${s.name} ×${s.qty}`).join(" · ")}</div>}
                  <div>{t("total")}: <b>{lkResult.total.toLocaleString()} ر.س</b></div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="gs-search-btn" style={{ flex: 1 }} onClick={doLookup}>{t("lkBtn")}</button>
                <button className="gs-nav-ghost" style={{ borderColor: "#CFC8B4", color: "#6d6753" }} onClick={() => setLookupOpen(false)}>{t("close")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteContext.Provider>
  );
}

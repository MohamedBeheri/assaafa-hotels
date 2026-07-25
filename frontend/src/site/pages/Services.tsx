import { useSite, SVC_ICONS, SVC_DESC, PageHead } from "../shared";

export default function Services() {
  const { t, lang, hotels, site } = useSite();
  const services = hotels?.[0]?.services || [];
  return (
    <>
      <PageHead title={t("svcPageTitle")} sub={t("svcPageSub")} bg={site?.banners?.[2] || site?.banners?.[0]} />
      <section className="gs-section gs-container">
        <div className="gs-svc-big-grid">
          {services.map((s: any) => (
            <div className="gs-svc-big" key={s.id}>
              <div className="ic">{SVC_ICONS[s.icon] || "✨"}</div>
              <h3>{lang === "ar" ? s.name_ar : (s.name_en || s.name_ar)}</h3>
              <p>{SVC_DESC[s.icon]?.[lang] || ""}</p>
              <span className={`gs-svc-price ${!s.price ? "gs-free" : ""}`}>
                {s.price ? `${s.price.toLocaleString()} ر.س` : t("free")}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

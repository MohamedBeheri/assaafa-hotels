import React from "react";
import { useSite, PageHead } from "../shared";

export default function Gallery() {
  const { t, site } = useSite();
  const photos: string[] = site?.gallery || [];
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i! + 1) % photos.length);
      if (e.key === "ArrowLeft") setLightbox((i) => (i! - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  return (
    <>
      <PageHead title={t("galTitle")} sub={t("galPageSub")} bg={photos[0]} />
      <section className="gs-section gs-container">
        <div className="gs-gallery-grid full">
          {photos.map((g, i) => (
            <img key={i} src={g} alt={`gallery ${i + 1}`} loading="lazy" onClick={() => setLightbox(i)} />
          ))}
        </div>
      </section>

      {lightbox !== null && (
        <div className="gs-lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <img src={photos[lightbox]} alt="" />
          <button className="nav close" onClick={() => setLightbox(null)}>✕</button>
          <button className="nav" style={{ insetInlineStart: 18 }}
            onClick={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}>‹</button>
          <button className="nav" style={{ insetInlineEnd: 18 }}
            onClick={() => setLightbox((lightbox + 1) % photos.length)}>›</button>
          <span className="gs-lb-count">{lightbox + 1} / {photos.length}</span>
        </div>
      )}
    </>
  );
}

import React from "react";
import { BRAND } from "../theme";

/* ═══ أيقونات SVG بنمط OPERA (باب / شخص / طفل) ═══ */
const PURPLE = "#8E5AA8", TEAL = "#1F8A99";

export function DoorArrival({ size = 46, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="14" y="8" width="20" height="34" rx="1.5" fill={color} />
      <rect x="17" y="12" width="14" height="26" rx="1" fill="#fff" opacity=".2" />
      <circle cx="28" cy="26" r="1.6" fill="#fff" />
      <path d="M4 26h10m0 0-4-4m4 4-4 4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function DoorDeparture({ size = 46, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="14" y="8" width="20" height="34" rx="1.5" fill={color} />
      <rect x="17" y="12" width="14" height="26" rx="1" fill="#fff" opacity=".2" />
      <circle cx="28" cy="26" r="1.6" fill="#fff" />
      <path d="M34 26h10m0 0-4-4m4 4-4 4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function BedRoom({ size = 46, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 34V20a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="6" y="26" width="36" height="8" rx="2" fill={color} />
      <path d="M6 34v4M42 34v4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="11" y="20" width="12" height="6" rx="2" fill={color} opacity=".4" />
      <rect x="25" y="20" width="12" height="6" rx="2" fill={color} opacity=".4" />
    </svg>
  );
}
export function PersonAdult({ size = 22, color = "#6d6753" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="3.4" fill={color} />
      <path d="M5 22v-4a7 7 0 0 1 14 0v4" fill={color} />
    </svg>
  );
}
export function PersonChild({ size = 20, color = "#a49d89" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="2.8" fill={color} />
      <path d="M12 10v7M8 22l4-5 4 5M7 13l5-2 5 2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GuestCounts({ adults, children }: { adults: number; children: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 8 }}>
      <div style={{ textAlign: "center" }}>
        <PersonAdult />
        <div style={{ fontSize: 17, fontWeight: 800, color: "#3D3A32", fontVariantNumeric: "tabular-nums" }}>{adults}</div>
        <div style={{ fontSize: 10.5, color: "#a49d89" }}>بالغ</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <PersonChild />
        <div style={{ fontSize: 17, fontWeight: 800, color: "#3D3A32", fontVariantNumeric: "tabular-nums" }}>{children}</div>
        <div style={{ fontSize: 10.5, color: "#a49d89" }}>طفل</div>
      </div>
    </div>
  );
}

const tileWrap: React.CSSProperties = {
  background: "#fff", borderRadius: 16, padding: 18, height: "100%",
  boxShadow: "0 3px 14px rgba(31,51,32,.06)", border: "1px solid #f0ede4",
};
const tileTitle: React.CSSProperties = {
  textAlign: "center", fontWeight: 800, color: "#3D3A32", fontSize: 15, marginBottom: 14,
};

/* بطاقة الوصول — بشريط + مؤشر شخص */
export function ArrivalsTile({ arrived, expected, onClick }: { arrived: number; expected: number; onClick?: () => void }) {
  const max = Math.max(expected + arrived, 1);
  const pct = Math.min((arrived / max) * 100, 100);
  return (
    <div style={{ ...tileWrap, cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
      <div style={tileTitle}>الوصول</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#bbb", fontVariantNumeric: "tabular-nums" }}>0</span>
        <div style={{ flex: 1, height: 4, background: "#EAE4F0", borderRadius: 3, position: "relative" }}>
          <div style={{ position: "absolute", insetInlineStart: 0, top: 0, height: 4, width: `${pct}%`, background: PURPLE, borderRadius: 3 }} />
          <div style={{ position: "absolute", insetInlineStart: `${pct}%`, top: -9, transform: "translateX(-50%)" }}>
            <PersonAdult size={18} color={PURPLE} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#bbb", fontVariantNumeric: "tabular-nums" }}>{max}</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, color: PURPLE, fontVariantNumeric: "tabular-nums" }}>{arrived}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 12 }}>
        <DoorArrival size={40} />
        <div style={{ background: "#F4F0F8", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, color: "#8d8775" }}>متوقّع</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: PURPLE, fontVariantNumeric: "tabular-nums" }}>{expected}</div>
        </div>
      </div>
    </div>
  );
}

/* بطاقة النزلاء المقيمين */
export function InHouseTile({ rooms, adults, children, onClick }: { rooms: number; adults: number; children: number; onClick?: () => void }) {
  return (
    <div style={{ ...tileWrap, cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
      <div style={tileTitle}>النزلاء المقيمون</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <BedRoom size={44} color={PURPLE} />
        <div style={{ background: "#F4F0F8", borderRadius: 10, padding: "6px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, color: "#8d8775" }}>غرفة</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: PURPLE, fontVariantNumeric: "tabular-nums" }}>{rooms}</div>
        </div>
      </div>
      <GuestCounts adults={adults} children={children} />
    </div>
  );
}

/* بطاقة المغادرات — متوقّعة + تم الخروج */
export function DeparturesTile({ expected, checkedOut, adults, children, onClick }:
  { expected: number; checkedOut: number; adults: number; children: number; onClick?: () => void }) {
  return (
    <div style={{ ...tileWrap, cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
      <div style={tileTitle}>المغادرات</div>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { label: "متوقّعة", val: expected, color: PURPLE },
          { label: "تم الخروج", val: checkedOut, color: TEAL },
        ].map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "6px 4px",
            borderInlineEnd: i === 0 ? "1px solid #f0ede4" : "none" }}>
            <div style={{ fontSize: 11, color: "#8d8775", marginBottom: 4 }}>{d.label}</div>
            <DoorDeparture size={34} color={d.color} />
            <div style={{ fontSize: 20, fontWeight: 900, color: d.color, fontVariantNumeric: "tabular-nums" }}>{d.val}</div>
            <div style={{ fontSize: 10, color: "#a49d89" }}>غرفة</div>
          </div>
        ))}
      </div>
      <GuestCounts adults={adults} children={children} />
    </div>
  );
}

/* دائرة أقصى غرف متاحة */
export function MaxAvailTile({ value, onClick }: { value: number; onClick?: () => void }) {
  return (
    <div style={{ ...tileWrap, textAlign: "center", cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
      <div style={tileTitle}>أقصى غرف متاحة</div>
      <div style={{ width: 92, height: 92, borderRadius: "50%", margin: "0 auto",
        background: `linear-gradient(135deg, ${TEAL}, #3B9CB3)`, display: "grid", placeItems: "center",
        boxShadow: "0 6px 18px rgba(31,138,153,.3)" }}>
        <BedRoom size={30} color="#fff" />
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: TEAL, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

// silence unused BRAND import if theme changes
export const _brand = BRAND;

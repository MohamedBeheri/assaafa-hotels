import React from "react";
import { Modal, Input, Spin, Empty } from "antd";
import {
  SearchOutlined, UserOutlined, CalendarOutlined, HomeOutlined,
  FileTextOutlined, ThunderboltOutlined, DashboardOutlined, TableOutlined,
  ClearOutlined, DollarOutlined, BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const typeIcon: Record<string, React.ReactNode> = {
  guest: <UserOutlined />, reservation: <CalendarOutlined />,
  room: <HomeOutlined />, invoice: <FileTextOutlined />,
};

// اختصارات التنقّل السريع (تظهر قبل الكتابة)
const QUICK = [
  { label: "لوحة التحكم", route: "/", icon: <DashboardOutlined /> },
  { label: "الفرونت أوفيس", route: "/front-office", icon: <ThunderboltOutlined /> },
  { label: "الحجوزات", route: "/reservations", icon: <CalendarOutlined /> },
  { label: "التقويم", route: "/calendar", icon: <TableOutlined /> },
  { label: "التدبير الفندقي", route: "/housekeeping", icon: <ClearOutlined /> },
  { label: "الفواتير", route: "/invoices", icon: <FileTextOutlined /> },
  { label: "المالية", route: "/finance", icon: <DollarOutlined /> },
  { label: "التقارير", route: "/reports", icon: <BarChartOutlined /> },
  { label: "التدقيق الليلي", route: "/night-audit", icon: <ThunderboltOutlined /> },
];

export default function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { hotel } = useApp();
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const params: any = { q };
  if (hotel) params.hotel = hotel;
  const { data, isFetching } = apiHooks.useGlobalSearchQuery(params, { skip: q.trim().length < 1 });

  const results = q.trim().length >= 1 ? (data?.results || []) : [];
  const quick = q.trim().length < 1
    ? QUICK.filter((x) => x.label.includes(q.trim()) || !q.trim()) : [];
  const items = q.trim().length >= 1 ? results : quick;

  React.useEffect(() => { if (open) { setQ(""); setActive(0); } }, [open]);
  React.useEffect(() => { setActive(0); }, [q]);

  const go = (item: any) => { nav(item.route); onClose(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false}
      width={620} styles={{ body: { padding: 0 } }} style={{ top: 90 }} destroyOnHidden>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0ede4", display: "flex", alignItems: "center", gap: 10 }}>
        <SearchOutlined style={{ fontSize: 18, color: BRAND.green }} />
        <Input
          autoFocus variant="borderless" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
          placeholder="ابحث عن نزيل، حجز، غرفة، فاتورة... أو انتقل لأي شاشة"
          style={{ fontSize: 16 }} />
        <kbd style={{ background: "#f4f1ea", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#8d8775" }}>ESC</kbd>
      </div>

      <div style={{ maxHeight: 380, overflowY: "auto", padding: 8 }}>
        {q.trim().length < 1 && (
          <div style={{ fontSize: 11, color: "#a49d89", fontWeight: 700, padding: "6px 12px" }}>انتقال سريع</div>
        )}
        {isFetching && q.trim().length >= 1 && (
          <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
        )}
        {!isFetching && q.trim().length >= 1 && items.length === 0 && (
          <Empty description="لا نتائج" style={{ padding: 24 }} />
        )}
        {items.map((item: any, i: number) => (
          <div key={i} onMouseEnter={() => setActive(i)} onClick={() => go(item)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", cursor: "pointer",
              borderRadius: 10, background: i === active ? "#EAF4DC" : "transparent", transition: ".1s",
            }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
              background: i === active ? BRAND.green : "#f4f1ea",
              color: i === active ? "#fff" : BRAND.greenDark, fontSize: 15,
            }}>
              {item.type ? (typeIcon[item.type] || <SearchOutlined />) : item.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#3D3A32", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.label}
              </div>
              {item.sublabel && <div style={{ fontSize: 12, color: "#8d8775" }}>{item.sublabel}</div>}
            </div>
            {item.type && (
              <span style={{ fontSize: 10.5, color: "#b3ac98", background: "#f7f5ee", borderRadius: 6, padding: "2px 8px" }}>
                {{ guest: "نزيل", reservation: "حجز", room: "غرفة", invoice: "فاتورة" }[item.type as string]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "9px 16px", borderTop: "1px solid #f0ede4", display: "flex", gap: 16, fontSize: 11, color: "#a49d89" }}>
        <span>↑↓ تنقّل</span><span>↵ فتح</span><span style={{ marginInlineStart: "auto" }}>⌘K للبحث السريع</span>
      </div>
    </Modal>
  );
}

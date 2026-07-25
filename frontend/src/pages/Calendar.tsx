import React from "react";
import { Card, Button, Space, Tag, Spin, Empty, Tooltip, Segmented } from "antd";
import { RightOutlined, LeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const statusColor: Record<string, string> = {
  confirmed: BRAND.gold,
  pending: "#d4b106",
  checked_in: BRAND.green,
  checked_out: "#bfbfbf",
};
const roomDot: Record<string, string> = {
  available: "#52c41a", occupied: "#f5222d", reserved: "#faad14",
  cleaning: "#1677ff", maintenance: "#fa8c16", blocked: "#8c8c8c",
};

const CELL_W = 44;
const ROW_H = 40;
const LABEL_W = 130;

export default function CalendarPage() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const [start, setStart] = React.useState(() => dayjs().startOf("day"));
  const [days, setDays] = React.useState(14);
  const params: any = { start: start.format("YYYY-MM-DD"), days };
  if (hotel) params.hotel = hotel;
  const { data, isFetching } = apiHooks.useCalendarGridQuery(params);

  if (!data) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;

  const dates: string[] = data.dates;
  const byRoom: Record<number, any[]> = {};
  for (const b of data.bookings) (byRoom[b.room_id] ||= []).push(b);

  const gridStart = dayjs(data.start);
  const gridW = days * CELL_W;

  return (
    <Card
      title={t("calendar")}
      loading={isFetching}
      extra={
        <Space>
          <Segmented value={days} onChange={(v) => setDays(v as number)}
            options={[{ label: "7", value: 7 }, { label: "14", value: 14 }, { label: "30", value: 30 }]} />
          <Button icon={<RightOutlined />} onClick={() => setStart(start.subtract(7, "day"))} />
          <Button onClick={() => setStart(dayjs().startOf("day"))}>{t("today")}</Button>
          <Button icon={<LeftOutlined />} onClick={() => setStart(start.add(7, "day"))} />
        </Space>
      }
    >
      {!data.rooms.length ? <Empty /> : (
        <div style={{ overflowX: "auto", direction: "ltr" }}>
          <div style={{ minWidth: LABEL_W + gridW }}>
            {/* رأس التواريخ */}
            <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>
              <div style={{ width: LABEL_W, flexShrink: 0, borderBottom: "2px solid #eee" }} />
              {dates.map((d) => {
                const dj = dayjs(d);
                const isToday = dj.isSame(dayjs(), "day");
                const isWeekend = [5, 6].includes(dj.day());
                return (
                  <div key={d} style={{
                    width: CELL_W, flexShrink: 0, textAlign: "center", padding: "4px 0",
                    borderBottom: "2px solid #eee",
                    background: isToday ? "#EAF4DC" : isWeekend ? "#FAF8F2" : undefined,
                    borderRadius: isToday ? "8px 8px 0 0" : 0,
                  }}>
                    <div style={{ fontSize: 11, color: "#999" }}>{dj.format("dd")}</div>
                    <div style={{ fontWeight: isToday ? 800 : 600, color: isToday ? BRAND.greenDark : "#3D3A32" }}>
                      {dj.format("D")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* صفوف الغرف */}
            {data.rooms.map((room: any) => {
              const bookings = byRoom[room.id] || [];
              return (
                <div key={room.id} style={{ display: "flex", position: "relative", height: ROW_H }}>
                  <div style={{
                    width: LABEL_W, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
                    borderBottom: "1px solid #f2f0e9", paddingInline: 8, direction: "rtl",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: roomDot[room.status], flexShrink: 0 }} />
                    <b style={{ fontVariantNumeric: "tabular-nums" }}>{room.number}</b>
                    <span style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.type}
                    </span>
                  </div>
                  {/* خلايا الخلفية */}
                  {dates.map((d) => {
                    const dj = dayjs(d);
                    const isToday = dj.isSame(dayjs(), "day");
                    const isWeekend = [5, 6].includes(dj.day());
                    return <div key={d} style={{
                      width: CELL_W, flexShrink: 0, borderBottom: "1px solid #f2f0e9",
                      borderInlineStart: "1px solid #f7f5ee",
                      background: isToday ? "#F4FAEA" : isWeekend ? "#FCFBF7" : undefined,
                    }} />;
                  })}
                  {/* أشرطة الحجوزات */}
                  {bookings.map((b: any) => {
                    const ci = dayjs(b.check_in), co = dayjs(b.check_out);
                    const offset = Math.max(ci.diff(gridStart, "day"), 0);
                    const endOffset = Math.min(co.diff(gridStart, "day"), days);
                    const span = endOffset - offset;
                    if (span <= 0) return null;
                    return (
                      <Tooltip key={b.reservation_id + "-" + b.room_id}
                        title={<div style={{ direction: "rtl" }}>{b.guest}<br />{b.code}<br />{b.check_in} ← {b.check_out}</div>}>
                        <div style={{
                          position: "absolute", insetInlineStart: LABEL_W + offset * CELL_W + 2,
                          top: 6, height: ROW_H - 14, width: span * CELL_W - 4,
                          background: statusColor[b.status] || BRAND.gold,
                          borderRadius: 7, color: "#fff", fontSize: 11, fontWeight: 600,
                          display: "flex", alignItems: "center", paddingInline: 8,
                          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                          cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                          direction: "rtl",
                        }}>
                          {b.guest}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Space style={{ marginTop: 14 }} wrap>
        <Tag color={BRAND.gold}>مؤكد</Tag>
        <Tag color={BRAND.green}>نازل حالياً</Tag>
        <Tag color="#bfbfbf">غادر</Tag>
      </Space>
    </Card>
  );
}

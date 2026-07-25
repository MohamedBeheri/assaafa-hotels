import { Row, Col, Card, Progress, Table, Tag, Spin, Button, Badge, App as AntApp } from "antd";
import {
  LoginOutlined, LogoutOutlined, TeamOutlined, GlobalOutlined, CheckCircleOutlined,
  UserOutlined, SmileOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const money = (v: number) => `${(v || 0).toLocaleString()} ر.س`;

function ProjBox({ title, color, rooms, persons, vip }: any) {
  return (
    <div style={{ background: color, borderRadius: 12, padding: "12px 14px", color: "#fff", flex: 1 }}>
      <div style={{ fontSize: 12.5, opacity: .9, marginBottom: 8, fontWeight: 700 }}>{title}</div>
      {[["الغرف", rooms], ["الأشخاص", persons], ["VIP", vip]].map(([l, v]: any) => (
        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
          <span style={{ opacity: .85 }}>{l}</span><b style={{ fontVariantNumeric: "tabular-nums" }}>{v}</b>
        </div>
      ))}
    </div>
  );
}

function FlowTile({ title, icon, color, big, bigLabel, adults, children, sub, subVal }: any) {
  return (
    <Card className="stat-card" styles={{ body: { padding: 18 } }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, color: "#3D3A32" }}>{title}</span>
        <span style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 10 }}>
        <b style={{ fontSize: 34, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{big}</b>
        <span style={{ color: "#8c8c8c", fontSize: 12, marginBottom: 4 }}>{bigLabel}</span>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6d6753" }}>
        <span><UserOutlined /> {adults} بالغ</span>
        <span><SmileOutlined /> {children} طفل</span>
      </div>
      {sub && <div style={{ marginTop: 8, fontSize: 12, color: "#a49d89" }}>{sub}: <b style={{ color }}>{subVal}</b></div>}
    </Card>
  );
}

const statusColors: Record<string, string> = {
  available: "green", occupied: "red", reserved: "gold",
  cleaning: "blue", maintenance: "orange", blocked: "default",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data: b } = apiHooks.useBoardQuery(params);
  const { data } = apiHooks.useDashboardQuery(params);
  const [updateRes] = apiHooks.useUpdateReservationsMutation();
  const confirmRes = async (id: number) => {
    try { await updateRes({ id, status: "confirmed" }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };

  if (!b || !data) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;
  const p = b.projections;

  return (
    <div>
      {data.online_pending_count > 0 && (
        <Card style={{ marginBottom: 16, borderColor: "#B8985A", borderWidth: 2 }}
          title={<Badge count={data.online_pending_count} color="#B8985A" offset={[-12, 2]}>
            <span style={{ paddingInlineEnd: 18 }}><GlobalOutlined style={{ color: "#B8985A", marginInlineEnd: 8 }} />{t("onlinePending")}</span>
          </Badge>}>
          <Table size="small" rowKey="id" pagination={false} dataSource={data.online_pending} childrenColumnName="_sr"
            columns={[
              { title: t("code"), dataIndex: "code", render: (v: string) => <Tag color="gold" icon={<GlobalOutlined />}>{v}</Tag> },
              { title: t("guest"), dataIndex: "guest" }, { title: t("phone"), dataIndex: "phone" },
              { title: t("checkIn"), dataIndex: "check_in" }, { title: t("checkOut"), dataIndex: "check_out" },
              { title: t("total"), dataIndex: "total", render: (v: number) => <b>{money(v)}</b> },
              { title: "", width: 110, render: (_: any, r: any) => (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => confirmRes(r.id)}>{t("confirmBooking")}</Button>
              ) },
            ]} />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title={t("availabilitySummary")} styles={{ body: { padding: 16 } }}>
            <Row gutter={10}>
              {b.availability.map((a: any) => (
                <Col span={8} key={a.date}>
                  <div style={{ textAlign: "center", background: "#EAF4DC", borderRadius: 12, padding: "12px 6px" }}>
                    <div style={{ fontSize: 11.5, color: "#6d6753", marginBottom: 8 }}>{a.date.slice(5)}</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: BRAND.greenDark, fontVariantNumeric: "tabular-nums" }}>{a.available}</div>
                    <div style={{ fontSize: 11, color: "#8d8775" }}>متاح / {a.total}</div>
                    <div style={{ fontSize: 11, color: "#B8985A", marginTop: 4 }}>مباع {a.sold}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              {b.room_type_availability.map((rt: any, i: number) => (
                <div key={i} style={{ border: "1px solid #f0ede4", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "#3D3A32", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rt.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginTop: 3 }}>
                    <span style={{ color: BRAND.green }}>متاح {rt.available}</span>
                    <span style={{ color: "#B8985A" }}>مباع {rt.sold}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title={<>{t("dailyProjections")} <span style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }} dir="ltr">{b.date}</span></>}
            styles={{ body: { padding: 16 } }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <ProjBox title={t("individuals")} color="#E8912B" {...p.individuals} />
              <ProjBox title={t("blocks")} color="#1F8A99" {...p.blocks} />
              <ProjBox title={t("occupiedTonight")} color="#8E5AA8" {...p.occupied_tonight} />
            </div>
            {[
              [t("blockNotPicked"), p.block_rooms_not_picked_up],
              [t("percentOccupied"), `${p.percent_occupied}%`],
              [t("minAvailable"), p.min_available],
              [t("roomRevenue"), money(p.room_revenue)],
              [t("totalRevenue"), money(p.total_revenue)],
              [t("adr"), money(p.adr)],
              [t("revpar"), money(p.revpar)],
            ].map(([l, v]: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 4px",
                borderBottom: "1px solid #f4f1ea", fontSize: 13 }}>
                <span style={{ color: "#6d6753" }}>{l}</span>
                <b style={{ color: BRAND.greenDark, fontVariantNumeric: "tabular-nums" }}>{v}</b>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={24}>
              <FlowTile title={t("arrivalsToday")} icon={<LoginOutlined />} color="#4A90D9"
                big={b.arrivals.arrived} bigLabel={`/ ${b.arrivals.expected} متوقع`}
                adults={b.arrivals.adults} children={b.arrivals.children} />
            </Col>
            <Col xs={12} lg={24}>
              <FlowTile title={t("inHouse")} icon={<TeamOutlined />} color={BRAND.green}
                big={b.in_house.rooms} bigLabel="غرفة"
                adults={b.in_house.adults} children={b.in_house.children} />
            </Col>
            <Col xs={24} lg={24}>
              <FlowTile title={t("departuresToday")} icon={<LogoutOutlined />} color="#E67E22"
                big={b.departures.checked_out} bigLabel="غادر"
                adults={b.departures.adults} children={b.departures.children}
                sub={t("expectedDep")} subVal={b.departures.expected} />
            </Col>
          </Row>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={t("revenue7")}>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={data.revenue_series}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={BRAND.green} stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} />
                <YAxis width={70} tickFormatter={(v: number) => v.toLocaleString()} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ر.س`]} />
                <Area type="monotone" dataKey="amount" stroke={BRAND.greenDark} fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t("roomStatus")}>
            {Object.entries(data.room_status).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Tag color={statusColors[k]} style={{ minWidth: 72, textAlign: "center" }}>{t(k)}</Tag>
                <Progress percent={data.total_rooms ? Math.round((v as number) / data.total_rooms * 100) : 0}
                  size="small" style={{ flex: 1, marginInline: 10 }} showInfo={false} strokeColor={BRAND.green} />
                <b style={{ fontVariantNumeric: "tabular-nums", minWidth: 24, textAlign: "end" }}>{v as number}</b>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

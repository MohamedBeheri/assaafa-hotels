import { Row, Col, Card, Progress, Table, Tag, Spin, Button, Badge, App as AntApp, Tooltip as ATooltip } from "antd";
import {
  LoginOutlined, LogoutOutlined, TeamOutlined, GlobalOutlined, CheckCircleOutlined,
  UserOutlined, SmileOutlined, CheckOutlined, StarOutlined, DeleteOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const money = (v: number) => `${(v || 0).toLocaleString()} ر.س`;

/* صف حالة تدبير في مصفوفة الغرف — تفاعلي (ينقل لصفحة الغرف مفلترة) */
function HKRow({ icon, color, data, hk, nav }: any) {
  const go = () => nav(`/rooms?hk=${hk}`);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
      borderRadius: 12, padding: 10, transition: ".15s" }}
      onClick={go}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F5EE")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: color,
        color: "#fff", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div style={{ background: "#F7F5EE", borderRadius: 10, padding: "8px 14px", flex: 1 }}>
        {[["مشغولة", data.occupied], ["مخصّصة", data.assigned], ["شاغرة", data.vacant]].map(([l, v]: any) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "1px 0" }}>
            <span style={{ color: "#8d8775" }}>{l}</span>
            <b style={{ color, fontVariantNumeric: "tabular-nums" }}>{v}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const nav = useNavigate();
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

      {/* ═══ لوحة حالة الغرف بنمط OPERA — تفاعلية ═══ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* الوصول */}
        <Col xs={12} lg={5}>
          <Card className="stat-card" hoverable onClick={() => nav("/front-office")} styles={{ body: { padding: 18, textAlign: "center" } }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>{t("arrivalsToday")}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ color: "#bbb", fontSize: 12 }}>0</span>
              <div style={{ flex: 1, height: 4, background: "linear-gradient(90deg,#8E5AA8," + BRAND.gold + ")", borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", top: -8, insetInlineStart: `${b.arrivals.expected ? (b.arrivals.arrived / (b.arrivals.expected || 1)) * 100 : 0}%`, transform: "translateX(-50%)" }}>
                  <UserOutlined style={{ color: "#8E5AA8" }} />
                </div>
              </div>
              <span style={{ color: "#bbb", fontSize: 12 }}>{b.arrivals.expected + b.arrivals.arrived}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#8E5AA8", fontVariantNumeric: "tabular-nums" }}>{b.arrivals.arrived}</div>
            <div style={{ fontSize: 12, color: "#8d8775" }}>{t("expectedArr")}: <b>{b.arrivals.expected}</b></div>
          </Card>
        </Col>

        {/* حالة الغرف — المصفوفة */}
        <Col xs={24} lg={9}>
          <Card title={<><span style={{ marginInlineEnd: 6 }}>🛏</span>{t("roomStatusBoard")}</>} styles={{ body: { padding: 14 } }}>
            <HKRow icon={<CheckOutlined />} color="#4E9A3A" data={b.room_status_matrix.clean} hk="clean" nav={nav} />
            <HKRow icon={<StarOutlined />} color="#3B9CB3" data={b.room_status_matrix.inspected} hk="inspected" nav={nav} />
            <HKRow icon={<DeleteOutlined />} color="#C0392B" data={b.room_status_matrix.dirty} hk="dirty" nav={nav} />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {[["Skip", b.skip, "#C0392B"], ["Sleep", b.sleep, "#C0392B"], ["OOO", b.out_of_order, "#E67E22"]].map(([l, v, c]: any) => (
                <div key={l} style={{ flex: 1, textAlign: "center", background: "#F7F5EE", borderRadius: 10, padding: "8px 4px" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: c, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#8d8775" }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Max available + In House */}
        <Col xs={12} lg={5}>
          <ATooltip title="الغرف المتاحة للبيع">
            <Card className="stat-card" hoverable onClick={() => nav("/rooms?status=available")}
              styles={{ body: { padding: 18, textAlign: "center" } }}>
              <div style={{ fontWeight: 800, marginBottom: 14 }}>{t("maxAvailable")}</div>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#1F8A99,#3B9CB3)",
                display: "grid", placeItems: "center", margin: "0 auto", color: "#fff" }}>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{b.max_available}</div>
              </div>
            </Card>
          </ATooltip>
        </Col>
        <Col xs={24} lg={5}>
          <Card className="stat-card" hoverable onClick={() => nav("/front-office")} styles={{ body: { padding: 18 } }}>
            <div style={{ fontWeight: 800, marginBottom: 10, textAlign: "center" }}>{t("inHouse")}</div>
            <div style={{ textAlign: "center", fontSize: 30, fontWeight: 900, color: BRAND.green }}>{b.in_house.rooms}</div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#8d8775", marginBottom: 10 }}>غرفة مشغولة</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 13, color: "#6d6753" }}>
              <span><UserOutlined /> {b.in_house.adults} بالغ</span>
              <span><SmileOutlined /> {b.in_house.children} طفل</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* المغادرات */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card title={t("departuresToday")} styles={{ body: { padding: 18 } }}>
            <Row gutter={16}>
              {[
                { label: t("expectedDep"), rooms: b.departures.expected, adults: b.departures.adults, children: b.departures.children, color: "#8E5AA8" },
                { label: t("checkedOut"), rooms: b.departures.checked_out, adults: b.departures.adults, children: b.departures.children, color: "#6d6753" },
              ].map((d, i) => (
                <Col xs={12} key={i} style={{ textAlign: "center", borderInlineEnd: i === 0 ? "1px solid #f0ede4" : "none" }}>
                  <div style={{ color: "#8d8775", fontSize: 13, marginBottom: 6 }}>{d.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: d.color, fontVariantNumeric: "tabular-nums" }}>{d.rooms}</div>
                  <div style={{ fontSize: 12, color: "#8d8775" }}>غرفة</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 8, fontSize: 13, color: "#6d6753" }}>
                    <span><UserOutlined /> {d.adults}</span><span><SmileOutlined /> {d.children}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

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

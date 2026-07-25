import { Row, Col, Card, Progress, Table, Tag, Spin, Typography, Button, Badge, App as AntApp } from "antd";
import { GlobalOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  HomeOutlined, LoginOutlined, LogoutOutlined, DollarOutlined,
  RiseOutlined, FallOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const statusColors: Record<string, string> = {
  available: "green", occupied: "red", reserved: "gold",
  cleaning: "blue", maintenance: "orange", blocked: "default",
};

function StatCard({ title, value, suffix, icon, color }: any) {
  return (
    <Card className="stat-card" styles={{ body: { padding: "16px 18px" } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, display: "flex", flexShrink: 0,
          alignItems: "center", justifyContent: "center", fontSize: 20,
          color, background: color + "1A",
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12.5, display: "block" }}>{title}</Typography.Text>
          <div style={{
            fontSize: 21, fontWeight: 800, color: "#3D3A32", lineHeight: 1.25,
            fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
          }}>
            {value}{suffix && <span style={{ fontSize: 13, fontWeight: 600, color: "#8c8c8c", marginInlineStart: 4 }}>{suffix}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data, isLoading } = apiHooks.useDashboardQuery(params);
  const { data: overview } = apiHooks.useHotelsOverviewQuery();
  const [updateRes] = apiHooks.useUpdateReservationsMutation();
  const confirmRes = async (id: number) => {
    try { await updateRes({ id, status: "confirmed" }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };

  if (isLoading || !data) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;

  const n = (v: number) => v.toLocaleString();
  const cards = [
    { title: t("occupancyRate"), value: data.occupancy_rate, suffix: "%", icon: <HomeOutlined />, color: BRAND.green },
    { title: t("inHouse"), value: data.in_house, icon: <TeamOutlined />, color: BRAND.gold },
    { title: t("arrivalsToday"), value: data.arrivals_today, icon: <LoginOutlined />, color: "#4A90D9" },
    { title: t("departuresToday"), value: data.departures_today, icon: <LogoutOutlined />, color: "#E67E22" },
    { title: t("revenueToday"), value: n(data.revenue_today), suffix: "ر.س", icon: <DollarOutlined />, color: BRAND.greenDark },
    { title: t("revenueMonth"), value: n(data.revenue_month), suffix: "ر.س", icon: <RiseOutlined />, color: BRAND.green },
    { title: t("expensesMonth"), value: n(data.expenses_month), suffix: "ر.س", icon: <FallOutlined />, color: "#C0392B" },
    { title: t("netMonth"), value: n(data.net_month), suffix: "ر.س", icon: <WalletOutlined />, color: BRAND.goldDark },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {cards.map((c, i) => (
          <Col xs={12} md={6} key={i}><StatCard {...c} /></Col>
        ))}
      </Row>

      {data.online_pending_count > 0 && (
        <Card style={{ marginTop: 16, borderColor: "#B8985A", borderWidth: 2 }}
          title={<Badge count={data.online_pending_count} color="#B8985A" offset={[-12, 2]}>
            <span style={{ paddingInlineEnd: 18 }}>
              <GlobalOutlined style={{ color: "#B8985A", marginInlineEnd: 8 }} />
              {t("onlinePending")}
            </span>
          </Badge>}>
          <Table size="small" rowKey="id" pagination={false} dataSource={data.online_pending}
            columns={[
              { title: t("code"), dataIndex: "code",
                render: (v: string) => <Tag color="gold" icon={<GlobalOutlined />}>{v}</Tag> },
              { title: t("guest"), dataIndex: "guest" },
              { title: t("phone"), dataIndex: "phone" },
              { title: t("checkIn"), dataIndex: "check_in" },
              { title: t("checkOut"), dataIndex: "check_out" },
              { title: t("total"), dataIndex: "total",
                render: (v: number) => <b style={{ fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString()} ر.س</b> },
              { title: "", width: 130, render: (_: any, r: any) => (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                  onClick={() => confirmRes(r.id)}>{t("confirmBooking")}</Button>
              ) },
            ]} />
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={t("revenue7")}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenue_series}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.green} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={BRAND.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis width={70} tickFormatter={(v) => v.toLocaleString()} />
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
                  size="small" style={{ flex: 1, marginInline: 10 }} showInfo={false}
                  strokeColor={BRAND.green} />
                <b style={{ fontVariantNumeric: "tabular-nums", minWidth: 24, textAlign: "end" }}>{v as number}</b>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title={t("hotelsComparison")} style={{ marginTop: 16 }}>
        <Table rowKey="id" pagination={false} dataSource={overview || []}
          columns={[
            { title: t("name"), dataIndex: "name_ar" },
            { title: t("totalRooms"), dataIndex: "total_rooms" },
            { title: t("occupied"), dataIndex: "occupied" },
            { title: t("occupancyRate"), dataIndex: "occupancy_rate",
              render: (v: number) => <Progress percent={v} size="small" strokeColor={BRAND.green} /> },
          ]} />
      </Card>
    </div>
  );
}

import { Row, Col, Card, Statistic, Table, Spin, Segmented, Progress } from "antd";
import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const SOURCE_LABELS: Record<string, string> = {
  walk_in: "حضور مباشر", phone: "هاتف", online: "الموقع", ota: "قنوات خارجية",
};
const METHOD_LABELS: Record<string, string> = {
  cash: "نقدي", card: "بطاقة", transfer: "تحويل", online: "إلكتروني",
};
const PIE_COLORS = [BRAND.green, BRAND.gold, "#4A90D9", "#E67E22", "#9B59B6"];

export default function Reports() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const [days, setDays] = React.useState(30);
  const params: any = { days };
  if (hotel) params.hotel = hotel;
  const { data, isLoading } = apiHooks.useAnalyticsQuery(params);

  if (isLoading || !data) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;

  const kpis = [
    { title: t("adr"), value: data.adr, suffix: "ر.س", color: BRAND.greenDark },
    { title: t("revpar"), value: data.revpar, suffix: "ر.س", color: BRAND.goldDark },
    { title: t("avgOccupancy"), value: data.avg_occupancy, suffix: "%", color: "#4A90D9" },
    { title: t("nightsSold"), value: data.room_nights_sold, color: "#E67E22" },
  ];

  const sourceData = data.by_source.map((s: any) => ({
    name: SOURCE_LABELS[s.source] || s.source, value: s.c }));
  const methodData = data.by_method.map((m: any) => ({
    name: METHOD_LABELS[m.method] || m.method, amount: m.amount }));

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}
        styles={{ body: { display: "flex", justifyContent: "space-between", alignItems: "center" } }}>
        <b>{t("analytics")}</b>
        <Segmented value={days} onChange={(v) => setDays(v as number)}
          options={[{ label: "7 أيام", value: 7 }, { label: "30 يوم", value: 30 }, { label: "90 يوم", value: 90 }]} />
      </Card>

      <Row gutter={[16, 16]}>
        {kpis.map((k, i) => (
          <Col xs={12} md={6} key={i}>
            <Card className="stat-card">
              <Statistic title={k.title} value={k.value} suffix={k.suffix}
                valueStyle={{ color: k.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={t("occupancy30")}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.occupancy_series}>
                <defs>
                  <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND.gold} stopOpacity={0.55} />
                    <stop offset="95%" stopColor={BRAND.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} minTickGap={20} />
                <YAxis unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, "الإشغال"]} />
                <Area type="monotone" dataKey="rate" stroke={BRAND.goldDark} fill="url(#occ)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("bySource")}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}
                  paddingAngle={3}>
                  {sourceData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={t("byMethod")}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ر.س`]} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {methodData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("topGuests")}>
            <Table size="small" rowKey="name" pagination={false}
              dataSource={data.top_guests}
              columns={[
                { title: t("guest"), dataIndex: "name" },
                { title: t("reservations"), dataIndex: "count", width: 110,
                  render: (v: number) => (
                    <Progress percent={Math.min(v * 20, 100)} size="small" format={() => v}
                      strokeColor={BRAND.green} />
                  ) },
              ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import React from "react";
import { Card, Button, Table, Row, Col, Statistic, Popconfirm, App as AntApp, Tag, Alert } from "antd";
import { ThunderboltOutlined, MoonOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

export default function NightAudit() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data: history } = apiHooks.useNightAuditHistoryQuery(params);
  const [run, { isLoading }] = apiHooks.useNightAuditRunMutation();
  const [last, setLast] = React.useState<any>(null);

  const doRun = async () => {
    try {
      const r = await run({ hotel: hotel || undefined }).unwrap();
      setLast(r);
      message.success(t("auditDone"));
    } catch { message.error("خطأ"); }
  };

  const snap = last;
  return (
    <div>
      <Card
        style={{ background: "linear-gradient(135deg,#1F3320,#2C4A2B)", border: "none", marginBottom: 16 }}
        styles={{ body: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 } }}>
        <div style={{ color: "#fff" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}><MoonOutlined style={{ marginInlineEnd: 8, color: BRAND.gold }} />{t("nightAudit")}</div>
          <div style={{ color: "#C9D6BC", fontSize: 13, marginTop: 4 }}>{t("nightAuditDesc")}</div>
        </div>
        <Popconfirm title={t("confirmAudit")} onConfirm={doRun} okText={t("runAudit")}>
          <Button size="large" loading={isLoading} icon={<ThunderboltOutlined />}
            style={{ background: BRAND.gold, borderColor: BRAND.gold, color: "#fff", fontWeight: 800 }}>
            {t("runAudit")}
          </Button>
        </Popconfirm>
      </Card>

      {snap && (
        <>
          <Alert type="success" showIcon style={{ marginBottom: 16 }}
            message={`${t("auditDone")} — ${snap.business_date}`}
            description={snap.no_shows > 0 ? `${t("noShowsFlagged")}: ${snap.no_shows}` : t("noNoShows")} />
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {[
              { title: t("occupancyRate"), value: snap.occupancy, suffix: "%", color: BRAND.green },
              { title: t("adr"), value: snap.adr, suffix: "ر.س", color: BRAND.goldDark },
              { title: t("revpar"), value: snap.revpar, suffix: "ر.س", color: "#4A90D9" },
              { title: t("revenueToday"), value: snap.revenue, suffix: "ر.س", color: BRAND.greenDark },
              { title: t("nightsSold"), value: snap.rooms_sold, color: "#E67E22" },
              { title: t("arrivalsToday"), value: snap.arrivals, color: "#4A90D9" },
              { title: t("departuresToday"), value: snap.departures, color: "#9B59B6" },
              { title: t("noShow"), value: snap.no_shows, color: "#C0392B" },
            ].map((k, i) => (
              <Col xs={12} md={6} key={i}>
                <Card className="stat-card"><Statistic title={k.title} value={k.value} suffix={k.suffix}
                  valueStyle={{ color: k.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }} /></Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      <Card title={t("auditHistory")}>
        <Table rowKey="id" dataSource={history || []} scroll={{ x: true }}
          columns={[
            { title: t("date"), dataIndex: "business_date" },
            { title: "الفندق", dataIndex: "hotel_name" },
            { title: t("occupancyRate"), dataIndex: "occupancy", render: (v: any) => `${v}%` },
            { title: t("adr"), dataIndex: "adr", render: (v: any) => `${v} ر.س` },
            { title: t("revpar"), dataIndex: "revpar", render: (v: any) => `${v} ر.س` },
            { title: t("revenueToday"), dataIndex: "revenue", render: (v: any) => `${Number(v).toLocaleString()} ر.س` },
            { title: t("noShow"), dataIndex: "no_shows",
              render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag>0</Tag> },
            { title: "بواسطة", dataIndex: "run_by_name" },
          ]} />
      </Card>
    </div>
  );
}

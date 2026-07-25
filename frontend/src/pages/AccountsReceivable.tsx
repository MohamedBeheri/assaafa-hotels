import { Card, Table, Tag, Row, Col, Statistic, Spin, Progress } from "antd";
import { BankOutlined, WarningOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { BRAND } from "../theme";

export default function AccountsReceivable() {
  const { t } = useTranslation();
  const { data, isLoading } = apiHooks.useAccountsReceivableQuery();
  if (isLoading || !data) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;

  const withBalance = data.companies.filter((c: any) => c.outstanding > 0);
  const overLimit = data.companies.filter((c: any) => c.over_limit).length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <Card className="stat-card"><Statistic title={t("totalAR")} value={data.total_ar} suffix="ر.س"
            prefix={<BankOutlined style={{ color: BRAND.gold, marginInlineEnd: 6 }} />}
            valueStyle={{ color: BRAND.goldDark, fontWeight: 800 }} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="stat-card"><Statistic title={t("companiesWithBalance")} value={withBalance.length}
            valueStyle={{ color: BRAND.green, fontWeight: 800 }} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="stat-card"><Statistic title={t("overLimit")} value={overLimit}
            prefix={overLimit > 0 ? <WarningOutlined style={{ color: "#C0392B", marginInlineEnd: 6 }} /> : undefined}
            valueStyle={{ color: overLimit > 0 ? "#C0392B" : "#8c8c8c", fontWeight: 800 }} /></Card>
        </Col>
      </Row>

      <Card title={<><BankOutlined style={{ color: BRAND.gold, marginInlineEnd: 8 }} />{t("cityLedger")}</>}>
        <Table rowKey="id" dataSource={data.companies} pagination={false}
          expandable={{
            expandedRowRender: (c: any) => (
              <Table size="small" rowKey="id" pagination={false} dataSource={c.invoices}
                columns={[
                  { title: t("invoiceNo"), dataIndex: "number" },
                  { title: t("guest"), dataIndex: "guest" },
                  { title: t("date"), dataIndex: "issued_at" },
                  { title: t("total"), dataIndex: "total", render: (v: any) => `${v.toLocaleString()} ر.س` },
                  { title: t("balance"), dataIndex: "balance",
                    render: (v: any) => <b style={{ color: "#C0392B" }}>{v.toLocaleString()} ر.س</b> },
                ]} />
            ),
            rowExpandable: (c: any) => c.invoices.length > 0,
          }}
          columns={[
            { title: t("name"), dataIndex: "name",
              render: (v: string, c: any) => (
                <span>{v} <Tag color={c.kind === "travel_agent" ? "purple" : "blue"}>{c.kind_display}</Tag></span>
              ) },
            { title: "فواتير مفتوحة", dataIndex: "invoices", render: (v: any[]) => v.length },
            { title: "حد الائتمان", dataIndex: "credit_limit", render: (v: any) => `${v.toLocaleString()} ر.س` },
            { title: t("balance"), dataIndex: "outstanding",
              render: (v: any, c: any) => (
                <div style={{ minWidth: 160 }}>
                  <b style={{ color: v > 0 ? "#C0392B" : "#6FA23C" }}>{v.toLocaleString()} ر.س</b>
                  {c.credit_limit > 0 && (
                    <Progress percent={Math.min(Math.round(v / c.credit_limit * 100), 100)} size="small"
                      status={c.over_limit ? "exception" : "normal"}
                      strokeColor={c.over_limit ? "#C0392B" : BRAND.green} showInfo={false} />
                  )}
                </div>
              ) },
            { title: "", render: (_: any, c: any) => c.over_limit
              ? <Tag color="red" icon={<WarningOutlined />}>{t("overLimit")}</Tag> : null },
          ]} />
      </Card>
    </div>
  );
}

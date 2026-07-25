import React from "react";
import {
  Card, Table, Tag, Button, Drawer, Descriptions, Divider, Form,
  InputNumber, Select, App as AntApp, Statistic, Row, Col, Input, Space,
} from "antd";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

const statusColors: Record<string, string> = { open: "blue", paid: "green", partial: "gold", void: "red" };

export default function Invoices() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data, isFetching } = apiHooks.useGetInvoicesQuery(params);
  const [addPayment] = apiHooks.useCreatePaymentsMutation();
  const [invoiceAction] = apiHooks.useInvoiceActionMutation();
  const { data: services } = apiHooks.useGetServicesQuery();
  const { data: companies } = apiHooks.useGetCompaniesQuery();
  const [svcId, setSvcId] = React.useState<number | undefined>();
  const [couponCode, setCouponCode] = React.useState("");
  const [sel, setSel] = React.useState<any>(null);
  const [form] = Form.useForm();

  // إبقاء تفاصيل الفاتورة المفتوحة محدثة
  const current = (data?.results || []).find((i: any) => i.id === sel?.id) || sel;

  const pay = async () => {
    const v = await form.validateFields();
    try {
      await addPayment({ invoice: current.id, amount: v.amount, method: v.method, reference: v.reference || "" }).unwrap();
      message.success(t("saved")); form.resetFields();
    } catch { message.error("خطأ"); }
  };

  return (
    <Card title={t("invoices")}>
      <Table rowKey="id" loading={isFetching} dataSource={data?.results || []} scroll={{ x: true }}
        onRow={(r) => ({ onClick: () => setSel(r), style: { cursor: "pointer" } })}
        columns={[
          { title: t("invoiceNo"), dataIndex: "number" },
          { title: t("guest"), dataIndex: "guest_name" },
          { title: "الفندق", dataIndex: "hotel_name" },
          { title: t("total"), dataIndex: "total", render: (v: any) => `${v} ر.س` },
          { title: t("paid"), dataIndex: "paid_amount", render: (v: any) => `${v} ر.س` },
          { title: t("balance"), dataIndex: "balance", render: (v: any) => <b style={{ color: v > 0 ? "#C0392B" : "#6FA23C" }}>{v} ر.س</b> },
          { title: t("status"), dataIndex: "status",
            render: (s: string, r: any) => <Tag color={statusColors[s]}>{r.status_display}</Tag> },
        ]} />

      <Drawer open={!!sel} onClose={() => setSel(null)} width={560}
        title={current?.number}>
        {current && (
          <>
            <Row gutter={12}>
              <Col span={8}><Statistic title={t("total")} value={current.total} suffix="ر.س" /></Col>
              <Col span={8}><Statistic title={t("paid")} value={current.paid_amount} suffix="ر.س" /></Col>
              <Col span={8}><Statistic title={t("balance")} value={current.balance} suffix="ر.س"
                valueStyle={{ color: current.balance > 0 ? "#C0392B" : "#6FA23C" }} /></Col>
            </Row>
            {/* توجيه لحساب شركة/وكيل (AR) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FBF9F3", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>🏢 {t("billTo")}:</span>
              <Select allowClear placeholder={t("guestPays")} style={{ flex: 1 }}
                value={current.bill_to_company || undefined}
                options={(companies?.results || []).map((c: any) => ({ value: c.id, label: `${c.name} (${c.kind_display})` }))}
                onChange={async (v) => {
                  try {
                    await invoiceAction({ id: current.id, action: "route_to_company", body: { company: v ?? null } }).unwrap();
                    message.success(t("saved"));
                  } catch { message.error("خطأ"); }
                }} />
              {current.company_name && <Tag color="gold">{t("onCompanyAccount")}</Tag>}
            </div>

            <Divider>{t("folioItems")}</Divider>
            {current.windows?.length > 1 && (
              <Space wrap style={{ marginBottom: 10 }}>
                {current.windows.map((w: any) => (
                  <Tag key={w.window} color={w.window === 1 ? "green" : "gold"}>
                    {t("window")} {w.window}: {w.total.toLocaleString()} ر.س ({w.count})
                  </Tag>
                ))}
              </Space>
            )}
            <Table size="small" rowKey="id" pagination={false} dataSource={current.charges}
              columns={[
                { title: "الوصف", dataIndex: "description" },
                { title: t("total"), dataIndex: "total" },
                { title: t("window"), dataIndex: "window", width: 90,
                  render: (w: number, r: any) => (
                    <Select size="small" value={w || 1} style={{ width: 62 }}
                      options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
                      onChange={async (v) => {
                        try {
                          await invoiceAction({ id: current.id, action: "transfer_charge", body: { charge: r.id, window: v } }).unwrap();
                        } catch { message.error("خطأ"); }
                      }} />
                  ) },
              ]} />
            <Descriptions size="small" column={1} style={{ marginTop: 12 }}>
              <Descriptions.Item label={t("vat")}>{current.vat_amount} ر.س</Descriptions.Item>
              <Descriptions.Item label={t("total")}><b>{current.total} ر.س</b></Descriptions.Item>
            </Descriptions>
            <Divider>{t("addService")} / {t("applyCoupon")}</Divider>
            <Space wrap style={{ marginBottom: 8 }}>
              <Select allowClear placeholder={t("addService")} style={{ minWidth: 180 }}
                value={svcId} onChange={setSvcId}
                options={(services?.results || [])
                  .filter((s: any) => s.hotel === current.hotel)
                  .map((s: any) => ({ value: s.id, label: `${s.name_ar} (${s.price} ر.س)` }))} />
              <Button disabled={!svcId} onClick={async () => {
                try {
                  await invoiceAction({ id: current.id, action: "add_service", body: { service: svcId } }).unwrap();
                  message.success(t("saved")); setSvcId(undefined);
                } catch { message.error("خطأ"); }
              }}>{t("addService")}</Button>
            </Space>
            <Space wrap>
              <Input placeholder={t("couponCode")} value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)} style={{ width: 160 }} />
              <Button disabled={!couponCode} onClick={async () => {
                try {
                  const r = await invoiceAction({ id: current.id, action: "apply_coupon", body: { code: couponCode } }).unwrap();
                  message.success(`${t("discount")}: ${r.discount} ر.س`); setCouponCode("");
                } catch (e: any) { message.error(e?.data?.detail || "خطأ"); }
              }}>{t("applyCoupon")}</Button>
            </Space>
            <Divider>{t("addPayment")}</Divider>
            <Form form={form} layout="inline">
              <Form.Item name="amount" rules={[{ required: true }]} initialValue={current.balance}>
                <InputNumber placeholder={t("amount")} />
              </Form.Item>
              <Form.Item name="reference"><Input placeholder="مرجع (رقم الشيك/التحويل)" style={{ width: 150 }} /></Form.Item>
              <Form.Item name="method" initialValue="cash">
                <Select style={{ width: 130 }} options={[
                  { value: "cash", label: "نقدي" }, { value: "card", label: "بطاقة" },
                  { value: "cheque", label: "شيك" }, { value: "transfer", label: "تحويل بنكي" },
                  { value: "online", label: "دفع إلكتروني" }]} />
              </Form.Item>
              <Button type="primary" onClick={pay}>{t("addPayment")}</Button>
            </Form>
            <Divider>المدفوعات</Divider>
            <Table size="small" rowKey="id" pagination={false} dataSource={current.payments}
              columns={[
                { title: t("amount"), dataIndex: "amount" },
                { title: t("method"), dataIndex: "method_display" },
                { title: t("date"), dataIndex: "paid_at", render: (v: string) => v?.slice(0, 16).replace("T", " ") },
              ]} />
          </>
        )}
      </Drawer>
    </Card>
  );
}

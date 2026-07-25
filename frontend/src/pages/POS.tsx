import React from "react";
import {
  Row, Col, Card, Button, Tabs, List, InputNumber, Empty, Segmented,
  Select, App as AntApp, Divider, Statistic, Space,
} from "antd";
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

interface CartItem { product: number; name: string; price: number; qty: number; }

export default function POS() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const activeHotel = hotel || hotels?.results?.[0]?.id;
  const { data: cats } = apiHooks.useGetCategoriesQuery(activeHotel ? { hotel: activeHotel } : undefined);
  const { data: products } = apiHooks.useGetProductsQuery(activeHotel ? { hotel: activeHotel } : undefined);
  const { data: reservations } = apiHooks.useGetReservationsQuery({ status: "checked_in" });
  const [create] = apiHooks.useCreateOrdersMutation();
  const [orderAct] = apiHooks.useOrderActionMutation();

  const [cat, setCat] = React.useState<number | "all">("all");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [resId, setResId] = React.useState<number | undefined>();

  const list = (products?.results || []).filter((p: any) => cat === "all" || p.category === cat);
  const add = (p: any) => setCart((c) => {
    const ex = c.find((i) => i.product === p.id);
    if (ex) return c.map((i) => i.product === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, { product: p.id, name: p.name_ar, price: Number(p.price), qty: 1 }];
  });
  const setQty = (id: number, qty: number) => setCart((c) =>
    qty <= 0 ? c.filter((i) => i.product !== id) : c.map((i) => i.product === id ? { ...i, qty } : i));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  const submit = async (mode: "pay" | "room") => {
    if (!cart.length) return;
    if (mode === "room" && !resId) { message.warning("اختر الحجز/الغرفة"); return; }
    const body: any = {
      hotel: activeHotel, order_type: mode === "room" ? "room_service" : "dine_in",
      reservation: mode === "room" ? resId : null,
      items: cart.map((i) => ({ product: i.product, quantity: i.qty, unit_price: i.price })),
    };
    try {
      const order = await create(body).unwrap();
      await orderAct({ id: order.id, action: mode === "room" ? "charge_to_room" : "pay" }).unwrap();
      message.success(mode === "room" ? "تم التحميل على الغرفة" : "تم الدفع");
      setCart([]); setResId(undefined);
    } catch (e: any) { message.error(JSON.stringify(e?.data)); }
  };

  return (
    <Row gutter={16}>
      <Col xs={24} lg={16}>
        <Card title={t("pos")} styles={{ body: { minHeight: 480 } }}>
          <Segmented value={cat} onChange={(v) => setCat(v as any)}
            options={[{ label: t("category") + " • الكل", value: "all" },
              ...(cats?.results || []).map((c: any) => ({ label: c.name_ar, value: c.id }))]}
            style={{ marginBottom: 16 }} />
          <Row gutter={[12, 12]}>
            {list.map((p: any) => (
              <Col xs={12} sm={8} md={6} key={p.id}>
                <Card hoverable onClick={() => add(p)} styles={{ body: { padding: 14, textAlign: "center" } }}>
                  <div style={{ fontSize: 26, color: BRAND.green }}><ShoppingCartOutlined /></div>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>{p.name_ar}</div>
                  <div style={{ color: BRAND.goldDark, fontWeight: 700 }}>{p.price} ر.س</div>
                  <Button type="primary" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} />
                </Card>
              </Col>
            ))}
            {!list.length && <Empty style={{ margin: "40px auto" }} />}
          </Row>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title={<><ShoppingCartOutlined /> {t("cart")}</>}>
          {cart.length ? (
            <List size="small" dataSource={cart} renderItem={(i) => (
              <List.Item actions={[
                <InputNumber size="small" min={0} value={i.qty} onChange={(v) => setQty(i.product, v || 0)} style={{ width: 60 }} />,
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setQty(i.product, 0)} />,
              ]}>
                <div>{i.name}<br /><small style={{ color: BRAND.goldDark }}>{i.price} × {i.qty} = {(i.price * i.qty).toFixed(2)}</small></div>
              </List.Item>
            )} />
          ) : <Empty description={t("cart")} />}
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>الإجمالي</span><b>{subtotal.toFixed(2)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>{t("vat")} 15%</span><b>{vat.toFixed(2)}</b></div>
          <Statistic value={total} suffix="ر.س" valueStyle={{ color: BRAND.greenDark, fontWeight: 800 }} />
          <Divider />
          <Select allowClear placeholder="حجز لتحميل الطلب على الغرفة" style={{ width: "100%", marginBottom: 10 }}
            value={resId} onChange={setResId}
            options={(reservations?.results || []).map((r: any) => ({
              value: r.id, label: `${r.code} - ${r.guest_detail?.full_name}` }))} />
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button type="primary" block size="large" disabled={!cart.length} onClick={() => submit("pay")}>{t("payNow")}</Button>
            <Button block size="large" disabled={!cart.length} onClick={() => submit("room")}>{t("chargeToRoom")}</Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

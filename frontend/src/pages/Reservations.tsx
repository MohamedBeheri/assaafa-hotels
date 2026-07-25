import React from "react";
import {
  Card, Table, Button, Tag, Space, Modal, Form, Select, DatePicker,
  InputNumber, App as AntApp,
} from "antd";
import { PlusOutlined, LoginOutlined, LogoutOutlined, CloseOutlined, GlobalOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

const statusColors: Record<string, string> = {
  pending: "gold", confirmed: "blue", checked_in: "green",
  checked_out: "default", cancelled: "red", no_show: "volcano",
};

export default function Reservations() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data, isFetching } = apiHooks.useGetReservationsQuery(params);
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: guests } = apiHooks.useGetGuestsQuery();
  const [create] = apiHooks.useCreateReservationsMutation();
  const [update] = apiHooks.useUpdateReservationsMutation();
  const [act] = apiHooks.useReservationActionMutation();
  const confirmRes = async (id: number) => {
    try { await update({ id, status: "confirmed" }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };
  const [open, setOpen] = React.useState(false);
  const [form] = Form.useForm();
  const selHotel = Form.useWatch("hotel", form);
  const selRoom = Form.useWatch("room", form);
  const selDates = Form.useWatch("dates", form);
  const { data: rooms } = apiHooks.useGetRoomsQuery(selHotel ? { hotel: selHotel, status: "available" } : undefined);
  // تسعير موسمي تلقائي
  const roomObj = (rooms?.results || []).find((r: any) => r.id === selRoom);
  const quoteParams = roomObj && selDates?.[0] && selDates?.[1] ? {
    room_type: roomObj.room_type,
    check_in: selDates[0].format("YYYY-MM-DD"),
    check_out: selDates[1].format("YYYY-MM-DD"),
  } : undefined;
  const { data: quote } = apiHooks.useQuoteQuery(quoteParams ?? ({} as any), { skip: !quoteParams });
  React.useEffect(() => {
    if (quote?.avg_rate) form.setFieldValue("rate", quote.avg_rate);
  }, [quote]);

  const doAction = async (id: number, action: string) => {
    try { await act({ id, action }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };

  const onSave = async () => {
    const v = await form.validateFields();
    const room = (rooms?.results || []).find((r: any) => r.id === v.room);
    const body = {
      hotel: v.hotel, guest: v.guest, adults: v.adults || 1,
      check_in: v.dates[0].format("YYYY-MM-DD"),
      check_out: v.dates[1].format("YYYY-MM-DD"),
      status: "confirmed",
      rooms: [{ room: v.room, room_type: room.room_type, rate_per_night: v.rate || room.base_price }],
    };
    try { await create(body).unwrap(); message.success(t("saved")); setOpen(false); form.resetFields(); }
    catch (e: any) { message.error(JSON.stringify(e?.data)); }
  };

  return (
    <Card title={t("reservations")} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("newReservation")}</Button>}>
      <Table rowKey="id" loading={isFetching} dataSource={data?.results || []} scroll={{ x: true }}
        childrenColumnName="_subRows"
        rowClassName={(r: any) => r.source === "online" && r.status === "pending" ? "row-online-pending" : ""}
        columns={[
          { title: t("code"), dataIndex: "code",
            render: (v: string, r: any) => r.source === "online"
              ? <Tag color="gold" icon={<GlobalOutlined />}>{v}</Tag> : v },
          { title: t("source"), dataIndex: "source_display", width: 110,
            render: (v: string, r: any) => r.source === "online"
              ? <Tag color="gold">{v}</Tag> : <span style={{ color: "#8c8c8c" }}>{v}</span> },
          { title: t("guest"), dataIndex: "guest_detail", render: (g: any) => g?.full_name },
          { title: "الفندق", dataIndex: "hotel_name" },
          { title: t("checkIn"), dataIndex: "check_in" },
          { title: t("checkOut"), dataIndex: "check_out" },
          { title: t("nights"), dataIndex: "nights" },
          { title: t("total"), dataIndex: "rooms_total", render: (v: any) => `${v} ر.س` },
          { title: t("status"), dataIndex: "status",
            render: (s: string, r: any) => <Tag color={statusColors[s]}>{r.status_display}</Tag> },
          { title: t("actions"), render: (_: any, r: any) => (
            <Space>
              {r.status === "pending" &&
                <Button size="small" style={{ borderColor: "#B8985A", color: "#96793F" }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => confirmRes(r.id)}>{t("confirmBooking")}</Button>}
              {["confirmed", "pending"].includes(r.status) &&
                <Button size="small" type="primary" icon={<LoginOutlined />}
                  onClick={() => doAction(r.id, "check_in")}>{t("checkInAction")}</Button>}
              {r.status === "checked_in" &&
                <Button size="small" icon={<LogoutOutlined />}
                  onClick={() => doAction(r.id, "check_out")}>{t("checkOutAction")}</Button>}
              {!["cancelled", "checked_out"].includes(r.status) &&
                <Button size="small" danger icon={<CloseOutlined />} onClick={() => doAction(r.id, "cancel")} />}
            </Space>
          ) },
        ]} />

      <Modal open={open} title={t("newReservation")} onCancel={() => setOpen(false)} onOk={onSave} destroyOnClose width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="guest" label={t("guest")} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={(guests?.results || []).map((g: any) => ({ value: g.id, label: `${g.full_name} - ${g.phone}` }))} />
          </Form.Item>
          <Form.Item name="dates" label={`${t("checkIn")} / ${t("checkOut")}`} rules={[{ required: true }]}
            initialValue={[dayjs(), dayjs().add(1, "day")]}>
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="room" label={t("room")} rules={[{ required: true }]}>
            <Select disabled={!selHotel} placeholder={selHotel ? "" : "اختر الفندق أولاً"}
              options={(rooms?.results || []).map((r: any) => ({ value: r.id, label: `${r.number} - ${r.room_type_name} (${r.base_price} ر.س)` }))} />
          </Form.Item>
          <Form.Item name="rate" label={t("rate")}
            extra={quote ? `${quote.nights} ليلة × ${quote.avg_rate} = ${quote.total.toLocaleString()} ر.س (سعر موسمي)` : undefined}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="adults" label="عدد البالغين" initialValue={1}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

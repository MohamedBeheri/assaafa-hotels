import React from "react";
import {
  Card, Table, Button, Tag, Space, Modal, Form, Select, DatePicker, Input,
  InputNumber, Progress, App as AntApp, Divider, Drawer,
} from "antd";
import { PlusOutlined, TeamOutlined, DownloadOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

const statusColors: Record<string, string> = { tentative: "gold", confirmed: "green", cancelled: "red" };

export default function GroupBlocks() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data, isFetching } = apiHooks.useGetGroupBlocksQuery(params);
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: companies } = apiHooks.useGetCompaniesQuery();
  const { data: guests } = apiHooks.useGetGuestsQuery();
  const [create] = apiHooks.useCreateGroupBlocksMutation();
  const [pickup] = apiHooks.useBlockActionMutation();
  const [open, setOpen] = React.useState(false);
  const [form] = Form.useForm();
  const selHotel = Form.useWatch("hotel", form);
  const { data: types } = apiHooks.useGetRoomTypesQuery(selHotel ? { hotel: selHotel } : undefined);
  const [pickupBlock, setPickupBlock] = React.useState<any>(null);
  const [pickGuest, setPickGuest] = React.useState<number>();
  const [pickRoom, setPickRoom] = React.useState<number>();

  const onSave = async () => {
    const v = await form.validateFields();
    const body = {
      hotel: v.hotel, name: v.name, company: v.company ?? null, status: v.status,
      check_in: v.dates[0].format("YYYY-MM-DD"), check_out: v.dates[1].format("YYYY-MM-DD"),
      notes: v.notes || "",
      block_rooms: (v.block_rooms || []).map((r: any) => ({
        room_type: r.room_type, quantity: r.quantity, rate_per_night: r.rate_per_night })),
    };
    try { await create(body).unwrap(); message.success(t("saved")); setOpen(false); form.resetFields(); }
    catch (e: any) { message.error(JSON.stringify(e?.data)); }
  };

  const doPickup = async () => {
    if (!pickGuest || !pickRoom) { message.warning("اختر النزيل ونوع الغرفة"); return; }
    try {
      await pickup({ id: pickupBlock.id, action: "pickup", body: { guest: pickGuest, block_room: pickRoom } }).unwrap();
      message.success(t("pickedUp")); setPickGuest(undefined); setPickRoom(undefined);
    } catch (e: any) { message.error(e?.data?.detail || "خطأ"); }
  };

  const current = (data?.results || []).find((b: any) => b.id === pickupBlock?.id) || pickupBlock;

  return (
    <Card title={<><TeamOutlined style={{ color: BRAND.green, marginInlineEnd: 8 }} />{t("groupBlocks")}</>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("newBlock")}</Button>}>
      <Table rowKey="id" loading={isFetching} dataSource={data?.results || []} scroll={{ x: true }}
        columns={[
          { title: t("blockName"), dataIndex: "name" },
          { title: "الفندق", dataIndex: "hotel_name" },
          { title: t("company"), dataIndex: "company_name", render: (v: string) => v || "—" },
          { title: t("checkIn"), dataIndex: "check_in" },
          { title: t("checkOut"), dataIndex: "check_out" },
          { title: t("pickup"), render: (_: any, r: any) => (
            <div style={{ minWidth: 130 }}>
              <Progress percent={r.total_rooms ? Math.round(r.picked_up / r.total_rooms * 100) : 0}
                size="small" format={() => `${r.picked_up}/${r.total_rooms}`} strokeColor={BRAND.green} />
            </div>
          ) },
          { title: t("status"), dataIndex: "status",
            render: (s: string, r: any) => <Tag color={statusColors[s]}>{r.status_display}</Tag> },
          { title: t("actions"), render: (_: any, r: any) => (
            <Button size="small" type="primary" icon={<DownloadOutlined />}
              onClick={() => setPickupBlock(r)}>{t("pickupRoom")}</Button>
          ) },
        ]} />

      {/* إنشاء بلوك */}
      <Modal open={open} title={t("newBlock")} onCancel={() => setOpen(false)} onOk={onSave} width={620} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="name" label={t("blockName")} rules={[{ required: true }]}>
            <Input placeholder="مثال: وفد شركة أرامكو للعمرة" />
          </Form.Item>
          <Form.Item name="company" label={`${t("company")} (اختياري)`}>
            <Select allowClear options={(companies?.results || []).map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="dates" label={`${t("checkIn")} / ${t("checkOut")}`} rules={[{ required: true }]}
            initialValue={[dayjs(), dayjs().add(2, "day")]}>
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label={t("status")} initialValue="tentative">
            <Select options={[{ value: "tentative", label: "مبدئي" }, { value: "confirmed", label: "مؤكد" }]} />
          </Form.Item>
          <Divider>غرف البلوك</Divider>
          <Form.List name="block_rooms" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...f} name={[f.name, "room_type"]} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select placeholder="النوع" style={{ width: 200 }}
                        options={(types?.results || []).map((rt: any) => ({ value: rt.id, label: rt.name_ar }))} />
                    </Form.Item>
                    <Form.Item {...f} name={[f.name, "quantity"]} initialValue={1} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <InputNumber min={1} placeholder="العدد" />
                    </Form.Item>
                    <Form.Item {...f} name={[f.name, "rate_per_night"]} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} placeholder="سعر الليلة" />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(f.name)} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>إضافة نوع غرفة</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* سحب غرفة */}
      <Drawer open={!!pickupBlock} onClose={() => setPickupBlock(null)} width={460} title={current?.name}>
        {current && (
          <>
            <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
              <div>📅 <b dir="ltr">{current.check_in} → {current.check_out}</b> ({current.nights} ليال)</div>
              {current.company_name && <div>🏢 <b>{current.company_name}</b></div>}
              <Progress percent={current.total_rooms ? Math.round(current.picked_up / current.total_rooms * 100) : 0}
                format={() => `${t("pickedUp")}: ${current.picked_up}/${current.total_rooms}`} strokeColor={BRAND.green} />
            </Space>
            <Divider>{t("pickupRoom")}</Divider>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select placeholder={t("guest")} showSearch optionFilterProp="label" style={{ width: "100%" }}
                value={pickGuest} onChange={setPickGuest}
                options={(guests?.results || []).map((g: any) => ({ value: g.id, label: `${g.full_name} - ${g.phone}` }))} />
              <Select placeholder="نوع الغرفة من البلوك" style={{ width: "100%" }}
                value={pickRoom} onChange={setPickRoom}
                options={(current.block_rooms || []).map((br: any) => ({
                  value: br.id, label: `${br.room_type_name} — ${br.rate_per_night} ر.س/ليلة (${br.quantity} غرف)` }))} />
              <Button type="primary" block onClick={doPickup} icon={<DownloadOutlined />}>{t("pickupRoom")}</Button>
            </Space>
          </>
        )}
      </Drawer>
    </Card>
  );
}

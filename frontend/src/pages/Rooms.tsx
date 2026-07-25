import React from "react";
import { Form, Input, Select, Tag, App as AntApp } from "antd";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

const statusColors: Record<string, string> = {
  available: "green", occupied: "red", reserved: "gold",
  cleaning: "blue", maintenance: "orange", blocked: "default",
};
const hkColors: Record<string, string> = {
  clean: "green", dirty: "red", inspected: "cyan", out_of_order: "orange",
};
const HK_OPTIONS = ["clean", "dirty", "inspected", "out_of_order"];

export default function Rooms() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { message } = AntApp.useApp();
  const [sp] = useSearchParams();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: types } = apiHooks.useGetRoomTypesQuery(hotel ? { hotel } : undefined);
  const [setHk] = apiHooks.useRoomHkActionMutation();

  // فلاتر من الرابط (من لوحة التحكم التفاعلية)
  const hkFilter = sp.get("hk");
  const statusFilter = sp.get("status");
  const params: any = {};
  if (hotel) params.hotel = hotel;
  if (hkFilter) params.hk_status = hkFilter;
  if (statusFilter) params.status = statusFilter;

  const changeHk = async (id: number, hk_status: string) => {
    try { await setHk({ id, hk_status }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };

  return (
    <CrudTable
      key={`${hkFilter}-${statusFilter}`}
      title={t("rooms") + (hkFilter ? ` — ${t(hkFilter)}` : statusFilter ? ` — ${t(statusFilter)}` : "")}
      searchable
      params={Object.keys(params).length ? params : undefined}
      hooks={{
        list: apiHooks.useGetRoomsQuery, create: apiHooks.useCreateRoomsMutation,
        update: apiHooks.useUpdateRoomsMutation, remove: apiHooks.useDeleteRoomsMutation,
      }}
      columns={[
        { title: t("roomNumber"), dataIndex: "number" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("type"), dataIndex: "room_type_name" },
        { title: t("status"), dataIndex: "status",
          render: (s: string, r: any) => <Tag color={statusColors[s]}>{r.status_display}</Tag> },
        { title: t("hkStatus"), dataIndex: "hk_status", width: 150,
          render: (hk: string, r: any) => (
            <Select size="small" value={hk || "clean"} style={{ width: 130 }}
              onChange={(v) => changeHk(r.id, v)}
              options={HK_OPTIONS.map((h) => ({ value: h, label: <Tag color={hkColors[h]} style={{ margin: 0 }}>{t(h)}</Tag> }))} />
          ) },
        { title: t("price"), dataIndex: "base_price", render: (v: any) => `${v} ر.س` },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="room_type" label={t("type")} rules={[{ required: true }]}>
            <Select options={(types?.results || []).map((rt: any) => ({ value: rt.id, label: rt.name_ar }))} />
          </Form.Item>
          <Form.Item name="number" label={t("roomNumber")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="status" label={t("status")} initialValue="available">
            <Select options={["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"]
              .map((s) => ({ value: s, label: t(s) }))} />
          </Form.Item>
          <Form.Item name="hk_status" label={t("hkStatus")} initialValue="clean">
            <Select options={HK_OPTIONS.map((h) => ({ value: h, label: t(h) }))} />
          </Form.Item>
        </>
      )}
    />
  );
}

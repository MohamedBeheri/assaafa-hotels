import { Form, Input, Select, Tag } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

const statusColors: Record<string, string> = {
  available: "green", occupied: "red", reserved: "gold",
  cleaning: "blue", maintenance: "orange", blocked: "default",
};

export default function Rooms() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: types } = apiHooks.useGetRoomTypesQuery(hotel ? { hotel } : undefined);

  return (
    <CrudTable
      title={t("rooms")}
      searchable
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetRoomsQuery, create: apiHooks.useCreateRoomsMutation,
        update: apiHooks.useUpdateRoomsMutation, remove: apiHooks.useDeleteRoomsMutation,
      }}
      columns={[
        { title: t("roomNumber"), dataIndex: "number" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("type"), dataIndex: "room_type_name" },
        { title: t("price"), dataIndex: "base_price", render: (v: any) => `${v} ر.س` },
        { title: t("status"), dataIndex: "status",
          render: (s: string, r: any) => <Tag color={statusColors[s]}>{r.status_display}</Tag> },
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
        </>
      )}
    />
  );
}

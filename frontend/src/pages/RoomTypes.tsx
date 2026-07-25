import { Form, Input, InputNumber, Select } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

export default function RoomTypes() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("roomTypes")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetRoomTypesQuery, create: apiHooks.useCreateRoomTypesMutation,
        update: apiHooks.useUpdateRoomTypesMutation, remove: apiHooks.useDeleteRoomTypesMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name_ar" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("price"), dataIndex: "base_price", render: (v: any) => `${v} ر.س` },
        { title: "بالغين", dataIndex: "max_adults" },
        { title: "أطفال", dataIndex: "max_children" },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="name_ar" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="EN"><Input /></Form.Item>
          <Form.Item name="base_price" label={t("price")} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="max_adults" label="بالغين" initialValue={2}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="max_children" label="أطفال" initialValue={1}><InputNumber style={{ width: "100%" }} /></Form.Item>
        </>
      )}
    />
  );
}

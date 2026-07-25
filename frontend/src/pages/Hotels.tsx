import { Form, Input, InputNumber } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";

export default function Hotels() {
  const { t } = useTranslation();
  return (
    <CrudTable
      title={t("hotels")}
      hooks={{
        list: apiHooks.useGetHotelsQuery, create: apiHooks.useCreateHotelsMutation,
        update: apiHooks.useUpdateHotelsMutation, remove: apiHooks.useDeleteHotelsMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name_ar" },
        { title: "EN", dataIndex: "name_en" },
        { title: t("code"), dataIndex: "code" },
        { title: "غرف", dataIndex: "rooms_count" },
        { title: "الضريبة%", dataIndex: "vat_rate" },
      ]}
      formFields={() => (
        <>
          <Form.Item name="name_ar" label="الاسم بالعربي" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="الاسم بالإنجليزي" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label={t("code")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label={t("phone")}><Input /></Form.Item>
          <Form.Item name="tax_number" label="الرقم الضريبي"><Input /></Form.Item>
          <Form.Item name="vat_rate" label="نسبة الضريبة %" initialValue={15}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="star_rating" label="النجوم" initialValue={4}><InputNumber min={1} max={7} style={{ width: "100%" }} /></Form.Item>
        </>
      )}
    />
  );
}

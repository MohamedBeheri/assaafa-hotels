import { Form, Input, Select, Tag } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";

const roles = [
  { value: "admin", label: "مدير عام" }, { value: "manager", label: "مدير فندق" },
  { value: "reception", label: "استقبال" }, { value: "housekeeping", label: "تدبير فندقي" },
  { value: "cashier", label: "كاشير" }, { value: "accountant", label: "محاسب" },
  { value: "pos", label: "نقطة بيع" },
];

export default function Users() {
  const { t } = useTranslation();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("users")}
      searchable
      hooks={{
        list: apiHooks.useGetUsersQuery, create: apiHooks.useCreateUsersMutation,
        update: apiHooks.useUpdateUsersMutation, remove: apiHooks.useDeleteUsersMutation,
      }}
      columns={[
        { title: t("username"), dataIndex: "username" },
        { title: t("name"), dataIndex: "full_name" },
        { title: "الدور", dataIndex: "role_display", render: (v: string) => <Tag color="green">{v}</Tag> },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("phone"), dataIndex: "phone" },
      ]}
      formFields={(editing) => (
        <>
          <Form.Item name="username" label={t("username")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="first_name" label="الاسم الأول"><Input /></Form.Item>
          <Form.Item name="last_name" label="اسم العائلة"><Input /></Form.Item>
          <Form.Item name="role" label="الدور" rules={[{ required: true }]}><Select options={roles} /></Form.Item>
          <Form.Item name="hotel" label="الفندق">
            <Select allowClear options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="phone" label={t("phone")}><Input /></Form.Item>
          <Form.Item name="password" label={editing ? "كلمة مرور جديدة (اختياري)" : t("password")}
            rules={editing ? [] : [{ required: true }]}><Input.Password /></Form.Item>
        </>
      )}
    />
  );
}

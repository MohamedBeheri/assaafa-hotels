import { Tabs, Form, Input, InputNumber, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

function Expenses() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: cats } = apiHooks.useGetExpenseCategoriesQuery();
  return (
    <CrudTable
      title={t("expenses")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetExpensesQuery, create: apiHooks.useCreateExpensesMutation,
        update: apiHooks.useUpdateExpensesMutation, remove: apiHooks.useDeleteExpensesMutation,
      }}
      beforeSave={(v) => ({ ...v, paid_at: v.paid_at ? dayjs(v.paid_at).format("YYYY-MM-DD") : undefined })}
      columns={[
        { title: "البند", dataIndex: "category_name" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("amount"), dataIndex: "amount", render: (v: any) => `${v} ر.س` },
        { title: "المورد", dataIndex: "vendor" },
        { title: t("date"), dataIndex: "paid_at" },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="category" label="البند" rules={[{ required: true }]}>
            <Select options={(cats?.results || cats || []).map((c: any) => ({ value: c.id, label: c.name_ar }))} />
          </Form.Item>
          <Form.Item name="amount" label={t("amount")} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="vendor" label="المورد"><Input /></Form.Item>
          <Form.Item name="description" label="الوصف"><Input /></Form.Item>
          <Form.Item name="paid_at" label={t("date")} initialValue={dayjs()}><DatePicker style={{ width: "100%" }} /></Form.Item>
        </>
      )}
    />
  );
}

function Employees() {
  const { t } = useTranslation();
  const { data: users } = apiHooks.useGetUsersQuery();
  return (
    <CrudTable
      title={t("employees")}
      hooks={{
        list: apiHooks.useGetEmployeesQuery, create: apiHooks.useCreateEmployeesMutation,
        update: apiHooks.useUpdateEmployeesMutation, remove: apiHooks.useDeleteEmployeesMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "user_name" },
        { title: "المسمى", dataIndex: "job_title" },
        { title: "الأساسي", dataIndex: "base_salary", render: (v: any) => `${v} ر.س` },
      ]}
      formFields={() => (
        <>
          <Form.Item name="user" label="المستخدم" rules={[{ required: true }]}>
            <Select options={(users?.results || []).map((u: any) => ({ value: u.id, label: u.full_name }))} />
          </Form.Item>
          <Form.Item name="job_title" label="المسمى الوظيفي"><Input /></Form.Item>
          <Form.Item name="base_salary" label="الراتب الأساسي" initialValue={0}><InputNumber style={{ width: "100%" }} /></Form.Item>
        </>
      )}
    />
  );
}

export default function Finance() {
  const { t } = useTranslation();
  return (
    <Tabs items={[
      { key: "exp", label: t("expenses"), children: <Expenses /> },
      { key: "emp", label: t("employees"), children: <Employees /> },
    ]} />
  );
}

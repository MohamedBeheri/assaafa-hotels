import { Form, Input, InputNumber, Select, Tag, Switch } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";

const KINDS = [
  { value: "company", label: "شركة" },
  { value: "travel_agent", label: "وكيل سياحة" },
];

export default function Companies() {
  const { t } = useTranslation();
  return (
    <CrudTable
      title={t("companies")}
      searchable
      hooks={{
        list: apiHooks.useGetCompaniesQuery, create: apiHooks.useCreateCompaniesMutation,
        update: apiHooks.useUpdateCompaniesMutation, remove: apiHooks.useDeleteCompaniesMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name",
          render: (v: string, r: any) => (
            <span>{v}{r.kind === "travel_agent"
              ? <Tag color="purple" style={{ marginInlineStart: 6 }}>وكيل</Tag>
              : <Tag color="blue" style={{ marginInlineStart: 6 }}>شركة</Tag>}</span>
          ) },
        { title: "الرقم الضريبي", dataIndex: "tax_number" },
        { title: t("phone"), dataIndex: "phone" },
        { title: "خصم%", dataIndex: "discount_pct", render: (v: any) => v > 0 ? `${v}%` : "—" },
        { title: "عمولة%", dataIndex: "commission_pct", render: (v: any) => v > 0 ? `${v}%` : "—" },
        { title: "حد الائتمان", dataIndex: "credit_limit", render: (v: any) => `${Number(v).toLocaleString()} ر.س` },
        { title: t("balance"), dataIndex: "outstanding",
          render: (v: any) => <b style={{ color: v > 0 ? "#C0392B" : "#6FA23C" }}>{Number(v).toLocaleString()} ر.س</b> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="kind" label="النوع" initialValue="company" rules={[{ required: true }]}>
            <Select options={KINDS} />
          </Form.Item>
          <Form.Item name="name" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact_person" label="مسؤول التواصل"><Input /></Form.Item>
          <Form.Item name="phone" label={t("phone")}><Input /></Form.Item>
          <Form.Item name="email" label="البريد"><Input /></Form.Item>
          <Form.Item name="tax_number" label="الرقم الضريبي"><Input /></Form.Item>
          <Form.Item name="credit_limit" label="حد الائتمان" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="discount_pct" label="خصم متفق %" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} max={100} /></Form.Item>
          <Form.Item name="commission_pct" label="عمولة الوكيل %" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} max={100} /></Form.Item>
          <Form.Item name="payment_terms_days" label="مدة السداد (يوم)" initialValue={30}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

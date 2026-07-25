import { Form, Input, InputNumber, Select, Tag, Switch } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";

const CATS = [
  { value: "room", label: "إقامة" }, { value: "fnb", label: "مأكولات ومشروبات" },
  { value: "service", label: "خدمات" }, { value: "tax", label: "ضرائب" },
  { value: "other", label: "أخرى" },
];
const catColor: Record<string, string> = { room: "green", fnb: "gold", service: "blue", tax: "red", other: "default" };

export default function TransactionCodes() {
  const { t } = useTranslation();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("transactionCodes")}
      searchable
      hooks={{
        list: apiHooks.useGetTransactionCodesQuery, create: apiHooks.useCreateTransactionCodesMutation,
        update: apiHooks.useUpdateTransactionCodesMutation, remove: apiHooks.useDeleteTransactionCodesMutation,
      }}
      columns={[
        { title: "الكود", dataIndex: "code", render: (v: string) => <Tag color="geekblue" style={{ fontFamily: "monospace", fontSize: 13 }}>{v}</Tag> },
        { title: t("name"), dataIndex: "name_ar" },
        { title: "EN", dataIndex: "name_en" },
        { title: "التصنيف", dataIndex: "category", render: (c: string, r: any) => <Tag color={catColor[c]}>{r.category_display}</Tag> },
        { title: "السعر الافتراضي", dataIndex: "default_price", render: (v: any) => v > 0 ? `${v} ر.س` : "—" },
        { title: t("status"), dataIndex: "is_active", render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "نشط" : "موقوف"}</Tag> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="code" label="الكود" rules={[{ required: true }]}><Input placeholder="مثال: 2000" /></Form.Item>
          <Form.Item name="name_ar" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="الاسم (EN)"><Input /></Form.Item>
          <Form.Item name="category" label="التصنيف" initialValue="other" rules={[{ required: true }]}>
            <Select options={CATS} />
          </Form.Item>
          <Form.Item name="default_price" label="السعر الافتراضي" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="hotel" label="الفندق (فارغ = الكل)">
            <Select allowClear options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

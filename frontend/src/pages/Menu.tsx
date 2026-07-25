import { Tabs, Form, Input, InputNumber, Select, Switch, Tag } from "antd";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

function Products() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: cats } = apiHooks.useGetCategoriesQuery(hotel ? { hotel } : undefined);
  return (
    <CrudTable
      title={t("products")}
      searchable
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetProductsQuery, create: apiHooks.useCreateProductsMutation,
        update: apiHooks.useUpdateProductsMutation, remove: apiHooks.useDeleteProductsMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name_ar" },
        { title: "EN", dataIndex: "name_en" },
        { title: t("category"), dataIndex: "category_name" },
        { title: "الباركود", dataIndex: "sku" },
        { title: t("price"), dataIndex: "price", render: (v: any) => <b>{v} ر.س</b> },
        { title: t("status"), dataIndex: "is_active",
          render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "نشط" : "موقوف"}</Tag> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="category" label={t("category")} rules={[{ required: true }]}>
            <Select options={(cats?.results || []).map((c: any) => ({ value: c.id, label: c.name_ar }))} />
          </Form.Item>
          <Form.Item name="name_ar" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="الاسم (EN)"><Input /></Form.Item>
          <Form.Item name="sku" label="الباركود/الكود"><Input /></Form.Item>
          <Form.Item name="price" label={t("price")} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

function Categories() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("categories")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetCategoriesQuery, create: apiHooks.useCreateCategoriesMutation,
        update: apiHooks.useUpdateCategoriesMutation, remove: apiHooks.useDeleteCategoriesMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name_ar" },
        { title: "EN", dataIndex: "name_en" },
        { title: "الفندق", dataIndex: "hotel",
          render: (v: number) => { const h = (hotels?.results || []).find((x: any) => x.id === v); return h?.name_ar; } },
        { title: "الترتيب", dataIndex: "sort" },
        { title: t("status"), dataIndex: "is_active",
          render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "نشط" : "موقوف"}</Tag> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="name_ar" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="الاسم (EN)"><Input /></Form.Item>
          <Form.Item name="sort" label="الترتيب" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

export default function Menu() {
  const { t } = useTranslation();
  return (
    <Tabs items={[
      { key: "prod", label: t("products"), children: <Products /> },
      { key: "cat", label: t("categories"), children: <Categories /> },
    ]} />
  );
}

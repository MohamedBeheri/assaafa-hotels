import { Tabs, Form, Input, InputNumber, Select, DatePicker, Tag, Switch } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

function SeasonalRates() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: types } = apiHooks.useGetRoomTypesQuery(hotel ? { hotel } : undefined);
  return (
    <CrudTable
      title={t("seasonalRates")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetSeasonalRatesQuery, create: apiHooks.useCreateSeasonalRatesMutation,
        update: apiHooks.useUpdateSeasonalRatesMutation, remove: apiHooks.useDeleteSeasonalRatesMutation,
      }}
      beforeSave={(v) => ({
        ...v,
        start_date: v.start_date ? dayjs(v.start_date).format("YYYY-MM-DD") : undefined,
        end_date: v.end_date ? dayjs(v.end_date).format("YYYY-MM-DD") : undefined,
      })}
      columns={[
        { title: t("season"), dataIndex: "name" },
        { title: t("type"), dataIndex: "room_type_name" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("from"), dataIndex: "start_date" },
        { title: t("to"), dataIndex: "end_date" },
        { title: t("rate"), dataIndex: "price", render: (v: any) => <b>{v} ر.س</b> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="room_type" label={t("type")} rules={[{ required: true }]}>
            <Select options={(types?.results || []).map((rt: any) => ({ value: rt.id, label: `${rt.name_ar} - ${rt.hotel_name}` }))} />
          </Form.Item>
          <Form.Item name="name" label={t("season")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="start_date" label={t("from")} rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="end_date" label={t("to")} rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="price" label={t("rate")} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
        </>
      )}
    />
  );
}

function Services() {
  const { t } = useTranslation();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("services")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetServicesQuery, create: apiHooks.useCreateServicesMutation,
        update: apiHooks.useUpdateServicesMutation, remove: apiHooks.useDeleteServicesMutation,
      }}
      columns={[
        { title: t("name"), dataIndex: "name_ar" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("price"), dataIndex: "price", render: (v: any) => `${v} ر.س` },
        { title: t("status"), dataIndex: "is_active",
          render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "نشط" : "موقوف"}</Tag> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="name_ar" label={t("name")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name_en" label="EN"><Input /></Form.Item>
          <Form.Item name="price" label={t("price")} rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

function Coupons() {
  const { t } = useTranslation();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  return (
    <CrudTable
      title={t("coupons")}
      hooks={{
        list: apiHooks.useGetCouponsQuery, create: apiHooks.useCreateCouponsMutation,
        update: apiHooks.useUpdateCouponsMutation, remove: apiHooks.useDeleteCouponsMutation,
      }}
      beforeSave={(v) => ({
        ...v,
        valid_from: v.valid_from ? dayjs(v.valid_from).format("YYYY-MM-DD") : null,
        valid_to: v.valid_to ? dayjs(v.valid_to).format("YYYY-MM-DD") : null,
      })}
      columns={[
        { title: t("couponCode"), dataIndex: "code", render: (v: string) => <Tag color="gold">{v}</Tag> },
        { title: t("type"), dataIndex: "kind_display" },
        { title: "القيمة", dataIndex: "value",
          render: (v: any, r: any) => r.kind === "percent" ? `${v}%` : `${v} ر.س` },
        { title: "حتى", dataIndex: "valid_to" },
        { title: "استُخدم", dataIndex: "used_count",
          render: (v: number, r: any) => `${v}${r.max_uses ? " / " + r.max_uses : ""}` },
        { title: t("status"), dataIndex: "is_active",
          render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "نشط" : "موقوف"}</Tag> },
      ]}
      formFields={() => (
        <>
          <Form.Item name="code" label={t("couponCode")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="kind" label={t("type")} initialValue="percent">
            <Select options={[{ value: "percent", label: "نسبة %" }, { value: "fixed", label: "مبلغ ثابت" }]} />
          </Form.Item>
          <Form.Item name="value" label="القيمة" rules={[{ required: true }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="hotel" label="الفندق (فارغ = الكل)">
            <Select allowClear options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="valid_to" label="صالح حتى"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="max_uses" label="أقصى استخدام (0 = بلا حد)" initialValue={0}><InputNumber style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="is_active" label="نشط" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </>
      )}
    />
  );
}

export default function Pricing() {
  const { t } = useTranslation();
  return (
    <Tabs items={[
      { key: "rates", label: t("seasonalRates"), children: <SeasonalRates /> },
      { key: "services", label: t("services"), children: <Services /> },
      { key: "coupons", label: t("coupons"), children: <Coupons /> },
    ]} />
  );
}

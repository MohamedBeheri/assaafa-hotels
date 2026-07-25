import React from "react";
import {
  Form, Input, Select, Tag, Switch, Drawer, Descriptions, Divider, Button,
  Upload, Image, Empty, App as AntApp, Space,
} from "antd";
import { FolderOpenOutlined, UploadOutlined, DeleteOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";

const ID_TYPES = [
  { value: "national_id", label: "هوية وطنية" },
  { value: "iqama", label: "إقامة" },
  { value: "passport", label: "جواز سفر عادي" },
  { value: "passport_diplomatic", label: "جواز سفر دبلوماسي" },
  { value: "passport_mission", label: "جواز سفر مهام" },
];
const DOC_KINDS = [
  { value: "id", label: "هوية/إقامة" },
  { value: "passport", label: "جواز سفر" },
  { value: "visa", label: "تأشيرة" },
  { value: "other", label: "أخرى" },
];

function GuestFileDrawer({ guest, onClose }: { guest: any; onClose: () => void }) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { data } = apiHooks.useGetGuestsQuery({ search: guest.phone });
  const current = (data?.results || []).find((g: any) => g.id === guest.id) || guest;
  const [createDoc] = apiHooks.useCreateGuestDocumentsMutation();
  const [deleteDoc] = apiHooks.useDeleteGuestDocumentsMutation();
  const [kind, setKind] = React.useState("id");

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("guest", String(current.id));
    fd.append("kind", kind);
    fd.append("file", file);
    try { await createDoc(fd).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ في الرفع"); }
    return false;
  };

  return (
    <Drawer open onClose={onClose} width={520} title={<><FolderOpenOutlined /> {t("guestFile")} — {current.full_name}</>}>
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label={t("name")} span={2}>{current.full_name}</Descriptions.Item>
        <Descriptions.Item label={t("phone")}>{current.phone}</Descriptions.Item>
        <Descriptions.Item label="الجنسية">{current.nationality}</Descriptions.Item>
        <Descriptions.Item label="نوع الإثبات">{current.id_type_display}</Descriptions.Item>
        <Descriptions.Item label="رقم الإثبات">{current.id_number}</Descriptions.Item>
        <Descriptions.Item label="البريد" span={2}>{current.email || "—"}</Descriptions.Item>
        <Descriptions.Item label="حجوزات">{current.reservations_count}</Descriptions.Item>
        <Descriptions.Item label="VIP">{current.is_vip ? <Tag color="gold">VIP</Tag> : "—"}</Descriptions.Item>
      </Descriptions>

      <Divider>{t("documents")} ({current.documents?.length || 0})</Divider>
      <Space style={{ marginBottom: 14 }}>
        <Select value={kind} onChange={setKind} style={{ width: 150 }} options={DOC_KINDS} />
        <Upload showUploadList={false} beforeUpload={(f) => upload(f) as any}>
          <Button type="primary" icon={<UploadOutlined />}>{t("uploadDoc")}</Button>
        </Upload>
      </Space>

      {current.documents?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {current.documents.map((d: any) => {
            const isPdf = d.file?.toLowerCase().endsWith(".pdf");
            return (
              <div key={d.id} style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
                {isPdf ? (
                  <a href={d.file} target="_blank" rel="noreferrer"
                    style={{ height: 120, display: "grid", placeItems: "center", background: "#FAF8F2" }}>
                    <FilePdfOutlined style={{ fontSize: 36, color: "#C0392B" }} />
                  </a>
                ) : (
                  <Image src={d.file} height={120} width="100%" style={{ objectFit: "cover" }} />
                )}
                <div style={{ padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Tag>{d.kind_display}</Tag>
                    <div style={{ fontSize: 11, color: "#999" }}>{d.uploaded_at?.slice(0, 10)}</div>
                  </div>
                  <Button size="small" danger icon={<DeleteOutlined />}
                    onClick={async () => { await deleteDoc(d.id); message.success(t("deleted")); }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty description={t("documents")} />}
    </Drawer>
  );
}

export default function Guests() {
  const { t } = useTranslation();
  const [fileGuest, setFileGuest] = React.useState<any>(null);
  return (
    <>
      <CrudTable
        title={t("guests")}
        searchable
        hooks={{
          list: apiHooks.useGetGuestsQuery, create: apiHooks.useCreateGuestsMutation,
          update: apiHooks.useUpdateGuestsMutation, remove: apiHooks.useDeleteGuestsMutation,
        }}
        columns={[
          { title: t("name"), dataIndex: "full_name" },
          { title: "الجنسية", dataIndex: "nationality" },
          { title: "الإثبات", dataIndex: "id_type_display",
            render: (v: string, r: any) => <span>{v}<div style={{ fontSize: 11, color: "#999" }} dir="ltr">{r.id_number}</div></span> },
          { title: t("phone"), dataIndex: "phone" },
          { title: "مستندات", dataIndex: "documents",
            render: (docs: any[], r: any) => (
              <Button size="small" icon={<FolderOpenOutlined />} onClick={() => setFileGuest(r)}>
                {docs?.length || 0}
              </Button>
            ) },
          { title: "VIP", dataIndex: "is_vip", render: (v: boolean) => v ? <Tag color="gold">VIP</Tag> : null },
        ]}
        formFields={() => (
          <>
            <Form.Item name="first_name" label="الاسم الأول" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="last_name" label="اسم العائلة"><Input /></Form.Item>
            <Form.Item name="nationality" label="الجنسية" initialValue="السعودية" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="id_type" label="نوع إثبات الهوية" initialValue="national_id" rules={[{ required: true }]}>
              <Select options={ID_TYPES} />
            </Form.Item>
            <Form.Item name="id_number" label="رقم الإثبات" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="phone" label={t("phone")} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="البريد"><Input /></Form.Item>
            <Form.Item name="is_vip" label="VIP" valuePropName="checked"><Switch /></Form.Item>
          </>
        )}
      />
      {fileGuest && <GuestFileDrawer guest={fileGuest} onClose={() => setFileGuest(null)} />}
    </>
  );
}

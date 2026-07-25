import React from "react";
import { Table, Button, Space, Modal, Form, Popconfirm, Card, Input, App as AntApp } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface CrudProps {
  title: string;
  columns: any[];
  hooks: { list: any; create: any; update: any; remove: any };
  formFields: (editing: any) => React.ReactNode;
  params?: Record<string, any>;
  searchable?: boolean;
  beforeSave?: (v: any) => any;
  extra?: React.ReactNode;
}

export default function CrudTable({ title, columns, hooks, formFields, params, searchable, beforeSave, extra }: CrudProps) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [search, setSearch] = React.useState("");
  const q = { ...(params || {}), ...(search ? { search } : {}) };
  const { data, isFetching } = hooks.list(q);
  const [create] = hooks.create();
  const [update] = hooks.update();
  const [remove] = hooks.remove();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form] = Form.useForm();

  const onAdd = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const onEdit = (r: any) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };
  const onSave = async () => {
    const raw = await form.validateFields();
    const v = beforeSave ? beforeSave(raw) : raw;
    try {
      if (editing) await update({ id: editing.id, ...v }).unwrap();
      else await create(v).unwrap();
      message.success(t("saved"));
      setOpen(false);
    } catch (e: any) {
      message.error(JSON.stringify(e?.data || "error"));
    }
  };

  const cols = [
    ...columns,
    {
      title: t("actions"), width: 120, render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
          <Popconfirm title={t("confirmDelete")} onConfirm={async () => { await remove(r.id); message.success(t("deleted")); }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={title}
      extra={<Space>
        {searchable && <Input.Search allowClear placeholder={t("search")} onSearch={setSearch} style={{ width: 200 }} />}
        {extra}
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>{t("add")}</Button>
      </Space>}
    >
      <Table rowKey="id" loading={isFetching} dataSource={data?.results || data || []}
        columns={cols} scroll={{ x: true }} />
      <Modal open={open} title={title} onCancel={() => setOpen(false)} onOk={onSave} destroyOnClose>
        <Form form={form} layout="vertical">{formFields(editing)}</Form>
      </Modal>
    </Card>
  );
}

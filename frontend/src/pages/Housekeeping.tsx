import React from "react";
import { Tabs, Form, Input, Select, Tag, Button, App as AntApp } from "antd";
import { CheckOutlined, PlayCircleOutlined, ToolOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import CrudTable from "../components/CrudTable";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

const hkStatus: Record<string, string> = { pending: "gold", in_progress: "blue", done: "green" };
const mPriority: Record<string, string> = { low: "default", medium: "blue", high: "orange", urgent: "red" };
const mStatus: Record<string, string> = { open: "red", in_progress: "blue", resolved: "green" };

function Tasks() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: rooms } = apiHooks.useGetRoomsQuery(hotel ? { hotel } : undefined);
  const { data: users } = apiHooks.useGetUsersQuery();
  const [act] = apiHooks.useHousekeepingActionMutation();
  // إعادة جلب القائمة بعد الأكشن
  const [refresh, setRefresh] = React.useState(0);

  const doAct = async (id: number, action: string) => {
    try { await act({ id, action }).unwrap(); message.success(t("saved")); setRefresh(r => r + 1); }
    catch { message.error("خطأ"); }
  };

  return (
    <CrudTable
      key={refresh}
      title={t("housekeeping")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetHousekeepingQuery, create: apiHooks.useCreateHousekeepingMutation,
        update: apiHooks.useUpdateHousekeepingMutation, remove: apiHooks.useDeleteHousekeepingMutation,
      }}
      columns={[
        { title: t("roomNumber"), dataIndex: "room_number" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("taskType"), dataIndex: "task_type_display" },
        { title: t("assignedTo"), dataIndex: "assigned_to_name" },
        { title: t("status"), dataIndex: "status",
          render: (s: string, r: any) => <Tag color={hkStatus[s]}>{r.status_display}</Tag> },
        { title: "", width: 160, render: (_: any, r: any) => (
          <>
            {r.status === "pending" &&
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => doAct(r.id, "start")}>{t("start")}</Button>}
            {r.status !== "done" &&
              <Button size="small" type="primary" icon={<CheckOutlined />} style={{ marginInlineStart: 6 }}
                onClick={() => doAct(r.id, "complete")}>{t("complete")}</Button>}
          </>
        ) },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="room" label={t("room")} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={(rooms?.results || []).map((r: any) => ({ value: r.id, label: `${r.number} - ${r.hotel_name}` }))} />
          </Form.Item>
          <Form.Item name="task_type" label={t("taskType")} initialValue="cleaning">
            <Select options={[
              { value: "cleaning", label: "تنظيف" }, { value: "deep_clean", label: "تنظيف شامل" },
              { value: "laundry", label: "غسيل ومفروشات" }, { value: "inspection", label: "تفتيش" }]} />
          </Form.Item>
          <Form.Item name="assigned_to" label={t("assignedTo")}>
            <Select allowClear options={(users?.results || []).map((u: any) => ({ value: u.id, label: u.full_name }))} />
          </Form.Item>
          <Form.Item name="notes" label="ملاحظات"><Input /></Form.Item>
        </>
      )}
    />
  );
}

function Maintenance() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const { data: rooms } = apiHooks.useGetRoomsQuery(hotel ? { hotel } : undefined);
  const [act] = apiHooks.useMaintenanceActionMutation();
  const [refresh, setRefresh] = React.useState(0);

  const doResolve = async (id: number) => {
    try { await act({ id, action: "resolve" }).unwrap(); message.success(t("saved")); setRefresh(r => r + 1); }
    catch { message.error("خطأ"); }
  };

  return (
    <CrudTable
      key={refresh}
      title={t("maintenance")}
      params={hotel ? { hotel } : undefined}
      hooks={{
        list: apiHooks.useGetMaintenanceQuery, create: apiHooks.useCreateMaintenanceMutation,
        update: apiHooks.useUpdateMaintenanceMutation, remove: apiHooks.useDeleteMaintenanceMutation,
      }}
      columns={[
        { title: "العطل", dataIndex: "title" },
        { title: t("roomNumber"), dataIndex: "room_number" },
        { title: "الفندق", dataIndex: "hotel_name" },
        { title: t("priority"), dataIndex: "priority",
          render: (p: string, r: any) => <Tag color={mPriority[p]}>{r.priority_display}</Tag> },
        { title: t("status"), dataIndex: "status",
          render: (s: string, r: any) => <Tag color={mStatus[s]}>{r.status_display}</Tag> },
        { title: "", width: 130, render: (_: any, r: any) => (
          r.status !== "resolved" &&
            <Button size="small" type="primary" icon={<ToolOutlined />} onClick={() => doResolve(r.id)}>{t("resolve")}</Button>
        ) },
      ]}
      formFields={() => (
        <>
          <Form.Item name="hotel" label="الفندق" rules={[{ required: true }]}>
            <Select options={(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))} />
          </Form.Item>
          <Form.Item name="room" label={t("room")}>
            <Select allowClear showSearch optionFilterProp="label"
              options={(rooms?.results || []).map((r: any) => ({ value: r.id, label: `${r.number} - ${r.hotel_name}` }))} />
          </Form.Item>
          <Form.Item name="title" label="العطل" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="priority" label={t("priority")} initialValue="medium">
            <Select options={[
              { value: "low", label: "منخفضة" }, { value: "medium", label: "متوسطة" },
              { value: "high", label: "عالية" }, { value: "urgent", label: "عاجلة" }]} />
          </Form.Item>
          <Form.Item name="description" label="التفاصيل"><Input.TextArea rows={2} /></Form.Item>
        </>
      )}
    />
  );
}

export default function Housekeeping() {
  const { t } = useTranslation();
  return (
    <Tabs items={[
      { key: "hk", label: t("housekeeping"), children: <Tasks /> },
      { key: "mnt", label: t("maintenance"), children: <Maintenance /> },
    ]} />
  );
}

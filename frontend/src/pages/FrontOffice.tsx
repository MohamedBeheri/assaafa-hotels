import React from "react";
import { Card, Tabs, Table, Button, Tag, Space, Badge, Empty, App as AntApp } from "antd";
import {
  LoginOutlined, LogoutOutlined, CrownOutlined, HomeOutlined, ThunderboltOutlined, PrinterOutlined,
} from "@ant-design/icons";
import { printRegCard } from "../components/printRegCard";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";

function GuestCell(r: any) {
  return (
    <div>
      <div style={{ fontWeight: 600 }}>
        {r.is_vip && <CrownOutlined style={{ color: BRAND.gold, marginInlineEnd: 5 }} />}
        {r.guest}
      </div>
      <div style={{ fontSize: 12, color: "#8c8c8c" }} dir="ltr">{r.phone} · {r.nationality}</div>
    </div>
  );
}
function RoomsCell(rooms: any[]) {
  return <Space wrap>{(rooms || []).map((rm, i) => (
    <Tag key={i} icon={<HomeOutlined />} color="green">{rm.number}</Tag>
  ))}</Space>;
}

export default function FrontOffice() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { hotel } = useApp();
  const params = hotel ? { hotel } : undefined;
  const { data, isFetching } = apiHooks.useFrontOfficeQuery(params, { pollingInterval: 60000 });
  const [act] = apiHooks.useReservationActionMutation();

  const doAction = async (id: number, action: string) => {
    try { await act({ id, action }).unwrap(); message.success(t("saved")); }
    catch { message.error("خطأ"); }
  };

  const guestsCol = { title: t("guest"), render: (_: any, r: any) => GuestCell(r) };
  const roomsCol = { title: t("rooms"), dataIndex: "rooms", render: RoomsCell };
  const stayCol = {
    title: `${t("checkIn")} → ${t("checkOut")}`, render: (_: any, r: any) => (
      <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{r.check_in} → {r.check_out}</span>
    ),
  };
  const guestsInfo = {
    title: t("dGuests"), render: (_: any, r: any) => `${r.adults} ${t("adults")} + ${r.children} ${t("children")}`,
  };
  const balanceCol = {
    title: t("balance"), dataIndex: "balance",
    render: (v: number | null) => v == null ? "—" :
      <b style={{ color: v > 0 ? "#C0392B" : "#6FA23C" }}>{v.toLocaleString()} ر.س</b>,
  };

  const arrivalsCols = [
    { title: t("code"), dataIndex: "code",
      render: (v: string, r: any) => r.source === "online" ? <Tag color="gold">{v}</Tag> : v },
    guestsCol, roomsCol, stayCol, guestsInfo,
    { title: t("status"), dataIndex: "status_display", render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: t("actions"), render: (_: any, r: any) => (
      <Space>
        <Button type="primary" size="small" icon={<LoginOutlined />}
          onClick={() => doAction(r.id, "check_in")}>{t("checkInAction")}</Button>
        <Button size="small" icon={<PrinterOutlined />} onClick={() => printRegCard(r)}>{t("regCard")}</Button>
      </Space>
    ) },
  ];
  const inHouseCols = [
    { title: t("code"), dataIndex: "code" }, guestsCol, roomsCol, stayCol, guestsInfo, balanceCol,
    { title: t("actions"), render: (_: any, r: any) => (
      <Space>
        <Button size="small" icon={<LogoutOutlined />}
          onClick={() => doAction(r.id, "check_out")}>{t("checkOutAction")}</Button>
        <Button size="small" icon={<PrinterOutlined />} onClick={() => printRegCard(r)}>{t("regCard")}</Button>
      </Space>
    ) },
  ];
  const departuresCols = [
    { title: t("code"), dataIndex: "code" }, guestsCol, roomsCol, stayCol, balanceCol,
    { title: t("actions"), render: (_: any, r: any) => (
      <Button type="primary" size="small" icon={<LogoutOutlined />}
        onClick={() => doAction(r.id, "check_out")}>{t("checkOutAction")}</Button>
    ) },
  ];

  const c = data?.counts || { arrivals: 0, in_house: 0, departures: 0 };
  const tab = (label: string, count: number, color: string) => (
    <span>{label} <Badge count={count} showZero color={color} style={{ marginInlineStart: 4 }} /></span>
  );

  return (
    <Card
      title={<><ThunderboltOutlined style={{ color: BRAND.green, marginInlineEnd: 8 }} />{t("frontOffice")}
        <span style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400, marginInlineStart: 10 }} dir="ltr">{data?.date}</span></>}>
      <Tabs
        items={[
          { key: "arr", label: tab(t("arrivalsToday"), c.arrivals, "#4A90D9"),
            children: data?.arrivals?.length
              ? <Table rowKey="id" childrenColumnName="_sr" loading={isFetching} dataSource={data.arrivals} columns={arrivalsCols} pagination={false} scroll={{ x: true }} />
              : <Empty description={t("arrivalsToday")} /> },
          { key: "inh", label: tab(t("inHouse"), c.in_house, BRAND.green),
            children: data?.in_house?.length
              ? <Table rowKey="id" childrenColumnName="_sr" loading={isFetching} dataSource={data.in_house} columns={inHouseCols} pagination={false} scroll={{ x: true }} />
              : <Empty description={t("inHouse")} /> },
          { key: "dep", label: tab(t("departuresToday"), c.departures, "#E67E22"),
            children: data?.departures?.length
              ? <Table rowKey="id" childrenColumnName="_sr" loading={isFetching} dataSource={data.departures} columns={departuresCols} pagination={false} scroll={{ x: true }} />
              : <Empty description={t("departuresToday")} /> },
        ]} />
    </Card>
  );
}

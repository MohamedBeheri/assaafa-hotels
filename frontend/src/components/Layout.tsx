import React from "react";
import { Layout, Menu, Select, Button, Dropdown, Avatar, Typography } from "antd";
import {
  DashboardOutlined, BankOutlined, HomeOutlined, TeamOutlined, CalendarOutlined,
  FileTextOutlined, ShoppingCartOutlined, DollarOutlined, UserOutlined,
  GlobalOutlined, LogoutOutlined, AppstoreOutlined, TableOutlined,
  ClearOutlined, TagsOutlined, BarChartOutlined, CoffeeOutlined, CompassOutlined,
  ThunderboltOutlined, MoonOutlined, SearchOutlined, ShopOutlined, AccountBookOutlined, UsergroupAddOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";
import { BRAND } from "../theme";
import CommandBar from "./CommandBar";

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const loc = useLocation();
  const { user, setUser, hotel, setHotel } = useApp();
  const { data: hotels } = apiHooks.useGetHotelsQuery();
  const isAdmin = user?.role === "admin";

  const items = [
    { key: "/", icon: <DashboardOutlined />, label: t("dashboard") },
    { key: "/front-office", icon: <ThunderboltOutlined />, label: t("frontOffice") },
    { key: "/calendar", icon: <TableOutlined />, label: t("calendar") },
    { key: "/reservations", icon: <CalendarOutlined />, label: t("reservations") },
    { key: "/night-audit", icon: <MoonOutlined />, label: t("nightAudit") },
    { key: "/group-blocks", icon: <UsergroupAddOutlined />, label: t("groupBlocks") },
    { key: "/rooms", icon: <HomeOutlined />, label: t("rooms") },
    { key: "/guests", icon: <TeamOutlined />, label: t("guests") },
    { key: "/invoices", icon: <FileTextOutlined />, label: t("invoices") },
    { key: "/companies", icon: <ShopOutlined />, label: t("companies") },
    { key: "/accounts-receivable", icon: <AccountBookOutlined />, label: t("accountsReceivable") },
    { key: "/pos", icon: <ShoppingCartOutlined />, label: t("pos") },
    { key: "/menu", icon: <CoffeeOutlined />, label: t("menuMgmt") },
    { key: "/housekeeping", icon: <ClearOutlined />, label: t("housekeeping") },
    { key: "/pricing", icon: <TagsOutlined />, label: t("pricing") },
    { key: "/reports", icon: <BarChartOutlined />, label: t("analytics") },
    { key: "/finance", icon: <DollarOutlined />, label: t("finance") },
    { key: "/hotels", icon: <BankOutlined />, label: t("hotels") },
    { key: "/room-types", icon: <AppstoreOutlined />, label: t("roomTypes") },
    ...(isAdmin ? [{ key: "/users", icon: <UserOutlined />, label: t("users") }] : []),
  ];

  const toggleLang = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  // شريط الأوامر العالمي ⌘K / Ctrl+K
  const [cmdOpen, setCmdOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <Sider theme="light" width={230} breakpoint="lg" collapsedWidth={0}
        style={{ boxShadow: "0 0 20px rgba(0,0,0,.06)", display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh" }}>
        <div className="logo-box" style={{ padding: "18px 20px" }}>
          <img src="/logo.svg" width={34} alt="logo" />
          <div>
            <div style={{ fontWeight: 800, color: BRAND.greenDark, lineHeight: 1.1 }}>{t("app")}</div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Management</Typography.Text>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Menu mode="inline" selectedKeys={[loc.pathname]} items={items}
            onClick={(e) => nav(e.key)} style={{ borderInlineEnd: 0 }} />
        </div>
        {/* رابط موقع العميل — منفصل بشكل جمالي */}
        <a href="/site" target="_blank" rel="noopener noreferrer" className="guest-site-link">
          <div className="gsl-icon"><CompassOutlined /></div>
          <div className="gsl-text">
            <b>{t("guestSite")}</b>
            <span>{t("openSite")}</span>
          </div>
          <GlobalOutlined className="gsl-arrow" />
        </a>
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Select
              value={hotel ?? "all"}
              style={{ minWidth: 190 }}
              onChange={(v) => setHotel(v === "all" ? null : Number(v))}
              options={[{ value: "all", label: t("allHotels") },
                ...(hotels?.results || []).map((h: any) => ({ value: h.id, label: h.name_ar }))]}
            />
            <Button icon={<SearchOutlined />} onClick={() => setCmdOpen(true)}
              style={{ color: "#8c8c8c" }}>
              {t("commandHint")}
              <kbd style={{ background: "#f4f1ea", borderRadius: 5, padding: "1px 6px", fontSize: 11, marginInlineStart: 8 }}>⌘K</kbd>
            </Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button icon={<GlobalOutlined />} onClick={toggleLang}>{t("language")}</Button>
            <Dropdown menu={{ items: [{ key: "out", icon: <LogoutOutlined />, label: t("logout"), onClick: logout }] }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <Avatar style={{ background: BRAND.green }}>{user?.full_name?.[0]}</Avatar>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user?.role_display}</Typography.Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 20 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

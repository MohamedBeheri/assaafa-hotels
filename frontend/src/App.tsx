import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { App as AntApp } from "antd";
import { AppContext, AppUser } from "./app/context";
import Login from "./pages/Login";
import AppLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import Invoices from "./pages/Invoices";
import POS from "./pages/POS";
import Finance from "./pages/Finance";
import Hotels from "./pages/Hotels";
import RoomTypes from "./pages/RoomTypes";
import Users from "./pages/Users";
import CalendarPage from "./pages/Calendar";
import Housekeeping from "./pages/Housekeeping";
import Pricing from "./pages/Pricing";
import Reports from "./pages/Reports";
import Menu from "./pages/Menu";
import FrontOffice from "./pages/FrontOffice";
import NightAudit from "./pages/NightAudit";
import Companies from "./pages/Companies";
import AccountsReceivable from "./pages/AccountsReceivable";
import PublicSite from "./site/PublicSite";

export default function App() {
  const [user, setUser] = React.useState<AppUser | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [hotel, setHotel] = React.useState<number | null>(null);
  const loc = useLocation();

  // الموقع العام للنزلاء — بدون تسجيل دخول (رئيسية + صفحات + حجز)
  if (loc.pathname.startsWith("/site") || loc.pathname.startsWith("/book")) return <PublicSite />;

  return (
    <AntApp>
      <AppContext.Provider value={{ user, setUser, hotel, setHotel }}>
        {!user ? (
          <Login />
        ) : (
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/front-office" element={<FrontOffice />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/night-audit" element={<NightAudit />} />
              <Route path="/housekeeping" element={<Housekeeping />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/accounts-receivable" element={<AccountsReceivable />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/room-types" element={<RoomTypes />} />
              <Route path="/users" element={<Users />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AppLayout>
        )}
      </AppContext.Provider>
    </AntApp>
  );
}

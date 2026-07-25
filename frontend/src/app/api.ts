import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: (import.meta.env.VITE_API_URL || "http://127.0.0.1:8020/api").replace(/\/?$/, "/"),
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("access");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const TAGS = ["Hotel", "Room", "RoomType", "Guest", "Reservation", "Invoice",
  "Payment", "Product", "Category", "Order", "Expense", "Employee", "User", "Dashboard"] as const;

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAGS,
  endpoints: (b) => {
    // مولّد CRUD عام لكل مورد
    const crud = (name: string, path: string, tag: typeof TAGS[number]) => ({
      [`get${name}`]: b.query<any, Record<string, any> | void>({
        query: (params) => ({ url: path, params: params || {} }),
        providesTags: [tag],
      }),
      [`create${name}`]: b.mutation<any, any>({
        query: (body) => ({ url: path, method: "POST", body }),
        invalidatesTags: [tag, "Dashboard"],
      }),
      [`update${name}`]: b.mutation<any, any>({
        query: ({ id, ...body }) => ({ url: `${path}${id}/`, method: "PATCH", body }),
        invalidatesTags: [tag, "Dashboard"],
      }),
      [`delete${name}`]: b.mutation<any, number>({
        query: (id) => ({ url: `${path}${id}/`, method: "DELETE" }),
        invalidatesTags: [tag, "Dashboard"],
      }),
    });
    return {
      login: b.mutation<any, { username: string; password: string }>({
        query: (body) => ({ url: "auth/login/", method: "POST", body }),
      }),
      dashboard: b.query<any, Record<string, any> | void>({
        query: (params) => ({ url: "reports/dashboard/", params: params || {} }),
        providesTags: ["Dashboard"],
      }),
      hotelsOverview: b.query<any[], void>({
        query: () => "reports/hotels-overview/",
        providesTags: ["Dashboard"],
      }),
      reservationAction: b.mutation<any, { id: number; action: string; body?: any }>({
        query: ({ id, action, body }) => ({ url: `reservations/${id}/${action}/`, method: "POST", body: body || {} }),
        invalidatesTags: ["Reservation", "Room", "Invoice", "Dashboard"],
      }),
      accountsReceivable: b.query<any, void>({
        query: () => "accounts-receivable/",
        providesTags: ["Invoice"],
      }),
      frontOffice: b.query<any, Record<string, any> | void>({
        query: (params) => ({ url: "reports/front-office/", params: params || {} }),
        providesTags: ["Reservation", "Dashboard"],
      }),
      globalSearch: b.query<any, Record<string, any>>({
        query: (params) => ({ url: "reports/search/", params }),
      }),
      nightAuditRun: b.mutation<any, { hotel?: number }>({
        query: (body) => ({ url: "reports/night-audit/run/", method: "POST", body }),
        invalidatesTags: ["Reservation", "Room", "Dashboard"],
      }),
      nightAuditHistory: b.query<any[], Record<string, any> | void>({
        query: (params) => ({ url: "reports/night-audit/history/", params: params || {} }),
        providesTags: ["Dashboard"],
      }),
      calendarGrid: b.query<any, Record<string, any> | void>({
        query: (params) => ({ url: "reports/calendar/", params: params || {} }),
        providesTags: ["Reservation", "Room"],
      }),
      analytics: b.query<any, Record<string, any> | void>({
        query: (params) => ({ url: "reports/analytics/", params: params || {} }),
        providesTags: ["Dashboard"],
      }),
      quote: b.query<any, Record<string, any>>({
        query: (params) => ({ url: "reservations-quote/", params }),
      }),
      invoiceAction: b.mutation<any, { id: number; action: string; body?: any }>({
        query: ({ id, action, body }) => ({ url: `invoices/${id}/${action}/`, method: "POST", body: body || {} }),
        invalidatesTags: ["Invoice", "Dashboard"],
      }),
      housekeepingAction: b.mutation<any, { id: number; action: string }>({
        query: ({ id, action }) => ({ url: `housekeeping/${id}/${action}/`, method: "POST" }),
        invalidatesTags: ["Room", "Dashboard"],
      }),
      maintenanceAction: b.mutation<any, { id: number; action: string }>({
        query: ({ id, action }) => ({ url: `maintenance/${id}/${action}/`, method: "POST" }),
        invalidatesTags: ["Room", "Dashboard"],
      }),
      orderAction: b.mutation<any, { id: number; action: string; body?: any }>({
        query: ({ id, action, body }) => ({ url: `orders/${id}/${action}/`, method: "POST", body: body || {} }),
        invalidatesTags: ["Order", "Invoice", "Dashboard"],
      }),
      ...crud("Hotels", "hotels/", "Hotel"),
      ...crud("Rooms", "rooms/", "Room"),
      ...crud("RoomTypes", "room-types/", "RoomType"),
      ...crud("Floors", "floors/", "Room"),
      ...crud("Amenities", "amenities/", "RoomType"),
      ...crud("Guests", "guests/", "Guest"),
      ...crud("Reservations", "reservations/", "Reservation"),
      ...crud("Invoices", "invoices/", "Invoice"),
      ...crud("Payments", "payments/", "Payment"),
      ...crud("Products", "products/", "Product"),
      ...crud("Categories", "pos-categories/", "Category"),
      ...crud("Orders", "orders/", "Order"),
      ...crud("Expenses", "expenses/", "Expense"),
      ...crud("ExpenseCategories", "expense-categories/", "Expense"),
      ...crud("Employees", "employees/", "Employee"),
      ...crud("SeasonalRates", "seasonal-rates/", "RoomType"),
      ...crud("Services", "services/", "RoomType"),
      ...crud("Housekeeping", "housekeeping/", "Room"),
      ...crud("Maintenance", "maintenance/", "Room"),
      ...crud("Coupons", "coupons/", "Invoice"),
      ...crud("GuestDocuments", "guest-documents/", "Guest"),
      ...crud("Companies", "companies/", "Guest"),
      ...crud("Users", "users/", "User"),
    };
  },
});

export const apiHooks: any = api;

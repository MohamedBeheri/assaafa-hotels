import React from "react";

export interface AppUser { id: number; full_name: string; role_display: string; role: string; hotel: number | null; }
interface Ctx {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  hotel: number | null;       // فلتر الفندق الحالي (null = الكل)
  setHotel: (h: number | null) => void;
}
export const AppContext = React.createContext<Ctx>({} as Ctx);
export const useApp = () => React.useContext(AppContext);

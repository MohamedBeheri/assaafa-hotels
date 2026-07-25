import type { ThemeConfig } from "antd";

// ألوان مستوحاة من شعار فندق السعفة — أخضر السعف والذهبي
export const BRAND = {
  green: "#8CC152",
  greenDark: "#6FA23C",
  gold: "#B8985A",
  goldDark: "#9C7E44",
  sand: "#F7F4EC",
  ink: "#3D3A32",
};

export const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND.green,
    colorInfo: BRAND.gold,
    colorLink: BRAND.goldDark,
    borderRadius: 10,
    fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
    colorBgLayout: BRAND.sand,
  },
  components: {
    Layout: {
      siderBg: "#FFFFFF",
      headerBg: "#FFFFFF",
      bodyBg: BRAND.sand,
    },
    Menu: {
      itemSelectedBg: "#EAF4DC",
      itemSelectedColor: BRAND.greenDark,
      itemBorderRadius: 8,
    },
    Button: { fontWeight: 600 },
  },
};

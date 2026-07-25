import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import arEG from "antd/locale/ar_EG";
import enUS from "antd/locale/en_US";
import { store } from "./app/store";
import { theme } from "./theme";
import i18n from "./i18n";
import App from "./App";
import "./index.css";

function Root() {
  const [lang, setLang] = React.useState(i18n.language);
  React.useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    const handler = (l: string) => setLang(l);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [lang]);
  return (
    <ConfigProvider theme={theme} direction={lang === "ar" ? "rtl" : "ltr"}
      locale={lang === "ar" ? arEG : enUS}>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

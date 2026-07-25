import { Form, Input, Button, Card, App as AntApp, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { apiHooks } from "../app/api";
import { useApp } from "../app/context";

export default function Login() {
  const { t } = useTranslation();
  const [login, { isLoading }] = apiHooks.useLoginMutation();
  const { setUser } = useApp();
  const { message } = AntApp.useApp();

  const onFinish = async (v: any) => {
    try {
      const res = await login(v).unwrap();
      localStorage.setItem("access", res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
    } catch {
      message.error("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="login-bg">
      <Card style={{ width: 380, borderRadius: 18 }} styles={{ body: { padding: 32 } }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/logo.svg" width={64} alt="logo" />
          <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 0, color: "#6FA23C" }}>
            {t("app")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("appFull")}</Typography.Text>
        </div>
        <Form onFinish={onFinish} layout="vertical" initialValues={{ username: "admin", password: "admin123" }}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder={t("username")} size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t("password")} size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
            {t("login")}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import { Splash } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpPage from "./pages/OtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import TransferPage from "./pages/TransferPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import TransactionsPage from "./pages/TransactionsPage";
import StatementPage from "./pages/StatementPage";
import MoneyPage from "./pages/MoneyPage";
import BillsPage from "./pages/BillsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";

function GuestOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/statements" element={<StatementPage />} />
        <Route path="/deposit" element={<MoneyPage mode="deposit" />} />
        <Route path="/withdraw" element={<MoneyPage mode="withdraw" />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

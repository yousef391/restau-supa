import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import Orders from "./pages/admin/Orders";
import Settings from "./pages/admin/Settings";
import MenuPage from "./pages/MenuPage";
import ServerLogin from "./pages/server/Login";
import ServerDashboard from "./pages/server/Dashboard";
import ServerManagementPage from "./pages/admin/ServerManagementPage";
import RestaurantDetailPage from "./pages/restaurant/RestaurantDetailPage";
import CoffeePage from "./pages/coffee/CoffeePage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu/:identifier" element={<MenuPage />} />
      {/* Type-specific routes */}
      <Route path="/r/:slug" element={<RestaurantDetailPage />} />
      <Route path="/c/:slug" element={<CoffeePage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Default admin route */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        {/* Nested admin routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<Settings />} />
        <Route path="servers" element={<ServerManagementPage />} />
      </Route>

      {/* Server Routes */}
      <Route path="/server/login" element={<ServerLogin />} />
      <Route
        path="/server/:restaurantId/dashboard"
        element={<ServerDashboard />}
      />

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

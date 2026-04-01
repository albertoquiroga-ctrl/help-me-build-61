import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import WaiterDashboard from "./pages/WaiterDashboard";
import TableDetail from "./pages/TableDetail";
import TipsDashboard from "./pages/TipsDashboard";
import AlertsQueue from "./pages/AlertsQueue";
import WaiterProfile from "./pages/WaiterProfile";
import HostessDashboard from "./pages/hostess/HostessDashboard";
import WaitlistPage from "./pages/hostess/WaitlistPage";
import BarDashboard from "./pages/bar/BarDashboard";
import NotFound from "./pages/NotFound";
import { useRoleStore } from "./stores/roleStore";

const queryClient = new QueryClient();

function RootRedirect() {
  const role = useRoleStore((s) => s.activeRole);
  const paths = { waiter: '/waiter/dashboard', hostess: '/hostess/dashboard', bar: '/bar/dashboard' };
  return <Navigate to={paths[role]} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          {/* Waiter */}
          <Route path="/waiter/dashboard" element={<WaiterDashboard />} />
          <Route path="/waiter/table/:id" element={<TableDetail />} />
          <Route path="/waiter/tips" element={<TipsDashboard />} />
          <Route path="/waiter/alerts" element={<AlertsQueue />} />
          <Route path="/waiter/profile" element={<WaiterProfile />} />
          {/* Hostess */}
          <Route path="/hostess/dashboard" element={<HostessDashboard />} />
          <Route path="/hostess/waitlist" element={<WaitlistPage />} />
          <Route path="/hostess/profile" element={<WaiterProfile />} />
          {/* Bar */}
          <Route path="/bar/dashboard" element={<BarDashboard />} />
          <Route path="/bar/profile" element={<WaiterProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import WaiterDashboard from "./pages/WaiterDashboard";
import TableDetail from "./pages/TableDetail";
import TipsDashboard from "./pages/TipsDashboard";
import AlertsQueue from "./pages/AlertsQueue";
import WaiterProfile from "./pages/WaiterProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/waiter/dashboard" replace />} />
          <Route path="/waiter/dashboard" element={<WaiterDashboard />} />
          <Route path="/waiter/table/:id" element={<TableDetail />} />
          <Route path="/waiter/tips" element={<TipsDashboard />} />
          <Route path="/waiter/alerts" element={<AlertsQueue />} />
          <Route path="/waiter/profile" element={<WaiterProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

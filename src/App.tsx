import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';

import AttendancePage from './pages/attendance/AttendancePage';

import ClientDashboardPage from './pages/client/ClientDashboardPage';

import ClientsPage from './pages/clients/ClientsPage';

import DashboardPage from './pages/dashboard/DashboardPage';

import EmployeesPage from './pages/employees/EmployeesPage';

import LeadsPage from './pages/leads/LeadsPage';
import LeadsExecutiveDashboard from './pages/leads/LeadsExecutiveDashboard';

import ProcessDashboardPage from './pages/process/ProcessDashboardPage';

import ReportsPage from './pages/reports/ReportsPage';

import SalesDashboardPage from './pages/sales/SalesDashboardPage';
import HolidayCalendarPage from './pages/holidays/HolidayCalendarPage';

function App() {
  const token = localStorage.getItem('try_get_visa_token');

  const storedUser = localStorage.getItem('try_get_visa_user');

  const user = storedUser ? JSON.parse(storedUser) : null;

  const role = user?.role;

  const getDefaultRoute = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/dashboard';

      case 'LEADS_EXECUTIVE':
        return '/leads-dashboard';

      case 'SALES_EXECUTIVE':
        return '/sales-dashboard';

      case 'PROCESS_EXECUTIVE':
        return '/process-dashboard';

      case 'CLIENT':
        return '/client-dashboard';

      default:
        return '/login';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to={getDefaultRoute()} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/leads-dashboard" element={<LeadsExecutiveDashboard />} />
        <Route path="/sales-dashboard" element={<SalesDashboardPage />} />
        <Route path="/process-dashboard" element={<ProcessDashboardPage />} />

        <Route path="/client-dashboard" element={<ClientDashboardPage />} />
        <Route path="/holidays" element={<HolidayCalendarPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

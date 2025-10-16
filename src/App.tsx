import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminPackages } from './pages/admin/AdminPackages'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminCommissions } from './pages/admin/AdminCommissions'
import { AdminReports } from './pages/admin/AdminReports'
import { ResellerDashboard } from './pages/reseller/ResellerDashboard'
import { ResellerOrders } from './pages/reseller/ResellerOrders'
import { ResellerCustomers } from './pages/reseller/ResellerCustomers'
import { ResellerRevenue } from './pages/reseller/ResellerRevenue'
import { CTVDashboard } from './pages/ctv/CTVDashboard'
import { CTVOrders } from './pages/ctv/CTVOrders'
import { CTVCommissions } from './pages/ctv/CTVCommissions'
import { CustomerDashboard } from './pages/customer/CustomerDashboard'
import { CustomerHistory } from './pages/customer/CustomerHistory'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginForm /> : <Navigate to={`/${user.role}`} replace />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/packages" element={<ProtectedRoute allowedRoles={['admin']}><AdminPackages /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin']}><AdminCommissions /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

      <Route path="/reseller" element={<ProtectedRoute allowedRoles={['reseller']}><ResellerDashboard /></ProtectedRoute>} />
      <Route path="/reseller/orders" element={<ProtectedRoute allowedRoles={['reseller']}><ResellerOrders /></ProtectedRoute>} />
      <Route path="/reseller/customers" element={<ProtectedRoute allowedRoles={['reseller']}><ResellerCustomers /></ProtectedRoute>} />
      <Route path="/reseller/revenue" element={<ProtectedRoute allowedRoles={['reseller']}><ResellerRevenue /></ProtectedRoute>} />

      <Route path="/ctv" element={<ProtectedRoute allowedRoles={['ctv']}><CTVDashboard /></ProtectedRoute>} />
      <Route path="/ctv/orders" element={<ProtectedRoute allowedRoles={['ctv']}><CTVOrders /></ProtectedRoute>} />
      <Route path="/ctv/commissions" element={<ProtectedRoute allowedRoles={['ctv']}><CTVCommissions /></ProtectedRoute>} />

      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/history" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHistory /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

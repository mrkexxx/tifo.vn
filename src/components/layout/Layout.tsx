import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard' },
          { path: '/admin/users', label: 'Người dùng' },
          { path: '/admin/packages', label: 'Gói sản phẩm' },
          { path: '/admin/orders', label: 'Đơn hàng' },
          { path: '/admin/commissions', label: 'Hoa hồng' },
          { path: '/admin/reports', label: 'Báo cáo' },
        ]
      case 'reseller':
        return [
          { path: '/reseller', label: 'Dashboard' },
          { path: '/reseller/orders', label: 'Đơn hàng' },
          { path: '/reseller/customers', label: 'Khách hàng' },
          { path: '/reseller/revenue', label: 'Doanh thu' },
        ]
      case 'ctv':
        return [
          { path: '/ctv', label: 'Dashboard' },
          { path: '/ctv/orders', label: 'Đơn hàng' },
          { path: '/ctv/commissions', label: 'Hoa hồng' },
        ]
      case 'customer':
        return [
          { path: '/customer', label: 'Gói của tôi' },
          { path: '/customer/history', label: 'Lịch sử mua hàng' },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Tsoft Sales</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition ${
                      location.pathname === item.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-700">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

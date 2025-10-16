import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export function CustomerHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          package:packages(name, duration, description)
        `)
        .eq('customer_id', user.id)
        .order('order_date', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      cancelled: 'Đã hủy',
    }
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Chuyển khoản',
      cash: 'Tiền mặt',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
    }
    return method ? labels[method] || method : '-'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Đang tải...</div>
      </Layout>
    )
  }

  const totalSpent = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.amount), 0)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Lịch sử mua hàng</h1>
          <div className="bg-white px-6 py-3 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng chi tiêu</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">Bạn chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.package.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{order.package.description}</p>
                  </div>
                  {getStatusBadge(order.payment_status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Số tiền</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.amount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phương thức</p>
                    <p className="text-sm font-medium text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ngày đặt</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hết hạn</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.expiry_date ? new Date(order.expiry_date).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Ghi chú:</p>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}

                {order.payment_status === 'paid' && order.expiry_date && new Date(order.expiry_date) < new Date() && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 text-center">
                    Gói này đã hết hạn
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

interface OrderWithDetails {
  id: string
  amount: number
  payment_status: string
  payment_method: string | null
  order_date: string
  activation_date: string | null
  expiry_date: string | null
  customer: { name: string; email: string }
  package: { name: string }
  reseller: { name: string } | null
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          amount,
          payment_status,
          payment_method,
          order_date,
          activation_date,
          expiry_date,
          customer:users!orders_customer_id_fkey(name, email),
          package:packages(name),
          reseller:users!orders_reseller_id_fkey(name)
        `)
        .order('order_date', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('payment_status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data as any || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId)

      if (error) throw error
      loadOrders()
    } catch (error) {
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không thể cập nhật'))
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
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Đang tải...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <div className="flex space-x-2">
            {(['all', 'pending', 'paid', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ' : f === 'paid' ? 'Đã thanh toán' : 'Đã hủy'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gói</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đại lý</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-sm text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.package.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.reseller?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(Number(order.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.payment_status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.order_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.payment_status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Xác nhận
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

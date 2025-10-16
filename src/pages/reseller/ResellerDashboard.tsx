import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

export function ResellerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    commissionRate: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('amount, order_date, payment_status, customer_id')
        .eq('reseller_id', user.id)

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || []
      const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0)
      const uniqueCustomers = new Set(orders?.map(o => o.customer_id)).size

      const commissionRate = totalRevenue >= 50000000 ? 20 : totalRevenue >= 20000000 ? 15 : 10

      setStats({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalCustomers: uniqueCustomers,
        commissionRate,
      })

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayRevenue = paidOrders
          .filter(o => o.order_date.startsWith(dateStr))
          .reduce((sum, o) => sum + Number(o.amount), 0)
        return {
          date: format(date, 'dd/MM'),
          revenue: dayRevenue,
        }
      })
      setRevenueData(last7Days)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Đại lý</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng khách hàng</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tỷ lệ chiết khấu</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{stats.commissionRate}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Doanh thu 7 ngày qua</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Doanh thu" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Chính sách chiết khấu:</strong> 10% cho doanh số dưới 20 triệu, 15% cho 20-50 triệu, 20% trên 50 triệu VND
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

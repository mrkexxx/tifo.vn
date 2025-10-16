import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingCommissions: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [topResellers, setTopResellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [ordersResult, usersResult, commissionsResult] = await Promise.all([
        supabase.from('orders').select('amount, order_date, payment_status'),
        supabase.from('users').select('id, role'),
        supabase.from('commissions').select('amount, status'),
      ])

      const paidOrders = ordersResult.data?.filter(o => o.payment_status === 'paid') || []
      const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0)
      const pendingCommissions = commissionsResult.data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0

      setStats({
        totalRevenue,
        totalOrders: ordersResult.data?.length || 0,
        totalUsers: usersResult.data?.length || 0,
        pendingCommissions,
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

      const resellerStats = await supabase
        .from('orders')
        .select('reseller_id, amount, users!orders_reseller_id_fkey(name)')
        .eq('payment_status', 'paid')
        .not('reseller_id', 'is', null)

      const resellerMap = new Map()
      resellerStats.data?.forEach(order => {
        const id = order.reseller_id
        if (!id) return
        const current = resellerMap.get(id) || { name: (order.users as any)?.name, total: 0 }
        current.total += Number(order.amount)
        resellerMap.set(id, current)
      })

      const top5 = Array.from(resellerMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      setTopResellers(top5)
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>

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
            <p className="text-sm text-gray-600">Tổng người dùng</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Hoa hồng chưa chi</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(stats.pendingCommissions)}</p>
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Đại lý</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topResellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Doanh số" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  )
}

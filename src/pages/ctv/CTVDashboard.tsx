import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

export function CTVDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    totalOrders: 0,
  })
  const [commissionData, setCommissionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, created_at')
        .eq('reseller_id', user.id)

      const totalCommission = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
      const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0
      const paidCommission = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('reseller_id', user.id)

      setStats({
        totalCommission,
        pendingCommission,
        paidCommission,
        totalOrders: orders?.length || 0,
      })

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayCommission = commissions
          ?.filter(c => c.created_at.startsWith(dateStr))
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0
        return {
          date: format(date, 'dd/MM'),
          commission: dayCommission,
        }
      })
      setCommissionData(last7Days)
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard CTV</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng hoa hồng</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.totalCommission)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{formatCurrency(stats.pendingCommission)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Đã nhận</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.paidCommission)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hoa hồng 7 ngày qua</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="commission" stroke="#10b981" name="Hoa hồng" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Chính sách hoa hồng CTV:</strong> 10% cho mỗi đơn hàng thành công
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

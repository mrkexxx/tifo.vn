import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

export function ResellerRevenue() {
  const { user } = useAuth()
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadRevenueData()
  }, [user])

  const loadRevenueData = async () => {
    if (!user) return

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('amount, payment_status, order_date')
        .eq('reseller_id', user.id)
        .order('order_date', { ascending: false })

      const monthMap = new Map()
      orders?.forEach((order) => {
        if (order.payment_status === 'paid') {
          const monthKey = format(new Date(order.order_date), 'yyyy-MM')
          const current = monthMap.get(monthKey) || {
            month: monthKey,
            revenue: 0,
            orders: 0,
          }
          current.revenue += Number(order.amount)
          current.orders++
          monthMap.set(monthKey, current)
        }
      })

      const sortedData = Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month))

      const dataWithCommissions = sortedData.map((month) => {
        const commissionRate = month.revenue >= 50000000 ? 20 : month.revenue >= 20000000 ? 15 : 10
        return {
          ...month,
          commissionRate,
          commission: (month.revenue * commissionRate) / 100,
        }
      })

      setMonthlyData(dataWithCommissions)
    } catch (error) {
      console.error('Error loading revenue:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `Tháng ${month}/${year}`
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
        <h1 className="text-3xl font-bold text-gray-900">Doanh thu theo tháng</h1>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Chính sách chiết khấu:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                <li>10% cho doanh số dưới 20 triệu VND/tháng</li>
                <li>15% cho doanh số từ 20-50 triệu VND/tháng</li>
                <li>20% cho doanh số trên 50 triệu VND/tháng</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tháng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoa hồng</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((month) => (
                <tr key={month.month}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatMonth(month.month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(month.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {month.commissionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {formatCurrency(month.commission)}
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

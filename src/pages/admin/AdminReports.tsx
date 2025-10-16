import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

export function AdminReports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(name, email),
          package:packages(name),
          reseller:users!orders_reseller_id_fkey(name, email)
        `)
        .gte('order_date', dateRange.from)
        .lte('order_date', dateRange.to)
        .order('order_date', { ascending: false })

      const { data: commissions } = await supabase
        .from('commissions')
        .select(`
          *,
          reseller:users!commissions_reseller_id_fkey(name)
        `)
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || []
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0)
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0

      setReportData({
        orders: orders || [],
        paidOrders,
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalCommissions,
        commissions: commissions || [],
      })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateReport()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const exportToCSV = () => {
    if (!reportData) return

    const csvContent = [
      ['Báo cáo doanh thu', `Từ ${dateRange.from} đến ${dateRange.to}`],
      [''],
      ['Tổng quan'],
      ['Tổng doanh thu', reportData.totalRevenue],
      ['Tổng đơn hàng', reportData.totalOrders],
      ['Tổng hoa hồng', reportData.totalCommissions],
      ['Lợi nhuận ròng', reportData.totalRevenue - reportData.totalCommissions],
      [''],
      ['Chi tiết đơn hàng'],
      ['Ngày', 'Khách hàng', 'Email', 'Gói', 'Số tiền', 'Đại lý', 'Trạng thái'],
      ...reportData.orders.map((o: any) => [
        new Date(o.order_date).toLocaleDateString('vi-VN'),
        o.customer.name,
        o.customer.email,
        o.package.name,
        o.amount,
        o.reseller?.name || '-',
        o.payment_status,
      ]),
    ]

    const csv = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-doanh-thu-${dateRange.from}-${dateRange.to}.csv`
    link.click()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={generateReport}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
              </button>
              {reportData && (
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Xuất CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {reportData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(reportData.totalRevenue)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{reportData.totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Tổng hoa hồng</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(reportData.totalCommissions)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Lợi nhuận ròng</p>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {formatCurrency(reportData.totalRevenue - reportData.totalCommissions)}
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gói</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đại lý</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.orders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.order_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.package.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.reseller?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(Number(order.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.payment_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

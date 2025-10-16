import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'

interface CommissionWithDetails {
  id: string
  percent: number
  amount: number
  status: string
  created_at: string
  paid_at: string | null
  reseller: { name: string; email: string }
  order: {
    amount: number
    order_date: string
    customer: { name: string }
  }
}

export function AdminCommissions() {
  const [commissions, setCommissions] = useState<CommissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all')

  useEffect(() => {
    loadCommissions()
  }, [filter])

  const loadCommissions = async () => {
    try {
      let query = supabase
        .from('commissions')
        .select(`
          id,
          percent,
          amount,
          status,
          created_at,
          paid_at,
          reseller:users!commissions_reseller_id_fkey(name, email),
          order:orders(
            amount,
            order_date,
            customer:users!orders_customer_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setCommissions(data as any || [])
    } catch (error) {
      console.error('Error loading commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCommissionStatus = async (commissionId: string, status: 'pending' | 'approved' | 'paid') => {
    try {
      const updateData: any = { status }
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('commissions')
        .update(updateData)
        .eq('id', commissionId)

      if (error) throw error
      loadCommissions()
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
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    }
    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      paid: 'Đã chi',
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý hoa hồng</h1>
          <div className="flex space-x-2">
            {(['all', 'pending', 'approved', 'paid'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ duyệt' : f === 'approved' ? 'Đã duyệt' : 'Đã chi'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đại lý/CTV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoa hồng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{commission.reseller.name}</div>
                    <div className="text-sm text-gray-500">{commission.reseller.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {commission.order.customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(Number(commission.order.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {commission.percent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(Number(commission.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(commission.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {commission.status === 'pending' && (
                      <button
                        onClick={() => updateCommissionStatus(commission.id, 'approved')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Duyệt
                      </button>
                    )}
                    {commission.status === 'approved' && (
                      <button
                        onClick={() => updateCommissionStatus(commission.id, 'paid')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Đánh dấu đã chi
                      </button>
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

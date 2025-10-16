import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { differenceInDays } from 'date-fns'

export function CustomerDashboard() {
  const { user } = useAuth()
  const [activePackages, setActivePackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadActivePackages()
  }, [user])

  const loadActivePackages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          package:packages(name, duration, description)
        `)
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid')
        .gte('expiry_date', new Date().toISOString())
        .order('expiry_date', { ascending: true })

      if (error) throw error
      setActivePackages(data || [])
    } catch (error) {
      console.error('Error loading packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getDaysRemaining = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date())
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
        <h1 className="text-3xl font-bold text-gray-900">Gói của tôi</h1>

        {activePackages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">Bạn chưa có gói nào đang hoạt động</p>
            <p className="text-gray-500 mt-2">Liên hệ với đại lý để mua gói sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePackages.map((order) => {
              const daysRemaining = getDaysRemaining(order.expiry_date)
              const isExpiringSoon = daysRemaining <= 7

              return (
                <div key={order.id} className={`bg-white rounded-lg shadow p-6 ${isExpiringSoon ? 'border-2 border-orange-500' : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{order.package.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{order.package.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giá trị:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(Number(order.amount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Kích hoạt:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.activation_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hết hạn:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.expiry_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg text-center ${
                    isExpiringSoon ? 'bg-orange-50' : 'bg-green-50'
                  }`}>
                    <p className={`text-sm font-medium ${
                      isExpiringSoon ? 'text-orange-800' : 'text-green-800'
                    }`}>
                      {isExpiringSoon ? '⚠️ ' : '✓ '}
                      Còn {daysRemaining} ngày
                    </p>
                  </div>

                  {isExpiringSoon && (
                    <div className="mt-4 p-2 bg-orange-100 rounded text-xs text-orange-700 text-center">
                      Gói sắp hết hạn. Vui lòng gia hạn!
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

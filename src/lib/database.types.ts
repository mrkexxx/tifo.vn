export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'reseller' | 'ctv' | 'customer'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'reseller' | 'ctv' | 'customer'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'reseller' | 'ctv' | 'customer'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          duration: number
          price: number
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration: number
          price: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration?: number
          price?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          package_id: string
          reseller_id: string | null
          amount: number
          payment_status: 'pending' | 'paid' | 'cancelled'
          payment_method: string | null
          order_date: string
          activation_date: string | null
          expiry_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          package_id: string
          reseller_id?: string | null
          amount: number
          payment_status?: 'pending' | 'paid' | 'cancelled'
          payment_method?: string | null
          order_date?: string
          activation_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          package_id?: string
          reseller_id?: string | null
          amount?: number
          payment_status?: 'pending' | 'paid' | 'cancelled'
          payment_method?: string | null
          order_date?: string
          activation_date?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      commissions: {
        Row: {
          id: string
          order_id: string
          reseller_id: string
          percent: number
          amount: number
          status: 'pending' | 'approved' | 'paid'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          reseller_id: string
          percent: number
          amount: number
          status?: 'pending' | 'approved' | 'paid'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          reseller_id?: string
          percent?: number
          amount?: number
          status?: 'pending' | 'approved' | 'paid'
          paid_at?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
      }
    }
  }
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      trains: {
        Row: {
          id: string
          train_id: string
          fc_rs: boolean
          fc_sig: boolean
          fc_tel: boolean
          open_jobs: number
          branding_shortfall: number
          mileage_km: number
          cleaning_due: boolean
          stabling_penalty: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          train_id: string
          fc_rs?: boolean
          fc_sig?: boolean
          fc_tel?: boolean
          open_jobs?: number
          branding_shortfall?: number
          mileage_km?: number
          cleaning_due?: boolean
          stabling_penalty?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          train_id?: string
          fc_rs?: boolean
          fc_sig?: boolean
          fc_tel?: boolean
          open_jobs?: number
          branding_shortfall?: number
          mileage_km?: number
          cleaning_due?: boolean
          stabling_penalty?: number
          created_at?: string
          updated_at?: string
        }
      }
      csv_data_sources: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      csv_uploads: {
        Row: {
          id: string
          source_id: string
          filename: string
          row_count: number
          headers: string[]
          uploaded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          source_id: string
          filename: string
          row_count: number
          headers: string[]
          uploaded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          source_id?: string
          filename?: string
          row_count?: number
          headers?: string[]
          uploaded_at?: string
          user_id?: string
        }
      }
      csv_data_rows: {
        Row: {
          id: string
          upload_id: string
          row_data: Record<string, any>
          row_index: number
          created_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          row_data: Record<string, any>
          row_index: number
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          row_data?: Record<string, any>
          row_index?: number
          created_at?: string
        }
      }
      ml_models: {
        Row: {
          id: string
          name: string
          description: string | null
          model_type: string
          configuration: Record<string, any>
          is_active: boolean
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          model_type: string
          configuration?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          model_type?: string
          configuration?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      ml_training_sessions: {
        Row: {
          id: string
          model_id: string
          status: 'pending' | 'training' | 'completed' | 'failed'
          metrics: Record<string, any>
          started_at: string
          completed_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          model_id: string
          status?: 'pending' | 'training' | 'completed' | 'failed'
          metrics?: Record<string, any>
          started_at?: string
          completed_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          model_id?: string
          status?: 'pending' | 'training' | 'completed' | 'failed'
          metrics?: Record<string, any>
          started_at?: string
          completed_at?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

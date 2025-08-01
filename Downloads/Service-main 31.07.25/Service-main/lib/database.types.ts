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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      service_approval_levels: {
        Row: {
          id: string
          service_id: string
          level: number
          staff_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          level: number
          staff_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          level?: number
          staff_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          service_id: string
          requester_id: string
          status: string
          level: number
          max_approval_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          requester_id: string
          status?: string
          level?: number
          max_approval_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          requester_id?: string
          status?: string
          level?: number
          max_approval_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          category_id: string | null
          request_no: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          applicable_to: string
          status: string
          service_limit: number | null
          attachment_url: string | null
          sla_period: number | null
          payment_method: string
          created_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          request_no: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          applicable_to: string
          status: string
          service_limit?: number | null
          attachment_url?: string | null
          sla_period?: number | null
          payment_method: string
          created_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          request_no?: string
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          applicable_to?: string
          status?: string
          service_limit?: number | null
          attachment_url?: string | null
          sla_period?: number | null
          payment_method?: string
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      payment_sessions: {
        Row: {
          id: string
          order_id: string
          session_id: string | null
          customer_id: string
          customer_email: string
          customer_phone: string | null
          first_name: string | null
          last_name: string | null
          amount: number | null
          currency: string
          description: string | null
          payment_link_web: string | null
          payment_link_mobile: string | null
          hdfc_session_response: Json | null
          session_status: string
          service_id: string | null
          user_id: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
          test_case_id: string | null
          test_scenario: string | null
          testing_notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          session_id?: string | null
          customer_id: string
          customer_email: string
          customer_phone?: string | null
          first_name?: string | null
          last_name?: string | null
          amount?: number | null
          currency?: string
          description?: string | null
          payment_link_web?: string | null
          payment_link_mobile?: string | null
          hdfc_session_response?: Json | null
          session_status?: string
          service_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          test_case_id?: string | null
          test_scenario?: string | null
          testing_notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          session_id?: string | null
          customer_id?: string
          customer_email?: string
          customer_phone?: string | null
          first_name?: string | null
          last_name?: string | null
          amount?: number | null
          currency?: string
          description?: string | null
          payment_link_web?: string | null
          payment_link_mobile?: string | null
          hdfc_session_response?: Json | null
          session_status?: string
          service_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          test_case_id?: string | null
          test_scenario?: string | null
          testing_notes?: string | null
        }
      }
      transaction_details: {
        Row: {
          id: string
          order_id: string
          transaction_id: string | null
          payment_session_id: string | null
          status: string
          signature_verified: boolean
          hdfc_response_raw: Json | null
          form_data_received: Json | null
          test_case_id: string | null
          vulnerability_notes: string | null
          created_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          order_id: string
          transaction_id?: string | null
          payment_session_id?: string | null
          status: string
          signature_verified?: boolean
          hdfc_response_raw?: Json | null
          form_data_received?: Json | null
          test_case_id?: string | null
          vulnerability_notes?: string | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          transaction_id?: string | null
          payment_session_id?: string | null
          status?: string
          signature_verified?: boolean
          hdfc_response_raw?: Json | null
          form_data_received?: Json | null
          test_case_id?: string | null
          vulnerability_notes?: string | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      payment_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          previous_status: string | null
          changed_at: string
          changed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          previous_status?: string | null
          changed_at?: string
          changed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          previous_status?: string | null
          changed_at?: string
          changed_by?: string | null
          notes?: string | null
        }
      }
      security_audit_log: {
        Row: {
          id: string
          event_type: string
          severity: string
          description: string
          order_id: string | null
          vulnerability_type: string | null
          event_data: Json | null
          test_case_id: string | null
          created_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          event_type: string
          severity: string
          description: string
          order_id?: string | null
          vulnerability_type?: string | null
          event_data?: Json | null
          test_case_id?: string | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          severity?: string
          description?: string
          order_id?: string | null
          vulnerability_type?: string | null
          event_data?: Json | null
          test_case_id?: string | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      bank_test_cases: {
        Row: {
          id: string
          test_name: string
          description: string | null
          test_type: string
          expected_result: string
          test_data: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_name: string
          description?: string | null
          test_type: string
          expected_result: string
          test_data?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_name?: string
          description?: string | null
          test_type?: string
          expected_result?: string
          test_data?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_service_request: {
        Args: { request_id: string }
        Returns: boolean
      }
      assign_role: {
        Args: { user_id: string; role_id: string }
        Returns: boolean
      }
      force_delete_category: {
        Args: { category_id: string }
        Returns: void
      }
    }
    Enums: {
      service_status: 'active' | 'inactive'
      service_request_status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
    }
  }
} 
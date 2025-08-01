import { createClient } from '@/lib/utils/supabase/client';
import { Database } from './database.types';

type PaymentSession = Database['public']['Tables']['payment_sessions']['Row'];
type TransactionDetail = Database['public']['Tables']['transaction_details']['Row'];
type PaymentStatusHistory = Database['public']['Tables']['payment_status_history']['Row'];
type SecurityAuditLog = Database['public']['Tables']['security_audit_log']['Row'];
type BankTestCase = Database['public']['Tables']['bank_test_cases']['Row'];

export interface CreatePaymentSessionParams {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  firstName?: string;
  lastName?: string;
  amount?: number;
  currency?: string;
  description?: string;
  serviceId?: string;
  userId?: string;
  testCaseId?: string;
  testScenario?: string;
}

export interface RecordTransactionParams {
  orderId: string;
  transactionId?: string;
  paymentSessionId?: string;
  status?: string;
  hdfcResponse?: any;
  formData?: any;
  signatureData?: {
    signature?: string;
    verified?: boolean;
    algorithm?: string;
  };
  testCaseId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityEventParams {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  orderId?: string;
  vulnerabilityType?: string;
  eventData?: any;
  testCaseId?: string;
}

export class TransactionTrackingService {
  private supabase = createClient();

  /**
   * Generate a unique order ID using database function
   * This ensures guaranteed uniqueness even under high concurrency
   */
  async generateUniqueOrderId(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('generate_unique_order_id');
      
      if (error) {
        console.error('Error generating unique order ID:', error);
        throw new Error(`Failed to generate unique order ID: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Order ID generation error:', error);
      throw error;
    }
  }

  /**
   * Get order ID statistics to check for duplicates
   */
  async getOrderIdStatistics(): Promise<{
    totalOrders: number;
    uniqueOrderIds: number;
    duplicateCount: number;
    latestOrderId: string;
    oldestOrderId: string;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_order_id_statistics');
      
      if (error) {
        console.error('Error getting order ID statistics:', error);
        throw new Error(`Failed to get order ID statistics: ${error.message}`);
      }
      
      return {
        totalOrders: parseInt(data[0]?.total_orders || '0'),
        uniqueOrderIds: parseInt(data[0]?.unique_order_ids || '0'),
        duplicateCount: parseInt(data[0]?.duplicate_count || '0'),
        latestOrderId: data[0]?.latest_order_id || '',
        oldestOrderId: data[0]?.oldest_order_id || ''
      };
    } catch (error) {
      console.error('Order ID statistics error:', error);
      throw error;
    }
  }

  /**
   * Clean up duplicate order IDs if any exist
   */
  async cleanupDuplicateOrderIds(): Promise<{
    cleanedCount: number;
    duplicateCount: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_duplicate_order_ids');
      
      if (error) {
        console.error('Error cleaning up duplicate order IDs:', error);
        throw new Error(`Failed to cleanup duplicate order IDs: ${error.message}`);
      }
      
      return {
        cleanedCount: parseInt(data[0]?.cleaned_count || '0'),
        duplicateCount: parseInt(data[0]?.duplicate_count || '0')
      };
    } catch (error) {
      console.error('Cleanup duplicate order IDs error:', error);
      throw error;
    }
  }

  /**
   * Validate all existing order IDs
   */
  async validateAllOrderIds(): Promise<Array<{
    orderId: string;
    isValid: boolean;
    validationMessage: string;
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('validate_all_order_ids');
      
      if (error) {
        console.error('Error validating order IDs:', error);
        throw new Error(`Failed to validate order IDs: ${error.message}`);
      }
      
      return data.map((item: any) => ({
        orderId: item.order_id,
        isValid: item.is_valid,
        validationMessage: item.validation_message
      }));
    } catch (error) {
      console.error('Validate order IDs error:', error);
      throw error;
    }
  }

  /**
   * Check which order IDs need migration to new format
   */
  async checkOrderIdsForMigration(): Promise<Array<{
    orderId: string;
    currentFormat: string;
    needsMigration: boolean;
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('check_order_ids_for_migration');
      
      if (error) {
        console.error('Error checking migration status:', error);
        throw new Error(`Failed to check migration status: ${error.message}`);
      }
      
      return data.map((item: any) => ({
        orderId: item.order_id,
        currentFormat: item.current_format,
        needsMigration: item.needs_migration
      }));
    } catch (error) {
      console.error('Check migration status error:', error);
      throw error;
    }
  }

  /**
   * Migrate existing order IDs to new format
   */
  async migrateOrderIdsToNewFormat(): Promise<{
    migratedCount: number;
    skippedCount: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('migrate_order_ids_to_new_format');
      
      if (error) {
        console.error('Error migrating order IDs:', error);
        throw new Error(`Failed to migrate order IDs: ${error.message}`);
      }
      
      return {
        migratedCount: parseInt(data[0]?.migrated_count || '0'),
        skippedCount: parseInt(data[0]?.skipped_count || '0')
      };
    } catch (error) {
      console.error('Migrate order IDs error:', error);
      throw error;
    }
  }

  /**
   * Safely add format constraint after migration
   */
  async addFormatConstraintSafely(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('add_format_constraint_safely');
      
      if (error) {
        console.error('Error adding format constraint:', error);
        throw new Error(`Failed to add format constraint: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Add format constraint error:', error);
      throw error;
    }
  }

  /**
   * Check migration readiness for enhanced format
   */
  async checkMigrationReadiness(): Promise<{
    totalOrderIds: number;
    enhancedFormatCount: number;
    oldFormatCount: number;
    basicFormatCount: number;
    invalidFormatCount: number;
    readyForMigration: boolean;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('check_migration_readiness');
      
      if (error) {
        console.error('Error checking migration readiness:', error);
        throw new Error(`Failed to check migration readiness: ${error.message}`);
      }
      
      const result = data[0];
      return {
        totalOrderIds: parseInt(result.total_order_ids || '0'),
        enhancedFormatCount: parseInt(result.enhanced_format_count || '0'),
        oldFormatCount: parseInt(result.old_format_count || '0'),
        basicFormatCount: parseInt(result.basic_format_count || '0'),
        invalidFormatCount: parseInt(result.invalid_format_count || '0'),
        readyForMigration: result.ready_for_migration || false
      };
    } catch (error) {
      console.error('Check migration readiness error:', error);
      throw error;
    }
  }

  /**
   * Migrate all order IDs to enhanced format
   */
  async migrateAllOrderIdsToEnhancedFormat(): Promise<{
    totalProcessed: number;
    migratedCount: number;
    skippedCount: number;
    errorCount: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('migrate_all_order_ids_to_enhanced_format');
      
      if (error) {
        console.error('Error migrating to enhanced format:', error);
        throw new Error(`Failed to migrate to enhanced format: ${error.message}`);
      }
      
      const result = data[0];
      return {
        totalProcessed: parseInt(result.total_processed || '0'),
        migratedCount: parseInt(result.migrated_count || '0'),
        skippedCount: parseInt(result.skipped_count || '0'),
        errorCount: parseInt(result.error_count || '0')
      };
    } catch (error) {
      console.error('Migrate to enhanced format error:', error);
      throw error;
    }
  }

  /**
   * Add enhanced format constraint
   */
  async addEnhancedFormatConstraint(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('add_enhanced_format_constraint');
      
      if (error) {
        console.error('Error adding enhanced format constraint:', error);
        throw new Error(`Failed to add enhanced format constraint: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Add enhanced format constraint error:', error);
      throw error;
    }
  }

  /**
   * Create a new payment session with full tracking
   */
  async createPaymentSession(params: CreatePaymentSessionParams): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('create_tracked_payment_session', {
        p_order_id: params.orderId,
        p_customer_id: params.customerId,
        p_customer_email: params.customerEmail,
        p_customer_phone: params.customerPhone || null,
        p_first_name: params.firstName || null,
        p_last_name: params.lastName || null,
        p_amount: params.amount || null,
        p_currency: params.currency || 'INR',
        p_description: params.description || null,
        p_service_id: params.serviceId || null,
        p_user_id: params.userId || null,
        p_test_case_id: params.testCaseId || null,
        p_test_scenario: params.testScenario || null
      });

      if (error) {
        console.error('Error creating payment session:', error);
        throw new Error(`Failed to create payment session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Transaction tracking error:', error);
      throw error;
    }
  }

  /**
   * Record transaction response with complete details
   */
  async recordTransactionResponse(params: RecordTransactionParams): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('record_transaction_response', {
        p_order_id: params.orderId,
        p_transaction_id: params.transactionId || null,
        p_payment_session_id: params.paymentSessionId || null,
        p_status: params.status || null,
        p_hdfc_response: params.hdfcResponse || null,
        p_form_data: params.formData || null,
        p_signature_data: params.signatureData || null,
        p_test_case_id: params.testCaseId || null,
        p_ip_address: params.ipAddress || null,
        p_user_agent: params.userAgent || null
      });

      if (error) {
        console.error('Error recording transaction response:', error);
        throw new Error(`Failed to record transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Transaction recording error:', error);
      throw error;
    }
  }

  /**
   * Log security events and vulnerabilities
   */
  async logSecurityEvent(params: SecurityEventParams): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('log_security_event', {
        p_event_type: params.eventType,
        p_severity: params.severity,
        p_description: params.description,
        p_order_id: params.orderId || null,
        p_vulnerability_type: params.vulnerabilityType || null,
        p_event_data: params.eventData || null,
        p_test_case_id: params.testCaseId || null
      });

      if (error) {
        console.error('Error logging security event:', error);
        throw new Error(`Failed to log security event: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Security logging error:', error);
      throw error;
    }
  }

  /**
   * Update HDFC session response
   */
  async updateSessionResponse(orderId: string, sessionResponse: any): Promise<void> {
    try {
      // First try the standard update
      const { error } = await this.supabase
        .from('payment_sessions')
        .update({
          hdfc_session_response: sessionResponse,
          session_status: sessionResponse.status || 'updated',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        // If updated_at column doesn't exist, try without it
        if (error.message.includes('updated_at')) {
          console.warn('updated_at column not found, updating without it');
          const { error: retryError } = await this.supabase
            .from('payment_sessions')
            .update({
              hdfc_session_response: sessionResponse,
              session_status: sessionResponse.status || 'updated'
            })
            .eq('order_id', orderId);
          
          if (retryError) {
            throw new Error(`Failed to update session response: ${retryError.message}`);
          }
        } else {
          throw new Error(`Failed to update session response: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Session update error:', error);
      // Don't throw error - just log it and continue
      console.warn('Session update failed, continuing without update');
    }
  }

  /**
   * Get payment session by order ID
   */
  async getPaymentSession(orderId: string): Promise<PaymentSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('payment_sessions')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No record found
        }
        throw new Error(`Failed to get payment session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get payment session error:', error);
      throw error;
    }
  }

  /**
   * Get transaction details by order ID
   */
  async getTransactionDetails(orderId: string): Promise<TransactionDetail[]> {
    try {
      // Use specific columns to avoid missing column errors
      const { data, error } = await this.supabase
        .from('transaction_details')
        .select(`
          id,
          order_id,
          transaction_id,
          payment_session_id,
          status,
          hdfc_response_raw,
          form_data_received,
          signature_verified,
          created_at,
          transaction_date,
          ip_address,
          user_agent,
          test_case_id
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transaction details:', error);
        throw new Error(`Failed to get transaction details: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get transaction details error:', error);
      throw error;
    }
  }

  /**
   * Get security audit logs for order
   */
  async getSecurityAuditLogs(orderId: string): Promise<SecurityAuditLog[]> {
    try {
      // Use specific columns to avoid missing column errors
      const { data, error } = await this.supabase
        .from('security_audit_log')
        .select(`
          id,
          event_type,
          severity,
          event_description,
          order_id,
          vulnerability_type,
          event_data,
          test_case_id
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching security audit logs:', error);
        throw new Error(`Failed to get security logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get security logs error:', error);
      throw error;
    }
  }

  /**
   * Get all bank test cases
   */
  async getBankTestCases(): Promise<BankTestCase[]> {
    try {
      // Use specific columns to avoid missing column errors
      const { data, error } = await this.supabase
        .from('bank_test_cases')
        .select(`
          id,
          test_case_id,
          test_name,
          test_description,
          test_category,
          test_scenario,
          expected_result,
          actual_result,
          test_status,
          execution_date,
          execution_duration,
          error_messages,
          vulnerabilities_found,
          test_output,
          created_at,
          updated_at
        `)
        .order('test_case_id');

      if (error) {
        console.error('Error fetching bank test cases:', error);
        throw new Error(`Failed to get test cases: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get test cases error:', error);
      throw error;
    }
  }

  /**
   * Update test case results
   */
  async updateTestCaseResult(
    testCaseId: string, 
    result: {
      status?: string;
      actualResult?: string;
      testOutput?: any;
      errorMessages?: string;
      vulnerabilitiesFound?: string;
      executionDuration?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bank_test_cases')
        .update({
          test_status: result.status,
          actual_result: result.actualResult,
          test_output: result.testOutput,
          error_messages: result.errorMessages,
          vulnerabilities_found: result.vulnerabilitiesFound,
          execution_date: new Date().toISOString(),
          execution_duration: result.executionDuration,
          updated_at: new Date().toISOString()
        })
        .eq('test_case_id', testCaseId);

      if (error) {
        throw new Error(`Failed to update test case: ${error.message}`);
      }
    } catch (error) {
      console.error('Update test case error:', error);
      throw error;
    }
  }

  /**
   * Create hash verification record
   */
  async createHashVerification(
    orderId: string,
    transactionId: string,
    hashData: {
      hashType: string;
      originalData: string;
      computedHash: string;
      receivedHash?: string;
      verified?: boolean;
      algorithm?: string;
      testCaseReference?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('hash_verification')
        .insert({
          order_id: orderId,
          transaction_id: transactionId,
          hash_type: hashData.hashType,
          original_data: hashData.originalData,
          computed_hash: hashData.computedHash,
          received_hash: hashData.receivedHash,
          hash_verified: hashData.verified || false,
          verification_algorithm: hashData.algorithm,
          test_case_reference: hashData.testCaseReference,
          generated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to create hash verification: ${error.message}`);
      }
    } catch (error) {
      console.error('Hash verification error:', error);
      throw error;
    }
  }

  /**
   * Check if a transaction already exists to prevent replay attacks
   */
  async checkTransactionExists(params: {
    orderId: string;
    hdfcOrderId: string;
    signature: string;
  }): Promise<TransactionDetail | null> {
    try {
      const { data, error } = await this.supabase
        .from('transaction_details')
        .select('*')
        .or(`order_id.eq.${params.orderId},hdfc_order_id.eq.${params.hdfcOrderId},computed_signature.eq.${params.signature}`)
        .limit(1);

      if (error) {
        console.error('Error checking transaction existence:', error);
        throw new Error(`Failed to check transaction existence: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error checking transaction existence:', error);
      throw error;
    }
  }

  /**
   * Get complete transaction audit trail
   */
  async getTransactionAuditTrail(orderId: string): Promise<{
    paymentSession: PaymentSession | null;
    transactions: TransactionDetail[];
    statusHistory: PaymentStatusHistory[];
    securityLogs: SecurityAuditLog[];
  }> {
    try {
      const [paymentSession, transactions, statusHistory, securityLogs] = await Promise.all([
        this.getPaymentSession(orderId),
        this.getTransactionDetails(orderId),
        this.getPaymentStatusHistory(orderId),
        this.getSecurityAuditLogs(orderId)
      ]);

      return {
        paymentSession,
        transactions,
        statusHistory,
        securityLogs
      };
    } catch (error) {
      console.error('Get audit trail error:', error);
      throw error;
    }
  }

  /**
   * Get payment status history
   */
  private async getPaymentStatusHistory(orderId: string): Promise<PaymentStatusHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('payment_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get status history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get status history error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const transactionTrackingService = new TransactionTrackingService(); 
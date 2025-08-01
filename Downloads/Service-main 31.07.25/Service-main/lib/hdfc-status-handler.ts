import { hdfcPaymentService } from './hdfc-payment';
import { transactionTrackingService } from './transaction-tracking';
import { HDFCOrderStatusResponse } from './types/payment';

// HDFC Transaction Status IDs as per official documentation
export const HDFC_STATUS = {
  NEW: 10,                     // Newly created order
  PENDING_VBV: 23,            // Authentication in progress  
  CHARGED: 21,                // Successful transaction
  AUTHORIZED: 25,             // Pre-Auth Transaction
  JUSPAY_DECLINED: 22,        // Failed due to ALT_ID generation failure
  AUTHENTICATION_FAILED: 26,   // User did not complete authentication
  AUTHORIZATION_FAILED: 27,    // Bank refused transaction
  AUTHORIZING: 28,            // Transaction pending from bank
  VOIDED: 31,                 // Void Transaction (Auth&Capture)
  VOID_INITIATED: 32,         // Void pending
  VOID_FAILED: 33,            // Void failed
  STARTED: 20,                // Transaction pending - integration error
  AUTO_REFUNDED: 36,          // Transaction automatically refunded
  CAPTURE_INITIATED: 33,      // Capture pending
  CAPTURE_FAILED: 34          // Capture failed
} as const;

// Terminal statuses (no further polling needed)
export const TERMINAL_STATUSES = [
  HDFC_STATUS.CHARGED,
  HDFC_STATUS.JUSPAY_DECLINED,
  HDFC_STATUS.AUTHENTICATION_FAILED,
  HDFC_STATUS.AUTHORIZATION_FAILED,
  HDFC_STATUS.VOIDED,
  HDFC_STATUS.VOID_FAILED,
  HDFC_STATUS.AUTO_REFUNDED,
  HDFC_STATUS.CAPTURE_FAILED
];

// Non-terminal statuses (keep polling)
export const POLLING_STATUSES = [
  HDFC_STATUS.PENDING_VBV,
  HDFC_STATUS.AUTHORIZING,
  HDFC_STATUS.VOID_INITIATED,
  HDFC_STATUS.CAPTURE_INITIATED
];

export interface TransactionStatusResult {
  orderId: string;
  status: string;
  statusId: number;
  isTerminal: boolean;
  shouldPoll: boolean;
  transactionId?: string;
  amount?: string;
  paymentMethod?: string;
  rawResponse: HDFCOrderStatusResponse;
  message: string;
  actionable: string;
}

export class HDFCStatusHandler {
  
  /**
   * Check transaction status and handle according to HDFC best practices
   */
  async checkTransactionStatus(orderId: string): Promise<TransactionStatusResult> {
    try {
      console.log(`Checking HDFC transaction status for Order ID: ${orderId}`);
      
      // Get status from HDFC Order Status Function
      const statusResponse = await hdfcPaymentService.getPaymentStatus(orderId);
      
      const statusId = statusResponse.status_id || this.getStatusIdFromString(statusResponse.status || statusResponse.order_status);
      const isTerminal = TERMINAL_STATUSES.includes(statusId as any);
      const shouldPoll = POLLING_STATUSES.includes(statusId as any);
      
      // Store/update transaction details in database
      await this.storeTransactionStatus(orderId, statusResponse);
      
      const result: TransactionStatusResult = {
        orderId,
        status: statusResponse.status || statusResponse.order_status || 'UNKNOWN',
        statusId,
        isTerminal,
        shouldPoll,
        transactionId: statusResponse.txn_id || statusResponse.transaction_id,
        amount: statusResponse.amount?.toString(),
        paymentMethod: statusResponse.payment_method,
        rawResponse: statusResponse,
        message: this.getStatusMessage(statusId),
        actionable: this.getActionable(statusId)
      };
      
      console.log('Transaction status result:', {
        orderId: result.orderId,
        status: result.status,
        statusId: result.statusId,
        isTerminal: result.isTerminal,
        shouldPoll: result.shouldPoll,
        message: result.message
      });
      
      return result;
      
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw new Error(`Failed to check transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Poll transaction status until terminal state (as per HDFC best practices)
   */
  async pollTransactionStatus(
    orderId: string, 
    maxAttempts: number = 30, 
    intervalMs: number = 5000
  ): Promise<TransactionStatusResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts} for Order ID: ${orderId}`);
      
      const result = await this.checkTransactionStatus(orderId);
      
      // If terminal status reached, return result
      if (result.isTerminal) {
        console.log(`Terminal status reached for Order ID: ${orderId}, Status: ${result.status}`);
        return result;
      }
      
      // If status indicates we should stop polling (integration error)
      if (result.statusId === HDFC_STATUS.STARTED) {
        console.error(`Integration error detected for Order ID: ${orderId}`);
        return result;
      }
      
      // Wait before next poll
      if (attempts < maxAttempts) {
        console.log(`Waiting ${intervalMs}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // Max attempts reached
    const lastResult = await this.checkTransactionStatus(orderId);
    console.warn(`Max polling attempts reached for Order ID: ${orderId}. Last status: ${lastResult.status}`);
    return lastResult;
  }
  
  /**
   * Store transaction status in database
   */
  private async storeTransactionStatus(orderId: string, statusResponse: HDFCOrderStatusResponse): Promise<void> {
    try {
      // Record the transaction response
      await transactionTrackingService.recordTransactionResponse({
        orderId: orderId,
        transactionId: statusResponse.transaction_id || orderId,
        status: statusResponse.order_status?.toUpperCase(),
        hdfcResponse: statusResponse,
        formData: statusResponse,
        signatureData: {
          signature: statusResponse.payment_gateway_response?.auth_id_code || '',
          verified: true, // HDFC Order Status API is trusted
          algorithm: 'HDFC_ORDER_STATUS'
        }
      });
      
      console.log(`Transaction status stored for Order ID: ${orderId}`);
      
    } catch (error) {
      console.warn('Failed to store transaction status:', error);
      // Don't throw - this is not critical for status checking
    }
  }
  
  /**
   * Get status ID from string (fallback)
   */
  private getStatusIdFromString(status: string): number {
    const statusUpper = status?.toUpperCase() || '';
    
    switch (statusUpper) {
      case 'CHARGED': return HDFC_STATUS.CHARGED;
      case 'FAILED': return HDFC_STATUS.AUTHENTICATION_FAILED;
      case 'PENDING': return HDFC_STATUS.PENDING_VBV;
      case 'DECLINED': return HDFC_STATUS.JUSPAY_DECLINED;
      case 'CANCELLED': return HDFC_STATUS.VOIDED;
      case 'REFUNDED': return HDFC_STATUS.AUTO_REFUNDED;
      case 'NEW': return HDFC_STATUS.NEW;
      default: return HDFC_STATUS.NEW;
    }
  }
  
  /**
   * Get human-readable status message
   */
  private getStatusMessage(statusId: number): string {
    switch (statusId) {
      case HDFC_STATUS.NEW: return 'Newly created order. Transaction not triggered.';
      case HDFC_STATUS.PENDING_VBV: return 'Authentication is in progress';
      case HDFC_STATUS.CHARGED: return 'Successful transaction';
      case HDFC_STATUS.AUTHORIZED: return 'Pre-Auth Transaction. Used only for Auth&Capture Flows';
      case HDFC_STATUS.JUSPAY_DECLINED: return 'Transaction failed due to failure of generation of ALT_ID in case of CARD Payment Mode';
      case HDFC_STATUS.AUTHENTICATION_FAILED: return 'User did not complete authentication';
      case HDFC_STATUS.AUTHORIZATION_FAILED: return 'User completed authentication, but the bank refused the transaction';
      case HDFC_STATUS.AUTHORIZING: return 'Transaction status is pending from bank';
      case HDFC_STATUS.VOIDED: return 'Void Transaction. Used only for Auth&Capture Flows';
      case HDFC_STATUS.VOID_INITIATED: return 'Void pending for the pre-authorized transaction';
      case HDFC_STATUS.VOID_FAILED: return 'Void failed for the Pre-Authorized transaction';
      case HDFC_STATUS.STARTED: return 'Transaction is pending. SmartGateway system isn\'t able to find a gateway to process a transaction';
      case HDFC_STATUS.AUTO_REFUNDED: return 'Transaction is automatically refunded';
      case HDFC_STATUS.CAPTURE_INITIATED: return 'Capture pending for the pre-authorized transaction';
      case HDFC_STATUS.CAPTURE_FAILED: return 'Capture failed for the pre-authorized transaction';
      default: return 'Unknown status';
    }
  }
  
  /**
   * Get actionable steps based on status
   */
  private getActionable(statusId: number): string {
    switch (statusId) {
      case HDFC_STATUS.NEW: return 'N/A';
      case HDFC_STATUS.PENDING_VBV: return 'Show pending screen to customers and keep polling order-status Function till you get Charged or Failed';
      case HDFC_STATUS.CHARGED: return 'Display order confirmation page to the user and fulfill the order';
      case HDFC_STATUS.AUTHORIZED: return 'Call Capture API post order fulfilment';
      case HDFC_STATUS.JUSPAY_DECLINED: return 'Display failure message and ask the user to retry';
      case HDFC_STATUS.AUTHENTICATION_FAILED: return 'Display transaction failure status to the user along with the failure reason. Allow user to retry payment';
      case HDFC_STATUS.AUTHORIZATION_FAILED: return 'Display transaction failure status to the user along with the failure reason. Allow user to retry payment';
      case HDFC_STATUS.AUTHORIZING: return 'Show pending screen to customers and keep polling order-status function till you get Charged or Failed';
      case HDFC_STATUS.VOIDED: return 'Call Void API in order to unblock the amount';
      case HDFC_STATUS.VOID_INITIATED: return 'N/A';
      case HDFC_STATUS.VOID_FAILED: return 'N/A';
      case HDFC_STATUS.STARTED: return 'This scenario is an integration error. Reach out to us with order ID details for clarification';
      case HDFC_STATUS.AUTO_REFUNDED: return 'Display the refund status to the user and keep polling order-status function till you get Success or Failure';
      case HDFC_STATUS.CAPTURE_INITIATED: return 'N/A';
      case HDFC_STATUS.CAPTURE_FAILED: return 'N/A';
      default: return 'Contact support';
    }
  }
}

// Export singleton instance
export const hdfcStatusHandler = new HDFCStatusHandler(); 
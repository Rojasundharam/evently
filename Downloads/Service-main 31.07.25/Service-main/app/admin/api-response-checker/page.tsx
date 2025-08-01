'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentSession {
  id: string;
  order_id: string;
  session_id?: string;
  customer_email: string;
  amount: number;
  currency: string;
  session_status: string;
  hdfc_session_response?: any;
  created_at: string;
}

interface TransactionDetail {
  id: string;
  order_id: string;
  transaction_id?: string;
  status: string;
  transaction_amount?: number;
  hdfc_response_raw?: any;
  signature_verified: boolean;
  created_at: string;
}

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  order_id?: string;
  created_at: string;
}

interface ApiResponseData {
  paymentSession?: PaymentSession;
  transactionDetails?: TransactionDetail[];
  securityLogs?: SecurityLog[];
  hdfcStatusResponse?: any;
}

export default function ApiResponseChecker() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponseData>({});
  const [error, setError] = useState<string | null>(null);

  const handleFetchFromHDFC = async () => {
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch transaction status directly from HDFC and store in database
      const response = await fetch(`/api/admin/fetch-transaction-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          order_id: orderId.trim(),
          poll_until_terminal: false 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch from HDFC');
      }

      // After fetching from HDFC, refresh the search results
      await handleSearch();
      
    } catch (error) {
      console.error('HDFC fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch from HDFC');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    setData({});

    try {
      // Fetch all related data in parallel
      const [
        paymentSessionRes,
        transactionDetailsRes,
        securityLogsRes,
        hdfcStatusRes
      ] = await Promise.allSettled([
        // Get payment session data
        fetch(`/api/admin/payment-sessions?order_id=${orderId}`),
        // Get transaction details
        fetch(`/api/admin/transaction-details?order_id=${orderId}`),
        // Get security logs
        fetch(`/api/admin/security-audit-logs?order_id=${orderId}`),
        // Get HDFC status
        fetch(`/api/payment/status?order_id=${orderId}`)
      ]);

      const results: ApiResponseData = {};

      // Process payment session response
      if (paymentSessionRes.status === 'fulfilled' && paymentSessionRes.value.ok) {
        const sessionData = await paymentSessionRes.value.json();
        console.log('Payment Session API Response:', sessionData); // Debug log
        results.paymentSession = sessionData.sessions?.[0] || sessionData.session || sessionData.data?.[0] || sessionData;
      } else {
        console.log('Payment Session API Failed:', {
          status: paymentSessionRes.status,
          error: paymentSessionRes.status === 'fulfilled' ? await paymentSessionRes.value.text() : 'Promise rejected'
        });
      }

      // Process transaction details response
      if (transactionDetailsRes.status === 'fulfilled' && transactionDetailsRes.value.ok) {
        const transactionData = await transactionDetailsRes.value.json();
        console.log('Transaction API Response:', transactionData); // Debug log
        
        // Handle different response formats
        results.transactionDetails = transactionData.transactions 
          ? (Array.isArray(transactionData.transactions) ? transactionData.transactions : [transactionData.transactions])
          : transactionData.data 
          ? (Array.isArray(transactionData.data) ? transactionData.data : [transactionData.data])
          : [];
      } else {
        console.log('Transaction API Failed:', {
          status: transactionDetailsRes.status,
          error: transactionDetailsRes.status === 'fulfilled' ? await transactionDetailsRes.value.text() : 'Promise rejected'
        });
      }

      // Process security logs response
      if (securityLogsRes.status === 'fulfilled' && securityLogsRes.value.ok) {
        const securityData = await securityLogsRes.value.json();
        console.log('Security Logs API Response:', securityData); // Debug log
        results.securityLogs = securityData.logs 
          ? (Array.isArray(securityData.logs) ? securityData.logs : [securityData.logs])
          : securityData.data 
          ? (Array.isArray(securityData.data) ? securityData.data : [securityData.data])
          : [];
      } else {
        console.log('Security Logs API Failed:', {
          status: securityLogsRes.status,
          error: securityLogsRes.status === 'fulfilled' ? await securityLogsRes.value.text() : 'Promise rejected'
        });
      }

      // Process HDFC status response
      if (hdfcStatusRes.status === 'fulfilled' && hdfcStatusRes.value.ok) {
        const hdfcData = await hdfcStatusRes.value.json();
        console.log('HDFC Status API Response:', hdfcData); // Debug log
        results.hdfcStatusResponse = hdfcData;
      } else {
        console.log('HDFC Status API Failed:', {
          status: hdfcStatusRes.status,
          error: hdfcStatusRes.status === 'fulfilled' ? await hdfcStatusRes.value.text() : 'Promise rejected'
        });
      }

      setData(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'charged' || statusLower === 'completed') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
    }
    if (statusLower === 'failed' || statusLower === 'declined') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    if (statusLower === 'pending' || statusLower === 'new') {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Response Checker</h1>
        <Badge variant="outline">Order ID Lookup</Badge>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                placeholder="Enter Order ID (e.g., ORD1753518841571869)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
            <Button 
              onClick={handleFetchFromHDFC} 
              disabled={loading || !orderId.trim()}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Fetch from HDFC
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {Object.keys(data).length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payment-session">Payment Session</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="hdfc-status">HDFC Status</TabsTrigger>
            <TabsTrigger value="security-logs">Security Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Session</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.paymentSession ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        {getStatusBadge(data.paymentSession.session_status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Amount:</span>
                        <span>{data.paymentSession.currency} {data.paymentSession.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Customer:</span>
                        <span className="text-sm">{data.paymentSession.customer_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span className="text-sm">{new Date(data.paymentSession.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No payment session found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.transactionDetails && data.transactionDetails.length > 0 ? (
                    <div className="space-y-2">
                      {data.transactionDetails.map((tx, index) => (
                        <div key={index} className="border-b pb-2 last:border-b-0">
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Amount:</span>
                            <span>INR {tx.transaction_amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Verified:</span>
                            <span>{tx.signature_verified ? '✅ Yes' : '❌ No'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No transactions found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Session Tab */}
          <TabsContent value="payment-session">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payment Session Data</CardTitle>
                {data.paymentSession && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(data.paymentSession))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {data.paymentSession ? (
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {formatJson(data.paymentSession)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No payment session data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transaction Details</CardTitle>
                {data.transactionDetails && data.transactionDetails.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(data.transactionDetails))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {data.transactionDetails && data.transactionDetails.length > 0 ? (
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {formatJson(data.transactionDetails)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No transaction data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HDFC Status Tab */}
          <TabsContent value="hdfc-status">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>HDFC Status Response</CardTitle>
                {data.hdfcStatusResponse && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(data.hdfcStatusResponse))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {data.hdfcStatusResponse ? (
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {formatJson(data.hdfcStatusResponse)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No HDFC status data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Logs Tab */}
          <TabsContent value="security-logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Security Audit Logs</CardTitle>
                {data.securityLogs && data.securityLogs.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(data.securityLogs))}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {data.securityLogs && data.securityLogs.length > 0 ? (
                  <div className="space-y-4">
                    {data.securityLogs.map((log, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={log.severity === 'high' ? 'destructive' : log.severity === 'medium' ? 'default' : 'secondary'}>
                            {log.severity}
                          </Badge>
                          <span className="font-medium">{log.event_type}</span>
                          <span className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{log.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No security logs available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 
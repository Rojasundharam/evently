'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Clock, XCircle, Search, Download, Shield, Activity } from 'lucide-react';

interface PaymentSession {
  id: string;
  order_id: string;
  customer_email: string;
  amount: number;
  currency: string;
  session_status: string;
  test_case_id?: string;
  test_scenario?: string;
  created_at: string;
}

interface TransactionDetail {
  id: string;
  order_id: string;
  transaction_id?: string;
  status: string;
  signature_verified: boolean;
  test_case_id?: string;
  vulnerability_notes?: string;
  created_at: string;
}

interface SecurityAuditLog {
  id: string;
  event_type: string;
  severity: string;
  event_description: string;
  order_id?: string;
  vulnerability_status?: string;
  detected_at: string;
}

interface BankTestCase {
  id: string;
  test_case_id: string;
  test_scenario: string;
  test_amount?: number;
  test_status: string;
  expected_result?: string;
  actual_result?: string;
  vulnerabilities_found?: string;
  execution_date?: string;
}

export default function TransactionTrackingPage() {
  const [paymentSessions, setPaymentSessions] = useState<PaymentSession[]>([]);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>([]);
  const [testCases, setTestCases] = useState<BankTestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    loadTransactionData();
  }, []);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading transaction data...');
      
      // Fetch data from APIs
      const [sessionsRes, transactionsRes, securityRes, testCasesRes] = await Promise.all([
        fetch('/api/admin/payment-sessions'),
        fetch('/api/admin/transaction-details'),
        fetch('/api/admin/security-audit-logs'),
        fetch('/api/admin/bank-test-cases')
      ]);

      console.log('📡 API Response Status:', {
        sessions: sessionsRes.status,
        transactions: transactionsRes.status,
        security: securityRes.status,
        testCases: testCasesRes.status
      });

      // Handle payment sessions
      try {
        const sessionsData = await sessionsRes.json();
        console.log('💳 Payment Sessions Response:', sessionsData);
        if (sessionsData.success && sessionsData.data) {
          setPaymentSessions(sessionsData.data);
          console.log('✅ Set payment sessions:', sessionsData.data.length, 'records');
        } else {
          console.log('❌ Payment sessions failed:', sessionsData);
          setPaymentSessions([]);
        }
      } catch (e) {
        console.error('💥 Payment sessions API error:', e);
        setPaymentSessions([]);
      }

      // Handle transactions
      try {
        const transactionsData = await transactionsRes.json();
        console.log('📊 Transaction Details Response:', transactionsData);
        if (transactionsData.success && transactionsData.data) {
          setTransactions(transactionsData.data);
          console.log('✅ Set transactions:', transactionsData.data.length, 'records');
        } else {
          console.log('❌ Transactions failed:', transactionsData);
          setTransactions([]);
        }
      } catch (e) {
        console.error('💥 Transaction details API error:', e);
        setTransactions([]);
      }

      // Handle security logs
      try {
        const securityData = await securityRes.json();
        console.log('🔒 Security Logs Response:', securityData);
        if (securityData.success && securityData.data) {
          setSecurityLogs(securityData.data);
          console.log('✅ Set security logs:', securityData.data.length, 'records');
        } else {
          console.log('❌ Security logs failed:', securityData);
          setSecurityLogs([]);
        }
      } catch (e) {
        console.error('💥 Security logs API error:', e);
        setSecurityLogs([]);
      }

      // Handle test cases
      try {
        const testCasesData = await testCasesRes.json();
        console.log('🧪 Test Cases Response:', testCasesData);
        if (testCasesData.success && testCasesData.data) {
          setTestCases(testCasesData.data);
          console.log('✅ Set test cases:', testCasesData.data.length, 'records');
        } else {
          console.log('❌ Test cases failed:', testCasesData);
          setTestCases([]);
        }
      } catch (e) {
        console.error('💥 Test cases API error:', e);
        setTestCases([]);
      }

    } catch (error) {
      console.error('💥 Error loading transaction data:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete. Final state:', {
        paymentSessions: paymentSessions.length,
        transactions: transactions.length,
        securityLogs: securityLogs.length,
        testCases: testCases.length
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'CHARGED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'created': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'passed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'running': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status?.toUpperCase()}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportData = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = (data: any[], searchField: string) => {
    if (!searchQuery) return data;
    return data.filter(item => 
      item[searchField]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.test_case_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🏦 HDFC Bank Testing Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete transaction tracking and audit trail for bank testing process</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadTransactionData()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by Order ID, Test Case ID, or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentSessions.length}</div>
            <p className="text-xs text-muted-foreground">Payment sessions created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">HDFC responses received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              {securityLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length} high/critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCases.length}</div>
            <p className="text-xs text-muted-foreground">
              {testCases.filter(tc => tc.test_status === 'passed').length} passed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">Payment Sessions</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
          <TabsTrigger value="security">Security Audit Log</TabsTrigger>
          <TabsTrigger value="testcases">Bank Test Cases</TabsTrigger>
        </TabsList>

        {/* Payment Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Sessions</CardTitle>
                <CardDescription>All payment sessions created for bank testing</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => exportData(paymentSessions, 'payment_sessions')}
                disabled={paymentSessions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Case</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData(paymentSessions, 'customer_email').map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">{session.order_id}</TableCell>
                      <TableCell>{session.customer_email}</TableCell>
                      <TableCell>{session.currency} {session.amount?.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(session.session_status)}</TableCell>
                      <TableCell>
                        {session.test_case_id ? (
                          <Badge variant="outline">{session.test_case_id}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(session.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData(paymentSessions, 'customer_email').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {paymentSessions.length === 0 ? 'No payment sessions found. Start testing to see data here.' : 'No sessions match your search.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Details Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>HDFC transaction responses and verification results</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => exportData(transactions, 'transaction_details')}
                disabled={transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Test Case</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData(transactions, 'order_id').map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.order_id}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.transaction_id || '-'}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.signature_verified ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.test_case_id ? (
                          <Badge variant="outline">{transaction.test_case_id}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.vulnerability_notes ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Issues Found
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Clean</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData(transactions, 'order_id').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {transactions.length === 0 ? 'No transactions found. Complete payments to see data here.' : 'No transactions match your search.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Audit Log Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Audit Log</CardTitle>
                <CardDescription>Vulnerabilities and security events detected during testing</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => exportData(securityLogs, 'security_audit_log')}
                disabled={securityLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData(securityLogs, 'event_description').map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          <span className="capitalize">{log.severity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.event_description}>
                        {log.event_description}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.order_id || '-'}</TableCell>
                      <TableCell>
                        {log.vulnerability_status ? (
                          getStatusBadge(log.vulnerability_status)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(log.detected_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData(securityLogs, 'event_description').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {securityLogs.length === 0 ? 'No security events logged yet. Events will appear here during testing.' : 'No events match your search.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Test Cases Tab */}
        <TabsContent value="testcases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Test Cases</CardTitle>
                <CardDescription>30-35 test cases for HDFC bank testing validation</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => exportData(testCases, 'bank_test_cases')}
                disabled={testCases.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Case ID</TableHead>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>Executed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData(testCases, 'test_scenario').map((testCase) => (
                    <TableRow key={testCase.id}>
                      <TableCell>
                        <Badge variant="outline">{testCase.test_case_id}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={testCase.test_scenario}>
                        {testCase.test_scenario}
                      </TableCell>
                      <TableCell>
                        {testCase.test_amount ? `₹${testCase.test_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{testCase.expected_result || '-'}</TableCell>
                      <TableCell>{testCase.actual_result || '-'}</TableCell>
                      <TableCell>{getStatusBadge(testCase.test_status)}</TableCell>
                      <TableCell>
                        {testCase.vulnerabilities_found ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Found
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {testCase.execution_date ? 
                          new Date(testCase.execution_date).toLocaleString() : 
                          '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData(testCases, 'test_scenario').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {testCases.length === 0 ? 'No test cases found. Run the migration to load pre-configured test cases.' : 'No test cases match your search.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Bank Testing Information</h3>
          </div>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Step 1:</strong> Transaction Testing (30-35 test cases) - ✅ Database ready</p>
            <p><strong>Step 2:</strong> Vulnerability Reporting - ✅ Security audit log active</p>
            <p><strong>Step 3:</strong> Fix Tracking - ✅ Resolution workflow implemented</p>
            <p><strong>Step 4:</strong> Hash Verification - ✅ Hash validation system ready</p>
            <p className="mt-3 text-blue-600"><strong>Note:</strong> Database will not be cleared until testing completion as requested.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
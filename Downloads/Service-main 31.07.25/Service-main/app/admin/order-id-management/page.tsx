'use client';

import { useState, useEffect } from 'react';
import { transactionTrackingService } from '@/lib/transaction-tracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface OrderStatistics {
  totalOrders: number;
  uniqueOrderIds: number;
  duplicateCount: number;
  latestOrderId: string;
  oldestOrderId: string;
}

interface OrderValidation {
  orderId: string;
  isValid: boolean;
  validationMessage: string;
}

export default function OrderIdManagementPage() {
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [validations, setValidations] = useState<OrderValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ cleanedCount: number; duplicateCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await transactionTrackingService.getOrderIdStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const validateOrderIds = async () => {
    setLoading(true);
    setError(null);
    try {
      const validationResults = await transactionTrackingService.validateAllOrderIds();
      setValidations(validationResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate order IDs');
    } finally {
      setLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    setCleaning(true);
    setError(null);
    try {
      const result = await transactionTrackingService.cleanupDuplicateOrderIds();
      setCleanupResult(result);
      // Reload statistics after cleanup
      await loadStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup duplicates');
    } finally {
      setCleaning(false);
    }
  };

  const generateTestOrderId = async () => {
    setLoading(true);
    setError(null);
    try {
      const newOrderId = await transactionTrackingService.generateUniqueOrderId();
      alert(`Generated unique order ID: ${newOrderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate order ID');
    } finally {
      setLoading(false);
    }
  };

  const checkMigrationNeeded = async () => {
    setLoading(true);
    setError(null);
    try {
      const migrationData = await transactionTrackingService.checkOrderIdsForMigration();
      const needsMigration = migrationData.filter(item => item.needsMigration);
      
      if (needsMigration.length > 0) {
        alert(`${needsMigration.length} order IDs need migration to new format. Check the validation results below.`);
        // Trigger validation to show the results
        await validateOrderIds();
      } else {
        alert('All order IDs are already in the new format!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check migration status');
    } finally {
      setLoading(false);
    }
  };

  const migrateOrderIds = async () => {
    if (!confirm('This will update all existing order IDs to the new format. This action cannot be undone. Continue?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await transactionTrackingService.migrateOrderIdsToNewFormat();
      alert(`Migration completed! ${result.migratedCount} order IDs migrated.`);
      // Reload statistics after migration
      await loadStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate order IDs');
    } finally {
      setLoading(false);
    }
  };

  const checkEnhancedMigrationReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const readiness = await transactionTrackingService.checkMigrationReadiness();
      
      const message = `
Migration Readiness Check:
- Total Order IDs: ${readiness.totalOrderIds}
- Enhanced Format: ${readiness.enhancedFormatCount}
- Old Format: ${readiness.oldFormatCount}
- Basic Format: ${readiness.basicFormatCount}
- Invalid Format: ${readiness.invalidFormatCount}
- Ready for Migration: ${readiness.readyForMigration ? 'YES' : 'NO'}
      `;
      
      alert(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check migration readiness');
    } finally {
      setLoading(false);
    }
  };

  const migrateAllToEnhancedFormat = async () => {
    if (!confirm('This will migrate ALL order IDs to the enhanced format with UUID. This action cannot be undone. Continue?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await transactionTrackingService.migrateAllOrderIdsToEnhancedFormat();
      
      alert(`Enhanced Migration Completed!
- Total Processed: ${result.totalProcessed}
- Migrated: ${result.migratedCount}
- Skipped (already enhanced): ${result.skippedCount}
- Errors: ${result.errorCount}
      `);
      
      // Reload statistics after migration
      await loadStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate to enhanced format');
    } finally {
      setLoading(false);
    }
  };

  const addEnhancedFormatConstraint = async () => {
    if (!confirm('This will add a constraint requiring all order IDs to use the enhanced format. Continue?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const success = await transactionTrackingService.addEnhancedFormatConstraint();
      
      if (success) {
        alert('Enhanced format constraint added successfully!');
      } else {
        alert('Could not add constraint. Some order IDs may not be in enhanced format.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add enhanced format constraint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order ID Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage unique order IDs to prevent duplication
          </p>
        </div>
        <Button
          onClick={loadStatistics}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Order IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics?.uniqueOrderIds || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duplicates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.duplicateCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statistics ? (
              <Badge variant={statistics.duplicateCount > 0 ? "destructive" : "default"}>
                {statistics.duplicateCount > 0 ? "Has Duplicates" : "Clean"}
              </Badge>
            ) : (
              <Badge variant="secondary">Loading...</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage order IDs and check for duplicates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={validateOrderIds}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Validate All Order IDs
            </Button>

            <Button
              onClick={cleanupDuplicates}
              disabled={cleaning || (statistics?.duplicateCount || 0) === 0}
              variant="destructive"
            >
              {cleaning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Clean Up Duplicates
            </Button>

            <Button
              onClick={generateTestOrderId}
              disabled={loading}
              variant="secondary"
            >
              Generate Test Order ID
            </Button>

            <Button
              onClick={checkMigrationNeeded}
              disabled={loading}
              variant="outline"
            >
              Check Migration Needed
            </Button>

            <Button
              onClick={migrateOrderIds}
              disabled={loading}
              variant="outline"
            >
              Migrate Order IDs
            </Button>

            <Button
              onClick={checkEnhancedMigrationReadiness}
              disabled={loading}
              variant="outline"
            >
              Check Enhanced Migration Readiness
            </Button>

            <Button
              onClick={migrateAllToEnhancedFormat}
              disabled={loading}
              variant="outline"
            >
              Migrate All to Enhanced Format
            </Button>

            <Button
              onClick={addEnhancedFormatConstraint}
              disabled={loading}
              variant="outline"
            >
              Add Enhanced Format Constraint
            </Button>
          </div>

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Cleanup completed! {cleanupResult.cleanedCount} duplicate(s) fixed out of {cleanupResult.duplicateCount} found.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order ID Validation Results</CardTitle>
            <CardDescription>
              {validations.length} order IDs checked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validations.map((validation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {validation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{validation.orderId}</span>
                  </div>
                  <Badge variant={validation.isValid ? "default" : "destructive"}>
                    {validation.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order ID Details */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>Order ID Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Latest Order ID</h4>
                <p className="font-mono text-sm bg-muted p-2 rounded">
                  {statistics.latestOrderId || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Oldest Order ID</h4>
                <p className="font-mono text-sm bg-muted p-2 rounded">
                  {statistics.oldestOrderId || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
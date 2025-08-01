'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { DatabaseSetup } from '@/lib/database-setup';

interface DatabaseStatus {
  isReady: boolean;
  missingTables: string[];
  issues: string[];
  recommendations: string[];
}

export function DatabaseStatusBanner() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const dbStatus = await DatabaseSetup.getDatabaseStatus();
      setStatus(dbStatus);
      
      // Auto-expand if there are issues
      if (!dbStatus.isReady) {
        setExpanded(true);
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Don't show banner if database is ready
  if (status?.isReady || loading) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-yellow-800">
                Database Setup Required
              </h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-yellow-700 mt-1">
              Some database tables are missing. The system is using fallback data.
            </p>

            {expanded && status && (
              <div className="mt-3 space-y-3">
                {status.missingTables.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800 text-sm">Missing Tables:</h5>
                    <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                      {status.missingTables.map(table => (
                        <li key={table}>{table}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {status.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800 text-sm">How to Fix:</h5>
                    <div className="text-sm text-yellow-700 mt-1 space-y-1">
                      {status.recommendations.map((rec, index) => (
                        <div key={index} className="whitespace-pre-line">{rec}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-yellow-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    onClick={() => {
                      window.open('https://supabase.com/docs/guides/database/connecting-to-postgres', '_blank');
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    View Database Setup Guide
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseStatusBanner; 
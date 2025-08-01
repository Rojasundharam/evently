'use client';

import React from 'react';
import { ServiceRequestStats } from '@/hooks/useServiceRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PauseCircleIcon, 
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  FileText,
  AlertCircleIcon
} from 'lucide-react';

interface ServiceRequestsDashboardProps {
  stats: ServiceRequestStats;
  loading: boolean;
}

export default function ServiceRequestsDashboard({ stats, loading }: ServiceRequestsDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const approvalRate = stats.total > 0 ? ((stats.approved + stats.completed) / stats.total) * 100 : 0;
  const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
  const pendingRate = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All service requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ClockIcon className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>
              Current status of all service requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <span className="text-sm text-gray-600">{stats.pending}</span>
                </div>
                <span className="text-sm font-medium">{pendingRate.toFixed(1)}%</span>
              </div>
              <Progress value={pendingRate} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                  <span className="text-sm text-gray-600">{stats.approved}</span>
                </div>
                <span className="text-sm font-medium">{approvalRate.toFixed(1)}%</span>
              </div>
              <Progress value={approvalRate} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                  <span className="text-sm text-gray-600">{stats.completed}</span>
                </div>
                <span className="text-sm font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                  <span className="text-sm text-gray-600">{stats.rejected}</span>
                </div>
                <span className="text-sm font-medium">{rejectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={rejectionRate} className="h-2" />
            </div>

            {stats.cancelled > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800">
                      <PauseCircleIcon className="w-3 h-3 mr-1" />
                      Cancelled
                    </Badge>
                    <span className="text-sm text-gray-600">{stats.cancelled}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress value={stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Level Distribution</CardTitle>
            <CardDescription>
              Distribution of requests by approval level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.byLevel).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.byLevel)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([level, count]) => {
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Level {level}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count}</span>
                            <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No approval level data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Requested Services</CardTitle>
          <CardDescription>
            Services with the highest number of requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byService).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.byService)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([service, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={service} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate max-w-[200px]" title={service}>
                          {service}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No service data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Approvers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.pending > 10 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4" />
              High Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              You have {stats.pending} pending requests that may need attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
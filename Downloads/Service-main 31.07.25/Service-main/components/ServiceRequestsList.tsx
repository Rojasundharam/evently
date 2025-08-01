import React from 'react'
import { useState } from 'react'
import { ServiceRequest } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ChevronDownIcon, ChevronRightIcon, CheckIcon, XIcon } from 'lucide-react'

interface ServiceRequestsListProps {
  requests: ServiceRequest[]
  isLoading: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

export default function ServiceRequestsList({ 
  requests, 
  isLoading, 
  onApprove, 
  onReject 
}: ServiceRequestsListProps) {
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
  const isMobile = useMediaQuery('md')

  const toggleRequestDetails = (id: string) => {
    setExpandedRequestId(prev => prev === id ? null : id)
  }

  const getStatusBadge = (status: ServiceRequest['status']) => {
    const statusStyles: Record<ServiceRequest['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    return (
      <Badge className={statusStyles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading requests...</div>
  }

  if (requests.length === 0) {
    return <div className="text-center py-4">No requests found</div>
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {requests.map(request => (
          <div 
            key={request.id} 
            className="border rounded-lg overflow-hidden bg-card shadow-sm"
          >
            <div 
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleRequestDetails(request.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{request.service_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{request.requester_name}</p>
                <div className="mt-2">{getStatusBadge(request.status)}</div>
              </div>
              <div className="flex items-center ml-4">
                <span className="text-xs text-muted-foreground mr-2 whitespace-nowrap">
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
                {expandedRequestId === request.id ? 
                  <ChevronDownIcon className="h-5 w-5 flex-shrink-0" /> : 
                  <ChevronRightIcon className="h-5 w-5 flex-shrink-0" />
                }
              </div>
            </div>
            
            {expandedRequestId === request.id && (
              <div className="p-4 bg-muted/50 border-t">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-sm font-medium">{request.level} / {request.max_approval_level}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Updated</p>
                      <p className="text-sm font-medium">
                        {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Request ID</p>
                    <p className="text-sm break-all font-mono text-xs">{request.id}</p>
                  </div>
                  
                  {request.status === 'pending' && onApprove && onReject && (
                    <div className="flex space-x-3 mt-3 pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="flex-1 h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(request.id);
                        }}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject(request.id);
                        }}
                      >
                        <XIcon className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <React.Fragment key={request.id}>
              <TableRow>
                <TableCell className="font-medium">{request.service_name}</TableCell>
                <TableCell>{request.requester_name}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {request.level} / {request.max_approval_level}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleRequestDetails(request.id)}
                  >
                    {expandedRequestId === request.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRequestId === request.id && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/50 p-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-base">Request Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Request ID:</p>
                          <p className="text-sm font-medium font-mono">{request.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Service ID:</p>
                          <p className="text-sm font-medium">{request.service_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Requester ID:</p>
                          <p className="text-sm font-medium">{request.requester_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Updated:</p>
                          <p className="text-sm font-medium">
                            {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && onApprove && onReject && (
                        <div className="flex space-x-3">
                          <Button 
                            size="sm"
                            className="px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(request.id);
                            }}
                          >
                            <CheckIcon className="h-4 w-4 mr-2" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="px-4" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject(request.id);
                            }}
                          >
                            <XIcon className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
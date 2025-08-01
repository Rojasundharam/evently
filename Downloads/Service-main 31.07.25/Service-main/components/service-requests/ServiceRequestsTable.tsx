'use client';

import React, { useState, useMemo } from 'react';
import { ServiceRequest } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  MoreHorizontalIcon, 
  EyeIcon, 
  CheckIcon, 
  XIcon, 
  FilterIcon, 
  DownloadIcon, 
  RefreshCwIcon,
  SearchIcon,
  CalendarIcon,
  UserIcon,
  FileText,
  ClockIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface ServiceRequestsTableProps {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onBulkApprove: (ids: string[]) => Promise<void>;
  onBulkReject: (ids: string[], reason?: string) => Promise<void>;
  onRefresh: () => void;
  onExport: () => void;
  canApprove: (request: ServiceRequest) => boolean;
  canReject: (request: ServiceRequest) => boolean;
  canCancel: (request: ServiceRequest) => boolean;
  canComplete: (request: ServiceRequest) => boolean;
  getStatusColor: (status: string) => string;
}

type SortField = 'created_at' | 'service_name' | 'requester_name' | 'status' | 'level';
type SortOrder = 'asc' | 'desc';

export default function ServiceRequestsTable({
  requests,
  loading,
  error,
  onApprove,
  onReject,
  onCancel,
  onComplete,
  onBulkApprove,
  onBulkReject,
  onRefresh,
  onExport,
  canApprove,
  canReject,
  canCancel,
  canComplete,
  getStatusColor
}: ServiceRequestsTableProps) {
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  // Filtered and sorted requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'service_name':
          aValue = a.service_name || '';
          bValue = b.service_name || '';
          break;
        case 'requester_name':
          aValue = a.requester_name || '';
          bValue = b.requester_name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [requests, searchTerm, statusFilter, sortField, sortOrder]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(filteredAndSortedRequests.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRequests(newSelected);
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) return;
    await onBulkApprove(Array.from(selectedRequests));
    setSelectedRequests(new Set());
  };

  const handleBulkReject = async () => {
    if (selectedRequests.size === 0) return;
    await onBulkReject(Array.from(selectedRequests), bulkRejectReason);
    setSelectedRequests(new Set());
    setBulkRejectReason('');
  };

  // Individual actions
  const handleApprove = async (id: string) => {
    await onApprove(id, approveNotes);
    setApproveNotes('');
  };

  const handleReject = async (id: string) => {
    await onReject(id, rejectReason);
    setRejectReason('');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCwIcon className="w-6 h-6 animate-spin mr-2" />
        <span>Loading service requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-md">
        <p className="font-semibold">Error loading service requests:</p>
        <p>{error}</p>
        <Button onClick={onRefresh} className="mt-2">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedRequests.size > 0 && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Bulk Approve ({selectedRequests.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Approve Requests</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to approve {selectedRequests.size} selected requests?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <Button onClick={handleBulkApprove} className="w-full">
                      Approve Selected
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <XIcon className="w-4 h-4 mr-2" />
                    Bulk Reject ({selectedRequests.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Reject Requests</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to reject {selectedRequests.size} selected requests?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Rejection reason (optional)"
                      value={bulkRejectReason}
                      onChange={(e) => setBulkRejectReason(e.target.value)}
                    />
                    <Button onClick={handleBulkReject} variant="destructive" className="w-full">
                      Reject Selected
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onExport} variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredAndSortedRequests.length > 0 &&
                    selectedRequests.size === filteredAndSortedRequests.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('service_name')}
              >
                <div className="flex items-center">
                  Service
                  <SortIcon field="service_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('requester_name')}
              >
                <div className="flex items-center">
                  Requester
                  <SortIcon field="requester_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center">
                  Level
                  <SortIcon field="level" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRequests.has(request.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRequest(request.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{request.service_name}</div>
                    {request.service_category && (
                      <div className="text-sm text-gray-500">{request.service_category}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{request.requester_name}</div>
                    {request.requester_email && (
                      <div className="text-sm text-gray-500">{request.requester_email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {request.level}/{request.max_approval_level}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(request.created_at), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                        <EyeIcon className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {canApprove(request) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <CheckIcon className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Request</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to approve this request?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Approval notes (optional)"
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                              />
                              <Button onClick={() => handleApprove(request.id)} className="w-full">
                                Approve Request
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {canReject(request) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <XIcon className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Request</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to reject this request?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Rejection reason (optional)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                              <Button 
                                onClick={() => handleReject(request.id)} 
                                variant="destructive" 
                                className="w-full"
                              >
                                Reject Request
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {canCancel(request) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <XIcon className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this request? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onCancel(request.id)}>
                                Cancel Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {canComplete(request) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <CheckIcon className="mr-2 h-4 w-4" />
                              Complete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Complete Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this request as completed?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onComplete(request.id)}>
                                Complete Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {filteredAndSortedRequests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No service requests found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Request details modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Service Request Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-sm font-semibold">{selectedRequest.service_name}</p>
                  {selectedRequest.service_category && (
                    <p className="text-xs text-gray-500">{selectedRequest.service_category}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Requester</label>
                  <p className="text-sm font-semibold">{selectedRequest.requester_name}</p>
                  {selectedRequest.requester_email && (
                    <p className="text-xs text-gray-500">{selectedRequest.requester_email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Approval Level</label>
                  <p className="text-sm">{selectedRequest.level}/{selectedRequest.max_approval_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{format(new Date(selectedRequest.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated</label>
                  <p className="text-sm">{format(new Date(selectedRequest.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                  <p className="text-sm bg-red-50 p-3 rounded-md mt-1">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
"use client";

import { LeaveRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Calendar, User, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface LeaveRequestDetailsDialogProps {
  request: (Omit<LeaveRequest, 'employee'> & { employee: { first_name: string; last_name: string } }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAdmin?: boolean;
}

export function LeaveRequestDetailsDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isAdmin = false,
}: LeaveRequestDetailsDialogProps) {
  if (!request) return null;

  const handleDownloadDocument = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Get file extension from URL
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "paid":
        return "Paid Leave";
      case "sick":
        return "Sick Leave";
      case "unpaid":
        return "Unpaid Leave";
      default:
        return type;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "paid":
        return "bg-blue-100 text-blue-700";
      case "sick":
        return "bg-orange-100 text-orange-700";
      case "unpaid":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Leave Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {request.employee.first_name} {request.employee.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Submitted on {format(new Date(request.created_at), "dd MMM yyyy 'at' HH:mm")}
                </span>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Leave Type</label>
                <div className="mt-1">
                  <Badge className={getLeaveTypeColor(request.leave_type)}>
                    {getLeaveTypeLabel(request.leave_type)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <p className="mt-1 text-sm">
                  {format(new Date(request.start_date), "dd MMM yyyy")}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm">
                  {format(new Date(request.end_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-sm">
                  {request.allocation} day{request.allocation !== 1 ? 's' : ''}
                </p>
              </div>

              {request.reviewed_by && request.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} At
                  </label>
                  <p className="mt-1 text-sm">
                    {format(new Date(request.reviewed_at), "dd MMM yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {request.remarks && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Remarks
              </label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{request.remarks}</p>
              </div>
            </div>
          )}

          {/* Admin Comment */}
          {request.admin_comment && (
            <div>
              <label className="text-sm font-medium text-gray-700">Admin Comment</label>
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">{request.admin_comment}</p>
              </div>
            </div>
          )}

          {/* Document Section */}
          {request.attachment_url && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Attached Document
              </label>
              <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Leave Certificate/Document
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(request.attachment_url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(
                        request.attachment_url!,
                        `leave-document-${request.employee.first_name}-${request.employee.last_name}-${format(new Date(request.start_date), 'yyyy-MM-dd')}`
                      )}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons for Admin */}
          {isAdmin && request.status === "pending" && onApprove && onReject && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onReject(request.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Reject Request
              </Button>
              <Button
                onClick={() => onApprove(request.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Request
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
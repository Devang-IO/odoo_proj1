"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Check, X, Plus, FileText, Download, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { LeaveRequest, LeaveBalance } from "@/types";
import { useCurrentEmployee } from "@/hooks/use-current-employee";
import { NewLeaveRequestDialog } from "@/components/time-off/new-leave-request-dialog";
import { LeaveRequestDetailsDialog } from "@/components/time-off/leave-request-details-dialog";
import { StorageTest } from "@/components/debug/storage-test";
import { DatabaseCheck } from "@/components/debug/database-check";

interface LeaveRequestWithEmployee extends Omit<LeaveRequest, 'employee'> {
  employee: {
    first_name: string;
    last_name: string;
  };
}

export default function TimeOffPage() {
  const supabase = createClient();
  const { user, employee, isAdmin, loading: userLoading } = useCurrentEmployee();
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const fetchLeaveRequests = async () => {
    if (!employee && !isAdmin) return;
    
    setLoading(true);

    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        employee:employees(first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    // If not admin, only fetch own requests
    if (!isAdmin && employee) {
      query = query.eq("employee_id", employee.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leave requests:", error);
    } else {
      console.log("Fetched leave requests:", data);
      // Log attachment URLs for debugging
      data?.forEach(request => {
        if (request.attachment_url) {
          console.log(`Request ${request.id} has attachment: ${request.attachment_url}`);
        } else {
          console.log(`Request ${request.id} has no attachment`);
        }
      });
      setLeaveRequests(data || []);
    }

    // Fetch leave balance for employee
    if (!isAdmin && employee) {
      const currentYear = new Date().getFullYear();
      const { data: balanceData } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("year", currentYear)
        .single();

      if (balanceData) {
        setLeaveBalance(balanceData);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchLeaveRequests();
    }
  }, [userLoading, employee, isAdmin]);

  const handleApprove = async (id: string) => {
    console.log("Attempting to approve request:", id);
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error approving leave:", error);
      alert(`Failed to approve leave request: ${error.message}`);
    } else {
      console.log("Successfully approved request");
      fetchLeaveRequests();
      setShowDetailsDialog(false);
    }
  };

  const handleReject = async (id: string) => {
    console.log("Attempting to reject request:", id);
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting leave:", error);
      alert(`Failed to reject leave request: ${error.message}`);
    } else {
      console.log("Successfully rejected request");
      fetchLeaveRequests();
      setShowDetailsDialog(false);
    }
  };

  const handleRowClick = (request: LeaveRequestWithEmployee) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const filteredRequests = leaveRequests.filter((request) => {
    if (!searchQuery || !isAdmin) return true;
    const fullName = `${request.employee.first_name} ${request.employee.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "paid":
        return "text-purple-600";
      case "sick":
        return "text-orange-600";
      case "unpaid":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "paid":
        return "Paid Time Off";
      case "sick":
        return "Sick Leave";
      case "unpaid":
        return "Unpaid Leave";
      default:
        return type;
    }
  };

  if (userLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      {/* Debug Components - Remove in production */}
      {isAdmin && (
        <div className="mb-4 space-y-4">
          <StorageTest />
          <DatabaseCheck />
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-100 border border-blue-300 rounded-t-lg px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="font-medium">Time Off</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaveRequests}
            className="flex items-center gap-2 bg-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls & Balance */}
      <div className="bg-white border-x border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* NEW Button (Employee) */}
            {!isAdmin && (
              <Button
                onClick={() => setShowNewDialog(true)}
                className="bg-pink-400 hover:bg-pink-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW
              </Button>
            )}

            {/* Search (Admin) */}
            {isAdmin && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
          </div>

          {/* Leave Balance (Employee) */}
          {!isAdmin && leaveBalance && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-purple-600 font-medium">Paid Time Off</p>
                <p className="text-sm text-gray-600">{leaveBalance.paid_leave} Days Available</p>
              </div>
              <div className="text-center">
                <p className="text-orange-600 font-medium">Sick Time Off</p>
                <p className="text-sm text-gray-600">{leaveBalance.sick_leave} Days Available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No leave requests found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Time Off Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Document</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow 
                  key={request.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(request)}
                >
                  <TableCell>
                    {request.employee.first_name} {request.employee.last_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.start_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.end_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className={getLeaveTypeColor(request.leave_type)}>
                      {getLeaveTypeLabel(request.leave_type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {request.attachment_url ? (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          {isAdmin ? "Available" : "Uploaded"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No document</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                            title="Approve request"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
                            title="Reject request"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {request.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* New Leave Request Dialog */}
      {!isAdmin && employee && (
        <NewLeaveRequestDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          employeeId={employee.id}
          onSuccess={fetchLeaveRequests}
        />
      )}

      {/* Leave Request Details Dialog */}
      <LeaveRequestDetailsDialog
        request={selectedRequest}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onApprove={handleApprove}
        onReject={handleReject}
        isAdmin={isAdmin}
      />
    </div>
  );
}

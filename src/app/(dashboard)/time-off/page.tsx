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
import { Search, Check, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { LeaveRequest, LeaveBalance } from "@/types";
import { useCurrentEmployee } from "@/hooks/use-current-employee";
import { NewLeaveRequestDialog } from "@/components/time-off/new-leave-request-dialog";

interface LeaveRequestWithEmployee extends LeaveRequest {
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
      alert("Failed to approve leave request");
    } else {
      fetchLeaveRequests();
    }
  };

  const handleReject = async (id: string) => {
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
      alert("Failed to reject leave request");
    } else {
      fetchLeaveRequests();
    }
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
      {/* Header */}
      <div className="bg-blue-100 border border-blue-300 rounded-t-lg px-4 py-2">
        <h1 className="font-medium">Time Off</h1>
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
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
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
                  {isAdmin && (
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
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
    </div>
  );
}

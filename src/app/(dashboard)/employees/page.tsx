"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee } from "@/types";
import { Plus, Search, Plane, Circle } from "lucide-react";
import { NewEmployeeDialog } from "@/components/employees/new-employee-dialog";
import { EmployeeViewDialog } from "@/components/employees/employee-view-dialog";
import { CardSkeleton } from "@/components/ui/loading-skeletons";

type AttendanceStatus = "present" | "absent" | "leave";

interface EmployeeWithStatus extends Employee {
  attendance_status?: AttendanceStatus;
}

export default function EmployeesPage() {
  const supabase = createClient();
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const { data: empData, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      setLoading(false);
      return;
    }

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("employee_id, status")
      .eq("date", today);

    const { data: leaveData } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    const attendanceMap = new Map(
      attendanceData?.map((a) => [a.employee_id, a.status]) || []
    );
    const leaveSet = new Set(leaveData?.map((l) => l.employee_id) || []);

    const employeesWithStatus: EmployeeWithStatus[] = (empData || []).map((emp) => {
      let status: AttendanceStatus = "absent";
      if (leaveSet.has(emp.id)) {
        status = "leave";
      } else if (attendanceMap.has(emp.id)) {
        const attStatus = attendanceMap.get(emp.id);
        status = attStatus === "present" || attStatus === "half-day" ? "present" : "absent";
      }
      return { ...emp, attendance_status: status };
    });

    setEmployees(employeesWithStatus);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Circle className="w-3 h-3 fill-green-500 text-green-500" />;
      case "leave":
        return <Plane className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? "No employees found" : "No employees yet"}
            </div>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search criteria" : "Click 'Add Employee' to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => setSelectedEmployee(employee)}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 relative"
              >
                <div className="absolute top-4 right-4">
                  {getStatusIcon(employee.attendance_status)}
                </div>
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-16 h-16 mb-4">
                    {employee.profile_picture && (
                      <AvatarImage src={employee.profile_picture} alt={`${employee.first_name} ${employee.last_name}`} />
                    )}
                    <AvatarFallback className="bg-gray-100 text-gray-700 text-lg font-medium">
                      {getInitials(employee.first_name, employee.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-gray-900 truncate w-full">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate w-full mt-1">
                    {employee.job_position || "No position"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <NewEmployeeDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onSuccess={fetchEmployees}
        />

        {selectedEmployee && (
          <EmployeeViewDialog
            employee={selectedEmployee}
            open={!!selectedEmployee}
            onOpenChange={(open) => !open && setSelectedEmployee(null)}
            onEmployeeDeleted={() => {
              setSelectedEmployee(null);
              fetchEmployees();
            }}
          />
        )}
      </div>
    </div>
  );
}

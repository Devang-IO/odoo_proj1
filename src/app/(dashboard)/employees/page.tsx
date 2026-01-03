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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? "No employees found" : "No employees yet. Click NEW to add one."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              onClick={() => setSelectedEmployee(employee)}
              className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow relative"
            >
              <div className="absolute top-3 right-3">
                {getStatusIcon(employee.attendance_status)}
              </div>
              <div className="flex justify-center mb-3">
                <Avatar className="w-16 h-16">
                  {employee.profile_picture && (
                    <AvatarImage src={employee.profile_picture} alt={`${employee.first_name} ${employee.last_name}`} />
                  )}
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                    {getInitials(employee.first_name, employee.last_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p className="text-center text-sm font-medium text-gray-700 truncate">
                {employee.first_name} {employee.last_name}
              </p>
            </div>
          ))}
        </div>
      )}

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
        />
      )}
    </div>
  );
}

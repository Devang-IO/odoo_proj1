"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { useCurrentEmployee } from "@/hooks/use-current-employee";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number | null;
  extra_hours: number | null;
  status: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface AttendanceStats {
  daysPresent: number;
  leavesCount: number;
  totalWorkingDays: number;
}

type ViewMode = "day" | "month";

export default function AttendancePage() {
  const supabase = createClient();
  const { user, employee, isAdmin, loading: userLoading } = useCurrentEmployee();
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ daysPresent: 0, leavesCount: 0, totalWorkingDays: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const fetchAttendance = async () => {
    if (!employee && !isAdmin) return;
    
    setLoading(true);

    let startDate: string;
    let endDate: string;

    if (viewMode === "day") {
      startDate = format(selectedDate, "yyyy-MM-dd");
      endDate = startDate;
    } else {
      startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");
    }

    let query = supabase
      .from("attendance")
      .select(`
        *,
        employee:employees(first_name, last_name)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    // If not admin, only fetch own attendance
    if (!isAdmin && employee) {
      query = query.eq("employee_id", employee.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching attendance:", error);
    } else {
      setAttendance(data || []);

      // Calculate stats for employee view
      if (!isAdmin && data) {
        const present = data.filter((r) => r.status === "present" || r.status === "half-day").length;
        const leaves = data.filter((r) => r.status === "leave").length;
        setStats({
          daysPresent: present,
          leavesCount: leaves,
          totalWorkingDays: data.length,
        });
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchAttendance();
    }
  }, [selectedDate, viewMode, userLoading, employee, isAdmin]);

  const handlePrevious = () => {
    if (viewMode === "day") {
      setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return time.substring(0, 5);
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return "-";
    return `${hours.toFixed(2)}`;
  };

  const filteredAttendance = attendance.filter((record) => {
    if (!searchQuery || !isAdmin) return true;
    const fullName = `${record.employee?.first_name} ${record.employee?.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (userLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-blue-100 border border-blue-300 rounded-t-lg px-4 py-2">
        <h1 className="font-medium">Attendance</h1>
      </div>

      {/* Controls */}
      <div className="bg-white border-x border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Month Selector (Employee view) */}
            {!isAdmin && (
              <Select
                value={format(selectedDate, "MMM")}
                onValueChange={(month) => {
                  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
                  setSelectedDate(new Date(selectedDate.getFullYear(), monthIndex, 1));
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Stats (Employee view) */}
            {!isAdmin && viewMode === "month" && (
              <div className="flex items-center gap-4 text-sm">
                <div className="px-3 py-1 bg-green-50 border border-green-200 rounded">
                  <span className="text-gray-600">Days Present:</span>{" "}
                  <span className="font-medium">{stats.daysPresent}</span>
                </div>
                <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-gray-600">Leaves:</span>{" "}
                  <span className="font-medium">{stats.leavesCount}</span>
                </div>
                <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded">
                  <span className="text-gray-600">Total Working Days:</span>{" "}
                  <span className="font-medium">{stats.totalWorkingDays}</span>
                </div>
              </div>
            )}

            {/* Search (Admin view) */}
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

          <div className="flex items-center gap-2">
            {/* Date Picker (Admin view) */}
            {isAdmin && (
              <Input
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-40"
              />
            )}

            {/* View Mode */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Date Display */}
      <div className="bg-white border-x border-gray-200 px-4 py-2 text-center">
        <p className="text-sm text-gray-600">
          {viewMode === "day"
            ? format(selectedDate, "dd MMMM yyyy")
            : format(selectedDate, "MMMM yyyy")}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No attendance records found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {isAdmin ? (
                  <TableHead>Emp</TableHead>
                ) : (
                  <TableHead>Date</TableHead>
                )}
                {isAdmin && viewMode === "month" && <TableHead>Date</TableHead>}
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Extra Hours</TableHead>
                {isAdmin && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  {isAdmin ? (
                    <TableCell>
                      {record.employee?.first_name} {record.employee?.last_name}
                    </TableCell>
                  ) : (
                    <TableCell>{format(new Date(record.date), "dd/MM/yyyy")}</TableCell>
                  )}
                  {isAdmin && viewMode === "month" && (
                    <TableCell>{format(new Date(record.date), "dd/MM/yyyy")}</TableCell>
                  )}
                  <TableCell>{formatTime(record.check_in)}</TableCell>
                  <TableCell>{formatTime(record.check_out)}</TableCell>
                  <TableCell>{formatHours(record.work_hours)}</TableCell>
                  <TableCell>{formatHours(record.extra_hours)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          record.status === "present"
                            ? "bg-green-100 text-green-700"
                            : record.status === "half-day"
                            ? "bg-yellow-100 text-yellow-700"
                            : record.status === "leave"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Employee, User } from "@/types";
import { format } from "date-fns";

const navItems = [
  { label: "Employees", href: "/employees" },
  { label: "Attendance", href: "/attendance" },
  { label: "Time Off", href: "/time-off" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [attendanceState, setAttendanceState] = useState<"check-in" | "check-out" | "done">("check-in");
  const [todayAttendance, setTodayAttendance] = useState<{ id: string; check_in: string; check_out?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) setUser(userData);

      const { data: empData } = await supabase
        .from("employees")
        .select("*, companies(*)")
        .eq("user_id", authUser.id)
        .single();

      if (empData) {
        setEmployee(empData);
        if (empData.companies) {
          setCompany(empData.companies);
        }

        // Check today's attendance
        const today = format(new Date(), "yyyy-MM-dd");
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("id, check_in, check_out")
          .eq("employee_id", empData.id)
          .eq("date", today)
          .single();

        if (attendanceData) {
          setTodayAttendance({ 
            id: attendanceData.id, 
            check_in: attendanceData.check_in,
            check_out: attendanceData.check_out 
          });
          
          // Determine attendance state
          if (attendanceData.check_out) {
            setAttendanceState("done"); // Both check-in and check-out completed
          } else if (attendanceData.check_in) {
            setAttendanceState("check-out"); // Checked in, waiting for check-out
          } else {
            setAttendanceState("check-in"); // Not checked in yet
          }
        } else {
          setAttendanceState("check-in"); // No attendance record for today
        }
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleCheckIn = async () => {
    if (!employee || attendanceState !== "check-in") return;

    const today = format(new Date(), "yyyy-MM-dd");
    const now = format(new Date(), "HH:mm:ss");

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        employee_id: employee.id,
        date: today,
        check_in: now,
        status: "present",
      })
      .select()
      .single();

    if (!error && data) {
      setTodayAttendance({ id: data.id, check_in: data.check_in });
      setAttendanceState("check-out");
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || attendanceState !== "check-out") return;

    const now = format(new Date(), "HH:mm:ss");

    const { error } = await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("id", todayAttendance.id);

    if (!error) {
      setTodayAttendance({ ...todayAttendance, check_out: now });
      setAttendanceState("done");
    }
  };

  const handleAttendanceClick = () => {
    if (attendanceState === "check-in") {
      handleCheckIn();
    } else if (attendanceState === "check-out") {
      handleCheckOut();
    }
    // Do nothing if attendanceState === "done"
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const getInitials = () => {
    if (employee) {
      return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Nav Items */}
          <div className="flex items-center space-x-8">
            <Link href="/employees" className="flex items-center space-x-3">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
              ) : (
                <span className="font-semibold text-xl text-gray-900">{company?.name || "Dayflow"}</span>
              )}
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                // Hide Employees tab for non-admin
                if (item.href === "/employees" && !isAdmin) return null;

                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Status Indicator and Profile */}
          <div className="flex items-center space-x-4">
            {/* Clickable Status Indicator - Only for employees */}
            {!isAdmin && (
              <button
                onClick={handleAttendanceClick}
                disabled={attendanceState === "done"}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  attendanceState === "check-in"
                    ? "bg-red-500 hover:bg-red-600 cursor-pointer shadow-sm"
                    : attendanceState === "check-out"
                    ? "bg-green-500 hover:bg-green-600 cursor-pointer shadow-sm"
                    : "bg-red-500 cursor-not-allowed opacity-60"
                } ${attendanceState !== "done" ? "hover:scale-125" : ""}`}
                title={
                  attendanceState === "check-in"
                    ? "Click to Check In"
                    : attendanceState === "check-out"
                    ? "Click to Check Out"
                    : "Attendance completed for today"
                }
              />
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={employee?.profile_picture || ""} />
                    <AvatarFallback className="bg-gray-100 text-gray-700 text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    My Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

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
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<{ id: string; check_in: string } | null>(null);

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
          setTodayAttendance({ id: attendanceData.id, check_in: attendanceData.check_in });
          setIsCheckedIn(!!attendanceData.check_in && !attendanceData.check_out);
        }
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleCheckIn = async () => {
    if (!employee) return;

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
      setIsCheckedIn(true);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    const now = format(new Date(), "HH:mm:ss");

    const { error } = await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("id", todayAttendance.id);

    if (!error) {
      setIsCheckedIn(false);
    }
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
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Nav Items */}
          <div className="flex items-center gap-8">
            <Link href="/employees" className="flex items-center gap-2">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-8 w-auto" />
              ) : (
                <span className="font-semibold text-lg">{company?.name || "Dayflow"}</span>
              )}
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                // Hide Employees tab for non-admin
                if (item.href === "/employees" && !isAdmin) return null;

                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Status Indicator and Profile */}
          <div className="flex items-center gap-4">
            {/* Status Indicator - Only for employees */}
            {!isAdmin && (
              <div
                className={`w-4 h-4 rounded-full ${
                  isCheckedIn ? "bg-green-500" : "bg-red-500"
                }`}
              />
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={employee?.profile_picture || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
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

                {/* Check In / Check Out - Only for employees */}
                {!isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    {!isCheckedIn ? (
                      <DropdownMenuItem onClick={handleCheckIn} className="cursor-pointer">
                        Check In →
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleCheckOut} className="cursor-pointer">
                        Check Out →
                      </DropdownMenuItem>
                    )}
                  </>
                )}

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

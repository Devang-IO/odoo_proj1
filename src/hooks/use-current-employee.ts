"use client";

import { createClient } from "@/lib/supabase/client";
import { Employee, User } from "@/types";
import { useEffect, useState } from "react";

interface CurrentEmployeeData {
  user: User | null;
  employee: Employee | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useCurrentEmployee(): CurrentEmployeeData {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Get user role
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) setUser(userData);

      // Get employee data
      const { data: empData } = await supabase
        .from("employees")
        .select("*, companies(*)")
        .eq("user_id", authUser.id)
        .single();

      if (empData) setEmployee(empData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  return {
    user,
    employee,
    isAdmin: user?.role === "admin",
    loading,
  };
}

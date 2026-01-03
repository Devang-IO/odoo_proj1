-- Fix RLS infinite recursion by dropping and recreating policies correctly
-- Run this in Supabase SQL Editor

-- First, drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Allow company creation" ON public.companies;

DROP POLICY IF EXISTS "Users can view employees from their company" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees to their company" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees from their company" ON public.employees;

DROP POLICY IF EXISTS "Users can view attendance from their company" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert attendance for their company" ON public.attendance;
DROP POLICY IF EXISTS "Users can update attendance in their company" ON public.attendance;

DROP POLICY IF EXISTS "Users can view leave requests from their company" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert leave requests for their company" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update leave requests in their company" ON public.leave_requests;

DROP POLICY IF EXISTS "Users can view leave balances from their company" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can insert leave balances for their company" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can update leave balances in their company" ON public.leave_balances;

DROP POLICY IF EXISTS "Users can view salary info from their company" ON public.salary_info;
DROP POLICY IF EXISTS "Users can insert salary info for their company" ON public.salary_info;
DROP POLICY IF EXISTS "Users can update salary info in their company" ON public.salary_info;

DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;

-- Disable RLS temporarily to avoid recursion
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create a function to get user's company_id to avoid recursion
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Re-enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies using the function

-- Users table policies
CREATE POLICY "Users can access their own record" ON public.users
FOR ALL USING (id = auth.uid());

-- Companies policies
CREATE POLICY "Users can access their company" ON public.companies
FOR ALL USING (id = get_user_company_id());

CREATE POLICY "Allow company creation during signup" ON public.companies
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Employees policies
CREATE POLICY "Users can access employees from their company" ON public.employees
FOR SELECT USING (company_id = get_user_company_id() OR user_id = auth.uid());

CREATE POLICY "Users can insert employees to their company" ON public.employees
FOR INSERT WITH CHECK (company_id = get_user_company_id() OR user_id = auth.uid());

CREATE POLICY "Users can update employees in their company" ON public.employees
FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete employees from their company" ON public.employees
FOR DELETE USING (company_id = get_user_company_id());

-- Attendance policies
CREATE POLICY "Users can access attendance from their company" ON public.attendance
FOR ALL USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE company_id = get_user_company_id()
  )
);

-- Leave requests policies
CREATE POLICY "Users can access leave requests from their company" ON public.leave_requests
FOR ALL USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE company_id = get_user_company_id()
  )
);

-- Leave balances policies
CREATE POLICY "Users can access leave balances from their company" ON public.leave_balances
FOR ALL USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE company_id = get_user_company_id()
  )
);

-- Salary info policies
CREATE POLICY "Users can access salary info from their company" ON public.salary_info
FOR ALL USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE company_id = get_user_company_id()
  )
);
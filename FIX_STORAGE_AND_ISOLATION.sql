-- Fix storage RLS policies and company data isolation
-- Run this in Supabase SQL Editor

-- 1. Fix storage bucket policies for company-logos
DROP POLICY IF EXISTS "Allow public read access on company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own company logos" ON storage.objects;

-- Create proper storage policies
CREATE POLICY "Public read access for company logos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated upload to company logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update company logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete company logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

-- 2. Add RLS policies for company data isolation

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (
  id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own company" ON public.companies
FOR UPDATE USING (
  id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- Allow inserting new companies (for signup)
CREATE POLICY "Allow company creation" ON public.companies
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Employees: Users can only see employees from their company
CREATE POLICY "Users can view employees from their company" ON public.employees
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert employees to their company" ON public.employees
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
  OR auth.uid() = user_id -- Allow self-insert during signup
);

CREATE POLICY "Users can update employees in their company" ON public.employees
FOR UPDATE USING (
  company_id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete employees from their company" ON public.employees
FOR DELETE USING (
  company_id IN (
    SELECT company_id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- Attendance: Users can only see attendance from their company
CREATE POLICY "Users can view attendance from their company" ON public.attendance
FOR SELECT USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can insert attendance for their company" ON public.attendance
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can update attendance in their company" ON public.attendance
FOR UPDATE USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

-- Leave Requests: Users can only see leave requests from their company
CREATE POLICY "Users can view leave requests from their company" ON public.leave_requests
FOR SELECT USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can insert leave requests for their company" ON public.leave_requests
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can update leave requests in their company" ON public.leave_requests
FOR UPDATE USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

-- Leave Balances: Users can only see leave balances from their company
CREATE POLICY "Users can view leave balances from their company" ON public.leave_balances
FOR SELECT USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can insert leave balances for their company" ON public.leave_balances
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can update leave balances in their company" ON public.leave_balances
FOR UPDATE USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

-- Salary Info: Users can only see salary info from their company
CREATE POLICY "Users can view salary info from their company" ON public.salary_info
FOR SELECT USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can insert salary info for their company" ON public.salary_info
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

CREATE POLICY "Users can update salary info in their company" ON public.salary_info
FOR UPDATE USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.employees my_emp ON my_emp.user_id = auth.uid()
    WHERE e.company_id = my_emp.company_id
  )
);

-- Allow users table access (needed for role checks)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own user record" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert their own user record" ON public.users
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own user record" ON public.users
FOR UPDATE USING (id = auth.uid());
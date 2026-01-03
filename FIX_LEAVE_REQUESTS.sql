-- Fix for leave request approval/rejection not working
-- Run these commands in Supabase SQL Editor

-- 1. Check if there are any RLS policies blocking updates
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leave_requests';

-- 2. If RLS is enabled but no policies exist, create basic policies
-- Allow admins to update leave requests
CREATE POLICY "Allow admins to update leave requests" ON public.leave_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow admins to select all leave requests
CREATE POLICY "Allow admins to select leave requests" ON public.leave_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow employees to select their own leave requests
CREATE POLICY "Allow employees to select own leave requests" ON public.leave_requests
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- Allow employees to insert their own leave requests
CREATE POLICY "Allow employees to insert leave requests" ON public.leave_requests
FOR INSERT WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- 3. Alternative: Disable RLS entirely (less secure but simpler)
-- Uncomment the line below if you want to disable RLS completely
-- ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
-- Dayflow HRMS Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- ============================================
-- CREATE ADMIN USER
-- Email: admin@dayflow.com
-- Password: admin@123
-- ============================================

-- Note: You need to create the admin user through Supabase Auth first
-- Go to Authentication > Users > Add User
-- Email: admin@dayflow.com
-- Password: admin@123
-- Then run the SQL below with the user's UUID

-- After creating the user in Supabase Auth, get the UUID and replace below:
-- Example: If the UUID is 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

-- Step 1: Update the users table (trigger should have created it, but update role)
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@dayflow.com';

-- Step 2: Create the default company
INSERT INTO public.companies (id, name, logo_url, prefix)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dayflow',
    NULL,
    'DF'
);

-- Step 3: Create admin employee record (run after creating auth user)
-- Replace 'YOUR_ADMIN_USER_UUID' with actual UUID from auth.users

/*
INSERT INTO public.employees (
    user_id,
    company_id,
    login_id,
    first_name,
    last_name,
    email,
    phone,
    job_position,
    department,
    date_of_joining,
    joining_serial,
    joining_year
) VALUES (
    'YOUR_ADMIN_USER_UUID',
    'a0000000-0000-0000-0000-000000000001',
    'DFAD202600001',
    'Admin',
    'User',
    'admin@dayflow.com',
    NULL,
    'Administrator',
    'Administration',
    CURRENT_DATE,
    1,
    2026
);
*/

-- ============================================
-- ALTERNATIVE: Complete setup with known UUID
-- If you want to set up everything at once,
-- use Supabase's service role to create user
-- ============================================

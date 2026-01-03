-- Dayflow HRMS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    prefix TEXT NOT NULL, -- For employee ID generation (e.g., 'OI' for Odoo India)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    login_id TEXT UNIQUE NOT NULL, -- Auto-generated: OIJODO20220001
    
    -- Basic Info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    profile_picture TEXT,
    
    -- Job Details
    job_position TEXT,
    department TEXT,
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    location TEXT,
    date_of_joining DATE NOT NULL,
    
    -- Private Info
    date_of_birth DATE,
    residing_address TEXT,
    nationality TEXT,
    personal_email TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    -- Resume/About
    about TEXT,
    what_i_love_about_job TEXT,
    interests_hobbies TEXT,
    skills TEXT[], -- Array of skills
    certifications TEXT[], -- Array of certifications
    
    -- Bank Details
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    pan_no TEXT,
    uan_no TEXT,
    emp_code TEXT,
    
    -- Serial number for ID generation (per year)
    joining_serial INTEGER NOT NULL,
    joining_year INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    work_hours DECIMAL(4,2), -- e.g., 8.50 hours
    extra_hours DECIMAL(4,2), -- Overtime
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half-day', 'leave')) DEFAULT 'absent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, date)
);

-- ============================================
-- LEAVE BALANCES TABLE
-- ============================================
CREATE TABLE public.leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    paid_leave DECIMAL(4,2) DEFAULT 24.00,
    sick_leave DECIMAL(4,2) DEFAULT 7.00,
    unpaid_leave DECIMAL(4,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, year)
);

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('paid', 'sick', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    allocation DECIMAL(4,2) NOT NULL, -- Number of days
    remarks TEXT,
    attachment_url TEXT, -- For sick leave certificates
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_comment TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALARY INFO TABLE
-- ============================================
CREATE TABLE public.salary_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Wage
    monthly_wage DECIMAL(12,2) NOT NULL DEFAULT 0,
    yearly_wage DECIMAL(14,2) GENERATED ALWAYS AS (monthly_wage * 12) STORED,
    
    -- Working Schedule
    working_days_per_week INTEGER DEFAULT 5,
    break_time_hours DECIMAL(3,2) DEFAULT 1.00,
    
    -- Salary Components (percentages)
    basic_salary_percentage DECIMAL(5,2) DEFAULT 50.00, -- 50% of wage
    hra_percentage DECIMAL(5,2) DEFAULT 50.00, -- 50% of basic
    standard_allowance_percentage DECIMAL(5,2) DEFAULT 4.167,
    performance_bonus_percentage DECIMAL(5,2) DEFAULT 8.33,
    leave_travel_allowance_percentage DECIMAL(5,2) DEFAULT 8.33,
    fixed_allowance DECIMAL(12,2), -- Remaining after all components
    
    -- PF Contribution
    pf_employee_percentage DECIMAL(5,2) DEFAULT 12.00,
    pf_employer_percentage DECIMAL(5,2) DEFAULT 12.00,
    
    -- Tax Deductions
    professional_tax DECIMAL(8,2) DEFAULT 200.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_company_id ON public.employees(company_id);
CREATE INDEX idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);
CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_balances_employee_year ON public.leave_balances(employee_id, year);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_info_updated_at BEFORE UPDATE ON public.salary_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Get next joining serial for year
-- ============================================
CREATE OR REPLACE FUNCTION get_next_joining_serial(p_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
    next_serial INTEGER;
BEGIN
    SELECT COALESCE(MAX(joining_serial), 0) + 1 INTO next_serial
    FROM public.employees
    WHERE joining_year = p_year;
    
    RETURN next_serial;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-create user record after signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: Auto-create leave balance for new employee
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_employee()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.leave_balances (employee_id, year, paid_leave, sick_leave, unpaid_leave)
    VALUES (NEW.id, EXTRACT(YEAR FROM CURRENT_DATE), 24.00, 7.00, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_employee_created
    AFTER INSERT ON public.employees
    FOR EACH ROW EXECUTE FUNCTION handle_new_employee();

-- ============================================
-- FUNCTION: Update leave balance after approval
-- ============================================
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE public.leave_balances
        SET 
            paid_leave = CASE WHEN NEW.leave_type = 'paid' THEN paid_leave - NEW.allocation ELSE paid_leave END,
            sick_leave = CASE WHEN NEW.leave_type = 'sick' THEN sick_leave - NEW.allocation ELSE sick_leave END,
            unpaid_leave = CASE WHEN NEW.leave_type = 'unpaid' THEN unpaid_leave + NEW.allocation ELSE unpaid_leave END
        WHERE employee_id = NEW.employee_id 
        AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_leave_request_approved
    AFTER UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_leave_balance_on_approval();

-- ============================================
-- FUNCTION: Calculate work hours on check-out
-- ============================================
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        NEW.work_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
        -- Extra hours if worked more than 8 hours
        IF NEW.work_hours > 8 THEN
            NEW.extra_hours = NEW.work_hours - 8;
        ELSE
            NEW.extra_hours = 0;
        END IF;
        NEW.status = CASE 
            WHEN NEW.work_hours >= 8 THEN 'present'
            WHEN NEW.work_hours >= 4 THEN 'half-day'
            ELSE 'absent'
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_attendance_hours
    BEFORE INSERT OR UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION calculate_work_hours();

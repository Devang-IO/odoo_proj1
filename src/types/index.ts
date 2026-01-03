export type UserRole = "admin" | "employee";

export type LeaveType = "paid" | "sick" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";

export type Gender = "male" | "female" | "other";



export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  prefix: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  company_id?: string;
  login_id: string;
  
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  
  // Job Details
  job_position?: string;
  department?: string;
  manager_id?: string;
  location?: string;
  date_of_joining: string;
  
  // Private Info
  date_of_birth?: string;
  residing_address?: string;
  nationality?: string;
  personal_email?: string;
  gender?: Gender;
  
  // Resume/About
  about?: string;
  what_i_love_about_job?: string;
  interests_hobbies?: string;
  skills?: string[];
  certifications?: string[];
  
  // Bank Details
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_no?: string;
  uan_no?: string;
  emp_code?: string;
  
  // For ID generation
  joining_serial: number;
  joining_year: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  company?: Company;
  manager?: Employee;
  user?: User;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  extra_hours?: number;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  
  // Joined data
  employee?: Employee;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  paid_leave: number;
  sick_leave: number;
  unpaid_leave: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  allocation: number;
  remarks?: string;
  attachment_url?: string;
  status: LeaveStatus;
  admin_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  employee?: Employee;
  reviewer?: User;
}

export interface SalaryInfo {
  id: string;
  employee_id: string;
  monthly_wage: number;
  yearly_wage: number;
  working_days_per_week: number;
  break_time_hours: number;
  basic_salary_percentage: number;
  hra_percentage: number;
  standard_allowance_percentage: number;
  performance_bonus_percentage: number;
  leave_travel_allowance_percentage: number;
  fixed_allowance?: number;
  pf_employee_percentage: number;
  pf_employer_percentage: number;
  professional_tax: number;
  created_at: string;
  updated_at: string;
}

// Form types for creating/updating
export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  job_position?: string;
  department?: string;
  manager_id?: string;
  location?: string;
  date_of_joining: string;
}

export interface CreateLeaveRequestInput {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  allocation: number;
  remarks?: string;
}

export interface CheckInInput {
  employee_id: string;
  date: string;
  check_in: string;
}

export interface CheckOutInput {
  employee_id: string;
  date: string;
  check_out: string;
}

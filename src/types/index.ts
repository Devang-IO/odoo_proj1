export type UserRole = "admin" | "hr" | "employee";

export type LeaveType = "paid" | "sick" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  employee_id: string;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  login_id: string;
  name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  company: string;
  department: string;
  job_position: string;
  manager?: string;
  location?: string;
  date_of_birth?: string;
  residing_address?: string;
  nationality?: string;
  personal_email?: string;
  gender?: string;
  marital_status?: string;
  date_of_joining: string;
  about?: string;
  what_i_love_about_job?: string;
  interests_hobbies?: string;
  skills?: string[];
  certifications?: string[];
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_no?: string;
  uan_no?: string;
  emp_code?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  paid_leave: number;
  sick_leave: number;
  unpaid_leave: number;
  year: number;
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

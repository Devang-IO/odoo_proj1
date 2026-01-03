import { SalaryInfo } from "@/types";

export interface SalaryBreakdown {
  basicSalary: number;
  hra: number;
  standardAllowance: number;
  performanceBonus: number;
  leaveTravelAllowance: number;
  fixedAllowance: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  grossSalary: number;
  netSalary: number;
}

export function calculateSalaryBreakdown(salaryInfo: SalaryInfo): SalaryBreakdown {
  const monthlyWage = salaryInfo.monthly_wage;

  const basicSalary = (monthlyWage * salaryInfo.basic_salary_percentage) / 100;
  const hra = (basicSalary * salaryInfo.hra_percentage) / 100;
  const standardAllowance = (monthlyWage * salaryInfo.standard_allowance_percentage) / 100;
  const performanceBonus = (monthlyWage * salaryInfo.performance_bonus_percentage) / 100;
  const leaveTravelAllowance = (monthlyWage * salaryInfo.leave_travel_allowance_percentage) / 100;
  
  // Fixed allowance = wage - total of all components
  const componentsTotal = basicSalary + hra + standardAllowance + performanceBonus + leaveTravelAllowance;
  const fixedAllowance = salaryInfo.fixed_allowance ?? (monthlyWage - componentsTotal);

  const pfEmployee = (basicSalary * salaryInfo.pf_employee_percentage) / 100;
  const pfEmployer = (basicSalary * salaryInfo.pf_employer_percentage) / 100;
  const professionalTax = salaryInfo.professional_tax;

  const grossSalary = basicSalary + hra + standardAllowance + performanceBonus + leaveTravelAllowance + fixedAllowance;
  const netSalary = grossSalary - pfEmployee - professionalTax;

  return {
    basicSalary,
    hra,
    standardAllowance,
    performanceBonus,
    leaveTravelAllowance,
    fixedAllowance,
    pfEmployee,
    pfEmployer,
    professionalTax,
    grossSalary,
    netSalary,
  };
}

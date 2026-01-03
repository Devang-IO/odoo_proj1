"use client";

import { SalaryInfo } from "@/types";
import { calculateSalaryBreakdown } from "@/lib/utils/salary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SalaryInfoViewProps {
  salaryInfo: SalaryInfo | null;
  isEditable?: boolean;
}

export function SalaryInfoView({ salaryInfo, isEditable = false }: SalaryInfoViewProps) {
  if (!salaryInfo) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isEditable ? "No salary information configured. Click edit to set up salary details." : "Salary information will be displayed here."}
      </div>
    );
  }

  const breakdown = calculateSalaryBreakdown(salaryInfo);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Wage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wage Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Monthly Wage</p>
              <p className="text-xl font-semibold">{formatCurrency(salaryInfo.monthly_wage)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Yearly Wage</p>
              <p className="text-xl font-semibold">{formatCurrency(salaryInfo.yearly_wage)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Working Days/Week</p>
              <p className="font-medium">{salaryInfo.working_days_per_week} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Break Time</p>
              <p className="font-medium">{salaryInfo.break_time_hours} hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Basic Salary ({salaryInfo.basic_salary_percentage}%)</span>
              <span className="font-medium">{formatCurrency(breakdown.basicSalary)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">HRA ({salaryInfo.hra_percentage}% of Basic)</span>
              <span className="font-medium">{formatCurrency(breakdown.hra)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Standard Allowance ({salaryInfo.standard_allowance_percentage}%)</span>
              <span className="font-medium">{formatCurrency(breakdown.standardAllowance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Performance Bonus ({salaryInfo.performance_bonus_percentage}%)</span>
              <span className="font-medium">{formatCurrency(breakdown.performanceBonus)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Leave Travel Allowance ({salaryInfo.leave_travel_allowance_percentage}%)</span>
              <span className="font-medium">{formatCurrency(breakdown.leaveTravelAllowance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fixed Allowance</span>
              <span className="font-medium">{formatCurrency(breakdown.fixedAllowance)}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center font-semibold">
            <span>Gross Salary</span>
            <span className="text-green-600">{formatCurrency(breakdown.grossSalary)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">PF Employee ({salaryInfo.pf_employee_percentage}% of Basic)</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.pfEmployee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Professional Tax</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.professionalTax)}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Net Salary</span>
            <span className="text-blue-600">{formatCurrency(breakdown.netSalary)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Employer Contributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employer Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">PF Employer ({salaryInfo.pf_employer_percentage}% of Basic)</span>
            <span className="font-medium text-green-600">{formatCurrency(breakdown.pfEmployer)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
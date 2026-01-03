"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SalaryInfo } from "@/types";
import { calculateSalaryBreakdown } from "@/lib/utils/salary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Calculator } from "lucide-react";

interface SalaryInfoEditProps {
  employeeId: string;
  salaryInfo: SalaryInfo | null;
  onSave: (salaryInfo: SalaryInfo) => void;
  onCancel: () => void;
}

export function SalaryInfoEdit({ employeeId, salaryInfo, onSave, onCancel }: SalaryInfoEditProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    monthly_wage: salaryInfo?.monthly_wage || 50000,
    working_days_per_week: salaryInfo?.working_days_per_week || 5,
    break_time_hours: salaryInfo?.break_time_hours || 1,
    basic_salary_percentage: salaryInfo?.basic_salary_percentage || 50,
    hra_percentage: salaryInfo?.hra_percentage || 50,
    standard_allowance_percentage: salaryInfo?.standard_allowance_percentage || 4.167,
    performance_bonus_percentage: salaryInfo?.performance_bonus_percentage || 8.33,
    leave_travel_allowance_percentage: salaryInfo?.leave_travel_allowance_percentage || 8.33,
    fixed_allowance: salaryInfo?.fixed_allowance || undefined,
    pf_employee_percentage: salaryInfo?.pf_employee_percentage || 12,
    pf_employer_percentage: salaryInfo?.pf_employer_percentage || 12,
    professional_tax: salaryInfo?.professional_tax || 200,
  });

  // Calculate preview breakdown
  const previewSalaryInfo: SalaryInfo = {
    id: salaryInfo?.id || "",
    employee_id: employeeId,
    yearly_wage: formData.monthly_wage * 12,
    created_at: salaryInfo?.created_at || "",
    updated_at: salaryInfo?.updated_at || "",
    ...formData,
    fixed_allowance: formData.fixed_allowance || undefined,
  };

  const breakdown = calculateSalaryBreakdown(previewSalaryInfo);

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const salaryData = {
        employee_id: employeeId,
        ...formData,
      };

      let result;
      if (salaryInfo) {
        // Update existing
        result = await supabase
          .from("salary_info")
          .update(salaryData)
          .eq("id", salaryInfo.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from("salary_info")
          .insert(salaryData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSave(result.data);
    } catch (err: any) {
      setError(err.message || "Failed to save salary information");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Wage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Wage Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly_wage">Monthly Wage (₹)</Label>
              <Input
                id="monthly_wage"
                type="number"
                value={formData.monthly_wage}
                onChange={(e) => handleChange("monthly_wage", parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
                required
              />
            </div>
            <div>
              <Label>Yearly Wage</Label>
              <div className="h-10 px-3 py-2 bg-gray-50 border rounded-md flex items-center">
                {formatCurrency(formData.monthly_wage * 12)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="working_days_per_week">Working Days/Week</Label>
              <Input
                id="working_days_per_week"
                type="number"
                value={formData.working_days_per_week}
                onChange={(e) => handleChange("working_days_per_week", parseInt(e.target.value) || 0)}
                min="1"
                max="7"
                required
              />
            </div>
            <div>
              <Label htmlFor="break_time_hours">Break Time (hours)</Label>
              <Input
                id="break_time_hours"
                type="number"
                value={formData.break_time_hours}
                onChange={(e) => handleChange("break_time_hours", parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Components (%)</CardTitle>
          <p className="text-sm text-gray-600">
            Define salary structure components. Each component should include computation type (Fixed Amount or Percentage of Wage).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basic_salary_percentage">Basic Salary (% of wage)</Label>
              <Input
                id="basic_salary_percentage"
                type="number"
                value={formData.basic_salary_percentage}
                onChange={(e) => handleChange("basic_salary_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.basicSalary)}
              </p>
            </div>
            <div>
              <Label htmlFor="hra_percentage">HRA (% of Basic)</Label>
              <Input
                id="hra_percentage"
                type="number"
                value={formData.hra_percentage}
                onChange={(e) => handleChange("hra_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.hra)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="standard_allowance_percentage">Standard Allowance (% of wage)</Label>
              <Input
                id="standard_allowance_percentage"
                type="number"
                value={formData.standard_allowance_percentage}
                onChange={(e) => handleChange("standard_allowance_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.standardAllowance)}
              </p>
            </div>
            <div>
              <Label htmlFor="performance_bonus_percentage">Performance Bonus (% of wage)</Label>
              <Input
                id="performance_bonus_percentage"
                type="number"
                value={formData.performance_bonus_percentage}
                onChange={(e) => handleChange("performance_bonus_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.performanceBonus)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leave_travel_allowance_percentage">Leave Travel Allowance (% of wage)</Label>
              <Input
                id="leave_travel_allowance_percentage"
                type="number"
                value={formData.leave_travel_allowance_percentage}
                onChange={(e) => handleChange("leave_travel_allowance_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.leaveTravelAllowance)}
              </p>
            </div>
            <div>
              <Label>Fixed Allowance (Auto-calculated)</Label>
              <div className="h-10 px-3 py-2 bg-gray-50 border rounded-md flex items-center">
                {formatCurrency(breakdown.fixedAllowance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Remaining amount after all components
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PF & Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PF & Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pf_employee_percentage">PF Employee (% of Basic)</Label>
              <Input
                id="pf_employee_percentage"
                type="number"
                value={formData.pf_employee_percentage}
                onChange={(e) => handleChange("pf_employee_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.pfEmployee)}
              </p>
            </div>
            <div>
              <Label htmlFor="pf_employer_percentage">PF Employer (% of Basic)</Label>
              <Input
                id="pf_employer_percentage"
                type="number"
                value={formData.pf_employer_percentage}
                onChange={(e) => handleChange("pf_employer_percentage", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount: {formatCurrency(breakdown.pfEmployer)}
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="professional_tax">Professional Tax (₹)</Label>
            <Input
              id="professional_tax"
              type="number"
              value={formData.professional_tax}
              onChange={(e) => handleChange("professional_tax", parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Salary Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gross Salary</span>
            <span className="font-semibold text-green-600">{formatCurrency(breakdown.grossSalary)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Deductions</span>
            <span className="font-semibold text-red-600">-{formatCurrency(breakdown.pfEmployee + breakdown.professionalTax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Net Salary</span>
            <span className="text-blue-600">{formatCurrency(breakdown.netSalary)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Salary Info"}
        </Button>
      </div>
    </form>
  );
}
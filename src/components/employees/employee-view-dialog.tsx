"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Employee, SalaryInfo } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { SalaryInfoView } from "./salary-info-view";
import { SalaryInfoEdit } from "./salary-info-edit";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { useCurrentEmployee } from "@/hooks/use-current-employee";

interface EmployeeViewDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeDeleted?: () => void;
}

export function EmployeeViewDialog({
  employee,
  open,
  onOpenChange,
  onEmployeeDeleted,
}: EmployeeViewDialogProps) {
  const supabase = createClient();
  const { isAdmin } = useCurrentEmployee();
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getInitials = () => {
    return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  };

  const fetchSalaryInfo = async () => {
    setLoadingSalary(true);
    const { data } = await supabase
      .from("salary_info")
      .select("*")
      .eq("employee_id", employee.id)
      .single();
    
    setSalaryInfo(data);
    setLoadingSalary(false);
  };

  useEffect(() => {
    if (open && employee.id) {
      fetchSalaryInfo();
    }
  }, [open, employee.id]);

  const handleSalarySave = (updatedSalaryInfo: SalaryInfo) => {
    setSalaryInfo(updatedSalaryInfo);
    setEditingSalary(false);
  };

  const handleEmployeeDeleted = () => {
    onOpenChange(false);
    if (onEmployeeDeleted) {
      onEmployeeDeleted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Employee Profile</DialogTitle>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Employee
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex gap-6">
            {/* Left: Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                {employee.profile_picture && (
                  <AvatarImage src={employee.profile_picture} alt={`${employee.first_name} ${employee.last_name}`} />
                )}
                <AvatarFallback className="bg-pink-100 text-pink-600 text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold italic">
                  {employee.first_name} {employee.last_name}
                </h2>
                <p className="text-sm text-gray-500">{employee.job_position}</p>
                <p className="text-sm text-gray-500">{employee.email}</p>
                <p className="text-sm text-gray-500">{employee.phone}</p>
              </div>
            </div>

            {/* Right: Company Info */}
            <div className="ml-auto text-right text-sm text-gray-600">
              <p><span className="text-gray-400">Company:</span> {employee.company?.name || "-"}</p>
              <p><span className="text-gray-400">Department:</span> {employee.department || "-"}</p>
              <p><span className="text-gray-400">Manager:</span> {employee.manager?.first_name || "-"}</p>
              <p><span className="text-gray-400">Location:</span> {employee.location || "-"}</p>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="resume">
            <TabsList>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="private">Private Info</TabsTrigger>
              <TabsTrigger value="salary">Salary Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Resume Tab */}
            <TabsContent value="resume" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-sm text-gray-600">
                      {employee.about || "No information provided."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">What I love about my job</h4>
                    <p className="text-sm text-gray-600">
                      {employee.what_i_love_about_job || "No information provided."}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">My interests and hobbies</h4>
                    <p className="text-sm text-gray-600">
                      {employee.interests_hobbies || "No information provided."}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills?.length ? (
                        employee.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No skills added</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.certifications?.length ? (
                        employee.certifications.map((cert, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {cert}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No certifications added</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Private Info Tab */}
            <TabsContent value="private" className="pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <InfoRow label="Date of Birth" value={employee.date_of_birth} />
                  <InfoRow label="Residing Address" value={employee.residing_address} />
                  <InfoRow label="Nationality" value={employee.nationality} />
                  <InfoRow label="Personal Email" value={employee.personal_email} />
                  <InfoRow label="Gender" value={employee.gender} />
                  <InfoRow label="Date of Joining" value={employee.date_of_joining} />
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Bank Details</h4>
                  <InfoRow label="Account Number" value={employee.account_number} />
                  <InfoRow label="Bank Name" value={employee.bank_name} />
                  <InfoRow label="IFSC Code" value={employee.ifsc_code} />
                  <InfoRow label="PAN No" value={employee.pan_no} />
                  <InfoRow label="UAN No" value={employee.uan_no} />
                  <InfoRow label="Emp Code" value={employee.emp_code} />
                </div>
              </div>
            </TabsContent>

            {/* Salary Info Tab */}
            <TabsContent value="salary" className="pt-4">
              {editingSalary ? (
                <SalaryInfoEdit
                  employeeId={employee.id}
                  salaryInfo={salaryInfo}
                  onSave={handleSalarySave}
                  onCancel={() => setEditingSalary(false)}
                />
              ) : (
                <div className="space-y-4">
                  {isAdmin && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSalary(true)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Salary
                      </Button>
                    </div>
                  )}
                  {loadingSalary ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading salary information...
                    </div>
                  ) : (
                    <SalaryInfoView salaryInfo={salaryInfo} isEditable={isAdmin} />
                  )}
                </div>
              )}
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="pt-4">
              <div className="space-y-3">
                <InfoRow label="Login ID" value={employee.login_id} />
                <InfoRow label="Email" value={employee.email} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Delete Employee Dialog */}
      <DeleteEmployeeDialog
        employee={employee}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleEmployeeDeleted}
      />
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex">
      <span className="text-sm text-gray-500 w-40">{label}</span>
      <span className="text-sm">{value || "-"}</span>
    </div>
  );
}

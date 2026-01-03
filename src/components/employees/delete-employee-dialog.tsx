"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Employee } from "@/types";

interface DeleteEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: DeleteEmployeeDialogProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!employee) return null;

  const expectedText = `DELETE ${employee.first_name} ${employee.last_name}`;

  const handleDelete = async () => {
    if (confirmText !== expectedText) {
      setError("Confirmation text doesn't match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Delete employee (this will cascade delete related records due to foreign key constraints)
      const { error: deleteError } = await supabase
        .from("employees")
        .delete()
        .eq("id", employee.id);

      if (deleteError) throw deleteError;

      // Delete the auth user if they have one
      if (employee.user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(employee.user_id);
        if (authError) {
          console.warn("Could not delete auth user:", authError.message);
          // Don't throw here as the employee record is already deleted
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Employee
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the employee
            and all associated data including attendance, leave requests, and salary information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Employee to be deleted:</strong><br />
              {employee.first_name} {employee.last_name}<br />
              {employee.email}<br />
              Login ID: {employee.login_id}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <code className="bg-gray-100 px-1 rounded">{expectedText}</code> to confirm:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              className={confirmText === expectedText ? "border-green-500" : ""}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || confirmText !== expectedText}
            >
              {loading ? "Deleting..." : "Delete Employee"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
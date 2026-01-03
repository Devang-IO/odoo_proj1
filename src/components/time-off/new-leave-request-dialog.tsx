"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { differenceInDays } from "date-fns";

interface NewLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  onSuccess: () => void;
}

export function NewLeaveRequestDialog({
  open,
  onOpenChange,
  employeeId,
  onSuccess,
}: NewLeaveRequestDialogProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    leaveType: "paid" as "paid" | "sick" | "unpaid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateAllocation = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return differenceInDays(end, start) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const allocation = calculateAllocation();
    if (allocation <= 0) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      let attachmentUrl = null;

      // Upload attachment if provided (for sick leave)
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split(".").pop();
        const fileName = `${employeeId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, attachmentFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("attachments")
            .getPublicUrl(fileName);
          attachmentUrl = urlData.publicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: employeeId,
          leave_type: formData.leaveType,
          start_date: formData.startDate,
          end_date: formData.endDate,
          allocation,
          remarks: formData.remarks || null,
          attachment_url: attachmentUrl,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        leaveType: "paid",
        startDate: "",
        endDate: "",
        remarks: "",
      });
      setAttachmentFile(null);

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Time Off Type Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label>Time Off Type</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(v) =>
                setFormData({ ...formData, leaveType: v as "paid" | "sick" | "unpaid" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid Time Off</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validity Period */}
          <div className="space-y-2">
            <Label>Validity Period</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <span className="text-gray-500">To</span>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Allocation */}
          <div className="space-y-2">
            <Label>Allocation</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={calculateAllocation().toFixed(2)}
                readOnly
                className="w-20 bg-gray-50"
              />
              <span className="text-gray-500">Days</span>
            </div>
          </div>

          {/* Attachment (for sick leave) */}
          {formData.leaveType === "sick" && (
            <div className="space-y-2">
              <Label>Attachment</Label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {attachmentFile ? attachmentFile.name : "Upload certificate"}
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500">(For sick leave certificate)</p>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Optional remarks..."
              rows={3}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

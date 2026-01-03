"use client";

import { useState } from "react";
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
import { Copy, Check, User, Key, Eye, EyeOff } from "lucide-react";

interface EmployeeCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: {
    loginId: string;
    password: string;
    email: string;
    name: string;
  } | null;
}

export function EmployeeCredentialsModal({
  open,
  onOpenChange,
  credentials,
}: EmployeeCredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!credentials) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    setCopiedField(null);
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <User className="w-5 h-5" />
            Employee Created Successfully
          </DialogTitle>
          <DialogDescription>
            Employee account has been created. Please share these credentials with the employee.
            <strong className="text-red-600"> This information will only be shown once.</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">
              {credentials.name} ({credentials.email})
            </p>
          </div>

          {/* Login ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Login ID
            </Label>
            <div className="flex gap-2">
              <Input
                value={credentials.loginId}
                readOnly
                className="bg-gray-50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(credentials.loginId, "loginId")}
                className="px-3"
              >
                {copiedField === "loginId" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Temporary Password
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  readOnly
                  className="bg-gray-50 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(credentials.password, "password")}
                className="px-3"
              >
                {copiedField === "password" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copy All Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const allCredentials = `Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`;
                copyToClipboard(allCredentials, "all");
              }}
            >
              {copiedField === "all" ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied All Credentials
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Credentials
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            <strong>Important:</strong> Ask the employee to change their password after first login.
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Got it, Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
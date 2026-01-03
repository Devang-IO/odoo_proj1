"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Building2, User, Mail, Phone, Lock, Image } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    companyPrefix: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate company prefix from company name
    if (name === "companyName") {
      const prefix = value.substring(0, 2).toUpperCase();
      setFormData(prev => ({ ...prev, companyPrefix: prefix }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size must be less than 5MB");
      return;
    }

    setLogoFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.companyName.trim()) {
        throw new Error("Company name is required");
      }
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        throw new Error("First name and last name are required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `company-logo-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(fileName, logoFile);

        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          // Continue without logo if upload fails
        } else {
          const { data: urlData } = supabase.storage
            .from("company-logos")
            .getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
        }
      }

      // Create auth user with admin role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            role: "admin",
            first_name: formData.firstName,
            last_name: formData.lastName
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account");

      // Create company record
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: formData.companyName,
          prefix: formData.companyPrefix || formData.companyName.substring(0, 2).toUpperCase(),
          logo_url: logoUrl,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create admin employee record
      const { error: employeeError } = await supabase
        .from("employees")
        .insert({
          user_id: authData.user.id,
          company_id: companyData.id,
          login_id: `${companyData.prefix}ADMIN001`,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          job_position: "Administrator",
          department: "Management",
          date_of_joining: new Date().toISOString().split('T')[0],
          joining_serial: 1,
          joining_year: new Date().getFullYear(),
        });

      if (employeeError) throw employeeError;

      // Redirect to sign-in page with success message
      router.push("/sign-in?message=Account created successfully! Please sign in.");

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 text-white px-6 py-3 rounded">
            <span className="text-lg font-semibold">Dayflow</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Admin Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your company and admin profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo (Optional)</Label>
            <div className="flex items-center justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Logo</span>
                    </>
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 text-center">
              PNG, JPG up to 5MB
            </p>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Name *
              </Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter your company name"
                required
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyPrefix">Company Prefix</Label>
              <Input
                id="companyPrefix"
                name="companyPrefix"
                type="text"
                value={formData.companyPrefix}
                onChange={handleChange}
                placeholder="e.g., TC"
                maxLength={4}
                className="uppercase border-gray-300"
              />
              <p className="text-xs text-gray-500">
                Used for employee ID generation (auto-generated from company name)
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  className="pr-10 border-gray-300"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                  className="pr-10 border-gray-300"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-purple-400 hover:bg-purple-500 text-white py-6"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "CREATE ADMIN ACCOUNT"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-purple-600 hover:text-purple-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
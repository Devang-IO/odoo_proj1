"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, X, Camera } from "lucide-react";
import { Employee, SalaryInfo } from "@/types";
import { useCurrentEmployee } from "@/hooks/use-current-employee";
import { SalaryInfoView } from "@/components/employees/salary-info-view";
import { ProfileSkeleton } from "@/components/ui/loading-skeletons";

export default function ProfilePage() {
  const supabase = createClient();
  const { employee: currentEmployee, isAdmin, loading: userLoading } = useCurrentEmployee();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null);
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [manager, setManager] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingPrivate, setEditingPrivate] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone: "",
    residing_address: "",
    personal_email: "",
    about: "",
    what_i_love_about_job: "",
    interests_hobbies: "",
    skills: [] as string[],
    certifications: [] as string[],
  });

  const [privateData, setPrivateData] = useState({
    date_of_birth: "",
    residing_address: "",
    nationality: "",
    personal_email: "",
    gender: "" as "" | "male" | "female" | "other",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    pan_no: "",
    uan_no: "",
    emp_code: "",
  });

  const fetchProfile = async () => {
    if (!currentEmployee) return;

    setLoading(true);

    const { data: empData } = await supabase
      .from("employees")
      .select("*")
      .eq("id", currentEmployee.id)
      .single();

    if (empData) {
      setEmployee(empData);
      setFormData({
        phone: empData.phone || "",
        residing_address: empData.residing_address || "",
        personal_email: empData.personal_email || "",
        about: empData.about || "",
        what_i_love_about_job: empData.what_i_love_about_job || "",
        interests_hobbies: empData.interests_hobbies || "",
        skills: empData.skills || [],
        certifications: empData.certifications || [],
      });
      setPrivateData({
        date_of_birth: empData.date_of_birth || "",
        residing_address: empData.residing_address || "",
        nationality: empData.nationality || "",
        personal_email: empData.personal_email || "",
        gender: empData.gender || "",
        bank_name: empData.bank_name || "",
        account_number: empData.account_number || "",
        ifsc_code: empData.ifsc_code || "",
        pan_no: empData.pan_no || "",
        uan_no: empData.uan_no || "",
        emp_code: empData.emp_code || "",
      });
      setProfilePreview(empData.profile_picture || null);

      if (empData.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", empData.company_id)
          .single();
        if (companyData) setCompany(companyData);
      }

      if (empData.manager_id) {
        const { data: managerData } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", empData.manager_id)
          .single();
        if (managerData) setManager(managerData);
      }

      const { data: salaryData, error: salaryError } = await supabase
        .from("salary_info")
        .select("*")
        .eq("employee_id", empData.id)
        .maybeSingle();

      if (salaryError) {
        console.warn("Unable to load salary info:", salaryError.message);
      }

      if (salaryData) setSalaryInfo(salaryData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading && currentEmployee) {
      fetchProfile();
    }
  }, [userLoading, currentEmployee]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePicture(file);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResume = async () => {
    if (!employee) return;

    let profilePictureUrl = employee.profile_picture;

    // Upload profile picture if changed
    if (profilePicture) {
      const fileExt = profilePicture.name.split(".").pop();
      const filePath = `${employee.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, profilePicture, {
          cacheControl: "3600",
          contentType: profilePicture.type,
        });

      if (uploadError) {
        console.error("Profile upload failed:", uploadError.message);
        alert("Failed to upload profile picture. Please try again.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);
      profilePictureUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("employees")
      .update({
        phone: formData.phone || null,
        profile_picture: profilePictureUrl,
        about: formData.about || null,
        what_i_love_about_job: formData.what_i_love_about_job || null,
        interests_hobbies: formData.interests_hobbies || null,
        skills: formData.skills,
        certifications: formData.certifications,
      })
      .eq("id", employee.id);

    if (error) {
      alert("Failed to save changes");
    } else {
      setEditing(false);
      setProfilePicture(null);
      fetchProfile();
    }
  };

  const handleSavePrivate = async () => {
    if (!employee) return;

    const { error } = await supabase
      .from("employees")
      .update({
        date_of_birth: privateData.date_of_birth || null,
        residing_address: privateData.residing_address || null,
        nationality: privateData.nationality || null,
        personal_email: privateData.personal_email || null,
        gender: privateData.gender || null,
        bank_name: privateData.bank_name || null,
        account_number: privateData.account_number || null,
        ifsc_code: privateData.ifsc_code || null,
        pan_no: privateData.pan_no || null,
        uan_no: privateData.uan_no || null,
        emp_code: privateData.emp_code || null,
      })
      .eq("id", employee.id);

    if (error) {
      alert("Failed to save changes");
    } else {
      setEditingPrivate(false);
      fetchProfile();
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const addCertification = () => {
    if (newCert.trim() && !formData.certifications.includes(newCert.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, newCert.trim()] });
      setNewCert("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({ ...formData, certifications: formData.certifications.filter((c) => c !== cert) });
  };

  const getInitials = () => {
    if (employee) {
      return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">Profile not found</div>
            <p className="text-gray-500">Unable to load your profile information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          </div>

          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-start space-x-6 mb-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profilePreview || ""} />
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-2xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    <Camera className="w-4 h-4 text-gray-600" />
                  </label>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
            <h2 className="text-2xl font-semibold italic">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-gray-500">{employee.job_position}</p>
            <p className="text-gray-500">{employee.email}</p>
            {editing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="mt-1 w-48"
              />
            ) : (
              <p className="text-gray-500">{employee.phone || "-"}</p>
            )}
          </div>

          {/* Company Info */}
          <div className="text-right text-sm text-gray-600">
            <p><span className="text-gray-400">Company:</span> {company?.name || "-"}</p>
            <p><span className="text-gray-400">Department:</span> {employee.department || "-"}</p>
            <p><span className="text-gray-400">Manager:</span> {manager ? `${manager.first_name} ${manager.last_name}` : "-"}</p>
            <p><span className="text-gray-400">Location:</span> {employee.location || "-"}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Tabs */}
        <Tabs defaultValue="resume">
          <TabsList>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="private">Private Info</TabsTrigger>
            <TabsTrigger value="salary">Salary Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Resume Tab */}
          <TabsContent value="resume" className="pt-4">
            <div className="flex justify-end mb-4">
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setProfilePicture(null); fetchProfile(); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveResume}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label>About</Label>
                  {editing ? (
                    <Textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {employee.about || "No information provided."}
                    </p>
                  )}
                </div>

                <div>
                  <Label>What I love about my job</Label>
                  {editing ? (
                    <Textarea
                      value={formData.what_i_love_about_job}
                      onChange={(e) => setFormData({ ...formData, what_i_love_about_job: e.target.value })}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {employee.what_i_love_about_job || "No information provided."}
                    </p>
                  )}
                </div>

                <div>
                  <Label>My interests and hobbies</Label>
                  {editing ? (
                    <Textarea
                      value={formData.interests_hobbies}
                      onChange={(e) => setFormData({ ...formData, interests_hobbies: e.target.value })}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      {employee.interests_hobbies || "No information provided."}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.length === 0 && !editing && (
                      <p className="text-sm text-gray-500">No skills added</p>
                    )}
                    {formData.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1"
                      >
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(skill)}>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {editing && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add skill"
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" size="sm" variant="outline" onClick={addSkill}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certifications.length === 0 && !editing && (
                      <p className="text-sm text-gray-500">No certifications added</p>
                    )}
                    {formData.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1"
                      >
                        {cert}
                        {editing && (
                          <button onClick={() => removeCertification(cert)}>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {editing && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newCert}
                        onChange={(e) => setNewCert(e.target.value)}
                        placeholder="Add certification"
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                      />
                      <Button type="button" size="sm" variant="outline" onClick={addCertification}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Private Info Tab */}
          <TabsContent value="private" className="pt-4">
            <div className="flex justify-end mb-4">
              {!editingPrivate ? (
                <Button variant="outline" size="sm" onClick={() => setEditingPrivate(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingPrivate(false); fetchProfile(); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSavePrivate}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Date of Birth</Label>
                  {editingPrivate ? (
                    <Input
                      type="date"
                      value={privateData.date_of_birth}
                      onChange={(e) => setPrivateData({ ...privateData, date_of_birth: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.date_of_birth || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Residing Address</Label>
                  {editingPrivate ? (
                    <Textarea
                      value={privateData.residing_address}
                      onChange={(e) => setPrivateData({ ...privateData, residing_address: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.residing_address || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Nationality</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.nationality}
                      onChange={(e) => setPrivateData({ ...privateData, nationality: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.nationality || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Personal Email</Label>
                  {editingPrivate ? (
                    <Input
                      type="email"
                      value={privateData.personal_email}
                      onChange={(e) => setPrivateData({ ...privateData, personal_email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.personal_email || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Gender</Label>
                  {editingPrivate ? (
                    <Select
                      value={privateData.gender}
                      onValueChange={(v) => setPrivateData({ ...privateData, gender: v as "male" | "female" | "other" })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1 capitalize">{employee.gender || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Date of Joining</Label>
                  <p className="text-sm mt-1">{employee.date_of_joining || "-"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Bank Details</h4>

                <div>
                  <Label>Bank Name</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.bank_name}
                      onChange={(e) => setPrivateData({ ...privateData, bank_name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.bank_name || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Account Number</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.account_number}
                      onChange={(e) => setPrivateData({ ...privateData, account_number: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.account_number || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>IFSC Code</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.ifsc_code}
                      onChange={(e) => setPrivateData({ ...privateData, ifsc_code: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.ifsc_code || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>PAN No</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.pan_no}
                      onChange={(e) => setPrivateData({ ...privateData, pan_no: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.pan_no || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>UAN No</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.uan_no}
                      onChange={(e) => setPrivateData({ ...privateData, uan_no: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.uan_no || "-"}</p>
                  )}
                </div>

                <div>
                  <Label>Emp Code</Label>
                  {editingPrivate ? (
                    <Input
                      value={privateData.emp_code}
                      onChange={(e) => setPrivateData({ ...privateData, emp_code: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{employee.emp_code || "-"}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Salary Info Tab */}
          <TabsContent value="salary" className="pt-4">
            <SalaryInfoView salaryInfo={salaryInfo} isEditable={false} />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="pt-4">
            <div className="space-y-4 max-w-md">
              <div>
                <Label>Login ID</Label>
                <p className="text-sm mt-1">{employee.login_id}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm mt-1">{employee.email}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

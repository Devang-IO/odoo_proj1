"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let emailToUse = loginId;

    // If not an email, lookup email by login_id
    if (!loginId.includes("@")) {
      const { data: empData, error: lookupError } = await supabase
        .from("employees")
        .select("email")
        .eq("login_id", loginId.toUpperCase())
        .single();

      if (lookupError || !empData) {
        setError("Invalid Login ID");
        setLoading(false);
        return;
      }

      emailToUse = empData.email;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Get user role to redirect appropriately
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (userData?.role === "admin") {
      router.push("/employees");
    } else {
      router.push("/attendance");
    }
    router.refresh();
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

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="loginId">Login Id/Email :-</Label>
            <Input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              placeholder="Email or Login ID"
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password :-</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-gray-300"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-400 hover:bg-purple-500 text-white py-6"
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </Button>
        </form>
      </div>
    </div>
  );
}

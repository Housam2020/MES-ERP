// Login Page
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const supabase = createClient();
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) throw error;
  
      const userId = data.user?.id;
      if (!userId) throw new Error("Login failed.");
  
      // Fetch user with their role details
      const { data: userRecord, error: fetchError } = await supabase
        .from("users")
        .select(`
          id, 
          email, 
          role_id,
          roles (
            name,
            role_permissions (
              permissions (
                name
              )
            )
          )
        `)
        .eq("id", userId)
        .single();
  
      if (fetchError) {
        // If user doesn't exist in users table, create with default role
        const { data: defaultRole } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "user")
          .single();
  
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ 
            id: userId, 
            email, 
            role_id: defaultRole?.id
          }]);
  
        if (insertError) throw insertError;
  
        // Redirect to dashboard
        router.push("/dashboard/home");
        router.refresh();
        return;
      }
  
      // Optional: You could store role and permissions in local storage or context
      // For now, just redirect to dashboard
      router.push("/dashboard/home");
      router.refresh();
    } catch (error) {
      console.error("Error logging in:", error);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };  

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

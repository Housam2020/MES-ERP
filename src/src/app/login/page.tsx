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
  
      // Fetch user with from the users table
      const { data: userRecord, error: fetchError } = await supabase
        .from("users")
        .select("id, email, fullName")
        .eq("id", userId)
        .single();
  
      if (fetchError) {
        // If user doesn't exist in users table, create the user
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ 
            id: userId, 
            email
          }]);
  
        if (insertError) throw insertError;
        
        // Get the default user role
        const { data: defaultRole } = await supabase
          .from("roles")
          .select("id")
          .eq("name", "user")
          .single();
          
        if (defaultRole) {
          // Assign default role to new user
          const { error: roleAssignError } = await supabase
            .from("user_roles")
            .insert([{
              user_id: userId,
              role_id: defaultRole.id,
              is_global: true
            }]);
            
          if (roleAssignError) throw roleAssignError;
        }
  
        // Redirect to dashboard
        router.push("/dashboard/home");
        router.refresh();
        return;
      }
  
      // User exists, just redirect to dashboard
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

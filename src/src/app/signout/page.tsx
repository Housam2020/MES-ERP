"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Signout() {
  const router = useRouter();

  useEffect(() => {
    const signOutUser = async () => {
      const supabase = createClient();
      await supabase.auth.signOut(); // Signs out the user
      router.push("/login"); // Redirect to login page
    };

    signOutUser();
  }, [router]);

  return <p>Signing out...</p>;
}

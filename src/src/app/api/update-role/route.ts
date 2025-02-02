import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { userId, newRole } = await req.json();

  if (!userId || !newRole) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  // Update user role in Supabase
  const { error } = await supabase
    .from("Users")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({ message: "Role updated successfully" }, { status: 200 });
}

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { userId, newGroupId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  // Update user's group
  const { error } = await supabase
    .from("Users")
    .update({ group_id: newGroupId || null }) // Assign group or remove it (null)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  return NextResponse.json({ message: "Group updated successfully" }, { status: 200 });
}

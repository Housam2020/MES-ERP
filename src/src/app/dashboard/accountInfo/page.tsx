"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { HomeIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function AccountInfoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      }
      if (user) {
        setEmail(user.email);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50 dark:bg-gray-900">
      {/* Card Container with minimum height and width */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-96 min-w-[450px] min-h-[550px]">
        <div className="divide-y divide-gray-300 dark:divide-gray-600 text-center">
          {/* Header Row */}
          <div className="pb-4">
            <h1 className="text-3xl font-bold">Account Info</h1>
          </div>
          {/* Information Row */}
          <div className="pt-4">
            <p className="text-lg">Email: {email}</p>
          </div>
        </div>

        {/* Home Icon in the bottom left of the card */}
        <button
          onClick={() => router.push("/dashboard/home")}
          className="absolute bottom-4 left-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Go to Home"
        >
          <HomeIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Edit Button at the bottom right of the card */}
        <button
          onClick={() => {
            // Add your edit functionality here
            console.log("Edit button clicked");
          }}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          aria-label="Edit"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

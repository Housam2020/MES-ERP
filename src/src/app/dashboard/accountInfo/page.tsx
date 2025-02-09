"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  HomeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AccountInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  // Holds the key (field name) currently being edited.
  const [editKey, setEditKey] = useState(null);
  // Holds the temporary value while editing.
  const [editValue, setEditValue] = useState("");

  // Exclude these keys from display.
  const excludedKeys = ["id", "group_id", "role_id"];
  // Do not allow editing on these keys.
  const nonEditable = ["email", "email_address", "role"];

  // This function formats keys into friendly labels.
  const formatKey = (key) => {
    // Custom mappings for keys that need special names.
    const customMap = {
      email: "Email Address",
      email_address: "Email Address",
      full_name: "Full Name",
      contact_phone_number: "Phone Number",
      phoneNum: "Phone Number",
      role: "Role",
      reimbursment_or_payment: "Reimbursement or Payment",
    };
    if (customMap[key]) return customMap[key];

    // Replace underscores with spaces.
    let result = key.replace(/_/g, " ");
    // For camelCase keys, insert spaces before capital letters.
    result = result.replace(/([A-Z])/g, " $1");
    // Capitalize the first letter of each word.
    result = result
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return result;
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const supabase = createClient();
      // Get the authenticated user.
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Error fetching user:", authError);
        setLoading(false);
        return;
      }

      // Fetch full user info from the "users" table.
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user info:", error);
      } else {
        setUserInfo(data);
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  // Begin editing a given field.
  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(userInfo[key] ?? "");
  };

  // Save the updated field to the DB and update local state.
  const handleSave = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ [editKey]: editValue })
      .eq("id", userInfo.id);

    if (error) {
      console.error("Error updating field:", error);
      return;
    }
    setUserInfo((prev) => ({
      ...prev,
      [editKey]: editValue,
    }));
    setEditKey(null);
    setEditValue("");
  };

  // Cancel editing.
  const handleCancel = () => {
    setEditKey(null);
    setEditValue("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50 dark:bg-gray-900 p-4">
      {/* Wider and taller container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl min-h-[600px]">
        {/* Home Icon in the top right */}
        <button
          onClick={() => router.push("/dashboard/home")}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Go to Home"
        >
          <HomeIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
          Account Info
        </h1>
        <div className="space-y-4">
          {userInfo &&
            Object.entries(userInfo)
              .filter(([key]) => !excludedKeys.includes(key))
              .map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-[200px_1fr_50px] items-center gap-4 py-2 border-b border-gray-300 dark:border-gray-600"
                >
                  {/* Friendly label */}
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {formatKey(key)}
                  </div>
                  {/* Value or input/select if editing */}
                  <div className="text-gray-900 dark:text-gray-100">
                    {editKey === key ? (
                      key === "reimbursment_or_payment" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="p-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-full"
                        >
                          <option value="Reimbursement">Reimbursement</option>
                          <option value="Payment">Payment</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="p-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-full"
                        />
                      )
                    ) : (
                      String(value)
                    )}
                  </div>
                  {/* Edit / Save / Cancel Buttons */}
                  <div className="text-right">
                    {nonEditable.includes(key) ? null : (
                      editKey === key ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={handleSave}
                            className="p-1 text-green-600 hover:text-green-800"
                            aria-label="Save"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 text-red-600 hover:text-red-800"
                            aria-label="Cancel"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(key)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          aria-label="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect } from "react";
import { useFormContext } from "./ReimbursementFormContext";
import Tesseract from "tesseract.js";
import { createClient } from "@/utils/supabase/client";

// Helper function to extract total price using heuristics.
const extractTotalPriceFromText = (text) => {
  // Look for keywords followed by a monetary value.
  const regexKeywords = /(?:Total(?: Amount)?|Grand Total|Amount Due|Balance Due)[^0-9$]*\$?\s*([\d,]+(?:\.\d{2})?)/i;
  const matchKeywords = text.match(regexKeywords);
  if (matchKeywords && matchKeywords[1]) {
    return parseFloat(matchKeywords[1].replace(/,/g, ""));
  }
  // Fallback: extract all currency amounts and choose the maximum.
  const regexAmounts = /\$([\d,]+(?:\.\d{2})?)/g;
  let amounts = [];
  let match;
  while ((match = regexAmounts.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, "")));
  }
  if (amounts.length > 0) {
    return Math.max(...amounts);
  }
  return null;
};

const BasicInfoSection = () => {
  const {
    methods: { register, formState: { errors }, setValue },
    receiptFile,
    setReceiptFile,
    setExtractedText,
    isProcessing,
    setIsProcessing,
    userGroups,
    setUserGroups,
    selectedGroup,
    setSelectedGroup
  } = useFormContext();

  // Function to process OCR on the uploaded receipt.
  const extractTextFromReceipt = (file) => {
    if (!file) return;
    setIsProcessing(true);
    Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        console.log("Extracted text:", text);
        setExtractedText(text);
        const computedTotal = extractTotalPriceFromText(text);
        console.log("Computed Total Price:", computedTotal);
        if (computedTotal !== null) {
          setValue("amount_requested_cad", computedTotal);
        }
        setIsProcessing(false);
      })
      .catch((error) => {
        console.error("Error processing OCR:", error);
        setIsProcessing(false);
      });
  };

  // Auto-fill form fields with user defaults.
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Error fetching user:", authError);
        return;
      }

      // Fetch user profile data
      const { data: userData, error } = await supabase
        .from("users")
        .select("email, fullName, phoneNum")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
      } else if (userData) {
        if (userData.email) setValue("email_address", userData.email);
        if (userData.fullName) setValue("full_name", userData.fullName);
        if (userData.phoneNum) setValue("contact_phone_number", userData.phoneNum);
      }

      // Fetch user's groups using junction table
      const { data: userRolesData, error: groupsError } = await supabase
        .from("user_roles")
        .select(`
          group_id,
          groups (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .not("group_id", "is", null);

      if (groupsError) {
        console.error("Error fetching user groups:", groupsError);
        return;
      }

      // Extract unique groups
      const groups = userRolesData
        ? [...new Map(userRolesData
            .filter(item => item.groups) // Ensure the group exists
            .map(item => [item.groups.id, item.groups])
          ).values()]
        : [];

      setUserGroups(groups);
      
      // If user has only one group, select it automatically
      if (groups.length === 1) {
        setValue("group_id", groups[0].id);
        setSelectedGroup(groups[0].id);
      }
    };

    fetchUserData();
  }, [setValue, setUserGroups, setSelectedGroup]);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Basic Information</h2>
      
      {/* Group Selection */}
      <div className="mb-4">
        <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Submit Request For Group
        </label>
        <select
          {...register("group_id", { required: "Group selection is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          onChange={(e) => setSelectedGroup(e.target.value)}
          value={selectedGroup}
        >
          <option value="">Select Group</option>
          {userGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {errors.group_id && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.group_id.message}</p>
        )}
      </div>
      
      <div className="mb-4">
        <label htmlFor="who_are_you" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Who Are You?
        </label>
        <select
          {...register("who_are_you", { required: "Selection is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="">Select Option</option>
          <option value="MES Position">MES Position</option>
          <option value="Ratified Club, Team, or Program Society">
            Ratified Club, Team, or Program Society
          </option>
          <option value="Student Projects and New Club Seed Funding">
            Student Projects and New Club Seed Funding
          </option>
          <option value="Intramurals Funding">Intramurals Funding</option>
          <option value="Conference/Competition Delegate (Open or Affiliate)">
            Conference/Competition Delegate (Open or Affiliate)
          </option>
        </select>
        {errors.who_are_you && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.who_are_you.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="email_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </label>
        <input
          {...register("email_address", { required: "Email is required" })}
          type="email"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.email_address && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.email_address.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          {...register("full_name", { required: "Full name is required" })}
          type="text"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.full_name && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.full_name.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="contact_phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Contact Phone Number
        </label>
        <input
          {...register("contact_phone_number", { required: "Phone number is required" })}
          type="tel"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.contact_phone_number && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.contact_phone_number.message}</p>
        )}
      </div>

      {/* RECEIPT UPLOAD & OCR */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Receipt Upload</h3>
        <label htmlFor="receipt" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
          Please insert an image of your receipt (PDF, JPG, JPEG, PNG accepted):
        </label>
        <input
          id="receipt"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="mt-2"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              setReceiptFile(file);
              // Immediately process the file for OCR
              extractTextFromReceipt(file);
            }
          }}
        />
        {/* Receipt Link Input */}
        <div className="mt-4">
          <label htmlFor="receipt_link" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
            Link an image to your receipt
          </label>
          <input
            {...register("receipt")}
            type="text"
            id="receipt_link"
            placeholder="Enter image URL"
            className="mt-2 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          />
        </div>
        {isProcessing && (
          <div className="mt-2 text-blue-600">Processing receipt... This may take a moment.</div>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;

"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ReimbursementFormProvider, useFormContext } from "./ReimbursementFormContext";
import BasicInfoSection from "./BasicInfoSection";
import RoleBudgetSection from "./RoleBudgetSection";
import PaymentDetailsSection from "./PaymentDetailsSection";
import { 
  ApprovalInfoSection, 
  TeamInfoSection,
  PaymentMethodDetailsSection 
} from "./AdditionalSections";

const FormContent = () => {
  const router = useRouter();
  const {
    methods,
    selectedGroup,
    receiptFile
  } = useFormContext();
  
  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data) => {
    const supabase = createClient();
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Failed to get the logged-in user.");
        throw userError;
      }

      // Use the selected group from the form instead of fetching from user table
      if (!data.group_id) {
        alert("Please select a group for this request.");
        return;
      }

      const request_id = uuidv4();

      // Create the new data object
      const newData = {
        request_id,
        user_id: user.id,
        group_id: data.group_id,
        status: "Pending",
        timestamp: new Date().toISOString(),
        ...data,
      };

      const { error } = await supabase
        .from("payment_requests")
        .insert([newData]);
        
      if (error) {
        if (error.code === "23505") {
          alert("A record with this information already exists.");
        } else {
          alert(`Failed to submit the form: ${error.message}`);
        }
        throw error;
      }
      
      alert("Form submitted successfully");
      router.push("/dashboard/home");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="container mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-md">
        <button
          type="button"
          onClick={() => router.push("/dashboard/requests")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold my-4 text-gray-800 dark:text-gray-200">
          MES Payment and Reimbursement Form
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form Sections */}
          <BasicInfoSection />
          <RoleBudgetSection />
          <ApprovalInfoSection />
          <TeamInfoSection />
          <PaymentDetailsSection />
          <PaymentMethodDetailsSection />

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReimbursementForm = () => {
  return (
    <ReimbursementFormProvider>
      <FormContent />
    </ReimbursementFormProvider>
  );
};

export default ReimbursementForm;

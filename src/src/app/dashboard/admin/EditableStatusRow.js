"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function EditableStatusRow({ request }) {
  const [status, setStatus] = useState(request.status);

  // Handle form submission to update status
  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus); // Update state for UI immediately
    console.log(newStatus);
    try {
      // Initialize Supabase client
      const supabase = await createClient();

      // Update row in database with new status
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: newStatus })
        .eq("request_id", request.request_id);

      if (error) {
        console.log(error);
        throw new Error("Failed to update status");
      }

      alert("Status updated successfully!"); // Confirmation for user
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <tr>
      <td className="py-2 px-4 border-b border-gray-200">{request.full_name}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.who_are_you}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.amount_requested_cad}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.group_or_team_name}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.payment_timeframe}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.reimbursement_or_payment}</td>
      <td className="py-2 px-4 border-b border-gray-200">{new Date(request.timestamp).toLocaleString()}</td>
      <td className="py-2 px-4 border-b border-gray-200">
        {/* Dropdown for selecting status */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStatusChange(status); // Submit the updated status
          }}
        >
          <select
            value={status}
            onChange={(e) => {
              const newValue = e.target.value;
              setStatus(newValue); // Update local state immediately
              handleStatusChange(newValue); // Pass the new value directly to handleStatusChange
            }}
            className="border border-gray-300 rounded p-1"
          >
            <option value="Submitted">Submitted</option>
            <option value="Rejected">Rejected</option>
            <option value="Reimbursed">Reimbursed</option>
            <option value="In Progress">In Progress</option>
          </select>
        </form>
      </td>
    </tr>
  );
}

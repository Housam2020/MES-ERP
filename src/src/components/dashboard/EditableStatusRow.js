"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function EditableStatusRow({ request, onStatusUpdate }) {
  const [status, setStatus] = useState(request.status);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    console.log(newStatus);
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: newStatus })
        .eq("request_id", request.request_id);

      if (error) {
        console.log(error);
        throw new Error("Failed to update status");
      }

      // Add this line to update the parent's state
      onStatusUpdate(request.request_id, newStatus);
      
      alert("Status updated successfully!");
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
      <td className="py-2 px-4 border-b border-gray-200">{request.groups?.name || "None"}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.payment_timeframe}</td>
      <td className="py-2 px-4 border-b border-gray-200">{request.reimbursement_or_payment}</td>
      <td className="py-2 px-4 border-b border-gray-200">{new Date(request.timestamp).toLocaleString()}</td>
      <td className="py-2 px-4 border-b border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStatusChange(status);
          }}
        >
          <select
            value={status}
            onChange={(e) => {
              const newValue = e.target.value;
              setStatus(newValue);
              handleStatusChange(newValue);
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
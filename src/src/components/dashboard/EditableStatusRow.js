"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { createPortal } from "react-dom";

export default function EditableStatusRow({ request, onStatusUpdate }) {
  const [status, setStatus] = useState(request.status);
  const [showModal, setShowModal] = useState(false);
  const { permissions } = usePermissions();
  const supabase = createClient();

  const canEdit =
    permissions.includes("manage_all_requests") ||
    permissions.includes("manage_club_requests");

  const handleStatusChange = async (newStatus) => {
    if (!canEdit) return;

    setStatus(newStatus);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: newStatus })
        .eq("request_id", request.request_id);

      if (error) throw error;

      onStatusUpdate(request.request_id, newStatus);
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  // Helper function to render each key-value pair neatly
  const renderRequestDetails = () => (
    <div className="overflow-auto">
      <table className="min-w-full">
        <tbody>
          {Object.entries(request).map(([key, value]) => (
            <tr key={key}>
              <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
                {key}
              </td>
              <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100">
                {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <tr>
        <td className="py-2 px-4 border-b border-gray-200">{request.full_name}</td>
        <td className="py-2 px-4 border-b border-gray-200">{request.who_are_you}</td>
        <td className="py-2 px-4 border-b border-gray-200">{request.amount_requested_cad}</td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.groups?.name || "None"}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">{request.payment_timeframe}</td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.reimbursement_or_payment}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {new Date(request.timestamp).toLocaleString()}
        </td>
        {/* Editable status cell */}
        <td className="py-2 px-4 border-b border-gray-200">
          {canEdit ? (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded p-1"
            >
              <option value="Submitted">Submitted</option>
              <option value="Rejected">Rejected</option>
              <option value="Reimbursed">Reimbursed</option>
              <option value="In Progress">In Progress</option>
            </select>
          ) : (
            <span>{status}</span>
          )}
        </td>
        {/* "View" button cell (positioned to the right of the editable status) */}
        <td className="py-2 px-4 border-b border-gray-200">
          <button
            className="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
            onClick={() => setShowModal(true)}
          >
            View
          </button>
        </td>
      </tr>

      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded max-h-full overflow-auto w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Request Details
              </h2>
              {renderRequestDetails()}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

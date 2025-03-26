"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { createPortal } from "react-dom";

// Optional helper for image display if needed (if budget form has any file/blob fields later)
function getBlobFromBytea(bytea) {
  if (!bytea) return null;
  if (typeof bytea === "string" && bytea.startsWith("data:image")) {
    const base64 = bytea.split(",")[1];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    const match = bytea.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    return new Blob([arr], { type: match?.[1] || "image/png" });
  }
  if (bytea.startsWith("\\x")) {
    const hex = bytea.slice(2);
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return new Blob([arr], { type: "image/png" });
  }
  try {
    const binary = atob(bytea);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: "image/png" });
  } catch (e) {
    return null;
  }
}

export default function EditableBudgetStatusRow({ request, onStatusUpdate }) {
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
        .from("annual_budget_form")
        .update({ status: newStatus })
        .eq("id", request.id);

      if (error) throw error;

      onStatusUpdate?.(request.id, newStatus);
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const renderRequestDetails = () => (
    <div className="overflow-auto">
      <table className="min-w-full">
        <tbody>
          {Object.entries(request).map(([key, value]) => {
            // Optional image/receipt rendering, in case you store proof blobs later
            if (key === "receipt" && value) {
              const blob = getBlobFromBytea(value);
              const url = blob ? URL.createObjectURL(blob) : null;
              return (
                <tr key={key}>
                  <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
                    {key}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View Image
                      </a>
                    ) : (
                      "Invalid or missing image data"
                    )}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={key}>
                <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
                  {key}
                </td>
                <td className="py-2 px-4 border-b">
                  {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <tr>
        <td className="py-2 px-4 border-b">{request.club_name}</td>
        <td className="py-2 px-4 border-b">
          ${request.requested_mes_funding?.toLocaleString()}
        </td>
        <td className="py-2 px-4 border-b">
          {canEdit ? (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded p-1"
            >
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Reimbursed">Reimbursed</option>
              <option value="Rejected">Rejected</option>
            </select>
          ) : (
            <span>{status}</span>
          )}
        </td>
        <td className="py-2 px-4 border-b">
          {new Date(request.created_at).toLocaleDateString()}
        </td>
        <td className="py-2 px-4 border-b">
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
                Budget Request Details
              </h2>
              {renderRequestDetails()}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

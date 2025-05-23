"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { createPortal } from "react-dom";

// Helper function to convert the 'receipt' value (from the DB) to a Blob.
// It supports three cases:
// 1. A data-URI string (starting with "data:image")
// 2. A Postgres bytea hex string (starting with "\x")
// 3. A raw base64 string
function getBlobFromBytea(bytea) {
  if (!bytea) {
    console.error("No data provided to getBlobFromBytea");
    return null;
  }

  // If it's a data-URI (e.g. "data:image/png;base64,...")
  if (typeof bytea === "string" && bytea.startsWith("data:image")) {
    const base64String = bytea.split(",")[1];
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    const mimeMatch = bytea.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    return new Blob([uint8Array], { type: mimeType });
  }

  // If it's a Postgres bytea hex string (e.g. "\x...")
  if (typeof bytea === "string" && bytea.startsWith("\\x")) {
    const hexString = bytea.slice(2);
    const len = hexString.length / 2;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const hexPair = hexString.substr(i * 2, 2);
      uint8Array[i] = parseInt(hexPair, 16);
    }
    // Change the MIME type as needed (here we assume PNG)
    return new Blob([uint8Array], { type: "image/png" });
  }

  // Otherwise, assume it's a raw base64 string.
  try {
    const binaryString = atob(bytea);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: "image/png" });
  } catch (err) {
    console.error("Invalid string for base64 decoding:", err);
    return null;
  }
}

export default function EditableStatusRow({ request, onStatusUpdate }) {
  const [status, setStatus] = useState(request.status);
  const [showModal, setShowModal] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
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

  // Helper to convert keys to a more human-readable label.
  const formatKeyLabel = (key) => {
    return key
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)); // Capitalize each word
  };

  // Common function to render a row for a detail.
  const renderDetailRow = (key, value) => {
    const label = formatKeyLabel(key);

    // Special handling for the 'receipt' field.
    if (key === "receipt" && value) {
      if (typeof value === "string" && value.startsWith("https://")) {
        return (
          <tr key={key}>
            <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
              {label}
            </td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Image
              </a>
            </td>
          </tr>
        );
      }

      const blob = getBlobFromBytea(value);
      if (blob) {
        const url = URL.createObjectURL(blob);
        return (
          <tr key={key}>
            <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
              {label}
            </td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100">
              <button
                onClick={() => window.open(url, "_blank")}
                className="text-blue-500 hover:underline"
              >
                View Image
              </button>
            </td>
          </tr>
        );
      } else {
        return (
          <tr key={key}>
            <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
              {label}
            </td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100">
              Invalid or corrupted image data
            </td>
          </tr>
        );
      }
    }

    return (
      <tr key={key}>
        <td className="py-2 px-4 border-b font-medium text-gray-700 dark:text-gray-300">
          {label}
        </td>
        <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100">
          {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
        </td>
      </tr>
    );
  };

  // Define primary keys already shown in the main table row.
  const primaryKeys = [
    "full_name",
    "who_are_you",
    "amount_requested_cad",
    "groups",
    "payment_timeframe",
    "reimbursement_or_payment",
    "timestamp",
    "status",
  ];

  // Compute extra entries by filtering out the primary keys.
  const extraEntries = Object.entries(request).filter(
    ([key]) => !primaryKeys.includes(key)
  );

  // Render primary details.
  const renderPrimaryDetails = () => {
    const primaryEntries = Object.entries(request).filter(([key]) =>
      primaryKeys.includes(key)
    );
    return (
      <table className="min-w-full">
        <tbody>
          {primaryEntries.map(([key, value]) => renderDetailRow(key, value))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <tr>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.full_name}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.who_are_you}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.amount_requested_cad}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.groups?.name || "None"}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.payment_timeframe}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {request.reimbursement_or_payment}
        </td>
        <td className="py-2 px-4 border-b border-gray-200">
          {new Date(request.timestamp).toLocaleString()}
        </td>
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
        <td className="py-2 px-4 border-b border-gray-200">
          <button
            className="bg-[#7A003C] text-white py-1 px-2 rounded hover:bg-[#680033] dark:bg-blue-500 dark:hover:bg-blue-800"
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
              {/* Primary Details */}
              {renderPrimaryDetails()}

              {/* Extra details (if any) under a "More Details" section */}
              {extraEntries.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowMoreDetails(!showMoreDetails)}
                    className="text-blue-500 hover:underline mb-2"
                  >
                    {showMoreDetails ? "Hide More Details" : "Show More Details"}
                  </button>
                  {showMoreDetails && (
                    <table className="min-w-full">
                      <tbody>
                        {extraEntries.map(([key, value]) =>
                          renderDetailRow(key, value)
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

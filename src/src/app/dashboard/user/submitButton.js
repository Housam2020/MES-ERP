"use client";

import React from "react";

export default function SubmitButton() {
  const handleClick = () => {
    window.location.href = "http://localhost:3000/forms";
  };

  return (
    <button
      onClick={handleClick}
      className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
    >
      Submit a new request
    </button>
  );
}
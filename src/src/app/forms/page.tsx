"use client";

import React from "react";
import { ReimbursementForm } from "@/components/reimbursement";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function ReimbursementRequestPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="flex-grow">
        <ReimbursementForm />
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const BudgetForm = () => {
  const supabase = createClient();
  const router = useRouter();
  const [formData, setFormData] = useState({
    club_name: "", // Matches `club_name` in the database
    requested_mes_funding: "", // Matches `requested_mes_funding` in the database
    total_income: 0, // Matches `total_income` in the database
    total_expense: 0, // Matches `total_expense` in the database
    surplus_deficit: 0, // Matches `surplus_deficit` in the database
    fall_2024_expenses: "", // Matches `fall_2024_expenses` in the database
    winter_2025_expenses: "", // Matches `winter_2025_expenses` in the database
    full_year_expenses: "", // Matches `full_year_expenses` in the database
    income: Array(5).fill({ source: "", projected: "", comments: "" }), // Matches `income` JSONB column
    expenses: Array(5).fill({ event: "", source: "", projected: "", term: "", comments: "" }), // Matches `expenses` JSONB column
  });

  // Calculate totals whenever income or expenses change
  useEffect(() => {
    const totalIncome = formData.income.reduce((sum, item) => sum + (parseFloat(item.projected) || 0), 0);
    const totalExpense = formData.expenses.reduce((sum, item) => sum + (parseFloat(item.projected) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      total_income: totalIncome,
      total_expense: totalExpense,
      surplus_deficit: totalIncome - totalExpense,
    }));
  }, [formData.income, formData.expenses]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number, subfield?: string) => {
    if (index !== undefined && subfield) {
      setFormData((prev) => {
        const updatedArray = [...prev[field]];
        updatedArray[index] = { ...updatedArray[index], [subfield]: e.target.value };
        return { ...prev, [field]: updatedArray };
      });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data for submission
    const submissionData = {
      club_name: formData.club_name,
      requested_mes_funding: parseFloat(formData.requested_mes_funding) || 0,
      total_income: formData.total_income,
      total_expense: formData.total_expense,
      surplus_deficit: formData.surplus_deficit,
      fall_2024_expenses: parseFloat(formData.fall_2024_expenses) || 0,
      winter_2025_expenses: parseFloat(formData.winter_2025_expenses) || 0,
      full_year_expenses: parseFloat(formData.full_year_expenses) || 0,
      income: formData.income,
      expenses: formData.expenses,
      total_income_calculated: formData.total_income, // Matches `total_income_calculated` in the database
      total_expenses_calculated: formData.total_expense, // Matches `total_expenses_calculated` in the database
    };

    // Insert data into Supabase
    const { data, error } = await supabase.from("annual_budget_form").insert([submissionData]);

    if (error) {
      console.error("Error submitting form:", error);
    } else {
      console.log("Form submitted successfully:", data);
      router.push("/dashboard/home");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader />
      <main className="pt-8 p-6">
        <div className="relative max-w-7xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <button
          onClick={() => router.push("/dashboard/home")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Back to Dashboard
        </button>
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">Budget Form</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Name */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">Club / Team / Group:</label>
              <input
                type="text"
                value={formData.club_name}
                onChange={(e) => handleChange(e, "club_name")}
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700"
                placeholder="Enter name"
              />
            </div>

            {/* Requested MES Funding */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">Requested MES Funding:</label>
              <input
                type="text"
                value={formData.requested_mes_funding}
                onChange={(e) => handleChange(e, "requested_mes_funding")}
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700"
                placeholder="Enter amount"
              />
            </div>

            {/* Fall 2024 Expenses */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">Fall 2024 Expenses:</label>
              <input
                type="text"
                value={formData.fall_2024_expenses}
                onChange={(e) => handleChange(e, "fall_2024_expenses")}
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700"
                placeholder="Enter amount"
              />
            </div>

            {/* Winter 2025 Expenses */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">Winter 2025 Expenses:</label>
              <input
                type="text"
                value={formData.winter_2025_expenses}
                onChange={(e) => handleChange(e, "winter_2025_expenses")}
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700"
                placeholder="Enter amount"
              />
            </div>

            {/* Full Year Expenses */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">Full Year Expenses:</label>
              <input
                type="text"
                value={formData.full_year_expenses}
                onChange={(e) => handleChange(e, "full_year_expenses")}
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700"
                placeholder="Enter amount"
              />
            </div>

            {/* Income Table */}
            <div>
              <h3 className="font-bold text-lg border-b pb-2 text-gray-800 dark:text-gray-200">Income:</h3>
              <table className="w-full mt-4 border">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700">
                    <th className="border p-2 text-left">Source</th>
                    <th className="border p-2 text-left">Projected</th>
                    <th className="border p-2 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.income.map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.source}
                          onChange={(e) => handleChange(e, "income", index, "source")}
                          className="w-full border-none bg-transparent"
                          placeholder="Enter source"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.projected}
                          onChange={(e) => handleChange(e, "income", index, "projected")}
                          className="w-full border-none bg-transparent"
                          placeholder="$"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.comments}
                          onChange={(e) => handleChange(e, "income", index, "comments")}
                          className="w-full border-none bg-transparent"
                          placeholder="Comments"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expenses Table */}
            <div>
              <h3 className="font-bold text-lg border-b pb-2 text-gray-800 dark:text-gray-200">Expenses:</h3>
              <table className="w-full mt-4 border">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700">
                    <th className="border p-2 text-left">Event</th>
                    <th className="border p-2 text-left">Source</th>
                    <th className="border p-2 text-left">Projected</th>
                    <th className="border p-2 text-left">Term</th>
                    <th className="border p-2 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.expenses.map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.event}
                          onChange={(e) => handleChange(e, "expenses", index, "event")}
                          className="w-full border-none bg-transparent"
                          placeholder="Enter event"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.source}
                          onChange={(e) => handleChange(e, "expenses", index, "source")}
                          className="w-full border-none bg-transparent"
                          placeholder="Source"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.projected}
                          onChange={(e) => handleChange(e, "expenses", index, "projected")}
                          className="w-full border-none bg-transparent"
                          placeholder="$"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.term}
                          onChange={(e) => handleChange(e, "expenses", index, "term")}
                          className="w-full border-none bg-transparent"
                          placeholder="Term"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.comments}
                          onChange={(e) => handleChange(e, "expenses", index, "comments")}
                          className="w-full border-none bg-transparent"
                          placeholder="Comments"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              <p>Total Income: ${formData.total_income.toFixed(2)}</p>
              <p>Total Expenses: ${formData.total_expense.toFixed(2)}</p>
              <p>Surplus / Deficit: ${formData.surplus_deficit.toFixed(2)}</p>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                Submit Budget
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BudgetForm;
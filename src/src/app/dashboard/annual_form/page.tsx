"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { HomeIcon } from "@heroicons/react/24/outline";

const BudgetForm = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <DashboardHeader />
      {/* Wider and taller container */}
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        {/* Home Icon in the top right */}
        <button
          onClick={() => router.push("/dashboard/home")}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Go to Home"
        >
          <HomeIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>

        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
          Budget Form
        </h1>

        {/* Form Section */}
        <div className="space-y-6">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clubName" className="font-bold text-gray-700 dark:text-gray-300">
                Club / Team / Group:
              </label>
              <input
                type="text"
                id="clubName"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="Enter name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Requested MES Funding:
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  placeholder="$"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Total Income:
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  placeholder="$"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Total Expense:
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="$"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Surplus / Deficit:
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="$"
              />
            </div>
          </div>

          {/* Term Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Fall 2024 Expenses:
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="$"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Winter 2025 Expenses:
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="$"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300">
                Full Year:
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="$"
              />
            </div>
          </div>

          {/* Income Section */}
          <div>
            <h3 className="font-bold text-lg border-b pb-2 text-gray-800 dark:text-gray-200">
              Income:
            </h3>
            <table className="w-full mt-4 border">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border p-2 text-left">Source of Income</th>
                  <th className="border p-2 text-left">Projected</th>
                  <th className="border p-2 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="Enter source"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="$"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="Comments"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="font-bold text-lg border-b pb-2 text-gray-800 dark:text-gray-200">
              Expenses:
            </h3>
            <table className="w-full mt-4 border">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border p-2 text-left">Event / Initiative</th>
                  <th className="border p-2 text-left">Source of Expense</th>
                  <th className="border p-2 text-left">Projected</th>
                  <th className="border p-2 text-left">Term</th>
                  <th className="border p-2 text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="Enter event"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="Source"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="$"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none bg-transparent"
                        placeholder="Term"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
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
          <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
            <p>Total Income:</p>
            <p>$</p>
          </div>
          <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
            <p>Total Expenses:</p>
            <p>$</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm;

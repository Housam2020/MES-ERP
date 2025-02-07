import React from 'react';

const BudgetForm = () => {
  return (
    <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white text-black rounded-lg shadow-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clubName" className="font-bold">Club / Team / Group:</label>
            <input
              type="text"
              id="clubName"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="Enter name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold">Requested MES Funding:</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="$"
              />
            </div>
            <div>
              <label className="font-bold">Total Income:</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="$"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold">Total Expense:</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="$"
            />
          </div>
          <div>
            <label className="font-bold">Surplus / Deficit:</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="$"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-bold">Fall 2024 Expenses:</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="$"
            />
          </div>
          <div>
            <label className="font-bold">Winter 2025 Expenses:</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="$"
            />
          </div>
          <div>
            <label className="font-bold">Full Year:</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="$"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Section */}
          <div>
            <h3 className="font-bold text-lg border-b pb-2">Income:</h3>
            <table className="w-full mt-4 border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Source of Income</th>
                  <th className="border p-2">Projected</th>
                  <th className="border p-2">Comments</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="Enter source"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="$"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
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
            <h3 className="font-bold text-lg border-b pb-2">Expenses:</h3>
            <table className="w-full mt-4 border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Event / Initiative</th>
                  <th className="border p-2">Source of Expense</th>
                  <th className="border p-2">Projected</th>
                  <th className="border p-2">Term</th>
                  <th className="border p-2">Comments</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="Enter event"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="Source"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="$"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="Term"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        className="w-full border-none"
                        placeholder="Comments"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between font-bold mt-6">
          <p>Total Income:</p>
          <p>$</p>
        </div>

        <div className="flex justify-between font-bold">
          <p>Total Expenses:</p>
          <p>$</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm;
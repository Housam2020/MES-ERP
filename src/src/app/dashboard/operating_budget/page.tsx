import React from "react";

const BudgetSummaryTable = () => {
  const data = {
    summary: [
      {
        title: "Budget Summary",
        headers: ["2021 - 2022 Budget", "2022 - 2023 Budget", "2023 - 2024 Budget", "2024 - 2025 Allocated"],
        rows: [
          ["Revenue Total", "$793,181.00", "$830,678.00", "$903,819.25", "$944,164.00"],
          ["Expense Total", "$754,009.65", "$822,638.88", "$913,281.88", "$944,164.00"],
          ["Clubs, Teams, and Program Societies Funding", "$122,590.00", "$148,250.00", "$180,275.00", "$163,700.00"],
          ["MES Funding", "$603,539.65", "$650,488.88", "$733,456.88", "$780,464.00"],
          ["Net Income", "$39,171.35", "$8,039.12", "$-39,462.63", "$0.00"],
        ],
      },
      {
        title: "Student Fee Summary",
        headers: ["2021 - 2022 Budget", "2022 - 2023 Budget", "2023 - 2024 Budget", "2024 - 2025 Allocated"],
        rows: [
          ["Revenue Total", "$350,860.00", "$361,348.00", "$395,434.00", "$425,544.00"],
          ["Expense Total", "$320,403.65", "$352,558.88", "$416,833.88", "$425,544.00"],
          ["Clubs, Teams, and Program Societies Funding", "$122,590.00", "$148,250.00", "$180,275.00", "$163,700.00"],
          ["MES Funding", "$197,813.65", "$204,308.88", "$236,558.88", "$261,844.00"],
          ["Net Income", "$30,456.35", "$8,789.12", "$-21,399.88", "$0.00"],
        ],
      },
    ],
    revenues: [
      {
        category: "Student Fee Revenue",
        rows: [
          ["Student Fees", "$333,125.00", "$343,375.00", "$376,740.00", "$389,574.00"],
          ["Academic Resources Fees", "$6,045.00", "$6,231.00", "$6,631.00", "$7,038.00"],
          ["Wellness Fees", "$1,690.00", "$1,742.00", "$1,863.00", "$1,932.00"],
          ["Tax Returns on Student Fees", "$10,000.00", "$10,000.00", "$10,000.00", "$27,000.00"],
          ["Student Fee Revenue Total", "$350,860.00", "$361,348.00", "$395,434.00", "$425,544.00"],
        ],
      },
      {
        category: "Other Revenue Sources",
        rows: [
          ["Publications Sponsorship", "$7,000.00", "$6,000.00", "$6,500.00", "$4,160.00"],
          ["Interest Income", "$800.00", "$800.00", "$800.00", "$800.00"],
          ["Welcome Week Faculty Contribution", "$2,500.00", "$2,500.00", "$2,000.00", "$2,500.00"],
          ["Welcome Week Levy", "$15,000.00", "$24,500.00", "$26,908.00", "$26,100.00"],
          ["Other Revenue Total", "$119,091.00", "$134,850.00", "$173,885.00", "$208,120.00"],
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        {data.summary.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">{section.title}</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-200">Category</th>
                  {section.headers.map((header, idx) => (
                    <th key={idx} className="border p-2 bg-gray-200">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border p-2 bg-gray-50"
                        contentEditable
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {data.revenues.map((section, index) => (
          <div key={index} className="mb-8">
            <h3 className="text-lg font-semibold mb-2">{section.category}</h3>
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {section.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border p-2 bg-gray-50"
                        contentEditable
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetSummaryTable;

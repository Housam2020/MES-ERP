"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Same DB shapes as before
interface BudgetColumn {
  id: number;
  column_key: string;    
  display_label: string; 
  sort_order: number;
}

interface BudgetGroup {
  id: number;            
  group_title: string;
  group_order: number;
}

interface BudgetRow {
  id?: number;           
  group_id: number;      
  order_index: number;   
  col_values: Record<string, string>; 
}

export default function OperatingBudgetPage() {
  const supabase = createClient();
  const router = useRouter();

  const [columns, setColumns] = useState<BudgetColumn[]>([]);
  const [groups, setGroups] = useState<BudgetGroup[]>([]);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [dragRow, setDragRow] = useState<BudgetRow | null>(null);

  // ----------------------------------------------------------------
  // Fetch columns, groups, rows
  // ----------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      // 1) columns
      const { data: colData, error: colError } = await supabase
        .from("annual_budget_form_columns")
        .select("*")
        .order("sort_order", { ascending: true });
      if (colError) console.error("Columns error:", colError);
      if (colData) setColumns(colData);

      // 2) groups
      const { data: grpData, error: grpError } = await supabase
        .from("annual_budget_form_groups")
        .select("*")
        .order("group_order", { ascending: true });
      if (grpError) console.error("Groups error:", grpError);
      if (grpData) setGroups(grpData);

      // 3) rows
      const { data: rowData, error: rowError } = await supabase
        .from("annual_budget_form_rows")
        .select("*")
        .order("order_index", { ascending: true });
      if (rowError) console.error("Rows error:", rowError);
      if (rowData) {
        setRows(rowData);
      }
    };
    loadData();
  }, [supabase]);

  // ----------------------------------------------------------------
  // Utility: parse/format currency
  // ----------------------------------------------------------------
  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(num);
  };

  // ----------------------------------------------------------------
  // Editing rows: auto‐calc col_change
  // ----------------------------------------------------------------
  const handleCellChange = (
    row: BudgetRow,
    columnKey: string,
    newValue: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r !== row) return r;
        const updated = { ...r };
        updated.col_values = { ...updated.col_values, [columnKey]: newValue };

        // If col_2023_2024 or col_2024_2025 changed, recalc col_change
        if (columnKey === "col_2023_2024" || columnKey === "col_2024_2025") {
          const val2023 = parseCurrency(updated.col_values["col_2023_2024"] || "");
          const val2025 = parseCurrency(updated.col_values["col_2024_2025"] || "");
          const diff = val2025 - val2023;
          updated.col_values["col_change"] = formatCurrency(diff);
        }

        return updated;
      })
    );
  };

  // If user changes "line_label" (stored in col_values.line_label)
  const handleLineLabelChange = (row: BudgetRow, newLabel: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r === row
          ? {
              ...r,
              col_values: { ...r.col_values, line_label: newLabel },
            }
          : r
      )
    );
  };

  // ----------------------------------------------------------------
  // Drag & Drop
  // ----------------------------------------------------------------
  const handleDragStart = (row: BudgetRow) => {
    setDragRow(row);
  };

  const handleDragOver = (e: React.DragEvent, targetRow: BudgetRow) => {
    // Only allow dropping if same group
    if (!dragRow || dragRow.group_id !== targetRow.group_id) return;
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, targetRow: BudgetRow) => {
    e.preventDefault();
    if (!dragRow) return;
    if (dragRow.group_id !== targetRow.group_id) return;

    // Reorder local rows
    setRows((prev) => {
      const sameGroup = prev.filter((r) => r.group_id === dragRow.group_id);
      const otherRows = prev.filter((r) => r.group_id !== dragRow.group_id);

      const dragIndex = sameGroup.indexOf(dragRow);
      const targetIndex = sameGroup.indexOf(targetRow);

      sameGroup.splice(dragIndex, 1);     
      sameGroup.splice(targetIndex, 0, dragRow);

      // Reassign order_index
      sameGroup.forEach((r, idx) => {
        r.order_index = idx + 1;
      });

      return [...otherRows, ...sameGroup];
    });

    setDragRow(null);
  };

  // ----------------------------------------------------------------
  // Add/Remove Groups & Rows
  // ----------------------------------------------------------------
  const handleAddGroup = () => {
    const tempId = -Date.now();
    setGroups((prev) => [
      ...prev,
      { id: tempId, group_title: "New Group", group_order: prev.length + 1 },
    ]);
  };

  const handleRemoveGroup = async (group: BudgetGroup) => {
    // If group is in DB, remove from DB
    if (group.id > 0) {
      const { error } = await supabase
        .from("annual_budget_form_groups")
        .delete()
        .eq("id", group.id);
      if (error) {
        console.error("Error deleting group:", error);
        alert("Failed to delete group from database.");
        return;
      }
    }
    // Remove from local state
    setGroups((prev) => prev.filter((g) => g.id !== group.id));
    setRows((prev) => prev.filter((r) => r.group_id !== group.id));
  };

  const handleAddRow = (groupId: number) => {
    const groupRows = rows.filter((r) => r.group_id === groupId);
    const newIndex = groupRows.length + 1;
    // blank col_values
    const blankVals: Record<string, string> = { line_label: "New Row" };
    for (const c of columns) {
      if (!blankVals[c.column_key]) {
        blankVals[c.column_key] = "";
      }
    }
    setRows((prev) => [
      ...prev,
      {
        group_id: groupId,
        order_index: newIndex,
        col_values: blankVals,
      },
    ]);
  };

  const handleRemoveRow = async (row: BudgetRow) => {
    if (row.id) {
      const { error } = await supabase
        .from("annual_budget_form_rows")
        .delete()
        .eq("id", row.id);
      if (error) {
        console.error("Error deleting row:", error);
        alert("Failed to delete row from database.");
        return;
      }
    }
    setRows((prev) => {
      const filtered = prev.filter((r) => r !== row);
      // reassign order_index in this group
      const groupRows = filtered.filter((r) => r.group_id === row.group_id);
      groupRows.forEach((rr, idx) => {
        rr.order_index = idx + 1;
      });
      return filtered;
    });
  };

  // ----------------------------------------------------------------
  // Save All
  // ----------------------------------------------------------------
  const handleSaveAll = async () => {
    try {
      // 1) Insert/Update groups
      for (const g of groups) {
        if (g.id < 0) {
          // Insert
          const { data, error } = await supabase
            .from("annual_budget_form_groups")
            .insert({ group_title: g.group_title, group_order: g.group_order })
            .select();
          if (error) {
            console.error("Insert group error:", error);
            continue;
          }
          if (data && data.length > 0) {
            const newRec = data[0];
            const oldId = g.id;
            // fix local IDs
            setGroups((prev) =>
              prev.map((gg) => (gg.id === oldId ? { ...gg, id: newRec.id } : gg))
            );
            setRows((prev) =>
              prev.map((r) =>
                r.group_id === oldId ? { ...r, group_id: newRec.id } : r
              )
            );
          }
        } else {
          // update
          const { error } = await supabase
            .from("annual_budget_form_groups")
            .update({ group_title: g.group_title, group_order: g.group_order })
            .eq("id", g.id);
          if (error) console.error("Update group error:", error);
        }
      }

      // 2) Insert/Update rows
      for (const r of rows) {
        if (!r.id) {
          // Insert
          const { data, error } = await supabase
            .from("annual_budget_form_rows")
            .insert({
              group_id: r.group_id,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .select();
          if (error) {
            console.error("Insert row error:", error);
            continue;
          }
          if (data && data.length > 0) {
            const newRow = data[0];
            setRows((prev) =>
              prev.map((rr) => (rr === r ? { ...rr, id: newRow.id } : rr))
            );
          }
        } else {
          // update
          const { error } = await supabase
            .from("annual_budget_form_rows")
            .update({
              group_id: r.group_id,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .eq("id", r.id);
          if (error) console.error("Update row error:", error);
        }
      }

      alert("All changes saved!");
    } catch (err) {
      console.error("SaveAll error:", err);
      alert("Error saving data.");
    }
  };

  // ----------------------------------------------------------------
  // Group rows for rendering
  // ----------------------------------------------------------------
  const rowsByGroup = useMemo(() => {
    const map: Record<number, BudgetRow[]> = {};
    for (const r of rows) {
      if (!map[r.group_id]) map[r.group_id] = [];
      map[r.group_id].push(r);
    }
    // sort by order_index
    for (const gId in map) {
      map[gId].sort((a, b) => a.order_index - b.order_index);
    }
    return map;
  }, [rows]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Optional top header container */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/home")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Operating Budget
        </h1>
        {/* Just a spacer or additional button if needed */}
        <div />
      </div>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">

          {groups.map((group) => {
            const groupRows = rowsByGroup[group.id] || [];

            return (
              <div key={group.id} className="mb-8">
                {/* Group heading */}
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold">
                      {group.group_title}
                    </h2>
                    {/* Let user rename group inline */}
                    <input
                      className="p-1 rounded border dark:bg-gray-600 dark:text-gray-200"
                      value={group.group_title}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((g) =>
                            g.id === group.id
                              ? { ...g, group_title: e.target.value }
                              : g
                          )
                        )
                      }
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveGroup(group)}
                    className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    Remove Group
                  </button>
                </div>

                {/* The table for this group */}
                <table className="w-full border border-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border p-2 w-1/4">Line Label</th>
                      {columns.map((col) => (
                        <th key={col.id} className="border p-2">
                          {col.display_label}
                        </th>
                      ))}
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((row) => {
                      const labelVal = row.col_values.line_label || "";
                      return (
                        <tr
                          key={row.id ?? `row-${group.id}-${row.order_index}`}
                          className="border-b"
                          draggable
                          onDragStart={() => handleDragStart(row)}
                          onDragOver={(e) => handleDragOver(e, row)}
                          onDrop={(e) => handleDrop(e, row)}
                        >
                          {/* line_label cell */}
                          <td className="border p-2 bg-gray-50 cursor-move">
                            <input
                              className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                              value={labelVal}
                              onChange={(e) =>
                                handleLineLabelChange(row, e.target.value)
                              }
                            />
                          </td>
                          {/* rest of the columns */}
                          {columns.map((col) => (
                            <td key={col.id} className="border p-2 bg-gray-50">
                              <input
                                className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                                value={row.col_values[col.column_key] || ""}
                                onChange={(e) =>
                                  handleCellChange(
                                    row,
                                    col.column_key,
                                    e.target.value
                                  )
                                }
                                readOnly={col.column_key === "col_change"}
                              />
                            </td>
                          ))}
                          {/* remove row button */}
                          <td className="border p-2 bg-gray-50">
                            <button
                              onClick={() => handleRemoveRow(row)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Add row button */}
                    <tr>
                      <td colSpan={columns.length + 2} className="border p-2 bg-gray-50">
                        <button
                          onClick={() => handleAddRow(group.id)}
                          className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                          + Add Row
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Buttons at the bottom */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleAddGroup}
              className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              + Add Group
            </button>
            <button
              onClick={handleSaveAll}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              Save All
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

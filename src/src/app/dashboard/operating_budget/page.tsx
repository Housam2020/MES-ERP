"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Database shapes for columns
interface BudgetColumn {
  id: number;
  column_key: string;       // e.g. "col_2024_2025"
  display_label: string;    // e.g. "2024 - 2025 Allocated"
  sort_order: number;
}

// "groups" table shape
interface GroupRecord {
  id: string;               // uuid in DB
  name: string | null;      // stored in "name" column
  group_order: number;      // new column we added
  created_at?: string;      // optional
  created_by?: string | null;
}

// Rows table shape referencing "groups(id)"
interface BudgetRow {
  id?: number;              // bigserial
  group_id: string;         // must match groups.id, which is a uuid
  row_type: string;         // 'data', 'total', etc.
  order_index: number;
  col_values: Record<string, string>;
}

export default function OperatingBudgetPage() {
  const supabase = createClient();
  const router = useRouter();

  const [columns, setColumns] = useState<BudgetColumn[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [dragRow, setDragRow] = useState<BudgetRow | null>(null);

  // ----------------------------------------------------------------
  // Fetch columns, groups, rows
  // ----------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      // 1) columns
      const { data: colData, error: colErr } = await supabase
        .from("annual_budget_form_columns")
        .select("*")
        .order("sort_order", { ascending: true });
      if (colErr) console.error("Columns error:", colErr);
      if (colData) setColumns(colData);

      // 2) groups
      const { data: grpData, error: grpErr } = await supabase
        .from("groups") // now pulling from your "groups" table
        .select("*")
        .order("group_order", { ascending: true });
      if (grpErr) console.error("Groups error:", grpErr);
      if (grpData) {
        // grpData is an array of { id: string, name: string, group_order: number, ... }
        setGroups(grpData as GroupRecord[]);
      }

      // 3) rows
      const { data: rowData, error: rowErr } = await supabase
        .from("annual_budget_form_rows")
        .select("*")
        .order("order_index", { ascending: true });
      if (rowErr) console.error("Rows error:", rowErr);
      if (rowData) {
        setRows(rowData as BudgetRow[]);
      }
    };
    loadData();
  }, [supabase]);

  // ----------------------------------------------------------------
  // parse/format currency
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
  // handleCellChange: auto-calc col_change
  // ----------------------------------------------------------------
  const handleCellChange = (row: BudgetRow, columnKey: string, newValue: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r !== row) return r;
        const updated = { ...r };
        updated.col_values = { ...updated.col_values, [columnKey]: newValue };

        // recalc col_change if col_2023_2024 or col_2024_2025 changed
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
  const handleDragStart = (row: BudgetRow) => setDragRow(row);

  const handleDragOver = (e: React.DragEvent, targetRow: BudgetRow) => {
    if (!dragRow || dragRow.group_id !== targetRow.group_id) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetRow: BudgetRow) => {
    e.preventDefault();
    if (!dragRow || dragRow.group_id !== targetRow.group_id) return;

    // reorder rows in local state
    setRows((prev) => {
      const sameGroup = prev.filter((rr) => rr.group_id === dragRow.group_id);
      const other = prev.filter((rr) => rr.group_id !== dragRow.group_id);

      const dragIndex = sameGroup.indexOf(dragRow);
      const targetIndex = sameGroup.indexOf(targetRow);

      sameGroup.splice(dragIndex, 1);
      sameGroup.splice(targetIndex, 0, dragRow);

      // reassign order_index
      sameGroup.forEach((r, idx) => {
        r.order_index = idx + 1;
      });

      return [...other, ...sameGroup];
    });

    setDragRow(null);
  };

  // ----------------------------------------------------------------
  // Add / Remove Groups
  // ----------------------------------------------------------------
  const handleAddGroup = () => {
    // Because "id" is a uuid, we can't do negative numbers. We'll do a "temp-" prefix.
    const tempId = `temp-${Date.now()}`;
    setGroups((prev) => [
      ...prev,
      { id: tempId, name: "New Group", group_order: prev.length + 1 },
    ]);
  };

  const handleRemoveGroup = async (g: GroupRecord) => {
    // If g.id is "temp-...", it's never been saved
    if (!g.id.startsWith("temp-")) {
      // remove from DB
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", g.id);
      if (error) {
        console.error("Error deleting group:", error);
        alert("Failed to delete group from DB.");
        return;
      }
    }
    // remove from local
    setGroups((prev) => prev.filter((gg) => gg !== g));
    // remove associated rows
    setRows((prev) => prev.filter((r) => r.group_id !== g.id));
  };

  // ----------------------------------------------------------------
  // Add / Remove Rows
  // ----------------------------------------------------------------
  const handleAddRow = (groupId: string) => {
    const groupRows = rows.filter((r) => r.group_id === groupId);
    const newIndex = groupRows.length + 1;
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
        row_type: "data",
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
        alert("Failed to delete row from DB");
        return;
      }
    }
    setRows((prev) => {
      const filtered = prev.filter((r) => r !== row);
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
      // 1) Insert/update groups
      for (const g of groups) {
        if (g.id.startsWith("temp-")) {
          // Insert new group
          const { data, error } = await supabase
            .from("groups")
            .insert({
              // we store "name" in the column "name", plus "group_order"
              name: g.name || "Unnamed",
              group_order: g.group_order,
            })
            .select();
          if (error) {
            console.error("Insert group error:", error);
            continue;
          }
          if (data && data.length > 0) {
            const inserted = data[0] as GroupRecord;
            const oldTempId = g.id;
            // fix local group ID
            setGroups((prev) =>
              prev.map((grp) => (grp.id === oldTempId ? inserted : grp))
            );
            // fix any rows referencing oldTempId
            setRows((prev) =>
              prev.map((r) =>
                r.group_id === oldTempId ? { ...r, group_id: inserted.id } : r
              )
            );
          }
        } else {
          // update existing group
          const { error } = await supabase
            .from("groups")
            .update({
              name: g.name,
              group_order: g.group_order,
            })
            .eq("id", g.id);
          if (error) {
            console.error("Update group error:", error);
          }
        }
      }

      // 2) Insert/update rows
      for (const r of rows) {
        if (!r.id) {
          // Insert
          const { data, error } = await supabase
            .from("annual_budget_form_rows")
            .insert({
              group_id: r.group_id,   // must be a real UUID if group was inserted
              row_type: r.row_type,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .select();
          if (error) {
            console.error("Insert row error:", error);
            continue;
          }
          if (data && data.length > 0) {
            const newRec = data[0];
            // fix local state
            setRows((prev) =>
              prev.map((rr) => (rr === r ? { ...rr, id: newRec.id } : rr))
            );
          }
        } else {
          // update existing
          const { error } = await supabase
            .from("annual_budget_form_rows")
            .update({
              group_id: r.group_id,
              row_type: r.row_type,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .eq("id", r.id);
          if (error) {
            console.error("Update row error:", error);
          }
        }
      }

      alert("All changes saved!");
    } catch (err) {
      console.error("SaveAll error:", err);
      alert("Error saving data.");
    }
  };

  // ----------------------------------------------------------------
  // Group rows for display
  // ----------------------------------------------------------------
  const rowsByGroup = useMemo(() => {
    const map: Record<string, BudgetRow[]> = {};
    for (const r of rows) {
      if (!map[r.group_id]) map[r.group_id] = [];
      map[r.group_id].push(r);
    }
    for (const gId of Object.keys(map)) {
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
        <div />
      </div>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">

          {groups.map((group) => {
            const groupRows = rowsByGroup[group.id] || [];
            return (
              <div key={group.id} className="mb-8">
                {/* Heading row */}
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <div className="flex items-center space-x-2">
                    {/* If group.name is null, fallback to empty string */}
                    <h2 className="text-xl font-bold">
                      {group.name || "Unnamed Group"}
                    </h2>
                    <input
                      className="p-1 rounded border dark:bg-gray-600 dark:text-gray-200"
                      value={group.name || ""}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((gRec) =>
                            gRec.id === group.id
                              ? { ...gRec, name: e.target.value }
                              : gRec
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
                          {/* line_label */}
                          <td className="border p-2 bg-gray-50 cursor-move">
                            <input
                              className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                              value={labelVal}
                              onChange={(e) =>
                                handleLineLabelChange(row, e.target.value)
                              }
                            />
                          </td>

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

                          {/* remove row */}
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

                    {/* add row */}
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

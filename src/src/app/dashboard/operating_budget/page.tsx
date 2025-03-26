"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader"; // ✅ Import added

// Database shapes
interface BudgetColumn {
  id: number;
  column_key: string;
  display_label: string;
  sort_order: number;
}

interface GroupRecord {
  id: string;
  name: string | null;
  group_order: number;
  total_budget?: number | string;
}

interface BudgetRow {
  id?: number;
  group_id: string;
  row_type: string;
  order_index: number;
  col_values: Record<string, string>;
}

export default function OperatingBudgetPage() {
  const supabase = createClient();
  const router = useRouter();

  const { permissions, loading: permissionsLoading } = usePermissions();

  const [columns, setColumns] = useState<BudgetColumn[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [dragRow, setDragRow] = useState<BudgetRow | null>(null);

  useEffect(() => {
    if (!permissionsLoading) {
      if (!permissions.includes("view_all_requests")) {
        router.push("/dashboard/home");
      }
    }
  }, [permissions, permissionsLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      const { data: colData } = await supabase
        .from("annual_budget_form_columns")
        .select("*")
        .order("sort_order", { ascending: true });
      if (colData) setColumns(colData);

      const { data: grpData } = await supabase
        .from("groups")
        .select("id, name, group_order, total_budget")
        .order("group_order", { ascending: true });
      if (grpData) setGroups(grpData);

      const { data: rowData } = await supabase
        .from("annual_budget_form_rows")
        .select("*")
        .order("order_index", { ascending: true });
      if (rowData) setRows(rowData);
    };
    loadData();
  }, [supabase]);

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(num);
  };

  const handleCellChange = (row: BudgetRow, columnKey: string, newValue: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r !== row) return r;
        const updated = { ...r };
        updated.col_values = { ...updated.col_values, [columnKey]: newValue };

        if (columnKey === "col_2023_2024" || columnKey === "col_2024_2025") {
          const v2023 = parseCurrency(updated.col_values["col_2023_2024"] || "");
          const v2025 = parseCurrency(updated.col_values["col_2024_2025"] || "");
          updated.col_values["col_change"] = formatCurrency(v2025 - v2023);
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

  const handleDragStart = (row: BudgetRow) => setDragRow(row);

  const handleDragOver = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetRow: BudgetRow
  ) => {
    if (!dragRow || dragRow.group_id !== targetRow.group_id) return;
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetRow: BudgetRow
  ) => {
    e.preventDefault();
    if (!dragRow) return;

    setRows((prev) => {
      const sameGroup = prev.filter((rr) => rr.group_id === dragRow.group_id);
      const others = prev.filter((rr) => rr.group_id !== dragRow.group_id);

      const dragIndex = sameGroup.indexOf(dragRow);
      const targetIndex = sameGroup.indexOf(targetRow);

      sameGroup.splice(dragIndex, 1);
      sameGroup.splice(targetIndex, 0, dragRow);

      sameGroup.forEach((r, idx) => {
        r.order_index = idx + 1;
      });

      return [...others, ...sameGroup];
    });
    setDragRow(null);
  };

  const handleAddGroup = () => {
    const tempId = `temp-${Date.now()}`;
    setGroups((prev) => [
      ...prev,
      {
        id: tempId,
        name: "New Group",
        group_order: prev.length + 1,
        total_budget: 0,
      },
    ]);
  };

  const handleRemoveGroup = async (g: GroupRecord) => {
    if (!g.id.startsWith("temp-")) {
      await supabase.from("groups").delete().eq("id", g.id);
    }
    setGroups((prev) => prev.filter((x) => x !== g));
    setRows((prev) => prev.filter((r) => r.group_id !== g.id));
  };

  const handleAddRow = (groupId: string) => {
    const groupRows = rows.filter((r) => r.group_id === groupId);
    const newIndex = groupRows.length + 1;
    const blankVals: Record<string, string> = { line_label: "New Row" };
    for (const c of columns) {
      if (!blankVals[c.column_key]) blankVals[c.column_key] = "";
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
      await supabase.from("annual_budget_form_rows").delete().eq("id", row.id);
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

  const handleSaveAll = async () => {
    try {
      for (const g of groups) {
        if (g.id.startsWith("temp-")) {
          const { data, error } = await supabase
            .from("groups")
            .insert({
              name: g.name || "Unnamed",
              group_order: g.group_order,
              total_budget: g.total_budget || 0,
            })
            .select();
          if (!error && data && data.length > 0) {
            const inserted = data[0] as GroupRecord;
            const oldTempId = g.id;
            setGroups((prev) =>
              prev.map((x) => (x.id === oldTempId ? inserted : x))
            );
            setRows((prev) =>
              prev.map((r) =>
                r.group_id === oldTempId ? { ...r, group_id: inserted.id } : r
              )
            );
          }
        } else {
          await supabase
            .from("groups")
            .update({
              name: g.name,
              group_order: g.group_order,
              total_budget: g.total_budget || 0,
            })
            .eq("id", g.id);
        }
      }

      for (const r of rows) {
        if (!r.id) {
          const { data } = await supabase
            .from("annual_budget_form_rows")
            .insert({
              group_id: r.group_id,
              row_type: r.row_type,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .select();
          if (data && data.length > 0) {
            const newRec = data[0];
            setRows((prev) =>
              prev.map((rr) => (rr === r ? { ...rr, id: newRec.id } : rr))
            );
          }
        } else {
          await supabase
            .from("annual_budget_form_rows")
            .update({
              group_id: r.group_id,
              row_type: r.row_type,
              order_index: r.order_index,
              col_values: r.col_values,
            })
            .eq("id", r.id);
        }
      }

      alert("All changes saved!");
    } catch (err) {
      console.error("SaveAll error:", err);
      alert("Error saving data.");
    }
  };

  const rowsByGroup = useMemo(() => {
    const map: Record<string, BudgetRow[]> = {};
    for (const row of rows) {
      if (!map[row.group_id]) map[row.group_id] = [];
      map[row.group_id].push(row);
    }
    for (const gId of Object.keys(map)) {
      map[gId].sort((a, b) => a.order_index - b.order_index);
    }
    return map;
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader /> {/* ✅ Added */}

      <main className="p-4 max-w-7xl mx-auto">
        {/* Page Title + Back Button */}
        <div className="flex items-center justify-between mb-4">
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

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          {groups.map((group) => {
            const groupRows = rowsByGroup[group.id] || [];
            return (
              <div key={group.id} className="mb-8">
                {/* Group heading */}
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <div className="flex items-center space-x-2">
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
                    {/* total_budget input */}
                    <label className="ml-4 font-semibold">Budget:</label>
                    <input
                      type="number"
                      step="0.01"
                      className="p-1 rounded border dark:bg-gray-600 dark:text-gray-200 w-32"
                      value={group.total_budget ?? ""}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((gRec) =>
                            gRec.id === group.id
                              ? { ...gRec, total_budget: e.target.value }
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

                    {/* Add row */}
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

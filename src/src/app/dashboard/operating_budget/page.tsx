"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Footer from "@/components/dashboard/Footer";

interface GroupRecord {
  id: string;
  name: string | null;
  group_order: number;
  total_budget?: number | string;
}

interface BudgetLine {
  id?: number;            // new lines won’t have an ID yet
  group_id: string;       // references groups.id
  line_label: string;
  amount: number;         // store a positive number
  line_type: "income" | "expense"; // new: determines if it adds or subtracts from total
  order_index: number;
  request_id?: string;    // if tied to payment request
}

export default function OperatingBudgetPage() {
  const supabase = createClient();
  const router = useRouter();

  const { permissions, loading: permissionsLoading } = usePermissions();

  // State
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [dragLine, setDragLine] = useState<BudgetLine | null>(null);

  // Ensure user has permission
  useEffect(() => {
    if (!permissionsLoading) {
      if (!permissions.includes("view_all_requests")) {
        router.push("/dashboard/home");
      }
    }
  }, [permissions, permissionsLoading, router]);

  // Load data from supabase
  useEffect(() => {
    const loadData = async () => {
      // 1) Load groups
      const { data: grpData, error: grpError } = await supabase
        .from("groups")
        .select("*")
        .order("group_order", { ascending: true });

      if (grpError) {
        console.error("Error loading groups:", grpError);
        return;
      }
      setGroups(grpData || []);

      // 2) Load lines
      const { data: lineData, error: lineError } = await supabase
        .from("operating_budget_lines")
        .select("*")
        .order("order_index", { ascending: true });

      if (lineError) {
        console.error("Error loading lines:", lineError);
        return;
      }

      // Convert amounts to number; ensure line_type is either "income" or "expense"
      const typedLines: BudgetLine[] = (lineData || []).map((l: any) => ({
        ...l,
        amount: Number(l.amount ?? 0),
        line_type:
          l.line_type === "income" ? "income" : "expense", // default to expense if not set
      }));

      setLines(typedLines);
    };

    loadData();
  }, [supabase]);

  // Drag & drop
  const handleDragStart = (line: BudgetLine) => setDragLine(line);

  const handleDragOver = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetLine: BudgetLine
  ) => {
    if (!dragLine || dragLine.group_id !== targetLine.group_id) return;
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetLine: BudgetLine
  ) => {
    e.preventDefault();
    if (!dragLine) return;

    setLines((prev) => {
      const sameGroup = prev.filter((ln) => ln.group_id === dragLine.group_id);
      const others = prev.filter((ln) => ln.group_id !== dragLine.group_id);

      const dragIndex = sameGroup.indexOf(dragLine);
      const targetIndex = sameGroup.indexOf(targetLine);

      sameGroup.splice(dragIndex, 1);
      sameGroup.splice(targetIndex, 0, dragLine);

      sameGroup.forEach((ln, idx) => {
        ln.order_index = idx + 1;
      });

      return [...others, ...sameGroup];
    });
    setDragLine(null);
  };

  const handleAddLine = (groupId: string) => {
    const groupLines = lines.filter((ln) => ln.group_id === groupId);
    const newIndex = groupLines.length + 1;
  
    const newLine: BudgetLine = {
      group_id: groupId,
      line_label: "New Line",
      amount: 0,
      line_type: "income",
      order_index: newIndex,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handleRemoveLine = async (line: BudgetLine) => {
    if (line.id) {
      await supabase
        .from("operating_budget_lines")
        .delete()
        .eq("id", line.id);
    }
    // remove from local state
    setLines((prev) =>
      prev.filter((l) => l !== line).map((l, idx) => {
        // reassign order_index for that group
        if (l.group_id === line.group_id) {
          return { ...l, order_index: idx + 1 };
        }
        return l;
      })
    );
  };

  // Handle changes
  const handleLabelChange = (line: BudgetLine, newLabel: string) => {
    setLines((prev) =>
      prev.map((ln) =>
        ln === line ? { ...ln, line_label: newLabel } : ln
      )
    );
  };

  const handleAmountChange = (line: BudgetLine, newAmt: string) => {
    const asNumber = parseFloat(newAmt) || 0;
    setLines((prev) =>
      prev.map((ln) =>
        ln === line ? { ...ln, amount: asNumber } : ln
      )
    );
  };

  const handleLineTypeChange = (line: BudgetLine, newType: string) => {
    // Ensure newType is either "income" or "expense"
    const finalType = newType === "income" ? "income" : "expense";
    setLines((prev) =>
      prev.map((ln) =>
        ln === line ? { ...ln, line_type: finalType } : ln
      )
    );
  };

  // Compute lines by group
  const linesByGroup = useMemo(() => {
    const map: Record<string, BudgetLine[]> = {};
    for (const ln of lines) {
      if (!map[ln.group_id]) map[ln.group_id] = [];
      map[ln.group_id].push(ln);
    }
    for (const gId of Object.keys(map)) {
      map[gId].sort((a, b) => a.order_index - b.order_index);
    }
    return map;
  }, [lines]);

  // Sum for each group
  const getGroupTotal = (groupId: string) => {
    const groupLines = linesByGroup[groupId] || [];
    return groupLines.reduce((sum, ln) => {
      // Add if income, subtract if expense
      return ln.line_type === "income"
        ? sum + ln.amount
        : sum - ln.amount;
    }, 0);
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // Insert or Update lines
      for (const ln of lines) {
        if (!ln.id) {
          // Insert new
          const { data, error } = await supabase
            .from("operating_budget_lines")
            .insert({
              group_id: ln.group_id,
              line_label: ln.line_label,
              amount: ln.amount,
              line_type: ln.line_type,
              order_index: ln.order_index,
              request_id: ln.request_id ?? null,
            })
            .select();

          if (error) {
            console.error("Error inserting line:", error);
            continue;
          }
          if (data && data.length > 0) {
            const newLine = data[0];
            setLines((prev) =>
              prev.map((p) =>
                p === ln ? { ...p, id: newLine.id } : p
              )
            );
          }
        } else {
          // Update existing
          const { error } = await supabase
            .from("operating_budget_lines")
            .update({
              line_label: ln.line_label,
              amount: ln.amount,
              line_type: ln.line_type,
              order_index: ln.order_index,
            })
            .eq("id", ln.id);

          if (error) {
            console.error("Error updating line:", error);
          }
        }
      }

      // Optionally update group total_budget
      for (const g of groups) {
        const sum = getGroupTotal(g.id);
        const { error: grpErr } = await supabase
          .from("groups")
          .update({ total_budget: sum })
          .eq("id", g.id);
        if (grpErr) {
          console.error("Error updating group total:", grpErr);
        }
      }

      alert("All changes saved!");
    } catch (err) {
      console.error("SaveAll error:", err);
      alert("Error saving data.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader />
      <main className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Operating Budget
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          {groups.map((group) => {
            const groupLines = linesByGroup[group.id] || [];
            const groupTotal = getGroupTotal(group.id);

            return (
              <div key={group.id} className="mb-8">
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold">
                      {group.name || "Unnamed Group"}
                    </h2>
                    <span className="ml-4 font-semibold">Total: </span>
                    <span>{groupTotal.toFixed(2)}</span>
                  </div>
                </div>

                <table className="w-full border border-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="border p-2">Label</th>
                      <th className="border p-2">Amount</th>
                      <th className="border p-2">Type</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupLines.map((line) => (
                      <tr
                        key={line.id ?? `temp-${line.order_index}`}
                        className="border-b"
                        draggable
                        onDragStart={() => handleDragStart(line)}
                        onDragOver={(e) => handleDragOver(e, line)}
                        onDrop={(e) => handleDrop(e, line)}
                      >
                        <td className="border p-2 bg-gray-50 cursor-move">
                          <input
                            className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                            value={line.line_label}
                            onChange={(e) =>
                              handleLabelChange(line, e.target.value)
                            }
                          />
                        </td>
                        <td className="border p-2 bg-gray-50">
                          <input
                            type="number"
                            className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                            value={line.amount}
                            onChange={(e) =>
                              handleAmountChange(line, e.target.value)
                            }
                          />
                        </td>
                        <td className="border p-2 bg-gray-50">
                          <select
                            className="w-full p-1 rounded border dark:bg-gray-700 dark:text-gray-200"
                            value={line.line_type}
                            onChange={(e) =>
                              handleLineTypeChange(line, e.target.value)
                            }
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </td>
                        <td className="border p-2 bg-gray-50">
                          <button
                            onClick={() => handleRemoveLine(line)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className="border p-2 bg-gray-50">
                        <button
                          onClick={() => handleAddLine(group.id)}
                          className="bg-[#7A003C] text-white py-1 px-3 rounded hover:bg-[#680033]"
                        >
                          + Add Line
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
              onClick={handleSaveAll}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Save All
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

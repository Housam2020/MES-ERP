"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import _ from "lodash";

export function useAnalyticsData() {
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();

  const [paymentRequests, setPaymentRequests] = useState([]);
  const [budgetData, setBudgetData] = useState([]); // We'll store operating_budget_lines data here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user can view analytics
        const canViewAnalytics =
          permissions.includes("view_all_requests") ||
          permissions.includes("view_club_requests");

        if (!canViewAnalytics) {
          router.push("/dashboard/home");
          return;
        }

        // 1) Base query for payment requests
        let requestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: true });

        // 2) Filter by groups if only club-level access
        if (!permissions.includes("view_all_requests")) {
          const { data: userRoles, error: userRolesError } = await supabase
            .from("user_roles")
            .select("group_id")
            .eq("user_id", user.id)
            .not("group_id", "is", null);

          if (userRolesError) throw userRolesError;

          if (userRoles?.length) {
            const groupIds = userRoles
              .map((role) => role.group_id)
              .filter(Boolean);
            requestsQuery = requestsQuery.in("group_id", groupIds);
          }
        }

        const { data: requests, error: requestsError } = await requestsQuery;
        if (requestsError) throw requestsError;

        // 3) Fetch operating_budget_lines (instead of annual_budget_form_rows)
        const { data: budgetLines, error: budgetError } = await supabase
          .from("operating_budget_lines")
          .select(`
            id,
            group_id,
            line_label,
            amount,
            line_type,
            order_index,
            groups (
              id,
              name,
              total_budget
            )
          `)
          .order("order_index", { ascending: true });

        if (budgetError) throw budgetError;

        setPaymentRequests(requests || []);
        setBudgetData(budgetLines || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && !permissionsError) {
      fetchData();
    }
  }, [permissions, permissionsLoading, permissionsError, router, supabase]);

  // -------------------------------
  // Calculate analytics
  // -------------------------------
  const analytics = useMemo(() => {
    if (!paymentRequests?.length) return null;

    // 1) Monthly trends
    const monthlyData = _.chain(paymentRequests)
      .groupBy((req) => {
        const date = new Date(req.timestamp);
        // Format as "YYYY-MM"
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      })
      .map((requests, month) => ({
        month,
        total: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy("month")
      .value();

    // 2) Status distribution
    const statusData = _.chain(paymentRequests)
      .groupBy("status")
      .map((requests, status) => ({
        status,
        value: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
        count: requests.length,
      }))
      .value();

    // 3) Group distribution
    const groupData = _.chain(paymentRequests)
      .groupBy((r) => r.groups?.name || "Unassigned")
      .map((requests, group) => ({
        group,
        value: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy(["value"], ["desc"])
      .value();

    // 4) Average request by timeframe
    const timeframeData = _.chain(paymentRequests)
      .filter((r) => (r.amount_requested_cad || 0) > 0 && r.payment_timeframe)
      .groupBy("payment_timeframe")
      .map((requests, timeframe) => ({
        timeframe: timeframe || "Unspecified",
        averageAmount: _.meanBy(requests, (r) => r.amount_requested_cad || 0),
        count: requests.length,
      }))
      .value();

    // 5) Budget Line distribution (based on payment_requests.budget_line)
    const budgetLineData = _.chain(paymentRequests)
      .groupBy("budget_line")
      .map((requests, budgetLine) => ({
        name: budgetLine || "Unspecified",
        value: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy(["value"], ["desc"])
      .value();

    // 6) Request volume by Day of Week
    const dayOfWeekData = _.chain(paymentRequests)
      .groupBy((r) => {
        const date = new Date(r.timestamp);
        return date.toLocaleDateString("en-US", { weekday: "long" });
      })
      .map((requests, day) => ({
        day,
        count: requests.length,
        value: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
      }))
      .value();

    // 7) Top requesters
    const topRequesters = _.chain(paymentRequests)
      .groupBy("email_address")
      .map((requests, email) => ({
        email: email || "Unknown",
        count: requests.length,
        totalAmount: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
      }))
      .orderBy(["count"], ["desc"])
      .take(10)
      .value();

    // 8) Budget vs Actual Spending
    //
    // We'll compare:
    //   - The actual spent from paymentRequests, grouped by `budget_line`
    //   - The allocated "amount" from operating_budget_lines with matching line_label
    //
    // This is a guess at how you're correlating requests <-> lines. Adjust as needed.
    const budgetComparison = _.chain(paymentRequests)
      .groupBy("budget_line")
      .map((requests, budgetLine) => {
        const actualSpent = _.sumBy(requests, (r) => r.amount_requested_cad || 0);

        // Try to find a matching operating_budget_line by label
        const matchedLine = budgetData.find(
          (line) => line.line_label === budgetLine
        );

        // If found, we interpret `line_type: "income"` or "expense" and an .amount
        // If it's an "expense" line, that might represent allocated funds.
        // This is somewhat guessy; adapt to your data.
        const allocated = matchedLine?.amount ?? 0;
        const groupTotalBudget = matchedLine?.groups?.total_budget ?? 0;

        // We'll treat "utilizationRate" as actualSpent / allocated * 100
        // If allocated is 0, rate = 0
        return {
          budgetLine: budgetLine || "Unspecified",
          actualSpent,
          allocated,
          utilizationRate: allocated ? (actualSpent / allocated) * 100 : 0,
          groupBudget: groupTotalBudget,
          groupUtilization: groupTotalBudget
            ? (actualSpent / groupTotalBudget) * 100
            : 0,
        };
      })
      .orderBy(["utilizationRate"], ["desc"])
      .value();

    // 9) Seasonal analysis
    const seasonalAnalysis = _.chain(paymentRequests)
      .groupBy((r) => {
        const date = new Date(r.timestamp);
        const month = date.getMonth();
        // Group into seasons as an example
        if (month >= 8 && month <= 11) return "Fall";
        if (month >= 0 && month <= 3) return "Winter";
        return "Spring/Summer";
      })
      .map((requests, season) => ({
        season,
        count: requests.length,
        totalAmount: _.sumBy(requests, (r) => r.amount_requested_cad || 0),
      }))
      .value();

    // 10) Budget utilization timeline
    const budgetTimeline = _.chain(paymentRequests)
      .orderBy(["timestamp"], ["asc"])
      .reduce((acc, r) => {
        const amount = r.amount_requested_cad || 0;
        const lastTotal = acc.length ? acc[acc.length - 1].cumulativeTotal : 0;
        return [
          ...acc,
          {
            date: r.timestamp,
            amount,
            cumulativeTotal: lastTotal + amount,
          },
        ];
      }, [])
      .value();

    return {
      monthlyData,
      statusData,
      groupData,
      timeframeData,
      budgetLineData,
      dayOfWeekData,
      topRequesters,
      budgetComparison,
      seasonalAnalysis,
      budgetTimeline,
    };
  }, [paymentRequests, budgetData]);

  return {
    analytics,
    loading: loading || permissionsLoading,
    error: error || permissionsError,
  };
}

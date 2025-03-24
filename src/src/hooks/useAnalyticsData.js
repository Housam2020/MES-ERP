// hooks/useAnalyticsData.js
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
  const [budgetData, setBudgetData] = useState([]);
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

        // Base query for payment requests
        let requestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: true });

        // Filter by groups if club-level access
        if (!permissions.includes("view_all_requests")) {
          // Get user's groups from user_roles junction table
          const { data: userRoles, error: userRolesError } = await supabase
            .from("user_roles")
            .select("group_id")
            .eq("user_id", user.id)
            .not("group_id", "is", null);

          if (userRolesError) throw userRolesError;

          if (userRoles?.length) {
            const groupIds = userRoles.map(role => role.group_id).filter(Boolean);
            requestsQuery = requestsQuery.in("group_id", groupIds);
          }
        }

        const { data: requests, error: requestsError } = await requestsQuery;

        if (requestsError) throw requestsError;

        // Update budget data fetch to use new schema
        const { data: budgetRows, error: budgetError } = await supabase
          .from("annual_budget_form_rows")
          .select(
            `
            id,
            row_type,
            col_values,
            groups (
              id,
              name,
              total_budget
            )
          `
          )
          .eq("row_type", "data") // Only get data rows, not totals
          .order("order_index");

        if (budgetError) throw budgetError;

        setPaymentRequests(requests || []);
        setBudgetData(budgetRows || []);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data")
        );
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && !permissionsError) {
      fetchData();
    }
  }, [permissions, permissionsLoading, permissionsError]);

  // Calculate analytics using useMemo to prevent unnecessary recalculations
  const analytics = useMemo(() => {
    if (!paymentRequests?.length) return null;

    // Monthly trends
    const monthlyData = _.chain(paymentRequests)
      .groupBy((req) => {
        const date = new Date(req.timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      })
      .map((requests, month) => ({
        month,
        total: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy("month")
      .value();

    // Status distribution
    const statusData = _.chain(paymentRequests)
      .groupBy("status")
      .map((requests, status) => ({
        status,
        value: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
        count: requests.length,
      }))
      .value();

    // Group distribution
    const groupData = _.chain(paymentRequests)
      .groupBy((req) => req.groups?.name || "Unassigned")
      .map((requests, group) => ({
        group,
        value: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy(["value"], ["desc"])
      .value();

    // Average request by timeframe
    const timeframeData = _.chain(paymentRequests)
      .filter(
        (req) => (req.amount_requested_cad || 0) > 0 && req.payment_timeframe
      )
      .groupBy("payment_timeframe")
      .map((requests, timeframe) => ({
        timeframe: timeframe || "Unspecified",
        averageAmount: _.meanBy(
          requests,
          (req) => req.amount_requested_cad || 0
        ),
        count: requests.length,
      }))
      .value();

    // Budget Line Distribution
    const budgetLineData = _.chain(paymentRequests)
      .groupBy("budget_line")
      .map((requests, budget_line) => ({
        name: budget_line || "Unspecified",
        value: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
        count: requests.length,
      }))
      .orderBy(["value"], ["desc"])
      .value();

    // Request Volume by Day of Week
    const dayOfWeekData = _.chain(paymentRequests)
      .groupBy((req) => {
        const date = new Date(req.timestamp);
        return date.toLocaleDateString("en-US", { weekday: "long" });
      })
      .map((requests, day) => ({
        day,
        count: requests.length,
        value: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
      }))
      .value();

    // Top Requesters
    const topRequesters = _.chain(paymentRequests)
      .groupBy("email_address")
      .map((requests, email) => ({
        email: email || "Unknown",
        count: requests.length,
        totalAmount: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
      }))
      .orderBy(["count"], ["desc"])
      .take(10)
      .value();

    // Budget vs Actual Spending
    const budgetComparison = _.chain(paymentRequests)
      .groupBy("budget_line")
      .map((requests, budgetLine) => {
        const actualSpent = _.sumBy(
          requests,
          (req) => req.amount_requested_cad || 0
        );

        // Find matching budget row using the new schema
        const budgetRow = budgetData?.find(
          (row) => row.col_values?.line_label === budgetLine
        );

        // Get allocated amount from the new col_values structure
        const allocated = Number(budgetRow?.col_values?.col_2024_2025) || 0;

        // Calculate group total budget if available
        const groupTotalBudget = budgetRow?.groups?.total_budget || 0;

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

    // Seasonal Analysis
    const seasonalAnalysis = _.chain(paymentRequests)
      .groupBy((req) => {
        const date = new Date(req.timestamp);
        const month = date.getMonth();
        // Group into seasons
        if (month >= 8 && month <= 11) return "Fall";
        if (month >= 0 && month <= 3) return "Winter";
        return "Spring/Summer";
      })
      .map((requests, season) => ({
        season,
        count: requests.length,
        totalAmount: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
      }))
      .value();

    // Budget Utilization Timeline
    const budgetTimeline = _.chain(paymentRequests)
      .orderBy(["timestamp"], ["asc"])
      .reduce((acc, req) => {
        const amount = req.amount_requested_cad || 0;
        const lastTotal = acc.length ? acc[acc.length - 1].cumulativeTotal : 0;
        return [
          ...acc,
          {
            date: req.timestamp,
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

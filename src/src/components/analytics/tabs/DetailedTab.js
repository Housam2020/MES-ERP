// components/analytics/tabs/DetailedTab.js
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  BudgetLineDistributionChart,
  DayOfWeekChart,
  TopRequestersTable,
  BudgetUtilizationChart,
  SeasonalSpendingChart,
  CumulativeSpendingChart
} from "../charts";

export default function DetailedTab({ analytics }) {
  if (!analytics) return null;

  return (
    <TabsContent value="detailed">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Line Distribution */}
        <BudgetLineDistributionChart data={analytics.budgetLineData} />

        {/* Request Volume by Day of Week */}
        <DayOfWeekChart data={analytics.dayOfWeekData} />

        {/* Top Requesters Table */}
        <TopRequestersTable data={analytics.topRequesters} />

        {/* Budget Utilization vs Allocation */}
        <BudgetUtilizationChart data={analytics.budgetComparison} />

        {/* Seasonal Spending Analysis */}
        <SeasonalSpendingChart data={analytics.seasonalAnalysis} />

        {/* Cumulative Spending Timeline */}
        <CumulativeSpendingChart data={analytics.budgetTimeline} />
      </div>
    </TabsContent>
  );
}

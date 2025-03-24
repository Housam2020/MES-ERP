// components/analytics/tabs/OverviewTab.js
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  MonthlyTrendsChart,
  StatusDistributionChart,
  GroupDistributionChart,
  PaymentTimeframeChart
} from "../charts";

export default function OverviewTab({ analytics }) {
  if (!analytics) return null;

  return (
    <TabsContent value="overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <MonthlyTrendsChart data={analytics.monthlyData} />

        {/* Status Distribution */}
        <StatusDistributionChart data={analytics.statusData} />

        {/* Group Distribution */}
        <GroupDistributionChart data={analytics.groupData} />

        {/* Payment Timeframe Analysis */}
        <PaymentTimeframeChart data={analytics.timeframeData} />
      </div>
    </TabsContent>
  );
}

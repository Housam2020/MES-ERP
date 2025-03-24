"use client";
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import OverviewTab from "@/components/analytics/tabs/OverviewTab";
import DetailedTab from "@/components/analytics/tabs/DetailedTab";

export default function AnalyticsPage() {
  const { analytics, loading, error } = useAnalyticsData();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-lg">Loading analytics data...</div>
      </main>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading data:</p>
          <p>{error.message}</p>
        </div>
      </main>
    </div>
  );

  if (!analytics) return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-lg">No data available for analysis</div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Tabs 
          defaultValue="overview" 
          className="space-y-4"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          </TabsList>

          <OverviewTab analytics={analytics} />
          <DetailedTab analytics={analytics} />
        </Tabs>
      </main>
    </div>
  );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import _ from "lodash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF99E6",
  "#AA80FF",
];

export default function AnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();
  const [paymentRequests, setPaymentRequests] = useState([]);
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

        // Filter by group if club-level access
        if (!permissions.includes("view_all_requests")) {
          const { data: userData } = await supabase
            .from("users")
            .select("group_id")
            .eq("id", user.id)
            .single();

          if (userData?.group_id) {
            requestsQuery = requestsQuery.eq("group_id", userData.group_id);
          }
        }

        const { data: requests, error: requestsError } = await requestsQuery;

        if (requestsError) throw requestsError;
        setPaymentRequests(requests || []);
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

    // Payment Method Distribution
    const paymentMethodData = _.chain(paymentRequests)
      .groupBy("preferred_payment_form")
      .map((requests, method) => ({
        name: method || "Unspecified",
        value: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
        count: requests.length,
      }))
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

    return {
      monthlyData,
      statusData,
      groupData,
      timeframeData,
      budgetLineData,
      paymentMethodData,
      dayOfWeekData,
      topRequesters,
    };
  }, [paymentRequests]);

  if (loading || permissionsLoading) return <div>Loading...</div>;
  if (error || permissionsError)
    return (
      <div>Error loading data: {(error || permissionsError)?.message}</div>
    );
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Payment Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#0088FE"
                        name="Total Amount ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusData}
                        dataKey="value"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) =>
                          `${name || "Unknown"}: $${Number(value || 0).toFixed(
                            2
                          )}`
                        }
                      >
                        {analytics.statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Group Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Group</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.groupData}
                        dataKey="value"
                        nameKey="group"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) =>
                          `${name || "Unknown"}: $${Number(value || 0).toFixed(
                            2
                          )}`
                        }
                      >
                        {analytics.groupData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Timeframe Analysis */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>
                    Average Request Amount by Payment Timeframe
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.timeframeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeframe" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="averageAmount"
                        fill="#0088FE"
                        name="Average Amount ($)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Line Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Line Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.budgetLineData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) =>
                          `${name || "Unknown"}: $${Number(value || 0).toFixed(
                            2
                          )}`
                        }
                      >
                        {analytics.budgetLineData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Request Volume by Day of Week */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume by Day of Week</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#0088FE"
                        name="Number of Requests"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Requesters Table */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Top Requesters</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Number of Requests</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topRequesters.map((requester, index) => (
                          <TableRow key={index}>
                            <TableCell>{requester.email}</TableCell>
                            <TableCell>{requester.count}</TableCell>
                            <TableCell>
                              ${(requester.totalAmount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Payment Method Distribution */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.paymentMethodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `$${Number(value || 0).toFixed(2)}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#00C49F"
                        name="Total Amount ($)"
                      />
                      <Bar
                        dataKey="count"
                        fill="#0088FE"
                        name="Number of Requests"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

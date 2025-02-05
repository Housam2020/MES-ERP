"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import _ from 'lodash';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF99E6', '#AA80FF'];

export default function AnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
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

        // Fetch all payment requests
        const { data: requests, error: requestsError } = await supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: true });

        if (requestsError) {
          console.error("Error fetching payment requests:", requestsError);
          setError(requestsError);
        } else {
          setPaymentRequests(requests);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate various analytics
  const analytics = useMemo(() => {
    if (!paymentRequests?.length) return null;

    // Monthly trends
    const monthlyData = _.chain(paymentRequests)
      .groupBy(req => {
        const date = new Date(req.timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
      .map((requests, month) => ({
        month,
        total: _.sumBy(requests, 'amount_requested_cad'),
        count: requests.length
      }))
      .orderBy('month')
      .value();

    // Status distribution
    const statusData = _.chain(paymentRequests)
      .groupBy('status')
      .map((requests, status) => ({
        status,
        value: _.sumBy(requests, 'amount_requested_cad'),
        count: requests.length
      }))
      .value();

    // Group distribution
    const groupData = _.chain(paymentRequests)
      .groupBy(req => req.groups?.name || 'Unassigned')
      .map((requests, group) => ({
        group,
        value: _.sumBy(requests, 'amount_requested_cad'),
        count: requests.length
      }))
      .orderBy(['value'], ['desc'])
      .value();

    // Average request by timeframe
    const timeframeData = _.chain(paymentRequests)
    .filter(req => req.amount_requested_cad > 0 && req.payment_timeframe) // Only include requests with amount and timeframe
    .groupBy('payment_timeframe')
    .map((requests, timeframe) => ({
        timeframe: timeframe || 'Unspecified',
        averageAmount: _.meanBy(requests, 'amount_requested_cad'),
        count: requests.length
    }))
    .value();

    return {
      monthlyData,
      statusData,
      groupData,
      timeframeData
    };
  }, [paymentRequests]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
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
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#0088FE" name="Total Amount ($)" />
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
                    label={({ name, value }) => `${name}: $${Number(value).toFixed(2)}`}
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
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
                    label={({ name, value }) => `${name}: $${Number(value).toFixed(2)}`}
                  >
                    {analytics.groupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Timeframe Analysis */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Average Request Amount by Payment Timeframe</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timeframeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeframe" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="averageAmount" fill="#0088FE" name="Average Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

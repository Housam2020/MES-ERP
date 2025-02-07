"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { createClient } from "@/utils/supabase/client";
import _ from 'lodash';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardAnalytics = ({ paymentRequests }) => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: permissions } = await supabase
        .from('users')
        .select(`
          role_id,
          roles!inner (
            role_permissions!inner (
              permissions!inner (
                name
              )
            )
          )
        `)
        .eq('id', user.id)
        .single();

      const perms = permissions?.roles?.role_permissions?.map(
        rp => rp.permissions.name
      ) || [];
      setUserPermissions(perms);
    }

    fetchPermissions();
  }, []);

  // Filter requests based on permissions
  const filteredRequests = useMemo(() => {
    if (!paymentRequests) return [];
    
    // If user has view_all_requests, show everything
    if (userPermissions.includes('view_all_requests')) {
      return paymentRequests;
    }
    
    // If user has view_club_requests, show only their club's requests
    if (userPermissions.includes('view_club_requests')) {
      // You'll need to add logic here to filter by user's group
      // This would require passing the user's group_id to this component
      return paymentRequests;
    }

    // If user has no special permissions, show only their requests
    return [];
  }, [paymentRequests, userPermissions]);

  // Calculate monthly totals
  const monthlyData = useMemo(() => {
    if (!filteredRequests?.length) return [];
    
    const grouped = _.groupBy(filteredRequests, (request) => {
      const date = new Date(request.timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    return Object.entries(grouped).map(([month, requests]) => ({
      month,
      total: _.sumBy(requests, 'amount_requested_cad'),
      count: requests.length,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredRequests]);

  // Calculate status distribution
  const statusData = useMemo(() => {
    if (!filteredRequests?.length) return [];
    
    const grouped = _.groupBy(filteredRequests, 'status');
    return Object.entries(grouped).map(([status, requests]) => ({
      status: status || 'Unknown',
      count: requests.length,
      value: _.sumBy(requests, 'amount_requested_cad') || 0,
    }));
  }, [filteredRequests]);

  // Calculate group spending
  const groupData = useMemo(() => {
    if (!filteredRequests?.length) return [];
    
    const grouped = _.groupBy(filteredRequests, request => request.groups?.name || 'Unassigned');
    return Object.entries(grouped).map(([group, requests]) => ({
      group,
      total: _.sumBy(requests, 'amount_requested_cad') || 0,
    })).sort((a, b) => b.total - a.total);
  }, [filteredRequests]);

  const formatCurrency = (value) => {
    if (value == null) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
    if (!value) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${name}: ${formatCurrency(value)}`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
      {/* Monthly Spending Trends */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Monthly Spending Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#0088FE" 
                name="Total Amount"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Request Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                isAnimationActive={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatCurrency} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group Spending */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Spending by Group</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Bar 
                dataKey="total" 
                fill="#0088FE" 
                name="Total Amount"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;

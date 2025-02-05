"use client";
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import _ from 'lodash';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardAnalytics = ({ paymentRequests }) => {
  // Calculate monthly totals
  const monthlyData = useMemo(() => {
    if (!paymentRequests?.length) return [];
    
    const grouped = _.groupBy(paymentRequests, (request) => {
      const date = new Date(request.timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    return Object.entries(grouped).map(([month, requests]) => ({
      month,
      total: _.sumBy(requests, 'amount_requested_cad'),
      count: requests.length,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [paymentRequests]);

  // Calculate status distribution
  const statusData = useMemo(() => {
    if (!paymentRequests?.length) return [];
    
    const grouped = _.groupBy(paymentRequests, 'status');
    return Object.entries(grouped).map(([status, requests]) => ({
      status: status || 'Unknown',
      count: requests.length,
      value: _.sumBy(requests, 'amount_requested_cad') || 0,
    }));
  }, [paymentRequests]);

  // Calculate group spending
  const groupData = useMemo(() => {
    if (!paymentRequests?.length) return [];
    
    const grouped = _.groupBy(paymentRequests, request => request.groups?.name || 'Unassigned');
    return Object.entries(grouped).map(([group, requests]) => ({
      group,
      total: _.sumBy(requests, 'amount_requested_cad') || 0,
    })).sort((a, b) => b.total - a.total);
  }, [paymentRequests]);

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
                label={CustomPieLabel}
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

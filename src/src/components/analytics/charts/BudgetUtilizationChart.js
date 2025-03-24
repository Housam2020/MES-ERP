// components/analytics/charts/BudgetUtilizationChart.js
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function BudgetUtilizationChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Budget Line Utilization</CardTitle>
          <CardDescription>
            Comparison of actual spending against allocated budget
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Budget Line Utilization</CardTitle>
        <CardDescription>
          Comparison of actual spending against allocated budget
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="budgetLine" type="category" width={150} />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toFixed(2)}`,
                name === "utilizationRate" ? "Utilization %" : name,
              ]}
            />
            <Legend />
            <Bar
              dataKey="allocated"
              fill="#8884d8"
              name="Allocated Budget"
            />
            <Bar
              dataKey="actualSpent"
              fill="#82ca9d"
              name="Actual Spent"
            />
            <Line
              type="monotone"
              dataKey="utilizationRate"
              stroke="#ff7300"
              name="Utilization Rate %"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
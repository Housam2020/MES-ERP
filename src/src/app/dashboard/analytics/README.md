# Analytics Dashboard

This README documents the analytics dashboard page that visualizes payment request and budget data.

## Overview

The analytics dashboard shows visualizations of payment requests and budget data to help administrators and club managers track spending patterns and make informed decisions.

## File Structure

```
app/dashboard/analytics/
├── README.md       # This documentation
└── page.tsx        # Main analytics page component 

components/analytics/
├── charts/
│   ├── index.js                       # Exports all chart components
│   ├── MonthlyTrendsChart.js          # Monthly payment trends line chart
│   ├── StatusDistributionChart.js     # Request status distribution pie chart
│   ├── GroupDistributionChart.js      # Spending by group pie chart
│   ├── PaymentTimeframeChart.js       # Payment timeframe bar chart
│   ├── BudgetLineDistributionChart.js # Budget line distribution pie chart
│   ├── DayOfWeekChart.js              # Day of week bar chart
│   ├── TopRequestersTable.js          # Top requesters table
│   ├── BudgetUtilizationChart.js      # Budget utilization bar chart
│   ├── SeasonalSpendingChart.js       # Seasonal spending bar chart
│   └── CumulativeSpendingChart.js     # Cumulative spending line chart
├── tabs/
│   ├── OverviewTab.js                 # Overview dashboard tab
│   └── DetailedTab.js                 # Detailed analysis tab
├── utils/
│   └── chartUtils.js                  # Shared chart utilities and formatters
└── AnalyticsPage.js                   # Main component imported by page.tsx

hooks/
└── useAnalyticsData.js                # Custom hook for fetching and processing analytics data
```

## Component Structure

The dashboard uses a modular component architecture:

1. **Main Container**:
   - `AnalyticsPage.js`: Main container component with tabs and data fetching logic

2. **Custom Hook**:
   - `useAnalyticsData.js`: Fetches and processes analytics data, handles the multi-group setup

3. **Tab Components**:
   - `OverviewTab.js`: High-level metrics for quick insights
   - `DetailedTab.js`: More detailed visualizations and tables

4. **Chart Components**:
   - Individual visualization components for different metrics
   - Each handles its own empty state and formatting

## Key Features

- **Monthly Payment Trends**: Line chart showing total payment amounts by month
- **Request Status Distribution**: Pie chart showing amounts by request status
- **Spending by Group**: Pie chart showing distribution across groups
- **Payment Timeframe Analysis**: Bar chart showing average amounts by timeframe
- **Budget Line Distribution**: Pie chart showing spending by budget line
- **Request Volume by Day**: Bar chart showing request counts by day of week
- **Top Requesters**: Table showing users with most requests
- **Budget Utilization**: Comparison of actual spending vs. allocated budget
- **Seasonal Analysis**: Spending patterns across seasons
- **Cumulative Spending**: Running total of expenses over time

## Permission Requirements

The analytics dashboard requires one of these permissions to access:
- `view_all_requests`: Allows viewing analytics for all groups
- `view_club_requests`: Allows viewing analytics only for user's groups

Users without these permissions are redirected to the dashboard home.

## Implementation Details

### Data Fetching

The `useAnalyticsData` hook fetches data from:
- `payment_requests` table: For spending and request data
- `annual_budget_form_rows` table: For budget allocation data

For users with `view_club_requests` (not admins), the requests are filtered to only show data from the user's groups:

```javascript
// Filter by groups if club-level access
if (!permissions.includes("view_all_requests")) {
  // Get user's groups from user_roles junction table
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("group_id")
    .eq("user_id", user.id)
    .not("group_id", "is", null);

  if (userRoles?.length) {
    const groupIds = userRoles.map(role => role.group_id).filter(Boolean);
    requestsQuery = requestsQuery.in("group_id", groupIds);
  }
}
```

### Data Processing

The dashboard uses `lodash` to process the raw data into formats suitable for charts:

```javascript
// Example data processing for monthly trends
const monthlyData = _.chain(paymentRequests)
  .groupBy((req) => {
    const date = new Date(req.timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })
  .map((requests, month) => ({
    month,
    total: _.sumBy(requests, (req) => req.amount_requested_cad || 0),
    count: requests.length,
  }))
  .orderBy("month")
  .value();
```

### UI Structure

The dashboard is organized into tabs:
- **Overview**: High-level metrics for quick insights (MonthlyTrendsChart, StatusDistributionChart, GroupDistributionChart, PaymentTimeframeChart)
- **Detailed Analysis**: More detailed visualizations and tables (BudgetLineDistributionChart, DayOfWeekChart, TopRequestersTable, BudgetUtilizationChart, SeasonalSpendingChart, CumulativeSpendingChart)

Each tab contains various charts and tables created with Recharts library.

## Recent Updates

The analytics dashboard was recently updated to:
- Split the monolithic component into smaller, reusable components
- Create a custom data fetching hook 
- Support users belonging to multiple groups
- Handle the new database schema with junction tables
- Improve error handling and empty state displays
- Add enhanced label rendering for pie charts:
  - Wraps long labels with hyphens
  - Hides very small slices (under 5%)
  - Uses matching colors for labels and slices
  - Improves readability of overlapping labels

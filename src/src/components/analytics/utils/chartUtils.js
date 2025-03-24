// components/analytics/utils/chartUtils.js

// Chart colors for consistency across components
export const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#FF99E6",
    "#AA80FF",
  ];
  
  // Custom label function that preserves default styling (including connector line)
  // It hides the label for slices under 5% and wraps long labels with a hyphen and newline,
  // and now uses the slice's color via the fill prop.
  export const renderWrappedLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value, fill } = props;
    if (percent < 0.05) return null; // Hide very small slices
  
    const RADIAN = Math.PI / 180;
    // Calculate the label's position (same as default positioning)
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    // Build the label text using the default format
    const labelText = `${name || "Unknown"}: $${Number(value || 0).toFixed(2)}`;
    const threshold = 15; // maximum characters before wrapping
  
    // Use the slice's color for the text (falling back to black)
    const textStyle = { fontSize: "12px", fill: fill || "black", whiteSpace: "pre" };
    const anchor = x > cx ? "start" : "end";
  
    if (labelText.length <= threshold) {
      return (
        <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" style={textStyle}>
          {labelText}
        </text>
      );
    } else {
      // Split the label into two parts and insert a hyphen and newline.
      const firstPart = labelText.slice(0, threshold - 1);
      const secondPart = labelText.slice(threshold - 1);
      return (
        <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" style={textStyle}>
          <tspan x={x} dy="0">{firstPart}-</tspan>
          <tspan x={x} dy="1.2em">{secondPart}</tspan>
        </text>
      );
    }
  };
  
  // Currency formatter for tooltips
  export const currencyFormatter = (value) => `$${Number(value || 0).toFixed(2)}`;
  
  // Date formatter for x-axis
  export const dateFormatter = (date) => new Date(date).toLocaleDateString();

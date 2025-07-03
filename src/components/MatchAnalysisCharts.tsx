import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

// Player Velocity Over Time Chart
export const PlayerVelocityChart = ({ data, playerNames, colors }: {
  data: any[];
  playerNames: string[];
  colors?: string[];
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      {playerNames.map((name, idx) => (
        <Line
          key={name}
          type="monotone"
          dataKey={name}
          stroke={colors?.[idx] || "#8884d8"}
          strokeWidth={2}
          name={name}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

// Player Hits Bar Chart
export const PlayerHitsBarChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="hits" fill="#3B82F6" name="Total Hits" />
    </BarChart>
  </ResponsiveContainer>
);

// Ball Velocity & Acceleration Over Time Chart
export const BallVelocityAccelerationChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={data}>
      <XAxis dataKey="time" />
      <YAxis yAxisId="velocity" orientation="left" />
      <YAxis yAxisId="acceleration" orientation="right" />
      <Tooltip />
      <Line
        yAxisId="velocity"
        type="monotone"
        dataKey="velocity"
        stroke="#3B82F6"
        strokeWidth={3}
        name="Velocity (m/s)"
      />
      <Line
        yAxisId="acceleration"
        type="monotone"
        dataKey="acceleration"
        stroke="#EF4444"
        strokeWidth={2}
        strokeDasharray="5 5"
        name="Acceleration (m/s²)"
      />
    </LineChart>
  </ResponsiveContainer>
); 
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Card, { CardHeader } from "../ui/Card";
import { Skeleton } from "../ui/Feedback";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs font-sans">
      <p className="font-mono text-slate-500 text-[10px]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value} {entry.name === "Latency" ? "ms" : "MB"}
        </p>
      ))}
    </div>
  );
};

const PerformanceTrendsChart = ({ currentLatency = 0, storageUsed = 0, cacheUsed = 0 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAndRecord = async () => {
    if (!window.electronAPI?.store?.getPerformanceHistory) {
      setLoading(false);
      return;
    }

    try {
      if (currentLatency > 0 && window.electronAPI.store.recordPerformanceSample) {
        await window.electronAPI.store.recordPerformanceSample({
          latency: currentLatency,
          storageMB: storageUsed,
          cacheMB: cacheUsed,
        });
      }

      const samples = await window.electronAPI.store.getPerformanceHistory();
      const chartData = (samples || []).map((s) => {
        const d = new Date(s.timestamp || Date.now());
        return {
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          Latency: Math.max(1, Math.round(s.latency || 0)),
          Storage: Math.round((s.storageMB || 0) * 100) / 100,
          Cache: Math.round((s.cacheMB || 0) * 100) / 100,
        };
      });
      setHistory(chartData);
    } catch (err) {
      console.error("Failed to update performance trends:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndRecord();
  }, [currentLatency]);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Connection Health & Latency History"
        subtitle="Real-time latency trend recorded in embedded AxioDB"
      />
      <div className="flex-1 p-5 min-h-[16rem]">
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-xs text-slate-400">
            Recording connection health samples...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-ink-200)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--color-ink-400)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-ink-400)" }} unit="ms" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="Latency"
                stroke="var(--color-viz-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default PerformanceTrendsChart;

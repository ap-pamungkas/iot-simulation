import { Activity } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { Log, IrrigationLog } from "@/types/farming";

interface EnvironmentChartProps {
  logs: Log[];
  irrigationLogs?: IrrigationLog[];
  isPumpOn: boolean;
  pumpStartTime?: number;
  pumpDuration?: number;
}

export default function EnvironmentChart({
  logs,
  irrigationLogs = [],
  isPumpOn,
  pumpStartTime,
  pumpDuration,
}: EnvironmentChartProps) {
  // Data transformation logic
  const chartData =
    logs
      ?.slice(0, 10)
      .reverse()
      .map((log: Log) => {
        let soilValue = 0;
        if (log.soilMoisture >= 0 && log.soilMoisture <= 100) {
          soilValue = log.soilMoisture;
        } else if (log.soilMoisture > 100 && log.soilMoisture <= 4095) {
          soilValue = Math.max(
            0,
            Math.min(
              100,
              Math.round(((log.soilMoisture - 1500) / (4095 - 1500)) * 100),
            ),
          );
        }

        return {
          originalTime: new Date(log.createdAt).getTime(),
          time: new Date(log.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          soil: soilValue,
          humidity: log.humidity,
          temperature: log.temperature,
        };
      }) || [];

  const pumpEndTime =
    isPumpOn && pumpStartTime && pumpDuration
      ? pumpStartTime + pumpDuration * 1000
      : null;

  const validPumpStart = isPumpOn && pumpStartTime ? pumpStartTime : null;

  const validPumpEnd = isPumpOn && pumpEndTime ? pumpEndTime : null;

  const formatXAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate domain based on sensor logs only to prevent old irrigation logs from stretching the chart
  const minTime = chartData.length > 0 ? chartData[0].originalTime : "auto";
  const maxTime =
    chartData.length > 0
      ? chartData[chartData.length - 1].originalTime
      : "auto";

  return (
    <div className="card-iot">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="font-bold text-lg">
            Parameter Lingkungan (Real-time)
          </h3>
        </div>

        <div className="flex gap-3 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Suhu (°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Kelembapan Udara (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Kebasahan Tanah (%)</span>
          </div>
          {isPumpOn && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <div className="w-3 h-3 bg-blue-300 border border-blue-500/50" />
              <span className="text-blue-600">Area Penyiraman</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 border border-transparent"
              style={{ backgroundColor: "#C29595" }}
            />
            <span className="text-muted-foreground">Riwayat Penyiraman</span>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="originalTime"
              type="number"
              domain={[minTime, maxTime]}
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              domain={[0, 100]}
              label={{
                value: "%",
                angle: -90,
                position: "insideLeft",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              domain={["auto", "auto"]}
              label={{
                value: "°C",
                angle: 90,
                position: "insideRight",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />

            <Tooltip
              labelFormatter={(label) => formatXAxis(label as number)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderRadius: "var(--radius-md)",
                border: "1px solid hsl(var(--border))",
              }}
              formatter={(
                value: number | string | undefined,
                name: string | number | undefined,
              ) => {
                const units: Record<string, string> = {
                  soil: "%",
                  humidity: "%",
                  temperature: "°C",
                };
                const labels: Record<string, string> = {
                  soil: "Kebasahan Tanah",
                  humidity: "Kelembapan Udara",
                  temperature: "Suhu",
                };
                const displayValue = value != null ? value : "-";
                const nameKey = String(name);
                const unit = units[nameKey] || "";
                const label = labels[nameKey] || nameKey;
                return [`${displayValue}${unit}`, label];
              }}
            />

            {/* Render Past Irrigation Logs */}
            {irrigationLogs.map((log) => {
              const start = new Date(log.createdAt).getTime();
              const end = start + log.duration * 1000;
              // Only render if within relevant range (simple check, recharts handles clipping but this is safer)
              if (
                typeof minTime === "number" &&
                typeof maxTime === "number" &&
                end < minTime - 60000 // Only skip if waaaay in the past
              ) {
                return null;
              }
              return (
                <ReferenceArea
                  key={log.id}
                  yAxisId="left"
                  x1={start}
                  x2={end}
                  fill="#C29595"
                  fillOpacity={0.2}
                  strokeOpacity={0}
                  ifOverflow="hidden" // Clip invalid areas
                />
              );
            })}

            {validPumpStart && validPumpEnd && (
              <>
                <ReferenceArea
                  yAxisId="left"
                  x1={validPumpStart}
                  x2={validPumpEnd}
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeOpacity={0}
                  ifOverflow="extendDomain"
                />
                <ReferenceLine
                  x={validPumpStart}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  label={{
                    value: "Start",
                    position: "insideTopLeft",
                    fill: "#2563eb",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  x={validPumpEnd}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  label={{
                    value: "End",
                    position: "insideTopRight",
                    fill: "#2563eb",
                    fontSize: 10,
                  }}
                />
              </>
            )}

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="soil"
              name="soil"
              stroke="#22c55e"
              fill="url(#colorSoil)"
              strokeWidth={2}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              name="humidity"
              stroke="#3b82f6"
              fill="url(#colorHumidity)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              name="temperature"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#ef4444" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Thermometer,
  Droplets,
  Sprout,
  RefreshCcw,
  Activity,
  Timer,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";
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
} from "recharts";

import StatCard from "@/components/ui/StatCard";

interface Log {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  createdAt: string;
}

interface IrrigationLog {
  id: string;
  duration: number;
  createdAt: string;
}

interface DeviceData {
  deviceCode: string;
  pumpStatus: boolean;
  duration: number;
  lastSeen: string;
  logs: Log[];
  irrigationLogs: IrrigationLog[];
}

export default function SmartFarmingPage() {
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<string>("5");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // Move offline logic here for reuse
  const lastSeenTime = data?.lastSeen ? new Date(data.lastSeen).getTime() : 0;
  const isOffline = !data || Date.now() - lastSeenTime > 60000;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/farming");
      const result = await res.json();

      if (result.success && result.data?.[0]) {
        const deviceData = result.data[0];
        setData(deviceData);

        if (deviceData.pumpStatus && deviceData.duration > 0) {
          const lastSeen = new Date(deviceData.lastSeen).getTime();
          const elapsed = Math.floor((Date.now() - lastSeen) / 1000);
          const remaining = Math.max(0, deviceData.duration - elapsed);
          setCountdown(remaining);

          if (remaining === 0 && deviceData.pumpStatus) {
            setTimeout(fetchData, 2000);
          }
        } else {
          setCountdown(0);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setError("Gagal terhubung ke device");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalTime = countdown > 0 ? 1000 : 30000;
    const interval = setInterval(fetchData, intervalTime);
    return () => clearInterval(interval);
  }, [countdown, fetchData]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const validateDuration = (value: string): boolean => {
    if (!value || value.trim() === "") return false;
    const num = parseInt(value);
    if (isNaN(num)) return false;
    if (num < 1) return false;
    if (num > 300) return false;
    return true;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== "" && !/^\d+$/.test(value)) return;
    setDuration(value);
    setError("");
  };

  const handleSprinkle = async () => {
    if (!validateDuration(duration)) {
      setError("Durasi wajib diisi dengan angka (1-300 detik)");
      return;
    }
    if (isOffline) {
      setError(
        "Perangkat sedang offline. Cek koneksi internet/daya perangkat.",
      );
      return;
    }

    const durationNum = parseInt(duration);
    setIsActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/farming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceCode: data?.deviceCode,
          pumpStatus: true,
          duration: durationNum,
        }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Gagal mengupdate status pompa");

      setCountdown(durationNum);
      await fetchData();
    } catch (error: any) {
      console.error("Gagal kontrol pompa:", error);
      setError(error.message || "Gagal mengontrol pompa");
      setCountdown(0);
    } finally {
      setIsActionLoading(false);
    }
  };

  const latestLog = data?.logs?.[0] || {
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
  };
  const isPumpOn = data?.pumpStatus || false;
  const isPumpRunning = isPumpOn || countdown > 0;

  // Konversi soil moisture
  const rawSoilValue = latestLog.soilMoisture;
  let soilPercentage: number;
  if (rawSoilValue >= 0 && rawSoilValue <= 100) {
    soilPercentage = rawSoilValue;
  } else if (rawSoilValue > 100 && rawSoilValue <= 4095) {
    soilPercentage = Math.max(
      0,
      Math.min(100, Math.round(((rawSoilValue - 1500) / (4095 - 1500)) * 100)),
    );
  } else {
    soilPercentage = 0;
  }

  // Data untuk chart dengan ketiga parameter
  // Include original timestamp to help identify range
  const chartData =
    data?.logs
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
          soil: soilValue, // Hijau (0-100%)
          humidity: log.humidity, // Biru (0-100%)
          temperature: log.temperature, // Merah (suhu dalam °C)
        };
      }) || [];

  // Hitung range Area Penyiraman (ReferenceArea)
  // Jika pompa menyala, kita cari log mana yang masuk dalam rentang waktu penyiraman
  let irrigationStartIndex = -1;
  let irrigationEndIndex = -1;

  if (isPumpOn && data?.lastSeen && data?.duration) {
    const pumpStartTime = new Date(data.lastSeen).getTime();
    const pumpEndTime = pumpStartTime + data.duration * 1000;

    chartData.forEach((d, index) => {
      // Kita tandai log yang berada dalam rentang [startTime, endTime]
      // Tambahkan toleransi sedikit jika perlu
      if (
        d.originalTime >= pumpStartTime - 2000 &&
        d.originalTime <= pumpEndTime + 2000
      ) {
        if (irrigationStartIndex === -1) irrigationStartIndex = index;
        irrigationEndIndex = index;
      }
    });

    // Fallback: Jika pompa baru saja nyala dan belum masuk log (log tertinggal),
    // tapi secara waktu harusnya masuk di "paling kanan" chart.
    if (irrigationStartIndex === -1 && chartData.length > 0) {
      // Cek jika pumpStartTime memang lebih baru dari data terakhir
      const lastDataTime = chartData[chartData.length - 1].originalTime;
      if (pumpStartTime >= lastDataTime - 5000) {
        // Kita assume mulai dari index terakhir
        irrigationStartIndex = chartData.length - 1;
        irrigationEndIndex = chartData.length - 1;
      }
    }
  }

  const irrigationAreaStart =
    irrigationStartIndex !== -1 ? chartData[irrigationStartIndex].time : null;
  const irrigationAreaEnd =
    irrigationEndIndex !== -1 ? chartData[irrigationEndIndex].time : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Control Panel Pertanian
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoring suhu, kelembapan, dan kontrol irigasi manual.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw
              size={20}
              className={
                loading ? "animate-spin text-primary" : "text-muted-foreground"
              }
            />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Suhu Udara"
                value={`${latestLog.temperature}°C`}
                icon={<Thermometer className="text-red-500" />}
                type="farming"
              />
              <StatCard
                title="Kelembapan Udara"
                value={`${latestLog.humidity}%`}
                icon={<Droplets className="text-blue-500" />}
                type="home"
              />
              <StatCard
                title="Kebasahan Tanah"
                value={`${soilPercentage}%`}
                icon={<Sprout className="text-green-500" />}
                status={soilPercentage < 30 ? "warning" : "normal"}
                type="farming"
              />
            </div>

            {/* GRAFIK KOMBINASI - 3 Data Sekaligus */}
            <div className="card-iot">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  <h3 className="font-bold text-lg">
                    Parameter Lingkungan (Real-time)
                  </h3>
                </div>

                {/* Legend */}
                <div className="flex gap-3 text-xs font-bold flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Suhu (°C)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">
                      Kelembapan Udara (%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">
                      Kebasahan Tanah (%)
                    </span>
                  </div>
                  {isPumpOn && (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <div className="w-3 h-3 bg-blue-300 border border-blue-500/50" />
                      <span className="text-blue-600">Area Penyiraman</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {/* Gradient untuk Kelembapan Tanah - Hijau */}
                      <linearGradient
                        id="colorSoil"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      {/* Gradient untuk Kelembapan Udara - Biru */}
                      <linearGradient
                        id="colorHumidity"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      {/* Gradient untuk Suhu - Merah */}
                      <linearGradient
                        id="colorTemp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
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
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      domain={["auto", "auto"]}
                      label={{
                        value: "°C",
                        angle: 90,
                        position: "insideRight",
                        style: { fill: "hsl(var(--muted-foreground))" },
                      }}
                    />

                    <Tooltip
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

                        // Handle cases where value might be undefined or null
                        const displayValue = value != null ? value : "-";
                        const nameKey = String(name);
                        const unit = units[nameKey] || "";
                        const label = labels[nameKey] || nameKey;

                        return [`${displayValue}${unit}`, label];
                      }}
                    />

                    {/* Area Penyiraman (ReferenceArea) - Ditambahkan di sini */}
                    {isPumpOn && irrigationAreaStart && irrigationAreaEnd && (
                      <ReferenceArea
                        yAxisId="left"
                        x1={irrigationAreaStart}
                        x2={irrigationAreaEnd}
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                        label={{
                          value: "Disiram",
                          position: "insideTop",
                          fill: "#2563eb",
                          fontSize: 10,
                        }}
                      />
                    )}

                    {/* Area Chart untuk Kelembapan Tanah - Hijau */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="soil"
                      name="soil"
                      stroke="#22c55e"
                      fill="url(#colorSoil)"
                      strokeWidth={2}
                    />

                    {/* Area Chart untuk Kelembapan Udara - Biru */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="humidity"
                      name="humidity"
                      stroke="#3b82f6"
                      fill="url(#colorHumidity)"
                      strokeWidth={2}
                    />

                    {/* Line Chart untuk Suhu - Merah (menggunakan Line agar lebih terlihat bedanya) */}
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
          </div>

          {/* SISI KANAN: Kontrol & Konfigurasi */}
          <div className="space-y-6">
            <div
              className={`card-iot border-2 transition-colors duration-300 ${
                isOffline
                  ? "border-red-200 bg-red-50 opacity-90"
                  : isPumpRunning
                    ? "border-primary/50 bg-primary/5"
                    : "border-primary/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`icon-container transition-all duration-300 ${
                    isOffline
                      ? "bg-red-100 text-red-500"
                      : isPumpRunning
                        ? "icon-container-farming scale-110"
                        : "icon-container-farming"
                  }`}
                >
                  {isPumpRunning && !isOffline ? (
                    <div className="animate-pulse">
                      <ArrowRight size={22} className="text-primary" />
                    </div>
                  ) : (
                    <ArrowRight size={22} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Kontrol Irigasi</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                    {isOffline
                      ? "OFFLINE"
                      : isPumpRunning
                        ? "SEDANG MENYIRAM"
                        : "AKSI MANUAL"}
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${isOffline ? "bg-red-500" : isPumpRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              {isPumpRunning && countdown > 0 && !isOffline && (
                <div className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-primary uppercase">
                      Sisa Waktu
                    </span>
                    <span className="text-2xl font-black text-primary tabular-nums">
                      {Math.floor(countdown / 60)
                        .toString()
                        .padStart(2, "0")}
                      :{(countdown % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="w-full bg-primary/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${(countdown / (parseInt(duration) || 5)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {isPumpOn && countdown === 0 && !isOffline && (
                <div className="mb-6 p-4 bg-yellow-100 rounded-2xl border border-yellow-300">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-bold">
                      Menyelesaikan siklus...
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div
                  className={`p-3 rounded-2xl border border-dashed transition-colors ${
                    isOffline
                      ? "bg-red-50 border-red-200"
                      : isPumpRunning
                        ? "bg-muted/50 border-muted"
                        : "bg-muted/30 border-border"
                  }`}
                >
                  <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-tighter">
                    Set Waktu Siram (Detik)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Timer
                        size={18}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          isOffline
                            ? "text-red-300"
                            : isPumpRunning
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={duration}
                        onChange={handleDurationChange}
                        disabled={isPumpRunning || isActionLoading || isOffline}
                        placeholder="5"
                        className={`w-full bg-background border rounded-xl py-3 pl-10 pr-4 text-lg font-black transition-all ${
                          error && !validateDuration(duration)
                            ? "border-red-500 focus:ring-2 focus:ring-red-500"
                            : isOffline
                              ? "border-red-100 bg-red-50 text-gray-400"
                              : "border-border focus:ring-2 focus:ring-primary"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Min: 1 detik | Max: 300 detik (5 menit)
                  </p>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-accent/50 p-3 rounded-lg">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>
                    {isOffline
                      ? "Perangkat sedang offline. Kontrol dimatikan."
                      : isPumpRunning
                        ? "Pompa sedang aktif. Tunggu hingga selesai."
                        : "Pompa akan mati otomatis oleh ESP32 setelah durasi tercapai."}
                  </p>
                </div>
              </div>

              <button
                disabled={
                  isPumpRunning ||
                  isActionLoading ||
                  !validateDuration(duration) ||
                  isOffline
                }
                onClick={handleSprinkle}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                  isOffline
                    ? "bg-red-100 text-red-300 cursor-not-allowed border border-red-200"
                    : isPumpRunning
                      ? "bg-gray-400 cursor-not-allowed text-gray-200"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95"
                } disabled:opacity-100`}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : isOffline ? (
                  <>OFFLINE</>
                ) : isPumpRunning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    POMPA BERJALAN
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    AKTIFKAN POMPA
                  </>
                )}
              </button>
            </div>

            <div
              className={`card-iot ${
                !data
                  ? "bg-red-500 text-white"
                  : isOffline
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold mb-1">
                    Device: {data?.deviceCode || "UNKNOWN"}
                  </h4>
                  <p className="text-xs opacity-80">
                    {!data
                      ? "Perangkat tidak terdeteksi"
                      : isOffline
                        ? `Tidak aktif sejak ${new Date(data.lastSeen).toLocaleTimeString()}`
                        : `Online • Terakhir: ${new Date(data.lastSeen).toLocaleTimeString()}`}
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full border-2 border-white/20 ${
                    loading
                      ? "bg-yellow-400 animate-pulse"
                      : !data || isOffline
                        ? "bg-red-900 animate-pulse"
                        : "bg-green-400 shadow-[0_0_10px_#4ade80]"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

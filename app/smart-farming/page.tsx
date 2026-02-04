"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { 
  Thermometer, Droplets, Sprout, RefreshCcw, 
  Activity, Timer, ArrowRight, Info, Loader2
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from "recharts";

interface Log {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  createdAt: string;
}

interface DeviceData {
  deviceCode: string;
  pumpStatus: boolean;
  duration: number;
  lastSeen: string;
  logs: Log[];
}

export default function SmartFarmingPage() {
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<any>("5");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // Fetch data dengan error handling
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/farming");
      const result = await res.json();
      
      if (result.success && result.data?.[0]) {
        const deviceData = result.data[0];
        setData(deviceData);
        
        // Jika pompa aktif di backend, sync countdown
        if (deviceData.pumpStatus && deviceData.duration > 0) {
          // Estimate sisa waktu berdasarkan lastSeen dan duration
          const lastSeen = new Date(deviceData.lastSeen).getTime();
          const elapsed = Math.floor((Date.now() - lastSeen) / 1000);
          const remaining = Math.max(0, deviceData.duration - elapsed);
          setCountdown(remaining);
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

  // Polling interval - lebih cepat saat countdown aktif
  useEffect(() => {
    fetchData();
    
    // Interval dinamis: 1 detik saat countdown, 30 detik saat idle
    const intervalTime = countdown > 0 ? 1000 : 30000;
    const interval = setInterval(fetchData, intervalTime);
    
    return () => clearInterval(interval);
  }, [countdown, fetchData]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Auto refresh saat countdown habis
            fetchData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [countdown, fetchData]);

  // Validasi input durasi
  const validateDuration = (value: string): boolean => {
    if (!value || value.trim() === "") return false;
    const num = parseInt(value);
    if (isNaN(num)) return false;
    if (num < 1) return false;
    if (num > 300) return false; // Max 5 menit
    return true;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Hanya izinkan angka
    if (value !== "" && !/^\d+$/.test(value)) {
      return;
    }
    
    setDuration(value);
    setError("");
  };

  const handleSprinkle = async () => {
    // Validasi wajib isi dan angka
    if (!validateDuration(duration)) {
      setError("Durasi wajib diisi dengan angka (1-300 detik)");
      return;
    }

    if (!data?.deviceCode) {
      setError("Device tidak tersedia");
      return;
    }

    const durationNum = parseInt(duration);
    const newState = !data?.pumpStatus; // Toggle state

    setIsActionLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/farming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deviceCode: data.deviceCode,
          pumpStatus: newState,
          duration: newState ? durationNum : 0 // Kirim 0 jika mematikan
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengupdate status pompa");
      }
      
      // Update local state optimistically
      if (newState) {
        setCountdown(durationNum);
      } else {
        setCountdown(0);
      }
      
      // Refresh data untuk konfirmasi
      await fetchData();
      
    } catch (error: any) {
      console.error("Gagal kontrol pompa:", error);
      setError(error.message || "Gagal mengontrol pompa");
      // Revert countdown jika gagal
      fetchData();
    } finally {
      setIsActionLoading(false);
    }
  };

  const latestLog = data?.logs?.[0] || { temperature: 0, humidity: 0, soilMoisture: 0 };
  
  // Status pompa dari backend (source of truth)
  const isPumpOn = data?.pumpStatus || false;
  
  // Konversi soil moisture (1500 = kering/0%, 4095 = basah/100%)
  const soilPercentage = Math.max(0, Math.min(100, 
    Math.round(((latestLog.soilMoisture - 1500) / (4095 - 1500)) * 100)
  ));

  const chartData = data?.logs?.slice(0, 10).reverse().map((log: Log) => ({
    time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    soil: Math.max(0, Math.min(100, 
      Math.round(((log.soilMoisture - 1500) / (4095 - 1500)) * 100)
    ))
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 animate-fade-in">
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Control Panel Pertanian</h1>
            <p className="text-muted-foreground mt-1">Monitoring suhu, kelembapan, dan kontrol irigasi manual.</p>
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin text-primary" : "text-muted-foreground"} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SISI KIRI: Monitoring Sensors */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Suhu Udara" value={`${latestLog.temperature}°C`} icon={<Thermometer />} type="farming" />
              <StatCard title="Kelembapan Udara" value={`${latestLog.humidity}%`} icon={<Droplets />} type="home" />
              <StatCard title="Kelembapan Tanah" value={`${soilPercentage}%`} icon={<Sprout />} status={soilPercentage < 30 ? "warning" : "normal"} type="farming" />
            </div>

            {/* Grafik Kelembapan Tanah */}
            <div className="card-iot">
              <div className="flex items-center gap-2 mb-8">
                <Activity size={18} className="text-primary" />
                <h3 className="font-bold text-lg">Tren Kelembapan Tanah (Real-time)</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="soil" name="Kelembapan" stroke="hsl(var(--primary))" fill="url(#colorSoil)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SISI KANAN: Kontrol & Konfigurasi */}
          <div className="space-y-6">
            <div className={`card-iot border-2 transition-colors duration-300 ${isPumpOn ? 'border-primary/50 bg-primary/5' : 'border-primary/20'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`icon-container transition-all duration-300 ${isPumpOn ? 'icon-container-farming scale-110' : 'icon-container-farming'}`}>
                  {isPumpOn ? (
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
                    {isPumpOn ? "SEDANG MENYIRAM" : "AKSI MANUAL"}
                  </p>
                </div>
                {/* Indicator status */}
                <div className={`w-3 h-3 rounded-full ${isPumpOn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Countdown Animation */}
              {isPumpOn && countdown > 0 && (
                <div className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-primary uppercase">Sisa Waktu</span>
                    <span className="text-2xl font-black text-primary tabular-nums">
                      {Math.floor(countdown / 60).toString().padStart(2, '0')}:
                      {(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-primary/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{ 
                        width: `${(countdown / (data?.duration || duration)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Form Input Durasi */}
              <div className="space-y-4 mb-6">
                <div className={`p-4 rounded-2xl border border-dashed transition-colors ${isPumpOn ? 'bg-muted/50 border-muted' : 'bg-muted/30 border-border'}`}>
                  <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-tighter">
                    Set Waktu Siram (Detik) {isPumpOn && <span className="text-primary">*</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Timer size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isPumpOn ? 'text-primary' : 'text-muted-foreground'}`} />
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={duration}
                        onChange={handleDurationChange}
                        disabled={isPumpOn || isActionLoading}
                        placeholder="5"
                        className={`w-full bg-background border rounded-xl py-3 pl-10 pr-4 text-lg font-black transition-all ${
                          error && !validateDuration(duration) 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                            : 'border-border focus:ring-2 focus:ring-primary'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  {/* Validation hint */}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Min: 1 detik | Max: 300 detik (5 menit)
                  </p>
                </div>
                
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-accent/50 p-3 rounded-lg">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>
                    {isPumpOn 
                      ? "Pompa aktif. Matikan secara manual atau tunggu otomatis." 
                      : "Pompa akan mati otomatis oleh ESP32 setelah durasi tercapai."}
                  </p>
                </div>
              </div>

              {/* Tombol Aksi */}
              <button 
                disabled={isActionLoading || (!isPumpOn && !validateDuration(duration))}
                onClick={handleSprinkle}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                  isPumpOn 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : isPumpOn ? (
                  <>
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    MATIKAN POMPA
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    AKTIFKAN POMPA
                  </>
                )}
              </button>
            </div>

            {/* Info Device Card */}
            <div className="card-iot bg-primary text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold mb-1">Device: {data?.deviceCode || "FARM-001"}</h4>
                  <p className="text-xs opacity-80">
                    Terakhir terlihat: {data?.lastSeen ? new Date(data.lastSeen).toLocaleString() : '-'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, status = "normal", type }: any) {
  return (
    <div className="card-iot">
      <div className="flex justify-between items-start mb-6">
        <div className={`icon-container ${type === 'farming' ? 'icon-container-farming' : 'icon-container-home'}`}>
          {icon}
        </div>
        <span className={`status-badge ${status === 'normal' ? 'status-normal' : 'status-warning'}`}>
          <div className="pulse-dot" />
          {status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
      <h3 className="text-4xl font-black mt-1 tracking-tight">{value}</h3>
    </div>
  );
}
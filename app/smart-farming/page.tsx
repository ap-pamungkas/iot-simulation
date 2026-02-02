"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  Thermometer, Droplets, Sprout, RefreshCcw, 
  Activity, Timer, Power, Info
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from "recharts";

export default function SmartFarmingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(5); // Default penyiraman 5 detik
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/farming");
      const result = await res.json();
      if (result.success) {
        // Mengambil data device FARM-001 dari database
        setData(result.data[0]); 
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSprinkle = async (newState: boolean) => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/farming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newState,
          duration: duration // Mengirim durasi kustom ke database
        }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Gagal kontrol pompa:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestLog = data?.logs?.[0] || { temperature: 0, humidity: 0, soilMoisture: 0 };
  const isPumpOn = data?.pumpStatus || false; // Sinkronisasi dengan kolom pumpStatus
  
  // Konversi nilai P34 (0-4095) ke Persentase
  const soilPercentage = Math.max(0, Math.min(100, Math.round(((4095 - latestLog.soilMoisture) / (4095 - 1500)) * 100)));

  const chartData = data?.logs?.slice(0, 10).reverse().map((log: any) => ({
    time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    soil: Math.max(0, Math.min(100, Math.round(((4095 - log.soilMoisture) / (4095 - 1500)) * 100)))
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
          <button onClick={fetchData} className="p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all active:scale-95">
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
            <div className="card-iot border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="icon-container icon-container-farming">
                  <Power size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Kontrol Irigasi</h3>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Aksi Manual</p>
                </div>
              </div>

              {/* Form Input Durasi */}
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <label className="text-[10px] font-black text-muted-foreground uppercase mb-2 block tracking-tighter">Set Waktu Siram (Detik)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Timer size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                      <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full bg-background border-border border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary text-lg font-black"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-accent/50 p-3 rounded-lg">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>Pompa akan mati otomatis oleh ESP32 setelah durasi di atas tercapai.</p>
                </div>
              </div>

              {/* Tombol Toggle Switch Manual */}
              <div className="flex items-center justify-between p-5 bg-muted/50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Status Relay</p>
                  <span className={`text-sm font-black ${isPumpOn ? 'text-primary' : ''}`}>
                    {isPumpOn ? "POMPA AKTIF" : "POMPA MATI"}
                  </span>
                </div>
                <button 
                  disabled={isActionLoading}
                  onClick={() => handleSprinkle(!isPumpOn)}
                  className={`toggle-switch ${isPumpOn ? 'toggle-switch-on' : 'toggle-switch-off'} ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`toggle-knob ${isPumpOn ? 'toggle-knob-on' : 'toggle-knob-off'}`} />
                </button>
              </div>
            </div>

            {/* Info Device Card */}
            <div className="card-iot bg-primary text-primary-foreground">
              <h4 className="font-bold mb-1">Device: {data?.deviceCode || "FARM-001"}</h4>
              <p className="text-xs opacity-80">Terakhir terlihat: {data?.lastSeen ? new Date(data.lastSeen).toLocaleString() : '-'}</p>
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
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { RefreshCcw } from "lucide-react";
import { useFarmingData } from "@/hooks/useFarmingData";
import EnvironmentStats from "@/components/farming/EnvironmentStats";
import EnvironmentChart from "@/components/farming/EnvironmentChart";
import IrrigationControl from "@/components/farming/IrrigationControl";
import DeviceStatusCard from "@/components/farming/DeviceStatusCard";
import { Log } from "@/types/farming";

export default function SmartFarmingPage() {
  const {
    data,
    loading,
    error,
    isOffline,
    countdown,
    isActionLoading,
    fetchData,
    handleSprinkle,
  } = useFarmingData();

  const [duration, setDuration] = useState<string>("5");

  const latestLog = data?.logs?.[0] || {
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    createdAt: new Date().toISOString(),
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
            <EnvironmentStats
              temperature={latestLog.temperature}
              humidity={latestLog.humidity}
              soilMoisture={soilPercentage}
            />

            <EnvironmentChart
              logs={data?.logs || []}
              irrigationLogs={data?.irrigationLogs || []}
              isPumpOn={isPumpOn}
              pumpStartTime={
                data?.lastSeen ? new Date(data.lastSeen).getTime() : undefined
              }
              pumpDuration={data?.duration}
            />
          </div>

          <div className="space-y-6">
            <IrrigationControl
              isPumpRunning={isPumpRunning}
              isActionLoading={isActionLoading}
              isOffline={isOffline}
              countdown={countdown}
              duration={duration}
              onDurationChange={setDuration}
              onSprinkle={() => handleSprinkle(parseInt(duration))}
              error={error}
            />

            <DeviceStatusCard
              data={data}
              loading={loading}
              isOffline={isOffline}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

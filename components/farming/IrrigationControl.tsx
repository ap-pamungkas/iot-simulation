import { useState } from "react";
import { ArrowRight, Timer, Info, Loader2 } from "lucide-react";

interface IrrigationControlProps {
  isPumpRunning: boolean;
  isActionLoading: boolean;
  isOffline: boolean;
  countdown: number;
  duration: string;
  onDurationChange: (value: string) => void;
  onSprinkle: () => void;
  error?: string;
}

export default function IrrigationControl({
  isPumpRunning,
  isActionLoading,
  isOffline,
  countdown,
  duration,
  onDurationChange,
  onSprinkle,
  error,
}: IrrigationControlProps) {
  const validateDuration = (value: string): boolean => {
    if (!value || value.trim() === "") return false;
    const num = parseInt(value);
    if (isNaN(num)) return false;
    if (num < 1) return false;
    if (num > 300) return false;
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== "" && !/^\d+$/.test(value)) return;
    onDurationChange(value);
  };

  return (
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
          className={`w-3 h-3 rounded-full ${
            isOffline
              ? "bg-red-500"
              : isPumpRunning
                ? "bg-green-500 animate-pulse"
                : "bg-gray-400"
          }`}
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

      {isPumpRunning && countdown === 0 && !isOffline && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-2xl border border-yellow-300">
          <div className="flex items-center gap-2 text-yellow-800">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-bold">Menyelesaikan siklus...</span>
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
                onChange={handleInputChange}
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
        onClick={onSprinkle}
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
  );
}

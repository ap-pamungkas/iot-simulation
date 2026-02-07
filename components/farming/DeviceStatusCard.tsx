import { DeviceData } from "@/types/farming";

interface DeviceStatusCardProps {
  data: DeviceData | null;
  loading: boolean;
  isOffline: boolean;
}

export default function DeviceStatusCard({
  data,
  loading,
  isOffline,
}: DeviceStatusCardProps) {
  return (
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
  );
}

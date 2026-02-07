import { useState, useCallback, useEffect } from "react";
import { DeviceData } from "@/types/farming";

export function useFarmingData() {
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Derived state
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

  // Polling logic
  useEffect(() => {
    fetchData();
    const intervalTime = countdown > 0 ? 1000 : 30000;
    const interval = setInterval(fetchData, intervalTime);
    return () => clearInterval(interval);
  }, [countdown, fetchData]);

  // Countdown timer logic
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

  const handleSprinkle = async (durationVal: number) => {
    if (isOffline) {
      setError("Perangkat sedang offline. Cek koneksi internet/daya perangkat.");
      return;
    }

    setIsActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/farming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceCode: data?.deviceCode,
          pumpStatus: true,
          duration: durationVal,
        }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Gagal mengupdate status pompa");

      setCountdown(durationVal);
      await fetchData();
    } catch (error: any) {
      console.error("Gagal kontrol pompa:", error);
      setError(error.message || "Gagal mengontrol pompa");
      setCountdown(0);
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    isOffline,
    countdown,
    isActionLoading,
    fetchData,
    handleSprinkle,
    setError, // Expose setter if needed for validation errors from UI
  };
}

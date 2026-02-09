"use client";

import { useState } from "react";
import { Zap, Power, Wifi, WifiOff } from "lucide-react";

export default function RelayPage() {
  const [loading, setLoading] = useState(false);
  const [relayState, setRelayState] = useState<"on" | "off" | null>(null);

  async function handleRelay(command: "on" | "off") {
    setLoading(true);
    try {
      const response = await fetch("/api/relay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      if (data.success) {
        setRelayState(command);
      }
      console.log(data);
    } catch (error) {
      console.error("Error controlling relay:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Relay
              </h1>
              <p className="text-gray-400 text-sm">IoT Control Center</p>
            </div>
            <div
              className={`p-3 rounded-2xl ${relayState === "on" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-400"}`}
            >
              <Zap
                className={`w-6 h-6 ${relayState === "on" ? "fill-current" : ""}`}
              />
            </div>
          </div>

          {/* Status Card */}
          <div className="mb-8 p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${true ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium text-gray-300">
                System Status
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wifi className="w-3 h-3" />
              CONNECTED
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRelay("on")}
              disabled={loading}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
                relayState === "on"
                  ? "bg-emerald-500 border-emerald-400 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]"
                  : "bg-gray-700/30 border-white/10 hover:bg-gray-700/50 hover:border-white/20"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Power
                  className={`w-8 h-8 transition-transform duration-300 group-hover:scale-110 ${
                    relayState === "on" ? "text-white" : "text-emerald-400"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    relayState === "on" ? "text-white" : "text-gray-300"
                  }`}
                >
                  Turn ON
                </span>
              </div>
            </button>

            <button
              onClick={() => handleRelay("off")}
              disabled={loading}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
                relayState === "off"
                  ? "bg-red-500 border-red-400 shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)]"
                  : "bg-gray-700/30 border-white/10 hover:bg-gray-700/50 hover:border-white/20"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Power
                  className={`w-8 h-8 transition-transform duration-300 group-hover:scale-110 ${
                    relayState === "off" ? "text-white" : "text-red-400"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    relayState === "off" ? "text-white" : "text-gray-300"
                  }`}
                >
                  Turn OFF
                </span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Latency: <span className="text-gray-400">24ms</span> • Protocol:{" "}
              <span className="text-gray-400">WebSocket</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

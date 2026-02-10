"use client";

import { useState } from "react";
import { Power, Lightbulb } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RelayPage() {
  const [loading, setLoading] = useState(false);
  const [relayState, setRelayState] = useState<"on" | "off">("off");

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
    } catch (error) {
      console.error("Error controlling relay:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar / Header Simple */}
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
            Simulasi Kontrol Lampu Jarak Jauh
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Ini adalah contoh sederhana dari{" "}
            <strong>IoT (Internet of Things)</strong>. Bayangkan tombol di bawah
            ini adalah saklar lampu di rumahmu, tapi kamu bisa menekannya dari
            mana saja lewat internet!
          </p>
        </div>

        {/* How it works section for students */}
        <div className="bg-blue-50 p-6 rounded-2xl mb-12 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2 text-lg">
            Bagaimana Cara Kerjanya?
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-900/80">
            <li>
              Kamu menekan tombol <strong>ON/OFF</strong> di website ini.
            </li>
            <li>
              Perintah dikirim lewat <strong>Internet</strong> Server.
            </li>
            <li>
              Server mengirim pesan ke alat kecil bernama <strong>ESP32</strong>{" "}
              (Mikrokontroler).
            </li>
            <li>ESP32 menyalakan atau mematikan lampu (Relay).</li>
          </ol>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button
            onClick={() => handleRelay("on")}
            disabled={loading}
            className={`w-full md:w-48 h-48 cursor-pointer rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-xl border-b-8 active:border-b-0 active:translate-y-2 ${
              relayState === "on"
                ? "bg-yellow-400 border-yellow-600 text-yellow-900"
                : "bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Lightbulb
              className={`w-16 h-16 ${relayState === "on" ? "fill-current animate-pulse" : ""}`}
            />
            <span className="text-2xl font-bold">NYALA</span>
          </button>

          <button
            onClick={() => handleRelay("off")}
            disabled={loading}
            className={`w-full md:w-48 h-48 cursor-pointer rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-xl border-b-8 active:border-b-0 active:translate-y-2 ${
              relayState === "off"
                ? "bg-red-500 border-red-700 text-white"
                : "bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Power className="w-16 h-16" />
            <span className="text-2xl font-bold">MATI</span>
          </button>
        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Cobalah tekan tombol dan lihat apa yang terjadi pada alat peraganya!
          </p>
        </div>
      </div>
    </div>
  );
}

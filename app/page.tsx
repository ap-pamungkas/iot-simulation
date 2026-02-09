import { Activity, ArrowRight, Cpu, Leaf } from "lucide-react";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              <span>Simulasi IoT Dashboard</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Monitoring & Kontrol
              <span className="block text-primary">Perangkat IoT</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform simulasi visual untuk monitoring Smart Farming dan Smart
              Home. Visualisasi data sensor dan kontrol perangkat dalam satu
              dashboard terintegrasi.
            </p>
          </div>

          {/* Feature Cards - 2 Columns Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Smart Farming Card */}
            <Link
              href="/smart-farming"
              className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 gradient-farming opacity-50" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Smart Farming
                </h2>
                <p className="text-muted-foreground mb-6">
                  Monitoring suhu, kelembapan udara dan kebasahan tanah.
                </p>

                <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-4 transition-all">
                  <span>Lihat Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Relay Simulation Card - Matching Design */}
            <Link
              href="/relay"
              className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-yellow-400/10 opacity-50" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-8 h-8 text-yellow-600" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Simulasi Relay (Dasar IoT)
                </h2>
                <p className="text-muted-foreground mb-6">
                  Belajar konsep dasar IoT dengan mengontrol lampu dari jarak
                  jauh. Cocok untuk pemula!
                </p>

                <div className="flex items-center gap-2 text-yellow-600 font-medium group-hover:gap-4 transition-all">
                  <span>Coba Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

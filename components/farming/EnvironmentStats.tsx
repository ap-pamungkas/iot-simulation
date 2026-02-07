import { Thermometer, Droplets, Sprout } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
interface EnvironmentStatsProps {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}
export default function EnvironmentStats({
  temperature,
  humidity,
  soilMoisture,
}: EnvironmentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Suhu Udara"
        value={`${temperature}°C`}
        icon={<Thermometer className="text-red-500" />}
        type="farming"
      />
      <StatCard
        title="Kelembapan Udara"
        value={`${humidity}%`}
        icon={<Droplets className="text-blue-500" />}
        type="home"
      />
      <StatCard
        title="Kebasahan Tanah"
        value={`${soilMoisture}%`}
        icon={<Sprout className="text-green-500" />}
        status={soilMoisture < 30 ? "warning" : "normal"}
        type="farming"
      />
    </div>
  );
}

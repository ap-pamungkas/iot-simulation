import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface SensorCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "offline";
  trend?: "up" | "down" | "stable";
}

const SensorCard = ({ icon: Icon, title, value, unit, status, trend }: SensorCardProps) => {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="card-iot animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="icon-container icon-container-farming">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          {trend && getTrendIcon()}
          <StatusBadge status={status} />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
      </div>

      {/* Mini sparkline indicator */}
      <div className="mt-4 flex items-center gap-1 h-8">
        {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-primary/20 rounded-full transition-all duration-300 hover:bg-primary/40"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SensorCard;
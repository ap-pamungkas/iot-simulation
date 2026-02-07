interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  status?: "normal" | "warning";
  type: "farming" | "home";
}

export default function StatCard({ title, value, icon, status = "normal", type }: StatCardProps) {
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
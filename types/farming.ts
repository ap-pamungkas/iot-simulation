export interface Log {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  createdAt: string;
}

export interface IrrigationLog {
  id: string;
  duration: number;
  createdAt: string;
}

export interface DeviceData {
  deviceCode: string;
  pumpStatus: boolean;
  duration: number;
  lastSeen: Date;
  logs: Log[];
  irrigationLogs: IrrigationLog[];
}

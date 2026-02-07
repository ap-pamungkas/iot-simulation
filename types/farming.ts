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
  lastSeen: string;
  logs: Log[];
  irrigationLogs: IrrigationLog[];
}

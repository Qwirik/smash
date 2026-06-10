import api from './axios';

export interface Device {
  id: string;
  name: string;
  location: string;
  type: 'light' | 'climate' | 'security';
  status: boolean;
  value: number;
}

export interface HistoryDataPoint {
  time: string;
  value: number;
}

export async function getDevices(): Promise<Device[]> {
  try {
    const response = await api.get<Device[]>('/api/web/devices');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    throw err;
  }
}

export async function sendCommand(device: string, command: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/command', {
      device,
      command,
    });
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function getDeviceHistory(deviceId: string): Promise<HistoryDataPoint[]> {
  try {
    const response = await api.get<HistoryDataPoint[]>(`/api/web/history/${deviceId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    throw err;
  }
}

export interface RuleParams {
  name: string;
  trig_dev: string;
  cond: string;
  val: number;
  act_dev: string;
  act_cmd: string;
  duration?: number;
}

export interface TimerParams {
  name: string;
  time: string;
  act_dev: string;
  act_cmd: string;
}

export async function createRule(rule: RuleParams): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/rules', rule);
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function createTimer(timer: TimerParams): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/timers', timer);
    return response.data;
  } catch (err) {
    throw err;
  }
}

export interface EspStatus {
  success: boolean;
  uptime: number;
  freeHeap: number;
  cpuFreq: number;
  rssi: number;
  chipModel: string;
  flashSize: number;
  tempCelsius: number;
  ruleCount: number;
  ipAddress: string;
  firmwareVersion: string;
}

export interface EspGpio {
  pin: number;
  mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG';
  value: number;
  label: string;
}

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
  channel: number;
}

export async function getEspStatus(): Promise<EspStatus> {
  try {
    const response = await api.get<EspStatus>('/api/status');
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function getEspGpios(): Promise<EspGpio[]> {
  try {
    const response = await api.get<EspGpio[]>('/api/gpios');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    throw err;
  }
}

export async function updateEspGpio(pin: number, mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG', value: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/gpios', { pin, mode, value });
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function scanEspWifi(): Promise<WifiNetwork[]> {
  try {
    const response = await api.get<WifiNetwork[]>('/api/wifi/scan');
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function saveEspWifiConfig(ssid: string, pass: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/wifi/config', { ssid, pass });
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function rebootEsp(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/reboot');
    return response.data;
  } catch (err) {
    throw err;
  }
}

export async function syncEspRules(rules: any[]): Promise<{ success: boolean; totalBytes: number; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; totalBytes: number; message?: string }>('/api/rules/sync', { rules });
    return response.data;
  } catch (err) {
    throw err;
  }
}

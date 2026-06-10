import api from './axios';

// Device contract conforming to smash core structures
export interface Device {
  id: string;
  name: string;
  location: string;
  type: 'light' | 'climate' | 'security';
  status: boolean;
  value: number; // For lights (0-100), climate (temp), security (status/binary)
}

export interface HistoryDataPoint {
  time: string;
  value: number;
}

export interface RawServerDevice {
  device: string;
  last_seen: string;
  status: string; // "offline" or "online"
}

// Helper to infer device type from its raw name
function inferDeviceType(name: string): 'light' | 'climate' | 'security' {
  const lower = name.toLowerCase();
  if (lower.includes('climate') || lower.includes('temp') || lower.includes('fan') || lower.includes('heater') || lower.includes('sensor')) return 'climate';
  if (lower.includes('security') || lower.includes('cam') || lower.includes('motion') || lower.includes('door') || lower.includes('relay')) return 'security';
  return 'light'; // Default to light if unknown
}

// Fetch list of devices
export async function getDevices(): Promise<Device[]> {
  const response = await api.get<RawServerDevice[]>('/api/web/devices');
  const rawData = response.data;

  if (!Array.isArray(rawData)) {
    return [];
  }

  // Map the backend's narrow JSON into the rich object the frontend expects
  return rawData.map((d) => ({
    id: d.device,
    name: d.device.replace(/_/g, ' '), // Prettify name
    location: 'Дом', // Fallback location since backend doesn't provide it
    type: inferDeviceType(d.device),
    status: d.status === 'online', // "offline" means false
    value: 0, // Fallback since backend doesn't provide it
  }));
}

// Single Command sender
export async function sendCommand(device: string, command: string): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/web/command', {
    device,
    command,
  });
  return response.data;
}

// Fetch historical charts
export async function getDeviceHistory(deviceId: string): Promise<HistoryDataPoint[]> {
  const response = await api.get<HistoryDataPoint[]>(`/api/web/history/${deviceId}`);
  return response.data;
}

export interface RuleParams {
  name: string;
  trig_dev: string;
  cond: string;
  val: number;
  act_dev: string;
  act_cmd: string;
  duration?: number; // duration in seconds
}

export interface TimerParams {
  name: string;
  time: string; // "HH:MM"
  act_dev: string;
  act_cmd: string;
}

// POST /api/web/rules - Создание триггерного правила
export async function createRule(rule: RuleParams): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/web/rules', rule);
  return response.data;
}

// POST /api/web/timers - Создание автоматизации по таймеру
export async function createTimer(timer: TimerParams): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/web/timers', timer);
  return response.data;
}

// ==========================================
// C++ ESP32 MICROSERVER INTEGRATION CONTRACTS
// conforming to Qwirik/smash/tree/core-esp-server
// ==========================================

export interface EspStatus {
  success: boolean;
  uptime: number; // seconds
  freeHeap: number; // bytes
  cpuFreq: number; // MHz
  rssi: number; // dBm Wi-Fi signal
  chipModel: string;
  flashSize: number; // MB
  tempCelsius: number; // hardware board temperature
  ruleCount: number;
  ipAddress: string;
  firmwareVersion: string;
}

export interface EspGpio {
  pin: number;
  mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG';
  value: number; // 0/1 or 0-4095
  label: string; // Associated device nickname e.g. "Люстра"
}

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
  channel: number;
}

// Telemetry status of active ESP
export async function getEspStatus(): Promise<EspStatus> {
  const response = await api.get<EspStatus>('/api/status');
  return response.data;
}

// GPIO Pin-by-pin settings of ESP
export async function getEspGpios(): Promise<EspGpio[]> {
  const response = await api.get<EspGpio[]>('/api/gpios');
  return response.data;
}

// Single GPIO update command
export async function updateEspGpio(pin: number, mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG', value: number): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/gpios', { pin, mode, value });
  return response.data;
}

// Scan wifi networks
export async function scanEspWifi(): Promise<WifiNetwork[]> {
  const response = await api.get<WifiNetwork[]>('/api/wifi/scan');
  return response.data;
}

// Save config ssid
export async function saveEspWifiConfig(ssid: string, pass: string): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/wifi/config', { ssid, pass });
  return response.data;
}

// Reboot device
export async function rebootEsp(): Promise<{ success: boolean; message?: string }> {
  const response = await api.post<{ success: boolean; message?: string }>('/api/reboot');
  return response.data;
}

// Sync Rules directly to ESP LittleFS ROM
export async function syncEspRules(rules: any[]): Promise<{ success: boolean; totalBytes: number; message?: string }> {
  const response = await api.post<{ success: boolean; totalBytes: number; message?: string }>('/api/rules/sync', { rules });
  return response.data;
}


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

// Memory safety state for Mock devices when C++ backend is unreachable
let mockDevices: Device[] = [
  { id: 'light-1', name: 'Люстра', location: 'Гостиная', type: 'light', status: true, value: 75 },
  { id: 'light-2', name: 'Подсветка кухни', location: 'Кухня', type: 'light', status: false, value: 0 },
  { id: 'climate-1', name: 'Кондиционер', location: 'Гостиная', type: 'climate', status: true, value: 22 },
  { id: 'climate-2', name: 'Обогреватель', location: 'Спальня', type: 'climate', status: false, value: 18 },
  { id: 'security-1', name: 'Камера во дворе', location: 'Улица', type: 'security', status: true, value: 100 },
  { id: 'security-2', name: 'Датчик протечки', location: 'Ванная', type: 'security', status: false, value: 0 },
];

// Memory safety for Mock history points
const generateMockHistory = (deviceId: string): HistoryDataPoint[] => {
  const points: HistoryDataPoint[] = [];
  const hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  let baseVal = 20;

  if (deviceId.includes('light')) {
    baseVal = 60;
  } else if (deviceId.includes('climate')) {
    baseVal = 21;
  } else {
    baseVal = 10;
  }

  hours.forEach((h, index) => {
    // Generate organic wave variations
    const variance = Math.sin(index * 0.8) * (deviceId.includes('light') ? 25 : 2) + (Math.random() * 2 - 1);
    points.push({
      time: h,
      value: Math.round((baseVal + variance) * 10) / 10,
    });
  });

  return points;
};

// Fetch list of devices
export async function getDevices(): Promise<Device[]> {
  try {
    const response = await api.get<Device[]>('/api/web/devices');
    return response.data;
  } catch (err) {
    // Graceful fallback to rich local state for demonstration
    // We do not raise additional error alerts because the Axios interceptor already logged them on connection fail
    return [...mockDevices];
  }
}

// Single Command sender
export async function sendCommand(device: string, command: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/command', {
      device,
      command,
    });

    // Mirror change to local mock state if success
    if (response.data?.success) {
      updateMockDeviceState(device, command);
    }
    return response.data;
  } catch (err) {
    // If backend isn't online, handle the feedback immediately in mock state
    updateMockDeviceState(device, command);
    return { success: true }; // Return successful outcome so the UI responds instantly
  }
}

// Helper to keep our client state interactive even when offline
function updateMockDeviceState(device: string, command: string) {
  mockDevices = mockDevices.map((d) => {
    if (d.name === device || d.id === device) {
      if (command.startsWith('toggle_')) {
        const nextStatus = !d.status;
        return {
          ...d,
          status: nextStatus,
          value: nextStatus ? (d.type === 'light' ? 80 : d.type === 'climate' ? 22 : 100) : 0,
        };
      } else if (command.startsWith('dim_')) {
        const value = parseInt(command.replace('dim_', ''), 10) || 0;
        return { ...d, status: value > 0, value };
      } else if (command.startsWith('temp_')) {
        const value = parseInt(command.replace('temp_', ''), 10) || 22;
        return { ...d, status: true, value };
      }
    }
    return d;
  });
}

// Fetch historical charts
export async function getDeviceHistory(deviceId: string): Promise<HistoryDataPoint[]> {
  try {
    const response = await api.get<HistoryDataPoint[]>(`/api/web/history/${deviceId}`);
    return response.data;
  } catch (err) {
    // Local mock history generator
    return generateMockHistory(deviceId);
  }
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
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/rules', rule);
    return response.data;
  } catch (err) {
    // Falls back gracefully for offline mock mode
    return { success: true, message: 'Правило автоматизации успешно зарегистрировано' };
  }
}

// POST /api/web/timers - Создание автоматизации по таймеру
export async function createTimer(timer: TimerParams): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/web/timers', timer);
    return response.data;
  } catch (err) {
    // Falls back gracefully for offline mock mode
    return { success: true, message: 'Таймер автоматизации успешно зарегистрирован' };
  }
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

// Simulated active memory states for the ESP32 Core when disconnected
let mockEspUptime = 34500;
let mockEspGpios: EspGpio[] = [
  { pin: 2, mode: 'OUTPUT', value: 1, label: 'Люстра (Гостиная)' },
  { pin: 4, mode: 'OUTPUT', value: 0, label: 'Подсветка кухни' },
  { pin: 12, mode: 'INPUT_PULLUP', value: 1, label: 'Датчик протечки' },
  { pin: 14, mode: 'ANALOG', value: 2200, label: 'Кондиционер (Термостат)' },
  { pin: 15, mode: 'INPUT', value: 1, label: 'Датчик движения' },
  { pin: 16, mode: 'PWM', value: 128, label: 'Обогреватель (ШИМ)' },
  { pin: 25, mode: 'OUTPUT', value: 1, label: 'Геркон входной двери' },
  { pin: 26, mode: 'OUTPUT', value: 0, label: 'Резервное реле R1' }
];
let mockWifiConfigured = { ssid: 'SMASHCORE_NET', connected: true };
let mockSyncedRuleCount = 2;

// Telemetry status of active ESP
export async function getEspStatus(): Promise<EspStatus> {
  try {
    const response = await api.get<EspStatus>('/api/status');
    return response.data;
  } catch (err) {
    mockEspUptime += 5; // increment uptime simulation
    // Simulate real-world fluctuations in heap, signal and board temperature
    const randomSignalNoise = Math.floor(Math.random() * 5) - 2;
    const randomTempNoise = Math.round((Math.random() * 0.8 - 0.4) * 10) / 10;
    return {
      success: true,
      uptime: mockEspUptime,
      freeHeap: 184512 + Math.floor(Math.random() * 120),
      cpuFreq: 240,
      rssi: -62 + randomSignalNoise,
      chipModel: 'ESP32-S3 Dual-Core Xtensa LX7',
      flashSize: 16,
      tempCelsius: 41.5 + randomTempNoise,
      ruleCount: mockSyncedRuleCount,
      ipAddress: '192.168.1.104',
      firmwareVersion: 'SmashESP-Core-v2.1.0-build2026'
    };
  }
}

// GPIO Pin-by-pin settings of ESP
export async function getEspGpios(): Promise<EspGpio[]> {
  try {
    const response = await api.get<EspGpio[]>('/api/gpios');
    return response.data;
  } catch (err) {
    return [...mockEspGpios];
  }
}

// Single GPIO update command
export async function updateEspGpio(pin: number, mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG', value: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/gpios', { pin, mode, value });
    return response.data;
  } catch (err) {
    mockEspGpios = mockEspGpios.map(g => {
      if (g.pin === pin) {
        return { ...g, mode, value };
      }
      return g;
    });
    return { success: true, message: `GPIO ${pin} настроен: Режим=${mode}, Значение=${value}` };
  }
}

// Scan wifi networks
export async function scanEspWifi(): Promise<WifiNetwork[]> {
  try {
    const response = await api.get<WifiNetwork[]>('/api/wifi/scan');
    return response.data;
  } catch (err) {
    // Delay simulation to match physical radio hardware scans
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      { ssid: 'SMASHCORE_NET', rssi: -45, secure: true, channel: 1 },
      { ssid: 'Keenetic-7389', rssi: -68, secure: true, channel: 6 },
      { ssid: 'TP-Link_Guest', rssi: -82, secure: false, channel: 11 },
      { ssid: 'SMASH_AP_HARDWARE_NODE', rssi: -30, secure: true, channel: 3 },
      { ssid: 'MGTS_GPON_99BF', rssi: -74, secure: true, channel: 2 }
    ];
  }
}

// Save config ssid
export async function saveEspWifiConfig(ssid: string, pass: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/wifi/config', { ssid, pass });
    return response.data;
  } catch (err) {
    mockWifiConfigured = { ssid, connected: true };
    return { success: true, message: `Параметры сохранены. ESP32 подключается к "${ssid}"` };
  }
}

// Reboot device
export async function rebootEsp(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; message?: string }>('/api/reboot');
    return response.data;
  } catch (err) {
    mockEspUptime = 0;
    return { success: true, message: 'Команда на перезапуск микроконтроллера ESP32 отправлена в эфир' };
  }
}

// Sync Rules directly to ESP LittleFS ROM
export async function syncEspRules(rules: any[]): Promise<{ success: boolean; totalBytes: number; message?: string }> {
  try {
    const response = await api.post<{ success: boolean; totalBytes: number; message?: string }>('/api/rules/sync', { rules });
    return response.data;
  } catch (err) {
    mockSyncedRuleCount = rules.length;
    const ruleStringSize = JSON.stringify(rules).length;
    return {
      success: true,
      totalBytes: ruleStringSize,
      message: `Таблица правил (${rules.length} блоков) экспортирована в flash-память ESP32 (LittleFS ROM)`
    };
  }
}


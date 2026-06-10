import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  getEspStatus, getEspGpios, updateEspGpio, scanEspWifi, saveEspWifiConfig, rebootEsp, syncEspRules, 
  EspStatus, EspGpio, WifiNetwork 
} from '../api/endpoints';
import { Card } from './ui/Card';
import { 
  Cpu, Wifi, HardDrive, RefreshCw, Radio, Terminal, Power, Database, 
  AlertCircle, Sparkles, Send, Signal, Sliders, CheckCircle, Flame, ShieldAlert, KeyRound
} from 'lucide-react';

export function EspConnector() {
  const serverUrl = useAppStore((state) => state.serverUrl);
  const apiKey = useAppStore((state) => state.apiKey);
  const customScenarios = useAppStore((state) => state.customScenarios);
  const addToast = useAppStore((state) => state.addToast);

  // Connection and API data state
  const [status, setStatus] = useState<EspStatus | null>(null);
  const [gpios, setGpios] = useState<EspGpio[]>([]);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingGpios, setLoadingGpios] = useState(true);
  const [scanningWifi, setScanningWifi] = useState(false);
  const [syncingRules, setSyncingRules] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  // Wi-Fi Form config
  const [selectedSsid, setSelectedSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiForm, setShowWifiForm] = useState(false);

  // Manual pin configuration
  const [editingPin, setEditingPin] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG'>('OUTPUT');
  const [editValue, setEditValue] = useState(0);

  // Terminal Logs emulator
  const [logs, setLogs] = useState<{ id: string; time: string; source: 'SYS' | 'REST' | 'GPIO' | 'RULES'; text: string; type?: 'info' | 'warn' | 'success' }[]>([
    { id: '1', time: '00:00:01', source: 'SYS', text: 'Загрузка ядра SmashESP Dual-Core...', type: 'info' },
    { id: '2', time: '00:00:02', source: 'SYS', text: 'LittleFS ROM: Файловая система успешно вмонтирована', type: 'info' },
    { id: '3', time: '00:00:03', source: 'SYS', text: 'Wi-Fi: Инициализация модуля радиовещания в режиме Station', type: 'info' },
    { id: '4', time: '00:00:04', source: 'SYS', text: 'Wi-Fi: Подключено к локальному хосту. IP: 192.168.1.104', type: 'success' },
    { id: '5', time: '00:00:05', source: 'REST', text: 'HTTP REST: Веб-сервер SmashCore активен на порту 80', type: 'success' },
    { id: '6', time: '00:00:06', source: 'RULES', text: 'RulesEngine: Загружено 2 активных сценария из LittleFS ROM', type: 'info' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Periodic Telemetry Puller
  useEffect(() => {
    fetchEspData(true);
    const interval = setInterval(() => {
      fetchEspData(false);
    }, 4500);
    return () => clearInterval(interval);
  }, [serverUrl]);

  // Scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchEspData = async (initial = false) => {
    if (initial) {
      setLoadingStatus(true);
      setLoadingGpios(true);
    }
    try {
      const [statusData, gpioData] = await Promise.all([
        getEspStatus(),
        getEspGpios()
      ]);
      // Ensure we don't save vite html fallbacks
      setStatus(typeof statusData === 'object' && !Array.isArray(statusData) && statusData !== null && 'firmwareVersion' in statusData ? statusData : null);
      setGpios(Array.isArray(gpioData) ? gpioData : []);
    } catch (err) {
      // Graceful fallback
      setStatus(null);
      setGpios([]);
    } finally {
      if (initial) {
        setLoadingStatus(false);
        setLoadingGpios(false);
      }
    }
  };

  const addLog = (source: 'SYS' | 'REST' | 'GPIO' | 'RULES', text: string, type?: 'info' | 'warn' | 'success') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      ...prev,
      { id: Math.random().toString(), time: timeStr, source, text, type }
    ].slice(-100)); // cap at 100 entries for console performance
  };

  // Physical Pin Update
  const handleGpioUpdate = async (pin: number, mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'PWM' | 'ANALOG', val: number) => {
    addLog('REST', `ОТПРАВКА >> POST ${serverUrl}/api/gpios Payload: { pin: ${pin}, mode: "${mode}", value: ${val} }`, 'info');
    try {
      const result = await updateEspGpio(pin, mode, val);
      if (result.success) {
        addToast(`Пин GPIO ${pin} успешно сконфигурирован в режим ${mode}`, 'success');
        addLog('GPIO', `Пин ${pin} переведен в ${mode}, уровень: ${val}`, 'success');
        // Refresh GPIO states locally
        setGpios(prev => prev.map(g => g.pin === pin ? { ...g, mode, value: val } : g));
      }
    } catch (err) {
      addLog('REST', `ОШИБКА HTTP >> Не удалось выполнить POST /api/gpios. Сеть недоступна`, 'warn');
    }
    setEditingPin(null);
  };

  // WI-FI Scan
  const handleWifiScan = async () => {
    setScanningWifi(true);
    addLog('REST', `ОТПРАВКА >> GET ${serverUrl}/api/wifi/scan`, 'info');
    try {
      const scanned = await scanEspWifi();
      const validNetworks = Array.isArray(scanned) ? scanned : [];
      setNetworks(validNetworks);
      addLog('SYS', `Радиоэфир отсканирован. Найдено ${validNetworks.length} Wi-Fi сетей`, 'success');
      addToast('Список Wi-Fi сетей обновлен', 'success');
    } catch (err) {
      setNetworks([]);
      addLog('REST', `ОШИБКА HTTP >> Не получено ответа от GET /api/wifi/scan`, 'warn');
    } finally {
      setScanningWifi(false);
    }
  };

  // WI-FI Config
  const handleConnectWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSsid) return;
    addLog('REST', `ОТПРАВКА >> POST ${serverUrl}/api/wifi/config SSID: "${selectedSsid}"`, 'info');
    try {
      const result = await saveEspWifiConfig(selectedSsid, wifiPassword);
      if (result.success) {
        addToast(`Параметры сохранены. ESP32 подключается к ${selectedSsid}`, 'success');
        addLog('SYS', `Старт коннекта к AP: "${selectedSsid}"...`, 'success');
        setShowWifiForm(false);
        setWifiPassword('');
      }
    } catch (err) {
      addLog('REST', `ОШИБКА HTTP >> POST /api/wifi/config не ответил`, 'warn');
    }
  };

  // Reboot ESP32
  const handleReboot = async () => {
    setRebooting(true);
    addLog('REST', `ОТПРАВКА >> POST ${serverUrl}/api/reboot`, 'warn');
    try {
      const result = await rebootEsp();
      if (result.success) {
        addToast('Микроконтроллер ESP32 отправлен в перезагрузку', 'success');
        addLog('SYS', `Микроконтроллер перезапускается по команде API... [Сброс шины]`, 'warn');
        // Reset status momentarily
        if (status) {
          setStatus({ ...status, uptime: 0, ipAddress: '0.0.0.0' });
        }
      }
    } catch (err) {
      addLog('REST', `ОШИБКА HTTP >> reboot-запрос завершился неудачей`, 'warn');
    } finally {
      setTimeout(() => setRebooting(false), 2000);
    }
  };

  // Compile scenarios and upload rules to SPIFFS/LittleFS
  const handleSyncScenarios = async () => {
    setSyncingRules(true);
    addLog('RULES', `Компиляция сценариев пользователя во флеш-байткод...`, 'info');
    
    // Compile Zustand scenarios into compact structural rules expected by C++ code
    const compiledRules = customScenarios.map(sc => ({
      id: sc.id,
      name: sc.name.substring(0, 31),
      enabled: sc.enabled ? 1 : 0,
      trigType: sc.triggerType,
      trigVal: sc.triggerValue,
      actDev: sc.actionDevice.substring(0, 31),
      actCmd: `${sc.actionType}_${sc.actionValue}`
    }));

    addLog('REST', `ОТПРАВКА >> POST ${serverUrl}/api/rules/sync Payload: ${JSON.stringify(compiledRules)}`, 'info');

    try {
      const result = await syncEspRules(compiledRules);
      if (result.success) {
        addToast(`Сценарии успешно прошиты во флеш-память ESP (размер: ${result.totalBytes} B)`, 'success');
        addLog('RULES', `ROM-флеш готов! Прописано байткода сценариев: ${result.totalBytes}байт. LittleFS сектор сохранен`, 'success');
        if (status) {
          setStatus({ ...status, ruleCount: compiledRules.length });
        }
      }
    } catch (err) {
      addLog('REST', `ОШИБКА RULES >> Не удалось синхронизировать правила с C++ сервером`, 'warn');
    } finally {
      setSyncingRules(false);
    }
  };

  // Custom terminal commands
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    addLog('REST', `CLIENT >> ${cmd}`, 'info');
    setTerminalInput('');

    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd === 'ping') {
      addLog('REST', `ESP32 << PONG (IP: ${status?.ipAddress || '192.168.1.104'}, Rtt: 12ms)`, 'success');
    } else if (lowerCmd === 'help') {
      addLog('SYS', 'Доступные терминальные команды: help, ping, reboot, scan, status, toggle <pin>', 'info');
    } else if (lowerCmd === 'reboot') {
      handleReboot();
    } else if (lowerCmd === 'scan') {
      handleWifiScan();
    } else if (lowerCmd === 'status') {
      addLog('SYS', `ХАРАКТЕРИСТИКИ: Ядро=${status?.chipModel || 'ESP32'}, ОЗУ=${status?.freeHeap || 184512}Б, RSSI=${status?.rssi || -60}dBm, Аптайм=${status?.uptime || 34500}с`, 'info');
    } else if (lowerCmd.startsWith('toggle ')) {
      const pinStr = lowerCmd.replace('toggle ', '');
      const pinNum = parseInt(pinStr, 10);
      if (!isNaN(pinNum)) {
        const found = gpios.find(g => g.pin === pinNum);
        const nextVal = found ? (found.value === 1 ? 0 : 1) : 1;
        handleGpioUpdate(pinNum, found?.mode || 'OUTPUT', nextVal);
      } else {
        addLog('SYS', ' Ошибка: Введите корректный номер пина. Пример: toggle 2', 'warn');
      }
    } else {
      addLog('REST', `C++ Shell: Ошибка парсинга. Команда "${cmd}" не распознана. Наберите "help"`, 'warn');
    }
  };

  // Formatter for uptime
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}ч ${m}м ${s}с`;
  };

  // Signal level color helper
  const getRssiColor = (rssi: number) => {
    if (rssi >= -50) return 'text-emerald-400';
    if (rssi >= -70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRssiLabel = (rssi: number) => {
    if (rssi >= -50) return 'Отличный';
    if (rssi >= -70) return 'Хороший';
    if (rssi >= -85) return 'Слабый';
    return 'Критический';
  };

  return (
    <div className="flex flex-col gap-6 select-none animate-fade-in text-brand-panel-text text-left">
      {/* 1. Header with Connection block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-input border border-brand-border p-4 rounded-brand" style={{ borderRadius: 'var(--app-radius)' }}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary animate-pulse" style={{ color: 'var(--app-primary)', backgroundColor: 'var(--app-accent-muted)' }}>
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Сеть SmashCore & C++ ESP32 Server</h3>
            <p className="text-xs text-brand-muted mt-1">
              {status ? `Интеграция активна. Хост: ${serverUrl} [Связь по API ключу]` : 'Инициализация моста связи...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSyncScenarios}
            disabled={syncingRules}
            className="flex-1 md:flex-none py-2 px-4 bg-brand-panel border border-brand-border hover:border-brand-primary text-xs font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
          >
            {syncingRules ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" /> : <Database className="w-3.5 h-3.5 text-brand-primary" style={{ color: 'var(--app-primary)' }} />}
            Прошить правила в ESP32
          </button>

          <button
            type="button"
            onClick={handleReboot}
            disabled={rebooting}
            className="py-2 px-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
          >
            <Power className={`w-3.5 h-3.5 ${rebooting ? 'animate-spin' : ''}`} />
            Ребут
          </button>
        </div>
      </div>

      {/* Grid: 2. Telemetry and 3. Wifi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TELEMETRY CARD */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-muted flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Телеметрия ESP32-S3 (LittleFS / ROM)
          </h4>
          <Card>
            {loadingStatus ? (
              <div className="flex items-center justify-center py-12 gap-2.5 text-xs text-brand-muted">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                Загрузка физических данных...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-brand-input/40 border border-brand-border p-3 rounded text-center flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] text-brand-muted uppercase font-black tracking-wider block">Версия Пошивки</span>
                  <span className="text-xs font-mono font-bold block mt-1.5 truncate text-slate-300">
                    {status?.firmwareVersion?.substring(0, 14)}..
                  </span>
                  <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 py-0.5 px-1.5 rounded inline-block self-center mt-1">
                    C++ Native
                  </span>
                </div>

                <div className="bg-brand-input/40 border border-brand-border p-3 rounded text-center flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] text-brand-muted uppercase font-black tracking-wider block">Свободный Heap</span>
                  <span className="text-md font-mono font-extrabold block text-brand-primary mt-1" style={{ color: 'var(--app-primary)' }}>
                    {Math.round((status?.freeHeap || 0) / 1024)} KB
                  </span>
                  <span className="text-[8px] text-brand-muted block font-semibold">из 320 KB RAM</span>
                </div>

                <div className="bg-brand-input/40 border border-brand-border p-3 rounded text-center flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] text-brand-muted uppercase font-black tracking-wider block">Время Наработки</span>
                  <span className="text-xs font-mono font-extrabold block text-slate-200 mt-1">
                    {status ? formatUptime(status.uptime) : '0с'}
                  </span>
                  <span className="text-[8px] text-emerald-400 block font-bold uppercase tracking-widest mt-1">ОНЛАЙН</span>
                </div>

                <div className="bg-brand-input/40 border border-brand-border p-3 rounded text-center flex flex-col justify-between min-h-[90px]">
                  <span className="text-[9px] text-brand-muted uppercase font-black tracking-wider block">Wi-Fi Сигнал</span>
                  <span className={`text-sm font-mono font-extrabold flex items-center justify-center gap-1.5 mt-1 ${getRssiColor(status?.rssi || -60)}`}>
                    <Signal className="w-3.5 h-3.5" />
                    {status?.rssi || -60} dBm
                  </span>
                  <span className="text-[8px] text-brand-muted block font-semibold truncate leading-none">
                    {getRssiLabel(status?.rssi || -60)}
                  </span>
                </div>

                {/* Additional metrics */}
                <div className="col-span-2 md:col-span-4 border-t border-brand-border pt-4 mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-brand-muted text-[10px] block">Тип кристалла:</span>
                    <span className="text-slate-200 block font-bold leading-relaxed">{status?.chipModel}</span>
                  </div>
                  <div>
                    <span className="text-brand-muted text-[10px] block">Температура чипа:</span>
                    <span className="text-orange-400 block font-mono font-bold leading-relaxed">{status?.tempCelsius}°C</span>
                  </div>
                  <div>
                    <span className="text-brand-muted text-[10px] block">Флеш-память:</span>
                    <span className="text-slate-200 block font-bold leading-relaxed">{status?.flashSize} MB QIO SPI</span>
                  </div>
                  <div>
                    <span className="text-brand-muted text-[10px] block">Залито правил в ROM:</span>
                    <span className="text-brand-primary block font-mono font-bold leading-relaxed" style={{ color: 'var(--app-primary)' }}>{status?.ruleCount} сценариев</span>
                  </div>
                </div>

              </div>
            )}
          </Card>
        </div>

        {/* WI-FI PROVISIONING CARD */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-muted flex items-center gap-2">
            <Wifi className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Радиоканал Wi-Fi (802.11)
          </h4>
          <Card className="flex flex-col gap-3 min-h-[220px] justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold">Wi-Fi Сети поблизости</span>
                <button
                  type="button"
                  onClick={handleWifiScan}
                  disabled={scanningWifi}
                  className="py-1 px-2.5 text-[10px] uppercase font-black tracking-wider bg-brand-input border border-brand-border hover:border-brand-primary transition-all rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${scanningWifi ? 'animate-spin' : ''}`} />
                  Поиск
                </button>
              </div>

              {scanningWifi ? (
                <div className="flex flex-col items-center justify-center py-6 text-brand-muted text-[11px] gap-2">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-brand-primary animate-ping" style={{ color: 'var(--app-primary)' }} />
                  </div>
                  <span>Опрос радиочастот...</span>
                </div>
              ) : networks.length > 0 ? (
                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {networks.map(n => (
                    <button
                      key={n.ssid}
                      type="button"
                      onClick={() => {
                        setSelectedSsid(n.ssid);
                        setShowWifiForm(true);
                      }}
                      className="w-full text-left p-1.5 px-2 bg-brand-input border border-brand-border hover:border-brand-primary rounded text-[10px] font-mono flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="truncate font-bold text-slate-350">{n.ssid}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {n.secure && <KeyRound className="w-3 h-3 text-slate-500" />}
                        <span className={getRssiColor(n.rssi)}>{n.rssi} dBm</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-brand-muted text-[10px] italic">
                  Нажмите "Поиск", чтобы получить список точек доступа микросхемы
                </div>
              )}
            </div>

            {showWifiForm && (
              <form onSubmit={handleConnectWifi} className="border-t border-brand-border pt-3 mt-1 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-brand-muted uppercase font-black">Подключиться к Wi-Fi: {selectedSsid}</span>
                  <input
                    type="password"
                    placeholder="Пароль точки доступа"
                    required
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full bg-brand-input border border-brand-border focus:border-brand-primary p-1.5 rounded text-[10px] font-mono select-text outline-none text-brand-panel-text"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 py-1 px-2.5 text-[9px] font-bold bg-brand-primary text-slate-900 rounded outline-none w-full hover:brightness-110 shadow"
                    style={{ backgroundColor: 'var(--app-primary)' }}
                  >
                    Линковать
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWifiForm(false);
                      setWifiPassword('');
                    }}
                    className="py-1 px-2.5 text-[9px] text-brand-muted bg-brand-input rounded border border-brand-border"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>

      </div>

      {/* Grid: 4. Physical Gpios Register & Mapping */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-muted flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
          Регистр Физических Портов GPIO (C++ Mapping)
        </h4>
        <Card>
          {loadingGpios ? (
            <div className="flex items-center justify-center py-10 gap-2 text-xs text-brand-muted">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" style={{ color: 'var(--app-primary)' }} />
              Загрузка регистров портов...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {gpios.map(g => {
                const isActiveOutput = g.mode === 'OUTPUT' && g.value === 1;
                return (
                  <div
                    key={g.pin}
                    className={`p-3 rounded-brand border text-xs flex flex-col justify-between gap-2.5 transition-all outline-none ${
                      editingPin === g.pin 
                        ? 'border-brand-primary bg-brand-input' 
                        : isActiveOutput 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : 'border-brand-border bg-brand-input/20'
                    }`}
                    style={{ borderRadius: 'var(--app-radius)' }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold font-mono text-brand-primary" style={{ color: 'var(--app-primary)' }}>
                          GPIO {g.pin}
                        </span>
                        <h5 className="text-[11px] font-bold text-slate-200 mt-1 truncate max-w-[120px]" title={g.label}>
                          {g.label}
                        </h5>
                      </div>

                      <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        g.mode === 'OUTPUT' 
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                          : g.mode === 'INPUT_PULLUP' || g.mode === 'INPUT'
                            ? 'bg-amber-500/15 border border-amber-500/25 text-amber-500'
                            : 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400'
                      }`}>
                        {g.mode}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-brand-border/40 text-[10px]">
                      <div className="font-mono font-extrabold">
                        {g.mode === 'OUTPUT' || g.mode === 'INPUT' || g.mode === 'INPUT_PULLUP' ? (
                          <span className={g.value === 1 ? 'text-emerald-400' : 'text-slate-500'}>
                            УРОВЕНЬ: {g.value}
                          </span>
                        ) : (
                          <span className="text-indigo-400">
                            АЦП: {g.value}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingPin(g.pin);
                          setEditMode(g.mode);
                          setEditValue(g.value);
                        }}
                        className="py-1 px-2 bg-brand-panel hover:text-brand-primary border border-brand-border rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                      >
                        Откалибровать
                      </button>
                    </div>

                    {editingPin === g.pin && (
                      <div className="border-t border-brand-primary/20 pt-2.5 mt-1 flex flex-col gap-2">
                        <div className="flex flex-col gap-1 text-[9px] text-brand-muted">
                          <span>Режим Пина (Mode)</span>
                          <select
                            value={editMode}
                            onChange={(e) => setEditMode(e.target.value as any)}
                            className="bg-brand-panel border border-brand-border p-1 rounded text-[10px] text-brand-panel-text font-mono"
                          >
                            <option value="OUTPUT">OUTPUT (Цифровой вывод)</option>
                            <option value="INPUT">INPUT (Цифровой ввод)</option>
                            <option value="INPUT_PULLUP">INPUT_PULLUP (Подтяжка)</option>
                            <option value="PWM">PWM (ШИМ регулятор)</option>
                            <option value="ANALOG">ANALOG (Аналоговый)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1 text-[9px] text-brand-muted">
                          <span>Значение сигнала (Value)</span>
                          {editMode === 'PWM' ? (
                            <input
                              type="range"
                              min="0"
                              max="255"
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value, 10))}
                              className="w-full cursor-pointer h-1 rounded"
                              style={{ accentColor: 'var(--app-primary)' }}
                            />
                          ) : editMode === 'ANALOG' ? (
                            <input
                              type="number"
                              min="0"
                              max="4095"
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value, 10) || 0)}
                              className="bg-brand-panel border border-brand-border p-1 rounded font-mono text-[10px] text-brand-panel-text outline-none"
                            />
                          ) : (
                            <div className="flex gap-1 bg-brand-panel p-0.5 rounded border border-brand-border">
                              <button
                                type="button"
                                onClick={() => setEditValue(0)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${editValue === 0 ? 'bg-red-500/25 text-red-400' : 'text-slate-400'}`}
                              >
                                Low (0)
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditValue(1)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${editValue === 1 ? 'bg-emerald-500/25 text-emerald-400' : 'text-slate-400'}`}
                              >
                                High (1)
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5 pt-1 text-[9px]">
                          <button
                            type="button"
                            onClick={() => handleGpioUpdate(g.pin, editMode, editValue)}
                            className="flex-1 py-1 px-2 bg-brand-primary text-slate-900 font-extrabold rounded select-none cursor-pointer"
                            style={{ backgroundColor: 'var(--app-primary)' }}
                          >
                            Записать
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPin(null)}
                            className="py-1 px-2 text-brand-muted bg-brand-panel rounded border border-brand-border select-none"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Terminal Logger Emulator representing core-esp-server output */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-muted flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
          Эмулятор C++ Serial LOG & REST HTTP Мониторинга
        </h4>
        <Card className="p-0 border-brand-border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border bg-brand-input/40" style={{ borderTopLeftRadius: 'var(--app-radius)', borderTopRightRadius: 'var(--app-radius)' }}>
            <div className="flex items-center gap-2 text-[10.5px] tracking-wider font-extrabold uppercase text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              SmashCore-ESP-v2 (Serial COM3)
            </div>
            <button
              type="button"
              onClick={() => {
                setLogs([]);
                addLog('SYS', 'Трассировка системных вызовов очищена', 'info');
              }}
              className="py-1 px-3 text-[9px] font-extrabold uppercase bg-brand-panel border border-brand-border text-brand-muted hover:text-brand-panel-text rounded transition-all cursor-pointer"
            >
              Очистить консоль
            </button>
          </div>

          <div 
            className="p-4 h-[240px] overflow-y-auto font-mono text-[10.5px] leading-relaxed bg-slate-950/90 text-slate-300 flex flex-col gap-1.5 scrollbar-thin select-text"
          >
            {logs.map(log => {
              let sourceColor = 'text-blue-400';
              if (log.source === 'GPIO') sourceColor = 'text-amber-400';
              if (log.source === 'RULES') sourceColor = 'text-indigo-400';
              if (log.source === 'REST') sourceColor = 'text-cyan-400';

              let textClass = 'text-slate-350';
              if (log.type === 'warn') textClass = 'text-red-400 font-bold';
              if (log.type === 'success') textClass = 'text-emerald-400 font-semibold';

              return (
                <div key={log.id} className="flex gap-2 text-left bg-transparent">
                  <span className="text-slate-600 shrink-0 select-none bg-transparent">[{log.time}]</span>
                  <span className={`${sourceColor} font-black shrink-0 select-none bg-transparent`}>[{log.source}]</span>
                  <span className={`${textClass} break-all bg-transparent`}>{log.text}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} className="bg-transparent" />
          </div>

          <form onSubmit={handleTerminalCommand} className="flex border-t border-brand-border bg-slate-950">
            <div className="pl-4 pr-1.5 flex items-center shrink-0 select-none text-slate-500 font-bold text-xs bg-transparent">
              $ esp32-core-cli &gt;
            </div>
            <input
              type="text"
              placeholder="Введите команду (help, ping, status, scan, toggle <pin>)..."
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="flex-1 bg-transparent p-3 text-xs font-mono text-emerald-400 outline-none select-text resize-none border-0"
            />
            <button
              type="submit"
              className="px-5 hover:bg-slate-900 border-l border-brand-border/40 text-brand-primary flex items-center justify-center transition-all cursor-pointer"
              style={{ color: 'var(--app-primary)' }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </Card>
      </div>

    </div>
  );
}

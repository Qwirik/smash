import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface ScenarioCondition {
  id: string;
  sensorDevice: string;
  parameter: string; // 'temperature' | 'humidity' | 'motion' | 'time' | 'status' etc.
  operator: string;  // '>', '<', '==', '!=' etc.
  value: string;
  duration?: number; // duration in seconds
  joint?: 'AND' | 'OR'; // connection logical operator to the next condition block
}

export interface ScenarioAction {
  id: string;
  device: string;
  commandType: 'on' | 'off' | 'value';
  value: number;
}

export interface LogicalNode {
  id: string;
  type: 'condition' | 'timer' | 'group';
  
  // condition fields
  sensorDevice?: string;
  parameter?: string; // 'temperature' | 'humidity' | 'motion' | 'time' | 'status' etc.
  operator?: string;  // '>', '<', '==', '!=' etc.
  value?: string;

  // timer fields
  duration?: number; // duration in seconds

  // group fields
  logicalOperator?: 'AND' | 'OR';
  nodes?: LogicalNode[];
}

export interface CustomScenario {
  id: string;
  name: string;
  triggerType: 'temp' | 'time' | 'motion' | 'manual' | 'multi';
  triggerValue: string;
  actionDevice: string;
  actionType: 'on' | 'off' | 'value';
  actionValue: number;
  enabled: boolean;
  icon?: string;
  conditions?: ScenarioCondition[];
  actions?: ScenarioAction[];
  logicalTree?: LogicalNode;
}

export interface RoomInfo {
  id: string;
  name: string;
  description: string;
  deviceIds: string[];
  temperature?: number;
  humidity?: number;
}

export interface AppState {
  // Authentication Account
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, name: string) => void;
  logout: () => void;

  // Security Lock PIN
  pinCode: string | null;
  isUnlocked: boolean;
  setPinCode: (pin: string | null) => void;
  setUnlocked: (unlocked: boolean) => void;

  // Network
  serverUrl: string;
  apiKey: string;
  setNetwork: (url: string, key: string) => void;

  // Theme
  themeMode: 'dark' | 'light' | 'custom';
  bgColor: string;
  primaryColor: string;
  textColor: string;
  borderColor: string;
  textMutedColor: string;
  accentMutedColor: string;
  panelBgColor: string;
  inputBgColor: string;
  bgType: 'solid' | 'gradient' | 'animated';
  bgGradientStart: string;
  bgGradientEnd: string;
  setThemeMode: (mode: 'dark' | 'light' | 'custom') => void;
  setThemeColors: (bg: string, primary: string, text: string, border: string) => void;
  setThemeColorsAdvanced: (colors: Partial<{
    bgColor: string;
    primaryColor: string;
    textColor: string;
    borderColor: string;
    textMutedColor: string;
    accentMutedColor: string;
    panelBgColor: string;
    inputBgColor: string;
    bgType: 'solid' | 'gradient' | 'animated';
    bgGradientStart: string;
    bgGradientEnd: string;
  }>) => void;

  // Geometry
  borderWidth: number; // 0 to 4 px
  borderRadius: number; // 0 to 32 px
  transitionSpeed: number; // 0 to 1000 ms
  setGeometry: (width: number, radius: number, speed: number) => void;

  // Dashboard customization
  dashboardOrder: string[];
  dashboardSizes: Record<string, { cols: number; rows: number } | 'small' | 'medium' | 'large'>;
  setDashboardOrder: (order: string[]) => void;
  setDashboardSizes: (sizes: Record<string, { cols: number; rows: number } | 'small' | 'medium' | 'large'>) => void;

  // Custom Scenarios
  customScenarios: CustomScenario[];
  addCustomScenario: (entry: CustomScenario) => void;
  removeCustomScenario: (id: string) => void;
  toggleCustomScenario: (id: string) => void;
  updateCustomScenario: (id: string, updated: Partial<CustomScenario>) => void;

  // Rooms
  rooms: RoomInfo[];
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  addRoom: (name: string, desc: string) => void;
  removeRoom: (id: string) => void;
  addDeviceToRoom: (roomId: string, deviceId: string) => void;
  removeDeviceFromRoom: (roomId: string, deviceId: string) => void;

  // Collapse sidebar helper
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // System
  pollingInterval: number; // 1 to 60 seconds
  setPollingInterval: (interval: number) => void;

  // Scenario Builder Colors Accent
  logicAccent: string;
  actionAccent: string;
  actionBtnColor: string;
  codeHighlightColor: string;
  setLogicAccent: (val: string) => void;
  setActionAccent: (val: string) => void;
  setActionBtnColor: (val: string) => void;
  setCodeHighlightColor: (val: string) => void;

  // Toast notifications managed globally
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User Profile Initial State (Logged in by default as Admin, but log-outable)
      user: { name: 'Иван Андреевич', email: 'g.ivan.andreevich@gmail.com' },
      isAuthenticated: true,
      login: (email, name) => set({ user: { email, name }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, isUnlocked: false }),

      // Auth Initial State
      pinCode: null,
      isUnlocked: false,
      setPinCode: (pin) => set({ pinCode: pin }),
      setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),

      // Network Initial State
      serverUrl: 'http://localhost:8080',
      apiKey: '',
      setNetwork: (url, key) => set({ serverUrl: url, apiKey: key }),

      // Theme Initial State (Customizable via settings)
      themeMode: 'dark',
      bgColor: '#0f171c',      // Premium Space Deep Slate
      primaryColor: '#00f0ff', // Cyber Neon Cyan Accent
      textColor: '#f8fafc',    // Clean bright text
      borderColor: '#1e293b',  // Slate border outline color
      textMutedColor: '#94a3b8',
      accentMutedColor: 'rgba(0, 240, 255, 0.1)',
      panelBgColor: 'rgba(15, 23, 42, 0.65)',
      inputBgColor: 'rgba(10, 15, 22, 0.85)',
      bgType: 'animated',
      bgGradientStart: '#111827',
      bgGradientEnd: '#1f2937',

      setThemeMode: (mode) => {
        if (mode === 'dark') {
          set({
            themeMode: 'dark',
            bgColor: '#0f171c',
            primaryColor: '#00f0ff',
            textColor: '#f8fafc',
            borderColor: '#1e293b',
            textMutedColor: '#94a3b8',
            accentMutedColor: 'rgba(0, 240, 255, 0.1)',
            panelBgColor: 'rgba(15, 23, 42, 0.65)',
            inputBgColor: 'rgba(10, 15, 22, 0.85)',
            bgType: 'animated',
            bgGradientStart: '#111827',
            bgGradientEnd: '#1f2937',
            logicAccent: '#00f0ff',
            actionAccent: '#10B981',
            actionBtnColor: '#00f0ff',
            codeHighlightColor: '#10B981',
          });
        } else if (mode === 'light') {
          set({
            themeMode: 'light',
            bgColor: '#f8fafc',
            primaryColor: '#0f6cbd',
            textColor: '#0f172a',
            borderColor: '#e2e8f0',
            textMutedColor: '#475569',
            accentMutedColor: 'rgba(15, 108, 189, 0.1)',
            panelBgColor: 'rgba(255, 255, 255, 0.92)',
            inputBgColor: '#ffffff',
            bgType: 'solid',
            bgGradientStart: '#f1f5f9',
            bgGradientEnd: '#cbd5e1',
            logicAccent: '#0f6cbd',
            actionAccent: '#10B981',
            actionBtnColor: '#0f6cbd',
            codeHighlightColor: '#10B981',
          });
        } else {
          set({ themeMode: 'custom' });
        }
      },

      setThemeColors: (bg, primary, text, border) => 
        set({ 
          bgColor: bg, 
          primaryColor: primary, 
          textColor: text, 
          borderColor: border, 
          themeMode: 'custom',
          logicAccent: primary,
          actionBtnColor: primary,
        }),

      setThemeColorsAdvanced: (colors) => 
        set((state) => {
          const logicAccent = colors.primaryColor || state.logicAccent;
          const actionBtnColor = colors.primaryColor || state.actionBtnColor;
          return {
            ...colors,
            themeMode: 'custom',
            logicAccent,
            actionBtnColor,
          };
        }),

      // Geometry Initial State
      borderWidth: 1,          // 1px border
      borderRadius: 12,        // 12px border radius
      transitionSpeed: 300,    // 300ms transition speed
      setGeometry: (width, radius, speed) =>
        set({ borderWidth: width, borderRadius: radius, transitionSpeed: speed }),

      // Dashboard Customization Initial State
      dashboardOrder: ['scenarios', 'energy', 'atmosphere', 'rooms'],
      dashboardSizes: {
        scenarios: { cols: 3, rows: 2 },
        energy: { cols: 3, rows: 2 },
        atmosphere: { cols: 2, rows: 1 },
        rooms: { cols: 1, rows: 2 },
      },
      setDashboardOrder: (order) => set({ dashboardOrder: order }),
      setDashboardSizes: (sizes) => set({ dashboardSizes: sizes }),

      // Custom Scenarios Store List
      customScenarios: [],
      addCustomScenario: (entry) => set((state) => ({ customScenarios: [...state.customScenarios, entry] })),
      removeCustomScenario: (id) => set((state) => ({ customScenarios: state.customScenarios.filter((s) => s.id !== id) })),
      toggleCustomScenario: (id) => set((state) => ({
        customScenarios: state.customScenarios.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s)
      })),
      updateCustomScenario: (id, updated) => set((state) => ({
        customScenarios: state.customScenarios.map((s) => s.id === id ? { ...s, ...updated } : s)
      })),

      // Rooms Initial Info List
      rooms: [],
      selectedRoomId: null,
      setSelectedRoomId: (id) => set({ selectedRoomId: id }),
      addRoom: (name, desc) => {
        const id = 'room-' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          rooms: [...state.rooms, { id, name, description: desc, deviceIds: [], temperature: 22, humidity: 50 }]
        }));
      },
      removeRoom: (id) => set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) })),
      addDeviceToRoom: (roomId, deviceId) => set((state) => {
        const cleanRooms = state.rooms.map((r) => ({
          ...r,
          deviceIds: r.deviceIds.filter((id) => id !== deviceId),
        }));
        return {
          rooms: cleanRooms.map((r) => r.id === roomId ? { ...r, deviceIds: [...r.deviceIds, deviceId] } : r),
        };
      }),
      removeDeviceFromRoom: (roomId, deviceId) => set((state) => ({
        rooms: state.rooms.map((r) => r.id === roomId ? { ...r, deviceIds: r.deviceIds.filter((id) => id !== deviceId) } : r),
      })),

      // Sidebar Collapse helpers
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // System Initial State
      pollingInterval: 5,      // 5 seconds
      setPollingInterval: (interval) => set({ pollingInterval: interval }),

      // Scenario Builder Colors Accent Initial State
      logicAccent: '#00f0ff',
      actionAccent: '#10B981',
      actionBtnColor: '#00f0ff',
      codeHighlightColor: '#10B981',
      setLogicAccent: (val) => set({ logicAccent: val }),
      setActionAccent: (val) => set({ actionAccent: val }),
      setActionBtnColor: (val) => set({ actionBtnColor: val }),
      setCodeHighlightColor: (val) => set({ codeHighlightColor: val }),

      // Toasts System
      toasts: [],
      addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
        // Auto remove toast in 4 seconds
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 20000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'smashcore-settings-store-v3',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        pinCode: state.pinCode,
        isUnlocked: state.isUnlocked,
        serverUrl: state.serverUrl,
        apiKey: state.apiKey,
        themeMode: state.themeMode,
        bgColor: state.bgColor,
        primaryColor: state.primaryColor,
        textColor: state.textColor,
        borderColor: state.borderColor,
        textMutedColor: state.textMutedColor,
        accentMutedColor: state.accentMutedColor,
        panelBgColor: state.panelBgColor,
        inputBgColor: state.inputBgColor,
        bgType: state.bgType,
        bgGradientStart: state.bgGradientStart,
        bgGradientEnd: state.bgGradientEnd,
        borderWidth: state.borderWidth,
        borderRadius: state.borderRadius,
        transitionSpeed: state.transitionSpeed,
        pollingInterval: state.pollingInterval,
        dashboardOrder: state.dashboardOrder,
        dashboardSizes: state.dashboardSizes,
        customScenarios: state.customScenarios,
        rooms: state.rooms,
        logicAccent: state.logicAccent,
        actionAccent: state.actionAccent,
        actionBtnColor: state.actionBtnColor,
        codeHighlightColor: state.codeHighlightColor,
      }),
    }
  )
);

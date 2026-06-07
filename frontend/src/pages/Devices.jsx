import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import {
  Plus,
  Lightbulb,
  Fan,
  Camera,
  Coffee,
  MoreHorizontal
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_KEY = import.meta.env.VITE_API_KEY || "admin123";

// Helper to determine device category based on name/type
const getCategory = (deviceName) => {
  const lower = deviceName.toLowerCase();
  if (lower.includes('light') || lower.includes('lamp')) return 'LIGHTS';
  if (lower.includes('ac') || lower.includes('climate') || lower.includes('temp') || lower.includes('fan')) return 'CLIMATE';
  if (lower.includes('cam') || lower.includes('door') || lower.includes('porch')) return 'SECURITY';
  return 'ALL'; // other
};

// Helper for icons
const getIcon = (deviceName, size = 24, color = "#6b7280") => {
  const lower = deviceName.toLowerCase();
  if (lower.includes('light') || lower.includes('lamp')) return <Lightbulb size={size} color={color} />;
  if (lower.includes('ac') || lower.includes('fan')) return <Fan size={size} color={color} />;
  if (lower.includes('cam') || lower.includes('porch')) return <Camera size={size} color={color} />;
  if (lower.includes('coffee')) return <Coffee size={size} color={color} />;
  return <Lightbulb size={size} color={color} />;
};

export default function Devices() {
  const [filter, setFilter] = useState('ALL');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/web/devices`);
      // Map API response to our UI structure
      const mapped = res.data.map(d => {
        const isOnline = d.status.includes('online');
        const isOn = d.status.includes('on') || d.status.includes('recording');

        // Try to parse some sub-info if available, or make it up based on device name for the mock
        let infoLabel = "Status";
        let infoVal = "Normal";

        if (d.device.toLowerCase().includes('light')) { infoLabel = "Brightness"; infoVal = isOn ? "80%" : "--"; }
        else if (d.device.toLowerCase().includes('ac')) { infoLabel = "Target"; infoVal = isOn ? "22°C" : "--"; }
        else if (d.device.toLowerCase().includes('coffee')) { infoLabel = "Usage"; infoVal = isOn ? "1.2 kW" : "--"; }
        else if (d.device.toLowerCase().includes('porch')) { infoLabel = "Status"; infoVal = isOn ? "Recording" : "Standby"; }

        return {
          id: d.device,
          name: d.device.replace(/_/g, ' '),
          category: getCategory(d.device),
          isOn: isOn,
          isOnline: isOnline,
          infoLabel: infoLabel,
          infoVal: infoVal
        };
      });
      setDevices(mapped);
    } catch (error) {
      console.error("Failed to fetch devices, using mock data", error);
      // Fallback mock data
      setDevices([
        { id: 'dev_1', name: 'Living Room Light', category: 'LIGHTS', isOn: true, infoLabel: 'Brightness', infoVal: '80%' },
        { id: 'dev_2', name: 'Master AC', category: 'CLIMATE', isOn: false, infoLabel: 'Target', infoVal: '22°C' },
        { id: 'dev_3', name: 'Coffee Machine', category: 'ALL', isOn: true, infoLabel: 'Usage', infoVal: '1.2 kW' },
        { id: 'dev_4', name: 'Front Porch', category: 'SECURITY', isOn: true, infoLabel: 'Status', infoVal: 'Recording' },
        { id: 'dev_5', name: 'Bedroom Lamp', category: 'LIGHTS', isOn: false, infoLabel: 'Brightness', infoVal: '--' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const toggleDevice = async (id, currentOnState) => {
    // Optimistic UI update
    setDevices(prev => prev.map(d =>
      d.id === id ? { ...d, isOn: !currentOnState } : d
    ));

    try {
      const cmd = currentOnState ? 'off' : 'on'; // simplistic command mapping
      await axios.post(`${API_BASE}/api/web/command`, {
        device: id,
        command: `relay_${cmd}`
      }, {
        headers: { 'X-API-Key': API_KEY }
      });
    } catch (error) {
      console.error("Command failed", error);
      // Revert if failed
      setDevices(prev => prev.map(d =>
        d.id === id ? { ...d, isOn: currentOnState } : d
      ));
    }
  };

  const filteredDevices = filter === 'ALL'
    ? devices
    : devices.filter(d => d.category === filter);

  return (
    <Layout title="Devices" subtitle="Manage your home ecosystem">
      <div style={styles.headerRow}>
        <div style={styles.filters}>
          {['ALL', 'LIGHTS', 'CLIMATE', 'SECURITY'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === f ? '#161b33' : '#e0e7ff',
                color: filter === f ? '#ffffff' : '#4f46e5',
                fontWeight: filter === f ? '600' : '500',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button style={styles.addBtn}>
          <Plus size={16} style={{marginRight: '8px'}} />
          Add Device
        </button>
      </div>

      <div style={styles.deviceGrid}>
        {filteredDevices.map(device => (
          <div key={device.id} style={styles.deviceCard}>
            <div style={styles.cardTop}>
              <div style={{
                ...styles.iconWrapper,
                backgroundColor: device.isOn ? '#ecfdf5' : '#f3f4f6'
              }}>
                {getIcon(device.name, 20, device.isOn ? '#10b981' : '#9ca3af')}
              </div>

              <div
                style={{
                  ...styles.toggleBg,
                  backgroundColor: device.isOn ? '#161b33' : '#e5e7eb'
                }}
                onClick={() => toggleDevice(device.id, device.isOn)}
              >
                <div style={{
                  ...styles.toggleKnob,
                  transform: device.isOn ? 'translateX(18px)' : 'translateX(0)'
                }} />
              </div>
            </div>

            <div style={styles.cardMiddle}>
              <h4 style={styles.deviceName}>{device.name}</h4>
              <div style={styles.deviceInfoLabel}>{device.infoLabel}</div>
            </div>

            <div style={styles.cardBottom}>
              <span style={styles.deviceInfoVal}>{device.infoVal}</span>
              <span style={{
                ...styles.stateLabel,
                color: device.isOn ? '#161b33' : '#9ca3af'
              }}>
                {device.isOn ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  filters: {
    display: 'flex',
    gap: '10px',
  },
  filterBtn: {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addBtn: {
    backgroundColor: '#161b33',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    height: '200px',
    justifyContent: 'space-between',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBg: {
    width: '42px',
    height: '24px',
    borderRadius: '12px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
  cardMiddle: {
    marginTop: 'auto',
    marginBottom: '10px',
  },
  deviceName: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#161b33',
  },
  deviceInfoLabel: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  deviceInfoVal: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  stateLabel: {
    fontSize: '12px',
    fontWeight: '700',
  }
};
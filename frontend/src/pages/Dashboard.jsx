import React, { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import {
  Thermometer,
  Droplets,
  MapPin,
  Power,
  Plus,
  Play,
  Calendar,
  Clock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const MOCK_ENERGY_DATA = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 550 },
  { name: 'Thu', value: 450 },
  { name: 'Fri', value: 600 },
  { name: 'Sat', value: 380 },
  { name: 'Sun', value: 320 },
];

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // In a real app we'd fetch this from the user's profile
  const userName = "Alex";
  const homeMode = "Eco Mode";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <Layout title={`${getGreeting()}, ${userName}!`} subtitle={`Your home is currently set to ${homeMode}.`}>
      <div style={styles.grid}>

        {/* Left Column */}
        <div style={styles.leftCol}>

          {/* Atmosphere Widget */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Atmosphere</h3>
              <Thermometer size={18} color="#6b7280" />
            </div>

            <div style={styles.atmosphereGrid}>
              <div style={styles.atmosphereItem}>
                <span style={styles.atmosphereLabel}>Indoor</span>
                <div style={styles.atmosphereValue}>22<span style={styles.degree}>°C</span></div>
              </div>

              <div style={styles.atmosphereDivider} />

              <div style={styles.atmosphereItem}>
                <span style={styles.atmosphereLabel}>Outdoor</span>
                <div style={styles.atmosphereValue}>18<span style={styles.degree}>°C</span></div>
              </div>

              <div style={styles.atmosphereDivider} />

              <div style={styles.atmosphereItem}>
                <span style={styles.atmosphereLabel}>Humidity</span>
                <div style={styles.atmosphereValue}>45<span style={styles.degree}>%</span></div>
              </div>
            </div>
          </div>

          {/* Active Devices Widget */}
          <div style={{...styles.card, marginTop: '20px'}}>
             <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Active Devices</h3>
              <div style={styles.badge}>3 ON</div>
            </div>

            <div style={styles.devicesGrid}>

              <div style={styles.activeDeviceCard}>
                <div style={styles.deviceIconWrapper}>
                   <MapPin size={16} color="#10b981" />
                </div>
                <div style={styles.deviceInfo}>
                  <div style={styles.deviceName}>Living Room</div>
                  <div style={styles.deviceState}>Main Lights</div>
                </div>
              </div>

              <div style={styles.activeDeviceCard}>
                <div style={styles.deviceIconWrapper}>
                   <Thermometer size={16} color="#10b981" />
                </div>
                <div style={styles.deviceInfo}>
                  <div style={styles.deviceName}>Bedroom</div>
                  <div style={styles.deviceState}>Climate - 20°C</div>
                </div>
              </div>

              <div style={styles.activeDeviceCard}>
                <div style={styles.deviceIconWrapper}>
                   <Play size={16} color="#10b981" />
                </div>
                <div style={styles.deviceInfo}>
                  <div style={styles.deviceName}>Kitchen</div>
                  <div style={styles.deviceState}>Audio - Playing</div>
                </div>
              </div>

              <div style={styles.addDeviceCard}>
                <Plus size={20} color="#6b7280" style={{marginRight: '8px'}} />
                <span>Add Device</span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={styles.rightCol}>

          {/* Scenarios Widget */}
          <div>
            <h3 style={styles.sectionTitle}>Scenarios</h3>
            <div style={styles.scenarioList}>

              <div style={styles.scenarioCardActive}>
                <div style={styles.scenarioInfo}>
                  <Power size={18} color="#ffffff" style={{marginRight: '12px'}} />
                  <span style={{fontWeight: '600', color: '#ffffff'}}>Leave Home</span>
                </div>
                <span style={{fontSize: '12px', color: '#a5b4fc'}}>All Off</span>
              </div>

              <div style={styles.scenarioCard}>
                <div style={styles.scenarioInfo}>
                  <Calendar size={18} color="#6b7280" style={{marginRight: '12px'}} />
                  <span style={{fontWeight: '500', color: '#161b33'}}>Cinema Mode</span>
                </div>
              </div>

              <div style={styles.scenarioCard}>
                <div style={styles.scenarioInfo}>
                  <Clock size={18} color="#6b7280" style={{marginRight: '12px'}} />
                  <span style={{fontWeight: '500', color: '#161b33'}}>Arrive Home</span>
                </div>
              </div>

            </div>
          </div>

          {/* Energy Impact Widget */}
          <div style={{...styles.card, marginTop: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
             <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Energy Impact</h3>
              <Droplets size={18} color="#6b7280" />
            </div>

            <div style={{flex: 1, minHeight: '200px', marginTop: '20px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_ENERGY_DATA} margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#9ca3af', fontSize: 12}}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="value" fill="#dbeafe" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}

const styles = {
  grid: {
    display: "flex",
    gap: "30px",
    marginTop: "20px",
    alignItems: "stretch",
  },
  leftCol: {
    flex: "1.5",
    display: "flex",
    flexDirection: "column",
  },
  rightCol: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#161b33",
    margin: 0,
  },
  atmosphereGrid: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  atmosphereItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  atmosphereLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  atmosphereValue: {
    fontSize: "42px",
    fontWeight: "700",
    color: "#161b33",
    lineHeight: "1",
  },
  degree: {
    fontSize: "24px",
    fontWeight: "600",
  },
  atmosphereDivider: {
    width: "1px",
    height: "50px",
    backgroundColor: "#f3f4f6",
  },
  badge: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  devicesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  activeDeviceCard: {
    backgroundColor: "#ecfdf5",
    border: "1px solid #d1fae5",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  deviceIconWrapper: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  deviceInfo: {
    display: "flex",
    flexDirection: "column",
  },
  deviceName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#065f46",
  },
  deviceState: {
    fontSize: "12px",
    color: "#34d399",
    marginTop: "2px",
  },
  addDeviceCard: {
    border: "1px dashed #d1d5db",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    backgroundColor: "#fafafa",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  scenarioList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  scenarioCardActive: {
    backgroundColor: "#161b33",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(22, 27, 51, 0.2)",
  },
  scenarioCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  scenarioInfo: {
    display: "flex",
    alignItems: "center",
  }
};
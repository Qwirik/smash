import { useState } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { Settings } from './pages/Settings';
import { Rooms } from './pages/Rooms';
import { ScenariosBuilder } from './pages/ScenariosBuilder';

export default function App() {
  const [activePage, setActivePage] = useState<'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ThemeProvider>
      <Layout
        activePage={activePage}
        onChangePage={setActivePage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'rooms' && <Rooms />}
        {activePage === 'devices' && <Devices searchQuery={searchQuery} />}
        {activePage === 'scenarios' && <ScenariosBuilder />}
        {activePage === 'settings' && <Settings />}
      </Layout>
    </ThemeProvider>
  );
}

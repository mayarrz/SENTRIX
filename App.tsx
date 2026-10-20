import React, { lazy, Suspense, useState } from 'react';
import { DeceptionProvider } from './context/DeceptionContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToastContainer } from './components/layout/NotificationToast';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then(module => ({ default: module.OverviewPage })));
const AssetsPage = lazy(() => import('./pages/AssetsPage').then(module => ({ default: module.AssetsPage })));
const ThreatMonitoringPage = lazy(() => import('./pages/ThreatMonitoringPage').then(module => ({ default: module.ThreatMonitoringPage })));
const DecoyEnvironmentPage = lazy(() => import('./pages/DecoyEnvironmentPage').then(module => ({ default: module.DecoyEnvironmentPage })));
const RiskAnalysisPage = lazy(() => import('./pages/RiskAnalysisPage').then(module => ({ default: module.RiskAnalysisPage })));
const SimulationCenterPage = lazy(() => import('./pages/SimulationCenterPage').then(module => ({ default: module.SimulationCenterPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(module => ({ default: module.AlertsPage })));
const EventLogsPage = lazy(() => import('./pages/EventLogsPage').then(module => ({ default: module.EventLogsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

function AppContent() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Persistent SOC Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top SOC Bar */}
        <Header activePage={activePage} onNavigate={setActivePage} />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading SENTRIX view…</div>}>
              {activePage === 'overview' && <OverviewPage onNavigate={setActivePage} />}
              {activePage === 'assets' && <AssetsPage />}
              {activePage === 'threats' && <ThreatMonitoringPage />}
              {activePage === 'decoys' && <DecoyEnvironmentPage />}
              {activePage === 'risk' && <RiskAnalysisPage />}
              {activePage === 'simulation' && <SimulationCenterPage />}
              {activePage === 'alerts' && <AlertsPage />}
              {activePage === 'logs' && <EventLogsPage />}
              {activePage === 'analytics' && <AnalyticsPage />}
              {activePage === 'settings' && <SettingsPage />}
            </Suspense>
          </div>
        </main>
      </div>

      {/* SOC Live Notification Toasts */}
      <NotificationToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <DeceptionProvider>
      <AppContent />
    </DeceptionProvider>
  );
}

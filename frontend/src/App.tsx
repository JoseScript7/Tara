import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { DerivedStateProvider } from './context/DerivedStateContext';
import { VoiceJobsProvider } from './context/VoiceJobsContext';

// Pages
import { HomeDashboard } from './pages/HomeDashboard';
import { Support } from './pages/Support';
import { Insights } from './pages/Insights';
import { Transactions } from './pages/Transactions';
import { Disputes } from './pages/Disputes';
import { Settlements } from './pages/Settlements';
import { OffersLoans } from './pages/OffersLoans';
import { Reports } from './pages/Reports';
import { Devices } from './pages/Devices';
import { Room3D } from './pages/Room3D';
import { Settings } from './pages/Settings';
import { Security } from './pages/Security';
import { OntologyGraphPage } from './pages/OntologyGraphPage';

import { DesignStyleGuide } from './pages/DesignStyleGuide';
import { SoundboxDemo } from './pages/SoundboxDemo';
import { AdminFleet } from './pages/AdminFleet';
import { TaraChatFull } from './pages/TaraChatFull';
import { MobileAppView } from './pages/MobileAppView';
import { PaytmIntegrationGuide } from './pages/PaytmIntegrationGuide';
import { LiveProofOverlay } from './components/common/LiveProofOverlay';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('mode=onboarding')) return false;
      if (sessionStorage.getItem('tara_logged_out') === 'true') return false;
    }
    return true;
  });

  return (
    <>
      <Routes>
        <Route path="/design" element={<DesignStyleGuide />} />
        <Route path="/soundbox" element={<SoundboxDemo />} />
        <Route path="/admin/fleet" element={<AdminFleet />} />
        <Route path="/chat" element={<TaraChatFull />} />
        <Route path="/mobile" element={<MobileAppView />} />
        <Route path="/integration" element={<PaytmIntegrationGuide />} />
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <OnboardingFlow 
                onLogin={() => {
                  sessionStorage.removeItem('tara_logged_out');
                  setIsAuthenticated(true);
                }} 
              />
            ) : (
              <DerivedStateProvider>
                <VoiceJobsProvider>
                  <PageShell>
                    <Routes>
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/home" element={<HomeDashboard />} />
                      <Route path="/mobile" element={<MobileAppView />} />
                      <Route path="/soundbox" element={<SoundboxDemo />} />
                      <Route path="/integration" element={<PaytmIntegrationGuide />} />
                      <Route path="/chat" element={<TaraChatFull />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/disputes" element={<Disputes />} />
                      <Route path="/settlements" element={<Settlements />} />
                      <Route path="/offers" element={<OffersLoans />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/devices" element={<Devices />} />
                      <Route path="/fleet" element={<AdminFleet />} />
                      <Route path="/room" element={<Room3D />} />
                      <Route path="/ontology" element={<OntologyGraphPage />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/security" element={<Security />} />
                    </Routes>
                  </PageShell>
                </VoiceJobsProvider>
              </DerivedStateProvider>
            )
          }
        />
      </Routes>
      <LiveProofOverlay />
    </>
  );
}

export default App;

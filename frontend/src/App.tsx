import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Dashboard } from './pages/Dashboard';
import { Planer } from './pages/Planer'; // <--- IMPORT PLANERA

// Pomocniczy komponent do warunkowego renderowania Nav/Footer
function Layout({ children, onOpenAuth }: { children: React.ReactNode, onOpenAuth: any }) {
  const location = useLocation();
  // Ukrywamy globalny Nav i Footer dla Dashboardu i Planera
  const isAppView = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/planer');

  return (
    <>
      {!isAppView && <Navbar onOpenAuth={onOpenAuth} />}
      <main className="flex-1">{children}</main>
      {!isAppView && <Footer />}
    </>
  );
}

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');

  const openAuth = (mode: 'login' | 'register' | 'reset') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden flex flex-col">
        <Layout onOpenAuth={openAuth}>
          <Routes>
            <Route path="/" element={<Home onOpenAuth={openAuth} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planer/:id" element={<Planer />} /> {/* <--- NOWA TRASA */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>

        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          initialMode={authMode} 
          onSwitchMode={setAuthMode} 
        />
      </div>
    </BrowserRouter>
  );
}
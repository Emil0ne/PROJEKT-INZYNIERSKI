import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  // Dodaliśmy tryb 'reset' do typu
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');

  const openAuth = (mode: 'login' | 'register' | 'reset') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden flex flex-col">
        <Navbar onOpenAuth={openAuth} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home onOpenAuth={openAuth} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

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
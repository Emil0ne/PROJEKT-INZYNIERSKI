import { Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <motion.nav 
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/60 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <div onClick={scrollToTop} className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Globe2 className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
            TravelPlanner
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onOpenAuth('login')} className="text-base font-bold text-slate-500 hover:text-emerald-600 transition-colors hidden sm:block cursor-pointer">
            Zaloguj się
          </button>
          <button onClick={() => onOpenAuth('register')} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer">
            Załóż konto
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
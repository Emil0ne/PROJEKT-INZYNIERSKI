import { Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './ui';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <motion.nav
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 shadow-sm z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Globe2 className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
            TravelPlanner
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" pill onClick={() => onOpenAuth('login')} className="hidden sm:inline-flex">
            Zaloguj się
          </Button>
          <Button variant="primary" pill onClick={() => onOpenAuth('register')} className="px-8 py-3.5">
            Załóż konto
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

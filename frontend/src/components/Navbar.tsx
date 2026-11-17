import { Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <nav className="fixed w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 cursor-pointer">
          <div className="bg-zinc-900 p-1.5 rounded-lg text-white">
            <Globe2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">TravelPlanner</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => onOpenAuth('login')} className="hidden sm:inline-flex">
            Zaloguj się
          </Button>
          <Button variant="primary" onClick={() => onOpenAuth('register')}>
            Załóż konto
          </Button>
        </div>
      </div>
    </nav>
  );
}

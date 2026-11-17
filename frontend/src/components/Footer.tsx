import { Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-pointer group">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl transition-colors group-hover:bg-emerald-500/20">
              <Globe2 className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TravelPlanner</span>
          </Link>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-emerald-400 transition-colors cursor-pointer">O projekcie</a>
            <a href="#" className="hover:text-emerald-400 transition-colors cursor-pointer">Kontakt</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {currentYear} TravelPlanner. Projekt Inżynierski.</p>
          <p>Twórcy: Emil Latała, Karol Kos, Jakub Szczepaniak</p>
        </div>
      </div>
    </footer>
  );
}

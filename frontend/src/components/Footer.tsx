import { Globe2 } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 grayscale opacity-80 cursor-pointer" onClick={scrollToTop}>
            <Globe2 className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight text-white">TravelPlanner</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-emerald-400 transition-colors">O projekcie</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Kontakt</a>
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
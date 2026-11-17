import { Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-stone-200 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 cursor-pointer">
            <div className="bg-zinc-900 p-1.5 rounded-lg text-white">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-900">TravelPlanner</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-stone-600">
            <a href="#" className="hover:text-zinc-900 transition-colors cursor-pointer">O projekcie</a>
            <a href="#" className="hover:text-zinc-900 transition-colors cursor-pointer">Kontakt</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>&copy; {currentYear} TravelPlanner. Projekt Inżynierski.</p>
          <p>Twórcy: Emil Latała, Karol Kos, Jakub Szczepaniak</p>
        </div>
      </div>
    </footer>
  );
}

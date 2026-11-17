import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, LogOut } from 'lucide-react';
import { Button, cx } from './ui';
import { LAYER } from '../lib/layers';

interface AppHeaderProps {
  /** Gdy podane – pokazuje strzałkę powrotu i tytuł zamiast logo. */
  backTo?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** 'page' – sticky, wyśrodkowany kontener (Dashboard); 'workspace' – pełna szerokość (Planer). */
  layout?: 'page' | 'workspace';
  userName?: string;
}

/** Wspólny górny pasek zalogowanego użytkownika. */
export function AppHeader({ backTo, title, subtitle, layout = 'page', userName = 'Emil' }: AppHeaderProps) {
  const navigate = useNavigate();
  const isPage = layout === 'page';

  return (
    <header
      className={cx(
        'bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-sm shrink-0',
        isPage ? `sticky top-0 ${LAYER.header}` : `relative ${LAYER.panel}`,
      )}
    >
      <div className={cx(
        'flex items-center justify-between px-4',
        isPage ? 'max-w-7xl mx-auto sm:px-6 lg:px-8 h-20' : 'h-16',
      )}>
        <div className="flex items-center gap-4 min-w-0">
          {backTo && (
            <Link to={backTo} aria-label="Wróć do listy podróży" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-emerald-600 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          {title ? (
            <div className="min-w-0">
              <h1 className="font-black text-lg text-slate-900 leading-tight truncate max-w-md">{title}</h1>
              {subtitle && <div className="flex items-center gap-2 text-xs font-bold text-slate-500">{subtitle}</div>}
            </div>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-md shadow-emerald-200 transition-transform group-hover:scale-105">
                <Globe2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">TravelPlanner</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-2 border-r border-slate-200 pr-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">{userName.charAt(0)}</div>
            <span className="text-sm font-medium text-slate-700">Cześć, {userName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="font-medium text-slate-500 hover:text-red-500 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Wyloguj</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

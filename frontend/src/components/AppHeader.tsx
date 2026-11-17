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
  /** Dodatkowe akcje wyświetlane po lewej od profilu użytkownika. */
  actions?: ReactNode;
}

/** Wspólny górny pasek zalogowanego użytkownika. */
export function AppHeader({ backTo, title, subtitle, layout = 'page', userName = 'Emil', actions }: AppHeaderProps) {
  const navigate = useNavigate();
  const isPage = layout === 'page';

  return (
    <header
      className={cx(
        'bg-white border-b border-stone-200 shrink-0',
        isPage ? `sticky top-0 ${LAYER.header}` : `relative ${LAYER.panel}`,
      )}
    >
      <div className={cx(
        'flex items-center justify-between px-4 h-14',
        isPage && 'max-w-7xl mx-auto sm:px-6 lg:px-8',
      )}>
        <div className="flex items-center gap-3 min-w-0">
          {backTo && (
            <Link to={backTo} aria-label="Wróć do listy podróży" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-zinc-900 cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          {title ? (
            <div className="min-w-0">
              <h1 className="font-semibold tracking-tight text-base text-zinc-900 leading-tight truncate max-w-md">{title}</h1>
              {subtitle && <div className="flex items-center gap-2 text-xs text-stone-500">{subtitle}</div>}
            </div>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
              <div className="bg-zinc-900 p-1.5 rounded-lg text-white">
                <Globe2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-zinc-900">TravelPlanner</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <div className="hidden sm:flex items-center gap-2.5 mr-1 border-r border-stone-200 pr-4">
            <div className="w-8 h-8 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center text-zinc-700 text-sm font-semibold">{userName.charAt(0)}</div>
            <span className="text-sm text-stone-600">Cześć, {userName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Wyloguj</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

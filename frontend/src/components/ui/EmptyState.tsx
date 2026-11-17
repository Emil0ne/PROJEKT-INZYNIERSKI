import type { ReactNode } from 'react';
import { cx } from './cx';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Np. <Button>…</Button>. */
  action?: ReactNode;
  /** Mniejsza wersja do list wewnątrz kart. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div className={cx(
      'bg-white/70 backdrop-blur border border-dashed border-slate-300/80 text-center',
      compact ? 'rounded-2xl p-4' : 'rounded-[2rem] p-10',
      className,
    )}>
      {icon && (
        <div className="inline-flex bg-slate-50 p-3 rounded-full mb-3 text-slate-400 [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      )}
      <h3 className={cx('font-bold text-slate-700', compact ? 'text-sm' : 'text-base text-slate-900 mb-1')}>{title}</h3>
      {description && <p className={cx('text-slate-500', compact ? 'text-xs mt-1' : 'text-sm')}>{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

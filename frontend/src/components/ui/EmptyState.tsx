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
      'bg-white border border-dashed border-stone-300 text-center',
      compact ? 'rounded-lg p-4' : 'rounded-xl p-10',
      className,
    )}>
      {icon && (
        <div className="inline-flex bg-stone-100 p-2.5 rounded-lg mb-3 text-stone-400 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
      )}
      <h3 className={cx('font-semibold tracking-tight', compact ? 'text-sm text-zinc-800' : 'text-base text-zinc-900 mb-1')}>{title}</h3>
      {description && <p className={cx('text-stone-600', compact ? 'text-xs mt-1' : 'text-sm')}>{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

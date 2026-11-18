import type { ReactNode } from 'react';
import { cx } from './cx';

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Mały napis nad tytułem. */
  eyebrow?: string;
  /** Ikona przed tytułem. */
  icon?: ReactNode;
  /** Element po prawej (np. przycisk akcji). */
  action?: ReactNode;
  align?: 'left' | 'center';
  /** sm – nagłówki paneli/kart, md – sekcje, lg – nagłówki wiodące. */
  size?: 'sm' | 'md' | 'lg';
  /** Linia pod nagłówkiem. */
  bordered?: boolean;
  className?: string;
}

const TITLE = {
  sm: 'text-lg font-semibold mb-0',
  md: 'text-2xl font-semibold mb-3',
  lg: 'text-3xl lg:text-4xl font-semibold mb-4',
} as const;
const DESC = { sm: 'text-sm mt-1', md: 'text-base', lg: 'text-lg' } as const;

export function SectionHeader({
  title, description, eyebrow, icon, action, align = 'center', size = 'md', bordered = false, className,
}: SectionHeaderProps) {
  const text = (
    <div className={cx(align === 'center' && !action ? 'text-center mx-auto max-w-3xl' : 'text-left')}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">{eyebrow}</p>}
      <h2 className={cx('text-zinc-900 tracking-tight flex items-center gap-2.5', align === 'center' && !action && 'justify-center', TITLE[size])}>
        {icon && <span className="text-emerald-600 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>}
        {title}
      </h2>
      {description && <p className={cx('text-stone-600', DESC[size])}>{description}</p>}
    </div>
  );

  if (!action && !bordered) return <div className={className}>{text}</div>;
  return (
    <div className={cx('flex items-end justify-between gap-4', bordered && 'border-b border-stone-200 pb-4', className)}>
      {text}
      {action}
    </div>
  );
}

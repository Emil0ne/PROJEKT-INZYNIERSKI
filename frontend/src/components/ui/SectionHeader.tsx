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

const TITLE = { sm: 'text-2xl font-black mb-0', md: 'text-3xl font-extrabold mb-4', lg: 'text-4xl lg:text-5xl font-extrabold mb-6' } as const;
const DESC = { sm: 'text-sm mt-1', md: 'text-lg', lg: 'text-xl' } as const;

export function SectionHeader({
  title, description, eyebrow, icon, action, align = 'center', size = 'md', bordered = false, className,
}: SectionHeaderProps) {
  const text = (
    <div className={cx(align === 'center' && !action ? 'text-center mx-auto max-w-3xl' : 'text-left')}>
      {eyebrow && <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">{eyebrow}</p>}
      <h2 className={cx('text-slate-900 flex items-center gap-3', align === 'center' && !action && 'justify-center', TITLE[size])}>
        {icon && <span className="text-emerald-500 [&>svg]:w-6 [&>svg]:h-6">{icon}</span>}
        {title}
      </h2>
      {description && <p className={cx('text-slate-500', DESC[size])}>{description}</p>}
    </div>
  );

  if (!action && !bordered) return <div className={className}>{text}</div>;
  return (
    <div className={cx('flex items-end justify-between gap-4', bordered && 'border-b border-slate-200/80 pb-4', className)}>
      {text}
      {action}
    </div>
  );
}

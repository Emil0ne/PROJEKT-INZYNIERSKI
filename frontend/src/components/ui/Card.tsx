import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Efekt szkła (półprzezroczyste tło + blur). */
  glass?: boolean;
  /** Podniesienie i cień po najechaniu. */
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Zaokrąglenie: md = 1.5rem, lg = 2rem (domyślne), xl = 2.5rem. */
  radius?: 'md' | 'lg' | 'xl';
}

const PADDING = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' } as const;
const RADIUS = { md: 'rounded-3xl', lg: 'rounded-[2rem]', xl: 'rounded-[2.5rem]' } as const;

export function Card({ glass = false, hoverable = false, padding = 'md', radius = 'lg', className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'border border-slate-200/80 shadow-sm',
        RADIUS[radius],
        glass ? 'bg-white/70 backdrop-blur-lg' : 'bg-white',
        hoverable && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-200',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}

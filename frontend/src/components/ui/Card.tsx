import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Zachowane dla zgodności – karty są teraz zawsze pełną bielą. */
  glass?: boolean;
  /** Delikatne podniesienie obramowania po najechaniu. */
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Zaokrąglenie: md = rounded-lg, lg = rounded-xl (domyślne), xl = rounded-2xl. */
  radius?: 'md' | 'lg' | 'xl';
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;
const RADIUS = { md: 'rounded-lg', lg: 'rounded-xl', xl: 'rounded-2xl' } as const;

export function Card({ glass, hoverable = false, padding = 'md', radius = 'lg', className, ...rest }: CardProps) {
  void glass; // prop zachowany dla zgodności – karty są zawsze pełną bielą
  return (
    <div
      className={cx(
        'bg-white border border-stone-200 shadow-xs',
        RADIUS[radius],
        hoverable && 'transition-all duration-200 hover:shadow-sm hover:border-stone-300',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}

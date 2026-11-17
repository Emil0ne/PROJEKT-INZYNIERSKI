import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Wymagana etykieta dostępności (aria-label + podpowiedź). */
  label: string;
  variant?: 'neutral' | 'danger' | 'overlay';
  /** Okrągły zamiast rounded-lg. */
  round?: boolean;
}

const VARIANTS = {
  neutral: 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
  danger: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
  overlay: 'text-white bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md',
} as const;

/** Mały przycisk z samą ikoną – zawsze z aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'neutral', round = false, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'p-1.5 transition-colors cursor-pointer shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        round ? 'rounded-full' : 'rounded-lg',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});

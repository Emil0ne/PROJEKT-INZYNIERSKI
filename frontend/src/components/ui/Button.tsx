import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Zaokrąglenie „pigułka” zamiast rounded-xl. */
  pill?: boolean;
  fullWidth?: boolean;
  /** Pokazuje spinner zamiast treści i blokuje przycisk. */
  isLoading?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5',
  secondary:
    'bg-white/80 backdrop-blur border border-slate-200/80 text-slate-700 shadow-sm hover:bg-white hover:border-emerald-300 hover:text-emerald-700',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600',
  danger: 'bg-red-500 text-white shadow-md shadow-red-100 hover:bg-red-600 hover:-translate-y-0.5',
  light: 'bg-white text-emerald-700 shadow-lg hover:bg-slate-50 hover:shadow-xl hover:scale-105',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', pill = false, fullWidth = false, isLoading = false, className, disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100',
        VARIANTS[variant],
        SIZES[size],
        pill ? 'rounded-full' : 'rounded-xl',
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
});

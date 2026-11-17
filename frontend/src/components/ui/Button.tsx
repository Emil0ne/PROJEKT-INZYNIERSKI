import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Zaokrąglenie „pigułka” zamiast rounded-lg. */
  pill?: boolean;
  fullWidth?: boolean;
  /** Pokazuje spinner zamiast treści i blokuje przycisk. */
  isLoading?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-900 text-white shadow-xs hover:bg-zinc-800',
  secondary: 'bg-white border border-stone-300 text-zinc-800 shadow-xs hover:bg-stone-50 hover:border-stone-400',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-zinc-900',
  danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
  light: 'bg-white text-zinc-900 shadow-xs hover:bg-stone-100',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
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
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        pill ? 'rounded-full' : 'rounded-lg',
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
});

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx } from './cx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etykieta nad polem. */
  label?: string;
  /** Ikona po lewej stronie pola. */
  icon?: ReactNode;
  /** Element po prawej stronie (np. przycisk pokaż/ukryj hasło). */
  rightSlot?: ReactNode;
  /** Wizualny stan walidacji. */
  state?: 'default' | 'success' | 'error';
}

const STATES: Record<NonNullable<InputProps['state']>, string> = {
  default: 'border-stone-300 focus:ring-zinc-900/10 focus:border-zinc-900',
  success: 'border-emerald-600 focus:ring-emerald-600/15',
  error: 'border-red-400 focus:ring-red-400/15',
};

const FIELD =
  'w-full py-2.5 bg-white border rounded-lg text-zinc-900 text-sm placeholder:text-stone-400 ' +
  'hover:border-stone-400 focus:outline-none focus:ring-4 transition-colors';

const Label = ({ children }: { children: ReactNode }) => (
  <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{children}</span>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, rightSlot, state = 'default', className, ...rest },
  ref,
) {
  const field = (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cx(FIELD, icon ? 'pl-10' : 'pl-3.5', rightSlot ? 'pr-12' : 'pr-3.5', STATES[state], className)}
        {...rest}
      />
      {rightSlot && <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">{rightSlot}</div>}
    </div>
  );
  if (!label) return field;
  return (
    <label className="block">
      <Label>{label}</Label>
      {field}
    </label>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/** Natywny <select> w stylu Input. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, children, ...rest },
  ref,
) {
  const field = (
    <select ref={ref} className={cx(FIELD, 'px-3.5 cursor-pointer', STATES.default, className)} {...rest}>
      {children}
    </select>
  );
  if (!label) return field;
  return (
    <label className="block">
      <Label>{label}</Label>
      {field}
    </label>
  );
});

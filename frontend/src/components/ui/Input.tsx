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
  default: 'border-slate-200/80 focus:ring-emerald-500/20 focus:border-emerald-500',
  success: 'border-emerald-500 focus:ring-emerald-500/20',
  error: 'border-red-400 focus:ring-red-400/20',
};

const FIELD =
  'w-full py-3 bg-slate-50/80 border rounded-xl text-slate-900 text-sm placeholder:text-slate-400 ' +
  'hover:border-slate-300 focus:outline-none focus:ring-2 focus:bg-white transition-all';

const Label = ({ children }: { children: ReactNode }) => (
  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">{children}</span>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, rightSlot, state = 'default', className, ...rest },
  ref,
) {
  const field = (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cx(FIELD, icon ? 'pl-11' : 'pl-4', rightSlot ? 'pr-12' : 'pr-4', STATES[state], className)}
        {...rest}
      />
      {rightSlot && <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{rightSlot}</div>}
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
    <select ref={ref} className={cx(FIELD, 'px-4 cursor-pointer', STATES.default, className)} {...rest}>
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

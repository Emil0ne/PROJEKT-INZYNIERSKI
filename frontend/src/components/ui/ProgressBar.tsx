/** Pasek postępu 0–100; robi się czerwony powyżej 90%. */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full transition-all duration-500 ${value > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}
